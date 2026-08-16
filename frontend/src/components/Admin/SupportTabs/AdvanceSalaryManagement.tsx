import React, { useState, useEffect } from 'react';
import { Trash2, Search, Eye, X } from 'lucide-react';
import api from '../../../api/client';

const AdvanceSalaryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assign');
  
  // Data States
  const [assignedAdvances, setAssignedAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form States - Assign Advance
  const [assignEmpEmail, setAssignEmpEmail] = useState('');
  const [assignNameOnPayslip, setAssignNameOnPayslip] = useState('Salary Advance');
  const [assignAdvanceAmount, setAssignAdvanceAmount] = useState('');
  const [assignInstallmentAmount, setAssignInstallmentAmount] = useState('');
  const [assignDeductionType, setAssignDeductionType] = useState('');
  const [assignDeductionMonth, setAssignDeductionMonth] = useState('');
  const [assignSanctionDate, setAssignSanctionDate] = useState('');
  
  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [searchEmployeeName, setSearchEmployeeName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showSearch, setShowSearch] = useState({ employeeName: false, status: false });
  const [viewAdv, setViewAdv] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  const inputBase = {
    height: '45px',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid #334155',
    color: '#fff',
    borderRadius: '8px',
    padding: '0 14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    fontSize: '0.9rem',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '7px',
    color: '#64748b',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, advRes] = await Promise.all([
        api.get('/admin/applicants'),
        api.get('/admin/assigned-advances')
      ]);
      if (empRes.data.success) {
        setEmployees(empRes.data.applicants || []);
      }
      if (advRes.data.success) setAssignedAdvances(advRes.data.advances);
    } catch (err) {
      console.error('Error fetching advance salary data', err);
    }
  };

  const handleAssignAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emp = employees.find(e => e.email === assignEmpEmail);
    try {
      const res = await api.post('/admin/assigned-advances', {
        employeeEmail: assignEmpEmail,
        employeeName: emp ? emp.fullName : assignEmpEmail,
        nameOnPayslip: assignNameOnPayslip,
        advanceAmount: assignAdvanceAmount,
        installmentAmount: assignInstallmentAmount,
        deductionType: assignDeductionType,
        deductionMonth: assignDeductionMonth,
        sanctionDate: assignSanctionDate
      });
      if (res.data.success) {
        alert('Advance Salary assigned successfully');
        setAssignEmpEmail('');
        setAssignNameOnPayslip('Salary Advance');
        setAssignAdvanceAmount('');
        setAssignInstallmentAmount('');
        setAssignDeductionType('');
        setAssignDeductionMonth('');
        setAssignSanctionDate('');
        fetchData();
      }
    } catch (err) {
      alert('Error assigning advance salary');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignedAdvance = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this salary advance?')) return;
    try {
      const res = await api.delete(`/admin/assigned-advances/${id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error deleting salary advance');
    }
  };

  const filteredAdvances = assignedAdvances.filter(a => {
    if (filterEmployee && a.employeeEmail !== filterEmployee) return false;
    if (searchEmployeeName && !a.employeeName?.toLowerCase().includes(searchEmployeeName.toLowerCase())) return false;
    if (searchStatus && !a.status?.toLowerCase().includes(searchStatus.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%', minHeight: '600px' }}>
      
      {/* LEFT SIDEBAR (Vertical Tabs) */}
      <div style={{
        width: '180px',
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            MANAGE SALARY ADVANCE
          </h3>
        </div>
        
        <div style={{ padding: '1rem 0' }}>
          {[
            { id: 'assign', label: 'ASSIGN ADVANCE' },
            { id: 'advances', label: 'SALARY ADVANCE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '12px 1.5rem',
                textAlign: 'left',
                background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* === ASSIGN ADVANCE TAB === */}
        {activeTab === 'assign' && (
          <div className="dash-card" style={{ flex: 1 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>&lt;</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>ASSIGN SALARY ADVANCE</h3>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleAssignAdvance} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                
                <div>
                  <label style={labelStyle}>EMPLOYEE NAME *</label>
                  <select style={inputBase} value={assignEmpEmail} onChange={e => setAssignEmpEmail(e.target.value)} required>
                    <option value="">Select Name</option>
                    {employees.map(emp => (
                      <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>NAME ON PAYSLIP *</label>
                  <input type="text" style={inputBase} value={assignNameOnPayslip} onChange={e => setAssignNameOnPayslip(e.target.value)} required />
                </div>

                <div>
                  <label style={labelStyle}>ADVANCE AMOUNT *</label>
                  <input type="number" style={inputBase} placeholder="Enter Amount" value={assignAdvanceAmount} onChange={e => setAssignAdvanceAmount(e.target.value)} required />
                </div>

                <div>
                  <label style={labelStyle}>INSTALLMENT AMOUNT *</label>
                  <input type="number" style={inputBase} placeholder="Enter Amount" value={assignInstallmentAmount} onChange={e => setAssignInstallmentAmount(e.target.value)} required />
                </div>

                <div>
                  <label style={labelStyle}>DEDUCTION TYPE</label>
                  <select style={inputBase} value={assignDeductionType} onChange={e => setAssignDeductionType(e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>DEDUCTION MONTH *</label>
                  <input type="month" style={inputBase} value={assignDeductionMonth} onChange={e => setAssignDeductionMonth(e.target.value)} required />
                </div>

                <div>
                  <label style={labelStyle}>ADVANCE SANCTION DATE *</label>
                  <input type="date" style={inputBase} value={assignSanctionDate} onChange={e => setAssignSanctionDate(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px', padding: '0 2.5rem' }}>
                    {loading ? 'Assigning...' : 'Assign Advance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* === SALARY ADVANCES LIST TAB === */}
        {activeTab === 'advances' && (
          <div className="dash-card" style={{ flex: 1 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>&lt;</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>SALARY ADVANCE</h3>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', width: '300px' }}>
                <label style={labelStyle}>SELECT EMPLOYEE</label>
                <select style={inputBase} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                  ))}
                </select>
              </div>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({filteredAdvances.length})</h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', border: '1px solid #334155' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSearch(p => ({...p, employeeName: !p.employeeName}))}>
                          <Search size={14} style={{ marginRight: '6px' }} /> EMPLOYEE NAME
                        </div>
                        {showSearch.employeeName && (
                          <input type="text" autoFocus placeholder="Search..." value={searchEmployeeName} onChange={e => setSearchEmployeeName(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
                        )}
                      </th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>PAYSLIP NAME</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>ADVANCE AMOUNT</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>AMOUNT PAID</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>BALANCE AMOUNT</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowSearch(p => ({...p, status: !p.status}))}>
                          <Search size={14} style={{ marginRight: '6px' }} /> STATUS
                        </div>
                        {showSearch.status && (
                          <input type="text" autoFocus placeholder="Search..." value={searchStatus} onChange={e => setSearchStatus(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
                        )}
                      </th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvances.map((adv) => (
                      <tr key={adv._id}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{adv.employeeName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{adv.nameOnPayslip}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{adv.advanceAmount}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{adv.amountPaid}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{adv.balanceAmount}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                          <span style={{ color: adv.status === 'Ongoing' ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {adv.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-sm" onClick={() => setViewAdv(adv)} style={{ background: 'transparent', color: '#10b981', padding: '4px' }}>
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-sm" onClick={() => handleDeleteAssignedAdvance(adv._id)} style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAdvances.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid #334155' }}>No salary advances found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewAdv && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1e293b', width: '100%', maxWidth: '600px', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Salary Advance Details</h3>
              <button onClick={() => setViewAdv(null)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Employee Name</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.employeeName}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sanction Date</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.sanctionDate}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Deduction Date</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.deductionDate}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Advance Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.advanceAmount}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount Paid</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.amountPaid}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Balance Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.balanceAmount}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Installment Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewAdv.installmentAmount}</div></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvanceSalaryManagement;
