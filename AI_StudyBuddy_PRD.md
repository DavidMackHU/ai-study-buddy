# Product Requirements Document: AI Study Buddy

## Overview
AI Study Buddy is a web application for college students that combines an AI tutor, flashcard system, document upload, and study scheduling into a single interface. Built with React (frontend) and Node.js (backend), powered by the Anthropic Claude API.

---

## Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Database:** SQLite (local dev) → PostgreSQL (production)
- **ORM:** Prisma (type-safe database queries)
- **File Storage:** AWS S3 (production)
- **Auth:** JWT-based authentication
- **Containerization:** Docker + Docker Compose
- **Deployment:** Vercel (frontend) + Railway (backend)
- **Testing:** Jest (unit) + Playwright (end-to-end)
- **CI/CD:** GitHub Actions (auto-test and deploy on push)
- **Styling:** Tailwind CSS

---

## Core Features

### 1. AI Chat Tutor
- Persistent chat interface with Claude
- Subject-aware context: user selects a subject/course before chatting
- Claude responds as a tutor — explains concepts, doesn't just give answers
- Chat history saved per session and per subject
- "Explain like I'm a beginner" and "Challenge me" mode toggles
- Code highlighting support for STEM subjects

### 2. Flashcards & Quizzing
- Manual flashcard creation (front/back)
- AI-generated flashcards from uploaded notes or typed topic
- Deck organization by course/subject
- Quiz modes: multiple choice, free response, true/false
- Spaced repetition algorithm (SM-2) to prioritize weak cards
- Performance tracking per deck (accuracy %, streak)

### 3. Document & Notes Upload
- Upload PDF, DOCX, or TXT files
- Claude reads and indexes the document
- Auto-generate flashcards from uploaded document
- Ask questions about the document in the chat tutor
- Summarize document into key points
- Highlight and annotate sections (stretch goal)

### 4. Study Scheduling & Tracking
- Weekly study planner: assign subjects to time blocks
- Daily study goals (e.g. "Review 20 flashcards", "Read Chapter 3")
- Streak tracking and XP/points system for motivation
- Dashboard: weekly study hours, cards reviewed, quiz scores
- Reminders (browser notifications)

---

## User Flow

1. **Onboarding:** User signs up → adds their courses → sets weekly study goal
2. **Dashboard:** Overview of today's tasks, streak, upcoming sessions
3. **Study Session:** Pick a subject → choose mode (chat, flashcards, quiz, or upload)
4. **Chat Tutor:** Ask questions, get explanations, reference uploaded docs
5. **Flashcard Review:** Spaced repetition queue surfaces due cards
6. **Quiz:** Test on a deck or a topic, get instant feedback
7. **Schedule:** Plan the week, mark sessions complete

---

## Pages & Components

### Pages
- `/` — Landing/login
- `/dashboard` — Home after login
- `/chat/:subjectId` — AI tutor chat
- `/flashcards` — Deck library
- `/flashcards/:deckId` — Review/quiz a deck
- `/upload` — Document upload and management
- `/schedule` — Weekly planner
- `/settings` — Account, preferences

### Key Components
- `ChatWindow` — Message thread with Claude
- `MessageBubble` — User/AI message with markdown rendering
- `FlashCard` — Flip animation, front/back
- `DeckCard` — Deck preview with stats
- `QuizModal` — Full-screen quiz interface
- `DocumentViewer` — Uploaded file preview
- `StudyCalendar` — Weekly grid planner
- `StatsBar` — Streak, XP, hours studied
- `SubjectSidebar` — Course list and navigation

---

## API Endpoints (Node.js/Express)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Chat
- `POST /api/chat` — Send message, get Claude response
- `GET /api/chat/:subjectId` — Get chat history

### Flashcards
- `GET /api/decks` — List all decks
- `POST /api/decks` — Create deck
- `GET /api/decks/:id/cards` — Get cards in deck
- `POST /api/decks/:id/cards` — Add card
- `POST /api/decks/:id/generate` — AI-generate cards from topic
- `POST /api/decks/:id/review` — Submit review result (spaced repetition update)

