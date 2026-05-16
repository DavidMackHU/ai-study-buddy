import { Router, Request } from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
import mammoth from 'mammoth'

const router = Router()
router.use(authenticate)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: ws } }
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer)
    return data.text
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  return buffer.toString('utf-8')
}

router.get('/', async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.userId! },
    include: { subject: { select: { name: true, color: true, icon: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(documents)
})

router.post('/upload', upload.single('file'), async (req: Request, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No file provided' })
    return
  }

  const { subjectId } = req.body
  const storagePath = `${req.userId}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file.buffer, { contentType: file.mimetype })

  if (uploadError) {
    res.status(500).json({ error: 'Storage upload failed: ' + uploadError.message })
    return
  }

  let extractedText: string | null = null
  try {
    extractedText = await extractText(file.buffer, file.mimetype)
  } catch {
    // text extraction is best-effort; document still saved
  }

  const document = await prisma.document.create({
    data: {
      userId: req.userId!,
      subjectId: subjectId || null,
      filename: file.originalname,
      filepath: storagePath,
      extractedText,
    },
  })

  res.status(201).json(document)
})

router.delete('/:id', async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  await supabase.storage.from('documents').remove([doc.filepath])
  await prisma.document.delete({ where: { id: doc.id } })
  res.status(204).send()
})

router.post('/:id/flashcards', async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  if (!doc.extractedText) {
    res.status(400).json({ error: 'No text content for this document' })
    return
  }

  const { deckId, deckName, count = 10 } = req.body
  const n = Math.min(Math.max(Number(count) || 10, 1), 30)

  let targetDeckId: string
  if (deckId) {
    const existing = await prisma.deck.findFirst({ where: { id: deckId, userId: req.userId! } })
    if (!existing) {
      res.status(404).json({ error: 'Deck not found' })
      return
    }
    targetDeckId = existing.id
  } else if (deckName?.trim()) {
    const created = await prisma.deck.create({
      data: { userId: req.userId!, name: deckName.trim(), subjectId: doc.subjectId || null },
    })
    targetDeckId = created.id
  } else {
    res.status(400).json({ error: 'deckId or deckName required' })
    return
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = `Generate ${n} flashcards in JSON format from the following document content.
Each flashcard must have a "front" (question or term) and "back" (answer or definition).
Focus on key concepts, definitions, and important facts.
Return ONLY valid JSON — no markdown, no extra text.
Format: [{"front": "...", "back": "..."}]

Document:
${doc.extractedText.slice(0, 30000)}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const flashcards: { front: string; back: string }[] = JSON.parse(raw)
    const cards = await prisma.$transaction(
      flashcards.map(c => prisma.card.create({ data: { deckId: targetDeckId, front: c.front, back: c.back } }))
    )
    res.json({ deckId: targetDeckId, cards })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    res.status(500).json({ error: message })
  }
})

router.post('/:id/summarize', async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  if (!doc.extractedText) {
    res.status(400).json({ error: 'No text content available for this document' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Summarize the following document for a college student.
Extract the 5-10 most important concepts, key terms, and main arguments.
Format as a structured outline with bullet points.

Document:
${doc.extractedText.slice(0, 30000)}`

    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI error'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

export default router
