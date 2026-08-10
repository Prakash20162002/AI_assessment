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

    // Get student's session statuses for these exams
    const examIds = exams.map((e) => e._id);
    const sessions = await ExamSession.find({
      studentId: req.user._id,
      examId: { $in: examIds },
    }).select('examId status');

    const sessionMap = {};
    sessions.forEach((s) => {
      sessionMap[s.examId.toString()] = s.status;
    });

    const examsWithStatus = exams.map((exam) => ({
      ...exam.toObject(),
      sessionStatus: sessionMap[exam._id.toString()] || 'not-started',
    }));

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

    // Check time window if set
    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      return res.status(400).json({ success: false, message: 'Exam has not started yet' });
    }
    if (exam.endTime && now > exam.endTime) {
      return res.status(400).json({ success: false, message: 'Exam has ended' });
    }

    let session = await ExamSession.findOne({ studentId: req.user._id, examId: exam._id });

    if (session) {
      if (session.status === 'submitted' || session.status === 'timeout') {
        return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
      }
      if (session.status === 'voided') {
        return res.status(400).json({ success: false, message: 'Your session was voided due to cheating violations' });
      }
      if (session.status === 'ongoing' && !exam.allowResume) {
        return res.status(400).json({ success: false, message: 'Resume is not allowed for this exam' });
      }

      // Resume existing session
      session.status = 'ongoing';
      session.lastActive = new Date();
      await session.save();
    } else {
      // Get questions and optionally shuffle
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
    }

    // Fetch questions in session order (without correct answer)
    const populatedQuestions = await Question.find({
      _id: { $in: session.questionOrder },
    }).select('-correctAnswer -explanation');

    // Reorder to match session order
    const questionMap = {};
    populatedQuestions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });
    const orderedQuestions = session.questionOrder.map((id) => questionMap[id.toString()]);

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          startedAt: session.startedAt,
          timeRemaining: session.timeRemaining,
          currentQuestion: session.currentQuestion,
          warningCount: session.warningCount,
          answers: session.answers,
        },
        exam: {
          id: exam._id,
          title: exam.title,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          maxWarnings: exam.maxWarnings,
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

    // Update the answer for this question
    const answerIndex = session.answers.findIndex((a) => a.questionId.toString() === questionId);

    if (answerIndex !== -1) {
      session.answers[answerIndex].selectedOption = selectedOption;
      session.answers[answerIndex].savedAt = new Date();
    }

    session.currentQuestion = currentQuestion ?? session.currentQuestion;
    session.timeRemaining = timeRemaining ?? session.timeRemaining;
    session.lastActive = new Date();

    await session.save();

    res.json({ success: true, message: 'Answer saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit exam and calculate result
// @route   POST /api/student/exams/:id/submit
const submitExam = async (req, res, next) => {
  try {
    const { timeRemaining } = req.body;

    const session = await ExamSession.findOne({
      studentId: req.user._id,
      examId: req.params.id,
      status: 'ongoing',
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    const exam = await Exam.findById(req.params.id);
    const questions = await Question.find({ _id: { $in: session.questionOrder } }).select('correctAnswer marks');

    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let score = 0;
    const answerBreakdown = [];

    session.answers.forEach((answer) => {
      const q = questionMap[answer.questionId.toString()];
      if (!q) return;

      if (!answer.selectedOption) {
        skipped++;
        answerBreakdown.push({
          questionId: answer.questionId,
          selectedOption: null,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          marks: 0,
        });
      } else if (answer.selectedOption === q.correctAnswer) {
        correct++;
        score += q.marks;
        answerBreakdown.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          correctAnswer: q.correctAnswer,
          isCorrect: true,
          marks: q.marks,
        });
      } else {
        wrong++;
        answerBreakdown.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          marks: 0,
        });
      }
    });

    const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;
    const isPassed = score >= exam.passingMarks;
    const timeTaken = exam.duration * 60 - (timeRemaining ?? 0);

    // Update session
    session.status = 'submitted';
    session.submittedAt = new Date();
    session.timeRemaining = timeRemaining ?? 0;
    await session.save();

    // Create result
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
      totalMarks: exam.totalMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      isPassed,
      timeTaken,
      answerBreakdown,
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
        totalMarks: exam.totalMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        isPassed,
        timeTaken,
      },
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

module.exports = { getAvailableExams, startExam, saveAnswer, submitExam, getMyResults, getResultDetail };
