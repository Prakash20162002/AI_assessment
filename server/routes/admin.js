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
  getResultById,
  getCheatLogs,
  getActiveSessions,
  downloadExcelReport,
  downloadPDFReport,
  downloadQuestionTemplate,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getStudents,
  updateStudent,
  deleteStudent,
  clearAllStudents,
  clearAllResults,
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

// Enforce no-cache headers on all dynamic admin API endpoints
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Dashboard
router.get('/stats', getDashboardStats);

// Subject management
router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

// Student management
router.route('/students').get(getStudents).delete(clearAllStudents);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

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
router.route('/results').get(getAllResults).delete(clearAllResults);
router.get('/results/:id', getResultById);
router.get('/cheat-logs', getCheatLogs);

// Reports
router.get('/reports/excel', downloadExcelReport);
router.get('/reports/pdf/:resultId', downloadPDFReport);
router.get('/reports/question-template', downloadQuestionTemplate);

module.exports = router;

