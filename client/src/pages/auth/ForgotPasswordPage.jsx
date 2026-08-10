import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp+newpass
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setUserId(data.userId || '');
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { userId, otp, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%), var(--bg-dark)' }}>

      <div className="glass-card p-10 w-full max-w-md mx-4 relative z-10 page-enter">
        <Link to="/login" className="flex items-center gap-2 mb-6"
          style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--warning), #d97706)' }}>
            <KeyRound size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 1 ? "We'll send a reset code to your email" : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Email Address</label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input id="forgot-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="input-field" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>OTP Code</label>
              <input id="reset-otp" type="text" required value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="input-field mt-1.5" maxLength={6} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>New Password</label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input id="new-password" type="password" required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="input-field" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
