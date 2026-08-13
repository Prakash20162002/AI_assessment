import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, Edit2, Upload, Download, CheckCircle2, Award, HelpCircle } from 'lucide-react';
import api from '../../services/api';

const defaultExam = {
  title: '',
  description: '',
  duration: 60,
  totalMarks: 10,
  passingMarks: 4,
  maxWarnings: 3,
  allowResume: true,
  shuffleQuestions: false,
  showResultImmediately: true,
  startTime: '',
  endTime: '',
};

const defaultQuestion = {
  questionText: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: 'A',
  marks: 1,
  explanation: '',
};

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
  const [editingQId, setEditingQId] = useState(null);
  const [newQ, setNewQ] = useState(defaultQuestion);
  const [editQ, setEditQ] = useState(defaultQuestion);
  const [uploading, setUploading] = useState(false);

  // Dynamic calculation of total marks from questions
  const totalQuestionsCount = questions.length;
  const calculatedTotalMarks = questions.reduce((sum, q) => {
    const val = Number(q.marks);
    return sum + (val > 0 ? val : 1);
  }, 0);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/exams/${id}`).then(({ data }) => {
        setExam({
          ...data.data,
          startTime: data.data.startTime ? new Date(data.data.startTime).toISOString().slice(0, 16) : '',
          endTime: data.data.endTime ? new Date(data.data.endTime).toISOString().slice(0, 16) : '',
        });
      });
      api.get(`/admin/exams/${id}/questions`).then(({ data }) => setQuestions(data.data));
    }
  }, [id, isEdit]);

  const handleExamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExam((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveExam = async () => {
    if (!exam.title.trim()) {
      toast.error('Exam title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...exam,
        totalMarks: questions.length > 0 ? calculatedTotalMarks : Number(exam.totalMarks) || 10,
        startTime: exam.startTime || null,
        endTime: exam.endTime || null,
      };
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

  const saveNewQuestion = async () => {
    if (!newQ.questionText.trim() || !newQ.options.A || !newQ.options.B || !newQ.options.C || !newQ.options.D) {
      toast.error('Please fill all question fields');
      return;
    }
    const marksNum = Number(newQ.marks);
    if (isNaN(marksNum) || marksNum <= 0) {
      toast.error('Marks must be greater than 0.');
      return;
    }

    try {
      const payload = {
        ...newQ,
        marks: marksNum,
      };
      const { data } = await api.post(`/admin/exams/${examId}/questions`, payload);
      setQuestions((p) => [...p, data.data]);
      setNewQ(defaultQuestion);
      setAddingQuestion(false);
      toast.success('Question added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question');
    }
  };

  const startEditQuestion = (q) => {
    setEditingQId(q._id);
    setEditQ({
      questionText: q.questionText || '',
      options: {
        A: q.options?.A || '',
        B: q.options?.B || '',
        C: q.options?.C || '',
        D: q.options?.D || '',
      },
      correctAnswer: q.correctAnswer || 'A',
      marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
      explanation: q.explanation || '',
    });
  };

  const saveEditedQuestion = async () => {
    if (!editQ.questionText.trim() || !editQ.options.A || !editQ.options.B || !editQ.options.C || !editQ.options.D) {
      toast.error('Please fill all question fields');
      return;
    }
    const marksNum = Number(editQ.marks);
    if (isNaN(marksNum) || marksNum <= 0) {
      toast.error('Marks must be greater than 0.');
      return;
    }

    try {
      const payload = {
        ...editQ,
        marks: marksNum,
      };
      const { data } = await api.put(`/admin/questions/${editingQId}`, payload);
      setQuestions((p) => p.map((q) => (q._id === editingQId ? data.data : q)));
      setEditingQId(null);
      toast.success('Question updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question');
    }
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
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
    if (!examId) {
      toast.error('Please save the exam first');
      return;
    }
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
          <button
            key={tab}
            onClick={() => {
              if (tab === 'questions' && !examId) {
                toast.error('Save exam details first');
                return;
              }
              setTab(tab);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              background: activeTab === tab ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'details' ? 'Exam Details' : `Questions (${questions.length})`}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="glass-card p-8 space-y-5">
          <div>
            <label style={labelStyle}>Exam Title *</label>
            <input
              name="title"
              value={exam.title}
              onChange={handleExamChange}
              placeholder="e.g. Full Stack Assessment"
              className="input-field"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={exam.description}
              onChange={handleExamChange}
              placeholder="Brief description of the exam..."
              rows={3}
              className="input-field"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Duration (minutes) *</label>
              <input
                name="duration"
                type="number"
                min={1}
                value={exam.duration}
                onChange={handleExamChange}
                className="input-field"
                style={inputStyle}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label style={labelStyle}>Total Maximum Marks</label>
                {questions.length > 0 && (
                  <span style={{ fontSize: '11.5px', color: 'var(--primary-light)', fontWeight: 600 }}>
                    Auto-sum from questions
                  </span>
                )}
              </div>
              <input
                name="totalMarks"
                type="number"
                min={1}
                value={questions.length > 0 ? calculatedTotalMarks : exam.totalMarks}
                onChange={handleExamChange}
                disabled={questions.length > 0}
                className="input-field"
                style={{
                  ...inputStyle,
                  background: questions.length > 0 ? 'rgba(255,255,255,0.06)' : undefined,
                  cursor: questions.length > 0 ? 'not-allowed' : 'text',
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {questions.length > 0
                  ? `Calculated dynamically: ${calculatedTotalMarks} marks across ${questions.length} questions.`
                  : 'Will auto-calculate once questions are added.'}
              </span>
            </div>
            <div>
              <label style={labelStyle}>Passing Marks *</label>
              <input
                name="passingMarks"
                type="number"
                min={0}
                value={exam.passingMarks}
                onChange={handleExamChange}
                className="input-field"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Warnings (before auto-void)</label>
              <input
                name="maxWarnings"
                type="number"
                min={1}
                max={10}
                value={exam.maxWarnings}
                onChange={handleExamChange}
                className="input-field"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Time (optional)</label>
              <input
                name="startTime"
                type="datetime-local"
                value={exam.startTime}
                onChange={handleExamChange}
                className="input-field"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Time (optional)</label>
              <input
                name="endTime"
                type="datetime-local"
                value={exam.endTime}
                onChange={handleExamChange}
                className="input-field"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            {[
              { name: 'allowResume', label: 'Allow Resume' },
              { name: 'shuffleQuestions', label: 'Shuffle Questions' },
              { name: 'showResultImmediately', label: 'Show Result Immediately' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  name={name}
                  checked={exam[name]}
                  onChange={handleExamChange}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={saveExam} disabled={saving} className="btn-primary">
              {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Save size={18} />}
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save & Add Questions'}
            </button>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Summary / Stats Bar */}
          <div
            className="glass-card p-4 flex flex-wrap items-center justify-between gap-4"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Questions:</span>
                <span className="badge badge-primary" style={{ fontSize: '13px', fontWeight: 700 }}>
                  {totalQuestionsCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Maximum Marks:</span>
                <span
                  style={{
                    background: 'rgba(247,127,0,0.15)',
                    color: 'var(--secondary-light)',
                    border: '1px solid rgba(247,127,0,0.3)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Award size={14} /> {calculatedTotalMarks} Marks
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <Download size={15} /> Template
              </button>
              <label className="btn-secondary cursor-pointer" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Excel'}
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={uploading} />
              </label>
              {!addingQuestion && !editingQId && (
                <button onClick={() => setAddingQuestion(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  <Plus size={15} /> Add Question
                </button>
              )}
            </div>
          </div>

          {/* Add Question Form */}
          {addingQuestion && (
            <div
              className="glass-card p-6 space-y-4 page-enter"
              style={{
                border: '1px solid rgba(230,57,70,0.4)',
                boxShadow: '0 8px 24px -4px rgba(230,57,70,0.15)',
                borderRadius: '16px',
              }}
            >
              <div className="flex items-center justify-between">
                <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>Add New Question</h3>
                <span className="badge badge-primary">Q{questions.length + 1}</span>
              </div>

              <div>
                <label style={labelStyle}>Question Text *</label>
                <textarea
                  value={newQ.questionText}
                  onChange={(e) => setNewQ((p) => ({ ...p, questionText: e.target.value }))}
                  placeholder="Enter your question..."
                  rows={3}
                  className="input-field"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <label style={labelStyle}>Option {opt} *</label>
                    <input
                      value={newQ.options[opt]}
                      onChange={(e) => setNewQ((p) => ({ ...p, options: { ...p.options, [opt]: e.target.value } }))}
                      placeholder={`Option ${opt}`}
                      className="input-field"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Correct Answer *</label>
                  <select
                    value={newQ.correctAnswer}
                    onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="input-field"
                    style={inputStyle}
                  >
                    {['A', 'B', 'C', 'D'].map((o) => (
                      <option key={o} value={o} style={{ background: '#1e293b' }}>
                        Option {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label style={labelStyle}>Marks for this Question *</label>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Default: 1 mark</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={newQ.marks}
                    onChange={(e) => setNewQ((p) => ({ ...p, marks: e.target.value }))}
                    className="input-field"
                    style={{ ...inputStyle, fontWeight: 700, color: 'var(--primary-light)' }}
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Set the marks awarded for a correct answer (e.g. 1, 2, 5, 10).
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Explanation (optional)</label>
                <textarea
                  value={newQ.explanation}
                  onChange={(e) => setNewQ((p) => ({ ...p, explanation: e.target.value }))}
                  placeholder="Why is this the correct answer?"
                  rows={2}
                  className="input-field"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setAddingQuestion(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={saveNewQuestion} className="btn-primary">
                  <CheckCircle2 size={16} /> Save Question
                </button>
              </div>
            </div>
          )}

          {/* Edit Question Form */}
          {editingQId && (
            <div
              className="glass-card p-6 space-y-4 page-enter"
              style={{
                border: '1px solid rgba(247,127,0,0.4)',
                boxShadow: '0 8px 24px -4px rgba(247,127,0,0.15)',
                borderRadius: '16px',
              }}
            >
              <div className="flex items-center justify-between">
                <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>Edit Question</h3>
                <span className="badge badge-warning">Editing</span>
              </div>

              <div>
                <label style={labelStyle}>Question Text *</label>
                <textarea
                  value={editQ.questionText}
                  onChange={(e) => setEditQ((p) => ({ ...p, questionText: e.target.value }))}
                  placeholder="Enter your question..."
                  rows={3}
                  className="input-field"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <label style={labelStyle}>Option {opt} *</label>
                    <input
                      value={editQ.options[opt]}
                      onChange={(e) => setEditQ((p) => ({ ...p, options: { ...p.options, [opt]: e.target.value } }))}
                      placeholder={`Option ${opt}`}
                      className="input-field"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Correct Answer *</label>
                  <select
                    value={editQ.correctAnswer}
                    onChange={(e) => setEditQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="input-field"
                    style={inputStyle}
                  >
                    {['A', 'B', 'C', 'D'].map((o) => (
                      <option key={o} value={o} style={{ background: '#1e293b' }}>
                        Option {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label style={labelStyle}>Marks for this Question *</label>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={editQ.marks}
                    onChange={(e) => setEditQ((p) => ({ ...p, marks: e.target.value }))}
                    className="input-field"
                    style={{ ...inputStyle, fontWeight: 700, color: 'var(--primary-light)' }}
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Set the marks awarded for a correct answer (e.g. 1, 2, 5, 10).
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Explanation (optional)</label>
                <textarea
                  value={editQ.explanation}
                  onChange={(e) => setEditQ((p) => ({ ...p, explanation: e.target.value }))}
                  placeholder="Why is this the correct answer?"
                  rows={2}
                  className="input-field"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditingQId(null)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={saveEditedQuestion} className="btn-primary">
                  <CheckCircle2 size={16} /> Update Question
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center" style={{ color: 'var(--text-secondary)' }}>
              <Plus size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p className="text-base font-semibold mb-1">No questions yet</p>
              <p style={{ fontSize: '13px' }}>Add questions manually or upload an Excel file.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q._id || i}
                  className="glass-card p-5 transition-all"
                  style={{
                    background: editingQId === q._id ? 'rgba(247,127,0,0.06)' : 'rgba(255,255,255,0.035)',
                    border: editingQId === q._id ? '1px solid rgba(247,127,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="badge badge-primary">Q{i + 1}</span>
                        {/* Prominent Marks Badge */}
                        <span
                          style={{
                            background: 'rgba(247,127,0,0.12)',
                            border: '1px solid rgba(247,127,0,0.25)',
                            color: 'var(--secondary-light)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Award size={13} /> {q.marks || 1} {Number(q.marks) === 1 ? 'Mark' : 'Marks'}
                        </span>
                      </div>

                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', marginBottom: 12, lineHeight: 1.4 }}>
                        {q.questionText}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {Object.entries(q.options || {}).map(([key, val]) => {
                          const isCorrect = key === q.correctAnswer;
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-2 rounded-lg p-2.5"
                              style={{
                                background: isCorrect ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.02)',
                                border: isCorrect ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <span
                                className="font-bold text-sm"
                                style={{
                                  color: isCorrect ? '#10b981' : 'var(--primary-light)',
                                  minWidth: 20,
                                }}
                              >
                                {key}.
                              </span>
                              <span style={{ color: isCorrect ? '#ffffff' : 'var(--text-secondary)', fontSize: '13.5px' }}>
                                {val}
                              </span>
                              {isCorrect && <CheckCircle2 size={15} style={{ color: '#10b981', marginLeft: 'auto', flexShrink: 0 }} />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderLeft: '3px solid var(--primary)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEditQuestion(q)}
                        className="btn-secondary"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        title="Edit question and marks"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(q._id)}
                        className="btn-danger"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
