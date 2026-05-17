import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  })

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  const { password: _pw, ...safeUser } = user
  res.status(201).json({ token, user: safeUser })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  const { password: _pw, ...safeUser } = user
  res.json({ token, user: safeUser })
})

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const { password: _pw, ...safeUser } = user
  res.json({ user: safeUser })
})

router.patch('/onboard', authenticate, async (req, res) => {
  const { weeklyStudyGoal } = req.body
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      isOnboarded: true,
      ...(typeof weeklyStudyGoal === 'number' ? { weeklyStudyGoal } : {}),
    },
  })
  const { password: _pw, ...safeUser } = user
  res.json({ user: safeUser })
})

export default router
