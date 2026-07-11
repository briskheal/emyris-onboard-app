import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, PlayCircle, Save } from 'lucide-react';
import api from '../../api/client';

export default function QuestionBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Tab State for questions
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All');

  // Exam Schedule Config
  const [examDate, setExamDate] = useState('');
  const [targetProduct, setTargetProduct] = useState('General');
  const [mcqTime, setMcqTime] = useState(15);
  const [descTime, setDescTime] = useState(15);
  const [mcqCount, setMcqCount] = useState(10);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Form State
  const [qType, setQType] = useState('mcq');
  const [category, setCategory] = useState('');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [inputFields, setInputFields] = useState(''); // Comma separated labels

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        api.get('/admin/questions'),
        api.get('/company-profile')
      ]);
      setQuestions(qRes.data.questions || []);
      if (cRes.data) {
        const comp = cRes.data.company || cRes.data;
        setExamDate(comp.activeExamDate || '');
        setTargetProduct(comp.activeExamProduct || 'General');
        setMcqTime(comp.examMcqTime || 15);
        setDescTime(comp.examDescriptiveTime || 15);
        setMcqCount(comp.examMcqCount || 10);
        setAvailableProducts(comp.targetProductsList || []);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.post('/admin/schedule-exam', {
        examDate, targetProduct, mcqTime, descTime, mcqCount
      });
      alert('Exam configuration saved!');
    } catch (e) {
      alert('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setQType('mcq');
    setCategory(activeCategoryTab !== 'All' ? activeCategoryTab : '');
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectAnswerIndex(0);
    setInputFields('');
    setShowModal(true);
  };

  const openEditModal = (q: any) => {
    setEditingQuestion(q);
    setQType(q.questionType);
    setCategory(q.category);
    setQText(q.text);
    if (q.questionType === 'mcq') {
      setOptions(q.options || ['', '', '', '']);
      setCorrectAnswerIndex(q.correctAnswerIndex || 0);
    } else {
      setInputFields((q.inputFields || []).join(', '));
    }
    setShowModal(true);
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchData();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { category, targetProduct: targetProduct, questionType: qType, text: qText };
    if (qType === 'mcq') {
      payload.options = options;
      payload.correctAnswerIndex = correctAnswerIndex;
    } else {
      payload.inputFields = inputFields.split(',').map(s => s.trim()).filter(s => s);
    }

    try {
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion._id}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Save failed');
    }
  };

  const allUniqueCategories = Array.from(new Set(questions.map(q => q.category))).sort();
  const coreSubjects = ['math', 'english', 'gk', 'current_affairs', 'general'];
  const coreCategories = allUniqueCategories.filter(cat => coreSubjects.includes(cat.toLowerCase()));
  const productCategories = allUniqueCategories.filter(cat => !coreSubjects.includes(cat.toLowerCase()));

  const filteredQuestions = activeCategoryTab === 'All' ? questions : questions.filter(q => q.category === activeCategoryTab);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Configuration Bar */}
      <div className="dash-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Exam Configuration</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div><label className="form-label">Exam Date</label><input type="date" className="form-input" value={examDate} onChange={e => setExamDate(e.target.value)} /></div>
          <div><label className="form-label">Target Product</label><select className="form-input" value={targetProduct} onChange={e => setTargetProduct(e.target.value)}>{availableProducts.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="form-label">MCQ Mins</label><input type="number" className="form-input" value={mcqTime} onChange={e => setMcqTime(parseInt(e.target.value))} style={{ width: '80px' }} /></div>
          <div><label className="form-label">Desc Mins</label><input type="number" className="form-input" value={descTime} onChange={e => setDescTime(parseInt(e.target.value))} style={{ width: '80px' }} /></div>
          <div><label className="form-label">MCQ Count</label><input type="number" className="form-input" value={mcqCount} onChange={e => setMcqCount(parseInt(e.target.value))} style={{ width: '80px' }} /></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={saveConfig} disabled={savingConfig}><Save size={16} /> Save Config</button>
            <button className="btn btn-outline" onClick={() => setShowSimulator(true)}><PlayCircle size={16} /> Preview Test</button>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Test & Exam Bank</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select 
              className="form-input" 
              value={activeCategoryTab} 
              onChange={e => setActiveCategoryTab(e.target.value)}
              style={{ minWidth: '200px', margin: 0 }}
            >
              <option value="All">All Questions</option>
              
              {coreCategories.length > 0 && (
                <optgroup label="Core Subjects">
                  {coreCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </optgroup>
              )}
              
              {productCategories.length > 0 && (
                <optgroup label="Products">
                  {productCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </optgroup>
              )}
            </select>
            
            <button className="btn btn-primary" onClick={openAddModal} style={{ margin: 0 }}><Plus size={16} /> Add Question</button>
          </div>
        </div>

        {loading ? (
          <div>Loading questions...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 15px' }}>Type</th>
                  <th style={{ padding: '12px 15px' }}>Category</th>
                  <th style={{ padding: '12px 15px' }}>Question</th>
                  <th style={{ padding: '12px 15px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '15px' }}><span className={`badge ${q.questionType === 'mcq' ? 'approved' : 'pending'}`}>{q.questionType.toUpperCase()}</span></td>
                    <td style={{ padding: '15px' }}>{q.category}</td>
                    <td style={{ padding: '15px', maxWidth: '400px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(q)}><Edit2 size={14} /></button>
                        <button className="btn btn-sm btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => deleteQuestion(q._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="dash-card" style={{ width: '100%', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
            <form onSubmit={saveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><label className="form-label">Type</label><select className="form-input" value={qType} onChange={e => setQType(e.target.value)} disabled={!!editingQuestion}><option value="mcq">Multiple Choice</option><option value="descriptive">Descriptive</option></select></div>
                <div style={{ flex: 1 }}><label className="form-label">Category</label><input type="text" className="form-input" required value={category} onChange={e => setCategory(e.target.value)} /></div>
              </div>
              <div><label className="form-label">Question Text</label><textarea className="form-input" required rows={3} value={qText} onChange={e => setQText(e.target.value)} /></div>
              
              {qType === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                  <label className="form-label">Options (Check the correct answer)</label>
                  {options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="radio" name="correctAnswer" checked={correctAnswerIndex === i} onChange={() => setCorrectAnswerIndex(i)} />
                      <input type="text" className="form-input" placeholder={`Option ${i+1}`} required value={opt} onChange={e => {
                        const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts);
                      }} />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'descriptive' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                  <label className="form-label">Input Field Labels (Comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. Sales Figure, Expected Target" required value={inputFields} onChange={e => setInputFields(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={16} style={{ display: 'inline', marginRight: '5px' }}/> Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {showSimulator && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-surface)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PlayCircle size={24} color="var(--primary)" />
              <h2 style={{ margin: 0, color: '#fff' }}>Rapid Test Simulator</h2>
            </div>
            <button className="btn btn-outline" onClick={() => setShowSimulator(false)} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
              Close Simulator
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-surface)' }}>
            <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--primary)', margin: 0 }}>Preview Mode</h3>
                <p style={{ color: 'var(--text-muted)' }}>Showing up to 3 questions.</p>
              </div>
              {questions.slice(0, 3).map((q, idx) => (
                <div key={q._id} className="dash-card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '1.5rem', fontSize: '1.1rem', color: '#fff' }}>
                    <span style={{ color: 'var(--primary)', marginRight: '10px' }}>Q{idx + 1}.</span> {q.text}
                  </p>
                  {q.questionType === 'mcq' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {q.options.map((o: string, i: number) => (
                        <div key={i} style={{ 
                          padding: '12px 16px', 
                          background: i === q.correctAnswerIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', 
                          borderRadius: '8px', 
                          border: i === q.correctAnswerIndex ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span>{o}</span>
                          {i === q.correctAnswerIndex && <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Correct</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea className="form-input" rows={4} placeholder="Applicant will type descriptive answer here..." disabled style={{ width: '100%', resize: 'none', background: 'rgba(0,0,0,0.2)' }}></textarea>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
