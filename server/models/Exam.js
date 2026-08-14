const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: [0, 'Total marks cannot be negative'],
    },
    passingMarks: {
      type: Number,
      default: 0,
      min: [0, 'Passing marks cannot be negative'],
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    allowResume: {
      type: Boolean,
      default: true,
    },
    maxWarnings: {
      type: Number,
      default: 3,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    showResultImmediately: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    questionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual: is exam currently active
examSchema.virtual('isActive').get(function () {
  const now = new Date();
  if (this.startTime && this.endTime) {
    return this.isPublished && now >= this.startTime && now <= this.endTime;
  }
  return this.isPublished;
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
