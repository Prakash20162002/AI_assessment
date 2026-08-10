import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, PlayCircle, Trophy, TrendingUp, Plus, Eye, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color, gradient }) => (
  <div className="stat-card" style={{ '--card-color': color }}>
    <div className="flex items-start justify-between">
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</p>
        <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
      </div>
      <div className="flex items-center justify-center w-12 h-12 rounded-xl"
        style={{ background: gradient }}>
        <Icon size={22} color="white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats?.totalStudents, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { icon: BookOpen, label: 'Total Exams', value: stats?.totalExams, gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
    { icon: PlayCircle, label: 'Live Sessions', value: stats?.activeSessionsCount, gradient: 'linear-gradient(135deg,#10b981,#059669)' },
    { icon: Trophy, label: 'Results Generated', value: stats?.resultsCount, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, <span className="gradient-text">{user?.name}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            Here's what's happening on your platform today
          </p>
        </div>
        <Link to="/admin/exams/create" className="btn-primary">
          <Plus size={18} /> Create Exam
        </Link>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Recent Results */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                <TrendingUp size={18} className="inline mr-2" style={{ color: 'var(--primary-light)' }} />
                Recent Results
              </h2>
              <Link to="/admin/results" style={{ color: 'var(--primary-light)', fontSize: '13px', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>

            {stats?.recentResults?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentResults.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div>
                            <p style={{ fontWeight: 500 }}>{r.studentId?.name || 'N/A'}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.studentId?.email}</p>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.examId?.title || 'N/A'}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>
                            {r.percentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${r.isPassed ? 'badge-success' : 'badge-danger'}`}>
                            {r.isPassed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td>
                          <Link to={`/admin/results`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <Eye size={14} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12" style={{ color: 'var(--text-secondary)' }}>
                <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
                <p>No results yet. Publish an exam to get started.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
