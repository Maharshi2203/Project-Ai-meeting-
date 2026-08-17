# MeetMind AI — AI Meeting Intelligence & Action Tracker

> **Turn conversations into accountable actions.**

MeetMind AI is a production-grade, mobile-first SaaS web application designed to convert unstructured post-meeting transcripts into validated AI intelligence, key decisions, risks, unanswered questions, and source-backed action items with strict owner accountability.

---

## 🚀 Key Features

- **End-to-End Authentication**: JWT bearer tokens, bcrypt password hashing, input validation, and user isolation.
- **Transcript Management**: Direct text input via rich text editor or plain text (`.txt`) file upload processing.
- **AI Processing Pipeline**: Server-side LLM integration (Google Gemini 1.5 Flash) with fallback Mock AI provider (`AI_PROVIDER=mock`).
- **Strict Veracity & Grounding**: Prompt engineering rules enforcing strict adherence to transcript text; no invented facts, people, or deadlines.
- **Evidence & Source Traceability (Signature Feature)**:
  - Every decision and action item includes verbatim supporting transcript evidence.
  - Interactive **"View in transcript"** buttons automatically open, scroll to, and highlight the exact text in the meeting transcript.
  - **✓ Source-backed** status badges.
- **Accountability Action Tracker**:
  - Dedicated task management dashboard supporting multi-filter search (Status, Priority, Owner, Overdue).
  - Overdue tracking with visual status warnings (`due_date < today AND status != Completed`).
  - Mobile-responsive table & card transformations.
- **Executive Dashboard & Action Health**:
  - Metrics overview (Total Meetings, Total Actions, Open Tasks, Completed, Overdue).
  - **Action Health Breakdown** calculating real-time `% On Track` health scores and status distribution.
- **Modern Responsive SaaS UI**:
  - Mobile-first responsive layout (320px–1440px+ viewports).
  - Dark Mode & Light Mode support with CSS design tokens persisted in `localStorage`.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design Tokens (`index.css`), HSL colors, CSS Variables

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma ORM v5
- **Database**: MySQL 8.0
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs`
- **File Upload**: `multer` & `pdf-parse`

### AI Services
- **AI Provider**: Google Generative AI (`@google/generative-ai`)
- **Model**: `gemini-1.5-flash` (Configurable via `AI_MODEL`)
- **Fallback**: Mock AI Heuristic Service (`src/services/mockAiService.js`)

---

## 🏗 High-Level Architecture

```
[ React 18 + Vite Frontend ]
           │
           │  HTTPS / REST API (JWT Bearer Auth)
           ▼
[ Node.js + Express Server ]
     │               │
     │ Prisma ORM    │ Server-side API Key
     ▼               ▼
[ MySQL 8.0 ]   [ Google Gemini 1.5 API ]
                     │
                     ▼
           [ Output Sanitization & Validation ]
```

---

## 🗄 Database Schema (Prisma / MySQL)

### `users` Table
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String)
- `createdAt` / `updatedAt` (DateTime)

### `meetings` Table
- `id` (UUID, Primary Key)
- `userId` (String, FK -> `users.id`)
- `title` (String)
- `meetingDate` (DateTime)
- `meetingType` (String)
- `participants` (String)
- `transcript` (Text)
- `summary` (Text, optional)
- `discussionPoints` (JSON Text, optional)
- `decisions` (JSON Text, optional)
- `risks` (JSON Text, optional)
- `unansweredQuestions` (JSON Text, optional)
- `createdAt` / `updatedAt` (DateTime)

### `action_items` Table
- `id` (UUID, Primary Key)
- `meetingId` (String, FK -> `meetings.id`)
- `userId` (String, FK -> `users.id`)
- `task` (Text)
- `owner` (String, Default: "Unassigned")
- `dueDate` (DateTime, optional)
- `priority` (Enum: "Low", "Medium", "High")
- `status` (Enum: "Open", "In Progress", "Blocked", "Completed")
- `evidence` (Text, supporting transcript quote)
- `createdAt` / `updatedAt` (DateTime)

---

## 🛡 AI Validation & Grounding Strategy

Raw AI output is **never** saved directly to the database. It passes through a multi-stage validation pipeline:

1. **System Prompt Rules**: Strict instruction to analyze *only* the provided transcript, return verbatim `evidence` quotes, and format output as clean JSON without markdown code fences.
2. **JSON Parsing & Cleaning**: Strips markdown wrappers (` ```json `) and parses JSON defensively.
3. **Schema Sanitization (`validateAndSanitizeAIOutput`)**:
   - Validates required fields (`summary`, `discussionPoints`, `decisions`, `actionItems`, `risks`, `unansweredQuestions`).
   - Normalizes decision objects into `{ text, evidence }` pairs.
   - Enforces enum bounds for Priority (`Low` | `Medium` | `High`) and Status (`Open` | `In Progress` | `Blocked` | `Completed`).
   - Standardizes due dates to `YYYY-MM-DD` or `null`.
   - Defaults missing owners to `"Unassigned"`.
