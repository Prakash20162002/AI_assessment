const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  togglePublish,
  getQuestions,
  addQuestion,
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
  getDashboardStats,
  getAllResults,
  getCheatLogs,
  getActiveSessions,
  downloadExcelReport,
  downloadPDFReport,
  downloadQuestionTemplate,
} = require('../controllers/adminController');

// Configure multer for Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.xlsx', '.xls'];
    if (allowedExts.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All admin routes require authentication + admin role
router.use(protect, requireAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Exam management
router.route('/exams').get(getExams).post(createExam);
router.route('/exams/:id').get(getExam).put(updateExam).delete(deleteExam);
router.patch('/exams/:id/publish', togglePublish);

// Question management
router.get('/exams/:id/questions', getQuestions);
router.post('/exams/:id/questions', addQuestion);
router.post('/exams/:id/questions/bulk', upload.single('file'), bulkUploadQuestions);
router.route('/questions/:id').put(updateQuestion).delete(deleteQuestion);

// Monitoring & results
router.get('/sessions/active', getActiveSessions);
router.get('/results', getAllResults);
router.get('/cheat-logs', getCheatLogs);

// Reports
router.get('/reports/excel', downloadExcelReport);
router.get('/reports/pdf/:resultId', downloadPDFReport);
router.get('/reports/question-template', downloadQuestionTemplate);

module.exports = router;
