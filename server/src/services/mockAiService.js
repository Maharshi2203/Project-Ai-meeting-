/**
 * Mock AI Service for fallback execution when live AI API key is not configured or unavailable.
 * Performs heuristic transcript analysis to extract structured meeting intelligence.
 */

function analyzeTranscriptMock(transcript) {
  const lines = transcript
    .split(/\n|\./)
    .map(line => line.trim())
    .filter(line => line.length > 5);

  const summaryLines = [];
  const discussionPoints = [];
  const decisions = [];
  const actionItems = [];
  const risks = [];
  const unansweredQuestions = [];

  // Common keywords for extraction heuristics
  const decisionKeywords = ['agreed', 'agrees', 'decided', 'approved', 'selected', 'confirmed', 'resolved'];
  const riskKeywords = ['risk', 'concern', 'unclear', 'delay', 'issue', 'challenge', 'worry', 'bottleneck'];
  const questionKeywords = ['question', 'how to', 'wondering', 'need to clarify', 'unresolved', 'follow-up discussion'];
  const actionKeywords = ['will', 'shall', 'assigned', 'action item', 'responsible for', 'prepare', 'build', 'create', 'setup', 'deliver', 'send'];

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Check decisions
    if (decisionKeywords.some(kw => lower.includes(kw))) {
      decisions.push(line);
    }
    // Check risks
    else if (riskKeywords.some(kw => lower.includes(kw))) {
      risks.push(line);
    }
    // Check unanswered questions
    else if (questionKeywords.some(kw => lower.includes(kw)) || lower.endsWith('?')) {
      unansweredQuestions.push(line);
    }

    // Check action items
    if (actionKeywords.some(kw => lower.includes(kw))) {
      // Heuristic owner extraction
      let owner = 'Unassigned';
      const words = line.split(' ');
      const capitalizedWords = words.filter(w => /^[A-Z][a-z]+$/.test(w) && !['The', 'A', 'An', 'We', 'They', 'Our', 'This', 'Project', 'MVP'].includes(w));
      if (capitalizedWords.length > 0) {
        owner = capitalizedWords[0];
      }

      // Date extraction (e.g. "by September 5", "by 2026-09-05")
      let dueDate = null;
      const dateMatch = line.match(/by\s+([A-Za-z]+\s+\d{1,2}|\d{4}-\d{2}-\d{2})/i);
      if (dateMatch) {
        dueDate = dateMatch[1];
      }

      // Priority inference
      let priority = 'Medium';
      if (lower.includes('urgent') || lower.includes('critical') || lower.includes('high priority') || lower.includes('asap')) {
        priority = 'High';
      } else if (lower.includes('low priority') || lower.includes('when possible') || lower.includes('optional')) {
        priority = 'Low';
      }

      actionItems.push({
        task: line,
        owner: owner,
        dueDate: dueDate,
        priority: priority,
        status: 'Open'
      });
    } else {
      if (discussionPoints.length < 6) {
        discussionPoints.push(line);
      }
    }
  });

  // Fallbacks if transcript text is short or generic
  const firstSentences = lines.slice(0, 3).join('. ');
  const summary = firstSentences ? `${firstSentences}.` : 'The meeting transcript was processed and key details extracted.';

  if (discussionPoints.length === 0) {
    discussionPoints.push('Overview of project requirements and action items.');
  }

  return {
    summary: summary,
    discussionPoints: discussionPoints.slice(0, 5),
    decisions: decisions.slice(0, 5),
    actionItems: actionItems,
    risks: risks.slice(0, 5),
    unansweredQuestions: unansweredQuestions.slice(0, 5),
    isMock: true
  };
}

module.exports = {
  analyzeTranscriptMock
};
