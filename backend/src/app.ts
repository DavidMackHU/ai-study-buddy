import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import subjectsRouter from './routes/subjects'
import chatRouter from './routes/chat'
import documentsRouter from './routes/documents'
import decksRouter from './routes/decks'
import scheduleRouter from './routes/schedule'
import statsRouter from './routes/stats'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/decks', decksRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/stats', statsRouter)

export default app
