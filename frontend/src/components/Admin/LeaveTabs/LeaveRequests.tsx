import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  employeeEmail: string;
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: string;
  appliedAt: string;
}

const LeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/leave-requests');
      if (res.data.success) {
        setRequests(res.data.requests.reverse());
      }
    } catch (e) {
      console.error('Error fetching leave requests', e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this leave request?`)) return;
    
    try {
      const res = await api.put(`/admin/leave-requests/${id}/status`, {
        status: newStatus,
        year: new Date().getFullYear().toString()
      });
      if (res.data.success) {
        alert(`Leave request ${newStatus.toLowerCase()} successfully!`);
        fetchRequests();
      } else {
        alert('Failed to update status');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Error updating status');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by email or leave type..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', height: '45px' }}
            />
          </div>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '150px', height: '45px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
            LEAVE REQUESTS ({filteredRequests.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
              <tr>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Employee</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Leave Type</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Dates</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Days</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Reason</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                      {req.employeeEmail}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Applied: {new Date(req.appliedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.leaveTypeName}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.fromDate} to {req.toDate}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{req.days}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
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
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {req.status === 'Pending' && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'Approved')}
                            className="btn btn-sm"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '5px 10px', fontSize: '0.85rem' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'Rejected')}
                            className="btn btn-sm"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '5px 10px', fontSize: '0.85rem' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;
