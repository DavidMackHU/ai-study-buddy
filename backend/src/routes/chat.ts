import { Router } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function buildSystemPrompt(subjectName: string, mode: string): string {
  const base = `You are an expert college tutor helping a student study ${subjectName}.
Your role is to explain concepts clearly, ask guiding questions, and help the student think through problems — not just give answers.
Adapt your explanation depth based on the student's responses.
Keep responses concise unless the student asks for more detail.`

  if (mode === 'beginner') {
    return base + '\nUse simple language and explain all concepts from the ground up, assuming no prior knowledge.'
  }
  if (mode === 'challenge') {
    return base + '\nPush the student with harder questions. Ask them to reason through complex problems and justify their answers.'
  }
  return base
}

router.get('/:subjectId', async (req, res) => {
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.subjectId, userId: req.userId! },
  })
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }
  const messages = await prisma.chatMessage.findMany({
    where: { subjectId: req.params.subjectId },
    orderBy: { createdAt: 'asc' },
  })
  res.json(messages)
})

router.delete('/:subjectId', async (req, res) => {
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.subjectId, userId: req.userId! },
  })
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }
  await prisma.chatMessage.deleteMany({ where: { subjectId: req.params.subjectId } })
  res.status(204).send()
})

router.post('/', async (req, res) => {
  const { subjectId, content, mode = 'normal' } = req.body
  if (!subjectId || !content?.trim()) {
    res.status(400).json({ error: 'subjectId and content are required' })
    return
  }

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: req.userId! },
  })
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }

  await prisma.chatMessage.create({
    data: { subjectId, role: 'user', content: content.trim() },
  })

  const history = await prisma.chatMessage.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'asc' },
    take: 40,
  })

  // Gemini uses 'model' for assistant role; exclude the last message (current user msg)
  const chatHistory = history.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let fullContent = ''

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(subject.name, mode),
    })

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { maxOutputTokens: 1024 },
    })

    const result = await chat.sendMessageStream(content.trim())

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        fullContent += text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    await Promise.all([
      prisma.chatMessage.create({
        data: { subjectId, role: 'assistant', content: fullContent },
      }),
      prisma.user.update({
        where: { id: req.userId! },
        data: { xp: { increment: 2 } },
      }),
    ])

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI error'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

export default router
