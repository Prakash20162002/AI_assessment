import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, Link, useNavigate, useParams
} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  BookOpen, Clock, AlertTriangle, Trophy, Plus, Trash2,
  ShieldAlert, CheckCircle2, XCircle, Camera, Wifi, Maximize2,
  FileText, ArrowRight, ArrowLeft, Eye, EyeOff, Lock, Edit3,
  Layers, X, Users, LogOut, Link2, Copy, Home, AlertCircle,
  ChevronRight, BarChart3, Star, Zap, Shield, Activity, Monitor, UserCheck, Share2, Send, Mail, ExternalLink, RefreshCw, Sparkles, Menu
} from 'lucide-react';
import LoadingScreen from './components/LoadingScreen.jsx';
import StudentAuthModal from './components/StudentAuthModal.jsx';

/* ═══════════════════════════════════════════════════════
   DATA LAYER  (localStorage)
═══════════════════════════════════════════════════════ */
const ADMIN_ACCOUNTS = [
  { loginId: 'Nilesh Maity', password: 'datascience2026', name: 'Nilesh Maity' },
  { loginId: 'nilesh', password: 'datascience2026', name: 'Nilesh Maity' },
  { loginId: 'Rohit Pandit', password: 'MERN2026', name: 'Rohit Pandit' },
  { loginId: 'rohit', password: 'MERN2026', name: 'Rohit Pandit' },
  { loginId: 'Prakash Halwai', password: 'Devops2026', name: 'Prakash Halwai' },
  { loginId: 'prakash', password: 'Devops2026', name: 'Prakash Halwai' },
];

const MAX_WARNINGS = 3;

