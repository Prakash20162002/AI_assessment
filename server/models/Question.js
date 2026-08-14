const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true,
      default: null,
    },
    subjectName: {
      type: String,
      trim: true,
      default: '',
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      index: true,
      default: null,
    },
    chapterName: {
      type: String,
      trim: true,
      default: '',
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      index: true,
      default: null,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      enum: ['A', 'B', 'C', 'D'],
    },
    marks: {
      type: Number,
      required: [true, 'Marks is required'],
      default: 1,
      min: [0.01, 'Marks must be greater than 0'],
    },
    negativeMark: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

questionSchema.index({ subjectId: 1, chapterId: 1 });
questionSchema.index({ examId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);

