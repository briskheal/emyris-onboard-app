import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ManageLeavePortalProps {
  email: string;
}

interface LeaveBalance {
  _id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  assignedLeaves: number;
  usedLeaves: number;
}

interface LeaveRequest {
  _id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
  appliedAt: string;
}

const ManageLeavePortal: React.FC<ManageLeavePortalProps> = ({ email }) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  
  const [selectedBalanceId, setSelectedBalanceId] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [email]);

  const fetchData = async () => {
    try {
      const year = new Date().getFullYear().toString();
      const balRes = await api.get(`/applicant/leave-balances?email=${email}&year=${year}`);
      if (balRes.data.success) {
        setBalances(balRes.data.balances);
      }

      const reqRes = await api.get(`/applicant/leave-requests?email=${email}`);
      if (reqRes.data.success) {
        setRequests(reqRes.data.requests.reverse());
      }
    } catch (e) {
      console.error('Failed to fetch leave data', e);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    
    // Calculate calendar days
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to make it inclusive
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await api.post('/applicant/leave-requests', {
        email,
        leaveTypeId: selectedBalance.leaveTypeId,
        leaveTypeName: selectedBalance.leaveTypeName,
        fromDate,
        toDate,
        days,
        reason,
        year: new Date().getFullYear().toString()
      });

      if (res.data.success) {
        alert('Leave request submitted successfully!');
        setFromDate('');
        setToDate('');
        setReason('');
        setSelectedBalanceId('');
        fetchData();
      } else {
        alert(res.data.message || 'Failed to submit leave request');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error submitting leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Approved': return <CheckCircle size={16} />;
      case 'Rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const selectedBalance = balances.find(b => b._id === selectedBalanceId);
  const remainingDays = selectedBalance ? (selectedBalance.assignedLeaves || 0) - (selectedBalance.usedLeaves || 0) : 0;
  const isLWP = selectedBalance ? (selectedBalance.leaveTypeName.toLowerCase().includes('leave without pay') || selectedBalance.leaveTypeName.toLowerCase().includes('lwp')) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="dash-card">
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={22} style={{ color: 'var(--primary)' }}/> Apply for Leave
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select Leave Category</label>
            <select 
              className="form-input" 
              value={selectedBalanceId} 
              onChange={e => setSelectedBalanceId(e.target.value)}
              style={{ height: '45px' }}
            >
              <option value="">-- Select Leave --</option>
              {balances.map(b => (
                <option key={b._id} value={b._id}>
                  {b.leaveTypeName} (Remaining: {b.assignedLeaves - b.usedLeaves})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>From Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ height: '45px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>To Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ height: '45px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Days Applied: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{calculateDays(fromDate, toDate)}</strong>
            </div>
            {selectedBalance && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Available Balance: </span>
                <strong style={{ color: isLWP ? '#10b981' : (calculateDays(fromDate, toDate) > remainingDays ? '#ef4444' : '#10b981') }}>
                  {isLWP ? 'Unlimited (LWP)' : remainingDays}
                </strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Reason for Leave</label>
            <textarea 
              className="form-input" 
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a valid reason..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: '45px', minWidth: '150px' }}>
              {isSubmitting ? 'Submitting...' : 'Apply Leave'}
            </button>
          </div>
        </form>
      </div>

      <div className="dash-card">
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          Leave History
        </h3>
        
        {requests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No leave requests found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                <tr>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Type</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Dates</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Days</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Reason</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.leaveTypeName}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.fromDate} to {req.toDate}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.days}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                      {req.reason}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px', 
                        background: `${getStatusColor(req.status)}20`, 
                        color: getStatusColor(req.status), 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 
                      }}>
                        {getStatusIcon(req.status)} {req.status}
                      </span>
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
