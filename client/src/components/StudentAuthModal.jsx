import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function StudentAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialExamTitle,
  initialMode = 'login',
}) {
  const { login: authLogin } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // ============================================================
  // LOGIN
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.error(
        'Please enter your email and password'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: cleanEmail,
        password: password,
      };

      console.log('Student login request:', {
        email: cleanEmail,
        hasPassword: Boolean(password),
      });

      const { data } = await api.post(
        '/auth/login',
        payload
      );

      if (!data?.success) {
        throw new Error(
          data?.message || 'Login failed'
        );
      }

      if (data.accessToken) {
        localStorage.setItem(
          'accessToken',
          data.accessToken
        );
      }

      if (data.user) {
        localStorage.removeItem('dp_admin');
        localStorage.removeItem('dp_admin_name');
        sessionStorage.removeItem('dp_admin');
        sessionStorage.removeItem('dp_admin_name');
        sessionStorage.setItem(
          'dp_student',
          data.user.name
        );

        sessionStorage.setItem(
          'dp_student_email',
          data.user.email
        );
      }

      if (data.user && data.accessToken) {
        authLogin(data.user, data.accessToken);
      }

      toast.success(
        `Welcome back, ${data.user?.name || 'Student'}!`
      );

      onSuccess?.(data.user);
    } catch (err) {
      console.error(
        'Student login error:',
        err
      );

      const response = err.response?.data;

      if (
        response?.requiresVerification &&
        response?.userId
      ) {
        setUserId(response.userId);
        setMode('otp');

        toast(
          'Please verify your email with the OTP sent during registration.',
          {
            icon: '✉️',
          }
        );
      } else if (!err.response) {
        toast.error('Unable to connect to server. Is the backend running?');
      } else {
        toast.error(
          response?.message === 'Invalid email or password'
            ? 'Invalid email or password. If you do not have an account, please click Register.'
            : (response?.message || 'Login failed. Please check your credentials.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      toast.error(
        'Please fill in all registration fields'
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        'Password must be at least 6 characters'
      );
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        '/auth/register',
        {
          name: cleanName,
          email: cleanEmail,
          password,
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            'Registration failed'
        );
      }

      setUserId(data.userId);
      setOtp('');
      if (data?.devOtp) {
        toast.success(`OTP sent to email! (Verification Code: ${data.devOtp})`, { duration: 12000 });
      } else {
        toast.success(data?.message || 'Registration successful! Please check your email for the OTP.');
      }
      setMode('otp');
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      if (!err.response) {
        toast.error('Unable to connect to server. Please check your network connection.');
      } else {
        toast.error(serverMessage || 'Registration failed. Please verify your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const cleanOtp = otp.trim();

    if (!cleanOtp || (!userId && !email)) {
      toast.error(
        'Please enter the 6-digit OTP code'
      );
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      toast.error(
        'OTP must contain exactly 6 digits'
      );
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        '/auth/verify-otp',
        {
          userId,
          email,
          otp: cleanOtp,
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            'OTP verification failed'
        );
      }

      if (data.accessToken) {
        localStorage.setItem(
          'accessToken',
          data.accessToken
        );
      }

      if (data.user) {
        localStorage.removeItem('dp_admin');
        localStorage.removeItem('dp_admin_name');
        sessionStorage.removeItem('dp_admin');
        sessionStorage.removeItem('dp_admin_name');
        sessionStorage.setItem(
          'dp_student',
          data.user.name
        );

        sessionStorage.setItem(
          'dp_student_email',
          data.user.email
        );
      }

      if (data.user && data.accessToken) {
        authLogin(data.user, data.accessToken);
      }

      toast.success(
        'Email verified successfully!'
      );

      onSuccess?.(data.user);
    } catch (err) {
      console.error(
        'OTP verification error:',
        err
      );

      toast.error(
        err.response?.data?.message ||
          'OTP verification failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================
  const handleResendOTP = async () => {
    if (!userId && !email) return;

    setLoading(true);

    try {
      const { data } = await api.post(
        '/auth/resend-otp',
        {
          userId,
          email,
        }
      );

      setOtp('');
      if (data?.devOtp) {
        toast.success(`New OTP Code sent: ${data.devOtp}`, { duration: 12000 });
      } else {
        toast.success(data?.message || 'A new OTP has been sent to your email.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Unable to resend OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="modal-card page-enter"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '32px 28px',
          position: 'relative',
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background:
                'rgba(230,57,70,.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff6b6b',
              marginBottom: 12,
            }}
          >
            {mode === 'otp' ? (
              <KeyRound size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {mode === 'login' &&
              'Student Login'}

            {mode === 'register' &&
              'Create Student Account'}

            {mode === 'otp' &&
              'Verify Email OTP'}
          </h2>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 4,
            }}
          >
            {initialExamTitle
              ? `Sign in to attempt "${initialExamTitle}"`
              : 'Sign in to access secure proctored exams'}
          </p>
        </div>

        {/* Login / Register Tabs */}
        {mode !== 'otp' && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              background:
                'rgba(255,255,255,0.04)',
              padding: 4,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setMode('login')
              }
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background:
                  mode === 'login'
                    ? 'var(--primary)'
                    : 'transparent',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() =>
                setMode('register')
              }
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background:
                  mode === 'register'
                    ? 'var(--primary)'
                    : 'transparent',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* =====================================================
            LOGIN FORM
        ===================================================== */}
        {mode === 'login' && (
          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <label className="form-label">
                Email Address
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Mail
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="student@example.com"
                  className="input"
                  style={{
                    paddingLeft: 38,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  onClick={onClose}
                  style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.55)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                >
                  Forgot password?
                </Link>
              </div>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Lock
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                  className="input"
                  style={{
                    paddingLeft: 38,
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{
                marginTop: 8,
              }}
            >
              {loading
                ? 'Logging in...'
                : (
                  <>
                    Log In & Continue
                    <ArrowRight
                      size={15}
                    />
                  </>
                )}
            </button>
          </form>
        )}

        {/* =====================================================
            REGISTER FORM
        ===================================================== */}
        {mode === 'register' && (
          <form
            onSubmit={handleRegister}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <label className="form-label">
                Full Name
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <User
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Rahul Sharma"
                  className="input"
                  style={{
                    paddingLeft: 38,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Email Address
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Mail
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="student@example.com"
                  className="input"
                  style={{
                    paddingLeft: 38,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Password
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <Lock
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Min. 6 characters"
                  className="input"
                  style={{
                    paddingLeft: 38,
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{
                marginTop: 8,
              }}
            >
              {loading
                ? 'Creating account...'
                : (
                  <>
                    Create Account
                    <ArrowRight
                      size={15}
                    />
                  </>
                )}
            </button>
          </form>
        )}

        {/* =====================================================
            OTP FORM
        ===================================================== */}
        {mode === 'otp' && (
          <form
            onSubmit={handleVerifyOTP}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              <CheckCircle2
                size={36}
                style={{
                  color: '#4ade80',
                }}
              />

              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color:
                    'var(--text-muted)',
                }}
              >
                Enter the 6-digit OTP
                sent to:
              </p>

              <strong
                style={{
                  color: '#fff',
                }}
              >
                {email}
              </strong>
            </div>

            <div>
              <label className="form-label">
                Verification Code
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <KeyRound
                  size={16}
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    top: 13,
                    color:
                      'var(--text-muted)',
                  }}
                />

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(
                          /\D/g,
                          ''
                        )
                    )
                  }
                  placeholder="123456"
                  className="input"
                  style={{
                    paddingLeft: 38,
                    letterSpacing: 6,
                    textAlign: 'center',
                    fontSize: 18,
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading
                ? 'Verifying...'
                : (
                  <>
                    Verify & Continue
                    <CheckCircle2
                      size={15}
                    />
                  </>
                )}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color:
                  'var(--primary)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setOtp('');
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color:
                  'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}