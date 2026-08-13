import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states
  const [focusedField, setFocusedField] = useState('');
  const [errors, setErrors] = useState({});

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (data?.devOtp) {
        toast.success(`Account created! (Verification Code: ${data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('Account created! Please verify your email.');
      }

      navigate('/verify-otp', {
        state: {
          userId: data.userId,
          email: form.email.trim().toLowerCase(),
          redirect: redirectParam,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-10"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(230,57,70,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(247,127,0,0.08) 0%, transparent 50%), var(--bg-dark)',
        padding: '24px 16px',
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
          maxWidth: '440px',
          padding: '40px 32px',
          background: 'rgba(15, 15, 20, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center mb-3"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(230,57,70,0.12)',
              border: '1px solid rgba(230,57,70,0.3)',
              boxShadow: '0 8px 24px -4px rgba(230,57,70,0.25)',
              overflow: 'hidden',
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
              margin: '4px 0 6px 0',
            }}
          >
            Create Account
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', margin: 0 }}>
            Register as a student to access exams
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
              }}
            >
              Full Name
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${errors.name ? 'rgba(239, 68, 68, 0.85)' : focusedField === 'name' ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px',
              }}
            >
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedField === 'name' ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 16px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            {errors.name && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px', marginInline: '4px' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address Field */}
          <div>
            <label
              htmlFor="reg-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
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
                border: `1px solid ${errors.email ? 'rgba(239, 68, 68, 0.85)' : focusedField === 'email' ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px',
              }}
            >
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedField === 'email' ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 16px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            {errors.email && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px', marginInline: '4px' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="reg-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${errors.password ? 'rgba(239, 68, 68, 0.85)' : focusedField === 'password' ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px',
              }}
            >
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedField === 'password' ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder="Min. 6 characters"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 48px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
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
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px', marginInline: '4px' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: '8px',
              }}
            >
              Confirm Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${errors.confirmPassword ? 'rgba(239, 68, 68, 0.85)' : focusedField === 'confirmPassword' ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                borderRadius: '12px',
                boxShadow: focusedField === 'confirmPassword' ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '52px',
              }}
            >
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedField === 'confirmPassword' ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showConfirmPass ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                placeholder="Repeat password"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 48px 0 46px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass((p) => !p)}
                aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
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
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px', marginInline: '4px' }}>
                {errors.confirmPassword}
              </p>
            )}
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
              opacity: loading ? 0.8 : 1,
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
              <span
                className="spinner"
                style={{
                  width: 22,
                  height: 22,
                  borderWidth: 2,
                  borderColor: '#fff',
                  borderTopColor: 'transparent',
                }}
              />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', margin: '24px 0 0 0' }}>
          Already have an account?{' '}
          <Link
            to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
