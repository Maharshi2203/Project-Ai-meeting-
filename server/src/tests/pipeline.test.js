const assert = require('assert');
const { validateAndSanitizeAIOutput } = require('../services/aiService');
const { enforceBusinessRulesOnAIOutput, isBlacklistedOwner, isQuestionTask } = require('../utils/aiSafetyValidator');
const { analyzeTranscriptMock } = require('../services/mockAiService');

console.log('=== RUNNING AI PIPELINE & SAFETY REGRESSION TESTS ===\n');

let passedCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`[PASS] Test ${totalCount}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalCount}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// Test 1: Blacklisted Owner Protection
test('Blacklisted question words should be detected and forbidden as owners', () => {
  assert.strictEqual(isBlacklistedOwner('Who'), true);
  assert.strictEqual(isBlacklistedOwner('What'), true);
  assert.strictEqual(isBlacklistedOwner('How'), true);
  assert.strictEqual(isBlacklistedOwner('Why'), true);
  assert.strictEqual(isBlacklistedOwner('When'), true);
  assert.strictEqual(isBlacklistedOwner('Maria'), false);
  assert.strictEqual(isBlacklistedOwner('James'), false);
});

// Test 2: Question vs Action Task Detection
test('Question sentences must be classified as questions, not actions', () => {
  assert.strictEqual(isQuestionTask('Who will provide the existing FAQ content and support response templates?'), true);
  assert.strictEqual(isQuestionTask('Who will confirm the final data retention policy?'), true);
  assert.strictEqual(isQuestionTask('Maria: What can realistically be delivered?'), true);
  assert.strictEqual(isQuestionTask('How are tickets currently assigned?'), true);
  assert.strictEqual(isQuestionTask('Maria will confirm the data retention policy with legal by Friday.'), false);
  assert.strictEqual(isQuestionTask('James will provide FAQ.'), false);
});

// Test 3: Regression Case 1 - "Who" question word bug
test('Regression Case 1: "Who will provide the existing FAQ..." must NOT become an action item with owner "Who"', () => {
  const mockRaw = {
    summary: 'Test summary',
    actionItems: [
      { task: 'Who will provide the existing FAQ content and support response templates?', owner: 'Who' }
    ],
    unansweredQuestions: []
  };

  const sanitized = validateAndSanitizeAIOutput(mockRaw);
  assert.strictEqual(sanitized.actionItems.length, 0, 'Action items should be empty');
  assert.strictEqual(sanitized.unansweredQuestions.length, 1, 'Should be placed in unansweredQuestions');
  assert.strictEqual(sanitized.unansweredQuestions[0], 'Who will provide the existing FAQ content and support response templates?');
});

// Test 4: Regression Case 2 - "Neha: Who will confirm..."
test('Regression Case 2: "Neha: Who will confirm..." must be moved to unansweredQuestions', () => {
  const mockRaw = {
    summary: 'Test summary',
    actionItems: [
      { task: 'Neha: Who will confirm the final data retention policy?', owner: 'Who' }
    ],
    unansweredQuestions: []
  };

  const sanitized = validateAndSanitizeAIOutput(mockRaw);
  assert.strictEqual(sanitized.actionItems.length, 0);
  assert.strictEqual(sanitized.unansweredQuestions.includes('Neha: Who will confirm the final data retention policy?'), true);
});

// Test 5: Regression Case 3 - "Maria: What can realistically be delivered?"
test('Regression Case 3: "Maria: What..." must NOT have owner "What"', () => {
  const mockRaw = {
    summary: 'Test summary',
    actionItems: [
      { task: 'Maria: What can realistically be delivered?', owner: 'What' }
    ],
    unansweredQuestions: []
  };

  const sanitized = validateAndSanitizeAIOutput(mockRaw);
  assert.strictEqual(sanitized.actionItems.length, 0);
  assert.strictEqual(sanitized.unansweredQuestions.includes('Maria: What can realistically be delivered?'), true);
});

// Test 6: Regression Case 4 - Genuine Action "Maria will confirm..."
test('Regression Case 4: Genuine commitment "Maria will confirm..." must extract Action and Owner "Maria"', () => {
  const mockRaw = {
    summary: 'Test summary',
    actionItems: [
      { task: 'Confirm the data retention policy with legal by Friday', owner: 'Maria', dueDate: '2026-09-05', evidence: 'Maria will confirm the data retention policy with legal by Friday.' }
    ],
    unansweredQuestions: []
  };

  const sanitized = validateAndSanitizeAIOutput(mockRaw);
  assert.strictEqual(sanitized.actionItems.length, 1);
  assert.strictEqual(sanitized.actionItems[0].owner, 'Maria');
  assert.strictEqual(sanitized.actionItems[0].task, 'Confirm the data retention policy with legal by Friday');
});

// Test 7: Full Mock Transcript Analysis
test('Full Mock Transcript Analysis correctly separates actions from questions', () => {
  const transcript = `
Neha: Who will provide the existing FAQ content and support response templates?
Maria: I will check with our legal consultant by Friday.
Maria will confirm the data retention policy with legal by Friday.
How are tickets currently assigned?
James will provide the FAQ.
`;

  const result = analyzeTranscriptMock(transcript);
  const validated = validateAndSanitizeAIOutput(result);

  assert.strictEqual(validated.actionItems.some(a => a.owner === 'Who' || a.owner === 'How'), false, 'Question words must never be owners');
  assert.strictEqual(validated.unansweredQuestions.some(q => q.includes('Who will provide')), true, 'Question must be in unansweredQuestions');
});

console.log(`\n=== SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED ===\n`);

if (passedCount !== totalCount) {
  process.exit(1);
}
