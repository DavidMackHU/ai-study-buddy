import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const userId = req.userId!

  const [user, blocks, cards] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { streak: true, xp: true } }),
    prisma.studyBlock.findMany({ where: { userId, completed: true }, select: { startTime: true, endTime: true } }),
    prisma.card.findMany({
      where: { deck: { userId } },
      select: { reviewCount: true },
    }),
  ])

  const studyMinutes = blocks.reduce((sum, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number)
    const [eh, em] = b.endTime.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return sum + (diff > 0 ? diff : 0)
  }, 0)

  const cardsReviewed = cards.reduce((sum, c) => sum + c.reviewCount, 0)

  res.json({
    streak: user?.streak ?? 0,
    xp: user?.xp ?? 0,
    studyHours: Math.round((studyMinutes / 60) * 10) / 10,
    cardsReviewed,
    totalCards: cards.length,
    completedBlocks: blocks.length,
  })
})

export default router
