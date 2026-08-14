import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Trophy, Target, Clock, BookOpen, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchResult = async () => {
      try {
        let endpoint = `/student/results/${id}`;
        if (isAdmin) {
          endpoint = `/admin/results/${id}`;
        }
        const { data } = await api.get(endpoint);
        setResult(data.data);
      } catch (err) {
        if (isAdmin) {
          try {
            const res2 = await api.get(`/student/results/${id}`);
            setResult(res2.data.data);
          } catch (_) {}
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, isAdmin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading assessment results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <p>Result not found.</p>
        <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} className="btn-primary mt-4">
          {isAdmin ? "Back to Admin Dashboard" : "Go to Dashboard"}
        </Link>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const percentage = result.percentage ?? (result.totalMarks > 0 ? (result.score / result.totalMarks) * 100 : 0);
  const isPassed = result.isPassed ?? (percentage >= 40);

  return (
    <div className="page-enter max-w-4xl mx-auto">
      <div className="mb-8">
        {isAdmin ? (
          <Link to="/admin/dashboard" className="flex items-center gap-2 mb-6" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </Link>
        ) : (
          <Link to="/student/dashboard" className="flex items-center gap-2 mb-6" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        )}
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Exam Result</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
          {result.examId?.title || 'Assessment'}
        </p>
      </div>

      {/* Hero Score Card */}
      <div className="glass-card p-8 mb-8 relative overflow-hidden" style={{ textAlign: 'center' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${isPassed ? 'var(--success)' : 'var(--danger)'}, transparent)` }} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ background: isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isPassed ? '#10b981' : '#ef4444' }}>
            {isPassed ? <Trophy size={48} /> : <XCircle size={48} />}
          </div>
          <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {percentage.toFixed(1)}%
          </h2>
          <p className="text-xl mb-4" style={{ color: isPassed ? '#10b981' : '#ef4444', fontWeight: 500 }}>
            {isPassed ? 'Passed' : 'Failed'}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            You scored {result.score} out of {result.totalMarks || result.examId?.totalMarks || 100} marks.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <Target size={24} className="mx-auto mb-2" style={{ color: 'var(--primary-light)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Questions</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.totalQuestions || result.answerBreakdown?.length || 0}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: '#10b981' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Correct</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.correct ?? 0}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <XCircle size={24} className="mx-auto mb-2" style={{ color: '#ef4444' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Wrong</p>
          <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{result.wrong ?? 0}</p>
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
            const q = item.questionId || {};
            const qText = item.questionText || q.questionText || `Question ${index + 1}`;
            const options = item.options || q.options || {};
            const isCor = item.isCorrect ?? (item.selectedOption && item.selectedOption === item.correctAnswer);
            const qMarks = item.maxMarks || item.marks || q.marks || 1;
            const explanation = item.explanation || q.explanation;
            
            return (
              <div key={index} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    {item.selectedOption === null ? (
                      <MinusCircle style={{ color: '#94a3b8' }} />
                    ) : isCor ? (
                      <CheckCircle2 style={{ color: '#10b981' }} />
                    ) : (
                      <XCircle style={{ color: '#ef4444' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary">Q{index + 1}</span>
                        <span
                          style={{
                            background: isCor ? 'rgba(16,185,129,0.12)' : item.selectedOption === null ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.12)',
                            color: isCor ? '#10b981' : item.selectedOption === null ? '#94a3b8' : '#ef4444',
                            border: `1px solid ${isCor ? 'rgba(16,185,129,0.3)' : item.selectedOption === null ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {isCor ? '✓ Correct' : item.selectedOption === null ? '— Not Answered' : '✕ Incorrect'}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: isCor ? '#10b981' : '#ef4444',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        Marks: {isCor ? qMarks : 0} / {qMarks}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14.5px', lineHeight: 1.5 }}>{qText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optText = options[opt];
                    if (optText === undefined || optText === null) return null;

                    const isSelected = item.selectedOption === opt;
                    const isCorrect = (item.correctAnswer || q.correctAnswer) === opt;
                    
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
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{optText}</span>
                        {icon && <div className="ml-auto flex-shrink-0">{icon}</div>}
                      </div>
                    );
                  })}
                </div>

                {explanation && (
                  <div className="mt-3 pl-10">
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(252,191,73,0.06)', border: '1px solid rgba(252,191,73,0.2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Sparkles size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                        <strong style={{ color: 'var(--warning)' }}>Explanation:</strong> {explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
