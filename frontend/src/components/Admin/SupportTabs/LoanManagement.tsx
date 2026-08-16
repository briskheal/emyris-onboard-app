import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
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

  const filteredLoans = filterEmployee
    ? assignedLoans.filter(l => l.employeeEmail === filterEmployee)
    : assignedLoans;

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%', minHeight: '600px' }}>
      
      {/* LEFT SIDEBAR (Vertical Tabs) */}
      <div style={{
        width: '240px',
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
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>Q LOAN NAME ↑</th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>INTEREST RATE ↑</th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loanTypes.map((type) => (
                    <tr key={type._id}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid #334155' }}>{type.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #334155' }}>{type.interestRate} %</td>
                      <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                        <button className="btn btn-sm" style={{ background: 'transparent', color: '#3b82f6', padding: '4px' }}>
                          <Edit2 size={16} />
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
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>Q LOAN NAME ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>Q EMPLOYEE NAME ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>LOAN AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>AMOUNT PAID ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right', border: '1px solid #334155' }}>BALANCE AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #334155' }}>Q STATUS ↑</th>
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
                          <button className="btn btn-sm" style={{ background: 'transparent', color: '#3b82f6', padding: '4px' }}>
                            <Edit2 size={16} />
                          </button>
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
    </div>
  );
};

export default LoanManagement;
