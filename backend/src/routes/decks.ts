import { Router } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { computeSM2 } from '../lib/sm2'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function parseCards(raw: string): { front: string; back: string }[] {
  const clean = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean)
}

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const decks = await prisma.deck.findMany({
    where: { userId: req.userId! },
    include: {
      subject: { select: { name: true, color: true, icon: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(decks)
})

router.post('/', async (req, res) => {
  const { name, subjectId } = req.body
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const deck = await prisma.deck.create({
    data: {
      userId: req.userId!,
      name: name.trim(),
      subjectId: subjectId || null,
    },
    include: {
      subject: { select: { name: true, color: true, icon: true } },
      _count: { select: { cards: true } },
    },
  })
  res.status(201).json(deck)
})

router.delete('/:id', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  await prisma.deck.delete({ where: { id: deck.id } })
  res.status(204).send()
})

router.get('/:id/cards', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  const cards = await prisma.card.findMany({
    where: { deckId: deck.id },
    orderBy: { id: 'asc' },
  })
  res.json({ deck, cards })
})

router.post('/:id/cards', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  const { front, back } = req.body
  if (!front?.trim() || !back?.trim()) {
    res.status(400).json({ error: 'front and back are required' })
    return
  }
  const card = await prisma.card.create({
    data: { deckId: deck.id, front: front.trim(), back: back.trim() },
  })
  res.status(201).json(card)
})

router.patch('/:id/cards/:cardId', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  const { front, back } = req.body
  const card = await prisma.card.updateMany({
    where: { id: req.params.cardId, deckId: deck.id },
    data: {
      ...(front?.trim() ? { front: front.trim() } : {}),
      ...(back?.trim() ? { back: back.trim() } : {}),
    },
  })
  if (card.count === 0) {
    res.status(404).json({ error: 'Card not found' })
    return
  }
  res.json({ success: true })
})

router.post('/:id/generate', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }

  const { topic, count = 10 } = req.body
  if (!topic?.trim()) {
    res.status(400).json({ error: 'topic is required' })
    return
  }

  const n = Math.min(Math.max(Number(count) || 10, 1), 30)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = `Generate ${n} flashcards in JSON format for the following topic.
Each flashcard must have a "front" (question or term) and "back" (answer or definition).
Focus on key concepts, definitions, and important facts.
Return ONLY valid JSON — no markdown, no extra text.
Format: [{"front": "...", "back": "..."}]

Topic: ${topic.trim()}`

  try {
    const result = await model.generateContent(prompt)
    const cards = parseCards(result.response.text())
    const created = await prisma.$transaction(
      cards.map(c => prisma.card.create({ data: { deckId: deck.id, front: c.front, back: c.back } }))
    )
    res.json(created)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    res.status(500).json({ error: message })
  }
})

router.delete('/:id/cards/:cardId', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  await prisma.card.deleteMany({
    where: { id: req.params.cardId, deckId: deck.id },
  })
  res.status(204).send()
})

router.get('/:id/due', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }
  const cards = await prisma.card.findMany({
    where: { deckId: deck.id, dueDate: { lte: new Date() } },
    orderBy: { dueDate: 'asc' },
  })
  res.json(cards)
})

router.post('/:id/review', async (req, res) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' })
    return
  }

  const { cardId, rating } = req.body
  if (cardId === undefined || rating === undefined) {
    res.status(400).json({ error: 'cardId and rating are required' })
    return
  }

  const r = Math.min(Math.max(Number(rating), 0), 5)
  const card = await prisma.card.findFirst({ where: { id: cardId, deckId: deck.id } })
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  const { interval: newInterval, easeFactor } = computeSM2(
    card.interval, card.easeFactor, card.reviewCount, r
  )
  const dueDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)

  const updated = await prisma.card.update({
    where: { id: card.id },
    data: { interval: newInterval, easeFactor, dueDate, reviewCount: card.reviewCount + 1 },
  })

  res.json(updated)
})

export default router
