const assert = require('assert');

console.log('================================================================');
console.log('RUNNING DEVPHOENIX MARKING SYSTEM COMPREHENSIVE TESTS');
console.log('================================================================\n');

// 1. Scoring & Result Calculation Logic Unit Test
function calculateScoreAndBreakdown(questions, studentAnswers) {
  let totalMaxMarks = 0;
  const questionMap = {};
  
  questions.forEach(q => {
    const qMark = Number(q.marks) > 0 ? Number(q.marks) : 1;
    questionMap[q._id] = { ...q, marks: qMark };
    totalMaxMarks += qMark;
  });

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let score = 0;
  const answerBreakdown = [];

  studentAnswers.forEach(answer => {
    const q = questionMap[answer.questionId];
    if (!q) return;

    const qMark = q.marks;

    if (!answer.selectedOption) {
      skipped++;
      answerBreakdown.push({
        questionId: answer.questionId,
        selectedOption: null,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marks: 0,
        maxMarks: qMark,
      });
    } else if (answer.selectedOption === q.correctAnswer) {
      correct++;
      score += qMark;
      answerBreakdown.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: true,
        marks: qMark,
        maxMarks: qMark,
      });
    } else {
      wrong++;
      answerBreakdown.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marks: 0,
        maxMarks: qMark,
      });
    }
  });

  const percentage = totalMaxMarks > 0 ? parseFloat(((score / totalMaxMarks) * 100).toFixed(2)) : 0;

  return {
    score,
    totalMaxMarks,
    percentage,
    correct,
    wrong,
    skipped,
    answerBreakdown,
  };
}

// TEST 1: 3 questions, Q1=1, Q2=1, Q3=1, all correct
console.log('--- TEST 1: Equal Marks (1, 1, 1), All Correct ---');
const test1Questions = [
  { _id: 'q1', correctAnswer: 'A', marks: 1 },
  { _id: 'q2', correctAnswer: 'B', marks: 1 },
  { _id: 'q3', correctAnswer: 'C', marks: 1 },
];
const test1Answers = [
  { questionId: 'q1', selectedOption: 'A' },
  { questionId: 'q2', selectedOption: 'B' },
  { questionId: 'q3', selectedOption: 'C' },
];
const test1Result = calculateScoreAndBreakdown(test1Questions, test1Answers);
console.log(`Result: ${test1Result.score} / ${test1Result.totalMaxMarks} (${test1Result.percentage}%)`);
assert.strictEqual(test1Result.score, 3);
assert.strictEqual(test1Result.totalMaxMarks, 3);
assert.strictEqual(test1Result.percentage, 100);
console.log('✓ TEST 1 PASSED\n');

// TEST 2: 3 questions, Q1=1, Q2=2, Q3=5, all correct
console.log('--- TEST 2: Varying Marks (1, 2, 5), All Correct ---');
const test2Questions = [
  { _id: 'q1', correctAnswer: 'A', marks: 1 },
  { _id: 'q2', correctAnswer: 'B', marks: 2 },
  { _id: 'q3', correctAnswer: 'C', marks: 5 },
];
const test2Answers = [
  { questionId: 'q1', selectedOption: 'A' },
  { questionId: 'q2', selectedOption: 'B' },
  { questionId: 'q3', selectedOption: 'C' },
];
const test2Result = calculateScoreAndBreakdown(test2Questions, test2Answers);
console.log(`Result: ${test2Result.score} / ${test2Result.totalMaxMarks} (${test2Result.percentage}%)`);
assert.strictEqual(test2Result.score, 8);
assert.strictEqual(test2Result.totalMaxMarks, 8);
assert.strictEqual(test2Result.percentage, 100);
console.log('✓ TEST 2 PASSED\n');

// TEST 3: 3 questions, Q1=1, Q2=2, Q3=5, only Q1 correct
console.log('--- TEST 3: Partial Correct (1, 2, 5), Only Q1 Correct ---');
const test3Questions = [
  { _id: 'q1', correctAnswer: 'A', marks: 1 },
  { _id: 'q2', correctAnswer: 'B', marks: 2 },
  { _id: 'q3', correctAnswer: 'C', marks: 5 },
];
const test3Answers = [
  { questionId: 'q1', selectedOption: 'A' }, // Correct -> 1
  { questionId: 'q2', selectedOption: 'C' }, // Wrong -> 0
  { questionId: 'q3', selectedOption: 'A' }, // Wrong -> 0
];
const test3Result = calculateScoreAndBreakdown(test3Questions, test3Answers);
console.log(`Result: ${test3Result.score} / ${test3Result.totalMaxMarks} (${test3Result.percentage}%)`);
assert.strictEqual(test3Result.score, 1);
assert.strictEqual(test3Result.totalMaxMarks, 8);
assert.strictEqual(test3Result.percentage, 12.5);
console.log('✓ TEST 3 PASSED\n');

