const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const Result = require('../models/Result');
const ExamSession = require('../models/ExamSession');
const CheatingLog = require('../models/CheatingLog');
const Subject = require('../models/Subject');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── Exam CRUD ────────────────────────────────────────────────────────────────

// @desc    Get all exams
// @route   GET /api/admin/exams
const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find()
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

// Helper to synchronize exam totalMarks and questionCount from actual questions
const syncExamStats = async (examId) => {
  const questions = await Question.find({ examId });
  const questionCount = questions.length;
  const totalMarks = questions.reduce((sum, q) => {
    const val = Number(q.marks);
    return sum + (val > 0 ? val : 1);
  }, 0);
  await Exam.findByIdAndUpdate(examId, { questionCount, totalMarks });
  return { questionCount, totalMarks };
};

// ─── Question Management ──────────────────────────────────────────────────────

// @desc    Get questions (all platform questions, or filtered by subjectId / examId)
// @route   GET /api/admin/questions OR GET /api/admin/exams/:id/questions
const getQuestions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.params.id) {
      // Called via /api/admin/exams/:id/questions
      const exam = await Exam.findById(req.params.id);
      if (exam && exam.subjectId) {
        filter.$or = [{ examId: exam._id }, { subjectId: exam.subjectId }];
      } else {
        filter.examId = req.params.id;
      }
    } else {
      if (req.query.subjectId) filter.subjectId = req.query.subjectId;
      if (req.query.examId) filter.examId = req.query.examId;
    }

    const questions = await Question.find(filter)
      .sort({ createdAt: 1, order: 1 })
      .populate('subjectId', 'name color')
      .populate('examId', 'title');

    const normalizedQuestions = questions.map((q) => {
      const qObj = q.toObject();
      return {
        ...qObj,
        id: qObj._id,
        subjectId: qObj.subjectId?._id ? qObj.subjectId._id.toString() : (qObj.subjectId ? qObj.subjectId.toString() : ''),
        marks: Number(qObj.marks) > 0 ? Number(qObj.marks) : 1,
      };
    });

    res.json({ success: true, count: normalizedQuestions.length, data: normalizedQuestions });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a single question (supports Subject Bank and Exam assignment)
