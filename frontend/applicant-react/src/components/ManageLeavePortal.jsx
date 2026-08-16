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
  const [historyFilter, setHistoryFilter] = useState('All');

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
    if (requestedDays <= 0) { alert('End date must be on or after start date.'); return; }
    if (isOverBalance) { alert(`You cannot apply for more than your available balance (${remaining} days).`); return; }

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
          fromDate, toDate,
          days: requestedDays,
          reason,
          year: getFinancialYear()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Leave request submitted successfully!');
        setFromDate(''); setToDate(''); setReason(''); setSelectedBalanceId('');
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
    if (s === 'approved') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981', dot: '#10b981' };
    if (s === 'rejected') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', dot: '#ef4444' };
    if (s === 'revoked') return { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', dot: '#8b5cf6' };
    return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dot: '#f59e0b' };
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Revoked: requests.filter(r => r.status === 'Revoked').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  const filteredRequests = historyFilter === 'All'
    ? requests
    : requests.filter(r => r.status === historyFilter);

  const inputBase = {
    height: '45px',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid #334155',
    color: '#fff',
    borderRadius: '8px',
    padding: '0 14px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '7px',
    color: '#64748b',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowX: 'hidden', maxWidth: '100%' }}>

      {/* ── PANORAMIC HEADER BAND ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #162032 100%)',
        border: '1px solid #334155',
        borderRadius: '18px',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orb */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '180px', height: '180px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>
              📅 Manage Leave
            </h2>
            <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.82rem' }}>
              {applicant?.fullName || 'Employee'} &nbsp;·&nbsp; FY {getFinancialYear()}
            </p>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '0.8rem',
            color: '#a5b4fc',
            fontWeight: '600',
          }}>
            {balances.reduce((acc, b) => {
              const lwp = b.leaveTypeName.toLowerCase().includes('lwp') || b.leaveTypeName.toLowerCase().includes('leave without pay');
              return lwp ? acc : acc + (b.assignedLeaves - (b.usedLeaves || 0));
            }, 0)} paid days remaining
          </div>
        </div>

        {/* Balance bars */}
        {balances.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}>
            {balances.map(b => {
              const lwp = b.leaveTypeName.toLowerCase().includes('lwp') || b.leaveTypeName.toLowerCase().includes('leave without pay');
              const used = b.usedLeaves || 0;
              const total = b.assignedLeaves || 0;
              const rem = total - used;
              const pct = lwp ? 100 : total > 0 ? Math.max(0, (rem / total) * 100) : 0;
              const color = lwp ? '#a855f7' : pct > 60 ? '#10b981' : pct > 25 ? '#f59e0b' : '#ef4444';
              return (
                <div key={b._id} style={{
                  minWidth: '160px',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: `1px solid ${color}25`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{b.leaveTypeName}</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color }}>
                      {lwp ? '∞' : rem}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}99, ${color})`,
                      borderRadius: '3px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  {!lwp && (
                    <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#475569' }}>
                      {used} used &nbsp;·&nbsp; {total} total
                    </div>
                  )}
                  {lwp && (
                    <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#475569' }}>
                      Unpaid · No limit
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TWO EQUAL-HEIGHT COLUMNS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: '20px',
        alignItems: 'stretch',
      }} className="leave-grid">

        {/* ── LEFT: Apply for Leave ── */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderLeft: '3px solid #6366f1',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'rgba(99,102,241,0.15)', padding: '5px 8px', borderRadius: '8px', fontSize: '1rem' }}>✍️</span>
            Apply for Leave
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

            {/* Leave Category */}
            <div>
              <label style={labelStyle}>Leave Category</label>
              <select value={selectedBalanceId} onChange={e => setSelectedBalanceId(e.target.value)} style={inputBase} required>
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
                  <span style={{ color: '#475569' }}>Balance:</span>
                  <strong style={{ color: isLWP ? '#a855f7' : isOverBalance ? '#ef4444' : '#10b981' }}>
                    {isLWP ? 'Unlimited (LWP)' : `${remaining} days available`}
                  </strong>
                </div>
              )}
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputBase} required />
              </div>
              <div>
                <label style={labelStyle}>To Date</label>
                <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} style={inputBase} required />
              </div>
            </div>

            {/* Days indicator */}
            {fromDate && toDate && requestedDays > 0 && (
              <div style={{
                background: isOverBalance ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${isOverBalance ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.88rem',
                color: isOverBalance ? '#ef4444' : '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{isOverBalance ? '⚠️' : '📆'}</span>
                {isOverBalance
                  ? `Requesting ${requestedDays} days but only ${remaining} available.`
                  : `Applying for ${requestedDays} day${requestedDays > 1 ? 's' : ''} of leave.`}
              </div>
            )}

            {/* Reason */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Reason for Leave</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Briefly describe your reason..."
                required
                style={{
                  flex: 1,
                  minHeight: '90px',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isOverBalance}
              style={{
                background: isOverBalance
                  ? '#1e293b'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: isOverBalance ? '#475569' : '#fff',
                border: isOverBalance ? '1px solid #334155' : 'none',
                height: '48px',
                borderRadius: '10px',
                cursor: isSubmitting || isOverBalance ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'auto',
                transition: 'opacity 0.2s, transform 0.15s',
                opacity: isSubmitting ? 0.7 : 1,
                letterSpacing: '0.03em',
              }}
              onMouseEnter={e => { if (!isOverBalance && !isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isSubmitting ? '⏳ Submitting…' : '→ Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* ── RIGHT: My Leave Requests ── */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderLeft: '3px solid #10b981',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: 'rgba(16,185,129,0.12)', padding: '5px 8px', borderRadius: '8px', fontSize: '1rem' }}>🗂️</span>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: '700' }}>My Leave Requests</h3>
            <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(16,185,129,0.2)' }}>
              {requests.length} total
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {['All', 'Pending', 'Approved', 'Revoked', 'Rejected'].map(f => {
              const isActive = historyFilter === f;
              const filterColors = {
                All: '#6366f1', Pending: '#f59e0b', Approved: '#10b981', Revoked: '#8b5cf6', Rejected: '#ef4444'
              };
              const fc = filterColors[f];
              return counts[f] > 0 || f === 'All' ? (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  style={{
                    background: isActive ? `${fc}20` : 'transparent',
                    color: isActive ? fc : '#475569',
                    border: `1px solid ${isActive ? `${fc}40` : '#334155'}`,
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {f} {counts[f] > 0 && <span style={{ opacity: 0.8 }}>({counts[f]})</span>}
                </button>
              ) : null;
            })}
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#334155' }}>
              <span style={{ fontSize: '3rem' }}>🌴</span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>No {historyFilter !== 'All' ? historyFilter.toLowerCase() : ''} leave requests.</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                    {['Leave Type', 'Duration', 'Days', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: '#475569', fontWeight: '700', textAlign: 'left', borderBottom: '1px solid #334155', whiteSpace: 'nowrap', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, i) => {
                    const ss = getStatusStyle(req.status);
                    return (
                      <tr key={req._id} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.85rem' }}>{req.leaveTypeName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '2px' }}>
                            {fmtDate(req.appliedAt)}
                          </div>
                        </td>
                        <td style={{ padding: '10px', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {fmtDate(req.fromDate)} → {fmtDate(req.toDate)}
                        </td>
                        <td style={{ padding: '10px', color: '#fff', fontWeight: '800', textAlign: 'center' }}>{req.days}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: ss.bg, color: ss.color,
                            padding: '3px 9px', borderRadius: '20px',
                            fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap',
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
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

      {/* ── LEAVE ENTITLEMENTS FOOTER ── */}
      {leaveTypes.filter(t => t.status === 'Active').length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1a2540)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{ background: 'rgba(245,158,11,0.12)', padding: '5px 8px', borderRadius: '8px', fontSize: '1rem' }}>📖</span>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: '700' }}>
              Understanding Your Leave Entitlements
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#334155' }}>swipe to see more →</span>
          </div>

          <div style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '8px',
            WebkitOverflowScrolling: 'touch',
          }} className="leave-defs-scroll">
            {leaveTypes.filter(t => t.status === 'Active').map(lt => {
              const lwp = lt.name?.toLowerCase().includes('lwp') || lt.name?.toLowerCase().includes('without pay');
              return (
                <div
                  key={lt._id}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '18px',
                    minWidth: '220px',
                    maxWidth: '270px',
                    flexShrink: 0,
                    transition: 'transform 0.2s, border-color 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#475569';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#334155';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#e2e8f0', fontSize: '0.92rem' }}>{lt.name}</span>
                    <span style={{
                      background: lt.isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                      color: lt.isPaid ? '#10b981' : '#ef4444',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '800',
                    }}>
                      {lt.isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    {lt.description || (lwp
                      ? 'Leave taken beyond paid entitlement. Salary deducted for days taken.'
                      : 'Refer to your company leave policy for details on this leave type.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .leave-grid { grid-template-columns: 1fr !important; }
        }
        .leave-defs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .leave-defs-scroll::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
        select option { background-color: #1e293b !important; color: #fff !important; }
        @media (max-width: 768px) {
          table { font-size: 0.75rem !important; }
          table td, table th { padding: 6px 5px !important; }
        }
      `}</style>
    </div>
  );
};

export default ManageLeavePortal;
