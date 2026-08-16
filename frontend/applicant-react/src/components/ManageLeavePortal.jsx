import React, { useState, useEffect } from 'react';

const getFinancialYear = () => {
  const now = new Date();
  const calYear = now.getFullYear();
  const fyStart = now.getMonth() >= 3 ? calYear : calYear - 1;
  return `${fyStart}-${fyStart + 1}`;
};

const ManageLeavePortal = ({ applicant }) => {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [selectedBalanceId, setSelectedBalanceId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = applicant?.email;

  useEffect(() => {
    if (email) fetchData();
  }, [email]);

  const fetchData = async () => {
    try {
      const year = getFinancialYear();

      const [balRes, reqRes, typeRes] = await Promise.all([
        fetch(`/api/applicant/leave-balances?email=${encodeURIComponent(email)}&year=${year}`),
        fetch(`/api/applicant/leave-requests?email=${encodeURIComponent(email)}`),
        fetch('/api/admin/leave-types')
      ]);

      const [balData, reqData, typeData] = await Promise.all([
        balRes.json(), reqRes.json(), typeRes.json()
      ]);

      if (balData.success) setBalances(balData.balances);
      if (reqData.success) {
        const sorted = [...(reqData.requests || [])].sort(
          (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
        );
        setRequests(sorted);
      }
      if (typeData.success) setLeaveTypes(typeData.types || []);
    } catch (err) {
      console.error('Error fetching leave data', err);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    return Math.round(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const selectedBalance = balances.find(b => b._id === selectedBalanceId);
  const isLWP = selectedBalance
    ? selectedBalance.leaveTypeName.toLowerCase().includes('lwp') ||
      selectedBalance.leaveTypeName.toLowerCase().includes('leave without pay')
    : false;
  const remaining = selectedBalance
    ? (selectedBalance.assignedLeaves || 0) - (selectedBalance.usedLeaves || 0)
    : 0;
  const requestedDays = calculateDays(fromDate, toDate);
  const isOverBalance = !isLWP && requestedDays > remaining && requestedDays > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBalanceId || !fromDate || !toDate || !reason.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    if (requestedDays <= 0) {
      alert('End date must be on or after start date.');
      return;
    }
    if (isOverBalance) {
      alert(`You cannot apply for more than your available balance (${remaining} days).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applicant/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          leaveTypeId: selectedBalance.leaveTypeId,
          leaveBalanceId: selectedBalanceId,
          leaveTypeName: selectedBalance.leaveTypeName,
          fromDate,
          toDate,
          days: requestedDays,
          reason,
          year: getFinancialYear()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Leave request submitted successfully!');
        setFromDate('');
        setToDate('');
        setReason('');
        setSelectedBalanceId('');
        fetchData();
      } else {
        alert(data.message || 'Failed to submit leave request');
      }
    } catch (err) {
      alert('Error submitting leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
    if (s === 'rejected') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // ── Styles ──────────────────────────────────────────
  const card = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
  };

  const inputStyle = {
    height: '45px',
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#fff',
    borderRadius: '8px',
    padding: '0 12px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '7px',
    color: '#94a3b8',
    fontSize: '0.78rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  const sectionTitle = {
    margin: '0 0 18px 0',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ── */}
      <div>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: '700' }}>
          📅 Manage Leave
        </h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          Financial Year: {getFinancialYear()}
        </p>
      </div>

      {/* ── Balance Pills ── */}
      {balances.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {balances.map(b => {
            const lwp = b.leaveTypeName.toLowerCase().includes('lwp') || b.leaveTypeName.toLowerCase().includes('leave without pay');
            const rem = (b.assignedLeaves || 0) - (b.usedLeaves || 0);
            const pct = lwp ? 100 : b.assignedLeaves > 0 ? Math.max(0, (rem / b.assignedLeaves) * 100) : 0;
            const pillColor = lwp ? '#a855f7' : pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
            return (
              <div key={b._id} style={{
                background: '#1e293b',
                border: `1px solid ${pillColor}40`,
                borderRadius: '12px',
                padding: '12px 18px',
                minWidth: '150px',
                flex: '1',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{b.leaveTypeName}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: pillColor }}>
                  {lwp ? '∞' : rem}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {lwp ? 'Unlimited' : `of ${b.assignedLeaves} remaining`}
                </div>
                {!lwp && (
                  <div style={{ marginTop: '8px', height: '3px', background: '#334155', borderRadius: '2px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pillColor, borderRadius: '2px', transition: 'width 0.4s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Two Column Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: '20px',
        alignItems: 'start',
      }}
        className="leave-grid"
      >
        {/* ── Block 1: Apply for Leave ── */}
        <div style={card}>
          <h3 style={sectionTitle}>✍️ Apply for Leave</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Leave Type */}
            <div>
              <label style={labelStyle}>Leave Category</label>
              <select
                value={selectedBalanceId}
                onChange={e => setSelectedBalanceId(e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">— Select a leave type —</option>
                {balances.map(b => {
                  const lwp = b.leaveTypeName.toLowerCase().includes('lwp') || b.leaveTypeName.toLowerCase().includes('leave without pay');
                  const rem = (b.assignedLeaves || 0) - (b.usedLeaves || 0);
                  return (
                    <option key={b._id} value={b._id}>
                      {b.leaveTypeName} ({lwp ? 'Unlimited' : `${rem} days left`})
                    </option>
                  );
                })}
              </select>
              {selectedBalance && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#64748b' }}>Available:</span>
                  <strong style={{ color: isLWP ? '#a855f7' : isOverBalance ? '#ef4444' : '#10b981' }}>
                    {isLWP ? 'Unlimited (LWP — no deduction)' : `${remaining} days`}
                  </strong>
                </div>
              )}
            </div>

            {/* Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>To Date</label>
                <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            {/* Days Summary */}
            {fromDate && toDate && requestedDays > 0 && (
              <div style={{
                background: isOverBalance ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${isOverBalance ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.88rem',
                color: isOverBalance ? '#ef4444' : '#a5b4fc',
              }}>
                {isOverBalance
                  ? `⚠️ You are requesting ${requestedDays} days but only ${remaining} days are available.`
                  : `📆 Applying for ${requestedDays} day${requestedDays > 1 ? 's' : ''} of leave.`}
              </div>
            )}

            {/* Reason */}
            <div>
              <label style={labelStyle}>Reason for Leave</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Please provide a brief reason..."
                required
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '100%',
                  minHeight: '90px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isOverBalance}
              style={{
                background: isOverBalance ? '#334155' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: isOverBalance ? '#64748b' : '#fff',
                border: 'none',
                height: '45px',
                borderRadius: '8px',
                cursor: isSubmitting || isOverBalance ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.95rem',
                transition: 'opacity 0.2s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Submitting…' : '→ Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* ── Block 2: Leave History ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <h3 style={sectionTitle}>
            🗂️ My Leave Requests
            {requests.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
              }}>
                {requests.length} total
              </span>
            )}
          </h3>

          {requests.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '40px 0',
              color: '#475569',
            }}>
              <span style={{ fontSize: '2.5rem' }}>🌴</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No leave requests yet.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                    {['Leave Type', 'Duration', 'Days', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '8px 10px',
                        color: '#64748b',
                        fontWeight: '600',
                        textAlign: 'left',
                        borderBottom: '1px solid #334155',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => {
                    const ss = getStatusStyle(req.status);
                    return (
                      <tr key={req._id} style={{ borderBottom: '1px solid #1e2d3f', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', color: '#e2e8f0' }}>
                          <div style={{ fontWeight: '600' }}>{req.leaveTypeName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                            Applied {fmtDate(req.appliedAt)}
                          </div>
                        </td>
                        <td style={{ padding: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {fmtDate(req.fromDate)}<br />
                          <span style={{ color: '#475569', fontSize: '0.75rem' }}>to {fmtDate(req.toDate)}</span>
                        </td>
                        <td style={{ padding: '10px', color: '#fff', fontWeight: '700', textAlign: 'center' }}>
                          {req.days}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            background: ss.bg,
                            color: ss.color,
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                          }}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: Leave Definitions ── */}
      {leaveTypes.length > 0 && (
        <div style={{ ...card, background: 'rgba(15,23,42,0.6)' }}>
          <h3 style={{ ...sectionTitle, marginBottom: '20px' }}>
            📖 Understanding Your Leave Entitlements
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {leaveTypes.filter(t => t.status === 'Active').map(lt => {
              const lwp = lt.name?.toLowerCase().includes('lwp') || lt.name?.toLowerCase().includes('without pay');
              return (
                <div key={lt._id} style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#e2e8f0', fontSize: '0.95rem' }}>{lt.name}</span>
                    <span style={{
                      background: lt.isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: lt.isPaid ? '#10b981' : '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                    }}>
                      {lt.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                  }}>
                    {lt.description || (lwp
                      ? 'Leave taken beyond your paid entitlement. Salary is deducted for the days taken.'
                      : 'Please refer to your company leave policy for details on this leave type.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .leave-grid {
            grid-template-columns: 1fr !important;
          }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default ManageLeavePortal;
