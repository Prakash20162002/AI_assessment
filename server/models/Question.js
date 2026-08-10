const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
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
      default: 1,
      min: [1, 'Marks must be at least 1'],
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
  },
  { timestamps: true }
);

questionSchema.index({ examId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
