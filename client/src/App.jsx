import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation
} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  BookOpen, Clock, AlertTriangle, Trophy, Plus, Trash2,
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Camera, Wifi, Maximize2,
  FileText, ArrowRight, ArrowLeft, Eye, EyeOff, Lock, Edit3,
  Layers, X, Users, LogOut, Link2, Copy, Home, AlertCircle,
  ChevronRight, BarChart3, Star, Zap, Shield, Activity, Monitor, UserCheck, Share2, Send, Mail, ExternalLink, RefreshCw, Sparkles, Menu, KeyRound, Check,
  Folder, ArrowUp, ArrowDown, Hash
} from 'lucide-react';
import LoadingScreen from './components/LoadingScreen.jsx';
import StudentAuthModal from './components/StudentAuthModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import OtpPage from './pages/auth/OtpPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import api from './services/api';

/* ═══════════════════════════════════════════════════════
   DATA LAYER  (localStorage)
═══════════════════════════════════════════════════════ */
const MAX_WARNINGS = 3;

const SEED = {
  subjects: [],
  questions: [],
  exams: [],
  results: [],
  students: [],
};

function kv(key) {
  return {
    get() {
      const v = localStorage.getItem('dp_' + key);
      if (v === null) { localStorage.setItem('dp_' + key, JSON.stringify(SEED[key] ?? [])); return SEED[key] ?? []; }
      return JSON.parse(v);
    },
    set(v) { localStorage.setItem('dp_' + key, JSON.stringify(v)); },
  };
}
const DB = {
  subjects: kv('subjects'),
  questions: kv('questions'),
  exams: kv('exams'),
  results: kv('results'),
  students: kv('students'),
};
const genId = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ═══════════════════════════════════════════════════════
   GLOBAL WEBCAM & MEDIA STREAM REGISTRY
═══════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  window._dp_active_streams = window._dp_active_streams || new Set();
}

function registerStream(stream) {
  if (stream && typeof window !== 'undefined' && window._dp_active_streams) {
    window._dp_active_streams.add(stream);
  }
}

