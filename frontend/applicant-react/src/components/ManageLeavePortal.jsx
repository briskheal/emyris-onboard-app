import React, { useState, useEffect } from 'react';

const ManageLeavePortal = ({ applicant }) => {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [selectedBalanceId, setSelectedBalanceId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = applicant?.email;

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [email]);

  const fetchData = async () => {
    try {
      const now = new Date();
      const calYear = now.getFullYear();
      const month = now.getMonth(); // 0-indexed, April = 3
      const fyStart = month >= 3 ? calYear : calYear - 1;
      const year = `${fyStart}-${fyStart + 1}`;
      const balRes = await fetch(`/api/applicant/leave-balances?email=${encodeURIComponent(email)}&year=${year}`);
      const balData = await balRes.json();
      if (balData.success) {
        setBalances(balData.balances);
      }

      const reqRes = await fetch(`/api/applicant/leave-requests?email=${encodeURIComponent(email)}`);
      const reqData = await reqRes.json();
      if (reqData.success) {
        setRequests(reqData.requests);
      }
    } catch (err) {
      console.error('Error fetching leave data', err);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBalanceId || !fromDate || !toDate || !reason) {
      alert('Please fill out all fields.');
      return;
    }

    const selectedBalance = balances.find(b => b._id === selectedBalanceId);
    if (!selectedBalance) return;

    const days = calculateDays(fromDate, toDate);
    if (days <= 0) {
      alert('End date must be after or equal to start date.');
      return;
    }

    const isLWP = selectedBalance.leaveTypeName.toLowerCase().includes('leave without pay') || 
                  selectedBalance.leaveTypeName.toLowerCase().includes('lwp');
    const remaining = (selectedBalance.assignedLeaves || 0) - (selectedBalance.usedLeaves || 0);

    if (!isLWP && days > remaining) {
      alert(`You cannot apply for more than your available balance (${remaining} days).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applicant/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          leaveBalanceId: selectedBalanceId,
          leaveTypeName: selectedBalance.leaveTypeName,
          fromDate,
          toDate,
          days,
          reason
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
      console.error(err);
      alert('Error submitting leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBalance = balances.find(b => b._id === selectedBalanceId);
  const remainingDays = selectedBalance ? (selectedBalance.assignedLeaves || 0) - (selectedBalance.usedLeaves || 0) : 0;
  const isLWP = selectedBalance ? (selectedBalance.leaveTypeName.toLowerCase().includes('leave without pay') || selectedBalance.leaveTypeName.toLowerCase().includes('lwp')) : false;

  const inputStyle = {
    height: '45px',
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#fff',
    borderRadius: '8px',
    padding: '0 12px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const textareaStyle = {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    minHeight: '100px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '26px' }}>
        <h3 style={{ marginTop: 0, color: '#fff', marginBottom: '20px' }}>Apply for Leave</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Leave Category</label>
            <select 
              value={selectedBalanceId} 
              onChange={(e) => setSelectedBalanceId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select a leave type</option>
              {balances.map(b => (
                <option key={b._id} value={b._id}>
                  {b.leaveTypeName} (Remaining: {b.leaveTypeName.toLowerCase().includes('lwp') ? 'Unlimited' : (b.assignedLeaves - (b.usedLeaves || 0))})
                </option>
              ))}
            </select>
            {selectedBalance && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Available Balance: </span>
                <strong style={{ color: isLWP ? '#10b981' : (calculateDays(fromDate, toDate) > remainingDays ? '#ef4444' : '#10b981') }}>
                  {isLWP ? 'Unlimited (LWP)' : remainingDays}
                </strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>From Date</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>To Date</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          {fromDate && toDate && (
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
              Applying for: <strong style={{ color: '#fff' }}>{calculateDays(fromDate, toDate)} days</strong>
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Reason</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for your leave request..."
              style={textareaStyle}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              marginTop: '10px',
              height: '45px',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '26px' }}>
        <h3 style={{ marginTop: 0, color: '#fff', marginBottom: '20px' }}>My Leave Requests</h3>
        {requests.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No leave requests found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Leave Type</th>
                  <th style={{ padding: '12px 8px' }}>Duration</th>
                  <th style={{ padding: '12px 8px' }}>Days</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px 8px', color: '#fff' }}>{req.leaveTypeName}</td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>
                      {new Date(req.fromDate).toLocaleDateString()} - {new Date(req.toDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#fff' }}>{req.days}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: req.status === 'approved' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#f59e0b'
                      }}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>
                      {new Date(req.appliedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLeavePortal;
