# AI Usage & Engineering Report — MeetMind AI

This document provides a transparent overview of the AI tools, prompts, validation mechanisms, and independent technical decisions executed during the design and development of **MeetMind AI**.

---

## 🤖 1. AI Tools Used

- **Google Gemini 1.5 Flash API**: Live Large Language Model service utilized on the backend for meeting transcript analysis and structured JSON extraction.
- **Mock AI Heuristic Engine (`mockAiService.js`)**: Custom deterministic fallback service designed to provide offline and keyless development testing.

---

## 🎯 2. Prompting Strategy & System Engineering

The primary objective of the prompting system was to enforce strict **veracity, grounding, and transcript traceability** while eliminating hallucinations (such as fabricated action items, unmentioned assignees, or false dates).

### System Prompt Architecture

```text
You are an expert AI meeting intelligence and action tracking assistant.
Analyze the following meeting transcript and extract structured meeting intelligence.

CRITICAL GROUNDING & VERACITY RULES:
- Analyze ONLY the supplied transcript. Do NOT invent or infer facts, people, decisions, or deadlines not present in text.
- If an owner is unknown or unassigned in the transcript, set "owner": "Unassigned".
- If no due date is explicitly stated, set "dueDate": null.
- Extract verbatim transcript sentences into "evidence" fields to support decisions and action items for source traceability.
- Return valid, raw JSON with NO markdown formatting, NO code blocks, NO HTML tags.
```

### Key Prompt Engineering Techniques:
1. **Explicit Negative Constraints**: Instructing the model never to infer missing due dates or invent project members.
2. **Schema Output Enforcement**: Supplying explicit JSON schema keys (`summary`, `discussionPoints`, `decisions`, `actionItems`, `risks`, `unansweredQuestions`).
3. **Verbatim Evidence Grounding**: Requiring exact sentence extractions into an `evidence` property for every decision and task.

---

## 🔍 3. AI Code Review & Discovered Anomalies

During AI integration, several common LLM response edge cases were identified and systematically resolved:

1. **Markdown Formatting Wrappers**:
   - *Issue*: LLM outputs frequently included ` ```json ... ``` ` code block markup, breaking standard `JSON.parse()`.
   - *Fix*: Implemented regex cleaning (`responseText.replace(/```json/gi, '').replace(/```/g, '').trim()`) prior to parsing.

2. **Inconsistent Decision Format**:
   - *Issue*: LLMs occasionally returned decisions as plain strings instead of objects containing evidence quotes.
   - *Fix*: Built standardizing transformation logic inside `validateAndSanitizeAIOutput` to map both string and object formats into clean `{ text, evidence }` pairs.

3. **Status Enum Corruption**:
   - *Issue*: LLM outputs sometimes returned status values like `"Pending"` or `"To Do"`.
   - *Fix*: Standardized all newly generated action item statuses to `"Open"`, matching the MySQL schema enum constraint.

---

## 🛡 4. Validation Strategy

To prevent raw or malformed AI output from corrupting the MySQL database, a multi-tier validation pipeline was implemented:

```
[ LLM Output ]
      │
      ▼
[ Strip Markdown Fences ]
      │
      ▼
[ JSON.parse() Safe Handler ]
      │
      ▼
[ Schema & Type Sanitization (validateAndSanitizeAIOutput) ]
      │
      ▼
[ Enum & Date Normalization ]
      │
      ▼
[ Database Persistence (Prisma) ]
```

### Key Validation Guards:
- **Null Safety**: Fallback values for empty summaries or missing fields (`"Unassigned"`, `null`, `[]`).
- **Priority Bounds**: Validation against `['Low', 'Medium', 'High']`.
- **Date Verification**: Safe date parsing checking `!isNaN(Date.parse(item.dueDate))`.

---

## 💡 5. Independent Engineering Decisions

1. **Prisma ORM over Raw SQL**: Chosen for rapid schema iteration, type safety, and automatic relational migrations (`db push`).
2. **Server-Side API Key Isolation**: Placed all Gemini AI calls inside Node.js Express controllers (`/api/meetings/:id/process`) to ensure zero exposure of private API credentials to client bundles.
3. **Client-Side Interactive Evidence Highlighting**: Created an interactive **"View in transcript"** link system that dynamically expands meeting transcripts and highlights supporting source text using standard DOM text matching.
4. **Action Health Dashboard Metric**: Engineered a custom mathematical formula to calculate `% On Track` health scores based on task status and due date proximity.

---

## 📝 6. Lessons Learned

- **Grounding is Critical**: Requiring verbatim text quotes for AI output significantly increases user trust and accountability.
- **Fail-Safe Fallbacks**: Providing a seamless Mock AI provider ensures full application usability even during external API downtime or key exhaustion.
