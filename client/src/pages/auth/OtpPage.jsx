import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OtpPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  const userId = state?.userId;
  const email = state?.email;

  // Search parameters for redirect after verification
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = state?.redirect || searchParams.get('redirect') || '';

  // Helper to mask email address (e.g. prakashhalwai59@gmail.com -> p*****9@gmail.com)
  const getMaskedEmail = (rawEmail) => {
    if (!rawEmail || !rawEmail.includes('@')) return 'your email address';
    const [name, domain] = rawEmail.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
  };

  const maskedEmail = getMaskedEmail(email);

  // Redirect if no verification session is active
  useEffect(() => {
    if (!userId && !email) {
      navigate('/register', { replace: true });
    }
  }, [userId, email, navigate]);

  // Auto-focus first input box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle single digit input
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const char = cleaned.slice(-1); // Take latest typed digit
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    // Advance focus to next box
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // Handle KeyDown navigation (Backspace, Left/Right Arrows)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move back to previous box and clear
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
      if (errorMessage) setErrorMessage('');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // Handle Paste of complete 6-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();
    setFocusedIndex(nextFocus);

    if (pasted.length === 6) {
      // Auto-trigger verification if 6 full digits were pasted
      triggerVerification(newOtp.join(''));
    }
  };

  const triggerVerification = useCallback(
    async (otpString) => {
      if (otpString.length !== 6 || loading) return;
      setLoading(true);
      setErrorMessage('');

      try {
        const { data } = await api.post('/auth/verify-otp', {
          userId,
          email,
          otp: otpString,
        });

        setIsSuccess(true);
        login(data.user, data.accessToken);
        toast.success('Email verified successfully! Welcome to DevPhoeniX 🎉');

        setTimeout(() => {
          if (redirectParam && redirectParam.startsWith('/')) {
            navigate(redirectParam, { replace: true });
          } else {
            navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
          }
        }, 600);
      } catch (err) {
        const msg = err.response?.data?.message || '';
        if (msg.toLowerCase().includes('expired')) {
          setErrorMessage('This verification code has expired. Please request a new code.');
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
          setErrorMessage('Incorrect verification code. Please try again.');
        } else {
          setErrorMessage(msg || 'Verification failed. Please check the code and try again.');
        }
        toast.error(errorMessage || 'Verification failed');
      } finally {
        setLoading(false);
      }
    },
    [userId, email, loading, login, navigate, redirectParam, errorMessage]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    triggerVerification(otpString);
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setErrorMessage('');

    try {
      const { data } = await api.post('/auth/resend-otp', { userId, email });
      if (data?.devOtp) {
        toast.success(`New OTP sent to email! (Code: ${data.devOtp})`, { duration: 8000 });
      } else {
        toast.success(data?.message || 'A fresh verification code has been sent to your email.');
      }
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again shortly.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 40%, rgba(230,57,70,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(247,127,0,0.08) 0%, transparent 50%), var(--bg-dark)',
        padding: '24px 16px',
      }}
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-16 left-16 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--primary)' }}
      />
      <div
        className="absolute bottom-16 right-16 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--secondary)' }}
      />

      <div
        className="glass-card page-enter"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px 32px',
          background: 'rgba(15, 15, 20, 0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75)',
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
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: '4px 0 6px 0',
            }}
          >
            Verify Email
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.70)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
            Enter the 6-digit code sent to your email address.
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '6px',
              padding: '4px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--primary-light)',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.3px',
              wordBreak: 'break-all',
            }}
          >
            {maskedEmail}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* OTP Input Section */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.60)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '14px',
              }}
            >
              Enter verification code
            </label>

            {/* 6-Digit Individual OTP Input Boxes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = digit !== '';
                const hasError = !!errorMessage;

                let borderColor = 'rgba(255, 255, 255, 0.12)';
                let boxShadow = 'none';
                let bg = 'rgba(255, 255, 255, 0.035)';

                if (isSuccess) {
                  borderColor = 'rgba(16, 185, 129, 0.85)';
                  boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                  bg = 'rgba(16, 185, 129, 0.08)';
                } else if (hasError) {
                  borderColor = 'rgba(239, 68, 68, 0.85)';
                  boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
                  bg = 'rgba(239, 68, 68, 0.05)';
                } else if (isFocused) {
                  borderColor = 'rgba(255, 100, 50, 0.95)';
                  boxShadow = '0 0 0 3px rgba(230, 57, 70, 0.20), 0 0 14px rgba(255, 100, 50, 0.25)';
                  bg = 'rgba(255, 255, 255, 0.06)';
                } else if (isFilled) {
                  borderColor = 'rgba(255, 255, 255, 0.25)';
                  bg = 'rgba(255, 255, 255, 0.05)';
                }

                return (
                  <input
                    key={index}
                    id={`otp-box-${index}`}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => {
                      setFocusedIndex(index);
                      // Select content for quick overwrite
                      inputRefs.current[index]?.select();
                    }}
                    onBlur={() => setFocusedIndex(-1)}
                    style={{
                      width: 'min(54px, calc((100% - 40px) / 6))',
                      height: 'min(62px, calc((100% - 40px) / 6 * 1.18))',
                      minWidth: '38px',
                      minHeight: '48px',
                      background: bg,
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: '12px',
                      boxShadow: boxShadow,
                      color: '#ffffff',
                      fontSize: '22px',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      padding: 0,
                      fontFamily: 'inherit',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      caretColor: 'var(--primary-light)',
                    }}
                  />
                );
              })}
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                  fontSize: '12.5px',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Submit Verification Button */}
          <button
            type="submit"
            disabled={!isOtpComplete || loading}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '12px',
              background: isOtpComplete
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'rgba(255, 255, 255, 0.08)',
              color: isOtpComplete ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isOtpComplete && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isOtpComplete ? '0 8px 20px -4px rgba(230, 57, 70, 0.4)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (isOtpComplete && !loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(230, 57, 70, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = isOtpComplete ? '0 8px 20px -4px rgba(230, 57, 70, 0.4)' : 'none';
            }}
          >
            {loading ? (
              <>
                <span
                  className="spinner"
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderColor: '#fff',
                    borderTopColor: 'transparent',
                  }}
                />
                <span>Verifying...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={18} style={{ color: '#ffffff' }} />
                <span>Verified!</span>
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.60)', fontSize: '13px', margin: '0 0 8px 0' }}>
            Didn't receive the code?
          </p>

          {countdown > 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.80)', fontSize: '13px', fontWeight: 500, margin: 0 }}>
              Resend code in{' '}
              <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-light)',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
            >
              <RefreshCw size={14} className={resendLoading ? 'spin' : ''} />
              {resendLoading ? 'Sending new code...' : 'Resend code'}
            </button>
          )}
        </div>

        {/* Back Navigation Link */}
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <Link
            to="/login"
            style={{
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '12.5px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
          >
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
