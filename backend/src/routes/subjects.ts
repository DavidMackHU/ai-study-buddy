import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId! },
    orderBy: { name: 'asc' },
  })
  res.json(subjects)
})

router.post('/', async (req, res) => {
  const { name, color, icon } = req.body
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name is required' })
    return
  }
  const subject = await prisma.subject.create({
    data: {
      userId: req.userId!,
      name: name.trim(),
      color: color ?? '#6366f1',
      icon: icon ?? '📚',
    },
  })
  res.status(201).json(subject)
})

router.patch('/:id', async (req, res) => {
  const existing = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }
  const { name, color, icon } = req.body
  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(color ? { color } : {}),
      ...(icon ? { icon } : {}),
    },
  })
  res.json(subject)
})

router.delete('/:id', async (req, res) => {
  const existing = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) {
    res.status(404).json({ error: 'Subject not found' })
    return
  }
  await prisma.subject.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
