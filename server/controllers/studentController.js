const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');
const CheatingLog = require('../models/CheatingLog');

// @desc    Get available (published) exams for student
// @route   GET /api/student/exams
const getAvailableExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ isPublished: true })
      .select('title description duration totalMarks passingMarks startTime endTime questionCount')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);
    const sessions = await ExamSession.find({
      studentId: req.user._id,
      examId: { $in: examIds },
    }).select('examId status warningCount');

    const sessionMap = {};
    sessions.forEach((s) => {
      sessionMap[s.examId.toString()] = { status: s.status, warningCount: s.warningCount };
    });

    const examsWithStatus = exams.map((exam) => {
      const sess = sessionMap[exam._id.toString()] || { status: 'not-started', warningCount: 0 };
      return {
        ...exam.toObject(),
        sessionStatus: sess.status,
        warningCount: sess.warningCount,
      };
    });

    res.json({ success: true, count: examsWithStatus.length, data: examsWithStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or resume an exam
// @route   POST /api/student/exams/:id/start
const startExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: 'Exam not found or not published' });
    }

    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      return res.status(400).json({ success: false, message: 'Exam has not started yet' });
    }
    if (exam.endTime && now > exam.endTime) {
      return res.status(400).json({ success: false, message: 'Exam period has ended' });
    }

    let session = await ExamSession.findOne({ studentId: req.user._id, examId: exam._id });

    if (session) {
      if (session.status === 'submitted' || session.status === 'timeout') {
        return res.status(400).json({ success: false, message: 'You have already submitted this assessment' });
      }
      if (session.status === 'voided') {
        return res.status(400).json({ success: false, message: 'Your assessment session was voided due to security violations' });
      }
      if (session.status === 'ongoing' && !exam.allowResume) {
        return res.status(400).json({ success: false, message: 'Resuming is disabled for this assessment' });
      }

      // Check if time expired on server
      const elapsedSeconds = session.startedAt ? Math.floor((now - session.startedAt) / 1000) : 0;
      const totalAllowed = exam.duration * 60;
      if (elapsedSeconds > totalAllowed + 30) {
        session.status = 'timeout';
        await session.save();
        return res.status(400).json({ success: false, message: 'Assessment duration has expired' });
      }

      session.status = 'ongoing';
      session.lastActive = new Date();
      await session.save();
    } else {
      // Get questions & order
      const questions = await Question.find({ examId: exam._id }).sort({ order: 1 }).select('_id');
      let questionOrder = questions.map((q) => q._id);

      if (exam.shuffleQuestions) {
        questionOrder = questionOrder.sort(() => Math.random() - 0.5);
      }

      session = await ExamSession.create({
        studentId: req.user._id,
        examId: exam._id,
        status: 'ongoing',
        startedAt: new Date(),
        timeRemaining: exam.duration * 60,
        questionOrder,
        answers: questionOrder.map((qId) => ({ questionId: qId, selectedOption: null })),
      });

      // Log assessment start
      await CheatingLog.create({
        studentId: req.user._id,
        examId: exam._id,
        sessionId: session._id,
        eventType: 'assessment-started',
        details: `Assessment started at ${new Date().toISOString()}`,
      });
    }

    // Fetch questions in session order WITHOUT correctAnswer or explanation
    const populatedQuestions = await Question.find({
      _id: { $in: session.questionOrder },
    }).select('-correctAnswer -explanation');

    const questionMap = {};
    populatedQuestions.forEach((q) => {
      const qObj = q.toObject();
      questionMap[q._id.toString()] = {
        ...qObj,
        marks: Number(qObj.marks) > 0 ? Number(qObj.marks) : 1,
      };
    });
    const orderedQuestions = session.questionOrder
      .map((id) => questionMap[id.toString()])
      .filter(Boolean);

    // Calculate actual total marks dynamically from questions
    const dynamicTotalMarks = orderedQuestions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0);

    // Calculate server authoritative remaining time
    const elapsedSeconds = Math.floor((now - session.startedAt) / 1000);
    const calculatedRemaining = Math.max(0, (exam.duration * 60) - elapsedSeconds);

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          startedAt: session.startedAt,
          timeRemaining: calculatedRemaining,
          currentQuestion: session.currentQuestion,
          warningCount: session.warningCount,
          answers: session.answers,
        },
        exam: {
          id: exam._id,
          title: exam.title,
          duration: exam.duration,
          totalMarks: dynamicTotalMarks || exam.totalMarks,
          passingMarks: exam.passingMarks,
          maxWarnings: exam.maxWarnings,
          questionCount: orderedQuestions.length,
        },
        questions: orderedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-save an answer
