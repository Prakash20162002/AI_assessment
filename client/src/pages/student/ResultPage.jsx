import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Trophy, Target, Clock, BookOpen } from 'lucide-react';
import api from '../../services/api';

const ResultPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/student/results/${id}`)
      .then(({ data }) => setResult(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <p>Result not found.</p>
        <Link to="/student/dashboard" className="btn-primary mt-4">Go to Dashboard</Link>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="page-enter max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/student/dashboard" className="flex items-center gap-2 mb-6" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Exam Result</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
          {result.examId?.title}
        </p>
      </div>

      {/* Hero Score Card */}
      <div className="glass-card p-8 mb-8 relative overflow-hidden" style={{ textAlign: 'center' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${result.isPassed ? 'var(--success)' : 'var(--danger)'}, transparent)` }} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ background: result.isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: result.isPassed ? '#10b981' : '#ef4444' }}>
            {result.isPassed ? <Trophy size={48} /> : <XCircle size={48} />}
          </div>
          <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {result.percentage.toFixed(1)}%
          </h2>
          <p className="text-xl mb-4" style={{ color: result.isPassed ? '#10b981' : '#ef4444', fontWeight: 500 }}>
            {result.isPassed ? 'Passed' : 'Failed'}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            You scored {result.score} out of {result.examId?.totalMarks} marks. Passing marks: {result.examId?.passingMarks}.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <Target size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-light)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Questions</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.totalQuestions}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: '#10b981' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Correct</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.correct}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <XCircle size={24} className="mx-auto mb-2" style={{ color: '#ef4444' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Wrong</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.wrong}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Clock size={24} className="mx-auto mb-2" style={{ color: '#f59e0b' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Time Taken</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{formatTime(result.timeTaken)}</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BookOpen size={18} style={{ color: 'var(--primary-light)' }} /> Question Breakdown
        </h3>

        <div className="space-y-4">
          {result.answerBreakdown?.map((item, index) => {
            const q = item.questionId;
            if (!q) return null;
            
            return (
              <div key={index} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    {item.selectedOption === null ? (
                      <MinusCircle style={{ color: '#94a3b8' }} />
                    ) : item.isCorrect ? (
                      <CheckCircle2 style={{ color: '#10b981' }} />
                    ) : (
                      <XCircle style={{ color: '#ef4444' }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-primary">Q{index + 1}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.marks} mark{item.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{q.questionText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const isSelected = item.selectedOption === opt;
                    const isCorrect = item.correctAnswer === opt;
                    
                    let bg = 'rgba(26,26,46,0.8)';
                    let border = 'var(--border)';
                    let icon = null;

                    if (isCorrect) {
                      bg = 'rgba(16,185,129,0.1)';
                      border = 'rgba(16,185,129,0.3)';
                      icon = <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
                    } else if (isSelected && !isCorrect) {
                      bg = 'rgba(239,68,68,0.1)';
                      border = 'rgba(239,68,68,0.3)';
                      icon = <XCircle size={16} style={{ color: '#ef4444' }} />;
                    }

                    return (
                      <div key={opt} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: bg, border: `1px solid ${border}` }}>
                        <span className="font-bold text-sm" style={{ color: isCorrect ? '#10b981' : isSelected ? '#ef4444' : 'var(--text-secondary)', minWidth: 20 }}>
                          {opt}.
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{q.options[opt]}</span>
                        {icon && <div className="ml-auto flex-shrink-0">{icon}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
