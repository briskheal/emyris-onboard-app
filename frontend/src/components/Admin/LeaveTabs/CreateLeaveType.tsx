import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { Trash2 } from 'lucide-react';

interface LeaveType {
    _id: string;
    name: string;
    code: string;
    description: string;
    isPaid: boolean;
    status: string;
}

const CreateLeaveType: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const res = await api.get('/admin/leave-types');
            if (res.data.success) {
                setLeaveTypes(res.data.types);
            }
        } catch (e) {
            console.error('Failed to fetch leave types', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLeaveType = async () => {
        if (!name.trim() || !code.trim()) {
            alert('Please fill the required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/admin/leave-types', {
                name,
                code,
                description,
                isPaid,
                status: 'Active'
            });

            if (res.data.success) {
                setLeaveTypes([...leaveTypes, res.data.type]);
                setName('');
                setCode('');
                setDescription('');
                setIsPaid(false);
            }
        } catch (e) {
            console.error('Error adding leave type', e);
            alert('Failed to add leave type.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this leave type?')) return;
        try {
            await api.delete(`/admin/leave-types/${id}`);
            setLeaveTypes(leaveTypes.filter(lt => lt._id !== id));
        } catch (e) {
            console.error('Error deleting leave type', e);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Form Section */}
            <div className="dash-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>ENTER LEAVE TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="text"
                            className="form-input"
                            style={{ minHeight: '45px' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter Leave Type"
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>ENTER CODE <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="text"
                            className="form-input"
                            style={{ minHeight: '45px' }}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter Code"
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>ENTER DESCRIPTION</label>
                        <input
                            type="text"
                            className="form-input"
                            style={{ minHeight: '45px' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter Remarks"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        PAID LEAVE
                    </label>

                    <button 
                        className="btn btn-primary" 
                        onClick={handleAddLeaveType}
                        disabled={submitting}
                        style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 2rem', minHeight: '45px' }}
                    >
                        {submitting ? 'Adding...' : 'Add Leave Type'}
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem' }}>SHOWING ({leaveTypes.length}) ENTRIES</h4>
                </div>
                
                <div className="table-responsive">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sr no.</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leave Types ↑</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Code ↑</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status ↑</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td>
                                </tr>
                            ) : leaveTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leave types found.</td>
                                </tr>
                            ) : (
                                leaveTypes.map((lt, index) => (
                                    <tr key={lt._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>{index + 1}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{lt.name}</td>
                                        <td style={{ padding: '1rem' }}>{lt.code}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                color: lt.isPaid ? '#10b981' : '#f59e0b',
                                                fontWeight: '600',
                                                fontSize: '0.85rem'
                                            }}>
                                                {lt.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.4' }}>
                                            {lt.description || '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button 
                                                onClick={() => handleDelete(lt._id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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

export default CreateLeaveType;