// @route   POST /api/student/exams/:id/save-answer
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption, currentQuestion, timeRemaining } = req.body;

    const session = await ExamSession.findOne({
      studentId: req.user._id,
      examId: req.params.id,
      status: 'ongoing',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const exam = await Exam.findById(req.params.id).select('duration');
    const now = new Date();
    const elapsedSeconds = session.startedAt ? Math.floor((now - session.startedAt) / 1000) : 0;
    const allowedDuration = (exam?.duration || 10) * 60;

    // Time cutoff enforcement (with 30s network buffer)
    if (elapsedSeconds > allowedDuration + 30) {
      session.status = 'timeout';
      await session.save();
      return res.status(400).json({ success: false, message: 'Time expired. Assessment automatically submitted.' });
    }

    // Update answer
    const answerIndex = session.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    if (answerIndex > -1) {
      session.answers[answerIndex].selectedOption = selectedOption;
      session.answers[answerIndex].answeredAt = new Date();
    } else {
      session.answers.push({
        questionId,
        selectedOption,
        answeredAt: new Date(),
      });
    }

    if (currentQuestion !== undefined) session.currentQuestion = currentQuestion;
    if (timeRemaining !== undefined) session.timeRemaining = Math.max(0, (allowedDuration - elapsedSeconds));

    await session.save();

    res.json({ success: true, message: 'Answer saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assessment & calculate authoritative score
// @route   POST /api/student/exams/:id/submit
const submitExam = async (req, res, next) => {
  try {
    const session = await ExamSession.findOne({
      studentId: req.user._id,
      examId: req.params.id,
      status: 'ongoing',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const exam = await Exam.findById(req.params.id);
    const now = new Date();
    const elapsedSeconds = session.startedAt ? Math.floor((now - session.startedAt) / 1000) : 0;
    const allowedDuration = exam.duration * 60;
    const isTimeout = elapsedSeconds > allowedDuration + 30;

    const questions = await Question.find({ _id: { $in: session.questionOrder } }).select('questionText options correctAnswer marks explanation');

    const questionMap = {};
    let totalMaxMarks = 0;
    questions.forEach((q) => {
      const qMark = Number(q.marks) > 0 ? Number(q.marks) : 1;
      questionMap[q._id.toString()] = {
        ...q.toObject(),
        marks: qMark,
      };
      totalMaxMarks += qMark;
    });

    if (totalMaxMarks === 0 && exam.totalMarks > 0) {
      totalMaxMarks = exam.totalMarks;
    }

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let score = 0;
    const answerBreakdown = [];

    session.answers.forEach((answer) => {
      const q = questionMap[answer.questionId.toString()];
      if (!q) return;

      const qMark = q.marks;

      if (!answer.selectedOption) {
        skipped++;
        answerBreakdown.push({
          questionId: answer.questionId,
          questionText: q.questionText,
          options: q.options,
          selectedOption: null,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          marks: 0,
          maxMarks: qMark,
          explanation: q.explanation || '',
        });
      } else if (answer.selectedOption === q.correctAnswer) {
        correct++;
        score += qMark;
        answerBreakdown.push({
          questionId: answer.questionId,
          questionText: q.questionText,
          options: q.options,
          selectedOption: answer.selectedOption,
          correctAnswer: q.correctAnswer,
          isCorrect: true,
          marks: qMark,
          maxMarks: qMark,
          explanation: q.explanation || '',
        });
      } else {
        wrong++;
        answerBreakdown.push({
          questionId: answer.questionId,
          questionText: q.questionText,
          options: q.options,
          selectedOption: answer.selectedOption,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          marks: 0,
          maxMarks: qMark,
          explanation: q.explanation || '',
        });
      }
    });

    const percentage = totalMaxMarks > 0 ? (score / totalMaxMarks) * 100 : 0;
    const isPassed = score >= exam.passingMarks;
    const timeTaken = Math.min(elapsedSeconds, allowedDuration);

    session.status = isTimeout ? 'timeout' : 'submitted';
    session.submittedAt = new Date();
    session.timeRemaining = 0;
    await session.save();

    // Create result with authoritative calculated marks
    const result = await Result.create({
      studentId: req.user._id,
      examId: exam._id,
      sessionId: session._id,
      totalQuestions: session.answers.length,
      attempted: correct + wrong,
      correct,
      wrong,
      skipped,
      score,
      totalMarks: totalMaxMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      isPassed,
      timeTaken,
      answerBreakdown,
    });

    // Log completion
    await CheatingLog.create({
      studentId: req.user._id,
      examId: exam._id,
      sessionId: session._id,
      eventType: isTimeout ? 'time-expired' : 'assessment-submitted',
      details: `Assessment submitted. Score: ${score}/${totalMaxMarks} (${percentage.toFixed(1)}%)`,
    });

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        resultId: result._id,
        correct,
        wrong,
        skipped,
        score,
        totalMarks: totalMaxMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        isPassed,
        timeTaken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log anti-cheat event via HTTP
// @route   POST /api/student/cheat/log
const logCheatEvent = async (req, res, next) => {
  try {
    const { examId, type, details } = req.body;

    if (!examId || !type) {
      return res.status(400).json({ success: false, message: 'Exam ID and event type are required' });
    }

    const session = await ExamSession.findOne({
      studentId: req.user._id,
      examId,
      status: 'ongoing',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found' });
    }

    const exam = await Exam.findById(examId).select('maxWarnings');
    const maxWarnings = exam?.maxWarnings ?? 3;

    session.warningCount += 1;
    session.lastActive = new Date();

    let isVoided = false;
    if (session.warningCount >= maxWarnings) {
      session.status = 'voided';
      isVoided = true;
    }
    await session.save();

    await CheatingLog.create({
      studentId: req.user._id,
      examId,
      sessionId: session._id,
      eventType: type,
      details: details || '',
      warningNumberAtEvent: session.warningCount,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      warningCount: session.warningCount,
      maxWarnings,
      isVoided,
      message: isVoided
        ? `Assessment terminated: Maximum warnings (${maxWarnings}) exceeded.`
        : `Security warning ${session.warningCount}/${maxWarnings} recorded.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's results
// @route   GET /api/student/results
const getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('examId', 'title duration totalMarks passingMarks')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single result detail
// @route   GET /api/student/results/:id
const getResultDetail = async (req, res, next) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('examId', 'title duration totalMarks passingMarks')
      .populate('answerBreakdown.questionId', 'questionText options');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exam details & access status for authenticated verified student
// @route   GET /api/student/exams/:id
const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let exam = null;
    const mongoose = require('mongoose');

    if (mongoose.Types.ObjectId.isValid(id)) {
      exam = await Exam.findById(id)
        .select('title description duration totalMarks passingMarks startTime endTime isPublished maxWarnings questionCount createdAt')
        .populate('createdBy', 'name email');
    }

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (!exam.isPublished) {
      return res.status(403).json({ success: false, message: 'Assessment is not published or currently unavailable' });
    }

    const now = new Date();
    let availabilityStatus = 'available';
    if (exam.startTime && now < exam.startTime) {
      availabilityStatus = 'upcoming';
    } else if (exam.endTime && now > exam.endTime) {
      availabilityStatus = 'ended';
    }

    // Check if student already has a session or result
    const session = await ExamSession.findOne({ studentId: req.user._id, examId: exam._id });
    const result = await Result.findOne({ studentId: req.user._id, examId: exam._id });

    // Calculate actual total marks & question count from questions
    const questions = await Question.find({ examId: exam._id });
    const questionCount = questions.length;
    const dynamicTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0);

    let sessionStatus = 'not-started';
    let warningCount = 0;
    if (session) {
      sessionStatus = session.status;
      warningCount = session.warningCount || 0;
    }

    const hasSubmitted = sessionStatus === 'submitted' || sessionStatus === 'timeout' || Boolean(result);
    const isVoided = sessionStatus === 'voided';
    const canStart = availabilityStatus === 'available' && !hasSubmitted && !isVoided;

    res.json({
      success: true,
      data: {
        ...exam.toObject(),
        totalMarks: dynamicTotalMarks || exam.totalMarks,
        questionCount: questionCount || exam.questionCount,
        availabilityStatus,
        sessionStatus,
        warningCount,
        hasSubmitted,
        isVoided,
        resultId: result?._id || null,
        canStart,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableExams,
  getExamById,
  startExam,
  saveAnswer,
  submitExam,
  logCheatEvent,
  getMyResults,
  getResultDetail,
};
