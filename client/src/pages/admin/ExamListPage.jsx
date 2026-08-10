import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, Globe, EyeOff, BookOpen, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ExamListPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/admin/exams');
      setExams(data.data);
    } catch (_) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam and all its questions, sessions, and results?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/exams/${id}`);
      toast.success('Exam deleted');
      setExams((p) => p.filter((e) => e._id !== id));
    } catch (_) {
      toast.error('Failed to delete exam');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const { data } = await api.patch(`/admin/exams/${id}/publish`);
      toast.success(data.message);
      setExams((p) => p.map((e) => (e._id === id ? { ...e, isPublished: data.data.isPublished } : e)));
    } catch (_) {
      toast.error('Failed to update exam status');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="spinner" /></div>
  );

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Exam Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            {exams.length} exam{exams.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/exams/create" className="btn-primary">
          <Plus size={18} /> Create Exam
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center" style={{ color: 'var(--text-secondary)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p className="text-lg font-medium mb-2">No exams yet</p>
          <p className="mb-6" style={{ fontSize: '14px' }}>Create your first exam to get started</p>
          <Link to="/admin/exams/create" className="btn-primary"><Plus size={18} /> Create Exam</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div key={exam._id} className="glass-card p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {exam.description}
                    </p>
                  )}
                </div>
                <span className={`badge ml-3 flex-shrink-0 ${exam.isPublished ? 'badge-success' : 'badge-warning'}`}>
                  {exam.isPublished ? 'Live' : 'Draft'}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Clock size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.duration} min
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.questionCount} questions
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <AlertCircle size={14} style={{ color: 'var(--primary-light)' }} />
                  {exam.totalMarks} marks
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <Link to={`/admin/exams/${exam._id}/edit`} className="btn-secondary flex-1" style={{ padding: '8px' }}>
                  <Edit2 size={14} /> Edit
                </Link>
                <button
                  onClick={() => handleTogglePublish(exam._id, exam.isPublished)}
                  disabled={togglingId === exam._id}
                  className="btn-secondary flex-1" style={{ padding: '8px' }}>
                  {exam.isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
                  {exam.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(exam._id)}
                  disabled={deletingId === exam._id}
                  className="btn-danger" style={{ padding: '8px 12px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamListPage;