4. **Fallback Handling**: If live AI processing encounters an error or network timeout, the system seamlessly transitions to the `mockAiService` heuristic parser without crashing.

---

## 🔒 Security Strategy

- **API Keys**: `AI_API_KEY` and `JWT_SECRET` reside strictly on the Node.js server. They are never exposed to client-side bundles.
- **Data Isolation**: All database queries (`findMany`, `update`, `delete`) enforce `where: { userId: req.user.id }` to prevent cross-tenant data leaks.
- **Password Protection**: Passwords are hashed using `bcryptjs` prior to storage. Plaintext passwords are never logged or stored.

---

## 🖥 Local Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MySQL 8.0 running locally on port `3306`

### 1. Backend Configuration (`/server`)

```bash
cd server
npm install
```

Create `.env` inside `/server`:
```env
PORT=5001
JWT_SECRET=super_secret_ai_meeting_notes_tracker_jwt_key_2026
DATABASE_URL="mysql://root@localhost:3306/ai_meeting_db"
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_API_KEY=your_gemini_api_key_here
```

Push database schema and generate Prisma client:
```bash
npx prisma db push
npx prisma generate
```

Start backend server:
```bash
npm run dev
```

### 2. Frontend Configuration (`/client`)

```bash
cd ../client
npm install
```

Start Vite dev server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 🎬 5-Minute Product Demonstration Flow

1. **Login**: Access `http://localhost:3000/login` and log in with your credentials.
2. **Executive Dashboard**: View total metrics, active action items, and the **Action Health Breakdown** card (`% On Track`).
3. **Meetings List**: Navigate to **Meetings** to inspect recorded sessions or search for existing transcripts.
4. **Create Meeting**: Create a new meeting record by pasting a transcript or uploading a `.txt` file.
5. **AI Analysis**: Click **"Analyze with AI"** on the Meeting Details page. Watch the live progress overlay extract structured insights.
6. **Grounding & Evidence Traceability**:
   - Inspect decisions and action items featuring **✓ Source-backed** badges.
   - Click **"View in transcript"** on any decision or action item to automatically expand the transcript, scroll into view, and highlight the source sentence.
7. **Action Tracker**: Open **Action Tracker** to filter tasks by status (e.g. `Overdue Only`), change task statuses, or update assignees.
8. **Theme Toggle**: Switch between **Dark Mode** and **Light Mode** using the sun/moon icon in the Navbar.
9. **Mobile Inspection**: Resize screen width to `375px` to verify mobile drawer navigation, card conversions, and touch-friendly controls.

---

## 📋 Assumptions & Known Limitations

- **File Support**: Current file upload parser supports plain text (`.txt`) and PDF (`.pdf`) files up to 5MB.
- **AI Token Limits**: Extremely long transcripts (>25,000 words) may require transcript truncation or chunking depending on model context limits.
- **Single Tenant Database**: Designed for single-organization multi-user deployment where users isolate their own meetings.

---

## 🔮 Future Improvements

1. **Background Job Queueing**: Integrate BullMQ/Redis for asynchronous AI processing of large transcripts.
2. **Audio/Video Transcription**: Integrate Whisper API for direct `.mp3`/`.mp4` audio transcription.
3. **Calendar Integration**: Export action item due dates to Google Calendar or Outlook.
