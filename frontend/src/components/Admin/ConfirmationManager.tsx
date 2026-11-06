import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, Search, 
  Eye, RefreshCw, X, Award, TrendingUp, RotateCcw, Calendar, Download
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
  { id: 'sales', title: '1. Sales Performance', maxMgr: 40, maxSelf: 40, desc: 'Achievement vs Target (Primary & Secondary), Focus Brands, New Prescribers, Stockist Coverage, Expiry Control' },
  { id: 'fieldWork', title: '2. Field Work & Coverage', maxMgr: 20, maxSelf: 20, desc: 'Daily Doctor Calls (10-12), Chemist Calls (4-6), MSL Coverage %, Call Frequency, Tour Plan Adherence, POB' },
  { id: 'quality', title: '3. Quality of Work', maxMgr: 15, maxSelf: 15, desc: 'RCPA Execution & Accuracy, Detailing & Visual Aid Skills, Doctor Relationship & Conversion, Speciality Targeting' },
  { id: 'knowledge', title: '4. Knowledge & Training', maxMgr: 10, maxSelf: 10, desc: 'Scores in Product, Competitor & Disease Tests, Induction Module Completion, Anatomy/Physiology grasp' },
  { id: 'discipline', title: '5. Reporting & Discipline', maxMgr: 10, maxSelf: 10, desc: 'Timely & Genuine DCR Entries in SFA, Accurate Expense Claims, UCPMP Compliance, Meeting Punctuality' },
  { id: 'attitude', title: '6. Attitude & Behaviour', maxMgr: 5, maxSelf: 5, desc: 'Initiative, Coachability & Response to Feedback, Integrity (No Fake Calls), Grooming & Stockist Relationship' }
];


const getRecordMonths = (rec: any) => {
  if (rec?.confirmationData?.months && rec.confirmationData.months.length > 0) {
    return rec.confirmationData.months;
  }
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let adoj: Date | null = null;
  if (rec?.actualJoiningDate) {
    const s = String(rec.actualJoiningDate).trim();
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
      const p = s.substring(0, 10).split('-');
      adoj = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
      const p = s.split('-');
      const p1 = parseInt(p[0], 10), p2 = parseInt(p[1], 10), y = parseInt(p[2], 10);
      adoj = new Date(y, (p1 > 12 ? p2 : p1) - 1, p1 > 12 ? p1 : p2);
    } else {
      adoj = new Date(s);
    }
  }
  if (!adoj || isNaN(adoj.getTime())) adoj = new Date();
  const list = [];
  for (let i = 0; i < 6; i++) {
    const mDate = new Date(adoj.getFullYear(), adoj.getMonth() + i, 1);
    list.push({
      monthIndex: i + 1,
      monthLabel: `${monthNames[mDate.getMonth()]} ${mDate.getFullYear()}`,
      year: mDate.getFullYear(),
      monthNum: mDate.getMonth() + 1,
      isProjection: i === 5,
      daysWorked: 0,
      drVisits: 0,
      chemVisits: 0,
      totCalls: 0,
      callAvg: 0,
      pob: 0,
      secObj: 0,
      secAchieved: 0,
      achievementPct: 0,
      collObj: 0,
      collAchieved: 0,
      collAchievementPct: 0,
      salaryExpense: 0,
      totActivityAmt: 0,
      lopDays: 0
    });
  }
  return list;
};

