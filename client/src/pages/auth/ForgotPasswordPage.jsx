import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp+newpass
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setUserId(data.userId || '');
      if (data?.devOtp) {
        toast.success(`OTP sent to email! (Reset Code: ${data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('Reset verification code sent to your email');
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { userId, email, otp, newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
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
        {/* Top back navigation */}
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(255, 255, 255, 0.60)',
            fontSize: '13px',
            textDecoration: 'none',
            marginBottom: '20px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.60)')}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

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
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', margin: 0 }}>
            {step === 1 ? "We'll send a 6-digit verification code to your email" : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                htmlFor="forgot-email"
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
                  border: `1px solid ${emailError ? 'rgba(239, 68, 68, 0.85)' : emailFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                  borderRadius: '12px',
                  boxShadow: emailFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '52px',
                }}
              >
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: emailFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'color 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
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
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              {emailError && (
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px', marginInline: '4px' }}>
                  {emailError}
                </p>
              )}
            </div>

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
            >
              {loading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                htmlFor="reset-otp"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  marginBottom: '8px',
                }}
              >
                6-Digit Verification Code
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: `1px solid ${otpFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                  borderRadius: '12px',
                  boxShadow: otpFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '52px',
                }}
              >
                <KeyRound
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: otpFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'color 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setOtpFocused(true)}
                  onBlur={() => setOtpFocused(false)}
                  placeholder="Enter 6-digit OTP"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '0 16px 0 46px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '2px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  marginBottom: '8px',
                }}
              >
                New Password
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: `1px solid ${passFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                  borderRadius: '12px',
                  boxShadow: passFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '52px',
                }}
              >
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: passFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'color 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
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
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

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
            >
              {loading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
