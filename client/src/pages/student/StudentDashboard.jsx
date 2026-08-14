import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Clock, AlertCircle, PlayCircle, Trophy, RefreshCcw, 
  ShieldCheck, ArrowRight, Layers, Award, Sparkles, User, LogOut, CheckCircle2 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentName = user?.name || sessionStorage.getItem('dp_student') || 'Student';
  const studentEmail = user?.email || sessionStorage.getItem('dp_student_email') || '';
  const studentInitials = useMemo(() => {
    if (!studentName) return 'S';
    return studentName
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [studentName]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    api.get('/student/exams')
      .then(({ data }) => setExams(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not-started':
        return (
          <span className="student-status-badge badge-available">
            <span className="status-dot dot-green" /> AVAILABLE
          </span>
        );
      case 'ongoing':
        return (
          <span className="student-status-badge badge-ongoing">
            <span className="status-dot dot-amber" /> IN PROGRESS
          </span>
        );
      case 'submitted':
        return (
          <span className="student-status-badge badge-submitted">
            <span className="status-dot dot-blue" /> COMPLETED
          </span>
        );
      case 'voided':
        return (
          <span className="student-status-badge badge-voided">
            <span className="status-dot dot-red" /> VOIDED
          </span>
        );
      case 'timeout':
        return (
          <span className="student-status-badge badge-timeout">
            <span className="status-dot dot-red" /> TIMEOUT
          </span>
        );
      default:
        return (
          <span className="student-status-badge badge-available">
            <span className="status-dot dot-green" /> AVAILABLE
          </span>
        );
    }
  };

  const handleActionClick = (exam) => {
    if (exam.sessionStatus === 'submitted' || exam.sessionStatus === 'timeout' || exam.sessionStatus === 'voided') {
      if (exam.resultId) {
        navigate(`/result/${exam.resultId}`);
      } else {
        navigate(`/exam/${exam._id}`);
      }
    } else {
      navigate(`/exam/${exam._id}/setup`);
    }
  };

  const availableCount = exams.filter(e => !e.sessionStatus || e.sessionStatus === 'not-started' || e.sessionStatus === 'ongoing').length;

  return (
    <div className="student-dashboard-root page-enter">
      {/* ── Top Navigation Bar ── */}
      <header className="student-navbar">
        <div className="student-navbar-inner">
          <Link to="/student/dashboard" className="student-nav-brand">
            <img src="/logo.png" alt="DevPhoenix" className="student-nav-logo logo-blend" />
            <span className="student-nav-badge">AI Assessment</span>
          </Link>

          <div className="student-nav-actions">
            <div className="student-user-pill">
              <div className="student-avatar">
                {studentInitials}
              </div>
              <div className="student-user-meta">
                <div className="student-user-name">{studentName}</div>
                <div className="student-user-role">Student Account</div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={logout} 
              className="student-logout-btn" 
              title="Sign out of student portal"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Container ── */}
      <main className="student-main-content">
        {/* ── Header / Welcome Section ── */}
        <section className="student-welcome-section">
          <div className="student-welcome-text">
            <div className="student-overline">
              <span className="student-overline-dot" />
              <span>{greeting}, {studentName.split(' ')[0]}</span>
            </div>
            <h1 className="student-heading">
              Welcome back, <span className="student-name-highlight">{studentName}</span> 👋
            </h1>
            <p className="student-subtitle">
              Ready for your next assessment? Continue your learning journey and complete your scheduled examinations under secure AI proctoring.
            </p>
          </div>

          <div className="student-stats-group">
            <div className="student-stat-pill">
              <div className="student-stat-icon-wrap">
                <BookOpen size={18} />
              </div>
              <div className="student-stat-info">
                <span className="student-stat-val">{loading ? '—' : availableCount}</span>
                <span className="student-stat-lbl">Available</span>
              </div>
            </div>

            <div className="student-stat-pill">
              <div className="student-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                <ShieldCheck size={18} />
              </div>
              <div className="student-stat-info">
                <span className="student-stat-val">Active</span>
                <span className="student-stat-lbl">AI Proctoring</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Assessment Section ── */}
        <div className="student-section-head">
          <h2 className="student-section-title">
            <span>Available Assessments</span>
            {!loading && exams.length > 0 && (
              <span className="student-count-chip">
                {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" style={{ width: 42, height: 42, borderWidth: 3 }} />
          </div>
        ) : exams.length === 0 ? (
          <div className="student-empty-state">
            <div className="student-empty-icon">
              <BookOpen size={28} />
            </div>
            <h3 className="student-empty-title">No Assessments Assigned</h3>
            <p className="student-empty-subtitle">
              You currently do not have any pending assessments. Please check back later or contact your instructor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {exams.map((exam) => {
              const subjectLabel = exam.subject || (exam.title ? exam.title.replace(/assessment/i, '').trim() : 'ASSESSMENT');
              const isOngoing = exam.sessionStatus === 'ongoing';
              const isCompleted = exam.sessionStatus === 'submitted' || exam.sessionStatus === 'timeout' || exam.sessionStatus === 'voided';
              const durationMin = exam.duration || 10;
              const questionCount = exam.questionCount || 0;
              const totalMarks = exam.totalMarks || 40;

              return (
                <article key={exam._id || exam.id} className="student-exam-card">
                  {/* Card Top Row: Category Tag & Status Badge */}
                  <div className="student-card-top-row">
                    <span className="student-category-tag">
                      <Sparkles size={12} />
                      {subjectLabel}
                    </span>
                    {getStatusBadge(exam.sessionStatus || 'not-started')}
                  </div>

                  {/* Title & Description */}
                  <h3 className="student-card-title">{exam.title}</h3>
                  <p className="student-card-desc">
                    {exam.description || `Test your knowledge and technical mastery in ${subjectLabel}. Complete all questions within the allocated time window.`}
                  </p>

                  <div className="student-card-divider" />

                  {/* Assessment Metrics (3 Clean Separate Blocks) */}
                  <div className="student-metrics-grid">
                    <div className="student-metric-block">
                      <div className="student-metric-icon-box icon-time">
                        <Clock size={20} />
                      </div>
                      <div className="student-metric-details">
                        <span className="student-metric-val">{durationMin} MIN</span>
                        <span className="student-metric-lbl">Duration</span>
                      </div>
                    </div>

                    <div className="student-metric-block">
                      <div className="student-metric-icon-box icon-qs">
                        <Layers size={20} />
                      </div>
                      <div className="student-metric-details">
                        <span className="student-metric-val">{questionCount} QUESTIONS</span>
                        <span className="student-metric-lbl">Assessment</span>
                      </div>
                    </div>

                    <div className="student-metric-block">
                      <div className="student-metric-icon-box icon-marks">
                        <Award size={20} />
                      </div>
                      <div className="student-metric-details">
                        <span className="student-metric-val">{totalMarks} MARKS</span>
                        <span className="student-metric-lbl">Total Score</span>
                      </div>
                    </div>
                  </div>

                  <div className="student-card-divider" />

                  {/* Card Footer: Proctoring Notice & CTA Button */}
                  <div className="student-card-footer">
                    <div className="student-proctor-note">
                      <ShieldCheck size={16} className="student-proctor-icon" />
                      <span>AI Proctoring Enabled · Webcam & Fullscreen Required</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleActionClick(exam)}
                      className={`student-cta-btn ${isCompleted ? 'cta-secondary' : 'cta-primary'}`}
                    >
                      {!isOngoing && !isCompleted && (
                        <>
                          <span>Start Assessment</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                      {isOngoing && (
                        <>
                          <RefreshCcw size={15} />
                          <span>Resume Assessment</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <Trophy size={15} />
                          <span>View Results</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
