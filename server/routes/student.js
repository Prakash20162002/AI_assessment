const express = require('express');
const router = express.Router();
const { protect, requireStudent, requireVerified } = require('../middleware/authMiddleware');
const {
  getAvailableExams,
  getPublicExamDetails,
  getExamById,
  startExam,
  saveAnswer,
  submitExam,
  logCheatEvent,
  getMyResults,
  getResultDetail,
} = require('../controllers/studentController');
const { getSubjects } = require('../controllers/adminController');

// Public preview route for unauthenticated / landing checks
router.get('/exams/:id/public', getPublicExamDetails);

// All student routes require authentication, student role, and verified email
router.use(protect, requireStudent, requireVerified);

router.get('/subjects', getSubjects);
router.get('/exams', getAvailableExams);
router.get('/exams/:id', getExamById);
router.post('/exams/:id/start', startExam);
router.post('/exams/:id/save-answer', saveAnswer);
router.post('/exams/:id/submit', submitExam);
router.post('/cheat/log', logCheatEvent);
router.get('/results', getMyResults);
router.get('/results/:id', getResultDetail);

module.exports = router;
