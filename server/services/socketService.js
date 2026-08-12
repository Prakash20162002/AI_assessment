const jwt = require('jsonwebtoken');
const ExamSession = require('../models/ExamSession');
const CheatingLog = require('../models/CheatingLog');
const Exam = require('../models/Exam');

const initSocketService = (io) => {
  // Middleware: authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      // Allow unauthenticated for now but mark as guest
      socket.userId = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // ─── Student: Join exam room ───────────────────────────────────────────────
    socket.on('join-exam', async ({ examId, studentId }) => {
      try {
        const roomName = `exam:${examId}`;
        socket.join(roomName);
        socket.examId = examId;
        socket.studentId = studentId || socket.userId;

        // Notify admin monitoring room
        io.to(`monitor:${examId}`).emit('student-joined', {
          studentId: socket.studentId,
          socketId: socket.id,
          timestamp: new Date(),
        });

        console.log(`📝 Student ${socket.studentId} joined exam ${examId}`);
      } catch (err) {
        console.error('join-exam error:', err.message);
      }
    });

    // ─── Student: Report cheat event ─────────────────────────────────────────
    socket.on('cheat-event', async ({ type, examId, studentId, details }) => {
      try {
        const sid = studentId || socket.userId;
        const eid = examId || socket.examId;

        if (!sid || !eid) return;

        // Get current session
        const session = await ExamSession.findOne({
          studentId: sid,
          examId: eid,
          status: 'ongoing',
        });

        if (!session) return;

        // Increment warning
        session.warningCount += 1;
        session.lastActive = new Date();
        await session.save();

        // Log the cheat event
        await CheatingLog.create({
          studentId: sid,
          examId: eid,
          sessionId: session._id,
          eventType: type,
          details: details || '',
          warningNumberAtEvent: session.warningCount,
          timestamp: new Date(),
        });

        // Get exam's max warnings
        const exam = await Exam.findById(eid).select('maxWarnings');
        const maxWarnings = exam?.maxWarnings ?? 3;

        // Send warning to student
        socket.emit('warning-issued', {
          warningCount: session.warningCount,
          maxWarnings,
          eventType: type,
          message: `Warning ${session.warningCount}/${maxWarnings}: ${getWarningMessage(type)}`,
        });

        // Broadcast to admin monitor room
        io.to(`monitor:${eid}`).emit('student-cheat-event', {
          studentId: sid,
          eventType: type,
          warningCount: session.warningCount,
          maxWarnings,
          timestamp: new Date(),
        });

        // Auto-void if max warnings exceeded
        if (session.warningCount >= maxWarnings) {
          session.status = 'voided';
          await session.save();

          socket.emit('exam-voided', {
            message: `Your exam has been terminated due to ${maxWarnings} anti-cheat violations.`,
            warningCount: session.warningCount,
          });

          io.to(`monitor:${eid}`).emit('student-voided', {
            studentId: sid,
            reason: 'Max warnings exceeded',
            timestamp: new Date(),
          });

          console.log(`🚨 Exam voided for student ${sid} in exam ${eid}`);
        }
      } catch (err) {
        console.error('cheat-event error:', err.message);
      }
    });

    // ─── Student: Heartbeat for internet connection monitoring ─────────────────
    socket.on('heartbeat', ({ examId, studentId, timeRemaining }) => {
      const sid = studentId || socket.userId;
      const eid = examId || socket.examId;

      io.to(`monitor:${eid}`).emit('student-heartbeat', {
        studentId: sid,
        timeRemaining,
        timestamp: new Date(),
      });

      socket.emit('heartbeat-ack', { timestamp: new Date() });
    });

    // ─── Student: Update current question (for live monitoring) ───────────────
    socket.on('question-change', ({ examId, studentId, questionIndex }) => {
      const eid = examId || socket.examId;
      io.to(`monitor:${eid}`).emit('student-question-update', {
        studentId: studentId || socket.userId,
        questionIndex,
        timestamp: new Date(),
      });
    });

    // ─── Admin: Join monitoring room ──────────────────────────────────────────
    socket.on('admin-join-monitor', async ({ examId }) => {
      const monitorRoom = `monitor:${examId}`;
      socket.join(monitorRoom);
      socket.monitoringExamId = examId;

      // Send current active sessions snapshot
      try {
        const sessions = await ExamSession.find({ examId, status: 'ongoing' })
          .populate('studentId', 'name email')
          .select('studentId warningCount currentQuestion timeRemaining startedAt lastActive');

        socket.emit('monitor-snapshot', { sessions, examId });
        console.log(`👁️  Admin joined monitor room for exam ${examId}`);
      } catch (err) {
        console.error('admin-join-monitor error:', err.message);
      }
    });

    // ─── Admin: Force void a student session ──────────────────────────────────
    socket.on('admin-void-student', async ({ examId, studentId, reason }) => {
      try {
        const session = await ExamSession.findOneAndUpdate(
          { examId, studentId, status: 'ongoing' },
          { status: 'voided' },
          { new: true }
        );

        if (session) {
          // Find student's socket and notify them
          io.to(`exam:${examId}`).emit('exam-voided', {
            targetStudentId: studentId,
            message: `Your exam was terminated by the administrator. Reason: ${reason || 'Policy violation'}`,
          });

          socket.emit('void-confirmed', { studentId, success: true });
        }
      } catch (err) {
        console.error('admin-void-student error:', err.message);
      }
    });

    // ─── WebRTC Signaling (camera streaming) ──────────────────────────────────
    socket.on('webrtc-offer', ({ targetSocketId, offer, studentId }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        offer,
        fromSocketId: socket.id,
        studentId,
      });
    });

    socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─── Admin: Request camera from student ───────────────────────────────────
    socket.on('request-camera', ({ studentSocketId, adminSocketId }) => {
      io.to(studentSocketId).emit('camera-requested', {
        adminSocketId: adminSocketId || socket.id,
      });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.examId && socket.studentId) {
        io.to(`monitor:${socket.examId}`).emit('student-disconnected', {
          studentId: socket.studentId,
          socketId: socket.id,
          timestamp: new Date(),
        });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getWarningMessage = (type) => {
  const messages = {
    'tab-switch': 'Browser tab switch detected',
    'window-blur': 'Leaving assessment window detected',
    'window-focus': 'Returned to assessment window',
    'fullscreen-exit': 'Exited fullscreen mode',
    refresh: 'Page refresh detected',
    'browser-close': 'Browser close attempt detected',
    'camera-off': 'Camera was turned off',
    'internet-lost': 'Internet connection lost',
    'copy-paste': 'Copy/paste attempt detected',
    'right-click': 'Right-click attempt detected',
    'suspicious-activity': 'Suspicious assessment activity detected',
  };
  return messages[type] || 'Security warning detected';
};

module.exports = initSocketService;
