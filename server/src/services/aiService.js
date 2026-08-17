const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeTranscriptMock } = require('./mockAiService');
const { enforceBusinessRulesOnAIOutput } = require('../utils/aiSafetyValidator');

/**
 * Validate and clean the AI output structure to ensure app stability and schema compliance.
 */
function validateAndSanitizeAIOutput(parsed, transcriptText = '') {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI output must be a valid JSON object.');
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : 'No summary generated.';
  const discussionPoints = Array.isArray(parsed.discussionPoints)
    ? parsed.discussionPoints.map(item => String(item).trim()).filter(Boolean)
    : [];

  // Standardize decisions into { text, evidence } objects
  const decisions = Array.isArray(parsed.decisions)
    ? parsed.decisions
        .filter(Boolean)
        .map(item => {
          if (typeof item === 'string') {
            return { text: item.trim(), evidence: '' };
          } else if (typeof item === 'object' && item.text) {
            return {
              text: String(item.text).trim(),
              evidence: item.evidence ? String(item.evidence).trim() : ''
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const risks = Array.isArray(parsed.risks)
    ? parsed.risks.map(item => String(item).trim()).filter(Boolean)
    : [];
  const unansweredQuestions = Array.isArray(parsed.unansweredQuestions)
    ? parsed.unansweredQuestions.map(item => String(item).trim()).filter(Boolean)
    : [];

  const validPriorities = ['Low', 'Medium', 'High'];
  const validStatuses = ['Open', 'In Progress', 'Blocked', 'Completed'];

  // Standardize action items with evidence grounding
  const rawActionItems = Array.isArray(parsed.actionItems)
    ? parsed.actionItems
        .filter(item => item && typeof item === 'object' && item.task)
        .map(item => ({
          task: String(item.task).trim(),
          owner: item.owner && String(item.owner).trim() !== '' ? String(item.owner).trim() : 'Unassigned',
          dueDate: item.dueDate ? String(item.dueDate).trim() : null,
          priority: validPriorities.includes(item.priority) ? item.priority : 'Medium',
          status: validStatuses.includes(item.status) ? item.status : 'Open',
          evidence: item.evidence ? String(item.evidence).trim() : (typeof item.task === 'string' ? item.task.trim() : '')
        }))
    : [];

  const initialCleanOutput = {
    summary,
    discussionPoints,
    decisions,
    risks,
    unansweredQuestions,
    actionItems: rawActionItems
  };

  // Run business-rule safety check (strips question words as owners, reclassifies questions to unansweredQuestions)
  return enforceBusinessRulesOnAIOutput(initialCleanOutput);
}

/**
 * Main AI processing service.
 * Supports configured AI Provider (Gemini API) and Mock Mode (AI_PROVIDER=mock or fallback).
 */
async function processTranscriptWithAI(transcript) {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

  // Explicit Mock Mode or missing API Key fallback
  if (provider === 'mock' || !apiKey || apiKey.trim() === '') {
    console.log('[AI SERVICE]: Executing in Mock Provider mode.');
    const mockOutput = analyzeTranscriptMock(transcript);
    return validateAndSanitizeAIOutput(mockOutput, transcript);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
You are an expert AI meeting intelligence and action tracking assistant.
Analyze the supplied meeting transcript and extract structured meeting intelligence.

CRITICAL GROUNDING & VERACITY RULES:
- Analyze ONLY the supplied transcript. Do NOT invent or infer facts, people, decisions, or deadlines not present in text.
- QUESTIONS ARE NOT ACTION ITEMS. Sentences ending with '?' or starting with question words (Who, What, When, Where, Why, How, Can, Could, Would, Should) MUST be placed in "unansweredQuestions" or "discussionPoints", NOT "actionItems".
- NEVER extract a question word ("Who", "What", "How", "Why", "When") as an owner. Question words are NOT people.
- An action item requires reasonable evidence of a committed task by a person or team.
- If an owner is unknown or unassigned in the transcript, set "owner": "Unassigned".
- If no due date is explicitly stated, set "dueDate": null.
- Extract verbatim transcript sentences into "evidence" fields to support decisions and action items for source traceability.
- Return valid, raw JSON with NO markdown formatting, NO code blocks, NO HTML tags.

JSON Output Schema:
{
  "summary": "Concise 2-3 sentence executive summary of the meeting",
  "discussionPoints": ["Key point 1", "Key point 2"],
  "decisions": [
    {
      "text": "Selected React for frontend framework",
      "evidence": "The client approved React for the MVP."
    }
  ],
  "actionItems": [
    {
      "task": "Prepare authentication module",
      "owner": "Rahul",
      "dueDate": "2026-09-05",
      "priority": "High",
      "status": "Open",
      "evidence": "Rahul will prepare the authentication module by September 5."
    }
  ],
  "risks": ["Risk or concern identified"],
  "unansweredQuestions": ["Unresolved question asked"]
}

TRANSCRIPT:
${transcript}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean JSON response (strip markdown wrappers ```json ... ```)
    const cleanedText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    return validateAndSanitizeAIOutput(parsed, transcript);
  } catch (error) {
    console.error('[AI SERVICE ERROR]: Live AI processing failed. Utilizing safe Mock Provider fallback. Error:', error.message);
    const mockFallback = analyzeTranscriptMock(transcript);
    return validateAndSanitizeAIOutput(mockFallback, transcript);
  }
}

module.exports = {
  processTranscriptWithAI,
  validateAndSanitizeAIOutput
};
