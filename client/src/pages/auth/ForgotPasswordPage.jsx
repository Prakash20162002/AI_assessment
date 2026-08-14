import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, KeyRound, Eye, EyeOff, RotateCcw } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '';
  const initialEmail = searchParams.get('email') || location.state?.email || '';
  const initialOtp = searchParams.get('otp') || searchParams.get('code') || searchParams.get('token') || '';

  const [step, setStep] = useState(initialOtp && initialEmail ? 2 : 1); // 1: email, 2: otp + newpass + confirmpass
  const [email, setEmail] = useState(initialEmail);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(initialOtp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmPassFocused, setConfirmPassFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (initialEmail && initialOtp) {
      setStep(2);
    }
  }, [initialEmail, initialOtp]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setEmailError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: cleanEmail });
      setUserId(data.userId || '');
      if (data?.devOtp) {
        toast.success(`OTP sent to email! (Reset Code: ${data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('Reset verification code sent to your email');
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setResending(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: cleanEmail });
      setUserId(data.userId || '');
      if (data?.devOtp) {
        toast.success(`New OTP sent to email! (Reset Code: ${data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('A new verification code has been sent to your email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      toast.error('Passwords do not match. Please confirm your new password.');
      return;
    }

    setLoading(true);
    setPassError('');
    try {
      await api.post('/auth/reset-password', {
        userId,
        email: cleanEmail,
        otp: cleanOtp,
        newPassword,
      });

      toast.success('Password updated successfully! Please sign in.');

      const targetLogin = redirectParam === '/admin' || redirectParam.startsWith('/admin')
        ? '/admin'
        : redirectParam
          ? `/login?redirect=${encodeURIComponent(redirectParam)}`
          : '/login';

      navigate(targetLogin, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please check the code.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const backLoginUrl = redirectParam === '/admin' || redirectParam.startsWith('/admin')
    ? '/admin'
    : redirectParam
      ? `/login?redirect=${encodeURIComponent(redirectParam)}`
      : '/login';

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
          to={backLoginUrl}
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
            {step === 1
              ? "Enter your registered email and we'll send a verification reset code."
              : 'Enter your 6-digit verification code and new password.'}
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
                Registered Email Address
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
                  onBlur={() => {
                    setEmailFocused(false);
                    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setEmailError('Please enter a valid email address.');
                    }
                  }}
                  placeholder="user@example.com"
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
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px', marginInline: '4px' }}>
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
                'Send Verification Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Registered email banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                Resetting for: <strong style={{ color: '#fff' }}>{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 6px',
                }}
              >
                Change
              </button>
            </div>

            {/* OTP code */}
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

            {/* New Password */}
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
                  border: `1px solid ${passError ? 'rgba(239, 68, 68, 0.85)' : passFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
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
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passError) setPassError('');
                  }}
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
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirm-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.75)',
                  marginBottom: '8px',
                }}
              >
                Confirm New Password
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: `1px solid ${passError ? 'rgba(239, 68, 68, 0.85)' : confirmPassFocused ? 'rgba(255, 120, 40, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                  borderRadius: '12px',
                  boxShadow: confirmPassFocused ? '0 0 0 3px rgba(230, 57, 70, 0.15)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '52px',
                }}
              >
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: confirmPassFocused ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'color 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="confirm-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passError) setPassError('');
                  }}
                  onFocus={() => setConfirmPassFocused(true)}
                  onBlur={() => setConfirmPassFocused(false)}
                  placeholder="Re-enter your new password"
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
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passError && (
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px', marginInline: '4px' }}>
                  {passError}
                </p>
              )}
            </div>

            {/* Update Password Submit Button */}
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
                'Update Password'
              )}
            </button>

            {/* Resend OTP button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <button
                type="button"
                disabled={resending}
                onClick={handleResendOTP}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '13px',
                  cursor: resending ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
              >
                <RotateCcw size={14} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending new code...' : 'Didn\'t receive code? Resend'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
