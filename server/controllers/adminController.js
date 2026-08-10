const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const Result = require('../models/Result');
const ExamSession = require('../models/ExamSession');
const CheatingLog = require('../models/CheatingLog');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── Exam CRUD ────────────────────────────────────────────────────────────────

// @desc    Get all exams
// @route   GET /api/admin/exams
const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    next(error);
  }
};

// @desc    Create exam
// @route   POST /api/admin/exams
const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exam
// @route   GET /api/admin/exams/:id
const getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('createdBy', 'name email');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam
// @route   PUT /api/admin/exams/:id
const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete exam
// @route   DELETE /api/admin/exams/:id
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Delete related data
    await Question.deleteMany({ examId: exam._id });
    await ExamSession.deleteMany({ examId: exam._id });
    await Result.deleteMany({ examId: exam._id });
    await CheatingLog.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.json({ success: true, message: 'Exam and all related data deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle publish status
// @route   PATCH /api/admin/exams/:id/publish
const togglePublish = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    exam.isPublished = !exam.isPublished;
    await exam.save();

    res.json({
      success: true,
      message: `Exam ${exam.isPublished ? 'published' : 'unpublished'}`,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Question Management ──────────────────────────────────────────────────────

// @desc    Get all questions for an exam
// @route   GET /api/admin/exams/:id/questions
const getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({ examId: req.params.id }).sort({ order: 1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a single question
// @route   POST /api/admin/exams/:id/questions
const addQuestion = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const count = await Question.countDocuments({ examId: req.params.id });
    const question = await Question.create({
      ...req.body,
      examId: req.params.id,
      order: count,
    });

    // Update exam question count
    await Exam.findByIdAndUpdate(req.params.id, { $inc: { questionCount: 1 } });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upload questions from Excel
// @route   POST /api/admin/exams/:id/questions/bulk
const bulkUploadQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    const questions = [];
    let existingCount = await Question.countDocuments({ examId: req.params.id });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const [, questionText, optA, optB, optC, optD, correctAnswer, marks, explanation] = row.values;

      if (!questionText || !optA || !optB || !optC || !optD || !correctAnswer) return;

      const answer = String(correctAnswer).toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(answer)) return;

      questions.push({
        examId: req.params.id,
        questionText: String(questionText).trim(),
        options: {
          A: String(optA).trim(),
          B: String(optB).trim(),
          C: String(optC).trim(),
          D: String(optD).trim(),
        },
        correctAnswer: answer,
        marks: marks ? parseInt(marks) : 1,
        explanation: explanation ? String(explanation).trim() : '',
        order: existingCount++,
      });
    });

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found in Excel file' });
    }

    await Question.insertMany(questions);
    await Exam.findByIdAndUpdate(req.params.id, { $inc: { questionCount: questions.length } });

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `${questions.length} questions imported successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/admin/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/admin/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    await Exam.findByIdAndUpdate(question.examId, { $inc: { questionCount: -1 } });
    await question.deleteOne();

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalStudents, totalExams, publishedExams, activeSessionsCount, resultsCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments({ createdBy: req.user._id }),
      Exam.countDocuments({ createdBy: req.user._id, isPublished: true }),
      ExamSession.countDocuments({ status: 'ongoing' }),
      Result.countDocuments(),
    ]);

    const recentResults = await Result.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .populate('examId', 'title');

    res.json({
      success: true,
      data: {
        totalStudents,
        totalExams,
        publishedExams,
        activeSessionsCount,
        resultsCount,
        recentResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Results & Logs ───────────────────────────────────────────────────────────

// @desc    Get all results
// @route   GET /api/admin/results
const getAllResults = async (req, res, next) => {
  try {
    const { examId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (examId) query.examId = examId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let resultsQuery = Result.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title duration passingMarks')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [results, total] = await Promise.all([resultsQuery, Result.countDocuments(query)]);

    res.json({
      success: true,
      count: results.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cheat logs
// @route   GET /api/admin/cheat-logs
const getCheatLogs = async (req, res, next) => {
  try {
    const { examId, studentId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (examId) query.examId = examId;
    if (studentId) query.studentId = studentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      CheatingLog.find(query)
        .populate('studentId', 'name email')
        .populate('examId', 'title')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CheatingLog.countDocuments(query),
    ]);

    res.json({ success: true, count: logs.length, total, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active exam sessions for monitoring
// @route   GET /api/admin/sessions/active
const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await ExamSession.find({ status: 'ongoing' })
      .populate('studentId', 'name email')
      .populate('examId', 'title duration')
      .sort({ startedAt: -1 });

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

// ─── Reports ─────────────────────────────────────────────────────────────────

// @desc    Download Excel report
// @route   GET /api/admin/reports/excel
const downloadExcelReport = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const query = examId ? { examId } : {};

    const results = await Result.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ExamPlatform';
    const sheet = workbook.addWorksheet('Results');

    sheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Exam', key: 'exam', width: 30 },
      { header: 'Total Questions', key: 'total', width: 16 },
      { header: 'Correct', key: 'correct', width: 12 },
      { header: 'Wrong', key: 'wrong', width: 12 },
      { header: 'Skipped', key: 'skipped', width: 12 },
      { header: 'Score', key: 'score', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
      { header: 'Result', key: 'result', width: 12 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

    results.forEach((r) => {
      sheet.addRow({
        name: r.studentId?.name || 'N/A',
        email: r.studentId?.email || 'N/A',
        exam: r.examId?.title || 'N/A',
        total: r.totalQuestions,
        correct: r.correct,
        wrong: r.wrong,
        skipped: r.skipped,
        score: `${r.score}/${r.totalMarks}`,
        percentage: `${r.percentage.toFixed(1)}%`,
        result: r.isPassed ? 'PASS' : 'FAIL',
        date: new Date(r.calculatedAt).toLocaleString(),
      });
    });

    // Color pass/fail column
    sheet.getColumn('result').eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) return;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: cell.value === 'PASS' ? 'FFD1FAE5' : 'FFFEE2E2' },
      };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="exam_results.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF result for a student
// @route   GET /api/admin/reports/pdf/:resultId
const downloadPDFReport = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate('studentId', 'name email')
      .populate('examId', 'title duration passingMarks totalMarks');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const cheatLogs = await CheatingLog.find({
      studentId: result.studentId._id,
      examId: result.examId._id,
    }).sort({ timestamp: 1 });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="result_${result._id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#6366f1').text('ExamPlatform', { align: 'center' });
    doc.fontSize(14).fillColor('#333').text('Exam Result Report', { align: 'center' });
    doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#6366f1').stroke();
    doc.moveDown();

    // Student info
    doc.fontSize(12).fillColor('#333');
    doc.text(`Student: ${result.studentId.name}`);
    doc.text(`Email: ${result.studentId.email}`);
    doc.text(`Exam: ${result.examId.title}`);
    doc.text(`Date: ${new Date(result.calculatedAt).toLocaleString()}`);
    doc.moveDown();

    // Score card
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke().moveDown(0.5);
    doc.fontSize(14).fillColor('#6366f1').text('Score Summary');
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#333');
    doc.text(`Total Questions: ${result.totalQuestions}`);
    doc.text(`Correct: ${result.correct}`);
    doc.text(`Wrong: ${result.wrong}`);
    doc.text(`Skipped: ${result.skipped}`);
    doc.text(`Score: ${result.score} / ${result.totalMarks}`);
    doc.text(`Percentage: ${result.percentage.toFixed(1)}%`);
    doc
      .fontSize(16)
      .fillColor(result.isPassed ? '#10b981' : '#ef4444')
      .text(`Result: ${result.isPassed ? 'PASS ✓' : 'FAIL ✗'}`, { align: 'center' });
    doc.moveDown();

    // Cheat log
    if (cheatLogs.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke().moveDown(0.5);
      doc.fontSize(14).fillColor('#ef4444').text('Anti-Cheat Log');
      doc.moveDown(0.3);
      cheatLogs.forEach((log) => {
        doc
          .fontSize(10)
          .fillColor('#555')
          .text(`• [${new Date(log.timestamp).toLocaleTimeString()}] ${log.eventType} — ${log.details || ''}`);
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Download Excel question template
// @route   GET /api/admin/reports/question-template
const downloadQuestionTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');

    sheet.columns = [
      { header: '#', key: 'no', width: 5 },
      { header: 'Question Text *', key: 'questionText', width: 50 },
      { header: 'Option A *', key: 'optA', width: 25 },
      { header: 'Option B *', key: 'optB', width: 25 },
      { header: 'Option C *', key: 'optC', width: 25 },
      { header: 'Option D *', key: 'optD', width: 25 },
      { header: 'Correct Answer (A/B/C/D) *', key: 'correct', width: 26 },
      { header: 'Marks', key: 'marks', width: 8 },
      { header: 'Explanation (optional)', key: 'explanation', width: 40 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

    // Example row
    sheet.addRow({
      no: 1,
      questionText: 'What is the capital of France?',
      optA: 'London',
      optB: 'Berlin',
      optC: 'Paris',
      optD: 'Rome',
      correct: 'C',
      marks: 1,
      explanation: 'Paris is the capital city of France.',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="question_template.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
