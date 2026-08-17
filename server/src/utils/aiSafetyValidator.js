/**
 * AI Safety & Business Rule Validation Module
 * Enforces strict boundaries between Action Items, Questions, and Speaker/Owner identities.
 */

// Blacklisted question words and placeholder terms that MUST NEVER be assigned as owner names
const QUESTION_WORD_BLACK_LIST = new Set([
  'who', 'what', 'when', 'where', 'why', 'how',
  'can', 'could', 'would', 'should', 'will', 'shall',
  'is', 'are', 'do', 'does', 'did', 'maybe', 'perhaps',
  'please', 'note', 'n/a', 'na', 'none', 'unknown', 'tbd', 'pending',
  'question', 'someone', 'anyone', 'everyone', 'nobody',
  // Days & Time terms
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'today', 'tomorrow', 'yesterday',
  // Months
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'
]);

/**
 * Check if a given string is a question word or non-person placeholder.
 */
function isBlacklistedOwner(ownerName) {
  if (!ownerName || typeof ownerName !== 'string') return true;
  const cleaned = ownerName.trim().toLowerCase().replace(/[^a-z]/g, '');
  return QUESTION_WORD_BLACK_LIST.has(cleaned);
}

/**
 * Clean and validate owner identity.
 */
function sanitizeOwner(ownerName) {
  if (!ownerName || typeof ownerName !== 'string') return 'Unassigned';
  const trimmed = ownerName.trim();
  if (isBlacklistedOwner(trimmed)) {
    return 'Unassigned';
  }
  // Strip trailing colons or dialogue prefixes (e.g., "Neha:" -> "Neha")
  const cleanedName = trimmed.replace(/:$/, '').trim();
  return cleanedName.length > 0 ? cleanedName : 'Unassigned';
}

/**
 * Check whether a sentence or task description represents a Question rather than a actionable commitment.
 */
function isQuestionTask(taskText) {
  if (!taskText || typeof taskText !== 'string') return false;
  const trimmed = taskText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Ends with a question mark
  if (trimmed.endsWith('?')) {
    return true;
  }

  // 2. Starts with a question word or interrogative pattern (e.g., "Who will...", "What can...", "How are...")
  const startsWithQuestionWord = /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does|did)\b/i.test(lower);
  
  // Exception: If statement includes explicit assignment/commitment phrasing like "Maria will..."
  const hasStrongActionCommitment = /\b([a-z]+)\s+(will|shall|committed to|assigned to|is responsible for)\b/i.test(lower)
    && !/^(who|what|when|where|why|how)\s+(will|shall|can|could|is|are)/i.test(lower);

  if (startsWithQuestionWord && !hasStrongActionCommitment) {
    return true;
  }

  return false;
}

/**
 * Safety Net Validation for AI Structured Output.
 * Filters out question tasks from actionItems, converts suspicious owners to 'Unassigned',
 * and moves question tasks into unansweredQuestions array.
 */
function enforceBusinessRulesOnAIOutput(aiOutput) {
  if (!aiOutput || typeof aiOutput !== 'object') {
    return aiOutput;
  }

  const validActionItems = [];
  const unansweredQuestions = Array.isArray(aiOutput.unansweredQuestions)
    ? [...aiOutput.unansweredQuestions]
    : [];

  const rawActions = Array.isArray(aiOutput.actionItems) ? aiOutput.actionItems : [];

  rawActions.forEach(item => {
    if (!item || !item.task) return;

    const taskText = String(item.task).trim();
    const rawOwner = item.owner ? String(item.owner).trim() : '';

    // Business Check 1: Is this task actually a question?
    if (isQuestionTask(taskText)) {
      // Reclassify as an Unanswered Question!
      if (!unansweredQuestions.includes(taskText)) {
        unansweredQuestions.push(taskText);
      }
      return; // Do NOT save as action item!
    }

    // Business Check 2: Sanitize Owner
    let safeOwner = sanitizeOwner(rawOwner);

    // Additional check: If task text itself starts with "Speaker: Task", check if Speaker was wrongly used
    if (safeOwner === 'Unassigned') {
      const speakerMatch = taskText.match(/^([A-Z][a-zA-Z0-9_\s]{1,25}):\s*(.+)$/);
      if (speakerMatch) {
        const potentialSpeaker = speakerMatch[1].trim();
        if (!isBlacklistedOwner(potentialSpeaker)) {
          safeOwner = potentialSpeaker;
        }
      }
    }

    // Clean task title (strip prefix speaker name if redundant)
    let cleanTask = taskText;
    if (cleanTask.startsWith(`${safeOwner}:`)) {
      cleanTask = cleanTask.replace(`${safeOwner}:`, '').trim();
    }

    validActionItems.push({
      ...item,
      task: cleanTask,
      owner: safeOwner,
      dueDate: item.dueDate || null,
      priority: item.priority || 'Medium',
      status: item.status || 'Open',
      evidence: item.evidence || cleanTask
    });
  });

  return {
    ...aiOutput,
    actionItems: validActionItems,
    unansweredQuestions
  };
}

module.exports = {
  isBlacklistedOwner,
  sanitizeOwner,
  isQuestionTask,
  enforceBusinessRulesOnAIOutput
};
