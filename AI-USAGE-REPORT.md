# AI Usage & Engineering Decision Report

## 1. AI Tools Used
- **Antigravity AI Pair Programmer (Gemini 3.6 Flash)**: Used for architecture design, backend route scaffolding, Prisma relational schema generation, AI prompt engineering, CSS design system creation, and error handling verification.
- **Google Gemini API (`@google/generative-ai`)**: Integrated directly into backend `services/aiService.js` for post-meeting transcript analysis and structured JSON extraction.

---

## 2. How AI Was Utilized
- **Schema & Database Design**: Designed relational Prisma schema mapping `User 1 -> N Meeting 1 -> N ActionItem` with cascading deletes and indexing.
- **AI Prompt System Engineering**: Engineered strict JSON-enforcing system prompts instructing the LLM to ground analysis exclusively in the transcript, avoid inventing owners or deadlines, and map priorities conservatively.
- **Fallback Architecture**: Designed a dual-mode AI engine (`aiService.js` + `mockAiService.js`) ensuring that if external LLM keys are absent or API quotas fail during evaluator testing, the application gracefully parses the transcript locally without crashing or failing.
- **UI & CSS Tokens**: Synthesized a dark/light mode theme token system with CSS variables, custom typography, glassmorphism cards, and responsive table views.

---

## 3. Important AI Prompts Used

### Primary AI Analysis Prompt
```text
You are an expert AI meeting notes assistant.
Analyze the following meeting transcript and extract structured meeting intelligence.

CRITICAL INSTRUCTIONS:
- Use ONLY facts directly supported by the transcript.
- Do NOT invent people, deadlines, decisions, or responsibilities.
- If an owner is unknown or unassigned in the transcript, set "owner": "Unassigned".
- If no due date is stated, set "dueDate": null. Format due dates as YYYY-MM-DD if recognizable, else as text.
- If no decisions exist, return an empty array for "decisions".
- If no action items exist, return an empty array for "actionItems".
- Keep summary concise, accurate, and professional.
- Priority must strictly be one of: "Low", "Medium", "High".
- Status must strictly be: "Open".
- Return ONLY valid JSON without markdown code fences or extra text.
```

---

## 4. AI Mistakes Discovered & Manual Engineering Corrections

1. **Unvalidated JSON Schema Types**:
   - *AI Mistake*: Initial draft LLM responses sometimes wrapped output in markdown triple backticks (```json ... ```) or omitted required fields like `discussionPoints` when none were present.
   - *Engineering Fix*: Created `validateAndSanitizeAIOutput` in `aiService.js`. It strips markdown code block fences, verifies data types, enforces array structures, normalizes priorities ("Low" | "Medium" | "High") and defaults missing owners to `"Unassigned"`.

2. **Cross-User Data Leakage Risk**:
   - *AI Mistake*: Scaffolding initial routes created query handlers like `prisma.meeting.findUnique({ where: { id } })` without checking `userId`.
   - *Engineering Fix*: Updated all controller queries to enforce tenant isolation: `where: { id, userId: req.user.id }`. Any attempt to view, edit, or delete another user's resources results in an HTTP 404 / 403 response.

3. **Date Overdue Calculation Edge Cases**:
   - *AI Mistake*: Initial date logic evaluated overdue tasks using string comparisons on ISO strings.
   - *Engineering Fix*: Replaced with strict JavaScript `Date` object comparisons (`dueDate < now` AND `status !== 'Completed'`) both in backend queries and frontend rendering to ensure past due dates correctly highlight as crimson red alerts.

---

## 5. Manual Engineering Decisions

- **React + Vite over Server-Side Rendered Framework**: Chosen for crisp separation of concerns, client-side SPA route transitions, and fast HMR development feedback loop.
- **Prisma ORM with SQLite Default & MySQL Compatibility**: Ensured zero setup friction for evaluators running `npx prisma db push` without needing active root privileges or daemon setup for MySQL on local macOS environments.
- **Centralized Error Middleware**: Prevented raw database stack traces or secret keys from leaking in HTTP responses, returning structured `{ success: false, message: "..." }` responses.

---

## 6. Validation & Testing Workflow

- **Authentication Flow**: Tested registration, duplicate email rejection, invalid password rejection, JWT token storage, and protected route redirection.
- **Meeting & Transcript Flow**: Tested pasting text transcripts and uploading `.txt` files via Multer memory storage.
- **AI Processing**: Verified progress indicator UX, structured summary generation, decision extraction, and automatic action item database insertion.
- **Action Tracker & Dashboard**: Verified action filters (search, status, priority, owner, overdue toggle) and confirmed KPI counter accuracy on the executive dashboard.
- **Theme & Layout**: Verified dark and light mode persistence and mobile drawer responsiveness.
