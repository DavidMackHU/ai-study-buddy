# AI Study Buddy — Master Build Prompt
# Paste this entire file into Claude Code to start or resume a session.

---

## Session Start Instructions

Before doing anything else:
1. Read every existing file in this project to understand what has been built
2. Read this entire document top to bottom
3. Report back:
   - What has been completed so far
   - Which Build Order step we are on
   - What you recommend building next
4. Wait for my confirmation before writing a single line of code

---

## Progress Tracker
> Claude: Update this section after each step is confirmed complete.
> Format: ✅ Done | 🔄 In Progress | ⬜ Not Started

| Step | Feature | Status | Notes |
|------|---------|--------|-------|
| 1 | Project setup (React + TS + Vite, Express + TS, Prisma, Tailwind) | ✅ | Tailwind v4 + @tailwindcss/vite; Prisma v7 (SQLite dev.db created); health endpoint verified |
| 2 | Docker + Docker Compose | ✅ | Build verified; frontend 200 OK on :5173, backend `{"status":"ok"}` on :3001, prisma db push runs on startup |
| 3 | Auth (register, login, JWT) | ✅ | bcryptjs + JWT; Prisma v7 uses PrismaLibSql adapter (pass config obj not client); stale server on :3001 was masking bugs |
| 4 | Subjects CRUD | ✅ | GET/POST/PATCH/DELETE /api/subjects; SubjectSidebar with inline add/edit/delete; useSubjects hook |
| 5 | Chat Tutor (Gemini API + UI) | ✅ | gemini-2.5-flash streaming SSE; ChatWindow + MessageBubble + ChatPage; Normal/Beginner/Challenge modes |
| 6 | Document Upload (Supabase Storage + text extraction) | ⬜ | |
| 7 | Flashcard Decks (manual creation + UI) | ⬜ | |
| 8 | AI Flashcard Generation | ⬜ | |
| 9 | Spaced Repetition (SM-2 algorithm) | ⬜ | |
| 10 | Quiz Mode | ⬜ | |
| 11 | Study Scheduler | ⬜ | |
| 12 | Dashboard & Stats | ⬜ | |
| 13 | Testing (Jest + Playwright) | ⬜ | |
| 14 | CI/CD (GitHub Actions) | ⬜ | |
| 15 | Deployment (Render + Supabase PostgreSQL) | ⬜ | |
| 16 | Polish (responsive, loading states, error handling) | ⬜ | |

---

## Rules Claude Must Follow

- **Never skip steps.** Complete each step fully before moving on.
- **Always ask before starting the next step.** Say "Step X is complete. Ready to move to Step Y: [description]? (yes/no)"
- **Update the Progress Tracker** after each step is confirmed complete — change ⬜ to ✅ and add a note.
- **Never delete or overwrite working code** without telling me first.
- **If you hit a blocker**, stop and explain the problem clearly before trying a workaround.
- **Keep files small and modular.** No file should exceed 300 lines. Split into components/modules if needed.
- **Always use TypeScript.** No plain `.js` files except config files.
- **After each step**, run the app and confirm it works before marking complete.
- **If I say "status"**, stop what you're doing and report the current progress table.
- **If I say "stop"**, halt immediately and wait for instructions.

---

## Product Requirements Document

### Overview
AI Study Buddy is a web application for college students that combines an AI tutor, flashcard system, document upload, and study scheduling into a single interface. Built with React (frontend) and Node.js (backend), powered by the Google Gemini API.

---

### Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **AI:** Google Gemini API (`gemini-2.5-flash`)
- **Database:** SQLite (local dev) → PostgreSQL (production)
- **ORM:** Prisma (type-safe database queries)
- **File Storage:** Supabase Storage (bucket: "documents")
- **Auth:** JWT-based authentication
- **Containerization:** Docker + Docker Compose
- **Deployment:** Render (frontend static site + backend web service)
- **Testing:** Jest (unit) + Playwright (end-to-end)
- **CI/CD:** GitHub Actions (auto-test and deploy on push)
- **Styling:** Tailwind CSS

---

### Core Features

#### 1. AI Chat Tutor
- Persistent chat interface with Gemini
- Subject-aware context: user selects a subject/course before chatting
- Gemini responds as a tutor — explains concepts, doesn't just give answers
- Chat history saved per session and per subject
- "Explain like I'm a beginner" and "Challenge me" mode toggles
- Code highlighting support for STEM subjects

#### 2. Flashcards & Quizzing
- Manual flashcard creation (front/back)
- AI-generated flashcards from uploaded notes or typed topic
- Deck organization by course/subject
- Quiz modes: multiple choice, free response, true/false
- Spaced repetition algorithm (SM-2) to prioritize weak cards
- Performance tracking per deck (accuracy %, streak)