function stopGlobalWebcamStreams() {
  if (typeof window !== 'undefined' && window._dp_active_streams) {
    window._dp_active_streams.forEach(stream => {
      try {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      } catch (e) { }
    });
    window._dp_active_streams.clear();
  }
  if (typeof document !== 'undefined' && (document.fullscreenElement || document.webkitFullscreenElement)) {
    try {
      const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
      if (efs) efs.call(document).catch(() => { });
    } catch (e) { }
  }
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════ */

function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon-wrap ${danger ? 'modal-icon-danger' : 'modal-icon-warn'}`}>
          {danger ? <AlertTriangle size={28} /> : <AlertCircle size={28} />}
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ open, exam, subject, onCancel }) {
  if (!open || !exam) return null;
  const url = `${window.location.origin}/exam/${exam.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Exam link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const shareWhatsApp = () => {
    const text = `Hi Students, please join your proctored assessment "${exam.title}" here:\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareEmail = () => {
    const subjectText = `Exam Link: ${exam.title}`;
    const bodyText = `Dear Students,\n\nPlease click the link below to start your online proctored exam "${exam.title}":\n\n${url}\n\nGood luck!`;
    window.open(`mailto:?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`);
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: exam.title,
        text: `Join assessment: ${exam.title}`,
        url: url
      }).catch(() => { });
    } else {
      copyUrl();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-icon-wrap" style={{ background: 'rgba(230,57,70,.12)', color: 'var(--primary-light)', margin: '0 auto 16px' }}>
          <Share2 size={32} />
        </div>
        <h3 className="modal-title">Share Exam Link</h3>
        <p className="modal-body" style={{ marginBottom: 16 }}>
          Send this exam link to your students to allow them to take the assessment.
        </p>

        {subject && <span className="badge badge-orange" style={{ marginBottom: 16 }}>{subject.name}</span>}

        <div className="exam-link-url-bar" style={{ marginBottom: 20, padding: '12px 14px' }}>
          <Link2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>{url}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <button onClick={copyUrl} className="btn btn-primary" style={{ padding: 11, justifyContent: 'center' }}>
            <Copy size={15} /> Copy Link
          </button>
          <button onClick={shareWhatsApp} className="btn btn-secondary" style={{ padding: 11, justifyContent: 'center', color: '#25D366', borderColor: 'rgba(37,211,102,.3)' }}>
            <Send size={15} /> WhatsApp
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={shareEmail} className="btn btn-secondary" style={{ padding: 11, justifyContent: 'center' }}>
            <Mail size={15} /> Email Link
          </button>

          {navigator.share ? (
            <button onClick={nativeShare} className="btn btn-secondary" style={{ padding: 11, justifyContent: 'center' }}>
              <ExternalLink size={15} /> Share Device
            </button>
          ) : (
            <button onClick={onCancel} className="btn btn-secondary" style={{ padding: 11, justifyContent: 'center' }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterModal({ open, isEdit, subjectName, initialData, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setOrder(initialData.order || 1);
      setIsActive(initialData.isActive !== false);
    } else {
      setName('');
      setDescription('');
      setOrder(1);
      setIsActive(true);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      order: Number(order) || 1,
      isActive,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>{isEdit ? 'Edit Chapter' : 'Add Chapter'}</h3>
          <button onClick={onCancel} className="btn btn-icon btn-sm" title="Close"><X size={16} /></button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Subject: <strong style={{ color: '#fff' }}>{subjectName}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Chapter Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Linux Fundamentals"
              className="input"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Commands, file permissions, chmod & process management"
              className="input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Chapter Order / Number *</label>
              <input
                type="number"
                min="1"
                required
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={isActive ? 'active' : 'inactive'}
                onChange={e => setIsActive(e.target.value === 'active')}
                className="input"
                style={{ cursor: 'pointer' }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Create Chapter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Header({ showAdmin = false, adminMode = false, disableBrandLink = false, onLogout }) {
  const { user } = useAuth();
  const isAdminLoggedIn = user?.role === 'admin';
  const adminName = user?.role === 'admin' ? (user.name || sessionStorage.getItem('dp_admin_name') || 'Admin') : null;

  const brandInner = (
    <div className="brand" style={{ cursor: disableBrandLink ? 'default' : 'pointer' }}>
      <div className="brand-logo-wrap">
        <img src="/logo.png" alt="DevPhoenix" className="header-logo-img" />
      </div>
      <span className="badge badge-orange badge-ai-header" style={{ fontSize: 9, padding: '3px 8px', letterSpacing: '.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>AI ASSESSMENT</span>
    </div>
  );

  const brandDestination = isAdminLoggedIn ? "/admin/dashboard" : (user?.role === 'student' ? "/student/dashboard" : "/");

  return (
    <header className="app-header">
      <div className="header-inner">
        {disableBrandLink ? (
          brandInner
        ) : (
          <Link to={brandDestination} style={{ textDecoration: 'none' }}>
            {brandInner}
          </Link>
        )}
        <div className="header-actions">
          {adminMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {adminName && (
                <span className="badge badge-gold" style={{ fontSize: 11, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCheck size={13} /> {adminName}
                </span>
              )}
              {onLogout && (
                <button onClick={onLogout} className="btn btn-ghost btn-sm danger-text">
                  <LogOut size={14} /> Logout
                </button>
              )}
            </div>
          )}
          {!adminMode && isAdminLoggedIn && (
            <Link to="/admin/dashboard" className="btn btn-primary btn-sm">
              <Lock size={13} /> Admin Dashboard
            </Link>
          )}
          {!adminMode && !isAdminLoggedIn && showAdmin && (
            <Link to="/admin" className="btn btn-outline btn-sm">
              <Lock size={13} /> Admin Panel
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function PhoenixFlyIntro({ text = "Initializing Secure Proctored Environment...", onComplete }) {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef(null);

  const handleVideoFinish = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 500);
  };

  if (!show) return null;

  return (
    <div className={`phoenix-video-intro-overlay ${isFading ? 'video-fade-out' : ''}`}>
      <video
        ref={videoRef}
        src="/Video/no_no_a_mascort_can_fly_around.mp4"
        autoPlay
        playsInline
        muted
        onEnded={handleVideoFinish}
        className="phoenix-intro-video"
      />
      <div className="phoenix-video-overlay-glow" />

      <div className="phoenix-video-banner">
        <div className="live-dot" style={{ background: '#f77f00' }} />
        <div>
          <h3 className="phoenix-video-title">DevPhoenix AI Assessment</h3>
          <p className="phoenix-video-sub">{text}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   1. HOME PAGE
═══════════════════════════════════════════════════════ */
function HomePage() {
  useEffect(() => {
    stopGlobalWebcamStreams();
  }, []);

  const features = [
    { icon: Shield, title: 'AI Face Detection', desc: 'Real-time face tracking detects suspicious behaviour & secondary cameras', color: '#e63946' },
    { icon: Eye, title: 'Eye Tracking', desc: 'Monitors gaze direction and alerts when student looks away or takes photo', color: '#f77f00' },
    { icon: Monitor, title: 'Fullscreen Lock & Freeze', desc: 'Exiting fullscreen immediately freezes exam and pauses timer', color: '#fcbf49' },
    { icon: Activity, title: 'Live Proctoring', desc: 'Continuous monitoring with automated disqualification on 3 strikes', color: '#10b981' },
  ];

  return (
    <div className="page-wrapper">
      <Header showAdmin />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="dot-grid" />
          <div className="glow glow-1" />
          <div className="glow glow-2" />
        </div>
        <div className="container">
          <div className="hero-content page-enter">
            <div className="badge-pill">
              <div className="live-dot" />
              <span>AI-Powered Proctoring Platform</span>
            </div>

            <h1 className="hero-title">
              <span className="text-white">Next-Gen Exams</span>
              <br />
              <span className="gradient-text">Powered by AI</span>
            </h1>

            <p className="hero-sub">
              Conduct secure, proctored exams with real-time face detection, eye tracking, photo-taking prevention & freeze lock. Built for institutions that demand integrity.
            </p>

            <div className="hero-cta">
              <Link to="/admin" className="btn btn-primary btn-xl">
                Admin Panel <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn btn-secondary btn-xl">
                How it Works
              </a>
            </div>

            <div className="hero-stats">
              {[['AI', 'Face Detection'], ['3x', 'Faster Grading'], ['100%', 'Cheating Prevention']].map(([n, l]) => (
                <div key={n} className="stat-pill">
                  <p className="stat-number gradient-text">{n}</p>
                  <p className="stat-label">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mascot */}
          <div className="hero-mascot page-enter">
            <div className="mascot-ring" />
            <img src="/mascot.jpeg" alt="Phoenix Mascot" className="mascot-img" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="container-sm">
          <div className="section-header">
            <h2>Why DevPhoenix?</h2>
            <p>Enterprise-grade AI proctoring for secure online examinations</p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  <f.icon size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="home-footer-note">
            <p>Have an exam link? Open it directly in your browser to begin your assessment.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STUDENT ROUTE GUARD
═══════════════════════════════════════════════════════ */
function StudentGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="center-page" style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px', borderColor: 'var(--primary-light)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verifying student authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  if (!user.isVerified) {
    return (
      <Navigate
        to="/verify-otp"
        state={{
          userId: user.id || user._id,
          email: user.email,
          redirect: location.pathname + location.search,
        }}
        replace
      />
    );
  }

  return children;
}

/* ═══════════════════════════════════════════════════════
   2. STUDENT LANDING (STRICT AUTHENTICATION GATE)
═══════════════════════════════════════════════════════ */
function StudentLanding() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examStatus, setExamStatus] = useState('checking'); // 'checking', 'ready', 'not-found', 'unavailable', 'already-submitted', 'voided', 'error'
  const [resultId, setResultId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const redirectPath = `/exam/${examId}`;
  const encodedRedirect = encodeURIComponent(redirectPath);

  // Synchronize session storage when student is logged in
  useEffect(() => {
    if (user?.name) {
      sessionStorage.setItem('dp_student', user.name);
      sessionStorage.setItem('dp_student_email', user.email);
    }
  }, [user]);

  // Load Exam Details & Verify Access Permissions
  useEffect(() => {
    if (!examId) return;

    let isMounted = true;

    const loadExamInfo = async () => {
      console.log('[ASSESSMENT_ROUTE_STARTED]', { examId, user: user ? { id: user.id || user._id, email: user.email, isVerified: user.isVerified } : null });

      // 1. If user is authenticated and verified, check backend access endpoint
      if (user && user.isVerified) {
        try {
          console.log('[ASSESSMENT_ACCESS_CHECK_STARTED]', { examId });
          const { data } = await api.get(`/student/exams/${examId}`);
          console.log('[ASSESSMENT_ACCESS_CHECK_COMPLETED]', { success: data?.success });
          if (!isMounted) return;

          if (data?.data) {
            const ex = data.data;
            setExam({
              id: ex._id || examId,
              title: ex.title || 'AI Proctored Assessment',
              description: ex.description || '',
              duration: (ex.duration || 10) * 60,
              totalMarks: ex.totalMarks || 0,
              passingMarks: ex.passingMarks || 0,
              questionCount: ex.questionCount || 0,
              maxWarnings: ex.maxWarnings || 3,
            });

            if (ex.hasSubmitted) {
              setExamStatus('already-submitted');
              setResultId(ex.resultId);
              return;
            }

            if (ex.isVoided) {
              setExamStatus('voided');
              return;
            }

            if (!ex.canStart) {
              setExamStatus('unavailable');
              return;
            }

            setExamStatus('ready');
            return;
          }
        } catch (err) {
          console.warn('[ASSESSMENT_LOAD_FAILED]', err.response?.status, err.message);
          if (err.response?.status === 401) {
            localStorage.removeItem('accessToken');
          }
        }
      }

      // 2. Fetch public assessment metadata from backend (for unauthenticated or initial preview)
      try {
        const { data: pubData } = await api.get(`/student/exams/${examId}/public`);
        if (pubData?.data && isMounted) {
          const pubEx = pubData.data;
          setExam({
            id: pubEx._id || pubEx.id || examId,
            title: pubEx.title || 'AI Proctored Assessment',
            description: pubEx.description || '',
            duration: pubEx.duration || 600,
            totalMarks: pubEx.totalMarks || 0,
            passingMarks: pubEx.passingMarks || 0,
            questionCount: pubEx.questionCount || 0,
            maxWarnings: pubEx.maxWarnings || 3,
          });
          setExamStatus('ready');
          return;
        }
      } catch (pubErr) {
        console.log('[PUBLIC_EXAM_PREVIEW_NOTE]', pubErr.message);
      }

      // 3. Fallback/Local Exam Check (if completely offline)
      try {
        const exams = DB.exams.get();
        let found = exams.find(e => e.id === examId);
        if (!found && examId) {
          found = {
            id: examId,
            subjectId: 's1',
            title: 'AI Proctored Assessment',
            duration: 600,
            totalMarks: 40,
            passingMarks: 16,
            questionCount: 0,
            createdAt: new Date().toISOString()
          };
        }

        if (!isMounted) return;

        if (!found) {
          setExamStatus('not-found');
          return;
        }

        setExam(found);

        // Check existing results in local DB
        const studentIdentifier = user?.name || sessionStorage.getItem('dp_student');
        const existing = DB.results.get().find(r => r.examId === examId && (studentIdentifier ? r.studentName === studentIdentifier : false));
        const submittedFlag = studentIdentifier ? sessionStorage.getItem(`dp_submitted_${examId}_${studentIdentifier}`) : null;

        if (existing || submittedFlag) {
          setExamStatus('already-submitted');
          setResultId(existing?.id || null);
          return;
        }

        const subs = DB.subjects.get();
        setSubject(subs.find(s => s.id === found.subjectId) || { name: 'Proctored Exam' });
        const qs = DB.questions.get().filter(q => q.subjectId === found.subjectId);
        setQuestions(qs.length > 0 ? qs : DB.questions.get());
        setExamStatus('ready');
        console.log('[ASSESSMENT_LOAD_COMPLETED]', { status: 'ready', title: found.title });
      } catch (fallbackErr) {
        console.error('[ASSESSMENT_FALLBACK_ERROR]', fallbackErr);
        if (isMounted) {
          setExamStatus('error');
          setErrorMessage('Unable to initialize assessment session.');
        }
      }
    };

    loadExamInfo();

    return () => {
      isMounted = false;
    };
  }, [examId, user]);

  const handleStartExam = (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodedRedirect}`);
      return;
    }
    if (!user.isVerified) {
      navigate('/verify-otp', {
        state: {
          userId: user.id || user._id,
          email: user.email,
          redirect: redirectPath,
        },
      });
      return;
    }

    sessionStorage.setItem('dp_student', user.name);
    sessionStorage.setItem('dp_student_email', user.email);
    sessionStorage.setItem('dp_exam_id', examId);

    const students = DB.students.get();
    if (!students.find(s => s.name === user.name && s.examId === examId)) {
      students.push({ id: genId('stu'), name: user.name, email: user.email, examId, joinedAt: new Date().toISOString() });
      DB.students.set(students);
    }

    navigate(`/exam/${examId}/setup`);
  };

  const handleResendOTP = async () => {
    if (!user) return;
    try {
      const { data } = await api.post('/auth/resend-otp', {
        userId: user.id || user._id,
        email: user.email,
      });
      if (data?.devOtp) {
        toast.success(`Verification Code sent! (OTP: ${data.devOtp})`, { duration: 12000 });
      } else {
        toast.success(data?.message || 'Verification code sent to your email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification code');
    }
  };

  // 1. Loading State
  if (authLoading || examStatus === 'checking') {
    return (
      <div className="page-wrapper">
        <Header disableBrandLink showAdmin={false} />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 440, width: '100%', padding: '48px 32px', textAlign: 'center', background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }}>
            <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, margin: '0 auto 20px', borderColor: 'var(--primary-light)', borderTopColor: 'transparent' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Checking Assessment Access</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verifying student registration and proctoring parameters...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Exam Not Found
  if (examStatus === 'not-found' || !exam) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 440, width: '100%', padding: 48, textAlign: 'center', background: 'rgba(15, 15, 20, 0.85)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <XCircle size={52} style={{ color: 'var(--danger)', margin: '0 auto 20px', opacity: 0.8 }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Assessment Not Found</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
              This assessment link is invalid, expired, or was removed by your instructor.
            </p>
            <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Already Submitted
  if (examStatus === 'already-submitted') {
    return (
      <div className="page-wrapper">
        <Header disableBrandLink showAdmin={false} />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center', background: 'rgba(15, 15, 20, 0.85)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <CheckCircle2 size={54} style={{ color: 'var(--success)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Assessment Completed</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              You have already completed and submitted your attempt for <strong style={{ color: '#fff' }}>{exam.title}</strong>. Multiple attempts are not permitted.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resultId && (
                <Link to={`/thankyou/${resultId}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Submission Summary <ArrowRight size={16} />
                </Link>
              )}
              <Link to="/student/dashboard" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Go to Student Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Disqualified / Voided
  if (examStatus === 'voided') {
    return (
      <div className="page-wrapper">
        <Header disableBrandLink showAdmin={false} />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 24, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <ShieldAlert size={54} style={{ color: 'var(--danger)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Assessment Voided</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Your session for <strong style={{ color: '#fff' }}>{exam.title}</strong> was disqualified due to multiple proctoring integrity violations. Please contact your instructor.
            </p>
            <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Assessment Unavailable / Window Closed
  if (examStatus === 'unavailable') {
    return (
      <div className="page-wrapper">
        <Header disableBrandLink showAdmin={false} />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center', background: 'rgba(15, 15, 20, 0.85)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Clock size={54} style={{ color: 'var(--warning)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Assessment Unavailable</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              This assessment is currently not active, unpublished, or outside the scheduled examination window.
            </p>
            <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // 6. Generic Error / Fallback
  if (examStatus === 'error') {
    return (
      <div className="page-wrapper">
        <Header disableBrandLink showAdmin={false} />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center', background: 'rgba(15, 15, 20, 0.85)', borderRadius: 24, border: '1px solid rgba(230, 57, 70, 0.3)' }}>
            <AlertCircle size={54} style={{ color: 'var(--primary-light)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Unable to Load Assessment</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {errorMessage || 'We were unable to verify assessment parameters. Please check your network connection and try again.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalMarks = exam?.totalMarks !== undefined ? exam.totalMarks : (questions?.reduce((s, q) => s + (q.marks || 0), 0) || 0);
  const questionCount = exam?.questionCount !== undefined ? exam.questionCount : (questions?.length || 0);
  const durationMinutes = Math.floor((exam?.duration || 600) / 60);

  return (
    <div className="page-wrapper">
      <Header disableBrandLink showAdmin={false} />

      <StudentAuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        initialExamTitle={exam?.title}
        onSuccess={(loggedUser) => {
          setShowAuthModal(false);
        }}
      />

      <div className="center-page">
        <div className="glow glow-1" style={{ top: '-200px', left: '-150px' }} />
        <div className="glow glow-2" style={{ bottom: '-200px', right: '-150px' }} />

        {/* ────────────────────────────────────────────────────────
            CASE 1 & CASE 2: STUDENT NOT AUTHENTICATED
        ──────────────────────────────────────────────────────── */}
        {!user && (
          <div className="student-landing-card page-enter" style={{ maxWidth: 540 }}>
            {/* Header with DevPhoenix Identity */}
            <div className="exam-card-header" style={{ marginBottom: 24 }}>
              <img src="/mascot.jpeg" alt="Phoenix" className="exam-mascot logo-blend" />
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)', color: 'var(--primary-light)', fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Lock size={12} /> Authentication Required
                </div>
                <h2 className="exam-card-title">{exam.title}</h2>
                {subject && <span className="badge badge-orange" style={{ marginTop: 4 }}>{subject.name}</span>}
              </div>
            </div>

            {/* Assessment Access Restriction Notice */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary-light)' }} /> Verified Student Access Only
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This is a protected AI-proctored examination. To ensure test integrity, you must be logged into a verified student account before starting.
              </p>
            </div>

            {/* Two Action Paths */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {/* Option A: Create Account */}
              <div
                onClick={() => navigate(`/register?redirect=${encodedRedirect}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(247,127,0,0.1))',
                  border: '1px solid rgba(230,57,70,0.4)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(230,57,70,0.4)'; }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'var(--primary)', color: '#fff', textTransform: 'uppercase' }}>New Student</span>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Create Student Account</h4>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Register and verify your email to unlock this assessment</p>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--primary-light)', flexShrink: 0, marginLeft: 12 }} />
              </div>

              {/* Option B: Sign In */}
              <div
                onClick={() => navigate(`/login?redirect=${encodedRedirect}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#ddd', textTransform: 'uppercase' }}>Existing</span>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Sign In to Existing Account</h4>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Already registered? Log in with your email & password</p>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 12 }} />
              </div>
            </div>

            {/* In-Page Fast Modal Trigger */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 4 }}
              >
                Or sign in quickly using pop-up modal
              </button>
            </div>

            {/* Anti-cheat notice */}
            <div className="anti-cheat-notice">
              <ShieldAlert size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p>
                <strong style={{ color: 'var(--danger)' }}>AI Proctoring Active.</strong> Fullscreen enforcement, webcam facial verification, and tab switch detection will be enabled once you begin.
              </p>
            </div>

            <p className="footer-note" style={{ marginTop: 20 }}>© DevPhoenix · AI-Proctored Session</p>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            CASE 4: STUDENT AUTHENTICATED BUT UNVERIFIED EMAIL
        ──────────────────────────────────────────────────────── */}
        {user && !user.isVerified && (
          <div className="student-landing-card page-enter" style={{ maxWidth: 520 }}>
            <div className="exam-card-header" style={{ marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
                <Mail size={28} />
              </div>
              <div>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 6 }}>
                  Action Required
                </span>
                <h2 className="exam-card-title">Email Verification Required</h2>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 14, color: '#fff', marginBottom: 8, lineHeight: 1.5 }}>
                Your student account for <strong>{user.email}</strong> is registered, but your email has not been verified yet.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Please enter the 6-digit verification code sent to your inbox to unlock <strong>{exam.title}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => navigate('/verify-otp', {
                  state: {
                    userId: user.id || user._id,
                    email: user.email,
                    redirect: redirectPath,
                  },
                })}
                className="btn btn-primary btn-full"
                style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700 }}
              >
                <KeyRound size={16} /> Enter Verification Code (OTP) <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                className="btn btn-secondary btn-full"
                style={{ padding: '12px 20px', fontSize: 13 }}
              >
                <RefreshCw size={14} /> Resend Verification Code
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Signed in as {user.email}</span>
              <button
                type="button"
                onClick={logout}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            CASE 3: STUDENT AUTHENTICATED & FULLY VERIFIED
        ──────────────────────────────────────────────────────── */}
        {user && user.isVerified && (
          <div className="student-landing-card page-enter" style={{ maxWidth: 580 }}>
            {/* Verified Student Header Identity Pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, background: 'var(--success)', color: '#09090b', textTransform: 'uppercase' }}>
                      <Check size={9} strokeWidth={3} /> Verified
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Switch student account"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <LogOut size={11} /> Switch
              </button>
            </div>

            {/* Assessment Title & Details */}
            <div className="exam-card-header">
              <img src="/mascot.jpeg" alt="Phoenix" className="exam-mascot logo-blend" />
              <div>
                <h2 className="exam-card-title">{exam.title}</h2>
                {subject && <span className="badge badge-orange">{subject.name}</span>}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="exam-stats-row">
              {[
                [questionCount, 'Questions', BookOpen],
                [`${durationMinutes}m`, 'Duration', Clock],
                [totalMarks, 'Max Marks', Star],
              ].map(([val, label, Icon]) => (
                <div key={label} className="exam-stat">
                  <Icon size={16} style={{ color: 'var(--secondary)', marginBottom: 4 }} />
                  <p className="exam-stat-val">{val}</p>
                  <p className="exam-stat-label">{label}</p>
                </div>
              ))}
            </div>

            {/* Instructions & Proctoring Rules Checklist */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Examination Rules & Integrity Requirements
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.8 }}>
                <li><strong>Fullscreen Locked:</strong> Exiting fullscreen pauses the test timer.</li>
                <li><strong>Webcam Proctoring:</strong> Facial recognition tracks absence or multiple faces.</li>
                <li><strong>Tab & Window Tracking:</strong> Navigating away records a violation warning.</li>
                <li><strong>3 Warnings Limit:</strong> 3 detected violations will void and disqualify the session.</li>
              </ul>
            </div>

            {/* Anti-cheat notice */}
            <div className="anti-cheat-notice">
              <ShieldAlert size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p>
                <strong style={{ color: 'var(--danger)' }}>System Check Required.</strong> You will be guided through webcam and network verification before the examination begins.
              </p>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartExam}
              className="btn btn-primary btn-full"
              style={{ padding: '16px 24px', fontSize: 15, fontWeight: 700, marginTop: 20 }}
            >
              Continue to System Check <ArrowRight size={18} />
            </button>

            <p className="footer-note" style={{ marginTop: 18 }}>© DevPhoenix · AI-Proctored Session</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. SYSTEM CHECK
═══════════════════════════════════════════════════════ */
function SystemCheck() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentName = user?.name || sessionStorage.getItem('dp_student');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [camOk, setCamOk] = useState(false);
  const [camErr, setCamErr] = useState('');
  const [internet, setInternet] = useState(navigator.onLine);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!studentName && !user) { navigate(`/exam/${examId}`); return; }

    const existing = DB.results.get().find(r => r.examId === examId && r.studentName === studentName);
    const submittedFlag = sessionStorage.getItem(`dp_submitted_${examId}_${studentName}`);
    if (existing || submittedFlag) {
      toast.error('🚫 Exam already submitted! You cannot re-attempt this exam.', { id: 'already-sub-sc' });
      stopGlobalWebcamStreams();
      navigate(existing ? `/thankyou/${existing.id}` : '/', { replace: true });
      return;
    }

    const on = () => setInternet(true);
    const off = () => setInternet(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        .then(s => {
          streamRef.current = s;
          registerStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
          setCamOk(true);
        })
        .catch(err => setCamErr(err.name === 'NotAllowedError' ? 'Permission denied. Please allow camera access.' : 'Camera not available.'));
    } else {
      setCamErr('Camera API not supported in this browser.');
    }

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      stopGlobalWebcamStreams();
    };
  }, [examId, navigate, studentName]);

  const retryCamera = async () => {
    setCamErr('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = s;
      registerStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamOk(true);
    } catch (err) {
      setCamErr(err.name === 'NotAllowedError' ? 'Permission denied. Allow camera in browser settings.' : 'Camera error. Try again.');
    }
  };

  const go = async () => {
    if (!internet) { toast.error('No internet connection'); return; }
    setStarting(true);
    stopGlobalWebcamStreams();
    if (videoRef.current) videoRef.current.srcObject = null;
    document.body.classList.add('mobile-fullscreen-active');
    if (!isMobile && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
      try {
        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (rfs) await rfs.call(el);
      } catch (err) {
        console.warn('Fullscreen request failed on start:', err);
      }
    }
    sessionStorage.setItem('dp_start_time', Date.now().toString());
    navigate(`/exam/${examId}/take`);
  };

  const CheckRow = ({ ok, icon: Icon, label, sub, onRetry }) => (
    <div className={`check-row ${ok ? 'check-ok' : 'check-pending'}`}>
      <div className={`check-icon ${ok ? 'check-icon-ok' : ''}`}>
        <Icon size={18} />
      </div>
      <div className="check-info">
        <p className="check-label">{label}</p>
        <p className="check-sub">{sub}</p>
      </div>
      {ok
        ? <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
        : onRetry && <button onClick={onRetry} className="btn btn-secondary btn-sm">Retry</button>
      }
    </div>
  );

  return (
    <div className="center-page" style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
      <div className="glow glow-1" style={{ top: '-250px', right: '-150px' }} />

      <div className="card card-gradient-border page-enter" style={{ maxWidth: 680, width: '100%', padding: 36, position: 'relative', zIndex: 1 }}>
        {/* Title bar */}
        <div className="sc-header">
          <button onClick={() => navigate(`/exam/${examId}`)} className="btn btn-icon" style={{ padding: 8 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>System Check</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Preparing environment for <strong style={{ color: 'var(--text-secondary)' }}>{studentName}</strong></p>
          </div>
        </div>

        <div className="sc-grid">
          {/* Checklist */}
          <div className="sc-checklist">
            <CheckRow icon={Wifi} label="Internet Connection" ok={internet}
              sub={internet ? 'Connected and stable' : 'No connection detected!'} />
            <CheckRow icon={Camera} label="Webcam / Camera" ok={camOk}
              sub={camErr || (camOk ? 'Camera ready for AI proctoring' : 'Connecting to camera...')}
              onRetry={!camOk ? retryCamera : null}
            />
            <CheckRow icon={Maximize2} label="Fullscreen Mode" ok={false}
              sub="Will enter fullscreen automatically when you start" />

            <div className="ai-notice">
              <ShieldAlert size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p><strong style={{ color: 'var(--danger)' }}>AI Proctoring is ON.</strong> Face & eye tracking monitors session. Exiting fullscreen freezes exam. {MAX_WARNINGS} warnings = disqualification.</p>
            </div>
          </div>

          {/* Camera preview */}
          <div className="cam-preview">
            <div className="cam-feed">
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: camOk ? 'block' : 'none' }} />
              {!camOk && (
                <div className="cam-placeholder">
                  <Camera size={36} style={{ color: 'var(--text-muted)', opacity: .3 }} />
                  <p>{camErr || 'Connecting to camera...'}</p>
                  {camErr && <button onClick={retryCamera} className="btn btn-secondary btn-sm">Retry Camera</button>}
                </div>
              )}
              {camOk && (
                <div className="cam-live-badge">
                  <div className="live-dot" style={{ width: 5, height: 5 }} />
                  <span>LIVE</span>
                </div>
              )}
            </div>
            <p className="cam-footer-note">AI face & eye detection active during exam</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sc-footer">
          <span style={{ fontSize: 13, fontWeight: 600, color: internet ? 'var(--success)' : 'var(--danger)' }}>
            {internet ? '✓ Ready to begin' : '✗ Internet required'}
          </span>
          <button onClick={go} disabled={!internet || starting} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
            {starting ? <><div className="spinner spinner-sm" />Starting...</> : <>Start Exam <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. EXAM TAKE  (fullscreen lock + freeze + AI proctoring)
═══════════════════════════════════════════════════════ */
function ExamTake() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentName = user?.name || sessionStorage.getItem('dp_student');

  // Memoize once — doesn't change during session
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600);
  const [showConfirm, setShowConfirm] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [warningBanner, setWarningBanner] = useState(null);
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState('');
  // On mobile: always treat as fullscreen (native API not supported on iOS)
  const [isFullscreen, setIsFullscreen] = useState(
    isMobile || !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const cocoModelRef = useRef(null);
  const warningCountRef = useRef(0);
  const terminatedRef = useRef(false);
  const warningCooldown = useRef(false);
  const timerRef = useRef(null);
  const mountTimeRef = useRef(Date.now());
  const isSubmittingRef = useRef(false);
  const isDetectingRef = useRef(false);

  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  const questionsRef = useRef(questions);
  const examRef = useRef(exam);
  const studentNameRef = useRef(studentName);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { studentNameRef.current = studentName; }, [studentName]);

  const noFaceFramesRef = useRef(0);
  const multiFaceFramesRef = useRef(0);
  const phoneFramesRef = useRef(0);
  const gazeFramesRef = useRef(0);
  const pitchFramesRef = useRef(0);
  const eyeFramesRef = useRef(0);

  const stopCameraAndExamProctoring = useCallback(() => {
    document.body.classList.remove('mobile-fullscreen-active');
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
      } catch { }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamActive(false);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if (efs) efs.call(document).catch(() => { });
      } catch { }
    }
  }, []);

  const saveResult = useCallback((cheated = false) => {
    let score = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const answerBreakdown = [];
    const currentQuestions = questionsRef.current;
    const currentAnswers = answersRef.current;
    const currentExam = examRef.current;
    const currentStudent = studentNameRef.current || 'Student';
    const currentTimeLeft = timeLeftRef.current;

    currentQuestions.forEach((q, idx) => {
      const selected = currentAnswers[q.id] || null;
      const isCor = selected === q.correctAnswer;
      const qMarks = q.marks || 1;

      if (!selected) {
        skipped++;
      } else if (isCor) {
        correct++;
        score += qMarks;
      } else {
        wrong++;
      }

      answerBreakdown.push({
        questionId: q.id || `q_${idx + 1}`,
        questionText: q.questionText || `Question ${idx + 1}`,
        options: q.options || {},
        selectedOption: selected,
        correctAnswer: q.correctAnswer,
        isCorrect: isCor,
        marks: isCor ? qMarks : 0,
        maxMarks: qMarks,
        explanation: q.explanation || '',
      });
    });

    const totalMarks = currentQuestions.reduce((s, q) => s + (q.marks || 0), 0) || 100;
    const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(1)) : 0;
    const isPassed = score >= (currentExam?.passingMarks || Math.round(totalMarks * 0.4));

    const r = {
      id: genId('res'),
      examId,
      studentName: currentStudent,
      score,
      totalMarks,
      percentage,
      isPassed,
      correct,
      wrong,
      skipped,
      totalQuestions: currentQuestions.length,
      cheated,
      warnings: warningCountRef.current,
      status: cheated ? 'Disqualified' : 'Completed',
      date: new Date().toLocaleString(),
      answers: currentAnswers,
      questions: currentQuestions,
      answerBreakdown,
      timeTaken: Math.max(0, (currentExam?.duration || 600) - currentTimeLeft)
    };

    DB.results.set([r, ...DB.results.get()]);
    return r;
  }, [examId]);

  const doSubmit = useCallback(async (cheated = false, timeUp = false) => {
    if (!questionsRef.current.length) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    clearInterval(timerRef.current);
    stopCameraAndExamProctoring();
    stopGlobalWebcamStreams();

    const localResult = saveResult(cheated);
    let finalResultId = localResult.id;
    const currentStudent = studentNameRef.current;
    const currentAnswers = answersRef.current;
    const currentTimeLeft = timeLeftRef.current;
    const currentExam = examRef.current;

    if (currentStudent && examId) {
      sessionStorage.setItem(`dp_submitted_${examId}_${currentStudent}`, 'true');
    }

    try {
      const { data } = await api.post(`/student/exams/${examId}/submit`, {
        answers: currentAnswers,
        cheated,
        timeUp,
        warnings: warningCountRef.current,
        timeTaken: Math.max(0, (currentExam?.duration || 600) - currentTimeLeft),
      });
      if (data?.data?.resultId || data?.data?.id || data?.data?._id) {
        finalResultId = data.data.resultId || data.data.id || data.data._id;
        const allRes = DB.results.get();
        if (allRes.length > 0 && allRes[0].id === localResult.id) {
          allRes[0].id = finalResultId;
          allRes[0]._id = finalResultId;
          DB.results.set(allRes);
        }
      }
    } catch (err) {
      console.warn('Submit API error:', err.response?.data?.message || err.message);
    }

    if (!cheated) {
      if (timeUp) toast('⏰ Time is up! Exam auto-submitted.', { duration: 3000 });
      else toast.success('✅ Exam submitted successfully!');
      navigate(`/thankyou/${finalResultId}`, { replace: true });
    } else {
      navigate('/cheated', { replace: true });
    }
  }, [saveResult, navigate, stopCameraAndExamProctoring, examId]);

  const triggerViolation = useCallback((reason) => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;
    clearInterval(timerRef.current);
    stopCameraAndExamProctoring();
    doSubmit(true);
    setTimeout(() => navigate('/cheated'), 800);
  }, [doSubmit, navigate, stopCameraAndExamProctoring]);

  const triggerWarning = useCallback((reason) => {
    if (terminatedRef.current || warningCooldown.current) return;
    warningCooldown.current = true;
    setTimeout(() => { warningCooldown.current = false; }, 2500);

    const newCount = warningCountRef.current + 1;
    warningCountRef.current = newCount;
    setWarnings(newCount);
    setWarningBanner({ msg: reason, count: newCount });
    setTimeout(() => setWarningBanner(null), 4500);

    api.post('/student/cheat/log', {
      examId,
      type: 'warning',
      details: reason,
    }).catch(() => {});

    if (newCount >= MAX_WARNINGS) {
      setTimeout(() => triggerViolation(`${MAX_WARNINGS} warnings exceeded: ${reason}`), 400);
    } else {
      toast.error(`🚨 PROCTORING ALERT (${newCount}/${MAX_WARNINGS}): ${reason}`, { duration: 4000, id: 'proctor-alert' });
    }
  }, [triggerViolation, examId]);

  const initWebcam = useCallback(async () => {
    setCamError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera API not supported in this browser.');
      toast.error('Webcam not supported in this browser.');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      streamRef.current = s;
      registerStream(s);
      setCamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('[PROCTOR_CAMERA_ERROR]', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Camera permission denied. Please allow camera access for AI proctoring.'
        : 'Unable to access webcam. Please check camera settings.';
      setCamError(msg);
      toast.error(msg, { id: 'cam-proctor-error', duration: 5000 });
    }
  }, []);

  // Ensure live video element gets attached whenever video DOM node mounts or stream updates
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [questions.length, camActive]);

  // Load exam data & start webcam (with Submission Guard)
  useEffect(() => {
    if (!studentName && !user) { navigate('/'); return; }

    const existing = DB.results.get().find(r => r.examId === examId && (studentName ? r.studentName === studentName : false));
    const submittedFlag = studentName ? sessionStorage.getItem(`dp_submitted_${examId}_${studentName}`) : null;
    if (existing || submittedFlag) {
      toast.error('🚫 Exam already submitted! Re-entry is blocked to prevent cheating.', { id: 'already-sub-ex' });
      stopGlobalWebcamStreams();
      navigate(existing ? `/thankyou/${existing.id}` : '/', { replace: true });
      return;
    }

    let isMounted = true;

    // 1. Authoritative Backend Exam Start
    api.post(`/student/exams/${examId}/start`)
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.data) {
          const { questions: serverQs, exam: serverExam, session: serverSession } = data.data;
          if (serverExam) {
            setExam({
              id: serverExam.id || serverExam._id || examId,
              subjectId: serverExam.subjectId || 's1',
              title: serverExam.title || 'AI Proctored Assessment',
              duration: (serverExam.duration || 10) * 60,
              totalMarks: serverExam.totalMarks || 40,
              passingMarks: serverExam.passingMarks || 16,
              maxWarnings: serverExam.maxWarnings || 3,
            });
          }
          if (serverSession) {
            if (serverSession.timeRemaining !== undefined) {
              setTimeLeft(serverSession.timeRemaining);
            } else if (serverExam?.duration) {
              setTimeLeft((serverExam.duration || 10) * 60);
            }
            if (serverSession.warningCount !== undefined) {
              warningCountRef.current = serverSession.warningCount;
              setWarnings(serverSession.warningCount);
            }
            if (serverSession.answers && Array.isArray(serverSession.answers)) {
              const existingAns = {};
              serverSession.answers.forEach(a => {
                if (a.questionId && a.selectedOption) {
                  existingAns[a.questionId.toString()] = a.selectedOption;
                }
              });
              setAnswers(p => ({ ...existingAns, ...p }));
            }
          }
          if (serverQs && serverQs.length > 0) {
            const formatted = serverQs.map((q) => ({
              id: q._id || q.id,
              subjectId: q.subjectId || serverExam?.subjectId || 's1',
              questionText: q.questionText,
              options: q.options || {},
              correctAnswer: q.correctAnswer,
              marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
              explanation: q.explanation || '',
            }));
            setQuestions(formatted);
            return;
          }
        }
      })
      .catch((err) => {
        console.warn('Start exam API note:', err.response?.data?.message || err.message);
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already submitted')) {
          toast.error('🚫 You have already submitted this assessment.');
          navigate('/', { replace: true });
          return;
        }

        // Fallback: try questions endpoint
        api.get(`/admin/exams/${examId}/questions`)
          .then(({ data }) => {
            if (data?.data?.length > 0 && isMounted) {
              const formatted = data.data.map((q) => ({
                id: q._id || q.id,
                subjectId: exam?.subjectId || 's1',
                questionText: q.questionText,
                options: q.options || {},
                correctAnswer: q.correctAnswer,
                marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
                explanation: q.explanation || '',
              }));
              setQuestions(formatted);
            }
          })
          .catch(() => {
            // Local DB fallback
            let ex = DB.exams.get().find(e => e.id === examId);
            if (!ex && examId) {
              ex = { id: examId, subjectId: 's1', title: 'AI Proctored Assessment', duration: 600 };
            }
            if (ex && isMounted) {
              setExam(ex);
              setTimeLeft(ex.duration || 600);
              let qs = DB.questions.get().filter(q => q.subjectId === ex.subjectId);
              if (!qs || qs.length === 0) qs = DB.questions.get();
              if (!qs || qs.length === 0) qs = SEED.questions;
              setQuestions(qs);
            }
          });
      });

    stopGlobalWebcamStreams();
    initWebcam();

    return () => {
      isMounted = false;
      document.body.classList.remove('mobile-fullscreen-active');
      stopGlobalWebcamStreams();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [examId, navigate, studentName, user, initWebcam]);

  // Initial Fullscreen Check
  useEffect(() => {
    if (isMobile) {
      setIsFullscreen(true);
      return;
    }
    const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    setIsFullscreen(inFS);
  }, [isMobile]);

  // Load Vision Models: COCO-SSD (Phone / Person Detection) & face-api.js (Facial Landmarks)
  useEffect(() => {
    let isMounted = true;
    const initVisionModels = async () => {
      try {
        await tf.ready();
        const coco = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (isMounted) {
          cocoModelRef.current = coco;
          setDetectorReady(true);
        }
      } catch (err) {
        console.warn('[COCO_SSD_INIT_ERROR]', err);
      }

      try {
        const faceapi = window.faceapi;
        if (faceapi) {
          const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUrl)
          ]);
          if (isMounted) setFaceApiReady(true);
        }
      } catch (err) {
        console.warn('[FACEAPI_INIT_ERROR]', err);
      }
    };

    initVisionModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // AI Face, Multiple Face & Mobile Phone Detection (Throttled 900ms Interval with Temporal Buffer)
  useEffect(() => {
    if (!detectorReady && !faceApiReady) return;
    if (!isFullscreen) return; // Pause proctoring when exam is frozen

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (
        !video ||
        terminatedRef.current ||
        isDetectingRef.current ||
        video.readyState < 2 ||
        !video.videoWidth ||
        !video.videoHeight ||
        video.paused ||
        video.ended
      ) {
        return;
      }

      // Initial grace period on exam mount
      if (Date.now() - mountTimeRef.current < 4000) return;

      isDetectingRef.current = true;

      try {
        const faceapi = window.faceapi;
        let faceCount = null;
        let landmarksData = null;

        // 1. Dedicated Face Detection & Landmarks
        if (faceApiReady && faceapi?.nets?.tinyFaceDetector?.params) {
          try {
            const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.30 });
            const detections = await faceapi.detectAllFaces(video, opts).withFaceLandmarks(true);
            faceCount = detections.length;
            if (detections.length === 1) {
              landmarksData = detections[0];
            }
          } catch (e) {
            console.debug('[FACE_INFERENCE_ERR]', e);
          }
        }

        // 2. Object & Phone Detection via COCO-SSD
        let phoneDetected = false;
        let cocoPersonCount = 0;

        if (cocoModelRef.current) {
          try {
            const predictions = await cocoModelRef.current.detect(video, 10, 0.40);
            predictions.forEach(p => {
              const cls = (p.class || '').toLowerCase();
              if (cls === 'cell phone' || cls === 'phone' || (cls === 'remote' && p.score >= 0.60)) {
                if (p.score >= 0.45) {
                  phoneDetected = true;
                }
              }
              if (cls === 'person' && p.score >= 0.45) {
                cocoPersonCount += 1;
              }
            });
          } catch (e) {
            console.debug('[COCO_INFERENCE_ERR]', e);
          }
        }

        // Use COCO person count as reliable fallback if faceapi was not available
        if (faceCount === null) {
          faceCount = cocoPersonCount;
        }

        // ── 3. TEMPORAL EVALUATION (Do not warn for single missed frame) ──

        // A. Phone Detection Evaluation
        if (phoneDetected) {
          phoneFramesRef.current += 1;
          if (phoneFramesRef.current >= 3) {
            triggerWarning('📱 Mobile Phone Detected in Camera! External devices are strictly prohibited.');
            phoneFramesRef.current = 0;
          }
        } else {
          phoneFramesRef.current = Math.max(0, phoneFramesRef.current - 1);
        }

        // B. Face Count Evaluation (0 faces / 1 face / multiple faces)
        if (faceCount === 0) {
          noFaceFramesRef.current += 1;
          multiFaceFramesRef.current = 0;
          gazeFramesRef.current = 0;
          pitchFramesRef.current = 0;
          eyeFramesRef.current = 0;

          if (noFaceFramesRef.current >= 4) {
            triggerWarning('📷 Face Not Detected / Camera Blocked! Stay centered in front of camera.');
            noFaceFramesRef.current = 0;
          }
        } else if (faceCount > 1) {
          multiFaceFramesRef.current += 1;
          noFaceFramesRef.current = 0;
          gazeFramesRef.current = 0;
          pitchFramesRef.current = 0;
          eyeFramesRef.current = 0;

          if (multiFaceFramesRef.current >= 3) {
            triggerWarning('⚠️ Multiple Persons / Secondary Device Detected in Camera!');
            multiFaceFramesRef.current = 0;
          }
        } else {
          // Exactly 1 face (Normal expected state)
          noFaceFramesRef.current = 0;
          multiFaceFramesRef.current = 0;

          // Head Pose & Eye Gaze Evaluation when landmarks are available
          if (landmarksData?.landmarks) {
            const landmarks = landmarksData.landmarks;
            const box = landmarksData.detection?.box;
            const faceWidth = box ? box.width : 160;

            if (faceWidth > 0) {
              const nose = landmarks.getNose();
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const jaw = landmarks.getJawOutline();

              const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
              const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;
              const noseX = nose[3].x;
              const noseY = nose[3].y;
              const jawY = jaw[8].y;

              const gazeOffset = Math.abs(eyeCenterX - noseX) / faceWidth;
              const noseToEye = Math.abs(noseY - eyeCenterY);
              const jawToNose = Math.abs(jawY - noseY);
              const pitchRatio = noseToEye / (jawToNose || 1);

              if (gazeOffset > 0.24) {
                gazeFramesRef.current += 1;
                if (gazeFramesRef.current >= 5) {
                  triggerWarning('👀 Eye Gaze Shift: Looking away from exam screen!');
                  gazeFramesRef.current = 0;
                }
              } else {
                gazeFramesRef.current = 0;
              }

              if (pitchRatio < 0.20 || pitchRatio > 1.90) {
                pitchFramesRef.current += 1;
                if (pitchFramesRef.current >= 5) {
                  triggerWarning('📱 Head Tilted Down: Looking down at mobile phone / paper!');
                  pitchFramesRef.current = 0;
                }
              } else {
                pitchFramesRef.current = 0;
              }
            }
          }
        }
      } catch (err) {
        console.debug('[PROCTOR_INFERENCE_ERROR]', err);
      } finally {
        isDetectingRef.current = false;
      }
    }, 900);

    return () => clearInterval(interval);
  }, [detectorReady, faceApiReady, isFullscreen, triggerWarning]);

  // Anti-cheat: tab switch & standard fullscreen API monitoring
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !terminatedRef.current) {
        triggerViolation('Tab switch / window hidden detected! Exam terminated.');
      }
    };
    const onFS = () => {
      if (isMobile) return; // Mobile never loses fullscreen via this event
      const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      setIsFullscreen(inFS);
      if (!inFS && !terminatedRef.current) {
        triggerWarning('Fullscreen exited! Exam timer and questions are now FROZEN.');
      }
    };
    const onFSErr = (err) => {
      console.warn('Fullscreen error:', err);
      if (!isMobile) {
        const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
        setIsFullscreen(inFS);
      }
    };
    const blockCtx = e => e.preventDefault();
    const blockKeys = e => {
      if (
        e.key === 'F12' ||
        e.key === 'Escape' ||
        (e.ctrlKey && ['c', 'v', 'u', 's', 'p', 'a', 'f'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFS);
    document.addEventListener('webkitfullscreenchange', onFS);
    document.addEventListener('mozfullscreenchange', onFS);
    document.addEventListener('fullscreenerror', onFSErr);
    document.addEventListener('webkitfullscreenerror', onFSErr);
    document.addEventListener('contextmenu', blockCtx);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFS);
      document.removeEventListener('webkitfullscreenchange', onFS);
      document.removeEventListener('mozfullscreenchange', onFS);
      document.removeEventListener('fullscreenerror', onFSErr);
      document.removeEventListener('webkitfullscreenerror', onFSErr);
      document.removeEventListener('contextmenu', blockCtx);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [triggerViolation, triggerWarning]);

  // Timer — Starts when exam is ready; pauses only if fullscreen is exited; auto-submits on 00:00
  useEffect(() => {
    if (!exam || !isFullscreen) return;

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!terminatedRef.current) {
            doSubmit(false, true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [exam?.id, isFullscreen, doSubmit]);

  const resumeFullscreen = async () => {
    document.body.classList.add('mobile-fullscreen-active');
    if (isMobile) {
      setIsFullscreen(true);
      toast.success('📱 Mobile exam view active. Timer resumed.');
      return;
    }
    if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
      try {
        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (rfs) await rfs.call(el);
        setIsFullscreen(true);
        toast.success('Fullscreen resumed. Timer active.');
      } catch (err) {
        console.warn('Resume fullscreen error:', err);
        toast.error('Unable to enter fullscreen mode. Please check browser permissions.');
      }
    } else {
      setIsFullscreen(true);
      toast.success('Exam view active. Timer resumed.');
    }
  };

  const fmtTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!questions.length) return (
    <div className="center-page" style={{ minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16 }}>Loading exam...</p>
    </div>
  );

  const q = questions[idx];
  const answered = Object.keys(answers).length;
  const urgentTime = timeLeft < 60;

  return (
    <div className="exam-wrapper">
      <ConfirmModal
        open={showConfirm}
        title="Submit Exam?"
        message={`You've answered ${answered} of ${questions.length} questions. Once submitted, answers cannot be changed.`}
        confirmLabel="Yes, Submit"
        onConfirm={() => { setShowConfirm(false); doSubmit(false, false); }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* FULLSCREEN EXITED — FREEZE OVERLAY MODAL */}
      {!isFullscreen && (
        <div className="exam-freeze-overlay">
          <div className="exam-freeze-card">
            <div className="freeze-icon-wrap">
              <AlertTriangle size={38} />
            </div>
            <h2 className="freeze-title">🚨 EXAM FROZEN — Fullscreen Required</h2>
            <p className="freeze-body">
              Your exam timer and questions have been <strong style={{ color: '#fff' }}>FROZEN</strong> because you exited Fullscreen mode.
              You must return to Fullscreen mode immediately to resume your assessment.
            </p>
            <button onClick={resumeFullscreen} className="btn btn-primary btn-xl" style={{ width: '100%', justifyContent: 'center' }}>
              <Maximize2 size={18} /> Resume Exam & Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {warningBanner && (
        <div className="warning-banner">
          <AlertTriangle size={18} />
          <span>⚠️ Warning {warningBanner.count}/{MAX_WARNINGS}: {warningBanner.msg}</span>
          <button onClick={() => setWarningBanner(null)} className="warning-close"><X size={15} /></button>
        </div>
      )}

      {/* Exam Header */}
      <header className="exam-header">
        <div className="exam-header-left">
          <div className="brand-logo-wrap" style={{ marginRight: 6 }}>
            <img src="/logo.png" alt="DevPhoenix" className="header-logo-img" />
          </div>
          <div className="proctor-badge">
            <div className="live-dot" />
            <span>Proctored</span>
          </div>
          <span className="badge badge-red badge-pulse" style={{ fontSize: 9 }}>AI ACTIVE</span>
          {warnings > 0 && (
            <span className="badge badge-orange" style={{ fontSize: 9 }}>
              ⚠️ {warnings}/{MAX_WARNINGS}
            </span>
          )}
        </div>

        <div className="exam-header-right">
          <div className="cam-thumb" style={{ position: 'relative', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => { e.target.play().catch(() => {}); }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {camError && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4, textAlign: 'center' }}>
                <Camera size={16} style={{ color: 'var(--danger)', marginBottom: 2 }} />
                <span style={{ fontSize: 8, color: 'var(--danger)', lineHeight: 1.1 }}>Cam Blocked</span>
                <button onClick={initWebcam} className="btn btn-secondary btn-sm" style={{ fontSize: 8, padding: '2px 6px', marginTop: 3 }}>Retry</button>
              </div>
            )}
          </div>

          <div className={`exam-timer ${urgentTime ? 'exam-timer-urgent' : ''}`}>
            <Clock size={13} />
            <span>{fmtTime()}</span>
          </div>

          <button onClick={() => setShowConfirm(true)} className="btn btn-primary btn-sm">
            Submit
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="exam-body">
        {/* Sidebar */}
        <aside className="exam-sidebar">
          <div>
            <p className="sidebar-section-title">Progress</p>
            <p className="sidebar-progress-text" style={{ color: answered === questions.length ? 'var(--success)' : 'var(--text-secondary)' }}>
              {answered}/{questions.length} answered
            </p>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
            </div>
          </div>

          <div>
            <p className="sidebar-section-title">Questions</p>
            <div className="question-palette">
              {questions.map((qq, i) => (
                <button
                  key={qq.id}
                  onClick={() => setIdx(i)}
                  className={`palette-btn ${idx === i ? 'current' : answers[qq.id] ? 'answered' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="palette-legend">
            {[{ color: 'var(--primary)', label: 'Current' }, { color: 'var(--secondary)', label: 'Answered' }, { color: 'var(--bg-elevated)', label: 'Skipped' }].map(item => (
              <div key={item.label} className="legend-item">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Question Area */}
        <main className="exam-main">
          <div className="fade-in" key={idx}>
            <div className="question-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-orange">Q{idx + 1}/{questions.length}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.marks} marks</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setIdx(p => Math.max(0, p - 1))} disabled={idx === 0} className="btn btn-icon btn-sm">
                  <ArrowLeft size={14} />
                </button>
                <button onClick={() => setIdx(p => Math.min(questions.length - 1, p + 1))} disabled={idx === questions.length - 1} className="btn btn-icon btn-sm">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <h2 className="question-text">{q.questionText}</h2>

            <div className="options-list">
              {Object.entries(q.options || {}).map(([key, val]) => {
                const sel = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setAnswers(p => ({ ...p, [q.id]: key }));
                      api.post(`/student/exams/${examId}/save-answer`, {
                        questionId: q.id,
                        selectedOption: key,
                        currentQuestion: idx,
                        timeRemaining: timeLeft,
                      }).catch(() => {});
                    }}
                    className={`option-btn ${sel ? 'selected' : ''}`}
                  >
                    <span className="option-key">{key}</span>
                    <span style={{ flex: 1, textAlign: 'left', lineHeight: 1.5 }}>{val}</span>
                    {sel && <CheckCircle2 size={18} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            <div className="question-nav">
              <button onClick={() => setIdx(p => Math.max(0, p - 1))} disabled={idx === 0} className="btn btn-secondary">
                <ArrowLeft size={15} /> Previous
              </button>
              {idx < questions.length - 1
                ? <button onClick={() => setIdx(p => p + 1)} className="btn btn-primary">
                  Next <ArrowRight size={15} />
                </button>
                : <button onClick={() => setShowConfirm(true)} className="btn btn-primary">
                  Finish & Submit <CheckCircle2 size={15} />
                </button>
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   5. THANK YOU PAGE
═══════════════════════════════════════════════════════ */
function ThankYouPage() {
  const { resultId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    stopGlobalWebcamStreams();
    let isMounted = true;

    const loadData = async () => {
      // 1. Try Backend API first
      try {
        let res = null;
        try {
          res = await api.get(`/student/results/${resultId}`);
        } catch (_) {
          try {
            res = await api.get(`/admin/results/${resultId}`);
          } catch (_) {}
        }
        if (res?.data?.data && isMounted) {
          const d = res.data.data;
          setResult({
            id: d._id || resultId,
            examId: d.examId?._id || d.examId || '',
            studentName: d.studentId?.name || d.studentName || 'Student',
            score: d.score,
            totalMarks: d.totalMarks || d.examId?.totalMarks || 100,
            warnings: d.sessionId?.warningCount || d.warnings || 0,
            timeTaken: d.timeTaken || 0,
            date: d.calculatedAt ? new Date(d.calculatedAt).toLocaleString() : new Date().toLocaleString(),
          });
          return;
        }
      } catch (_) {}

      // 2. Fallback to localStorage
      if (isMounted) {
        const localResults = DB.results.get() || [];
        const r = localResults.find(r => r.id === resultId || r.id === String(resultId) || r._id === resultId);
        if (r) {
          setResult(r);
        } else if (localResults.length > 0) {
          setResult(localResults[0]);
        } else {
          setResult({
            id: String(resultId || 'res'),
            examId: '',
            studentName: user?.name || 'Student',
            score: 0,
            totalMarks: 100,
            warnings: 0,
            timeTaken: 0,
            date: new Date().toLocaleString(),
          });
        }
      }
    };

    loadData();

    // Trap browser back button so user cannot return to exam page
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error('🚫 Exam submitted. Back button is disabled to prevent cheating.', { id: 'no-back-ty' });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
      stopGlobalWebcamStreams();
    };
  }, [resultId, user?.name]);

  if (!result) return (
    <div className="center-page" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  const pct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const passed = pct >= 50;
  const circumference = 2 * Math.PI * 58;

  return (
    <div className="thankyou-page">
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: .5 }} />
      <div className="glow glow-1" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />

      <div className="thankyou-content page-enter">
        <div className="ty-badge">
          <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
          <span>Exam Submitted Successfully</span>
        </div>

        <h1 className="ty-title">
          Thank You for<br /><span className="gradient-text">Participating!</span>
        </h1>
        <p className="ty-sub">Your proctored exam session has been recorded. Here's your performance summary.</p>

        <div className="ty-card">
          <div className="ty-score-ring">
            <svg width={150} height={150} viewBox="0 0 140 140">
              <circle cx={70} cy={70} r={58} fill="none" stroke="var(--bg-surface)" strokeWidth={10} />
              <circle
                cx={70} cy={70} r={58} fill="none"
                stroke={passed ? 'var(--success)' : 'var(--danger)'}
                strokeWidth={10} strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
              />
            </svg>
            <div className="ty-score-text">
              <span className="ty-score-pct">{pct}%</span>
              <span className="ty-score-status" style={{ color: passed ? 'var(--success)' : 'var(--danger)' }}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>

          <div className="ty-stats">
            {[
              ['Score', `${result.score} / ${result.totalMarks}`],
              ['Student', result.studentName],
              ['Warnings', result.warnings || 0],
              ['Time Taken', `${Math.floor((result.timeTaken || 0) / 60)}m ${(result.timeTaken || 0) % 60}s`],
            ].map(([k, v]) => (
              <div key={k} className="ty-stat-box">
                <p className="ty-stat-key">{k}</p>
                <p className="ty-stat-val">{v}</p>
              </div>
            ))}
          </div>

          <p className="ty-session-note">
            Submitted on {result.date} · Session ID: <code>{String(result.id || '').slice(-10)}</code>
          </p>
        </div>

        <div className="ty-actions">
          <Link to={`/result/${result.id}`} className="btn btn-secondary">
            <FileText size={15} /> Full Report
          </Link>
          {user?.role === 'admin' ? (
            <Link to="/admin/dashboard" className="btn btn-primary">
              <ArrowLeft size={15} /> Admin Dashboard
            </Link>
          ) : (
            <Link to="/student/dashboard" className="btn btn-primary">
              <Home size={15} /> Student Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   6. RESULT PAGE
═══════════════════════════════════════════════════════ */
function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin/results') && isAdmin;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerFilter, setAnswerFilter] = useState('all');

  useEffect(() => {
    stopGlobalWebcamStreams();
    let isMounted = true;

    const loadResultData = async () => {
      setLoading(true);
      setError('');

      // 1. Try Backend API first
      try {
        let endpoint = `/student/results/${id}`;
        if (isAdminRoute || isAdmin) {
          endpoint = `/admin/results/${id}`;
        }
        
        let apiData = null;
        try {
          const res = await api.get(endpoint);
          if (res.data?.data) apiData = res.data.data;
        } catch (apiErr) {
          // If admin endpoint failed, try student endpoint
          if (isAdmin) {
            try {
              const res2 = await api.get(`/student/results/${id}`);
              if (res2.data?.data) apiData = res2.data.data;
            } catch (_) {}
          }
        }

        if (apiData && isMounted) {
          const sessionObj = apiData.sessionId || {};
          const isVoided = sessionObj.status === 'voided' || (sessionObj.warningCount >= 3);
          const warnings = sessionObj.warningCount || 0;

          setResult({
            id: apiData._id || id,
            examId: apiData.examId?._id || apiData.examId || '',
            examTitle: apiData.examId?.title || 'AI Proctored Assessment',
            subjectName: apiData.examId?.subject || apiData.subject || 'General Assessment',
            studentName: apiData.studentId?.name || user?.name || sessionStorage.getItem('dp_student') || 'Student',
            studentEmail: apiData.studentId?.email || user?.email || 'N/A',
            score: apiData.score ?? 0,
            totalMarks: apiData.totalMarks || apiData.examId?.totalMarks || 100,
            passingMarks: apiData.examId?.passingMarks || 40,
            percentage: apiData.percentage ?? (apiData.totalMarks > 0 ? (apiData.score / apiData.totalMarks) * 100 : 0),
            isPassed: apiData.isPassed ?? (apiData.score >= (apiData.examId?.passingMarks || 40)),
            correct: apiData.correct ?? 0,
            wrong: apiData.wrong ?? 0,
            skipped: apiData.skipped ?? 0,
            totalQuestions: apiData.totalQuestions || apiData.answerBreakdown?.length || 0,
            timeTaken: apiData.timeTaken || 0,
            date: apiData.calculatedAt ? new Date(apiData.calculatedAt).toLocaleString() : new Date().toLocaleString(),
            answerBreakdown: apiData.answerBreakdown || [],
            warningCount: warnings,
            cheated: isVoided,
            status: isVoided ? 'Disqualified' : (apiData.isPassed ? 'Passed' : 'Failed'),
            proctorLogs: apiData.proctorLogs || [],
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('API result fetch error:', err.message);
      }

      if (isMounted) {
        const local = DB.results.get().find(r => r.id === id);
        if (local) {
          setResult({
            id: local.id,
            examId: local.examId,
            examTitle: local.examTitle || 'AI Proctored Assessment',
            subjectName: local.subjectName || 'General Assessment',
            studentName: local.studentName || 'Student',
            studentEmail: local.studentEmail || 'N/A',
            score: local.score ?? 0,
            totalMarks: local.totalMarks || 100,
            passingMarks: local.passingMarks || 40,
            percentage: local.percentage ?? 0,
            isPassed: local.isPassed ?? false,
            correct: local.correct ?? 0,
            wrong: local.wrong ?? 0,
            skipped: local.skipped ?? 0,
            totalQuestions: local.totalQuestions || local.questions?.length || 0,
            timeTaken: local.timeTaken || 0,
            date: local.date || new Date().toLocaleString(),
            answerBreakdown: local.answerBreakdown || [],
            warningCount: local.warnings || 0,
            cheated: local.cheated || false,
            status: local.status || 'Completed',
            proctorLogs: [],
          });
          setLoading(false);
          return;
        }
        setError('Assessment result record not found in the database.');
        setLoading(false);
      }
    };

    loadResultData();

    // Trap browser back button during review
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error('🚫 Exam session completed. Use navigation buttons below.', { id: 'no-back-res' });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
      stopGlobalWebcamStreams();
    };
  }, [id, isAdmin, user]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#09090b', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, padding: '32px 20px 64px', maxWidth: 940, margin: '0 auto', width: '100%' }}>
          <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Bar Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 180, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: 140, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
            </div>

            {/* Hero Card Skeleton */}
            <div style={{ height: 140, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', animation: 'pulse 1.5s infinite' }} />

            {/* Stats Grid Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>

            {/* Question Cards Skeletons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 180, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error || !result) {
    return (
      <div className="page-wrapper" style={{ background: '#09090b', minHeight: '100vh' }}>
        <Header />
        <div className="center-page">
          <div className="card page-enter" style={{ maxWidth: 460, width: '100%', padding: '44px 32px', textAlign: 'center', background: 'rgba(18, 18, 24, 0.95)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <XCircle size={52} style={{ color: 'var(--danger)', margin: '0 auto 18px', opacity: 0.9 }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Result Not Found</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
              {error || 'Unable to locate the specified examination result record in the database.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <RefreshCw size={15} /> Retry
              </button>
              {isAdminRoute ? (
                <Link to="/admin/dashboard" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <ArrowLeft size={15} /> Back to Admin Dashboard
                </Link>
              ) : (
                <Link to="/student/dashboard" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Back to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round(result.percentage || (result.totalMarks > 0 ? (result.score / result.totalMarks) * 100 : 0));
  const isDisqualified = result.cheated || result.status === 'Disqualified' || result.warningCount >= 3;
  const passed = !isDisqualified && (result.isPassed ?? (pct >= 40));
  const questionsList = result.answerBreakdown || [];

  // Filter calculations
  const totalQ = questionsList.length;
  const correctCount = questionsList.filter(q => q.isCorrect).length;
  const wrongCount = questionsList.filter(q => q.selectedOption && !q.isCorrect).length;
  const skippedCount = questionsList.filter(q => !q.selectedOption).length;

  const filteredQuestions = questionsList.filter(q => {
    if (answerFilter === 'correct') return q.isCorrect;
    if (answerFilter === 'incorrect') return q.selectedOption && !q.isCorrect;
    if (answerFilter === 'skipped') return !q.selectedOption;
    return true;
  });

  return (
    <div className="page-wrapper" style={{ background: '#09090b', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: '28px 20px 64px', maxWidth: 940, margin: '0 auto', width: '100%' }}>
        <div className="page-enter">
          
          {/* Top Navigation & Breadcrumb */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            {isAdminRoute ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link
                  to="/admin/dashboard"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    textDecoration: 'none'
                  }}
                >
                  <ArrowLeft size={15} /> Back to Proctor Audit Log
                </Link>
                <span className="badge badge-orange" style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px' }}>
                  ADMIN AUDIT REVIEW
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <Link
                  to="/student/dashboard"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontWeight: 600, borderRadius: 10 }}
                >
                  <ArrowLeft size={15} /> Back to Dashboard
                </Link>
                <Link
                  to="/"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10 }}
                >
                  <Home size={14} /> Home
                </Link>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Submitted: <strong style={{ color: 'var(--text-secondary)' }}>{result.date}</strong>
              </span>
            </div>
          </div>

          {/* Student & Examination Details Card */}
          <div
            className="card"
            style={{
              background: 'rgba(18, 18, 24, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: '24px 28px',
              marginBottom: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                    {result.studentName}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    {result.studentEmail}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {result.subjectName && (
                  <span className="badge badge-orange" style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px' }}>
                    {result.subjectName}
                  </span>
                )}
                <span className="badge badge-blue" style={{ fontSize: 11, fontFamily: 'monospace', padding: '4px 10px' }}>
                  ID: {result.id.slice(0, 16)}...
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3, fontWeight: 600 }}>Assessment Title</p>
                <p style={{ fontSize: 14, color: '#fff', fontWeight: 600, margin: 0 }}>{result.examTitle}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3, fontWeight: 600 }}>Exam Duration</p>
                <p style={{ fontSize: 14, color: '#fff', fontWeight: 600, margin: 0 }}>
                  {result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'Completed within limit'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3, fontWeight: 600 }}>Attempt Status</p>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDisqualified ? 'var(--danger)' : passed ? 'var(--success)' : 'var(--danger)' }}>
                  {isDisqualified ? 'Disqualified (Voided)' : passed ? 'Passed (Qualified)' : 'Failed (Needs Retake)'}
                </p>
              </div>
            </div>
          </div>

          {/* Result Hero Header Card */}
          <div
            className="result-header-card"
            style={{
              borderColor: isDisqualified ? 'rgba(239,68,68,.4)' : passed ? 'rgba(16,185,129,.35)' : 'rgba(239,68,68,.35)',
              background: isDisqualified
                ? 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(15,15,20,.95))'
                : passed
                  ? 'linear-gradient(135deg, rgba(16,185,129,.1), rgba(15,15,20,.95))'
                  : 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(15,15,20,.95))',
              borderRadius: 20,
              padding: '28px 24px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap'
            }}
          >
            <div
              className="result-trophy"
              style={{
                background: isDisqualified ? 'rgba(239,68,68,.18)' : passed ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)',
                width: 72,
                height: 72,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isDisqualified ? (
                <ShieldAlert size={38} style={{ color: 'var(--danger)' }} />
              ) : passed ? (
                <Trophy size={38} style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle size={38} style={{ color: 'var(--danger)' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>
                  {isDisqualified ? '0%' : `${pct}%`}
                </h2>
                <span
                  className={`badge ${isDisqualified ? 'badge-red' : passed ? 'badge-green' : 'badge-red'}`}
                  style={{ fontSize: 12, padding: '4px 14px', fontWeight: 800, textTransform: 'uppercase' }}
                >
                  {isDisqualified ? 'DISQUALIFIED' : passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Score: <strong style={{ color: isDisqualified ? 'var(--danger)' : passed ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
                  {isDisqualified ? 0 : result.score} / {result.totalMarks}
                </strong> Marks Awarded · Passing Threshold: <strong>{result.passingMarks || 40} Marks</strong>
              </p>
            </div>
          </div>

          {/* Proctoring & Integrity Audit Summary Card */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              borderRadius: 16,
              marginBottom: 24,
              background: isDisqualified
                ? 'rgba(239, 68, 68, 0.06)'
                : result.warningCount > 0
                  ? 'rgba(245, 158, 11, 0.05)'
                  : 'rgba(16, 185, 129, 0.04)',
              border: `1.5px solid ${isDisqualified ? 'rgba(239, 68, 68, 0.25)' : result.warningCount > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: result.proctorLogs?.length ? 14 : 0, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={20} style={{ color: isDisqualified ? 'var(--danger)' : result.warningCount > 0 ? 'var(--warning)' : 'var(--success)' }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Proctoring & Integrity Summary
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    AI Proctor Warnings: <strong style={{ color: isDisqualified ? 'var(--danger)' : result.warningCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{result.warningCount} / {MAX_WARNINGS} Max</strong>
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: isDisqualified ? 'rgba(239,68,68,0.15)' : result.warningCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: isDisqualified ? 'var(--danger)' : result.warningCount > 0 ? 'var(--warning)' : 'var(--success)'
                }}
              >
                {isDisqualified ? 'DISQUALIFICATION RECORDED' : result.warningCount > 0 ? 'WARNINGS LOGGED' : 'CLEAN AUDIT'}
              </span>
            </div>

            {isDisqualified && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                  ⚠️ <strong>Disqualification Reason:</strong> The candidate exceeded the allowable integrity threshold ({MAX_WARNINGS} proctor warnings) during active assessment monitoring.
                </p>
              </div>
            )}

            {result.proctorLogs && result.proctorLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Audit Event Timeline:
                </p>
                {result.proctorLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: 12
                    }}
                  >
                    <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
                      {log.type || log.eventType || 'Proctor Warning'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : log.time || 'Logged'}
                    </span>
                  </div>
                ))}
              </div>
            ) : !isDisqualified && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
                ✓ Clean session — No cheating or proctoring warnings recorded during this examination.
              </p>
            )}
          </div>

          {/* Performance Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div className="card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Questions</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{totalQ}</p>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 4 }}>Correct Answers</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)', margin: 0 }}>{correctCount}</p>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>Incorrect Answers</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', margin: 0 }}>{wrongCount}</p>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Unanswered</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-secondary)', margin: 0 }}>{skippedCount}</p>
            </div>
          </div>

          {/* Answer Review Filter & Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} style={{ color: 'var(--primary-light)' }} /> Detailed Answer Review
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Question-by-question scoring and candidate option breakdown
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setAnswerFilter('all')}
                className={`btn btn-sm ${answerFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8 }}
              >
                All ({totalQ})
              </button>
              <button
                onClick={() => setAnswerFilter('correct')}
                className={`btn btn-sm ${answerFilter === 'correct' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, color: answerFilter === 'correct' ? '#fff' : 'var(--success)' }}
              >
                Correct ({correctCount})
              </button>
              <button
                onClick={() => setAnswerFilter('incorrect')}
                className={`btn btn-sm ${answerFilter === 'incorrect' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, color: answerFilter === 'incorrect' ? '#fff' : 'var(--danger)' }}
              >
                Incorrect ({wrongCount})
              </button>
              <button
                onClick={() => setAnswerFilter('skipped')}
                className={`btn btn-sm ${answerFilter === 'skipped' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, color: answerFilter === 'skipped' ? '#fff' : 'var(--text-muted)' }}
              >
                Not Answered ({skippedCount})
              </button>
            </div>
          </div>

          {/* Questions Breakdown List */}
          {filteredQuestions.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                No questions found under the "{answerFilter}" filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {filteredQuestions.map((item, i) => {
                const qText = item.questionText || item.questionId?.questionText || `Question ${i + 1}`;
                const optionsObj = item.options || item.questionId?.options || {};
                const stuAns = item.selectedOption;
                const corAns = item.correctAnswer || item.questionId?.correctAnswer;
                const isCor = item.isCorrect ?? (stuAns && stuAns === corAns);
                const isSkipped = !stuAns;
                const qMarks = item.maxMarks || item.marks || item.questionId?.marks || 1;
                const earnedMarks = isCor ? qMarks : 0;
                const explanationText = item.explanation || item.questionId?.explanation;

                // Find original question index in overall list
                const originalIndex = questionsList.findIndex(q => (q.questionId?._id || q.questionId || q.questionText) === (item.questionId?._id || item.questionId || item.questionText));
                const qNumber = originalIndex !== -1 ? originalIndex + 1 : i + 1;

                return (
                  <div
                    key={item.questionId?._id || item.questionId || i}
                    className="card page-enter"
                    style={{
                      padding: '24px 28px',
                      background: 'rgba(18, 18, 24, 0.95)',
                      border: `1.5px solid ${isCor ? 'rgba(16,185,129,0.3)' : isSkipped ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: 18,
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* Question Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span
                            className="badge badge-orange"
                            style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase' }}
                          >
                            QUESTION {qNumber}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                            Awarded: <strong style={{ color: isCor ? 'var(--success)' : 'var(--danger)' }}>{earnedMarks}</strong> / {qMarks} mark{qMarks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', lineHeight: 1.6, margin: 0 }}>
                          {qText}
                        </p>
                      </div>

                      {/* Status Indicator Badge */}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '6px 14px',
                          borderRadius: 8,
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: isCor ? 'rgba(16,185,129,0.14)' : isSkipped ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.14)',
                          color: isCor ? 'var(--success)' : isSkipped ? 'var(--text-muted)' : 'var(--danger)',
                          border: `1px solid ${isCor ? 'rgba(16,185,129,0.35)' : isSkipped ? 'rgba(255,255,255,0.12)' : 'rgba(239,68,68,0.35)'}`
                        }}
                      >
                        {isCor ? '✓ Correct' : isSkipped ? '— Not Answered' : '✕ Incorrect'}
                      </span>
                    </div>

                    {/* Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: explanationText ? 14 : 0 }}>
                      {['A', 'B', 'C', 'D'].map((optKey) => {
                        const optVal = optionsObj[optKey];
                        if (optVal === undefined || optVal === null) return null;

                        const isThisCorrect = corAns === optKey;
                        const isStudentPick = stuAns === optKey;

                        let optBg = 'rgba(255,255,255,0.02)';
                        let optBorder = 'rgba(255,255,255,0.06)';
                        let optColor = 'var(--text-secondary)';
                        let badgeBg = 'rgba(255,255,255,0.06)';
                        let badgeColor = 'var(--text-muted)';

                        if (isThisCorrect) {
                          optBg = 'rgba(16,185,129,0.1)';
                          optBorder = 'rgba(16,185,129,0.5)';
                          optColor = '#ffffff';
                          badgeBg = 'var(--success)';
                          badgeColor = '#09090b';
                        } else if (isStudentPick && !isThisCorrect) {
                          optBg = 'rgba(239,68,68,0.1)';
                          optBorder = 'rgba(239,68,68,0.5)';
                          optColor = '#ffffff';
                          badgeBg = 'var(--danger)';
                          badgeColor = '#ffffff';
                        }

                        return (
                          <div
                            key={optKey}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                                background: badgeBg,
                                color: badgeColor,
                                flexShrink: 0
                              }}
                            >
                              {optKey}
                            </span>
                            <span style={{ fontSize: 13.5, color: optColor, flex: 1, lineHeight: 1.4 }}>
                              {optVal}
                            </span>
                            {isThisCorrect && !isStudentPick && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                <Check size={14} /> Correct Answer
                              </span>
                            )}
                            {isStudentPick && !isThisCorrect && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                <X size={14} /> Student Answer
                              </span>
                            )}
                            {isStudentPick && isThisCorrect && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                <Check size={14} /> Student & Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {explanationText && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: '14px 18px',
                          borderRadius: 10,
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start'
                        }}
                      >
                        <Sparkles size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                          <strong style={{ color: 'var(--warning)' }}>Explanation: </strong>
                          {explanationText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Navigation Button */}
          <div style={{ marginTop: 36, textAlign: 'center' }}>
            {isAdminRoute ? (
              <Link
                to="/admin/dashboard"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontWeight: 700 }}
              >
                <ArrowLeft size={16} /> Return to Proctor Audit Log
              </Link>
            ) : (
              <Link
                to="/student/dashboard"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontWeight: 700 }}
              >
                Return to Student Dashboard
              </Link>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   7. CHEATED LOCKOUT
═══════════════════════════════════════════════════════ */
function CheatedPage() {
  useEffect(() => {
    stopGlobalWebcamStreams();

    // Trap browser back button
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error('🚫 Session disqualified. Back button disabled.', { id: 'no-back-ch' });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopGlobalWebcamStreams();
    };
  }, []);

  return (
    <div className="cheated-page">
      <div className="glow glow-danger" />
      <div className="cheated-card page-enter">
        <div className="cheated-icon">
          <ShieldAlert size={40} style={{ color: 'var(--danger)' }} />
        </div>
        <h2 className="cheated-title">Session Terminated</h2>
        <p className="cheated-sub">Anti-cheat violation detected</p>

        <div className="cheated-reasons">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Possible violations:</p>
          <ul>
            {['Tab switch or window hidden', 'Fullscreen mode exited', 'Maximum warnings exceeded', 'Looking away / phone photo taking detected'].map(v => (
              <li key={v}>
                <XCircle size={13} style={{ flexShrink: 0, color: 'var(--danger)' }} /> {v}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Your session has been saved as "Disqualified" in the admin audit log. Contact your instructor if you believe this was an error.
        </p>
        <Link to="/" className="btn btn-danger btn-full">
          <Home size={15} /> Return to Home
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   8. ADMIN LOGIN
═══════════════════════════════════════════════════════ */
function AdminLogin() {
  const navigate = useNavigate();
  const { user, login: authLogin } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const login = async (e) => {
    e.preventDefault();
    const identifier = loginId.trim();
    if (!identifier || !pw) {
      toast.error('Please enter both Admin ID / Email and password');
      return;
    }
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: identifier,
        password: pw,
      });

      if (data?.success && data?.accessToken) {
        if (data.user?.role !== 'admin') {
          toast.error('You are not authorized to access the Admin Dashboard.');
          setLoading(false);
          return;
        }

        localStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('dp_admin', 'true');
        sessionStorage.setItem('dp_admin_name', data.user?.name || identifier);
        localStorage.setItem('dp_admin', 'true');
        localStorage.setItem('dp_admin_name', data.user?.name || identifier);
        if (authLogin) {
          authLogin(data.user, data.accessToken);
        }
        toast.success(`Welcome back, ${data.user?.name || 'Admin'}!`);
        navigate('/admin/dashboard');
        return;
      } else {
        toast.error(data?.message || 'Invalid email or password');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <div className="center-page" style={{ flex: 1 }}>
        <div className="glow glow-1" style={{ top: '-200px', left: '-100px' }} />
        <div className="admin-login-wrap page-enter">
          <div className="admin-login-header">
            <div className="admin-lock-icon">
              <Lock size={30} style={{ color: 'var(--danger)' }} />
            </div>
            <h2>Admin Login</h2>
            <p>DevPhoenix Control Panel</p>
          </div>

          <form onSubmit={login} className="card card-gradient-border admin-login-form">
            <div className="form-group">
              <label className="form-label">Admin Name / Email / Login ID</label>
              <input type="text" required value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Enter Admin email or ID" className="input" />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link
                  to="/forgot-password?redirect=/admin"
                  style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.55)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-light)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="Enter password" className="input"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="pw-toggle">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">
              {loading ? <><div className="spinner spinner-sm" />Signing in...</> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   9. ADMIN DASHBOARD
═══════════════════════════════════════════════════════ */
function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('accessToken');

  if (loading) {
    return (
      <div className="center-page" style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px', borderColor: 'var(--primary-light)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const [subName, setSubName] = useState('');
  const [editSubId, setEditSubId] = useState(null);

  // Chapter Management state inside Subject context
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [chapModal, setChapModal] = useState({ open: false, isEdit: false, subjectId: null, chapter: null });

  // Question Form State
  const [qSubId, setQSubId] = useState('');
  const [qChapId, setQChapId] = useState('');
  const [qText, setQText] = useState('');
  const [qOpts, setQOpts] = useState({ A: '', B: '', C: '', D: '' });
  const [qAns, setQAns] = useState('A');
  const [qMarks, setQMarks] = useState(1);
  const [qExpl, setQExpl] = useState('');
  const [editQId, setEditQId] = useState(null);

  // Question Bank Filter State
  const [filterSubId, setFilterSubId] = useState('');
  const [filterChapId, setFilterChapId] = useState('');

  const [shareModal, setShareModal] = useState({ open: false, exam: null, subject: null });

  // Subject filters for Students & Results tabs
  const [studentFilterSubId, setStudentFilterSubId] = useState('');
  const [resultFilterSubId, setResultFilterSubId] = useState('');

  // Student Edit State & Handlers
  const [editStudentId, setEditStudentId] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');

  const startEditStudent = (student) => {
    setEditStudentId(student.id);
    setEditStudentName(student.name);
  };

  const saveEditStudent = async (e) => {
    e.preventDefault();
    if (!editStudentName.trim() || !editStudentId) return;
    try {
      await api.put(`/admin/students/${editStudentId}`, { name: editStudentName.trim() });
      setEditStudentId(null);
      setEditStudentName('');
      toast.success('Student record updated!');
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    }
  };

  const delStudent = (id) => setConfirm({
    title: 'Delete Student Record?',
    message: 'Remove this student record permanently from the database.',
    danger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/admin/students/${id}`);
        setConfirm(null);
        toast.success('Student record deleted');
        await reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete student');
      }
    }
  });

  const clearAllStudents = () => setConfirm({
    title: 'Clear All Students?',
    message: 'Permanently remove all registered student records from the database.',
    danger: true,
    onConfirm: async () => {
      try {
        await api.delete('/admin/students');
        setConfirm(null);
        toast.success('Student list cleared');
        await reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to clear students');
      }
    }
  });

  const getStudentSubjects = (s) => {
    const studentSubs = [];
    const seenSubIds = new Set();

    if (Array.isArray(s.subjects) && s.subjects.length > 0) {
      s.subjects.forEach(sub => {
        const subId = sub.id || sub._id || sub.name;
        if (!seenSubIds.has(subId)) {
          seenSubIds.add(subId);
          const matched = subjects.find(sb => sb.id === subId || sb._id === subId || sb.name.toLowerCase() === (sub.name || '').toLowerCase());
          studentSubs.push(matched || sub);
        }
      });
    }

    const allExamIds = [
      ...(Array.isArray(s.examIds) ? s.examIds : []),
      ...(Array.isArray(s.examSessions) ? s.examSessions.map(es => es.examId?._id || es.examId) : []),
      ...(s.examId ? [s.examId] : []),
    ].filter(Boolean);

    allExamIds.forEach(eId => {
      const ex = exams.find(e => e.id === eId || e._id === eId);
      if (ex) {
        const sub = subjects.find(sb => sb.id === ex.subjectId || sb._id === ex.subjectId || (ex.subject && sb.name.toLowerCase() === ex.subject.toLowerCase()));
        if (sub && !seenSubIds.has(sub.id)) {
          seenSubIds.add(sub.id);
          studentSubs.push(sub);
        } else if (!sub && ex.subject && !seenSubIds.has(ex.subject)) {
          seenSubIds.add(ex.subject);
          studentSubs.push({ id: ex.subject, name: ex.subject, color: 'var(--primary)' });
        }
      }
    });

    return studentSubs;
  };

  const getStudentExams = (s) => {
    const studentExams = [];
    const seenExamIds = new Set();

    if (Array.isArray(s.exams) && s.exams.length > 0) {
      s.exams.forEach(ex => {
        const exId = ex.id || ex._id;
        if (!seenExamIds.has(exId)) {
          seenExamIds.add(exId);
          studentExams.push(ex);
        }
      });
    }

    const allExamIds = [
      ...(Array.isArray(s.examIds) ? s.examIds : []),
      ...(Array.isArray(s.examSessions) ? s.examSessions.map(es => es.examId?._id || es.examId) : []),
      ...(s.examId ? [s.examId] : []),
    ].filter(Boolean);

    allExamIds.forEach(eId => {
      if (!seenExamIds.has(eId)) {
        seenExamIds.add(eId);
        const ex = exams.find(e => e.id === eId || e._id === eId);
        if (ex) studentExams.push(ex);
        else studentExams.push({ id: eId, title: eId });
      }
    });

    return studentExams;
  };

  const reload = async () => {
    try {
      const [subsRes, chapsRes, qsRes, examsRes, resultsRes, studentsRes] = await Promise.allSettled([
        api.get('/admin/subjects'),
        api.get('/admin/chapters'),
        api.get('/admin/questions'),
        api.get('/admin/exams'),
        api.get('/admin/results'),
        api.get('/admin/students'),
      ]);

      if (subsRes.status === 'fulfilled' && subsRes.value.data?.data) {
        const remoteSubs = subsRes.value.data.data.map(s => ({
          id: s._id,
          name: s.name,
          color: s.color || '#e63946',
          description: s.description || '',
        }));
        setSubjects(remoteSubs);
        if (remoteSubs.length > 0 && !qSubId) {
          setQSubId(remoteSubs[0].id);
          setFilterSubId(remoteSubs[0].id);
        }
      }

      if (chapsRes.status === 'fulfilled' && chapsRes.value.data?.data) {
        const remoteChaps = chapsRes.value.data.data.map(c => ({
          id: c._id || c.id,
          subjectId: c.subjectId?._id ? c.subjectId._id.toString() : (c.subjectId ? c.subjectId.toString() : ''),
          name: c.name,
          description: c.description || '',
          order: Number(c.order) || 1,
          isActive: c.isActive !== false,
          questionCount: c.questionCount || 0,
          totalMarks: c.totalMarks || 0,
        }));
        setChapters(remoteChaps);
      }

      if (qsRes.status === 'fulfilled' && qsRes.value.data?.data) {
        const remoteQuestions = qsRes.value.data.data.map(q => ({
          id: q._id || q.id,
          subjectId: q.subjectId?._id ? q.subjectId._id.toString() : (q.subjectId ? q.subjectId.toString() : ''),
          chapterId: q.chapterId?._id ? q.chapterId._id.toString() : (q.chapterId ? q.chapterId.toString() : null),
          chapterName: q.chapterId?.name || q.chapterName || '',
          questionText: q.questionText,
          options: q.options || { A: '', B: '', C: '', D: '' },
          correctAnswer: q.correctAnswer || 'A',
          marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
          explanation: q.explanation || '',
          examId: q.examId?._id || q.examId || null,
        }));
        setQuestions(remoteQuestions);
      }

      if (examsRes.status === 'fulfilled' && examsRes.value.data?.data) {
        const remoteExams = examsRes.value.data.data.map(e => ({
          id: e._id,
          subjectId: e.subjectId?._id ? e.subjectId._id.toString() : (e.subjectId ? e.subjectId.toString() : (e.subject || 's1')),
          title: e.title,
          duration: (e.duration || 10) * 60,
          createdAt: e.createdAt || new Date().toISOString(),
          isPublished: e.isPublished,
        }));
        setExams(remoteExams);
      }

      if (resultsRes.status === 'fulfilled' && resultsRes.value.data?.data) {
        const remoteResults = resultsRes.value.data.data.map(r => {
          const exId = r.examId?._id ? r.examId._id.toString() : (r.examId ? r.examId.toString() : '');
          const subId = r.examId?.subjectId?._id ? r.examId.subjectId._id.toString() : (r.examId?.subjectId ? r.examId.subjectId.toString() : (r.subjectId ? r.subjectId.toString() : ''));
          const subName = r.examId?.subject || r.subjectName || '';
          const isVoided = r.sessionId?.status === 'voided' || r.integrityStatus === 'Flagged' || r.status === 'voided';
          return {
            id: r._id,
            examId: exId,
            subjectId: subId,
            subjectName: subName,
            studentName: r.studentId?.name || r.studentName || 'Student',
            studentEmail: r.studentId?.email || '',
            score: r.score ?? 0,
            totalMarks: r.totalMarks || 100,
            status: isVoided ? 'VOIDED' : (r.isPassed ? 'PASSED' : 'FAILED'),
            cheated: isVoided,
            warnings: r.violationCount || r.sessionId?.warningCount || r.warnings || 0,
            date: new Date(r.createdAt || Date.now()).toLocaleString(),
          };
        });
        setResults(remoteResults);
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data?.data) {
        const remoteStudents = studentsRes.value.data.data.map(st => ({
          id: st._id || st.id,
          name: st.name,
          email: st.email,
          isVerified: st.isVerified,
          joinedAt: st.createdAt || st.joinedAt || new Date().toISOString(),
          examId: st.examId || (st.exams?.[0]?.id) || (st.examSessions?.[0]?.examId) || '',
          examTitle: st.examTitle || (st.exams?.[0]?.title) || '',
          examIds: st.examIds || (st.exams?.map(e => e.id) || []),
          exams: st.exams || [],
          subject: st.subject || (st.subjects?.[0]?.name) || '',
          subjectId: st.subjectId || (st.subjects?.[0]?.id) || '',
          subjects: st.subjects || [],
          subjectNames: st.subjectNames || (st.subjects?.map(s => s.name) || []),
          subjectIds: st.subjectIds || (st.subjects?.map(s => s.id) || []),
          examSessions: st.examSessions || [],
        }));
        setStudents(remoteStudents);
      }
    } catch (err) {
      console.log('Backend sync error:', err.message);
    }
  };

  useEffect(() => { reload(); }, []);

  // Chapter Modal Openers
  const openAddChapterModal = (subjectId) => {
    const subChaps = chapters.filter(c => c.subjectId === subjectId);
    const maxOrder = subChaps.reduce((max, c) => Math.max(max, c.order || 0), 0);
    setChapModal({
      open: true,
      isEdit: false,
      subjectId,
      chapter: { order: maxOrder + 1, isActive: true },
    });
  };

  const openEditChapterModal = (chapter) => {
    setChapModal({
      open: true,
      isEdit: true,
      subjectId: chapter.subjectId,
      chapter,
    });
  };

  const saveChapter = async (data) => {
    try {
      if (chapModal.isEdit && chapModal.chapter) {
        await api.put(`/admin/chapters/${chapModal.chapter.id}`, data);
        toast.success('Chapter updated in database!');
      } else {
        await api.post(`/admin/subjects/${chapModal.subjectId}/chapters`, data);
        toast.success('Chapter added to subject!');
      }
      setChapModal({ open: false, isEdit: false, subjectId: null, chapter: null });
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  const delChapter = (chapter) => {
    const chapQuestionsCount = questions.filter(q => q.chapterId === chapter.id).length;
    setConfirm({
      title: 'Delete Chapter?',
      message: chapQuestionsCount > 0
        ? `This chapter contains ${chapQuestionsCount} question(s). Deleting this chapter will safely move all ${chapQuestionsCount} questions to "Unassigned" under this subject (no questions will be deleted).`
        : `Are you sure you want to delete chapter "${chapter.name}"?`,
      confirmLabel: 'Delete Chapter',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/chapters/${chapter.id}`);
          setConfirm(null);
          toast.success('Chapter deleted. Questions moved to Unassigned.');
          await reload();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete chapter');
        }
      }
    });
  };

  const changeChapterOrder = async (chapterId, newOrder) => {
    if (newOrder < 1) return;
    try {
      await api.patch(`/admin/chapters/${chapterId}/order`, { order: newOrder });
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    }
  };

  // When form subject dropdown changes, dynamically sync filterSubId and reset chapter
  const handleQSubSelect = (subId) => {
    setQSubId(subId);
    setQChapId('');
    setFilterSubId(subId);
    setFilterChapId('');
  };

  // When filter dropdown changes, dynamically sync qSubId and reset chapter filter
  const handleFilterSubSelect = (subId) => {
    setFilterSubId(subId);
    setFilterChapId('');
    if (subId) {
      setQSubId(subId);
      setQChapId('');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    sessionStorage.removeItem('dp_admin');
    sessionStorage.removeItem('dp_admin_name');
    localStorage.removeItem('dp_admin');
    localStorage.removeItem('dp_admin_name');
    localStorage.removeItem('accessToken');
    toast.success('Logged out');
    navigate('/admin');
  };

  const saveSub = async (e) => {
    e.preventDefault();
    if (!subName.trim()) return;
    try {
      if (editSubId) {
        await api.put(`/admin/subjects/${editSubId}`, { name: subName.trim() });
        toast.success('Subject updated');
      } else {
        await api.post('/admin/subjects', { name: subName.trim() });
        toast.success('Subject added');
      }
      setSubName('');
      setEditSubId(null);
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const delSub = (id) => setConfirm({
    title: 'Delete Subject?',
    message: 'This removes the subject and all its associated chapters and questions permanently from the database.',
    danger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/admin/subjects/${id}`);
        if (selectedSubjectId === id) setSelectedSubjectId(null);
        setConfirm(null);
        toast.success('Subject deleted');
        await reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete subject');
      }
    }
  });

  // Retain selected subject on reset so admin doesn't have to select subject repeatedly
  const resetQForm = () => {
    setEditQId(null);
    setQChapId('');
    setQText('');
    setQOpts({ A: '', B: '', C: '', D: '' });
    setQAns('A');
    setQMarks(5);
    setQExpl('');
  };

  const saveQ = async (e) => {
    e.preventDefault();
    if (!qSubId) { toast.error('Please select a subject'); return; }
    if (!qText || !qOpts.A || !qOpts.B || !qOpts.C || !qOpts.D) { toast.error('Fill all required fields'); return; }

    const data = {
      subjectId: qSubId,
      chapterId: qChapId || null,
      questionText: qText.trim(),
      options: {
        A: qOpts.A.trim(),
        B: qOpts.B.trim(),
        C: qOpts.C.trim(),
        D: qOpts.D.trim(),
      },
      correctAnswer: qAns,
      marks: Number(qMarks) > 0 ? Number(qMarks) : 1,
      explanation: qExpl.trim(),
    };

    try {
      if (editQId) {
        await api.put(`/admin/questions/${editQId}`, data);
        toast.success('Question updated in database!');
      } else {
        await api.post('/admin/questions', data);
        toast.success('Question added to subject in database!');
      }
      resetQForm();
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    }
  };

  const editQ = (q) => {
    setEditQId(q.id);
    setQSubId(q.subjectId);
    setQChapId(q.chapterId || '');
    setFilterSubId(q.subjectId);
    if (q.chapterId) setFilterChapId(q.chapterId);
    setQText(q.questionText);
    setQOpts({ ...q.options });
    setQAns(q.correctAnswer);
    setQMarks(q.marks);
    setQExpl(q.explanation || '');
    setTab('questions');
  };

  const delQ = (id) => setConfirm({
    title: 'Delete Question?',
    message: 'Remove this question permanently from the database.',
    danger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/admin/questions/${id}`);
        setConfirm(null);
        toast.success('Question deleted from database');
        await reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete question');
      }
    }
  });

  const createExam = async (subId) => {
    const sub = subjects.find(s => s.id === subId);
    if (!sub) return;
    const qs = questions.filter(q => q.subjectId === subId);
    if (qs.length === 0) {
      toast.error('Add questions to this subject first in Question Bank');
      return;
    }
    const calculatedTotalMarks = qs.reduce((sum, q) => sum + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0);
    const calculatedPassingMarks = Math.ceil(calculatedTotalMarks * 0.4);

    try {
      await api.post('/admin/exams', {
        title: sub.name + ' Assessment',
        subject: sub.name,
        subjectId: sub.id,
        duration: 10,
        totalMarks: calculatedTotalMarks,
        passingMarks: calculatedPassingMarks,
        isPublished: true,
      });
      toast.success('Exam link created!');
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam link');
    }
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed'));
  };

  const delExam = (id) => setConfirm({
    title: 'Delete Exam?', message: 'Students won\'t be able to access this exam anymore.', danger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/admin/exams/${id}`);
        setConfirm(null);
        toast.success('Exam deleted');
        await reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete exam');
      }
    }
  });

  const navItems = [
    { key: 'overview', icon: BarChart3, label: 'Overview' },
    { key: 'subjects', icon: Layers, label: 'Subjects' },
    { key: 'questions', icon: BookOpen, label: 'Question Bank' },
    { key: 'exams', icon: Link2, label: 'Exam Links' },
    { key: 'students', icon: Users, label: 'Students' },
    { key: 'results', icon: Trophy, label: 'Results' },
  ];

  // Dashboard Overview metrics remain clean & high-level (Subject count, Questions count, Active Exams, Total Students)
  const stats = [
    { label: 'Subjects', val: subjects.length, color: 'var(--primary)', icon: Layers },
    { label: 'Questions', val: questions.length, color: 'var(--secondary)', icon: BookOpen },
    { label: 'Active Exams', val: exams.length, color: 'var(--accent)', icon: Link2 },
    { label: 'Total Students', val: students.length, color: 'var(--success)', icon: Users },
  ];

  // Available chapters for the currently selected Subject in Question Form
  const availableFormChapters = chapters
    .filter(c => c.subjectId === qSubId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Available chapters for the filter dropdown
  const availableFilterChapters = filterSubId
    ? chapters.filter(c => c.subjectId === filterSubId).sort((a, b) => (a.order || 0) - (b.order || 0))
    : chapters.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filtered questions based on Subject and optional Chapter filter
  const filteredQuestions = questions.filter(q => {
    if (filterSubId && q.subjectId !== filterSubId) return false;
    if (filterChapId) {
      if (filterChapId === 'unassigned') {
        if (q.chapterId) return false;
      } else if (q.chapterId !== filterChapId) {
        return false;
      }
    }
    return true;
  });

  // Selected subject for Chapter Management view
  const activeSubject = selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId) : null;
  const activeSubjectChapters = activeSubject
    ? chapters.filter(c => c.subjectId === activeSubject.id).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const activeSubjectQuestions = activeSubject
    ? questions.filter(q => q.subjectId === activeSubject.id)
    : [];
  const activeSubjectUnassignedQuestions = activeSubjectQuestions.filter(q => !q.chapterId);

  return (
    <div className="admin-wrapper">
      <ConfirmModal open={!!confirm} {...(confirm || {})} onCancel={() => setConfirm(null)} />
      <ShareModal open={shareModal.open} exam={shareModal.exam} subject={shareModal.subject} onCancel={() => setShareModal({ open: false, exam: null, subject: null })} />
      <ChapterModal
        open={chapModal.open}
        isEdit={chapModal.isEdit}
        subjectName={subjects.find(s => s.id === chapModal.subjectId)?.name || 'Subject'}
        initialData={chapModal.chapter}
        onSave={saveChapter}
        onCancel={() => setChapModal({ open: false, isEdit: false, subjectId: null, chapter: null })}
      />

      <Header adminMode onLogout={logout} />

      {/* Mobile Admin Navigation Bar with Hamburger Toggle */}
      <div className="admin-mobile-subbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="admin-hamburger-btn"
            aria-label="Toggle Admin Navigation Menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="admin-mobile-tab-name">
            {navItems.find(n => n.key === tab)?.label || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <nav className={`admin-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="admin-sidebar-inner">
            {navItems.map(n => (
              <button
                key={n.key}
                onClick={() => {
                  setTab(n.key);
                  setMobileNavOpen(false);
                }}
                className={`nav-item ${tab === n.key ? 'active' : ''}`}
              >
                <n.icon size={16} /> {n.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="admin-main">
          <div className="page-enter" key={tab}>

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                <h2 className="admin-page-title">Dashboard Overview</h2>
                <p className="admin-page-sub">Welcome back, {sessionStorage.getItem('dp_admin_name') || 'Admin'}. Here's what's happening on your platform.</p>

                <div className="stats-grid">
                  {stats.map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-card-top">
                        <div className="stat-card-icon" style={{ background: `${s.color}18`, color: s.color }}>
                          <s.icon size={20} />
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <p className="stat-card-val">{s.val}</p>
                      <p className="stat-card-label">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-head-row">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Recent Submissions</h3>
                    <button onClick={() => setTab('results')} className="btn btn-ghost btn-sm">View All →</button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Student</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {results.slice(0, 5).map(r => (
                          <tr key={r.id}>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{r.studentName}</td>
                            <td>{r.cheated ? '—' : `${r.score}/${r.totalMarks}`}</td>
                            <td><span className={`badge ${r.cheated ? 'badge-red' : 'badge-green'}`}>{r.status}</span></td>
                            <td style={{ fontSize: 11 }}>{r.date}</td>
                          </tr>
                        ))}
                        {results.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No submissions yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBJECTS & CHAPTER MANAGEMENT */}
            {tab === 'subjects' && (
              <div>
                {!selectedSubjectId ? (
                  <div>
                    <h2 className="admin-page-title">Subject Management</h2>
                    <p className="admin-page-sub" style={{ marginBottom: 20 }}>
                      Manage your curriculum subjects. Click <strong>Manage Chapters</strong> on any subject to organize its syllabus chapters.
                    </p>
                    <div className="admin-split-grid">
                      <form onSubmit={saveSub} className="card admin-form">
                        <h3 className="form-section-title">{editSubId ? 'Edit Subject' : 'Add Subject'}</h3>
                        <div className="form-group">
                          <label className="form-label">Subject Name *</label>
                          <input type="text" required value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Cloud & DevOps" className="input" />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            {editSubId ? 'Save Changes' : <><Plus size={15} /> Add Subject</>}
                          </button>
                          {editSubId && <button type="button" onClick={() => { setEditSubId(null); setSubName(''); }} className="btn btn-secondary"><X size={15} /></button>}
                        </div>
                      </form>

                      <div className="admin-list">
                        {subjects.length === 0
                          ? <div className="empty-state">No subjects yet. Add one to get started.</div>
                          : subjects.map(s => {
                            const subChaps = chapters.filter(c => c.subjectId === s.id);
                            const subQs = questions.filter(q => q.subjectId === s.id);
                            return (
                              <div key={s.id} className="admin-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 4, background: s.color || 'var(--primary)', flexShrink: 0 }} />
                                    <div>
                                      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{s.name}</p>
                                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        <span className="badge badge-orange" style={{ fontSize: 10, marginRight: 6 }}>{subChaps.length} Chapters</span>
                                        <span className="badge badge-gray" style={{ fontSize: 10 }}>{subQs.length} Questions</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => { setEditSubId(s.id); setSubName(s.name); }} className="btn btn-icon btn-sm" title="Edit Subject"><Edit3 size={13} /></button>
                                    <button onClick={() => delSub(s.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete Subject"><Trash2 size={13} /></button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                  <button
                                    onClick={() => setSelectedSubjectId(s.id)}
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                                  >
                                    <Folder size={14} /> Manage Chapters ({subChaps.length})
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTab('questions');
                                      setFilterSubId(s.id);
                                      setFilterChapId('');
                                      setQSubId(s.id);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: 12 }}
                                    title="View all questions for this subject in Question Bank"
                                  >
                                    <BookOpen size={14} /> Question Bank ({subQs.length})
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SUB-SECTION: CHAPTER MANAGEMENT FOR SELECTED SUBJECT */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                      <button
                        onClick={() => setSelectedSubjectId(null)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <ArrowLeft size={14} /> Back to All Subjects
                      </button>

                      <button
                        onClick={() => openAddChapterModal(activeSubject?.id)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={15} /> Add Chapter
                      </button>
                    </div>

                    <div className="card" style={{ padding: '18px 20px', marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: activeSubject?.color || 'var(--primary)', flexShrink: 0 }} />
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
                          {activeSubject?.name}
                        </h2>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>
                        Manage syllabus chapters, learning sequence, and chapter questions for <strong>{activeSubject?.name}</strong>.
                      </p>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span className="badge badge-orange" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 700 }}>
                          {activeSubjectChapters.length} Chapters
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>
                          {activeSubjectQuestions.length} Total Subject Questions
                        </span>
                        <span className="badge badge-green" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 700 }}>
                          Total: {activeSubjectQuestions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0)} Marks
                        </span>
                      </div>
                    </div>

                    {/* Chapters List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activeSubjectChapters.length === 0 ? (
                        <div className="card empty-state" style={{ padding: '36px 20px' }}>
                          <Folder size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>No chapters created for this subject yet.</p>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px' }}>
                            Organize questions into structured syllabus chapters (e.g. Linux Fundamentals, Docker, Kubernetes).
                          </p>
                          <button onClick={() => openAddChapterModal(activeSubject?.id)} className="btn btn-primary btn-sm">
                            <Plus size={14} /> Add First Chapter
                          </button>
                        </div>
                      ) : (
                        activeSubjectChapters.map((chap, idx) => {
                          const chapQuestions = questions.filter(q => q.chapterId === chap.id);
                          const chapMarks = chapQuestions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0);
                          return (
                            <div
                              key={chap.id}
                              className="card"
                              style={{
                                padding: '16px 18px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 14,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 240 }}>
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: 'rgba(230,57,70,0.15)',
                                    color: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    flexShrink: 0,
                                  }}
                                >
                                  {chap.order || idx + 1}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                                      {chap.name}
                                    </h4>
                                    {!chap.isActive && <span className="badge badge-red" style={{ fontSize: 9 }}>Inactive</span>}
                                  </div>
                                  {chap.description && (
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                                      {chap.description}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <span className="badge badge-gray" style={{ fontSize: 11 }}>
                                      {chapQuestions.length} Questions
                                    </span>
                                    <span className="badge badge-orange" style={{ fontSize: 11 }}>
                                      {chapMarks} Marks
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Chapter Actions */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => changeChapterOrder(chap.id, Math.max(1, (chap.order || 1) - 1))}
                                    disabled={chap.order <= 1}
                                    className="btn btn-icon btn-sm"
                                    title="Move Chapter Up"
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    onClick={() => changeChapterOrder(chap.id, (chap.order || 1) + 1)}
                                    className="btn btn-icon btn-sm"
                                    title="Move Chapter Down"
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                </div>

                                <button
                                  onClick={() => {
                                    setTab('questions');
                                    setFilterSubId(activeSubject.id);
                                    setFilterChapId(chap.id);
                                    setQSubId(activeSubject.id);
                                    setQChapId(chap.id);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: 12 }}
                                  title="View and add questions under this chapter"
                                >
                                  <BookOpen size={13} /> Questions ({chapQuestions.length})
                                </button>

                                <button
                                  onClick={() => openEditChapterModal(chap)}
                                  className="btn btn-icon btn-sm"
                                  title="Edit Chapter"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  onClick={() => delChapter(chap)}
                                  className="btn btn-icon btn-sm"
                                  style={{ color: 'var(--danger)' }}
                                  title="Delete Chapter"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Unassigned Questions Notice Box */}
                      {activeSubjectUnassignedQuestions.length > 0 && (
                        <div
                          className="card"
                          style={{
                            padding: '14px 18px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginTop: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
                              📂 Unassigned Questions: {activeSubjectUnassignedQuestions.length} Questions · {activeSubjectUnassignedQuestions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0)} Marks
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                              These questions belong to {activeSubject?.name} but haven't been assigned to a specific chapter yet.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setTab('questions');
                              setFilterSubId(activeSubject.id);
                              setFilterChapId('unassigned');
                              setQSubId(activeSubject.id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 12 }}
                          >
                            <BookOpen size={13} /> View Unassigned Questions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUESTION BANK */}
            {tab === 'questions' && (
              <div>
                <h2 className="admin-page-title">Question Bank</h2>
                <div className="admin-split-grid" style={{ gridTemplateColumns: '400px 1fr' }}>
                  <form onSubmit={saveQ} className="card admin-form">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h3 className="form-section-title">{editQId ? 'Edit Question' : 'Add Question'}</h3>
                      {qSubId && <span className="badge badge-orange" style={{ fontSize: 9 }}>Retained</span>}
                    </div>

                    {/* Target Subject Branch Dropdown */}
                    <div className="form-group">
                      <label className="form-label">Target Subject Branch *</label>
                      <select required value={qSubId} onChange={e => handleQSubSelect(e.target.value)} className="input" style={{ cursor: 'pointer', border: '1px solid var(--secondary)' }}>
                        <option value="">— Choose Subject —</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    {/* Target Chapter Dropdown */}
                    <div className="form-group">
                      <label className="form-label">
                        Chapter (Optional)
                        {availableFormChapters.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({availableFormChapters.length} available)</span>}
                      </label>
                      <select
                        value={qChapId}
                        onChange={e => setQChapId(e.target.value)}
                        className="input"
                        style={{ cursor: 'pointer' }}
                        disabled={!qSubId}
                      >
                        <option value="">— No Chapter (Unassigned) —</option>
                        {availableFormChapters.map(c => (
                          <option key={c.id} value={c.id}>
                            Chapter {c.order}: {c.name}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                        {availableFormChapters.length === 0 && qSubId ? 'No chapters created for this subject yet. You can create chapters under Subjects.' : 'Assign question to a specific syllabus chapter.'}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Question Text *</label>
                      <textarea required rows={3} value={qText} onChange={e => setQText(e.target.value)} placeholder="Enter question..." className="input" style={{ resize: 'vertical', lineHeight: 1.5 }} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Options (A, B, C, D) *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['A', 'B', 'C', 'D'].map(o => (
                          <div key={o} style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{o}.</span>
                            <input type="text" required value={qOpts[o]} onChange={e => setQOpts(p => ({ ...p, [o]: e.target.value }))} placeholder={`Option ${o}`} className="input input-sm" style={{ paddingLeft: 26 }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Correct Answer *</label>
                        <select value={qAns} onChange={e => setQAns(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
                          {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Marks for this Question *</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          value={qMarks}
                          onChange={e => setQMarks(e.target.value)}
                          className="input"
                          style={{ fontWeight: 700, color: 'var(--primary-light)' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                          Set the marks awarded for a correct answer.
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Explanation (Optional)</label>
                      <textarea rows={2} value={qExpl} onChange={e => setQExpl(e.target.value)} placeholder="Why is this the correct answer?" className="input" style={{ resize: 'vertical', fontSize: 13 }} />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                        {editQId ? 'Save Changes' : <><Plus size={15} /> Add Question</>}
                      </button>
                      {editQId && <button type="button" onClick={resetQForm} className="btn btn-secondary"><X size={15} /></button>}
                    </div>
                  </form>

                  <div>
                    {/* Dynamic Branch & Chapter Filter Bar */}
                    <div className="q-filter-bar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Subject:</span>
                        <select value={filterSubId} onChange={e => handleFilterSubSelect(e.target.value)} className="input input-sm" style={{ cursor: 'pointer', maxWidth: 170 }}>
                          <option value="">All Subjects</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Chapter:</span>
                        <select
                          value={filterChapId}
                          onChange={e => setFilterChapId(e.target.value)}
                          className="input input-sm"
                          style={{ cursor: 'pointer', maxWidth: 180 }}
                        >
                          <option value="">All Chapters</option>
                          <option value="unassigned">Unassigned (No Chapter)</option>
                          {availableFilterChapters.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>
                          {filteredQuestions.length} Questions
                        </span>
                        <span className="badge badge-orange" style={{ fontSize: 11, fontWeight: 700 }}>
                          Total: {filteredQuestions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0)} Marks
                        </span>
                      </div>
                    </div>

                    <div className="admin-list">
                      {filteredQuestions.length === 0
                        ? <div className="empty-state">{questions.length === 0 ? 'No questions yet. Add one using the form.' : 'No questions matching this subject and chapter filter.'}</div>
                        : filteredQuestions.map((q, i) => {
                          const sub = subjects.find(s => s.id === q.subjectId);
                          const chap = chapters.find(c => c.id === q.chapterId);
                          const qMarkVal = Number(q.marks) > 0 ? Number(q.marks) : 1;
                          return (
                            <div key={q.id} className="card admin-q-card" style={{ padding: '16px 18px' }}>
                              <div className="admin-q-header">
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span className="badge badge-orange" style={{ fontSize: 10, fontWeight: 700 }}>Q{i + 1}</span>
                                    {sub && <span className="badge badge-gray" style={{ fontSize: 10 }}>{sub.name}</span>}
                                    {chap ? (
                                      <span className="badge badge-blue" style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                                        📖 Chapter: {chap.name}
                                      </span>
                                    ) : q.chapterName ? (
                                      <span className="badge badge-blue" style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                                        📖 Chapter: {q.chapterName}
                                      </span>
                                    ) : (
                                      <span className="badge badge-gray" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        📂 Unassigned
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: 'var(--secondary)',
                                        background: 'rgba(247,127,0,0.12)',
                                        border: '1px solid rgba(247,127,0,0.25)',
                                        padding: '2px 7px',
                                        borderRadius: 5,
                                      }}
                                    >
                                      Marks: [ {qMarkVal} ]
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{q.questionText}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button onClick={() => editQ(q)} className="btn btn-icon btn-sm" title="Edit"><Edit3 size={13} /></button>
                                  <button onClick={() => delQ(q.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                                {Object.entries(q.options || {}).map(([k, v]) => (
                                  <div key={k} style={{
                                    padding: '6px 10px', borderRadius: 7, fontSize: 12,
                                    border: `1px solid ${q.correctAnswer === k ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
                                    background: q.correctAnswer === k ? 'rgba(16,185,129,.08)' : 'transparent',
                                    color: q.correctAnswer === k ? 'var(--success)' : 'var(--text-secondary)',
                                    fontWeight: q.correctAnswer === k ? 600 : 400,
                                  }}>
                                    {k}. {v}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXAM LINKS */}
            {tab === 'exams' && (
              <div>
                <div className="admin-section-head">
                  <h2 className="admin-page-title">Exam Links</h2>
                </div>
                <p className="admin-page-sub" style={{ marginBottom: 24 }}>Create shareable exam links for each subject. Send the link to students to start the exam.</p>

                <div className="exam-link-create-grid">
                  {subjects.map(s => (
                    <div key={s.id} className="card exam-link-create-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color || 'var(--primary)' }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.name}</p>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({questions.filter(q => q.subjectId === s.id).length} questions)</span>
                      </div>
                      <button onClick={() => createExam(s.id)} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        <Plus size={13} /> Create Exam Link
                      </button>
                    </div>
                  ))}
                  {subjects.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add subjects first.</p>}
                </div>

                <h3 className="section-label" style={{ marginTop: 32 }}>Active Exam Links</h3>
                <div className="admin-list">
                  {exams.length === 0
                    ? <div className="empty-state">No exam links created yet.</div>
                    : exams.map(ex => {
                      const sub = subjects.find(s => s.id === ex.subjectId);
                      const url = `${window.location.origin}/exam/${ex.id}`;
                      return (
                        <div key={ex.id} className="card exam-link-card">
                          <div className="exam-link-card-top">
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{ex.title}</p>
                              {sub && <span className="badge badge-orange" style={{ fontSize: 9 }}>{sub.name}</span>}
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                Created: {new Date(ex.createdAt).toLocaleString()} · {Math.floor(ex.duration / 60)} min
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setShareModal({ open: true, exam: ex, subject: sub })} className="btn btn-primary btn-sm">
                                <Share2 size={12} /> Share Link
                              </button>
                              <button onClick={() => copyLink(ex.id)} className="btn btn-secondary btn-sm">
                                <Copy size={12} /> Copy
                              </button>
                              <button onClick={() => delExam(ex.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete Exam"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <div className="exam-link-url-bar">
                            <Link2 size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{url}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* STUDENTS */}
            {tab === 'students' && (() => {
              const filteredStudents = studentFilterSubId
                ? students.filter(s => {
                    const studentSubs = getStudentSubjects(s);
                    return studentSubs.some(sub => sub.id === studentFilterSubId || sub._id === studentFilterSubId || (sub.name && subjects.find(sb => sb.id === studentFilterSubId)?.name.toLowerCase() === sub.name.toLowerCase()));
                  })
                : students;
              return (
              <div>
                <div className="admin-section-head">
                  <h2 className="admin-page-title">Student List</h2>
                  {students.length > 0 && (
                    <button onClick={clearAllStudents} className="btn btn-danger btn-sm">
                      <Trash2 size={13} /> Clear All
                    </button>
                  )}
                </div>
                <p className="admin-page-sub" style={{ marginBottom: 16 }}>Manage student profiles and registered assessment sessions.</p>

                {/* Subject Filter Bar */}
                <div className="q-filter-bar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', flexShrink: 0 }}>Filter by Subject:</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    <button
                      onClick={() => setStudentFilterSubId('')}
                      className={`btn btn-sm ${studentFilterSubId === '' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: 11, padding: '5px 14px' }}
                    >
                      All Subjects ({students.length})
                    </button>
                    {subjects.map(sub => {
                      const count = students.filter(s => {
                        const studentSubs = getStudentSubjects(s);
                        return studentSubs.some(sb => sb.id === sub.id || sb._id === sub.id || (sb.name && sb.name.toLowerCase() === sub.name.toLowerCase()));
                      }).length;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setStudentFilterSubId(sub.id)}
                          className={`btn btn-sm ${studentFilterSubId === sub.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: 11, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color || 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                          {sub.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} shown
                  </span>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Subject</th>
                          <th>Exam Session</th>
                          <th>Joined At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0
                          ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                              {students.length === 0 ? 'No students registered yet.' : 'No students found for this subject.'}
                            </td></tr>
                          : filteredStudents.map((s, i) => {
                            const studentSubs = getStudentSubjects(s);
                            const studentExs = getStudentExams(s);
                            const isEditing = editStudentId === s.id;
                            return (
                              <tr key={s.id}>
                                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                <td>
                                  {isEditing ? (
                                    <form onSubmit={saveEditStudent} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        required
                                        value={editStudentName}
                                        onChange={e => setEditStudentName(e.target.value)}
                                        className="input input-sm"
                                        style={{ maxWidth: 220 }}
                                        autoFocus
                                      />
                                      <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>Save</button>
                                      <button type="button" onClick={() => setEditStudentId(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }}><X size={13} /></button>
                                    </form>
                                  ) : (
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{s.name}</span>
                                  )}
                                </td>
                                <td>
                                  {studentSubs.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                      {studentSubs.map(sub => (
                                        <span
                                          key={sub.id || sub.name}
                                          className="badge badge-orange"
                                          style={{
                                            fontSize: 10,
                                            background: sub.color ? `${sub.color}20` : undefined,
                                            borderColor: sub.color ? `${sub.color}50` : undefined,
                                            color: sub.color || undefined,
                                          }}
                                        >
                                          {sub.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                  )}
                                </td>
                                <td style={{ fontSize: 12 }}>
                                  {studentExs.length > 0 ? (
                                    studentExs.length === 1 ? (
                                      <span>{studentExs[0].title || studentExs[0].id}</span>
                                    ) : (
                                      <span title={studentExs.map(e => e.title || e.id).join(', ')}>
                                        {studentExs[0].title || studentExs[0].id} <span style={{ color: 'var(--primary-light)', fontSize: 11, fontWeight: 600 }}>+{studentExs.length - 1} more</span>
                                      </span>
                                    )
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  )}
                                </td>
                                <td style={{ fontSize: 11 }}>{new Date(s.joinedAt).toLocaleString()}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => startEditStudent(s)} className="btn btn-icon btn-sm" title="Edit Student Name">
                                      <Edit3 size={13} />
                                    </button>
                                    <button onClick={() => delStudent(s.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete Student Record">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* PROCTOR AUDIT LOG */}
            {tab === 'results' && (() => {
              const filteredResults = resultFilterSubId
                ? results.filter(r => {
                    const ex = exams.find(e => e.id === r.examId);
                    return (ex?.subjectId === resultFilterSubId) || (r.subjectId === resultFilterSubId);
                  })
                : results;
              return (
              <div>
                <div className="admin-section-head">
                  <h2 className="admin-page-title">Proctor Audit Log</h2>
                  {results.length > 0 && (
                    <button
                      onClick={() => setConfirm({
                        title: 'Clear All Results?', message: 'This permanently deletes all student submissions and audit logs from the database.', danger: true,
                        onConfirm: async () => {
                          try {
                            await api.delete('/admin/results');
                            setConfirm(null);
                            toast.success('All results cleared');
                            await reload();
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to clear results');
                          }
                        }
                      })}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={13} /> Clear All
                    </button>
                  )}
                </div>

                {/* Subject Filter Bar */}
                <div className="q-filter-bar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Trophy size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', flexShrink: 0 }}>Filter by Subject:</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    <button
                      onClick={() => setResultFilterSubId('')}
                      className={`btn btn-sm ${resultFilterSubId === '' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: 11, padding: '5px 14px' }}
                    >
                      All Subjects ({results.length})
                    </button>
                    {subjects.map(sub => {
                      const count = results.filter(r => {
                        const ex = exams.find(e => e.id === r.examId);
                        return (ex?.subjectId === sub.id) || (r.subjectId === sub.id);
                      }).length;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setResultFilterSubId(sub.id)}
                          className={`btn btn-sm ${resultFilterSubId === sub.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: 11, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color || 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                          {sub.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                    {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} shown
                  </span>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Warnings</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
                      <tbody>
                        {filteredResults.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                              {results.length === 0 ? 'No submissions yet.' : 'No results found for this subject.'}
                            </td></tr>
                          : filteredResults.map(r => {
                            const ex = exams.find(e => e.id === r.examId);
                            const sub = ex ? subjects.find(sb => sb.id === ex.subjectId) : (subjects.find(sb => sb.id === r.subjectId) || (r.subjectName ? { name: r.subjectName } : null));
                            return (
                              <tr key={r.id}>
                                <td style={{ color: '#fff', fontWeight: 600 }}>{r.studentName}</td>
                                <td>
                                  {sub
                                    ? <span className="badge badge-orange" style={{ fontSize: 10 }}>{sub.name}</span>
                                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                  }
                                </td>
                                <td style={{ fontWeight: 600 }}>{r.cheated ? '—' : `${r.score}/${r.totalMarks}`}</td>
                                <td>{r.warnings > 0 ? <span className="badge badge-orange">{r.warnings} ⚠️</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                <td><span className={`badge ${r.cheated ? 'badge-red' : (r.status === 'PASSED' ? 'badge-green' : 'badge-orange')}`}>{r.status}</span></td>
                                <td style={{ fontSize: 11 }}>{r.date}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <Link
                                    to={`/admin/results/${r.id}`}
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      borderRadius: 8,
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      border: '1px solid rgba(255, 255, 255, 0.12)',
                                      color: '#ffffff',
                                      textDecoration: 'none',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <Eye size={13} style={{ color: 'var(--primary-light)' }} /> View Review
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════════════ */
export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            {isLoading && (
              <LoadingScreen onFinish={() => setIsLoading(false)} />
            )}
            <Toaster
              position="top-center"
              toastOptions={{
                style: { background: '#0f0f11', color: '#f8f8fa', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, fontWeight: 500, borderRadius: 12 },
                success: { iconTheme: { primary: '#10b981', secondary: '#0f0f11' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#0f0f11' } },
              }}
            />
            <Routes>
              {/* Home */}
              <Route path="/" element={<HomePage />} />

              {/* Student Authentication Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<OtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ForgotPasswordPage />} />

              {/* Student Protected Dashboard */}
              <Route path="/student/dashboard" element={<StudentGuard><StudentDashboard /></StudentGuard>} />

              {/* Assessment Flow & Gateways */}
              <Route path="/exam/:examId" element={<StudentLanding />} />
              <Route path="/exam/:examId/setup" element={<StudentGuard><SystemCheck /></StudentGuard>} />
              <Route path="/exam/:examId/take" element={<StudentGuard><ExamTake /></StudentGuard>} />
              <Route path="/student/exams/:examId/setup" element={<StudentGuard><SystemCheck /></StudentGuard>} />
              <Route path="/student/exams/:examId/take" element={<StudentGuard><ExamTake /></StudentGuard>} />
              <Route path="/student/results" element={<StudentGuard><StudentDashboard /></StudentGuard>} />
              <Route path="/thankyou/:resultId" element={<ThankYouPage />} />
              <Route path="/result/:id" element={<ResultPage />} />
              <Route path="/admin/results/:id" element={<AdminGuard><ResultPage /></AdminGuard>} />
              <Route path="/cheated" element={<CheatedPage />} />

              {/* Admin Portal */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

              {/* 404 Catch-All */}
              <Route path="*" element={
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#09090b', color: '#f8f8fa' }}>
                  <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Page not found.</p>
                  <Link to="/" className="btn btn-secondary">Go Home</Link>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