export default function ConfirmationManager() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'evaluated' | 'confirmed' | 'draft' | 'extended'>('all');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [confirmationDate, setConfirmationDate] = useState<string>('');
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
    if (filterTab === 'draft' && item.confirmationStatus !== 'draft') return false;
    if (filterTab === 'extended' && item.confirmationStatus !== 'extended') return false;

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
  const draftCount = list.filter(i => i.confirmationStatus === 'draft').length;
  const extendedCount = list.filter(i => i.confirmationStatus === 'extended').length;

  const handleUpdateStatus = async (statusToSet: 'confirmed' | 'Confirmation Extended' | 'manager_evaluated' | 'draft') => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await api.post('/admin/update-confirmation-record', {
        email: selectedRecord.email,
        adminStatus: statusToSet,
        adminRemarks: adminRemarks,
        doc: confirmationDate
      });
      if (res.data.success) {
        setFeedbackMsg({ type: 'success', text: res.data.message || `Employee ${selectedRecord.fullName} confirmation status updated successfully!` });
        await fetchConfirmations();
        // Update selected record locally
        setSelectedRecord((prev: any) => ({
          ...prev,
          confirmationStatus: statusToSet === 'draft' ? 'eligible' : statusToSet,
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

  const handleExtendProbation = async () => {
    if (!selectedRecord) return;
    if (!window.confirm(`Extend probation for ${selectedRecord.fullName} by 3 months? This will open 3 additional months (Months 7, 8, and 9) in the performance table and release it for the executive and manager to submit.`)) {
      return;
    }
    await handleUpdateStatus('Confirmation Extended');
  };

  const handleReleaseProcess = async () => {
    if (!selectedRecord) return;
    if (!window.confirm(`Release confirmation process for ${selectedRecord.fullName} back to editable mode? This will allow the field executive and manager to modify and resubmit their assessments.`)) {
      return;
    }
    await handleUpdateStatus('draft');
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
            <span>TOTAL SUBMITTED REVIEWS</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>
            {list.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Dossiers submitted by employees</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>PENDING MANAGER REVIEW</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', marginTop: '8px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>Submitted, waiting manager review</div>
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
            { id: 'all', label: `All Submitted (${list.length})` },
            { id: 'pending', label: `Pending Manager Review (${pendingCount})` },
            { id: 'evaluated', label: `Manager Evaluated (${evaluatedCount})` },
            { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
            ...(draftCount > 0 ? [{ id: 'draft', label: `Draft / Released (${draftCount})` }] : []),
            ...(extendedCount > 0 ? [{ id: 'extended', label: `Probation Extended (${extendedCount})` }] : [])
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
                        ) : item.confirmationStatus === 'extended' ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                            Probation Extended
                          </span>
                        ) : item.confirmationStatus === 'draft' ? (
                          <span style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid #64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Draft / Released for Edit
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                            Pending Manager Review
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
                            let defaultDoc = '';
                            if (item.confirmationData?.doc) defaultDoc = item.confirmationData.doc;
                            else if (item.doc) defaultDoc = item.doc;
                            else if (item.actualJoiningDate) {
                              const d = new Date(item.actualJoiningDate);
                              if (!isNaN(d.getTime())) {
                                d.setMonth(d.getMonth() + 6);
                                defaultDoc = d.toISOString().split('T')[0];
                              }
                            }
                            if (!defaultDoc) defaultDoc = new Date().toISOString().split('T')[0];
                            setConfirmationDate(defaultDoc);
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
          padding: '8px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '98vw',
            maxWidth: '1750px',
            maxHeight: '97vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 24px',
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
            <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1 }}>
              {feedbackMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
                  color: feedbackMsg.type === 'success' ? '#34d399' : '#f87171',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}>
                  {feedbackMsg.text}
                </div>
              )}

              {/* 5-Month Field Performance Summary Table */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '0.98rem', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} /> Section 1: Field Performance &amp; 6th-Month Commitment
                </h4>

                {(() => {
                    const monthsList = getRecordMonths(selectedRecord);
                    const hasSubmitted = selectedRecord?.confirmationData?.months && selectedRecord.confirmationData.months.length > 0;
                    return (
                      <div>
                        {!hasSubmitted && (
                          <div style={{ padding: '8px 14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', display: 'inline-block' }}>
                            ⏳ Self-Submission Pending (Default 5-Mo Schedule &amp; 6th-Mo Commitment Structure)
                          </div>
                        )}
                        <div style={{ overflowX: 'auto', background: '#090e1a', borderRadius: '8px', border: '1px solid #334155' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>
                                <th style={{ padding: '7px 6px', textAlign: 'left', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Month</th>
                                <th style={{ padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Days</th>
                                <th style={{ padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Dr Visits</th>
                                <th style={{ padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Chem Visits</th>
                                <th style={{ padding: '7px 4px', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Tot Calls</th>
                                <th style={{ padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Call Avg</th>
                                <th style={{ padding: '7px 4px', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>POB (₹)</th>
                                <th style={{ padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Sec Obj</th>
                                <th style={{ padding: '7px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Sec Ach</th>
                                <th style={{ padding: '7px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>% Sec</th>
                                <th style={{ padding: '7px 4px', color: '#34d399', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Coll Obj</th>
                                <th style={{ padding: '7px 4px', color: '#34d399', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Coll Ach</th>
                                <th style={{ padding: '7px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>% Coll</th>
                                <th style={{ padding: '7px 4px', color: '#fef08a', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Salary &amp; Exp</th>
                                <th style={{ padding: '7px 4px', color: '#fed7aa', borderRight: '1px solid #334155', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Activity</th>
                                <th style={{ padding: '7px 4px', color: '#fde047', borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>Tot Expense</th>
                                <th style={{ padding: '7px 4px', textAlign: 'center', color: '#a78bfa', borderBottom: '1.5px solid #334155', fontWeight: 600 }}>6x Variance &amp; ROI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthsList.map((m: any, mIdx: number) => {
                                const dr = Number(m.drVisits) || 0;
                                const chem = Number(m.chemVisits) || 0;
                                const totCalls = m.totCalls !== undefined && m.totCalls !== '' ? Number(m.totCalls) : (dr + chem);
                                const days = Number(m.daysWorked) || 0;
                                const callAvg = days > 0 ? (totCalls / days).toFixed(1) : (m.callAvg || '0.0');

                                return (
                                  <tr key={mIdx} style={{ borderBottom: '1px solid #1e293b', background: m.isProjection ? 'rgba(56, 189, 248, 0.08)' : (mIdx % 2 === 1 ? '#0d1527' : '#090e1a') }}>
                                    <td style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 600, color: m.isProjection ? '#38bdf8' : '#ffffff', borderRight: '1px solid #334155', borderBottom: '1px solid #1e293b' }}>
                                      {m.monthLabel} {m.isProjection ? '(🎯 Plan)' : ''}
                                    </td>
                                    <td style={{ padding: '5px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{m.daysWorked || 0}</td>
                                    <td style={{ padding: '5px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{dr}</td>
                                    <td style={{ padding: '5px 4px', color: '#38bdf8', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{chem}</td>
                                    <td style={{ padding: '5px 4px', color: '#ffffff', fontWeight: 500, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{totCalls}</td>
                                    <td style={{ padding: '5px 4px', color: '#38bdf8', fontWeight: 500, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{callAvg}</td>
                                    <td style={{ padding: '5px 4px', color: '#ffffff', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.pob)}</td>
                                    <td style={{ padding: '5px 4px', color: '#38bdf8', borderRight: '1px solid #334155', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.secObj)}</td>
                                    <td style={{ padding: '5px 4px', color: '#38bdf8', fontWeight: 500, borderRight: '1px solid #334155', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.secAchieved)}</td>
                                    <td style={{ padding: '5px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>
                                      <span style={{ display: 'inline-block', padding: '1px 4px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, color: m.achievementPct >= 85 ? '#34d399' : '#fbbf24', background: 'rgba(255,255,255,0.04)' }}>
                                        {m.achievementPct || 0}%
                                      </span>
                                    </td>
                                    <td style={{ padding: '5px 4px', color: '#34d399', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.collObj)}</td>
                                    <td style={{ padding: '5px 4px', color: '#34d399', fontWeight: 500, borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.collAchieved)}</td>
                                    <td style={{ padding: '5px 3px', textAlign: 'center', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>
                                      <span style={{ display: 'inline-block', padding: '1px 4px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, color: m.collAchievementPct >= 85 ? '#34d399' : '#fbbf24', background: 'rgba(255,255,255,0.04)' }}>
                                        {m.collAchievementPct || 0}%
                                      </span>
                                    </td>
                                    <td style={{ padding: '5px 4px', color: '#fef08a', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.salaryExpense)}</td>
                                    <td style={{ padding: '5px 4px', color: '#fed7aa', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(m.totActivityAmt)}</td>
                                    <td style={{ padding: '5px 4px', color: '#fde047', fontWeight: 500, borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{formatCurrency((Number(m.salaryExpense) || 0) + (Number(m.totActivityAmt) || 0))}</td>
                                    <td style={{ padding: '5px 4px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
                                      {(() => {
                                        const cost = (Number(m.salaryExpense) || 0) + (Number(m.totActivityAmt) || 0);
                                        const ach = Number(m.secAchieved) || 0;
                                        const exp6x = cost * 6;
                                        const diff = ach - exp6x;
                                        const isPlus = diff >= 0;
                                        const diffText = cost > 0
                                          ? (isPlus ? '+' + Math.round(diff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(diff)).toLocaleString('en-IN'))
                                          : (ach > 0 ? '+' + Math.round(ach).toLocaleString('en-IN') : '0');
                                        const rStr = cost > 0 ? (ach / cost).toFixed(2) + 'x' : (ach > 0 ? '—' : '0.00x');

                                        return (
                                          <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '3px',
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            background: cost === 0 && ach === 0 ? 'rgba(51, 65, 85, 0.2)' : (isPlus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                            border: `1px solid ${cost === 0 && ach === 0 ? '#334155' : (isPlus ? '#10b981' : '#ef4444')}`
                                          }}>
                                            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: cost === 0 && ach === 0 ? '#94a3b8' : (isPlus ? '#34d399' : '#f87171') }}>
                                              {diffText}
                                            </span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 500, color: cost === 0 && ach === 0 ? '#64748b' : (isPlus ? '#a7f3d0' : '#fca5a5') }}>
                                              ({rStr})
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            {(() => {
                              if (!monthsList || monthsList.length === 0) return null;
                              const actMonths = monthsList.filter((m: any) => !m.isProjection);
                              
                              const sumField = (arr: any[], field: string) => arr.reduce((acc: number, r: any) => acc + (Number(r[field]) || 0), 0);
                              
                              // Actuals Totals
                              const actDays = sumField(actMonths, 'daysWorked');
                              const actDr = sumField(actMonths, 'drVisits');
                              const actChem = sumField(actMonths, 'chemVisits');
                              const actCalls = sumField(actMonths, 'totCalls');
                              const actCallAvg = actDays > 0 ? (actCalls / actDays).toFixed(1) : '0.0';
                              const actPob = sumField(actMonths, 'pob');
                              const actSecObj = sumField(actMonths, 'secObj');
                              const actSecAch = sumField(actMonths, 'secAchieved');
                              const actSecPct = actSecObj > 0 ? Math.round((actSecAch / actSecObj) * 100) : 0;
                              const actCollObj = sumField(actMonths, 'collObj');
                              const actCollAch = sumField(actMonths, 'collAchieved');
                              const actCollPct = actCollObj > 0 ? Math.round((actCollAch / actCollObj) * 100) : 0;
                              const actSalExp = sumField(actMonths, 'salaryExpense');
                              const actActAmt = sumField(actMonths, 'totActivityAmt');
                              const actTotExp = actSalExp + actActAmt;
                              const act6xExp = actTotExp * 6;
                              const actDiff = actSecAch - act6xExp;
                              const actIsPlus = actDiff >= 0;
                              const actDiffText = actTotExp > 0 ? (actIsPlus ? '+' + Math.round(actDiff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(actDiff)).toLocaleString('en-IN')) : '0';
                              const actRatioStr = actTotExp > 0 ? (actSecAch / actTotExp).toFixed(2) + 'x' : (actSecAch > 0 ? '—' : '0.00x');

                              // Combined / Grand Totals (Actuals + Projection)
                              const combDays = sumField(monthsList, 'daysWorked');
                              const combDr = sumField(monthsList, 'drVisits');
                              const combChem = sumField(monthsList, 'chemVisits');
                              const combCalls = sumField(monthsList, 'totCalls');
                              const combCallAvg = combDays > 0 ? (combCalls / combDays).toFixed(1) : '0.0';
                              const combPob = sumField(monthsList, 'pob');
                              const combSecObj = sumField(monthsList, 'secObj');
                              const combSecAch = sumField(monthsList, 'secAchieved');
                              const combSecPct = combSecObj > 0 ? Math.round((combSecAch / combSecObj) * 100) : 0;
                              const combCollObj = sumField(monthsList, 'collObj');
                              const combCollAch = sumField(monthsList, 'collAchieved');
                              const combCollPct = combCollObj > 0 ? Math.round((combCollAch / combCollObj) * 100) : 0;
                              const combSalExp = sumField(monthsList, 'salaryExpense');
                              const combActAmt = sumField(monthsList, 'totActivityAmt');
                              const combTotExp = combSalExp + combActAmt;
                              const comb6xExp = combTotExp * 6;
                              const combDiff = combSecAch - comb6xExp;
                              const combIsPlus = combDiff >= 0;
                              const combDiffText = combTotExp > 0 ? (combIsPlus ? '+' + Math.round(combDiff).toLocaleString('en-IN') : '-' + Math.round(Math.abs(combDiff)).toLocaleString('en-IN')) : '0';
                              const combRatioStr = combTotExp > 0 ? (combSecAch / combTotExp).toFixed(2) + 'x' : (combSecAch > 0 ? '—' : '0.00x');

                              return (
                                <tfoot>
                                  {/* Row 1: Actuals Subtotal */}
                                  <tr style={{ background: '#090e1a', borderTop: '2px solid #475569', fontWeight: 600 }}>
                                    <td style={{ padding: '6px 6px', textAlign: 'left', color: '#f8fafc', borderRight: '1px solid #334155', borderBottom: '1px solid #1e293b', fontWeight: 600 }}>
                                      {monthsList.length > 6 ? '📈 8-Mo. Actuals Subtotal' : '📈 5-Mo. Actuals Subtotal'}
                                    </td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>{actDays} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>d</span></td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{actDr.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#38bdf8', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{actChem.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{actCalls.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#38bdf8', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{actCallAvg}</td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actPob)}</td>
                                    <td style={{ padding: '6px 4px', color: '#38bdf8', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actSecObj)}</td>
                                    <td style={{ padding: '6px 4px', color: '#38bdf8', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actSecAch)}</td>
                                    <td style={{ padding: '6px 3px', textAlign: 'center', color: actSecPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 600, borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{actSecPct}%</td>
                                    <td style={{ padding: '6px 4px', color: '#34d399', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actCollObj)}</td>
                                    <td style={{ padding: '6px 4px', color: '#34d399', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actCollAch)}</td>
                                    <td style={{ padding: '6px 3px', textAlign: 'center', color: actCollPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 600, borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{actCollPct}%</td>
                                    <td style={{ padding: '6px 4px', color: '#fef08a', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actSalExp)}</td>
                                    <td style={{ padding: '6px 4px', color: '#fed7aa', borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actActAmt)}</td>
                                    <td style={{ padding: '6px 4px', color: '#fde047', borderRight: '1.5px solid #475569', borderBottom: '1px solid #1e293b' }}>{formatCurrency(actTotExp)}</td>
                                    <td style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '1px 5px', borderRadius: '4px', background: actIsPlus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${actIsPlus ? '#10b981' : '#ef4444'}` }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: actIsPlus ? '#34d399' : '#f87171' }}>{actDiffText}</span>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 500, color: actIsPlus ? '#a7f3d0' : '#fca5a5' }}>({actRatioStr})</span>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Row 2: Grand Total Taking Projection Also */}
                                  <tr style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)', borderTop: '2px solid #a855f7', fontWeight: 600 }}>
                                    <td style={{ padding: '6px 6px', textAlign: 'left', color: '#c084fc', borderRight: '1px solid #334155', fontWeight: 600 }}>
                                      {monthsList.length > 6 ? '🌟 9-Mo. Total (6 Mo. + 3 Mo. Plan)' : '🌟 6-Mo. Total (5 Actuals + 6th Plan)'}
                                    </td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b', whiteSpace: 'nowrap' }}>{combDays} <span style={{ fontSize: '0.62rem', color: '#c084fc' }}>d</span></td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b' }}>{combDr.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#c084fc', borderRight: '1px solid #1e293b' }}>{combChem.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1px solid #1e293b' }}>{combCalls.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '6px 4px', color: '#c084fc', borderRight: '1px solid #1e293b' }}>{combCallAvg}</td>
                                    <td style={{ padding: '6px 4px', color: '#ffffff', borderRight: '1.5px solid #475569' }}>{formatCurrency(combPob)}</td>
                                    <td style={{ padding: '6px 4px', color: '#c084fc', borderRight: '1px solid #1e293b' }}>{formatCurrency(combSecObj)}</td>
                                    <td style={{ padding: '6px 4px', color: '#c084fc', borderRight: '1px solid #1e293b' }}>{formatCurrency(combSecAch)}</td>
                                    <td style={{ padding: '6px 3px', textAlign: 'center', color: combSecPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 600, borderRight: '1.5px solid #475569' }}>{combSecPct}%</td>
                                    <td style={{ padding: '6px 4px', color: '#34d399', borderRight: '1px solid #1e293b' }}>{formatCurrency(combCollObj)}</td>
                                    <td style={{ padding: '6px 4px', color: '#34d399', borderRight: '1px solid #1e293b' }}>{formatCurrency(combCollAch)}</td>
                                    <td style={{ padding: '6px 3px', textAlign: 'center', color: combCollPct >= 85 ? '#34d399' : '#fbbf24', fontWeight: 600, borderRight: '1.5px solid #475569' }}>{combCollPct}%</td>
                                    <td style={{ padding: '6px 4px', color: '#fef08a', borderRight: '1px solid #1e293b' }}>{formatCurrency(combSalExp)}</td>
                                    <td style={{ padding: '6px 4px', color: '#fed7aa', borderRight: '1px solid #1e293b' }}>{formatCurrency(combActAmt)}</td>
                                    <td style={{ padding: '6px 4px', color: '#fde047', borderRight: '1.5px solid #475569' }}>{formatCurrency(combTotExp)}</td>
                                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '1px 5px', borderRadius: '4px', background: combIsPlus ? 'rgba(168, 85, 247, 0.25)' : 'rgba(239, 68, 68, 0.25)', border: `1px solid ${combIsPlus ? '#a855f7' : '#ef4444'}` }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: combIsPlus ? '#e9d5ff' : '#f87171' }}>{combDiffText}</span>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 500, color: combIsPlus ? '#d8b4fe' : '#fca5a5' }}>({combRatioStr})</span>
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              );
                            })()}
                          </table>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Section 2: 6 Parameters Dual Evaluation */}
              <div style={{ marginBottom: '22px' }}>
                {(() => {
                  const selfRatings: Record<string, any> = (selectedRecord.confirmationData as any)?.selfRatings || {};
                  const totalSelfScore: number | null = (selectedRecord.confirmationData as any)?.totalSelfScore !== undefined
                    ? Number((selectedRecord.confirmationData as any).totalSelfScore)
                    : (Object.keys(selfRatings).length > 0 ? Object.values(selfRatings).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : null);

                  const mgrRatings: Record<string, any> = (selectedRecord.confirmationData as any)?.managerRatings || {};
                  const totalMgrScore: number | null = (selectedRecord.confirmationData as any)?.totalManagerScore !== undefined
                    ? Number((selectedRecord.confirmationData as any).totalManagerScore)
                    : (Object.keys(mgrRatings).length > 0 ? Object.values(mgrRatings).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : null);
                  const finalGrade = (selectedRecord.confirmationData as any)?.finalGrade;

                  return (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '12px',
                        background: '#090e1a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        padding: '12px 18px'
                      }}>
                        <div>
                          <h4 style={{ color: '#38bdf8', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={19} /> Section 2: 100-Mark Dual-Evaluation Comparison
                          </h4>
                          <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '3px' }}>
                            Evaluation of Employee Self-Rating vs Reporting Manager Assessment across 6 Performance Pillars
                          </div>
                        </div>

                        {/* Dual Total Score Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {/* Total Self Rating Pill */}
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1.5px solid #0284c7',
                            borderRadius: '10px',
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Total Self Score:
                            </span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>
                              {totalSelfScore !== null ? totalSelfScore : 0}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>/ 100</span>
                          </div>

                          {/* Total Manager Score Pill */}
                          <div style={{
                            background: totalMgrScore !== null ? 'rgba(16, 185, 129, 0.12)' : 'rgba(51, 65, 85, 0.25)',
                            border: `1.5px solid ${totalMgrScore !== null ? '#10b981' : '#475569'}`,
                            borderRadius: '10px',
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Total Manager Score:
                            </span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: totalMgrScore !== null ? '#34d399' : '#94a3b8' }}>
                              {totalMgrScore !== null ? totalMgrScore : '—'}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>/ 100</span>
                            {finalGrade && (
                              <span style={{
                                marginLeft: '4px',
                                background: '#065f46',
                                color: '#a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 900
                              }}>
                                Grade {finalGrade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {PILLARS_CONFIG.map(pillar => {
                          const selfVal = selectedRecord.confirmationData?.selfRatings?.[pillar.id];
                          const mgrVal = selectedRecord.confirmationData?.managerRatings?.[pillar.id];

                          return (
                            <div key={pillar.id} style={{
                              background: '#090e1a',
                              border: '1px solid #334155',
                              borderRadius: '10px',
                              padding: '12px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}>
                              <div style={{ flex: '1 1 300px' }}>
                                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem' }}>{pillar.title}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '2px' }}>{pillar.desc}</div>
                              </div>

                              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                {/* Self Rating */}
                                <div style={{ textAlign: 'center', minWidth: '85px' }}>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Self Rating</div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                                    {selfVal !== undefined ? selfVal : '-'} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/{pillar.maxSelf}</span>
                                  </div>
                                </div>

                                {/* Manager Rating */}
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', paddingLeft: '20px', minWidth: '95px' }}>
                                  <div style={{ fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Manager Score</div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: mgrVal !== undefined ? '#34d399' : '#64748b', marginTop: '2px' }}>
                                    {mgrVal !== undefined ? mgrVal : '-'} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/{pillar.maxMgr}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Overall Cumulative Summary Row */}
                        <div style={{
                          background: 'linear-gradient(90deg, #090e1a 0%, #1e1b4b 100%)',
                          border: '1.5px solid #6366f1',
                          borderRadius: '10px',
                          padding: '14px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '14px',
                          marginTop: '4px'
                        }}>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🎯</span> Overall 100-Mark Dual Evaluation Cumulative Score
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>
                              Total cumulative score out of 100 benchmark points (Self vs Manager)
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', minWidth: '85px' }}>
                              <div style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800 }}>Total Self</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                                {totalSelfScore !== null ? totalSelfScore : 0} <span style={{ fontSize: '0.76rem', color: '#64748b' }}>/100</span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'center', borderLeft: '1px solid #4338ca', paddingLeft: '20px', minWidth: '95px' }}>
                              <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 800 }}>Total Manager</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: totalMgrScore !== null ? '#34d399' : '#64748b', marginTop: '2px' }}>
                                {totalMgrScore !== null ? totalMgrScore : '-'} <span style={{ fontSize: '0.76rem', color: '#64748b' }}>/100</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
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

                {/* DOC (Date of Confirmation) Effective Date Field */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#131b2e',
                  border: '1.5px solid #0284c7',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={18} color="#38bdf8" />
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem' }}>
                        DOC (Date of Confirmation)
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '2px' }}>
                        From this date employee will be considered as a Confirmed Employee
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700 }}>Effective DOC:</label>
                    <input
                      type="date"
                      value={confirmationDate}
                      onChange={(e) => setConfirmationDate(e.target.value)}
                      style={{
                        background: '#090e1a',
                        border: '1px solid #0284c7',
                        borderRadius: '8px',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        padding: '7px 12px',
                        outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '14px',
                  width: '100%',
                  marginTop: '4px'
                }}>
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>Confirm Employee &amp; Issue Confirmation Status</span>
                  </button>

                  <button
                    onClick={handleExtendProbation}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      background: '#1e293b',
                      color: '#fbbf24',
                      border: '1px solid #f59e0b',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  >
                    <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>⏳</span>
                    <span>Extend Probation by 3 Months</span>
                  </button>

                  <button
                    onClick={handleReleaseProcess}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      background: '#1e293b',
                      color: '#38bdf8',
                      border: '1px solid #0284c7',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  >
                    <RotateCcw size={15} style={{ flexShrink: 0 }} />
                    <span>Release Saved Process</span>
                  </button>
                </div>

                {/* Download Official Confirmation Letter with Letterhead & Stamp */}
                {(selectedRecord.confirmationStatus === 'confirmed' || selectedRecord.status === 'Confirmed Employee' || selectedRecord.confirmationData?.status === 'confirmed') && (
                  <div style={{ marginTop: '14px', borderTop: '1px dashed #334155', paddingTop: '14px' }}>
                    <a
                      href={`/api/admin/confirmation-letter-pdf?email=${encodeURIComponent(selectedRecord.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: '1px solid #38bdf8',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    >
                      <Download size={16} />
                      <span>Download / View Official Confirmation Letter (With Letterhead &amp; Stamp)</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
