const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    attempted: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    wrong: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    timeTaken: {
      type: Number, // in seconds
      default: 0,
    },
    // Detailed answer breakdown for review
    answerBreakdown: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: String,
        correctAnswer: String,
        isCorrect: Boolean,
        marks: Number,
        _id: false,
      },
    ],
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
