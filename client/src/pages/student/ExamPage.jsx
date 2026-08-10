import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Clock, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import useAntiCheat from '../../hooks/useAntiCheat';
import useTimer from '../../hooks/useTimer';
import { useSocket } from '../../context/SocketContext';
import useCamera from '../../hooks/useCamera';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVoided, setIsVoided] = useState(false);
  const [warningMsg, setWarningMsg] = useState(null);
  const warningTimeout = useRef(null);

  const { videoRef } = useCamera({ enabled: true, examId: id, studentId: session?.studentId });

  // 1. Fetch exam data & start session
  useEffect(() => {
    let mounted = true;
    api.post(`/student/exams/${id}/start`)
      .then(({ data }) => {
        if (!mounted) return;
        setExam(data.data.exam);
        setSession(data.data.session);
        setQuestions(data.data.questions);

        // Pre-fill existing answers from resume
        const ansMap = {};
        data.data.session.answers.forEach(a => {
          if (a.selectedOption) ansMap[a.questionId] = a.selectedOption;
        });
        setAnswers(ansMap);
        
        if (data.data.session.currentQuestion) {
          setCurrentIndex(data.data.session.currentQuestion);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to start exam');
        navigate('/student/dashboard');
      });

    return () => { mounted = false; };
  }, [id, navigate]);

  // 2. Setup Anti-Cheat
  useAntiCheat({
    examId: id,
    studentId: session?.id,
    active: !loading && !isVoided && !submitting,
    onWarning: (data) => {
      setWarningMsg(data.message);
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
      warningTimeout.current = setTimeout(() => setWarningMsg(null), 5000);
      setSession(s => ({ ...s, warningCount: data.warningCount }));
    },
    onVoided: (data) => {
      setIsVoided(true);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      toast.error(data.message, { duration: Infinity });
      setTimeout(() => navigate('/student/dashboard'), 5000);
    }
  });

  // 3. Join Socket Room
  useEffect(() => {
    if (socket && session) {
      socket.emit('join-exam', { examId: id, studentId: session.id });
    }
  }, [socket, session, id]);

  // 4. Timer setup
  const handleAutoSubmit = () => {
    toast('Time is up! Auto-submitting...', { icon: '⏱️' });
    handleSubmit(true);
  };

  const { timeRemaining, formatted: formattedTime, isUrgent, stop } = useTimer({
    initialSeconds: session?.timeRemaining || 0,
    active: !loading && !isVoided && !submitting,
    onExpire: handleAutoSubmit
  });

  // Handle Option Select
  const handleOptionSelect = async (optionKey) => {
    const qId = questions[currentIndex]._id;
    setAnswers(p => ({ ...p, [qId]: optionKey }));

    try {
      await api.post(`/student/exams/${id}/save-answer`, {
        questionId: qId,
        selectedOption: optionKey,
        currentQuestion: currentIndex,
        timeRemaining
      });
    } catch (err) {
      console.error('Failed to auto-save answer');
    }
  };

  const changeQuestion = (newIndex) => {
    if (newIndex >= 0 && newIndex < questions.length) {
      setCurrentIndex(newIndex);
      if (socket && session) {
        socket.emit('question-change', { examId: id, studentId: session.id, questionIndex: newIndex });
      }
    }
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Are you sure you want to submit? You cannot change your answers after submitting.')) {
      return;
    }
    
    setSubmitting(true);
    stop();

    try {
      const { data } = await api.post(`/student/exams/${id}/submit`, { timeRemaining });
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      toast.success('Exam submitted successfully!');
      navigate(`/student/results/${data.data.resultId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="flex flex-col items-center">
          <div className="spinner mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Preparing your exam environment...</p>
        </div>
      </div>
    );
  }

  if (isVoided) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] p-4 text-center">
        <div className="glass-card p-8 max-w-md w-full" style={{ borderColor: 'var(--danger)' }}>
          <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Exam Voided</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Your exam session has been terminated due to anti-cheating policy violations.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedOpt = answers[currentQ._id];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen flex flex-col page-enter" style={{ background: 'var(--bg-dark)' }}>
      {/* Top Navbar */}
      <div className="h-16 flex items-center justify-between px-6" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <h1 className="font-semibold truncate max-w-xs md:max-w-md" style={{ color: 'var(--text-primary)' }}>
            {exam.title}
          </h1>
          {session.warningCount > 0 && (
            <span className="badge badge-warning flex items-center gap-1">
              <AlertTriangle size={12} /> {session.warningCount}/{exam.maxWarnings} Warnings
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          {/* Camera PIP (Hidden but active) */}
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-lg
            ${isUrgent ? 'timer-urgent bg-red-500/10' : 'bg-white/5'}`}
            style={{ color: isUrgent ? '#ef4444' : 'var(--text-primary)' }}>
            <Clock size={18} />
            {formattedTime}
          </div>
          
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="btn-primary" style={{ padding: '8px 16px' }}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {warningMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="warning-banner">
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{warningMsg}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Question Palette */}
        <div className="w-64 flex-shrink-0 flex flex-col p-4 overflow-y-auto" style={{ borderRight: '1px solid var(--border)', background: 'rgba(26, 26, 46, 0.4)' }}>
          <div className="mb-4">
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>Question Palette</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Answered: {answeredCount} / {questions.length}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => changeQuestion(idx)}
                className={`w-full aspect-square rounded-lg flex items-center justify-center font-medium text-sm transition-colors`}
                style={{
                  background: currentIndex === idx ? 'var(--primary)' : (answers[q._id] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'),
                  color: currentIndex === idx ? 'white' : (answers[q._id] ? '#10b981' : 'var(--text-secondary)'),
                  border: currentIndex === idx ? 'none' : `1px solid ${answers[q._id] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Right side - Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="badge badge-primary">Question {currentIndex + 1} of {questions.length}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{currentQ.marks} Mark{currentQ.marks !== 1 ? 's' : ''}</span>
            </div>

            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {currentQ.questionText}
              </h2>
            </div>

            <div className="space-y-3 mb-auto">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all"
                  style={{
                    background: selectedOpt === opt ? 'rgba(99,102,241,0.15)' : 'rgba(26,26,46,0.8)',
                    border: `1px solid ${selectedOpt === opt ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                    style={{
                      background: selectedOpt === opt ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: selectedOpt === opt ? 'white' : 'var(--text-secondary)'
                    }}>
                    {opt}
                  </div>
                  <span style={{ color: selectedOpt === opt ? 'var(--primary-light)' : 'var(--text-primary)', fontSize: '15px' }}>
                    {currentQ.options[opt]}
                  </span>
                  {selectedOpt === opt && <CheckCircle2 className="ml-auto" size={20} style={{ color: 'var(--primary)' }} />}
                </button>
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => changeQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="btn-secondary"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => changeQuestion(currentIndex + 1)}
                  className="btn-primary"
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting} className="btn-primary">
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
