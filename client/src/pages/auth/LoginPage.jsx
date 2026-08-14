import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const handleBlurEmail = () => {
    setEmailFocused(false);
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (data.user?.role !== 'admin') {
        localStorage.removeItem('dp_admin');
        localStorage.removeItem('dp_admin_name');
        sessionStorage.removeItem('dp_admin');
        sessionStorage.removeItem('dp_admin_name');
      }

      if (redirectParam && redirectParam.startsWith('/') && !(data.user?.role !== 'admin' && redirectParam.startsWith('/admin'))) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.requiresVerification) {
        toast.error('Please verify your email first');
        navigate('/verify-otp', {
          state: {
            userId: err.response.data.userId,
            email: err.response.data.email || form.email,
            redirect: redirectParam,
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(230,57,70,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(247,127,0,0.08) 0%, transparent 50%), var(--bg-dark)',
        padding: '24px 16px'
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--primary)' }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--secondary)' }}
      />

      <div
        className="glass-card page-enter"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 32px',
          background: 'rgba(15, 15, 20, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center mb-3"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(230,57,70,0.12)',
              border: '1px solid rgba(230,57,70,0.3)',
              boxShadow: '0 8px 24px -4px rgba(230,57,70,0.25)',
              overflow: 'hidden'
            }}
          >
            <img
              src="/mascot.jpeg"
              alt="DevPhoeniX"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: '4px 0 6px 0'
            }}
          >
            DevPhoeniX
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', margin: 0 }}>
            Sign in to access your assessment session
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Input Field */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px'
              }}
            >
              Email Address
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${emailError ? 'rgba(239, 68, 68, 0.8)' : emailFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: emailFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px'
              }}
            >
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: emailFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={handleBlurEmail}
                placeholder="student@example.com"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 16px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            {emailError && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px', marginInline: '4px' }}>
                {emailError}
              </p>
            )}
          </div>

          {/* Password Input Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)'
                }}
              >
                Password
              </label>
              <Link
                to={redirectParam ? `/forgot-password?redirect=${encodeURIComponent(redirectParam)}` : '/forgot-password'}
                style={{
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontSize: '12px',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
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
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${passwordFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: passwordFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px'
              }}
            >
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: passwordFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 48px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '6px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 8px 20px -4px rgba(230, 57, 70, 0.4)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: loading ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(230, 57, 70, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(230, 57, 70, 0.4)';
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', margin: '24px 0 0 0' }}>
          Don't have a student account?{' '}
          <Link
            to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