### Documents
- `POST /api/documents/upload` — Upload file
- `GET /api/documents` — List documents
- `POST /api/documents/:id/summarize` — Summarize with Claude
- `POST /api/documents/:id/flashcards` — Generate flashcards from doc

### Schedule
- `GET /api/schedule` — Get weekly schedule
- `POST /api/schedule` — Create study block
- `PATCH /api/schedule/:id` — Mark complete

### Stats
- `GET /api/stats` — Get streak, XP, study hours

---

## Claude API Integration

### System Prompt (Chat Tutor)
```
You are an expert college tutor helping a student study {subject}. 
Your role is to explain concepts clearly, ask guiding questions, and help the student think through problems — not just give answers. 
Adapt your explanation depth based on the student's responses.
If the student has uploaded documents, reference them when relevant.
Keep responses concise unless the student asks for more detail.
```

### Flashcard Generation Prompt
```
Given the following notes or topic, generate {n} flashcards in JSON format.
Each flashcard should have a "front" (question or term) and "back" (answer or definition).
Focus on key concepts, definitions, and important facts.
Return only valid JSON, no other text.
Format: [{"front": "...", "back": "..."}]
```

### Document Summary Prompt
```
Summarize the following document for a college student.
Extract the 5-10 most important concepts, key terms, and main arguments.
Format as a structured outline with bullet points.
```

---

## Data Models

### User
```json
{ "id", "email", "name", "createdAt", "streak", "xp" }
```

### Subject
```json
{ "id", "userId", "name", "color", "icon" }
```

### ChatMessage
```json
{ "id", "subjectId", "role", "content", "createdAt" }
```

### Deck
```json
{ "id", "userId", "subjectId", "name", "createdAt" }
```

### Card
```json
{ "id", "deckId", "front", "back", "interval", "easeFactor", "dueDate", "reviewCount" }
```

### Document
```json
{ "id", "userId", "subjectId", "filename", "filepath", "extractedText", "createdAt" }
```

### StudyBlock
```json
{ "id", "userId", "subjectId", "date", "startTime", "endTime", "completed" }
```

---

## Build Order (for Claude Code)

Build in this exact order to avoid blockers:

1. **Project setup** — React + TypeScript + Vite frontend, Express + TypeScript backend, Prisma, Tailwind CSS
2. **Docker** — Dockerfile for frontend and backend, Docker Compose for local dev
3. **Auth** — Register, login, JWT middleware
4. **Subjects** — CRUD for courses
5. **Chat Tutor** — Claude API integration, chat UI, history
6. **Document Upload** — File upload to AWS S3, text extraction
7. **Flashcard Decks** — Manual creation, deck management UI
8. **AI Flashcard Generation** — From topic or document
9. **Spaced Repetition** — SM-2 algorithm, review queue
10. **Quiz Mode** — Multiple choice + free response
11. **Study Scheduler** — Calendar UI, study blocks
12. **Dashboard & Stats** — Streak, XP, progress charts
13. **Testing** — Jest unit tests for API, Playwright e2e tests for key flows
14. **CI/CD** — GitHub Actions pipeline (lint, test, deploy)
15. **Deployment** — Vercel (frontend), Railway (backend), PostgreSQL in production
16. **Polish** — Responsive design, loading states, error handling

---

## Non-Goals (out of scope for v1)
- Mobile app (web only)
- Collaboration/group study
- Video or audio content
- Payment/subscription system
- Social features

---

## Success Metrics
- User can upload a document and get flashcards in under 30 seconds
- Chat tutor responds in under 3 seconds
- Spaced repetition surfaces cards at correct intervals
- Dashboard loads in under 1 second

---

## How to Use This PRD with Claude Code

Paste this entire document into Claude Code and say:

> "Use this PRD to build the AI Study Buddy app. Start with step 1 in the Build Order. Set up the full project structure for a React + Node.js app, then implement auth. Ask me before moving to each next step."
