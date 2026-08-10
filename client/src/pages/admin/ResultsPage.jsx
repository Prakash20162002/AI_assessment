import { useState, useEffect } from 'react';
import { Download, Search, AlertCircle, FileText } from 'lucide-react';
import api from '../../services/api';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch exams for filter dropdown
  useEffect(() => {
    api.get('/admin/exams').then(({ data }) => setExams(data.data)).catch(() => {});
  }, []);

  const fetchResults = () => {
    setLoading(true);
    let url = `/admin/results?page=${page}&limit=20`;
    if (selectedExam) url += `&examId=${selectedExam}`;
    if (search) url += `&search=${search}`;

    api.get(url)
      .then(({ data }) => {
        setResults(data.data);
        setTotalPages(data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, [page, selectedExam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleDownloadExcel = () => {
    let url = '/api/admin/reports/excel';
    if (selectedExam) url += `?examId=${selectedExam}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = (resultId) => {
    window.open(`/api/admin/reports/pdf/${resultId}`, '_blank');
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Exam Results</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            View and download student performance reports
          </p>
        </div>
        <button onClick={handleDownloadExcel} className="btn-secondary">
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="flex-1">
            <select
              value={selectedExam}
              onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
              className="input-field"
            >
              <option value="">All Exams</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <div className="flex-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by student name or email (Press Enter)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </form>
      </div>

      <div className="glass-card p-6">
        {loading ? (
           <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-12" style={{ color: 'var(--text-secondary)' }}>
             <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
             <p>No results found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 500 }}>{r.studentId?.name || 'N/A'}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.studentId?.email}</p>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.examId?.title || 'N/A'}</td>
                    <td>{r.score} / {r.totalMarks}</td>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{r.percentage?.toFixed(1)}%</span></td>
                    <td>
                      <span className={`badge ${r.isPassed ? 'badge-success' : 'badge-danger'}`}>
                        {r.isPassed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                       {new Date(r.calculatedAt).toLocaleString()}
                    </td>
                    <td>
                      <button onClick={() => handleDownloadPDF(r._id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <FileText size={14} /> PDF
                      </button>
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

export default ResultsPage;
