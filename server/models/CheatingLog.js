const mongoose = require('mongoose');

const cheatingLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'tab-switch',
        'window-blur',
        'window-focus',
        'fullscreen-exit',
        'refresh',
        'browser-close',
        'camera-off',
        'internet-lost',
        'multiple-faces',
        'no-face',
        'copy-paste',
        'right-click',
        'suspicious-activity',
        'assessment-started',
        'assessment-submitted',
        'time-expired',
      ],
    },
    details: {
      type: String,
      default: '',
    },
    warningNumberAtEvent: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

cheatingLogSchema.index({ studentId: 1, examId: 1, timestamp: -1 });

module.exports = mongoose.model('CheatingLog', cheatingLogSchema);
