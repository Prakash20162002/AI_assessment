const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const examSessionSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['not-started', 'ongoing', 'submitted', 'voided', 'timeout'],
      default: 'not-started',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    timeRemaining: {
      type: Number, // seconds remaining at last save
      default: null,
    },
    answers: [answerSchema],
    currentQuestion: {
      type: Number,
      default: 0,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    questionOrder: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index to ensure one session per student per exam
examSessionSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('ExamSession', examSessionSchema);
