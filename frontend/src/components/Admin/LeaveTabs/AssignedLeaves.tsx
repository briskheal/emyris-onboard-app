import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { Eye, Search } from 'lucide-react';

interface LeaveBalance {
    _id: string;
    employeeEmail: string;
    year: string;
    leaveTypeId: string;
    leaveTypeName: string;
    assignedLeaves: number;
    usedLeaves: number;
}

interface Applicant {
    _id: string;
    email: string;
    fullName: string;
}

interface AggregatedBalance {
    email: string;
    name: string;
    assigned: number;
    used: number;
    remaining: number;
}

const AssignedLeaves: React.FC = () => {
    // Generate years from 2024 to 2030 in YYYY-YYYY format
    const years = [];
    for (let i = 2024; i <= 2030; i++) {
        years.push(`${i}-${i + 1}`);
    }

    const currentYearStr = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const [selectedYear, setSelectedYear] = useState(currentYearStr);
    
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch balances for selected year
            const balRes = await api.get(`/admin/leave-balances?year=${selectedYear}`);
            if (balRes.data.success) {
                setBalances(balRes.data.balances || []);
            }
            
            // Fetch applicants for names mapping
            const appRes = await api.get('/admin/applicants?month=all&year=all');
            if (appRes.data.success) {
                setApplicants(appRes.data.applicants || []);
            }
        } catch (e) {
            console.error('Error fetching assigned leaves data:', e);
        } finally {
            setLoading(false);
        }
    };

    // Aggregate balances per employee
    const aggregatedMap = new Map<string, AggregatedBalance>();
    
    balances.forEach(b => {
        if (!aggregatedMap.has(b.employeeEmail)) {
            // Find name
            const app = applicants.find(a => a.email === b.employeeEmail);
            const name = app && app.fullName ? app.fullName : b.employeeEmail;
            
            aggregatedMap.set(b.employeeEmail, {
                email: b.employeeEmail,
                name: name,
                assigned: 0,
                used: 0,
                remaining: 0
            });
        }
        
        const agg = aggregatedMap.get(b.employeeEmail)!;
        agg.assigned += b.assignedLeaves || 0;
        agg.used += b.usedLeaves || 0;
        agg.remaining = agg.assigned - agg.used;
    });

    const aggregatedList = Array.from(aggregatedMap.values());
    
    // Filter by search term
    const filteredList = aggregatedList.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {/* Year Selector */}
            <div style={{ width: '200px' }}>
                <select 
                    className="form-input" 
                    style={{ minHeight: '45px', padding: '0.5rem 1rem', width: '100%', cursor: 'pointer' }}
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Table Card */}
            <div className="dash-card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        SHOWING ({filteredList.length}) ENTRIES
                    </h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Sr no.</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {showSearch ? (
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="Search name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onBlur={() => !searchTerm && setShowSearch(false)}
                                            style={{ 
                                                background: 'var(--glass-bg)', 
                                                border: '1px solid var(--glass-border)', 
                                                color: 'white', 
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                outline: 'none',
                                                width: '120px'
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <Search 
                                                size={14} 
                                                style={{ cursor: 'pointer', opacity: 0.7 }} 
                                                onClick={() => setShowSearch(true)} 
                                            />
                                            Employee Name
                                        </>
                                    )}
                                </th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Assigned Leaves</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Used Leaves</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Remaining Leaves</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No entries found for this year.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item, index) => (
                                    <tr key={item.email} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{item.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{item.assigned}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{item.used}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{item.remaining}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button 
                                                className="btn" 
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '5px', cursor: 'pointer' }}
                                                title="View Details"
                                                onClick={() => alert(`View details for ${item.name} (Coming Soon)`)}
                                            >
                                                <Eye size={18} />
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

export default AssignedLeaves;
