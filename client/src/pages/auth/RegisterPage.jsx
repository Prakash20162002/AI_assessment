import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import api from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || location.state?.redirect || '';

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
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
        toast.success(`Account created! (Verification Code: ${data.devOtp})`, { duration: 12000 });
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10"
      style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.12) 0%, transparent 60%), var(--bg-dark)' }}>

      <div className="absolute top-10 right-20 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: 'var(--secondary)' }} />

      <div className="glass-card p-10 w-full max-w-md mx-4 relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Register as a student
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Full Name</label>
            <div className="relative mt-1.5">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input id="name" name="name" type="text" required value={form.name}
                onChange={handleChange} placeholder="John Doe"
                className="input-field" style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Email Address</label>
            <div className="relative mt-1.5">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input id="reg-email" name="email" type="email" required value={form.email}
                onChange={handleChange} placeholder="you@example.com"
                className="input-field" style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Password</label>
            <div className="relative mt-1.5">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                required value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
                className="input-field" style={{ paddingLeft: '40px', paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Confirm Password</label>
            <div className="relative mt-1.5">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input id="confirmPassword" name="confirmPassword" type={showPass ? 'text' : 'password'}
                required value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password"
                className="input-field" style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link
            to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            style={{ color: 'var(--primary-light)', fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
