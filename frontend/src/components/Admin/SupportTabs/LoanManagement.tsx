import React, { useState, useEffect } from 'react';
import { Trash2, Search, Eye, X } from 'lucide-react';
import api from '../../../api/client';

const LoanManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');
  
  // Data States
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [assignedLoans, setAssignedLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form States - Create Loan
  const [loanName, setLoanName] = useState('');
  const [loanType, setLoanType] = useState('');
  const [interestRate, setInterestRate] = useState('');
  
  // Form States - Assign Loan
  const [assignEmpEmail, setAssignEmpEmail] = useState('');
  const [assignLoanName, setAssignLoanName] = useState('');
  const [assignInterestRate, setAssignInterestRate] = useState('');
  const [assignNameOnPayslip, setAssignNameOnPayslip] = useState('Loan');
  const [assignLoanAmount, setAssignLoanAmount] = useState('');
  const [assignInstallmentAmount, setAssignInstallmentAmount] = useState('');
  const [assignDeductionType, setAssignDeductionType] = useState('');
  const [assignDeductionDate, setAssignDeductionDate] = useState('');
  const [assignSanctionDate, setAssignSanctionDate] = useState('');
  
  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [searchTypeLoanName, setSearchTypeLoanName] = useState('');
  const [searchLoanName, setSearchLoanName] = useState('');
  const [searchEmployeeName, setSearchEmployeeName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showSearch, setShowSearch] = useState({ typeLoanName: false, loanName: false, employeeName: false, status: false });
  const [viewLoan, setViewLoan] = useState<any>(null);
  
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
      const [empRes, typesRes, loansRes] = await Promise.all([
        api.get('/admin/applicants'),
        api.get('/admin/loan-types'),
        api.get('/admin/assigned-loans')
      ]);
      if (empRes.data.success) {
        setEmployees(empRes.data.applicants || []);
      }
      if (typesRes.data.success) setLoanTypes(typesRes.data.types);
      if (loansRes.data.success) setAssignedLoans(loansRes.data.loans);
    } catch (err) {
      console.error('Error fetching loan data', err);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/loan-types', {
        name: loanName,
        type: loanType,
        interestRate: interestRate
      });
      if (res.data.success) {
        alert('Loan type created successfully');
        setLoanName('');
        setLoanType('');
        setInterestRate('');
        fetchData();
      }
    } catch (err) {
      alert('Error creating loan type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoanType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan type?')) return;
    try {
      const res = await api.delete(`/admin/loan-types/${id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error deleting loan type');
    }
  };

  const handleDeleteAssignedLoan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assigned loan?')) return;
    try {
      const res = await api.delete(`/admin/assigned-loans/${id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error deleting assigned loan');
    }
  };

  const handleAssignLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emp = employees.find(e => e.email === assignEmpEmail);
    try {
      const res = await api.post('/admin/assigned-loans', {
        employeeEmail: assignEmpEmail,
        employeeName: emp ? emp.fullName : assignEmpEmail,
        loanName: assignLoanName,
        interestRate: assignInterestRate,
        nameOnPayslip: assignNameOnPayslip,
        loanAmount: assignLoanAmount,
        installmentAmount: assignInstallmentAmount,
        deductionType: assignDeductionType,
        deductionDate: assignDeductionDate,
        sanctionDate: assignSanctionDate
      });
      if (res.data.success) {
        alert('Loan assigned successfully');
        setAssignEmpEmail('');
        setAssignLoanName('');
        setAssignInterestRate('');
        setAssignNameOnPayslip('Loan');
        setAssignLoanAmount('');
        setAssignInstallmentAmount('');
        setAssignDeductionType('');
        setAssignDeductionDate('');
        setAssignSanctionDate('');
        fetchData();
      }
    } catch (err) {
      alert('Error assigning loan');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill interest rate when loan name is selected
  useEffect(() => {
    if (assignLoanName) {
      const type = loanTypes.find(t => t.name === assignLoanName);
      if (type) {
        setAssignInterestRate(type.interestRate.toString());
      }
    }
  }, [assignLoanName, loanTypes]);

  const filteredLoans = assignedLoans.filter(l => {
    if (filterEmployee && l.employeeEmail !== filterEmployee) return false;
    if (searchLoanName && !l.loanName?.toLowerCase().includes(searchLoanName.toLowerCase())) return false;
    if (searchEmployeeName && !l.employeeName?.toLowerCase().includes(searchEmployeeName.toLowerCase())) return false;
    if (searchStatus && !l.status?.toLowerCase().includes(searchStatus.toLowerCase())) return false;
    return true;
  });

  const filteredLoanTypes = loanTypes.filter(t => {
    if (searchTypeLoanName && !t.name?.toLowerCase().includes(searchTypeLoanName.toLowerCase())) return false;
    return true;
  });

  const generateSchedule = (totalAmount: number, installmentAmount: number, amountPaid: number, startDateStr: string, deductionType: string) => {
    if (!totalAmount || !installmentAmount || !startDateStr) return [];
    const schedule = [];
    const numInstallments = Math.ceil(totalAmount / installmentAmount);
    let currentPaid = amountPaid || 0;
    
    let currentDate = new Date(startDateStr);
    if (isNaN(currentDate.getTime())) return [];

    for (let i = 0; i < numInstallments; i++) {
      const instAmount = Math.min(installmentAmount, totalAmount - (i * installmentAmount));
      let status = 'Pending';
      
      if (currentPaid >= instAmount) {
        status = 'Paid';
        currentPaid -= instAmount;
      } else if (currentPaid > 0) {
        status = `Partial (${Math.round(currentPaid)})`;
        currentPaid -= currentPaid;
      }

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const period = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      
      schedule.push({
        period,
        installment: Math.round(instAmount),
        status
      });

      if (deductionType === 'Quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    return schedule;
  };

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
            MANAGE LOAN
          </h3>
        </div>
        
        <div style={{ padding: '1rem 0' }}>
          {[
            { id: 'create', label: 'CREATE LOAN' },
            { id: 'assign', label: 'ASSIGN LOAN' },
            { id: 'loans', label: 'LOANS' }
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
        
        {/* === CREATE LOAN TAB === */}
        {activeTab === 'create' && (
          <div className="dash-card" style={{ flex: 1 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>&lt;</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>CREATE LOAN</h3>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleCreateLoan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1.5rem', alignItems: 'end', marginBottom: '3rem' }}>
                <div>
                  <label style={labelStyle}>LOAN NAME *</label>
                  <input type="text" style={inputBase} placeholder="Enter Loan Name" value={loanName} onChange={e => setLoanName(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>LOAN TYPE *</label>
                  <select style={inputBase} value={loanType} onChange={e => setLoanType(e.target.value)} required>
                    <option value="">Select Type</option>
                    <option value="Interest Free Loan">Interest Free Loan</option>
                    <option value="Concessional Loan">Concessional Loan</option>
                    <option value="Loan at Market Rate">Loan at Market Rate</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>INTEREST RATE</label>
                  <input type="number" style={inputBase} placeholder="Enter Interest Rate (%)" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                </div>
                <div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px', padding: '0 2rem', width: '100%' }}>
                    {loading ? 'Adding...' : 'Add Loan'}
                  </button>
                </div>
              </form>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({loanTypes.length})</h4>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', border: '1px solid #334155' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSearch(p => ({...p, typeLoanName: !p.typeLoanName}))}>
                        <Search size={14} style={{ marginRight: '6px' }} /> LOAN NAME
                      </div>
                      {showSearch.typeLoanName && (
                        <input type="text" autoFocus placeholder="Search..." value={searchTypeLoanName} onChange={e => setSearchTypeLoanName(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
                      )}
                    </th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>INTEREST RATE</th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoanTypes.map((type) => (
                    <tr key={type._id}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{type.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #334155' }}>{type.interestRate} %</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                        <button className="btn btn-sm" onClick={() => handleDeleteLoanType(type._id)} style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loanTypes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid #334155' }}>No loan types created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === ASSIGN LOAN TAB === */}
        {activeTab === 'assign' && (
          <div className="dash-card" style={{ flex: 1 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>&lt;</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>ASSIGN LOAN</h3>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleAssignLoan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>EMPLOYEE NAME *</label>
                  <select style={inputBase} value={assignEmpEmail} onChange={e => setAssignEmpEmail(e.target.value)} required>
                    <option value="">Select Name</option>
                    {employees.map(emp => (
                      <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>LOAN NAME *</label>
                  <select style={inputBase} value={assignLoanName} onChange={e => setAssignLoanName(e.target.value)} required>
                    <option value="">Select Name</option>
                    {loanTypes.map(t => (
                      <option key={t._id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>INTEREST RATE</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" style={{...inputBase, paddingLeft: '2rem'}} value={assignInterestRate} onChange={e => setAssignInterestRate(e.target.value)} />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>NAME ON PAYSLIP</label>
                  <input type="text" style={inputBase} value={assignNameOnPayslip} onChange={e => setAssignNameOnPayslip(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>LOAN AMOUNT *</label>
                  <input type="number" style={inputBase} placeholder="Enter Amount" value={assignLoanAmount} onChange={e => setAssignLoanAmount(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>INSTAL AMNT *</label>
                  <input type="number" style={inputBase} placeholder="Enter Amount" value={assignInstallmentAmount} onChange={e => setAssignInstallmentAmount(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>DEDUCTION TYPE</label>
                  <select style={inputBase} value={assignDeductionType} onChange={e => setAssignDeductionType(e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>DEDUCTION DATE</label>
                  <input type="date" style={inputBase} value={assignDeductionDate} onChange={e => setAssignDeductionDate(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={labelStyle}>LOAN SANCTION DATE *</label>
                  <input type="date" style={inputBase} value={assignSanctionDate} onChange={e => setAssignSanctionDate(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 4', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '45px', padding: '0 2.5rem' }}>
                    {loading ? 'Assigning...' : 'Assign Loan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* === LOANS LIST TAB === */}
        {activeTab === 'loans' && (
          <div className="dash-card" style={{ flex: 1 }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>&lt;</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>LOAN</h3>
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

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({filteredLoans.length})</h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', border: '1px solid #334155' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSearch(p => ({...p, loanName: !p.loanName}))}>
                          <Search size={14} style={{ marginRight: '6px' }} /> LOAN NAME
                        </div>
                        {showSearch.loanName && (
                          <input type="text" autoFocus placeholder="Search..." value={searchLoanName} onChange={e => setSearchLoanName(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
                        )}
                      </th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSearch(p => ({...p, employeeName: !p.employeeName}))}>
                          <Search size={14} style={{ marginRight: '6px' }} /> EMPLOYEE NAME
                        </div>
                        {showSearch.employeeName && (
                          <input type="text" autoFocus placeholder="Search..." value={searchEmployeeName} onChange={e => setSearchEmployeeName(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
                        )}
                      </th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>LOAN AMOUNT</th>
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
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{loan.loanName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{loan.employeeName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{loan.loanAmount}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{loan.amountPaid}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right', border: '1px solid #334155' }}>{loan.balanceAmount}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                          <span style={{ color: loan.status === 'Ongoing' ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {loan.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-sm" onClick={() => setViewLoan(loan)} style={{ background: 'transparent', color: '#10b981', padding: '4px' }}>
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-sm" onClick={() => handleDeleteAssignedLoan(loan._id)} style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid #334155' }}>No loans found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewLoan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1e293b', width: '100%', maxWidth: '600px', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Loan Details</h3>
              <button onClick={() => setViewLoan(null)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Employee Name</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.employeeName}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loan Sanction Date</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.sanctionDate}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loan Deduction Date</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.deductionDate}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loan Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.loanAmount}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interest Rate</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.interestRate}%</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount Paid</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.amountPaid}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Balance Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.balanceAmount}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Installment Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.installmentAmount}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Taxable Amount</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>0</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Next Installment Date</span><div style={{ fontWeight: 'bold', marginTop: '4px' }}>{viewLoan.deductionDate}</div></div>
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid #334155' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold' }}>Repayment Schedule</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', border: '1px solid #334155' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.8rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>PERIOD</th>
                      <th style={{ padding: '0.8rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>INSTALLMENT</th>
                      <th style={{ padding: '0.8rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>STATUS</th>
                      <th style={{ padding: '0.8rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateSchedule(viewLoan.loanAmount, viewLoan.installmentAmount, viewLoan.amountPaid, viewLoan.deductionDate, viewLoan.deductionType).map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px solid #334155' }}>{row.period}</td>
                        <td style={{ padding: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px solid #334155' }}>{row.installment}</td>
                        <td style={{ padding: '0.8rem', fontSize: '0.85rem', border: '1px solid #334155', color: row.status === 'Paid' ? '#10b981' : row.status === 'Pending' ? '#f59e0b' : '#3b82f6' }}>{row.status}</td>
                        <td style={{ padding: '0.8rem', border: '1px solid #334155', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{row.status !== 'Paid' ? 'Pending' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
