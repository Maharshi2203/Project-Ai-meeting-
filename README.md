# AI Meeting Notes & Action Tracker

**AI Meeting Notes & Action Tracker** is a production-quality, full-stack post-meeting productivity web application. It transforms raw meeting transcripts (entered via rich text or uploaded as `.txt` files) into structured meeting intelligence—including executive summaries, discussion points, key decisions, risks, unanswered questions, and extracted action items with owner, priority, and due date tracking.

---

## Technology Stack

- **Frontend**: React, Vite, React Router v6, Axios, Lucide Icons, Custom CSS Design System with HSL Theme Tokens (Dark & Light Mode).
- **Backend**: Node.js, Express.js, REST APIs, JWT authentication, `bcryptjs` password hashing, Multer file upload handling, Centralized Express error handler.
- **Database & ORM**: MySQL database (`ai_meeting_db` on port 3306) via Prisma ORM with relational foreign key cascading.
- **AI Integration**: Backend AI Service supporting Google Gemini API (`@google/generative-ai`) with automatic fallback to an Intelligent Local NLP Mock Provider for offline or keyless execution.

---

## Primary Features

1. **Authentication**: Secure JWT registration, login, session persistence, password hashing (`bcryptjs`), protected routes, and multi-tenant user data isolation.
2. **Meeting Management**: Complete CRUD for post-meeting records supporting titles, dates, types (Client, Sales, Project, Internal, etc.), participants, and transcript storage.
3. **Dual Transcript Input**: Rich text format editor for pasting transcript text OR direct upload of plain text (`.txt`) transcript files with server-side validation.
4. **AI Transcript Processing Engine**: Structured AI prompt forcing strict JSON generation (summary, discussion points, decisions, risks, unanswered questions, action items) with schema validation and retry support.
5. **Central Action Tracker**: Cross-meeting task management board with search, status filters (Open, In Progress, Blocked, Completed), priority filters, owner filters, and automatic overdue task detection (`dueDate < today` & `status !== Completed`).
6. **Executive Dashboard**: KPI summary cards for Total Meetings, Total Actions, Open Tasks, Completed Tasks, and Overdue Tasks alongside recently created meetings.
7. **SaaS UI & Theme Switching**: Modern responsive layout with glassmorphic cards, mobile navigation drawer, and instant Dark / Light mode toggle persisted in `localStorage`.

---

## Architecture Diagram

```text
React (Vite Frontend)
   ↓ Axios (Bearer JWT Header)
Express REST API (Backend Server: 5001)
   ↓ Auth & Tenant Isolation Middleware
Prisma ORM (SQLite / MySQL Database)
   ↓ AI Service Dispatcher
Google Gemini API OR Local Mock AI Provider
```

---

## Database Design

### `users`
- `id`: String (UUID, Primary Key)
- `name`: String
- `email`: String (Unique)
- `passwordHash`: String
- `createdAt`, `updatedAt`: DateTime

### `meetings`
- `id`: String (UUID, Primary Key)
- `userId`: String (Foreign Key -> `users.id`, Cascade Delete)
- `title`: String
- `meetingDate`: DateTime
- `meetingType`: String
- `participants`: String
- `transcript`: Text
- `summary`: Text
- `discussionPoints`: JSON String Array
- `decisions`: JSON String Array
- `risks`: JSON String Array
- `unansweredQuestions`: JSON String Array
- `createdAt`, `updatedAt`: DateTime

### `action_items`
- `id`: String (UUID, Primary Key)
- `meetingId`: String (Foreign Key -> `meetings.id`, Cascade Delete)
- `userId`: String (Foreign Key -> `users.id`, Cascade Delete)
- `task`: String
- `owner`: String (Defaults to "Unassigned")
- `dueDate`: DateTime (Nullable)
- `priority`: String ("Low", "Medium", "High")
- `status`: String ("Open", "In Progress", "Blocked", "Completed")
- `createdAt`, `updatedAt`: DateTime

---

## API Endpoint Overview

### Auth
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET  /api/auth/me` — Retrieve current authenticated user profile

### Meetings
- `GET    /api/meetings` — List user's meetings (supports `search` & `type` query params)
- `POST   /api/meetings` — Create new meeting (supports text body or `.txt` multipart file upload)
- `GET    /api/meetings/:id` — Get meeting details with parsed AI fields & action items
- `PUT    /api/meetings/:id` — Update meeting details
- `DELETE /api/meetings/:id` — Delete meeting and associated action items
- `POST   /api/meetings/:id/process` — Process meeting transcript through AI engine

### Action Items
- `GET    /api/action-items` — List action items across meetings with filters (`search`, `status`, `priority`, `owner`, `overdue`)
- `POST   /api/action-items` — Create action item manually
- `PUT    /api/action-items/:id` — Update action item details or status
- `DELETE /api/action-items/:id` — Delete action item

### Dashboard
- `GET /api/dashboard` — Retrieve aggregate metrics, KPI stats, and recent activity

---

## Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup
```bash
cd server
npm install
npx prisma db push
npm run db:seed
npm run dev
```
The backend server starts on `http://localhost:5001`.

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend application starts on `http://localhost:3000`.

---

## Demo Credentials

For instant testing, a pre-seeded demo user is available:
- **Email**: `demo@example.com`
- **Password**: `password123`

---

## Assumptions & Exclusions

### Completed Features
- Full authentication & protected routing.
- Meeting management CRUD.
- Direct transcript pasting and `.txt` file uploads.
- AI analysis engine with Google Gemini & intelligent fallback mock parser.
- Action Tracker with multi-criteria filtering and overdue highlight.
- Executive Dashboard with metrics.
- Dark & Light mode toggle with CSS tokens.
- Responsive mobile drawer and cards layout.

### Intentionally Excluded Scope
- Audio/Video calling,WebRTC, live streaming transcription (Out of scope for post-meeting productivity).
- PDF / DOCX file parsing (Excluded to protect timeline; focused on reliable `.txt` handling).
- Multi-party live calendar integrations.

---

## License

MIT License. Developed for Technical Hiring Assessment.
