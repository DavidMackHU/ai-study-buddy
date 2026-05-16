import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const { from, to } = req.query
  const blocks = await prisma.studyBlock.findMany({
    where: {
      userId: req.userId!,
      ...(from && to
        ? { date: { gte: new Date(from as string), lte: new Date(to as string) } }
        : {}),
    },
    include: { subject: { select: { name: true, color: true, icon: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
  res.json(blocks)
})

router.post('/', async (req, res) => {
  const { subjectId, date, startTime, endTime } = req.body
  if (!date || !startTime || !endTime) {
    res.status(400).json({ error: 'date, startTime, and endTime are required' })
    return
  }
  const block = await prisma.studyBlock.create({
    data: {
      userId: req.userId!,
      subjectId: subjectId || null,
      date: new Date(date),
      startTime,
      endTime,
    },
    include: { subject: { select: { name: true, color: true, icon: true } } },
  })
  res.status(201).json(block)
})

router.patch('/:id', async (req, res) => {
  const block = await prisma.studyBlock.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!block) {
    res.status(404).json({ error: 'Block not found' })
    return
  }
  const updated = await prisma.studyBlock.update({
    where: { id: block.id },
    data: { completed: !block.completed },
    include: { subject: { select: { name: true, color: true, icon: true } } },
  })
  if (!block.completed) {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { xp: { increment: 20 } },
    })
  }
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const block = await prisma.studyBlock.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!block) {
    res.status(404).json({ error: 'Block not found' })
    return
  }
  await prisma.studyBlock.delete({ where: { id: block.id } })
  res.status(204).send()
})

export default router
