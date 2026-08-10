import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, Upload, Download, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';

const defaultExam = {
  title: '', description: '', duration: 60, totalMarks: 100,
  passingMarks: 40, maxWarnings: 3, allowResume: true, shuffleQuestions: false,
  showResultImmediately: true, startTime: '', endTime: '',
};

const defaultQuestion = { questionText: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', marks: 1, explanation: '' };

const CreateEditExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [exam, setExam] = useState(defaultExam);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [examId, setExamId] = useState(id || null);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQ, setNewQ] = useState(defaultQuestion);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/exams/${id}`).then(({ data }) => setExam({
        ...data.data,
        startTime: data.data.startTime ? new Date(data.data.startTime).toISOString().slice(0, 16) : '',
        endTime: data.data.endTime ? new Date(data.data.endTime).toISOString().slice(0, 16) : '',
      }));
      api.get(`/admin/exams/${id}/questions`).then(({ data }) => setQuestions(data.data));
    }
  }, [id, isEdit]);

  const handleExamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExam((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveExam = async () => {
    if (!exam.title.trim()) { toast.error('Exam title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...exam, startTime: exam.startTime || null, endTime: exam.endTime || null };
      if (examId) {
        await api.put(`/admin/exams/${examId}`, payload);
        toast.success('Exam updated');
      } else {
        const { data } = await api.post('/admin/exams', payload);
        setExamId(data.data._id);
        toast.success('Exam created! Now add questions.');
        setTab('questions');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!newQ.questionText.trim() || !newQ.options.A || !newQ.options.B || !newQ.options.C || !newQ.options.D) {
      toast.error('Please fill all question fields');
      return;
    }
    try {
      const { data } = await api.post(`/admin/exams/${examId}/questions`, newQ);
      setQuestions((p) => [...p, data.data]);
      setNewQ(defaultQuestion);
      setAddingQuestion(false);
      toast.success('Question added');
    } catch (err) {
      toast.error('Failed to add question');
    }
  };

  const deleteQuestion = async (qId) => {
    try {
      await api.delete(`/admin/questions/${qId}`);
      setQuestions((p) => p.filter((q) => q._id !== qId));
      toast.success('Question deleted');
    } catch (_) {
      toast.error('Failed to delete question');
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!examId) { toast.error('Please save the exam first'); return; }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post(`/admin/exams/${examId}/questions/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      const { data: qData } = await api.get(`/admin/exams/${examId}/questions`);
      setQuestions(qData.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    window.open('/api/admin/reports/question-template', '_blank');
  };

  const inputStyle = { marginTop: '6px' };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, display: 'block' };

  return (
    <div className="page-enter max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/exams')} className="btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          {exam.title && <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 2 }}>{exam.title}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass-card p-1" style={{ display: 'inline-flex' }}>
        {['details', 'questions'].map((tab) => (
          <button key={tab} onClick={() => { if (tab === 'questions' && !examId) { toast.error('Save exam details first'); return; } setTab(tab); }}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              background: activeTab === tab ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>
            {tab === 'details' ? 'Exam Details' : `Questions (${questions.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="glass-card p-8 space-y-5">
          <div>
            <label style={labelStyle}>Exam Title *</label>
            <input name="title" value={exam.title} onChange={handleExamChange}
              placeholder="e.g. JavaScript Fundamentals" className="input-field" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={exam.description} onChange={handleExamChange}
              placeholder="Brief description of the exam..." rows={3}
              className="input-field" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Duration (minutes) *</label>
              <input name="duration" type="number" min={1} value={exam.duration} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Total Marks *</label>
              <input name="totalMarks" type="number" min={1} value={exam.totalMarks} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Passing Marks *</label>
              <input name="passingMarks" type="number" min={0} value={exam.passingMarks} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max Warnings (before void)</label>
              <input name="maxWarnings" type="number" min={1} max={10} value={exam.maxWarnings} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Time (optional)</label>
              <input name="startTime" type="datetime-local" value={exam.startTime} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Time (optional)</label>
              <input name="endTime" type="datetime-local" value={exam.endTime} onChange={handleExamChange} className="input-field" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-6">
            {[
              { name: 'allowResume', label: 'Allow Resume' },
              { name: 'shuffleQuestions', label: 'Shuffle Questions' },
              { name: 'showResultImmediately', label: 'Show Result Immediately' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                <input type="checkbox" name={name} checked={exam[name]} onChange={handleExamChange}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={saveExam} disabled={saving} className="btn-primary">
              {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Save size={18} />}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save & Add Questions')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex gap-3 justify-between items-center">
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="btn-secondary">
                <Download size={16} /> Template
              </button>
              <label className="btn-secondary cursor-pointer">
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Excel'}
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={uploading} />
              </label>
              <button onClick={() => setAddingQuestion(true)} className="btn-primary">
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>

          {/* Add question form */}
          {addingQuestion && (
            <div className="glass-card p-6 space-y-4" style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>New Question</h3>
              <div>
                <label style={labelStyle}>Question Text *</label>
                <textarea value={newQ.questionText} onChange={(e) => setNewQ((p) => ({ ...p, questionText: e.target.value }))}
                  placeholder="Enter your question..." rows={3} className="input-field" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <label style={labelStyle}>Option {opt} *</label>
                    <input value={newQ.options[opt]} onChange={(e) => setNewQ((p) => ({ ...p, options: { ...p.options, [opt]: e.target.value } }))}
                      placeholder={`Option ${opt}`} className="input-field" style={inputStyle} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Correct Answer *</label>
                  <select value={newQ.correctAnswer} onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="input-field" style={inputStyle}>
                    {['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>Option {o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Marks</label>
                  <input type="number" min={1} value={newQ.marks} onChange={(e) => setNewQ((p) => ({ ...p, marks: parseInt(e.target.value) }))}
                    className="input-field" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Explanation (optional)</label>
                <textarea value={newQ.explanation} onChange={(e) => setNewQ((p) => ({ ...p, explanation: e.target.value }))}
                  placeholder="Why is this the correct answer?" rows={2} className="input-field" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setAddingQuestion(false)} className="btn-secondary">Cancel</button>
                <button onClick={saveQuestion} className="btn-primary"><CheckCircle2 size={16} /> Save Question</button>
              </div>
            </div>
          )}

          {/* Questions list */}
          {questions.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center" style={{ color: 'var(--text-secondary)' }}>
              <Plus size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No questions yet. Add manually or upload an Excel file.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q._id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">Q{i + 1}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 10 }}>{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(q.options).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2 rounded-lg p-2"
                            style={{ background: key === q.correctAnswer ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${key === q.correctAnswer ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
                            <span className="font-bold text-sm" style={{ color: key === q.correctAnswer ? '#10b981' : 'var(--primary-light)', minWidth: 20 }}>{key}.</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{val}</span>
                            {key === q.correctAnswer && <CheckCircle2 size={14} style={{ color: '#10b981', marginLeft: 'auto', flexShrink: 0 }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteQuestion(q._id)} className="btn-danger flex-shrink-0" style={{ padding: '8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex justify-end pt-2">
              <button onClick={() => navigate('/admin/exams')} className="btn-primary">
                Finish & Return to Exams →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateEditExamPage;
