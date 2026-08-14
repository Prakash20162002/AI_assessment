import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, AlertCircle, PlayCircle, Trophy, RefreshCcw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/exams')
      .then(({ data }) => setExams(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not-started': return <span className="badge badge-info">Available</span>;
      case 'ongoing': return <span className="badge badge-warning">In Progress</span>;
      case 'submitted': return <span className="badge badge-success">Completed</span>;
      case 'voided': return <span className="badge badge-danger">Voided</span>;
      case 'timeout': return <span className="badge badge-danger">Timeout</span>;
      default: return null;
    }
  };

  const handleActionClick = (exam) => {
    if (exam.sessionStatus === 'submitted' || exam.sessionStatus === 'timeout' || exam.sessionStatus === 'voided') {
      if (exam.resultId) {
        navigate(`/result/${exam.resultId}`);
      } else {
        navigate(`/exam/${exam._id}`);
      }
    } else {
      navigate(`/exam/${exam._id}/setup`);
    }
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome, <span className="gradient-text">{user?.name}</span> 🎓
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            Ready for your next assessment?
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Available Exams</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : exams.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center text-center" style={{ color: 'var(--text-secondary)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p className="text-lg font-medium mb-2">No exams available</p>
          <p style={{ fontSize: '14px' }}>There are currently no active exams assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div key={exam._id} className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                  {exam.title}
                </h3>
                {getStatusBadge(exam.sessionStatus)}
              </div>
              
              {exam.description && (
                <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {exam.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Clock size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.duration} min
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.questionCount} Qs
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <AlertCircle size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.totalMarks} marks
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={() => handleActionClick(exam)}
                  className={`w-full ${exam.sessionStatus === 'not-started' || exam.sessionStatus === 'ongoing' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {exam.sessionStatus === 'not-started' && <><PlayCircle size={16} /> Start Exam</>}
                  {exam.sessionStatus === 'ongoing' && <><RefreshCcw size={16} /> Resume Exam</>}
                  {(exam.sessionStatus === 'submitted' || exam.sessionStatus === 'timeout' || exam.sessionStatus === 'voided') && <><Trophy size={16} /> View Result</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
