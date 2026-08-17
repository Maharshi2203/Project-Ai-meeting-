/**
 * Mock AI Service for development/offline testing.
 * Performs heuristic transcript analysis to extract structured meeting intelligence with evidence.
 */
const { isBlacklistedOwner, isQuestionTask } = require('../utils/aiSafetyValidator');

function analyzeTranscriptMock(transcript) {
  const lines = transcript
    .split(/\n|\./)
    .map(line => line.trim())
    .filter(line => line.length > 5);

  const discussionPoints = [];
  const decisions = [];
  const actionItems = [];
  const risks = [];
  const unansweredQuestions = [];

  // Keywords for heuristic extraction
  const decisionKeywords = ['agreed', 'agrees', 'decided', 'approved', 'selected', 'confirmed', 'resolved'];
  const riskKeywords = ['risk', 'concern', 'unclear', 'delay', 'issue', 'challenge', 'worry', 'bottleneck'];
  const questionKeywords = ['question', 'how to', 'wondering', 'need to clarify', 'unresolved', 'follow-up discussion'];
  const actionKeywords = ['will', 'shall', 'assigned', 'action item', 'responsible for', 'prepare', 'build', 'create', 'setup', 'deliver', 'send'];

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Check 1: Questions are NEVER action items
    if (isQuestionTask(line) || questionKeywords.some(kw => lower.includes(kw))) {
      unansweredQuestions.push(line);
      return;
    }

    // Check 2: Decisions
    if (decisionKeywords.some(kw => lower.includes(kw))) {
      decisions.push({
        text: line,
        evidence: `"${line}"`
      });
    }
    // Check 3: Risks
    else if (riskKeywords.some(kw => lower.includes(kw))) {
      risks.push(line);
    }

    // Check 4: Action items (must NOT be a question)
    if (actionKeywords.some(kw => lower.includes(kw))) {
      // Heuristic owner extraction with question-word blacklist protection
      let owner = 'Unassigned';
      
      const speakerPrefixMatch = line.match(/^([A-Z][a-zA-Z0-9_\s]{1,25}):/);
      if (speakerPrefixMatch && !isBlacklistedOwner(speakerPrefixMatch[1])) {
        owner = speakerPrefixMatch[1].trim();
      } else {
        const words = line.split(' ');
        const candidateWords = words.filter(w => /^[A-Z][a-z]+$/.test(w) && !['The', 'A', 'An', 'We', 'They', 'Our', 'This', 'Project', 'MVP'].includes(w));
        
        for (const candidate of candidateWords) {
          if (!isBlacklistedOwner(candidate)) {
            owner = candidate;
            break;
          }
        }
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
        status: 'Open',
        evidence: `"${line}"`
      });
    } else {
      if (discussionPoints.length < 6 && !decisions.some(d => d.text === line)) {
        discussionPoints.push(line);
      }
    }
  });

  const firstSentences = lines.slice(0, 3).join('. ');
  const summary = firstSentences ? `${firstSentences}.` : 'The meeting transcript was processed and key details extracted.';

  if (discussionPoints.length === 0) {
    discussionPoints.push('Overview of project requirements and action items.');
  }

  return {
    summary,
    discussionPoints: discussionPoints.slice(0, 5),
    decisions: decisions.slice(0, 5),
    actionItems,
    risks: risks.slice(0, 5),
    unansweredQuestions: unansweredQuestions.slice(0, 5),
    isMock: true
  };
}

module.exports = {
  analyzeTranscriptMock
};
