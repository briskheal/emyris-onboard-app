import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, Search, 
  Eye, RefreshCw, X, Award, TrendingUp
} from 'lucide-react';
import api from '../../api/client';

const formatDDMMYYYY = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.substring(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {}
  return s;
};

const formatCurrency = (val: any) => {
  const num = Number(val);
  if (!num || isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
};

const PILLARS_CONFIG = [
  { id: 'sales', title: '1. Sales Performance', maxMgr: 45, maxSelf: 40, desc: 'Achievement vs Target (Primary & Secondary), Focus Brands, New Prescribers, Stockist Coverage, Expiry Control' },
  { id: 'fieldWork', title: '2. Field Work & Coverage', maxMgr: 20, maxSelf: 20, desc: 'Daily Doctor Calls (10-12), Chemist Calls (4-6), MSL Coverage %, Call Frequency, Tour Plan Adherence, POB' },
  { id: 'quality', title: '3. Quality of Work', maxMgr: 15, maxSelf: 15, desc: 'RCPA Execution & Accuracy, Detailing & Visual Aid Skills, Doctor Relationship & Conversion, Speciality Targeting' },
  { id: 'knowledge', title: '4. Knowledge & Training', maxMgr: 10, maxSelf: 10, desc: 'Scores in Product, Competitor & Disease Tests, Induction Module Completion, Anatomy/Physiology grasp' },
  { id: 'discipline', title: '5. Reporting & Discipline', maxMgr: 5, maxSelf: 10, desc: 'Timely & Genuine DCR Entries in SFA, Accurate Expense Claims, UCPMP Compliance, Meeting Punctuality' },
  { id: 'attitude', title: '6. Attitude & Behaviour', maxMgr: 5, maxSelf: 5, desc: 'Initiative, Coachability & Response to Feedback, Integrity (No Fake Calls), Grooming & Stockist Relationship' }
];

export default function ConfirmationManager() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'evaluated' | 'confirmed' | 'eligible'>('all');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/all-confirmations');
      if (res.data.success) {
        setList(res.data.list || []);
      }
    } catch (err: any) {
      console.error('Failed to load confirmations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = list.filter(item => {
    // Tab filter
    if (filterTab === 'pending' && item.confirmationStatus !== 'pending_manager_review') return false;
    if (filterTab === 'evaluated' && item.confirmationStatus !== 'manager_evaluated') return false;
    if (filterTab === 'confirmed' && item.confirmationStatus !== 'confirmed') return false;
    if (filterTab === 'eligible' && item.confirmationStatus !== 'eligible') return false;

    // Search filter
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.fullName && item.fullName.toLowerCase().includes(q)) ||
      (item.empCode && item.empCode.toLowerCase().includes(q)) ||
      (item.designation && item.designation.toLowerCase().includes(q)) ||
      (item.hq && item.hq.toLowerCase().includes(q)) ||
      (item.reportingTo && item.reportingTo.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q))
    );
  });

  const pendingCount = list.filter(i => i.confirmationStatus === 'pending_manager_review').length;
  const evaluatedCount = list.filter(i => i.confirmationStatus === 'manager_evaluated').length;
  const confirmedCount = list.filter(i => i.confirmationStatus === 'confirmed').length;
  const eligibleCount = list.filter(i => i.confirmationStatus === 'eligible').length;

  const handleUpdateStatus = async (statusToSet: 'confirmed' | 'Confirmation Extended' | 'manager_evaluated') => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.post('/admin/update-confirmation-record', {
        email: selectedRecord.email,
        adminStatus: statusToSet,
        adminRemarks: adminRemarks
      });
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: `Employee ${selectedRecord.fullName} confirmation status updated successfully!` });
        await fetchConfirmations();
        // Update selected record locally
        setSelectedRecord((prev: any) => ({
          ...prev,
          confirmationStatus: statusToSet,
          confirmationData: res.data.confirmationData
        }));
      } else {
        setFeedbackMsg({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.response?.data?.message || e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>📋</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
              Confirmation Process Management
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            5-Month Performance Records, 100-Mark Dual-Assessment (MR Self-Rating + Reporting Manager Evaluation), and Final Confirmation Governance.
          </p>
        </div>

        <button 
          onClick={fetchConfirmations}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#38bdf8',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.86rem'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Records
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>TOTAL ELIGIBLE (5+ MO)</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>
            {list.filter(i => (i.completedMonths || 0) >= 5).length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Across all divisions &amp; zones</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>PENDING MANAGER REVIEW</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', marginTop: '8px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>MR submitted, waiting manager</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>MANAGER EVALUATED</span>
            <Award size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginTop: '8px' }}>
            {evaluatedCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>Ready for Admin Confirmation</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>CONFIRMED EMPLOYEES</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginTop: '8px' }}>
            {confirmedCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>Official Confirmation Issued</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        background: '#131b2e',
        border: '1px solid #334155',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Candidates (${list.length})` },
            { id: 'pending', label: `Pending Manager Review (${pendingCount})` },
            { id: 'evaluated', label: `Manager Evaluated (${evaluatedCount})` },
            { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
            { id: 'eligible', label: `Eligible 5+ Mo (${eligibleCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              style={{
                background: filterTab === tab.id ? '#0284c7' : '#1e293b',
                color: filterTab === tab.id ? '#ffffff' : '#94a3b8',
                border: filterTab === tab.id ? '1px solid #38bdf8' : '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, code, manager, HQ..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              background: '#090e1a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#131b2e', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#090e1a', color: '#94a3b8', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '14px 18px' }}>Candidate / Employee</th>
                <th style={{ padding: '14px 14px' }}>Reporting Manager</th>
                <th style={{ padding: '14px 14px' }}>ADOJ &amp; Service</th>
                <th style={{ padding: '14px 14px', textAlign: 'center' }}>Self Score</th>
                <th style={{ padding: '14px 14px', textAlign: 'center' }}>Manager Score</th>
                <th style={{ padding: '14px 14px' }}>Recommendation</th>
                <th style={{ padding: '14px 14px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Loading confirmation records...' : 'No candidate records match your current filter.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const conf = item.confirmationData || {};
                  const selfScore = conf.totalSelfScore;
                  const mgrScore = conf.totalManagerScore;
                  const grade = conf.finalGrade;
                  const rec = conf.managerRecommendation;

                  return (
                    <tr 
                      key={item._id || item.email || idx}
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
                    >
                      {/* Candidate Name & Code */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>{item.fullName}</span>
                          {item.canLogin === false ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                              INACTIVE (ACCESS OFF)
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                          <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700 }}>{item.empCode || 'N/A'}</span>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>•</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.designation || 'Medical Representative'}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '2px' }}>
                          HQ: <strong style={{ color: '#cbd5e1' }}>{item.hq || 'N/A'}</strong> | {item.division || 'General'}
                        </div>
                      </td>

                      {/* Reporting Manager */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>{item.reportingTo || 'Unassigned'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Designated Evaluator</div>
                      </td>

                      {/* ADOJ & Service Duration */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ color: '#facc15', fontWeight: 700, fontSize: '0.86rem' }}>
                          {formatDDMMYYYY(item.actualJoiningDate)}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                          {item.completedMonths >= 0 ? `${item.completedMonths} Months Completed` : 'N/A'}
                        </div>
                      </td>

                      {/* Self Score */}
                      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                        {selfScore !== undefined && selfScore !== null ? (
                          <div>
                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8' }}>{selfScore}</span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}> / 100</span>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Not rated</span>
                        )}
                      </td>

                      {/* Manager Score */}
                      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                        {mgrScore !== undefined && mgrScore !== null ? (
                          <div>
                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10b981' }}>{mgrScore}</span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}> / 100</span>
                            {grade && (
                              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>Grade {grade}</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Pending</span>
                        )}
                      </td>

                      {/* Manager Recommendation */}
                      <td style={{ padding: '14px 14px' }}>
                        {rec === 'confirm' ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                            ✓ Recommend Confirmation
                          </span>
                        ) : rec === 'extend_probation' ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                            ⏳ Extend Probation 3 Mo
                          </span>
                        ) : rec === 'not_recommended' ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                            ✕ Not Recommended
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Awaiting Manager</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 14px' }}>
                        {item.confirmationStatus === 'confirmed' ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                            Confirmed Employee
                          </span>
                        ) : item.confirmationStatus === 'manager_evaluated' ? (
                          <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                            Manager Evaluated
                          </span>
                        ) : item.confirmationStatus === 'pending_manager_review' ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                            Pending Manager Review
                          </span>
                        ) : item.confirmationStatus === 'draft' ? (
                          <span style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid #64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Draft in Progress
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid #475569', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                            Eligible (Pending MR)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedRecord(item);
                            setAdminRemarks(item.confirmationData?.adminRemarks || '');
                            setFeedbackMsg(null);
                          }}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Eye size={14} /> Review Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dossier Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 28px',
              background: '#1e293b',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📋</span>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
                    Confirmation Review Dossier: {selectedRecord.fullName}
                  </h3>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px', display: 'flex', gap: '12px' }}>
                  <span>Code: <strong style={{ color: '#38bdf8' }}>{selectedRecord.empCode || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>HQ: <strong style={{ color: '#ffffff' }}>{selectedRecord.hq || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>ADOJ: <strong style={{ color: '#facc15' }}>{formatDDMMYYYY(selectedRecord.actualJoiningDate)}</strong></span>
                  <span>•</span>
                  <span>Manager: <strong style={{ color: '#ffffff' }}>{selectedRecord.reportingTo || 'N/A'}</strong></span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {feedbackMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
                  color: feedbackMsg.type === 'success' ? '#34d399' : '#f87171',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}>
                  {feedbackMsg.text}
                </div>
              )}

              {/* 5-Month Field Performance Summary Table */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} /> Section 1: Field Performance &amp; 6th-Month Commitment
                </h4>

                {selectedRecord.confirmationData?.months && selectedRecord.confirmationData.months.length > 0 ? (
                  <div style={{ overflowX: 'auto', background: '#090e1a', borderRadius: '10px', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Month</th>
                          <th style={{ padding: '10px 8px' }}>Days</th>
                          <th style={{ padding: '10px 8px' }}>Dr Vis</th>
                          <th style={{ padding: '10px 8px' }}>Calls</th>
                          <th style={{ padding: '10px 8px' }}>Call Avg</th>
                          <th style={{ padding: '10px 8px' }}>POB (₹)</th>
                          <th style={{ padding: '10px 8px' }}>Sec Obj (₹)</th>
                          <th style={{ padding: '10px 8px' }}>Sec Ach (₹)</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center' }}>% Sec</th>
                          <th style={{ padding: '10px 8px' }}>Coll Obj (₹)</th>
                          <th style={{ padding: '10px 8px' }}>Coll Ach (₹)</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center' }}>% Coll</th>
                          <th style={{ padding: '10px 8px' }}>Salary &amp; Exp</th>
                          <th style={{ padding: '10px 8px' }}>Activity</th>
                          <th style={{ padding: '10px 8px' }}>LOP</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center' }}>SALES / EXP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.confirmationData.months.map((m: any, mIdx: number) => (
                          <tr key={mIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: m.isProjection ? 'rgba(56, 189, 248, 0.08)' : 'transparent' }}>
                            <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: m.isProjection ? '#38bdf8' : '#ffffff' }}>
                              {m.monthLabel} {m.isProjection ? '(🎯 Proj)' : ''}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.daysWorked || 0}</td>
                            <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.drVisits || 0}</td>
                            <td style={{ padding: '10px 8px', color: '#ffffff' }}>{m.totCalls || 0}</td>
                            <td style={{ padding: '10px 8px', color: '#38bdf8', fontWeight: 700 }}>{m.callAvg || 0}</td>
                            <td style={{ padding: '10px 8px', color: '#ffffff' }}>{formatCurrency(m.pob)}</td>
                            <td style={{ padding: '10px 8px', color: '#38bdf8' }}>{formatCurrency(m.secObj)}</td>
                            <td style={{ padding: '10px 8px', color: '#38bdf8', fontWeight: 700 }}>{formatCurrency(m.secAchieved)}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: m.achievementPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                              {m.achievementPct || 0}%
                            </td>
                            <td style={{ padding: '10px 8px', color: '#34d399' }}>{formatCurrency(m.collObj)}</td>
                            <td style={{ padding: '10px 8px', color: '#34d399', fontWeight: 700 }}>{formatCurrency(m.collAchieved)}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: m.collAchievementPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                              {m.collAchievementPct || 0}%
                            </td>
                            <td style={{ padding: '10px 8px', color: '#fef08a' }}>{formatCurrency(m.salaryExpense)}</td>
                            <td style={{ padding: '10px 8px', color: '#fed7aa' }}>{formatCurrency(m.totActivityAmt)}</td>
                            <td style={{ padding: '10px 8px', color: m.lopDays > 0 ? '#f87171' : '#ffffff' }}>{m.lopDays || 0}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                              {(() => {
                                const cost = (Number(m.salaryExpense) || 0) + (Number(m.totActivityAmt) || 0);
                                const ach = Number(m.secAchieved) || 0;
                                const rStr = cost > 0 ? (ach / cost).toFixed(2) + 'x' : (ach > 0 ? '—' : '0.00x');
                                const rNum = cost > 0 ? (ach / cost) : 0;
                                return (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 900,
                                    background: `rgba(${rNum >= 3.5 ? '16, 185, 129' : (rNum >= 2.0 ? '56, 189, 248' : '245, 158, 11')}, 0.2)`,
                                    color: rNum >= 3.5 ? '#34d399' : (rNum >= 2.0 ? '#38bdf8' : '#fbbf24'),
                                    border: `1px solid ${rNum >= 3.5 ? '#10b981' : (rNum >= 2.0 ? '#0284c7' : '#f59e0b')}`
                                  }}>
                                    {rStr}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '18px', background: '#090e1a', borderRadius: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Candidate has not filled in Section 1 field performance data yet.
                  </div>
                )}
              </div>

              {/* Section 2: 6 Parameters Dual Evaluation */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} /> Section 2: 100-Mark Dual-Evaluation Comparison
                </h4>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {PILLARS_CONFIG.map(pillar => {
                    const selfVal = selectedRecord.confirmationData?.selfRatings?.[pillar.id];
                    const mgrVal = selectedRecord.confirmationData?.managerRatings?.[pillar.id];

                    return (
                      <div key={pillar.id} style={{
                        background: '#090e1a',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>{pillar.title}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>{pillar.desc}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                          {/* Self Rating */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Self Rating</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                              {selfVal !== undefined ? selfVal : '-'} <span style={{ fontSize: '0.74rem', color: '#64748b' }}>/{pillar.maxSelf}</span>
                            </div>
                          </div>

                          {/* Manager Rating */}
                          <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '20px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Manager Score</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                              {mgrVal !== undefined ? mgrVal : '-'} <span style={{ fontSize: '0.74rem', color: '#64748b' }}>/{pillar.maxMgr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manager Recommendation & Remarks */}
              <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '18px 22px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.94rem', fontWeight: 800 }}>
                    Reporting Manager's Recommendation &amp; Justification
                  </h4>
                  {selectedRecord.confirmationData?.totalManagerScore !== undefined && (
                    <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 800 }}>
                      Total Score: {selectedRecord.confirmationData.totalManagerScore}/100 (Grade {selectedRecord.confirmationData.finalGrade || 'N/A'})
                    </span>
                  )}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.86rem', fontStyle: 'italic', lineHeight: '1.5' }}>
                  "{selectedRecord.confirmationData?.managerRemarks || 'No manager remarks entered.'}"
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Evaluated By: <strong style={{ color: '#ffffff' }}>{selectedRecord.confirmationData?.managerEvaluatedBy || selectedRecord.reportingTo || 'N/A'}</strong> on {formatDDMMYYYY(selectedRecord.confirmationData?.managerEvaluatedAt)}
                </div>
              </div>

              {/* Admin Decision Section */}
              <div style={{
                background: '#090e1a',
                border: '1.5px solid #0284c7',
                borderRadius: '14px',
                padding: '20px 24px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '1rem', fontWeight: 800 }}>
                  ⚖️ Admin Governance Decision
                </h4>

                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Admin Notes / Management Remarks:
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter executive management decision remarks (e.g. Approved based on 90% secondary achievement and strong doctor conversion)..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#131b2e',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={16} /> Confirm Employee &amp; Issue Confirmation Status
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('Confirmation Extended')}
                    disabled={actionLoading}
                    style={{
                      background: '#1e293b',
                      color: '#fbbf24',
                      border: '1px solid #f59e0b',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.86rem'
                    }}
                  >
                    ⏳ Extend Probation by 3 Months
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
