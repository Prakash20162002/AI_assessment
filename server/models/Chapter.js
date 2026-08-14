const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Chapter name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring chapter name is unique within the same subject
chapterSchema.index({ subjectId: 1, name: 1 }, { unique: true });
chapterSchema.index({ subjectId: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
