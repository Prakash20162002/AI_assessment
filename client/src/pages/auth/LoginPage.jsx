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

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '';

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (redirectParam && redirectParam.startsWith('/')) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 50%), var(--bg-dark)' }}>

      {/* Background orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--primary)' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'var(--secondary)' }} />

      <div className="glass-card p-10 w-full max-w-md mx-4 relative z-10 page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">ExamPlatform</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Email Address</label>
            <div className="relative mt-1.5">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Password</label>
              <Link
                to={redirectParam ? `/forgot-password?redirect=${encodeURIComponent(redirectParam)}` : '/forgot-password'}
                style={{ color: 'var(--primary-light)', fontSize: '12px' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '40px', paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link
            to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            style={{ color: 'var(--primary-light)', fontWeight: 600 }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
