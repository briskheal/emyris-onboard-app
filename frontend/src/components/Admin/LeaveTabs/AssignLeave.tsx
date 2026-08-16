import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/client';
import { ChevronDown } from 'lucide-react';

interface LeaveType {
    _id: string;
    name: string;
}

interface Applicant {
    fullName: string;
    email: string;
    designation: string;
    profilePhoto?: string;
}

interface LeaveBalance {
    _id: string;
    year: string;
    leaveTypeName: string;
    assignedLeaves: number;
    usedLeaves: number;
}

const AssignLeave: React.FC = () => {
    const [years] = useState(['2025-2026', '2026-2027', '2027-2028', '2028-2029']);
    const [selectedYear, setSelectedYear] = useState('2026-2027');
    
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
    
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState('');
    
    const [numberOfLeaves, setNumberOfLeaves] = useState('');
    const [usedLeaves, setUsedLeaves] = useState('');
    
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loadingBalances, setLoadingBalances] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Custom Dropdown State
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLeaveTypes();
        fetchApplicants();
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setEmployeeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedEmployeeEmail) {
            fetchBalances(selectedEmployeeEmail);
        } else {
            setBalances([]);
        }
    }, [selectedEmployeeEmail]);

    const fetchLeaveTypes = async () => {
        try {
            const res = await api.get('/admin/leave-types');
            if (res.data.success) {
                setLeaveTypes(res.data.types.filter((t: any) => t.status === 'Active'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchApplicants = async () => {
        try {
            const res = await api.get('/admin/applicants?month=all&year=all');
            if (res.data.success) {
                setApplicants(res.data.applicants.filter((a: any) => a.fullName));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchBalances = async (email: string) => {
        setLoadingBalances(true);
        try {
            const res = await api.get(`/admin/leave-balances?email=${encodeURIComponent(email)}`);
            if (res.data.success) {
                setBalances(res.data.balances);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBalances(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeEmail || !selectedYear || !selectedLeaveTypeId || !numberOfLeaves) {
            alert('Please fill all required fields');
            return;
        }

        const leaveTypeName = leaveTypes.find(t => t._id === selectedLeaveTypeId)?.name || '';

        setSubmitting(true);
        try {
            const res = await api.post('/admin/leave-balances', {
                employeeEmail: selectedEmployeeEmail,
                year: selectedYear,
                leaveTypeId: selectedLeaveTypeId,
                leaveTypeName,
                assignedLeaves: numberOfLeaves,
                usedLeaves: usedLeaves || '0'
            });
            if (res.data.success) {
                alert('Leave assigned successfully');
                setNumberOfLeaves('');
                setUsedLeaves('');
                fetchBalances(selectedEmployeeEmail);
            } else {
                alert('Failed to assign leave');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedApplicant = applicants.find(a => a.email === selectedEmployeeEmail);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="dash-card" style={{ padding: '2rem', overflow: 'visible' }}>
                <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    
                    {/* Row 1: Year, Employee, Leave Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>SELECT YEAR <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className="form-input" style={{ minHeight: '48px', padding: '0.5rem 1rem' }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} required>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }} ref={dropdownRef}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>SELECT EMPLOYEE <span style={{ color: '#ef4444' }}>*</span></label>
                        <div 
                            className="form-input" 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: '48px', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
                            onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                        >
                            {selectedApplicant ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {selectedApplicant.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.95rem', lineHeight: '1.2' }}>{selectedApplicant.fullName}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{selectedApplicant.designation || 'Employee'}</span>
                                    </div>
                                </div>
                            ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Select Employee</span>
                            )}
                            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        
                        {employeeDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#0f172a', border: '1px solid var(--glass-border)', borderRadius: '8px', zIndex: 50, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                                {applicants.map(app => (
                                    <div 
                                        key={app.email}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
                                        onClick={() => {
                                            setSelectedEmployeeEmail(app.email);
                                            setEmployeeDropdownOpen(false);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', flexShrink: 0 }}>
                                            {app.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{app.fullName}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.designation || 'Employee'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>SELECT LEAVE TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className="form-input" style={{ minHeight: '48px', padding: '0.5rem 1rem' }} value={selectedLeaveTypeId} onChange={(e) => setSelectedLeaveTypeId(e.target.value)} required>
                                <option value="">Select Leave Type</option>
                                {leaveTypes.map(lt => <option key={lt._id} value={lt._id}>{lt.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Number of leaves and button */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>ENTER NUMBER OF LEAVES <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                className="form-input"
                                style={{ minHeight: '48px', padding: '0.5rem 1rem' }}
                                value={numberOfLeaves}
                                onChange={(e) => setNumberOfLeaves(e.target.value)}
                                placeholder="Enter Number of Leaves"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>USED LEAVES (OPTIONAL) <span style={{ color: '#ef4444' }}></span></label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                className="form-input"
                                style={{ minHeight: '48px', padding: '0.5rem 1rem' }}
                                value={usedLeaves}
                                onChange={(e) => setUsedLeaves(e.target.value)}
                                placeholder="E.g. Old db used leaves"
                            />
                        </div>

                        <div>
                            <button type="submit" className="btn btn-primary" style={{ minHeight: '48px', width: '100%' }} disabled={submitting}>
                                {submitting ? 'Assigning...' : 'Assign Leave'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Table Section */}
            <div className="dash-card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        SHOWING ({balances.length}) ENTRIES
                    </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sr no.</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Year &uarr;</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leave Types &uarr;</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Leaves</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Used Leaves</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Remaining Leaves</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingBalances ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading balances...</td>
                                </tr>
                            ) : balances.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{selectedEmployeeEmail ? 'No leaves assigned for this employee.' : 'Please select an employee to view their assigned leaves.'}</td>
                                </tr>
                            ) : (
                                balances.map((bal, index) => (
                                    <tr key={bal._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>{index + 1}</td>
                                        <td style={{ padding: '1rem' }}>{bal.year}</td>
                                        <td style={{ padding: '1rem' }}>{bal.leaveTypeName}</td>
                                        <td style={{ padding: '1rem' }}>{bal.assignedLeaves}</td>
                                        <td style={{ padding: '1rem' }}>{bal.usedLeaves}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{bal.assignedLeaves - bal.usedLeaves}</td>
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

export default AssignLeave;