#### 3. Document & Notes Upload
- Upload PDF, DOCX, or TXT files
- Gemini reads and indexes the document
- Auto-generate flashcards from uploaded document
- Ask questions about the document in the chat tutor
- Summarize document into key points

#### 4. Study Scheduling & Tracking
- Weekly study planner: assign subjects to time blocks
- Daily study goals (e.g. "Review 20 flashcards", "Read Chapter 3")
- Streak tracking and XP/points system for motivation
- Dashboard: weekly study hours, cards reviewed, quiz scores
- Reminders (browser notifications)

---

### User Flow

1. **Onboarding:** User signs up → adds their courses → sets weekly study goal
2. **Dashboard:** Overview of today's tasks, streak, upcoming sessions
3. **Study Session:** Pick a subject → choose mode (chat, flashcards, quiz, or upload)
4. **Chat Tutor:** Ask questions, get explanations, reference uploaded docs
5. **Flashcard Review:** Spaced repetition queue surfaces due cards
6. **Quiz:** Test on a deck or a topic, get instant feedback
7. **Schedule:** Plan the week, mark sessions complete

---

### Pages & Components

#### Pages
- `/` — Landing/login
- `/dashboard` — Home after login
- `/chat/:subjectId` — AI tutor chat
- `/flashcards` — Deck library
- `/flashcards/:deckId` — Review/quiz a deck
- `/upload` — Document upload and management
- `/schedule` — Weekly planner
- `/settings` — Account, preferences

#### Key Components
- `ChatWindow` — Message thread with Gemini
- `MessageBubble` — User/AI message with markdown rendering
- `FlashCard` — Flip animation, front/back
- `DeckCard` — Deck preview with stats
- `QuizModal` — Full-screen quiz interface
- `DocumentViewer` — Uploaded file preview
- `StudyCalendar` — Weekly grid planner
- `StatsBar` — Streak, XP, hours studied
- `SubjectSidebar` — Course list and navigation

---

### API Endpoints

#### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

#### Chat
- `POST /api/chat` — Send message, get Gemini response
- `GET /api/chat/:subjectId` — Get chat history

#### Flashcards
- `GET /api/decks` — List all decks
- `POST /api/decks` — Create deck
- `GET /api/decks/:id/cards` — Get cards in deck
- `POST /api/decks/:id/cards` — Add card
- `POST /api/decks/:id/generate` — AI-generate cards from topic
- `POST /api/decks/:id/review` — Submit review result

#### Documents
- `POST /api/documents/upload` — Upload file
- `GET /api/documents` — List documents
- `POST /api/documents/:id/summarize` — Summarize with Gemini
- `POST /api/documents/:id/flashcards` — Generate flashcards from doc

#### Schedule
- `GET /api/schedule` — Get weekly schedule
- `POST /api/schedule` — Create study block
- `PATCH /api/schedule/:id` — Mark complete

#### Stats
- `GET /api/stats` — Get streak, XP, study hours

---

### Gemini API Integration

#### System Prompt (Chat Tutor)
```
You are an expert college tutor helping a student study {subject}.
Your role is to explain concepts clearly, ask guiding questions, and help
the student think through problems — not just give answers.
Adapt your explanation depth based on the student's responses.
If the student has uploaded documents, reference them when relevant.
Keep responses concise unless the student asks for more detail.
```

#### Flashcard Generation Prompt
```
Given the following notes or topic, generate {n} flashcards in JSON format.
Each flashcard should have a "front" (question or term) and "back" (answer or definition).
Focus on key concepts, definitions, and important facts.
Return only valid JSON, no other text.
Format: [{"front": "...", "back": "..."}]
```

#### Document Summary Prompt
```
Summarize the following document for a college student.
Extract the 5-10 most important concepts, key terms, and main arguments.
Format as a structured outline with bullet points.
```

---

### Data Models

```
User       { id, email, name, createdAt, streak, xp }
Subject    { id, userId, name, color, icon }
ChatMessage { id, subjectId, role, content, createdAt }
Deck       { id, userId, subjectId, name, createdAt }
Card       { id, deckId, front, back, interval, easeFactor, dueDate, reviewCount }
Document   { id, userId, subjectId, filename, filepath, extractedText, createdAt }
StudyBlock { id, userId, subjectId, date, startTime, endTime, completed }
```

---

### Non-Goals (v1)
- Mobile app
- Group/collaborative study
- Video or audio content
- Payments
- Social features

---

### Success Metrics
- Upload doc → flashcards generated in under 30 seconds
- Chat tutor responds in under 3 seconds
- Dashboard loads in under 1 second

---

## How to Resume a Session

If starting a new Claude Code session, paste this file and say:

> "Read this file, check the Progress Tracker, scan existing project files, and tell me where we left off. Do not build anything until I confirm."