const SEED = {
  subjects: [
    { id: 's1', name: 'Web Development', color: '#e63946' },
    { id: 's2', name: 'Data Structures', color: '#f77f00' },
  ],
  questions: [
    { id: 'q1', subjectId: 's1', questionText: 'Which CSS property creates a glassmorphism blur effect?', options: { A: 'filter: blur()', B: 'backdrop-filter: blur()', C: 'background-blur', D: 'opacity-blur' }, correctAnswer: 'B', marks: 5, explanation: 'backdrop-filter applies graphical effects behind an element.' },
    { id: 'q2', subjectId: 's1', questionText: 'What does useState return in React?', options: { A: 'A string value', B: 'A DOM node', C: 'A value and setter function', D: 'A Promise' }, correctAnswer: 'C', marks: 5, explanation: 'useState returns [currentValue, setValue].' },
    { id: 'q3', subjectId: 's2', questionText: 'What is the time complexity of binary search?', options: { A: 'O(n)', B: 'O(log n)', C: 'O(n²)', D: 'O(1)' }, correctAnswer: 'B', marks: 5, explanation: 'Binary search halves the search space each iteration.' },
    { id: 'q4', subjectId: 's2', questionText: 'Which data structure uses FIFO ordering?', options: { A: 'Stack', B: 'Queue', C: 'Tree', D: 'Hash Map' }, correctAnswer: 'B', marks: 5, explanation: 'Queue = First In, First Out.' },
  ],
  exams: [
    { id: 'exam_demo', subjectId: 's1', title: 'Web Dev Assessment', duration: 600, createdAt: new Date().toISOString() },
  ],
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

function Header({ showAdmin = false, adminMode = false, disableBrandLink = false, onLogout }) {
  const adminName = sessionStorage.getItem('dp_admin_name');
  const isAdminLoggedIn = sessionStorage.getItem('dp_admin') === 'true';

  const brandInner = (
    <div className="brand" style={{ cursor: disableBrandLink ? 'default' : 'pointer' }}>
      <div className="brand-logo-wrap">
        <img src="/logo.png" alt="DevPhoenix" className="header-logo-img" />
      </div>
      <span className="badge badge-orange badge-ai-header" style={{ fontSize: 9, padding: '3px 8px', letterSpacing: '.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>AI ASSESSMENT</span>
    </div>
  );

  return (
    <header className="app-header">
      <div className="header-inner">
        {disableBrandLink ? (
          brandInner
        ) : (
          <Link to={isAdminLoggedIn ? "/admin/dashboard" : "/"} style={{ textDecoration: 'none' }}>
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
   2. STUDENT LANDING
═══════════════════════════════════════════════════════ */
function StudentLanding() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const sName = sessionStorage.getItem('dp_student');
    if (sName) {
      setName(sName);
    } else {
      setShowAuthModal(true);
    }

    const exams = DB.exams.get();
    let found = exams.find(e => e.id === examId);
    if (!found && examId) {
      found = { id: examId, subjectId: 's1', title: 'AI Proctored Assessment', duration: 600, createdAt: new Date().toISOString() };
    }
    if (!found) return;
    setExam(found);

    const existing = DB.results.get().find(r => r.examId === examId && (sName ? r.studentName === sName : true));
    const submittedFlag = sName ? sessionStorage.getItem(`dp_submitted_${examId}_${sName}`) : null;

    if (existing || submittedFlag) {
      toast.error('🚫 Exam already submitted! You cannot re-attempt this exam.', { id: 'already-sub-sl' });
      stopGlobalWebcamStreams();
      navigate(existing ? `/thankyou/${existing.id}` : '/', { replace: true });
      return;
    }

    const subs = DB.subjects.get();
    setSubject(subs.find(s => s.id === found.subjectId) || { name: 'Proctored Exam' });
    const qs = DB.questions.get().filter(q => q.subjectId === found.subjectId);
    setQuestions(qs.length > 0 ? qs : DB.questions.get());
  }, [examId, navigate]);

  const handleStart = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter your full name'); return; }
    sessionStorage.setItem('dp_student', name.trim());
    sessionStorage.setItem('dp_exam_id', examId);
    const students = DB.students.get();
    if (!students.find(s => s.name === name.trim() && s.examId === examId)) {
      students.push({ id: genId('stu'), name: name.trim(), examId, joinedAt: new Date().toISOString() });
      DB.students.set(students);
    }
    navigate(`/exam/${examId}/setup`);
  };

  if (!exam) return (
    <div className="page-wrapper">
      <Header />
      <div className="center-page">
        <div className="card page-enter" style={{ maxWidth: 400, width: '100%', padding: 48, textAlign: 'center' }}>
          <XCircle size={52} style={{ color: 'var(--danger)', margin: '0 auto 20px', opacity: .6 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Exam Not Found</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>This exam link is invalid or has been removed by the administrator.</p>
          <Link to="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Go Home</Link>
        </div>
      </div>
    </div>
  );

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <div className="page-wrapper">
      <Header disableBrandLink showAdmin={false} />
      <StudentAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialExamTitle={exam?.title}
        onSuccess={(user) => {
          setName(user.name);
          setShowAuthModal(false);
        }}
      />
      <div className="center-page">
        <div className="glow glow-1" style={{ top: '-200px', left: '-150px' }} />
        <div className="student-landing-card page-enter">
          {/* Header */}
          <div className="exam-card-header">
            <img src="/mascot.jpeg" alt="Phoenix" className="exam-mascot logo-blend" />
            <div>
              <h2 className="exam-card-title">{exam.title}</h2>
              {subject && <span className="badge badge-orange">{subject.name}</span>}
            </div>
          </div>

          {/* Stats */}
          <div className="exam-stats-row">
            {[
              [questions.length, 'Questions', BookOpen],
              [`${Math.floor(exam.duration / 60)}m`, 'Duration', Clock],
              [totalMarks, 'Max Marks', Star],
            ].map(([val, label, Icon]) => (
              <div key={label} className="exam-stat">
                <Icon size={16} style={{ color: 'var(--secondary)', marginBottom: 4 }} />
                <p className="exam-stat-val">{val}</p>
                <p className="exam-stat-label">{label}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleStart} className="exam-register-form">
            <label className="form-label">Your Full Name</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input"
                style={{ width: '100%' }}
              />
              {!sessionStorage.getItem('dp_student') && (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="btn btn-secondary btn-full"
                  style={{ gap: 8, justifyContent: 'center', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', padding: '10px 14px', fontSize: 13 }}
                >
                  <UserCheck size={16} /> Student Login / Register
                </button>
              )}
            </div>

            <div className="anti-cheat-notice">
              <ShieldAlert size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p>
                <strong style={{ color: 'var(--danger)' }}>Anti-cheat active.</strong> Exiting fullscreen freezes exam timer. Switching tabs, taking photos or looking away will issue warnings and trigger disqualification.
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Continue to System Check <ArrowRight size={16} />
            </button>
          </form>

          <p className="footer-note">© DevPhoenix · AI-Proctored Session</p>
        </div>
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
  const studentName = sessionStorage.getItem('dp_student');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [camOk, setCamOk] = useState(false);
  const [camErr, setCamErr] = useState('');
  const [internet, setInternet] = useState(navigator.onLine);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!studentName) { navigate(`/exam/${examId}`); return; }

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
    try {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) await rfs.call(el);
    } catch { }
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
  const studentName = sessionStorage.getItem('dp_student');

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
  // On mobile: always treat as fullscreen (native API not supported on iOS)
  const [isFullscreen, setIsFullscreen] = useState(
    isMobile || !!(document.fullscreenElement || document.webkitFullscreenElement)
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const warningCountRef = useRef(0);
  const terminatedRef = useRef(false);
  const warningCooldown = useRef(false);
  const timerRef = useRef(null);

  const noFaceFramesRef = useRef(0);
  const multiFaceFramesRef = useRef(0);
  const gazeFramesRef = useRef(0);
  const pitchFramesRef = useRef(0);
  const eyeFramesRef = useRef(0);

  const stopCameraAndExamProctoring = useCallback(() => {
    document.body.classList.remove('mobile-fullscreen-active');
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch { }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if (efs) efs.call(document).catch(() => { });
      } catch { }
    }
  }, []);

  const saveResult = useCallback((cheated = false) => {
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correctAnswer) score += (q.marks || 0); });
    const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
    const r = {
      id: genId('res'), examId, studentName,
      score, totalMarks, cheated,
      warnings: warningCountRef.current,
      status: cheated ? 'Disqualified' : 'Completed',
      date: new Date().toLocaleString(), answers,
      timeTaken: (exam?.duration || 600) - timeLeft
    };
    DB.results.set([r, ...DB.results.get()]);
    return r;
  }, [answers, questions, examId, studentName, timeLeft, exam]);

  const doSubmit = useCallback((cheated = false, timeUp = false) => {
    if (!questions.length) return;
    const r = saveResult(cheated);
    if (studentName && examId) {
      sessionStorage.setItem(`dp_submitted_${examId}_${studentName}`, 'true');
    }
    clearInterval(timerRef.current);
    stopCameraAndExamProctoring();
    stopGlobalWebcamStreams();
    if (!cheated) {
      if (timeUp) toast('⏰ Time is up! Exam auto-submitted.', { duration: 3000 });
      else toast.success('✅ Exam submitted successfully!');
      navigate(`/thankyou/${r.id}`, { replace: true });
    } else {
      navigate('/cheated', { replace: true });
    }
  }, [saveResult, navigate, questions, stopCameraAndExamProctoring, studentName, examId]);

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

    if (newCount >= MAX_WARNINGS) {
      setTimeout(() => triggerViolation(`${MAX_WARNINGS} warnings exceeded: ${reason}`), 400);
    } else {
      toast.error(`🚨 PROCTORING ALERT (${newCount}/${MAX_WARNINGS}): ${reason}`, { duration: 4000, id: 'proctor-alert' });
    }
  }, [triggerViolation]);

  // Load exam data & start webcam (with Submission Guard)
  useEffect(() => {
    if (!studentName) { navigate('/'); return; }

    const existing = DB.results.get().find(r => r.examId === examId && r.studentName === studentName);
    const submittedFlag = sessionStorage.getItem(`dp_submitted_${examId}_${studentName}`);
    if (existing || submittedFlag) {
      toast.error('🚫 Exam already submitted! Re-entry is blocked to prevent cheating.', { id: 'already-sub-ex' });
      stopGlobalWebcamStreams();
      navigate(existing ? `/thankyou/${existing.id}` : '/', { replace: true });
      return;
    }

    let ex = DB.exams.get().find(e => e.id === examId);
    if (!ex && examId) {
      ex = { id: examId, subjectId: 's1', title: 'AI Proctored Assessment', duration: 600 };
    }
    if (!ex) {
      ex = DB.exams.get()[0] || { id: 'exam_demo', subjectId: 's1', title: 'Web Development Assessment', duration: 600 };
    }
    setExam(ex);
    setTimeLeft(ex.duration || 600);

    let qs = DB.questions.get().filter(q => q.subjectId === ex.subjectId);
    if (!qs || qs.length === 0) {
      qs = DB.questions.get();
    }
    setQuestions(qs);

    stopGlobalWebcamStreams();

    navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
      .then(s => {
        streamRef.current = s;
        registerStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { });

    const enterFS = async () => {
      document.body.classList.add('mobile-fullscreen-active');
      if (isMobile) {
        // iOS / Android: native fullscreen API not supported on document element.
        // Use viewport-lock CSS class only — isFullscreen is already true.
        setIsFullscreen(true);
        return;
      }
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        try {
          const el = document.documentElement;
          const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
          if (rfs) await rfs.call(el);
          setIsFullscreen(true);
        } catch { setIsFullscreen(true); }
      }
    };
    setTimeout(enterFS, 200);

    return () => {
      document.body.classList.remove('mobile-fullscreen-active');
      stopGlobalWebcamStreams();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [examId, navigate, studentName]);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      const faceapi = window.faceapi;
      if (!faceapi) { setTimeout(loadModels, 1500); return; }
      try {
        const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUrl);
        setFaceApiReady(true);
      } catch { }
    };
    loadModels();
  }, []);

  // AI Face, Head Pose, Eye Gaze & Phone Photo Detection (Interval: 1000ms, 3-frame persistence buffer)
  useEffect(() => {
    if (!faceApiReady || !isFullscreen) return; // Pause proctoring when exam is frozen
    const interval = setInterval(async () => {
      if (!videoRef.current || terminatedRef.current) return;
      try {
        const faceapi = window.faceapi;
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.25 });
        const detections = await faceapi.detectAllFaces(videoRef.current, opts).withFaceLandmarks(true);

        if (detections.length === 0) {
          noFaceFramesRef.current += 1;
          gazeFramesRef.current = 0;
          pitchFramesRef.current = 0;
          eyeFramesRef.current = 0;
          multiFaceFramesRef.current = 0;

          if (noFaceFramesRef.current >= 3) {
            triggerWarning('📷 Face Not Detected / Camera Blocked! Stay centered in front of camera.');
            noFaceFramesRef.current = 0;
          }
        } else if (detections.length > 1) {
          multiFaceFramesRef.current += 1;
          noFaceFramesRef.current = 0;
          gazeFramesRef.current = 0;
          pitchFramesRef.current = 0;
          eyeFramesRef.current = 0;

          if (multiFaceFramesRef.current >= 2) {
            triggerWarning('⚠️ Multiple Persons / Secondary Device Detected in Camera!');
            multiFaceFramesRef.current = 0;
          }
        } else {
          noFaceFramesRef.current = 0;
          multiFaceFramesRef.current = 0;

          const detection = detections[0];
          const landmarks = detection.landmarks;
          const box = detection.detection?.box;
          const faceWidth = box ? box.width : 160;

          if (landmarks && faceWidth > 0) {
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const jaw = landmarks.getJawOutline();

            const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
            const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;
            const noseX = nose[3].x;
            const noseY = nose[3].y;
            const jawY = jaw[8].y;

            // 1. Horizontal Gaze / Head Turn (Normalized to Face Width)
            const gazeOffset = Math.abs(eyeCenterX - noseX) / faceWidth;

            // 2. Vertical Pitch / Head Tilt Down (Looking down at phone in lap)
            const noseToEye = Math.abs(noseY - eyeCenterY);
            const jawToNose = Math.abs(jawY - noseY);
            const pitchRatio = noseToEye / (jawToNose || 1);

            // 3. Eye Height (Normalized to Face Width)
            const leftH = Math.max(...leftEye.map(p => p.y)) - Math.min(...leftEye.map(p => p.y));
            const rightH = Math.max(...rightEye.map(p => p.y)) - Math.min(...rightEye.map(p => p.y));
            const maxEyeH = Math.max(leftH, rightH);
            const normEyeH = maxEyeH / faceWidth;

            // Evaluate Gaze Shift (Looking away left/right at phone or secondary screen)
            if (gazeOffset > 0.17) {
              gazeFramesRef.current += 1;
              if (gazeFramesRef.current >= 3) {
                triggerWarning('👀 Eye Gaze Shift: Looking away from exam screen!');
                gazeFramesRef.current = 0;
              }
            } else {
              gazeFramesRef.current = 0;
            }

            // Evaluate Head Tilt Down (Looking down at mobile phone / paper)
            if (pitchRatio < 0.28 || pitchRatio > 1.75) {
              pitchFramesRef.current += 1;
              if (pitchFramesRef.current >= 3) {
                triggerWarning('📱 Head Tilted Down: Looking down at mobile phone / paper!');
                pitchFramesRef.current = 0;
              }
            } else {
              pitchFramesRef.current = 0;
            }

            // Evaluate Eye Distraction / Closed Eyes
            if (normEyeH < 0.022) {
              eyeFramesRef.current += 1;
              if (eyeFramesRef.current >= 4) {
                triggerWarning('👁️ Eye Distraction: Eyes closed or looking down at phone screen!');
                eyeFramesRef.current = 0;
              }
            } else {
              eyeFramesRef.current = 0;
            }
          }
        }
      } catch { }
    }, 1000);
    return () => clearInterval(interval);
  }, [faceApiReady, isFullscreen, triggerWarning]);

  // Anti-cheat: tab switch & fullscreen monitoring
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
    document.addEventListener('contextmenu', blockCtx);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFS);
      document.removeEventListener('webkitfullscreenchange', onFS);
      document.removeEventListener('contextmenu', blockCtx);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [triggerViolation, triggerWarning]);

  // Timer — PAUSES automatically when !isFullscreen (Exam Frozen)
  useEffect(() => {
    if (!exam || !isFullscreen) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          if (!terminatedRef.current) doSubmit(false, true);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [exam, isFullscreen, doSubmit]);

  const resumeFullscreen = async () => {
    document.body.classList.add('mobile-fullscreen-active');
    setIsFullscreen(true);
    if (isMobile) {
      toast.success('📱 Mobile exam view active. Timer resumed.');
      return;
    }
    try {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) await rfs.call(el);
      toast.success('Fullscreen resumed. Timer active.');
    } catch {
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
          <div className="cam-thumb">
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                    onClick={() => setAnswers(p => ({ ...p, [q.id]: key }))}
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
  const [result, setResult] = useState(null);

  useEffect(() => {
    stopGlobalWebcamStreams();
    const r = DB.results.get().find(r => r.id === resultId);
    setResult(r);

    // Trap browser back button so user cannot return to exam page
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error('🚫 Exam submitted. Back button is disabled to prevent cheating.', { id: 'no-back-ty' });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopGlobalWebcamStreams();
    };
  }, [resultId]);

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
            Submitted on {result.date} · Session ID: <code>{result.id.slice(-10)}</code>
          </p>
        </div>

        <div className="ty-actions">
          <Link to={`/result/${result.id}`} className="btn btn-secondary">
            <FileText size={15} /> Full Report
          </Link>
          {sessionStorage.getItem('dp_admin') === 'true' ? (
            <Link to="/admin/dashboard" className="btn btn-primary">
              <ArrowLeft size={15} /> Admin Dashboard
            </Link>
          ) : (
            <Link to="/" className="btn btn-primary">
              <Home size={15} /> Go Home
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
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    stopGlobalWebcamStreams();
    const r = DB.results.get().find(r => r.id === id);
    setResult(r);
    if (r) {
      const ex = DB.exams.get().find(e => e.id === r.examId);
      if (ex) setQuestions(DB.questions.get().filter(q => q.subjectId === ex.subjectId));
    }

    // Trap browser back button
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error('🚫 Exam finished. Back button is disabled.', { id: 'no-back-res' });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopGlobalWebcamStreams();
    };
  }, [id]);

  if (!result) return <div className="center-page" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

  const pct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const passed = pct >= 50;
  const isAdmin = sessionStorage.getItem('dp_admin') === 'true';

  return (
    <div className="page-wrapper">
      <Header />
      <main style={{ flex: 1, padding: '32px 20px', maxWidth: 840, margin: '0 auto', width: '100%' }}>
        <div className="page-enter">
          <div className="result-header-card" style={{ borderColor: passed ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)', background: passed ? 'rgba(16,185,129,.04)' : 'rgba(239,68,68,.04)' }}>
            <div className="result-trophy" style={{ background: passed ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)' }}>
              {passed ? <Trophy size={36} style={{ color: 'var(--success)' }} /> : <XCircle size={36} style={{ color: 'var(--danger)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{pct}%</h2>
                <span className={`badge ${passed ? 'badge-green' : 'badge-red'}`}>{passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.studentName} · {result.score}/{result.totalMarks} marks · {result.date}</p>
            </div>
            {isAdmin ? (
              <Link to="/admin/dashboard" className="btn btn-primary btn-sm">
                <ArrowLeft size={14} /> Back to Admin Dashboard
              </Link>
            ) : (
              <Link to="/" className="btn btn-secondary btn-sm">
                <Home size={14} /> Home
              </Link>
            )}
          </div>

          <h3 className="section-label">Answer Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, i) => {
              const stuAns = result.answers?.[q.id];
              const correct = stuAns === q.correctAnswer;
              const skipped = !stuAns;
              return (
                <div key={q.id} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-orange" style={{ fontSize: 9 }}>Q{i + 1}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.marks} marks</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>{q.questionText}</p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, flexShrink: 0,
                      background: correct ? 'rgba(16,185,129,.1)' : skipped ? 'rgba(255,255,255,.04)' : 'rgba(239,68,68,.1)',
                      color: correct ? 'var(--success)' : skipped ? 'var(--text-muted)' : 'var(--danger)',
                    }}>
                      {correct ? '✓ Correct' : skipped ? '— Skipped' : '✗ Wrong'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(q.options || {}).map(([k, v]) => {
                      const isCor = q.correctAnswer === k;
                      const isStu = stuAns === k && !correct;
                      return (
                        <div key={k} style={{
                          padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                          border: `1px solid ${isCor ? 'rgba(16,185,129,.25)' : isStu ? 'rgba(239,68,68,.25)' : 'var(--border)'}`,
                          background: isCor ? 'rgba(16,185,129,.06)' : isStu ? 'rgba(239,68,68,.06)' : 'transparent',
                        }}>
                          <span style={{
                            minWidth: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800,
                            background: isCor ? 'rgba(16,185,129,.2)' : isStu ? 'rgba(239,68,68,.2)' : 'var(--bg-surface)',
                            color: isCor ? 'var(--success)' : isStu ? 'var(--danger)' : 'var(--text-muted)'
                          }}>{k}</span>
                          <span style={{ fontSize: 12, color: isCor ? 'var(--success)' : isStu ? 'var(--danger)' : 'var(--text-secondary)', flex: 1 }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(252,191,73,.04)', border: '1px solid rgba(252,191,73,.1)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Explanation: </span>{q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
  const [loginId, setLoginId] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('dp_admin') === 'true') navigate('/admin/dashboard');
  }, [navigate]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const matched = ADMIN_ACCOUNTS.find(
      acc => acc.loginId.toLowerCase() === loginId.trim().toLowerCase() && acc.password === pw
    );

    if (matched) {
      sessionStorage.setItem('dp_admin', 'true');
      sessionStorage.setItem('dp_admin_name', matched.name);
      toast.success(`Welcome back, ${matched.name}!`);
      navigate('/admin/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
    setLoading(false);
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
              <label className="form-label">Admin Name / Login ID</label>
              <input type="text" required value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Enter your Admin Login ID" className="input" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
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
  const navigate = useNavigate();
  useEffect(() => { if (sessionStorage.getItem('dp_admin') !== 'true') navigate('/admin'); }, [navigate]);
  if (sessionStorage.getItem('dp_admin') !== 'true') return null;
  return children;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const [subName, setSubName] = useState('');
  const [editSubId, setEditSubId] = useState(null);

  const [qSubId, setQSubId] = useState('');
  const [qText, setQText] = useState('');
  const [qOpts, setQOpts] = useState({ A: '', B: '', C: '', D: '' });
  const [qAns, setQAns] = useState('A');
  const [qMarks, setQMarks] = useState(1);
  const [qExpl, setQExpl] = useState('');
  const [editQId, setEditQId] = useState(null);

  const [filterSubId, setFilterSubId] = useState('');
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

  const saveEditStudent = (e) => {
    e.preventDefault();
    if (!editStudentName.trim() || !editStudentId) return;
    const list = students.map(s => s.id === editStudentId ? { ...s, name: editStudentName.trim() } : s);
    DB.students.set(list);
    setStudents(list);
    setEditStudentId(null);
    setEditStudentName('');
    toast.success('Student record updated!');
  };

  const delStudent = (id) => setConfirm({
    title: 'Delete Student Record?',
    message: 'Remove this student record permanently.',
    danger: true,
    onConfirm: () => {
      const list = students.filter(s => s.id !== id);
      DB.students.set(list);
      setStudents(list);
      setConfirm(null);
      toast.success('Student record deleted');
    }
  });

  const clearAllStudents = () => setConfirm({
    title: 'Clear All Students?',
    message: 'Permanently remove all registered student records from the database.',
    danger: true,
    onConfirm: () => {
      DB.students.set([]);
      setStudents([]);
      setConfirm(null);
      toast.success('Student list cleared');
    }
  });

  const reload = () => {
    const subs = DB.subjects.get();
    setSubjects(subs);
    setQuestions(DB.questions.get());
    setExams(DB.exams.get());
    setResults(DB.results.get());
    setStudents(DB.students.get());

    if (subs.length > 0 && !qSubId) {
      setQSubId(subs[0].id);
      setFilterSubId(subs[0].id);
    }
  };
  useEffect(reload, []);

  // When form subject dropdown changes, dynamically sync filterSubId
  const handleQSubSelect = (subId) => {
    setQSubId(subId);
    setFilterSubId(subId);
  };

  // When filter dropdown changes, dynamically sync qSubId
  const handleFilterSubSelect = (subId) => {
    setFilterSubId(subId);
    if (subId) setQSubId(subId);
  };

  const logout = () => {
    sessionStorage.removeItem('dp_admin');
    sessionStorage.removeItem('dp_admin_name');
    toast.success('Logged out');
    navigate('/admin');
  };

  const saveSub = (e) => {
    e.preventDefault(); if (!subName.trim()) return;
    let list = [...subjects];
    if (editSubId) list = list.map(s => s.id === editSubId ? { ...s, name: subName.trim() } : s);
    else {
      const newSub = { id: genId('sub'), name: subName.trim(), color: '#e63946' };
      list.push(newSub);
      setQSubId(newSub.id);
      setFilterSubId(newSub.id);
    }
    DB.subjects.set(list); setSubjects(list); setSubName(''); setEditSubId(null);
    toast.success(editSubId ? 'Subject updated' : 'Subject added');
  };

  const delSub = (id) => setConfirm({
    title: 'Delete Subject?', message: 'This removes the subject and all its questions and exams.', danger: true,
    onConfirm: () => {
      DB.subjects.set(subjects.filter(s => s.id !== id));
      DB.questions.set(questions.filter(q => q.subjectId !== id));
      DB.exams.set(exams.filter(e => e.subjectId !== id));
      reload(); setConfirm(null); toast.success('Deleted');
    }
  });

  // Retain selected subject on reset so admin doesn't have to select subject repeatedly
  const resetQForm = () => {
    setEditQId(null);
    setQText('');
    setQOpts({ A: '', B: '', C: '', D: '' });
    setQAns('A');
    setQMarks(5);
    setQExpl('');
  };

  const saveQ = (e) => {
    e.preventDefault();
    if (!qSubId) { toast.error('Please select a subject'); return; }
    if (!qText || !qOpts.A || !qOpts.B || !qOpts.C || !qOpts.D) { toast.error('Fill all required fields'); return; }
    let list = [...questions];
    const data = { subjectId: qSubId, questionText: qText, options: { ...qOpts }, correctAnswer: qAns, marks: Number(qMarks), explanation: qExpl };
    if (editQId) list = list.map(q => q.id === editQId ? { ...q, ...data } : q);
    else list.push({ id: genId('q'), ...data });
    DB.questions.set(list); setQuestions(list); resetQForm();
    toast.success(editQId ? 'Question updated' : 'Question added to subject!');
  };

  const editQ = (q) => {
    setEditQId(q.id);
    setQSubId(q.subjectId);
    setFilterSubId(q.subjectId);
    setQText(q.questionText);
    setQOpts({ ...q.options });
    setQAns(q.correctAnswer);
    setQMarks(q.marks);
    setQExpl(q.explanation || '');
    setTab('questions');
  };

  const delQ = (id) => setConfirm({
    title: 'Delete Question?', message: 'Remove this question permanently.', danger: true,
    onConfirm: () => { const l = questions.filter(q => q.id !== id); DB.questions.set(l); setQuestions(l); setConfirm(null); toast.success('Deleted'); }
  });

  const createExam = (subId) => {
    const sub = subjects.find(s => s.id === subId);
    if (!sub) return;
    const qs = questions.filter(q => q.subjectId === subId);
    if (qs.length === 0) { toast.error('Add questions to this subject first'); return; }
    const ex = { id: genId('exam'), subjectId: subId, title: sub.name + ' Assessment', duration: 600, createdAt: new Date().toISOString() };
    const list = [...exams, ex]; DB.exams.set(list); setExams(list);
    toast.success('Exam link created!');
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed'));
  };

  const delExam = (id) => setConfirm({
    title: 'Delete Exam?', message: 'Students won\'t be able to access this exam anymore.', danger: true,
    onConfirm: () => { const l = exams.filter(e => e.id !== id); DB.exams.set(l); setExams(l); setConfirm(null); toast.success('Exam deleted'); }
  });

  const navItems = [
    { key: 'overview', icon: BarChart3, label: 'Overview' },
    { key: 'subjects', icon: Layers, label: 'Subjects' },
    { key: 'questions', icon: BookOpen, label: 'Question Bank' },
    { key: 'exams', icon: Link2, label: 'Exam Links' },
    { key: 'students', icon: Users, label: 'Students' },
    { key: 'results', icon: Trophy, label: 'Results' },
  ];

  const stats = [
    { label: 'Subjects', val: subjects.length, color: 'var(--primary)', icon: Layers },
    { label: 'Questions', val: questions.length, color: 'var(--secondary)', icon: BookOpen },
    { label: 'Active Exams', val: exams.length, color: 'var(--accent)', icon: Link2 },
    { label: 'Total Students', val: students.length, color: 'var(--success)', icon: Users },
  ];

  const filteredQuestions = filterSubId ? questions.filter(q => q.subjectId === filterSubId) : questions;

  return (
    <div className="admin-wrapper">
      <ConfirmModal open={!!confirm} {...(confirm || {})} onCancel={() => setConfirm(null)} />
      <ShareModal open={shareModal.open} exam={shareModal.exam} subject={shareModal.subject} onCancel={() => setShareModal({ open: false, exam: null, subject: null })} />

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
        <span className="badge badge-gold" style={{ fontSize: 10, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserCheck size={12} /> {sessionStorage.getItem('dp_admin_name') || 'Admin'}
        </span>
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

            {/* SUBJECTS */}
            {tab === 'subjects' && (
              <div>
                <h2 className="admin-page-title">Subject Management</h2>
                <div className="admin-split-grid">
                  <form onSubmit={saveSub} className="card admin-form">
                    <h3 className="form-section-title">{editSubId ? 'Edit Subject' : 'Add Subject'}</h3>
                    <div className="form-group">
                      <label className="form-label">Subject Name *</label>
                      <input type="text" required value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Web Development" className="input" />
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
                      : subjects.map(s => (
                        <div key={s.id} className="admin-list-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color || 'var(--primary)', flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {questions.filter(q => q.subjectId === s.id).length} questions · {exams.filter(e => e.subjectId === s.id).length} exams
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setEditSubId(s.id); setSubName(s.name); }} className="btn btn-icon btn-sm" title="Edit"><Edit3 size={13} /></button>
                            <button onClick={() => delSub(s.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
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

                    {/* Subject dropdown — retains selected subject across entries & filters right-hand branch */}
                    <div className="form-group">
                      <label className="form-label">Target Subject Branch *</label>
                      <select required value={qSubId} onChange={e => handleQSubSelect(e.target.value)} className="input" style={{ cursor: 'pointer', border: '1px solid var(--secondary)' }}>
                        <option value="">— Choose Subject —</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
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
                        <label className="form-label">Marks *</label>
                        <input type="number" min={1} value={qMarks} onChange={e => setQMarks(e.target.value)} className="input" />
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
                    {/* Dynamic Branch Filter Bar */}
                    <div className="q-filter-bar" style={{ background: 'var(--bg-card)', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Subject Branch:</span>
                      <select value={filterSubId} onChange={e => handleFilterSubSelect(e.target.value)} className="input input-sm" style={{ cursor: 'pointer', maxWidth: 220 }}>
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} in branch
                      </span>
                    </div>

                    <div className="admin-list">
                      {filteredQuestions.length === 0
                        ? <div className="empty-state">{questions.length === 0 ? 'No questions yet. Add one using the form.' : 'No questions for this subject branch.'}</div>
                        : filteredQuestions.map((q, i) => {
                          const sub = subjects.find(s => s.id === q.subjectId);
                          return (
                            <div key={q.id} className="card admin-q-card">
                              <div className="admin-q-header">
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span className="badge badge-orange" style={{ fontSize: 9 }}>Q{i + 1}</span>
                                    {sub && <span className="badge badge-gray" style={{ fontSize: 9 }}>{sub.name}</span>}
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.marks}m</span>
                                  </div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{q.questionText}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button onClick={() => editQ(q)} className="btn btn-icon btn-sm" title="Edit"><Edit3 size={12} /></button>
                                  <button onClick={() => delQ(q.id)} className="btn btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {Object.entries(q.options || {}).map(([k, v]) => (
                                  <div key={k} style={{
                                    padding: '6px 10px', borderRadius: 7, fontSize: 12,
                                    border: `1px solid ${q.correctAnswer === k ? 'rgba(16,185,129,.2)' : 'var(--border)'}`,
                                    background: q.correctAnswer === k ? 'rgba(16,185,129,.05)' : 'transparent',
                                    color: q.correctAnswer === k ? 'var(--success)' : 'var(--text-secondary)',
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
                    const ex = exams.find(e => e.id === s.examId);
                    return ex?.subjectId === studentFilterSubId;
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
                        const ex = exams.find(e => e.id === s.examId);
                        return ex?.subjectId === sub.id;
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
                            const ex = exams.find(e => e.id === s.examId);
                            const sub = ex ? subjects.find(sb => sb.id === ex.subjectId) : null;
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
                                  {sub
                                    ? <span className="badge badge-orange" style={{ fontSize: 10 }}>{sub.name}</span>
                                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                  }
                                </td>
                                <td style={{ fontSize: 12 }}>{ex?.title || s.examId}</td>
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

            {/* RESULTS */}
            {tab === 'results' && (() => {
              const filteredResults = resultFilterSubId
                ? results.filter(r => {
                    const ex = exams.find(e => e.id === r.examId);
                    return ex?.subjectId === resultFilterSubId;
                  })
                : results;
              return (
              <div>
                <div className="admin-section-head">
                  <h2 className="admin-page-title">Proctor Audit Log</h2>
                  {results.length > 0 && (
                    <button
                      onClick={() => setConfirm({
                        title: 'Clear All Results?', message: 'This permanently deletes all student submissions and audit logs.', danger: true,
                        onConfirm: () => { DB.results.set([]); setResults([]); setConfirm(null); toast.success('Cleared'); }
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
                        return ex?.subjectId === sub.id;
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
                      <thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Warnings</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                      <tbody>
                        {filteredResults.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                              {results.length === 0 ? 'No submissions yet.' : 'No results found for this subject.'}
                            </td></tr>
                          : filteredResults.map(r => {
                            const ex = exams.find(e => e.id === r.examId);
                            const sub = ex ? subjects.find(sb => sb.id === ex.subjectId) : null;
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
                                <td><span className={`badge ${r.cheated ? 'badge-red' : 'badge-green'}`}>{r.status}</span></td>
                                <td style={{ fontSize: 11 }}>{r.date}</td>
                                <td>
                                  {!r.cheated && (
                                    <Link to={`/result/${r.id}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)' }}>
                                      View →
                                    </Link>
                                  )}
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
        <Route path="/" element={<HomePage />} />
        <Route path="/exam/:examId" element={<StudentLanding />} />
        <Route path="/exam/:examId/setup" element={<SystemCheck />} />
        <Route path="/exam/:examId/take" element={<ExamTake />} />
        <Route path="/thankyou/:resultId" element={<ThankYouPage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/cheated" element={<CheatedPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Page not found.</p>
            <Link to="/" className="btn btn-secondary">Go Home</Link>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
