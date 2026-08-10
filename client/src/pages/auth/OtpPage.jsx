import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShieldCheck, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OtpPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  const userId = state?.userId;
  const email = state?.email;

  useEffect(() => {
    if (!userId) navigate('/register');
  }, [userId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('');
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId, otp: otpString });
      login(data.user, data.accessToken);
      toast.success('Email verified! Welcome aboard 🎉');
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { userId });
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(Array(6).fill(''));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(139,92,246,0.15) 0%, transparent 60%), var(--bg-dark)' }}>

      <div className="glass-card p-10 w-full max-w-md mx-4 relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Verify Email</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Enter the 6-digit code sent to<br />
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="input-field text-center text-xl font-bold"
                style={{ width: '52px', height: '56px', padding: '0', borderColor: digit ? 'var(--primary)' : undefined }}
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Verify OTP'}
          </button>
        </form>

        <div className="text-center mt-6">
          {countdown > 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Resend code in <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{countdown}s</span>
            </p>
          ) : (
            <button onClick={handleResend} disabled={resendLoading}
              style={{ color: 'var(--primary-light)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
