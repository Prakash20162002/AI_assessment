import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const CheatingLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.get('/admin/exams').then(({ data }) => setExams(data.data)).catch(() => {});
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    let url = `/admin/cheat-logs?page=${page}&limit=50`;
    if (selectedExam) url += `&examId=${selectedExam}`;

    api.get(url)
      .then(({ data }) => {
        setLogs(data.data);
        setTotalPages(Math.ceil(data.total / 50));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedExam]);

  const getEventBadgeClass = (type) => {
    switch (type) {
      case 'tab-switch': return 'badge-warning';
      case 'fullscreen-exit': return 'badge-warning';
      case 'refresh': return 'badge-danger';
      case 'browser-close': return 'badge-danger';
      case 'camera-off': return 'badge-danger';
      case 'internet-lost': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Anti-Cheat Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            System-recorded suspicious activity and violations
          </p>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex gap-4">
          <select
            value={selectedExam}
            onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
            className="input-field max-w-xs"
          >
            <option value="">All Exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card p-6">
        {loading ? (
           <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-12" style={{ color: 'var(--text-secondary)' }}>
             <ShieldAlert size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
             <p>No cheating events recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Event Type</th>
                  <th>Warning #</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      <Clock size={12} className="inline mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div>
                        <p style={{ fontWeight: 500 }}>{log.studentId?.name || 'N/A'}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.studentId?.email}</p>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{log.examId?.title || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getEventBadgeClass(log.eventType)}`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td>
                      {log.warningNumberAtEvent ? (
                        <span className="flex items-center gap-1" style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
                          <AlertTriangle size={14} /> {log.warningNumberAtEvent}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '300px' }} className="truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheatingLogsPage;