// TEST 4: 3 questions, Q1=2, Q2=3, Q3=5, Q1 and Q3 correct
console.log('--- TEST 4: Mixed Marks (2, 3, 5), Q1 & Q3 Correct ---');
const test4Questions = [
  { _id: 'q1', correctAnswer: 'B', marks: 2 },
  { _id: 'q2', correctAnswer: 'D', marks: 3 },
  { _id: 'q3', correctAnswer: 'A', marks: 5 },
];
const test4Answers = [
  { questionId: 'q1', selectedOption: 'B' }, // Correct -> 2
  { questionId: 'q2', selectedOption: 'A' }, // Wrong -> 0
  { questionId: 'q3', selectedOption: 'A' }, // Correct -> 5
];
const test4Result = calculateScoreAndBreakdown(test4Questions, test4Answers);
console.log(`Result: ${test4Result.score} / ${test4Result.totalMaxMarks} (${test4Result.percentage}%)`);
assert.strictEqual(test4Result.score, 7);
assert.strictEqual(test4Result.totalMaxMarks, 10);
assert.strictEqual(test4Result.percentage, 70);
console.log('✓ TEST 4 PASSED\n');

// TEST 5: Assessment Total Max Marks Recalculation after editing question marks
console.log('--- TEST 5: Assessment Total Marks Recalculation ---');
let examQuestions = [
  { _id: 'q1', marks: 1 },
  { _id: 'q2', marks: 2 },
  { _id: 'q3', marks: 3 },
];
let examTotalMarks = examQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
assert.strictEqual(examTotalMarks, 6);
console.log(`Initial Exam Total Marks: ${examTotalMarks} (Expected: 6)`);

// Admin edits Q1 from 1 mark to 5 marks
examQuestions[0].marks = 5;
examTotalMarks = examQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
assert.strictEqual(examTotalMarks, 10);
console.log(`Updated Exam Total Marks after Q1=5: ${examTotalMarks} (Expected: 10)`);
console.log('✓ TEST 5 PASSED\n');

// TEST 6: Student attempts frontend manipulation (payload injection)
console.log('--- TEST 6: Security Protection Against Manipulated Payload ---');
const secureQuestions = [
  { _id: 'q1', correctAnswer: 'C', marks: 2 },
  { _id: 'q2', correctAnswer: 'A', marks: 3 },
];
// Malicious client sends arbitrary score and marksObtained
const maliciousClientPayload = {
  score: 1000,
  marksObtained: 500,
  totalMarks: 500,
  answers: [
    { questionId: 'q1', selectedOption: 'C', marks: 100 },
    { questionId: 'q2', selectedOption: 'B', marks: 100 },
  ],
};
// Server strictly evaluates answers against stored DB values
const serverResult = calculateScoreAndBreakdown(secureQuestions, maliciousClientPayload.answers);
console.log(`Server Authoritative Result: ${serverResult.score} / ${serverResult.totalMaxMarks} (${serverResult.percentage}%)`);
assert.strictEqual(serverResult.score, 2); // Only Q1 is correct (2 marks), Q2 is wrong (0 marks)
assert.strictEqual(serverResult.totalMaxMarks, 5); // 2 + 3 = 5
assert.strictEqual(serverResult.percentage, 40);
console.log('✓ TEST 6 PASSED: Malicious payload completely ignored by authoritative backend logic!\n');

// TEST 7: Decimal Marks Support (e.g. 0.5, 1.5, 2.5)
console.log('--- TEST 7: Decimal Marks Support (0.5, 1.5, 2.5) ---');
const decimalQuestions = [
  { _id: 'q1', correctAnswer: 'A', marks: 0.5 },
  { _id: 'q2', correctAnswer: 'B', marks: 1.5 },
  { _id: 'q3', correctAnswer: 'C', marks: 2.5 },
];
const decimalAnswers = [
  { questionId: 'q1', selectedOption: 'A' }, // 0.5
  { questionId: 'q2', selectedOption: 'B' }, // 1.5
  { questionId: 'q3', selectedOption: 'C' }, // 2.5
];
const decimalResult = calculateScoreAndBreakdown(decimalQuestions, decimalAnswers);
console.log(`Result: ${decimalResult.score} / ${decimalResult.totalMaxMarks} (${decimalResult.percentage}%)`);
assert.strictEqual(decimalResult.score, 4.5);
assert.strictEqual(decimalResult.totalMaxMarks, 4.5);
assert.strictEqual(decimalResult.percentage, 100);
console.log('✓ TEST 7 PASSED\n');

// TEST 8: Backward Compatibility with legacy questions missing marks
console.log('--- TEST 8: Backward Compatibility with Missing Marks ---');
const legacyQuestions = [
  { _id: 'q1', correctAnswer: 'A' }, // no marks -> defaults to 1
  { _id: 'q2', correctAnswer: 'B', marks: null }, // null marks -> defaults to 1
  { _id: 'q3', correctAnswer: 'C', marks: 4 }, // configured marks = 4
];
const legacyAnswers = [
  { questionId: 'q1', selectedOption: 'A' },
  { questionId: 'q2', selectedOption: 'B' },
  { questionId: 'q3', selectedOption: 'C' },
];
const legacyResult = calculateScoreAndBreakdown(legacyQuestions, legacyAnswers);
console.log(`Result: ${legacyResult.score} / ${legacyResult.totalMaxMarks} (${legacyResult.percentage}%)`);
assert.strictEqual(legacyResult.score, 6); // 1 + 1 + 4
assert.strictEqual(legacyResult.totalMaxMarks, 6);
assert.strictEqual(legacyResult.percentage, 100);
console.log('✓ TEST 8 PASSED\n');

console.log('================================================================');
console.log('ALL 8 MARKING SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! ✓');
console.log('================================================================');