// @route   POST /api/admin/questions OR POST /api/admin/exams/:id/questions
const addQuestion = async (req, res, next) => {
  try {
    const { subjectId, questionText, options, correctAnswer, marks, explanation, examId } = req.body;
    const targetExamId = req.params.id || examId || null;

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }
    if (!options || !options.A || !options.B || !options.C || !options.D) {
      return res.status(400).json({ success: false, message: 'All 4 options (A, B, C, D) are required' });
    }
    if (!correctAnswer || !['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ success: false, message: 'Valid correct answer (A, B, C, or D) is required' });
    }

    let parsedMarks = 1;
    if (marks !== undefined && marks !== null && marks !== '') {
      const val = Number(marks);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ success: false, message: 'Marks must be greater than 0' });
      }
      parsedMarks = val;
    }

    let resolvedSubjectId = subjectId || null;
    let resolvedSubjectName = '';

    if (resolvedSubjectId) {
      const sub = await Subject.findById(resolvedSubjectId);
      if (sub) {
        resolvedSubjectName = sub.name;
      }
    } else if (targetExamId) {
      const exam = await Exam.findById(targetExamId);
      if (exam) {
        resolvedSubjectId = exam.subjectId || null;
        resolvedSubjectName = exam.subject || '';
      }
    }

    const count = await Question.countDocuments(
      resolvedSubjectId ? { subjectId: resolvedSubjectId } : (targetExamId ? { examId: targetExamId } : {})
    );

    const question = await Question.create({
      questionText: questionText.trim(),
      options: {
        A: String(options.A).trim(),
        B: String(options.B).trim(),
        C: String(options.C).trim(),
        D: String(options.D).trim(),
      },
      correctAnswer,
      marks: parsedMarks,
      explanation: (explanation || '').trim(),
      subjectId: resolvedSubjectId,
      subjectName: resolvedSubjectName,
      examId: targetExamId,
      order: count,
      createdBy: req.user?._id || null,
    });

    if (targetExamId) {
      await syncExamStats(targetExamId);
    }

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

      let qMarks = 1;
      if (marks !== undefined && marks !== null) {
        const parsed = Number(marks);
        if (!isNaN(parsed) && parsed > 0) {
          qMarks = parsed;
        }
      }

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
        marks: qMarks,
        explanation: explanation ? String(explanation).trim() : '',
        order: existingCount++,
      });
    });

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found in Excel file' });
    }

    await Question.insertMany(questions);
    await syncExamStats(req.params.id);

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
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const { questionText, options, correctAnswer, marks, explanation, subjectId, examId } = req.body;

    if (questionText && questionText.trim()) question.questionText = questionText.trim();
    if (options) {
      if (options.A !== undefined) question.options.A = String(options.A).trim();
      if (options.B !== undefined) question.options.B = String(options.B).trim();
      if (options.C !== undefined) question.options.C = String(options.C).trim();
      if (options.D !== undefined) question.options.D = String(options.D).trim();
    }
    if (correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      question.correctAnswer = correctAnswer;
    }
    if (marks !== undefined && marks !== null && marks !== '') {
      const val = Number(marks);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ success: false, message: 'Marks must be greater than 0' });
      }
      question.marks = val;
    }
    if (explanation !== undefined) question.explanation = String(explanation).trim();

    if (subjectId) {
      const sub = await Subject.findById(subjectId);
      if (sub) {
        question.subjectId = sub._id;
        question.subjectName = sub.name;
      }
    }
    if (examId !== undefined) question.examId = examId || null;

    await question.save();

    if (question.examId) {
      await syncExamStats(question.examId);
    }

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

    const examId = question.examId;
    await question.deleteOne();

    if (examId) {
      await syncExamStats(examId);
    }

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalSubjects,
      totalQuestions,
      totalExams,
      publishedExams,
      totalStudents,
      activeSessionsCount,
      resultsCount,
    ] = await Promise.all([
      Subject.countDocuments(),
      Question.countDocuments(),
      Exam.countDocuments(),
      Exam.countDocuments({ isPublished: true }),
      User.countDocuments({ role: 'student' }),
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
        totalSubjects,
        totalQuestions,
        totalExams,
        publishedExams,
        totalStudents,
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
      .populate('sessionId', 'warningCount status startedAt submittedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [results, total] = await Promise.all([resultsQuery, Result.countDocuments(query)]);

    // Attach integrity status indicator based on warning count & cheating logs
    const enhancedResults = await Promise.all(
      results.map(async (resObj) => {
        const r = resObj.toObject();
        const logsCount = await CheatingLog.countDocuments({
          studentId: r.studentId?._id,
          examId: r.examId?._id,
        });

        const warningCount = r.sessionId?.warningCount || 0;
        const sessionStatus = r.sessionId?.status || 'submitted';

        let integrityStatus = 'Normal';
        if (sessionStatus === 'voided' || warningCount >= 3) {
          integrityStatus = 'Flagged';
        } else if (warningCount === 2 || logsCount >= 3) {
          integrityStatus = 'Suspicious';
        } else if (warningCount === 1 || logsCount >= 1) {
          integrityStatus = 'Warning';
        }

        return {
          ...r,
          violationCount: warningCount,
          cheatingLogsCount: logsCount,
          integrityStatus,
        };
      })
    );

    res.json({
      success: true,
      count: enhancedResults.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: enhancedResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single result details for admin review
// @route   GET /api/admin/results/:id
const getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('examId', 'title duration totalMarks passingMarks')
      .populate('sessionId', 'warningCount status startedAt submittedAt')
      .populate('answerBreakdown.questionId', 'questionText options marks explanation correctAnswer');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Fetch proctoring audit logs for this session / attempt
    let proctorLogs = [];
    try {
      proctorLogs = await CheatingLog.find({
        $or: [
          { sessionId: result.sessionId?._id || result.sessionId },
          { studentId: result.studentId?._id || result.studentId, examId: result.examId?._id || result.examId }
        ]
      }).sort({ timestamp: 1, createdAt: 1 });
    } catch (_) {}

    // Ensure answer breakdown has complete question data
    const resultObj = result.toObject();
    const enrichedAnswers = (resultObj.answerBreakdown || []).map((item, index) => {
      const q = item.questionId || {};
      const qText = item.questionText || q.questionText || `Question ${index + 1}`;
      const options = item.options || q.options || {};
      const correctAns = item.correctAnswer || q.correctAnswer || '';
      const stuAns = item.selectedOption || null;
      const isCor = item.isCorrect ?? (stuAns && stuAns === correctAns);
      const maxMarks = item.maxMarks || item.marks || q.marks || 1;
      const awardedMarks = isCor ? maxMarks : 0;
      const explanation = item.explanation || q.explanation || '';

      return {
        ...item,
        questionText: qText,
        options,
        correctAnswer: correctAns,
        selectedOption: stuAns,
        isCorrect: isCor,
        marks: awardedMarks,
        maxMarks,
        explanation,
      };
    });

    res.json({
      success: true,
      data: {
        ...resultObj,
        answerBreakdown: enrichedAnswers,
        proctorLogs,
      },
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

// ─── Subject Management ───────────────────────────────────────────────────────

// @desc    Get all subjects
// @route   GET /api/admin/subjects
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/admin/subjects
const createSubject = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }
    const cleanName = name.trim();
    const existing = await Subject.findOne({
      name: new RegExp('^' + cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A subject with this name already exists' });
    }
    const subject = await Subject.create({
      name: cleanName,
      color: color || '#e63946',
      description: description || '',
      createdBy: req.user?._id || null,
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
const updateSubject = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    if (name && name.trim()) {
      const cleanName = name.trim();
      const existing = await Subject.findOne({
        _id: { $ne: subject._id },
        name: new RegExp('^' + cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another subject with this name already exists' });
      }
      subject.name = cleanName;
    }
    if (color) subject.color = color;
    if (description !== undefined) subject.description = description;
    await subject.save();
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade delete questions associated with this subject to prevent orphaned questions
    await Question.deleteMany({
      $or: [{ subjectId: subject._id }, { subjectName: subject.name }],
    });

    // Delete exams associated with this subject
    await Exam.deleteMany({
      $or: [{ subjectId: subject._id }, { subject: subject.name }],
    });

    await subject.deleteOne();
    res.json({ success: true, message: 'Subject and associated questions and exams deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Student Management ───────────────────────────────────────────────────────

// @desc    Get all students
// @route   GET /api/admin/students
const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password -otp -otpExpiry -refreshToken')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student record
// @route   PUT /api/admin/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const { name, email, isVerified } = req.body;
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    if (name && name.trim()) student.name = name.trim();
    if (email && email.trim()) student.email = email.trim().toLowerCase();
    if (isVerified !== undefined) student.isVerified = isVerified;
    await student.save();
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student record
// @route   DELETE /api/admin/students/:id
const deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    await Result.deleteMany({ studentId: student._id });
    await ExamSession.deleteMany({ studentId: student._id });
    await CheatingLog.deleteMany({ studentId: student._id });
    await student.deleteOne();
    res.json({ success: true, message: 'Student record and associated session data deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all student records
// @route   DELETE /api/admin/students
const clearAllStudents = async (req, res, next) => {
  try {
    const studentIds = await User.find({ role: 'student' }).distinct('_id');
    await Result.deleteMany({ studentId: { $in: studentIds } });
    await ExamSession.deleteMany({ studentId: { $in: studentIds } });
    await CheatingLog.deleteMany({ studentId: { $in: studentIds } });
    await User.deleteMany({ role: 'student' });
    res.json({ success: true, message: 'All student records cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all exam results
// @route   DELETE /api/admin/results
const clearAllResults = async (req, res, next) => {
  try {
    await Result.deleteMany({});
    await CheatingLog.deleteMany({});
    await ExamSession.deleteMany({});
    res.json({ success: true, message: 'All results and proctor audit logs cleared' });
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
};
