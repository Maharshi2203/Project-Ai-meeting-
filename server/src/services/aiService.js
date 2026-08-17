const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeTranscriptMock } = require('./mockAiService');

/**
 * Validate and clean the AI output structure to ensure app stability.
 */
function validateAndSanitizeAIOutput(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI output must be a JSON object.');
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : 'No summary generated.';
  const discussionPoints = Array.isArray(parsed.discussionPoints)
    ? parsed.discussionPoints.map(item => String(item).trim()).filter(Boolean)
    : [];
  const decisions = Array.isArray(parsed.decisions)
    ? parsed.decisions.map(item => String(item).trim()).filter(Boolean)
    : [];
  const risks = Array.isArray(parsed.risks)
    ? parsed.risks.map(item => String(item).trim()).filter(Boolean)
    : [];
  const unansweredQuestions = Array.isArray(parsed.unansweredQuestions)
    ? parsed.unansweredQuestions.map(item => String(item).trim()).filter(Boolean)
    : [];

  const validPriorities = ['Low', 'Medium', 'High'];
  const validStatuses = ['Open', 'In Progress', 'Blocked', 'Completed'];

  const actionItems = Array.isArray(parsed.actionItems)
    ? parsed.actionItems
        .filter(item => item && typeof item === 'object' && item.task)
        .map(item => ({
          task: String(item.task).trim(),
          owner: item.owner && String(item.owner).trim() !== '' ? String(item.owner).trim() : 'Unassigned',
          dueDate: item.dueDate ? String(item.dueDate).trim() : null,
          priority: validPriorities.includes(item.priority) ? item.priority : 'Medium',
          status: validStatuses.includes(item.status) ? item.status : 'Open'
        }))
    : [];

  return {
    summary,
    discussionPoints,
    decisions,
    risks,
    unansweredQuestions,
    actionItems
  };
}

/**
 * Main AI processing service.
 * Tries Google Gemini API if key is present; otherwise falls back to Mock AI Provider.
 */
async function processTranscriptWithAI(transcript) {
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

  if (!apiKey || apiKey.trim() === '') {
    console.log('[AI SERVICE]: No AI_API_KEY found. Utilizing Mock AI Provider.');
    const mockOutput = analyzeTranscriptMock(transcript);
    return validateAndSanitizeAIOutput(mockOutput);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
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

JSON Schema format:
{
  "summary": "String",
  "discussionPoints": ["String"],
  "decisions": ["String"],
  "actionItems": [
    {
      "task": "String",
      "owner": "String",
      "dueDate": "String or null",
      "priority": "Low | Medium | High",
      "status": "Open"
    }
  ],
  "risks": ["String"],
  "unansweredQuestions": ["String"]
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
    return validateAndSanitizeAIOutput(parsed);
  } catch (error) {
    console.error('[AI SERVICE ERROR]: Live AI processing failed. Falling back to Mock AI Provider. Error:', error.message);
    const mockFallback = analyzeTranscriptMock(transcript);
    return validateAndSanitizeAIOutput(mockFallback);
  }
}

module.exports = {
  processTranscriptWithAI,
  validateAndSanitizeAIOutput
};
