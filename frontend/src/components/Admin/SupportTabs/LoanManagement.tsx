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
        setEmployees(empRes.data.data.filter((e: any) => e.status === 'approved'));
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
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>LOAN NAME *</label>
                  <input type="text" className="form-input" placeholder="Enter Loan Name" value={loanName} onChange={e => setLoanName(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>LOAN TYPE *</label>
                  <select className="form-input" value={loanType} onChange={e => setLoanType(e.target.value)} required>
                    <option value="">Select Type</option>
                    <option value="Flat Rate">Flat Rate</option>
                    <option value="Reducing Balance">Reducing Balance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>INTEREST RATE</label>
                  <input type="number" className="form-input" placeholder="Enter Interest Rate (%)" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                </div>
                <div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', padding: '0 2rem' }}>
                    {loading ? 'Adding...' : 'Add Loan'}
                  </button>
                </div>
              </form>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({loanTypes.length})</h4>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>Q LOAN NAME ↑</th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>INTEREST RATE ↑</th>
                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loanTypes.map((type) => (
                    <tr key={type._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{type.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>{type.interestRate} %</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button className="btn btn-sm" style={{ background: 'transparent', color: '#3b82f6', padding: '4px' }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loanTypes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No loan types created yet.</td>
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
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>EMPLOYEE NAME *</label>
                  <select className="form-input" value={assignEmpEmail} onChange={e => setAssignEmpEmail(e.target.value)} required>
                    <option value="">Select Name</option>
                    {employees.map(emp => (
                      <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>LOAN NAME *</label>
                  <select className="form-input" value={assignLoanName} onChange={e => setAssignLoanName(e.target.value)} required>
                    <option value="">Select Name</option>
                    {loanTypes.map(t => (
                      <option key={t._id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>INTEREST RATE</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" className="form-input" value={assignInterestRate} onChange={e => setAssignInterestRate(e.target.value)} style={{ paddingLeft: '2rem' }} />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>NAME ON PAYSLIP</label>
                  <input type="text" className="form-input" value={assignNameOnPayslip} onChange={e => setAssignNameOnPayslip(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>LOAN AMOUNT *</label>
                  <input type="number" className="form-input" placeholder="Enter Amount" value={assignLoanAmount} onChange={e => setAssignLoanAmount(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>INSTALLMENT AMOUNT *</label>
                  <input type="number" className="form-input" placeholder="Enter Amount" value={assignInstallmentAmount} onChange={e => setAssignInstallmentAmount(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DEDUCTION TYPE</label>
                  <select className="form-input" value={assignDeductionType} onChange={e => setAssignDeductionType(e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DEDUCTION DATE</label>
                  <input type="date" className="form-input" value={assignDeductionDate} onChange={e => setAssignDeductionDate(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>LOAN SANCTION DATE *</label>
                  <input type="date" className="form-input" value={assignSanctionDate} onChange={e => setAssignSanctionDate(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 4', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', padding: '0 2.5rem' }}>
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
              <div style={{ marginBottom: '1.5rem', width: '250px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SELECT EMPLOYEE</label>
                <select className="form-input" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                  ))}
                </select>
              </div>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({filteredLoans.length})</h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>Q LOAN NAME ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>Q EMPLOYEE NAME ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>LOAN AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>AMOUNT PAID ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>BALANCE AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>Q STATUS ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{loan.loanName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{loan.employeeName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{loan.loanAmount}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{loan.amountPaid}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{loan.balanceAmount}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ color: loan.status === 'Ongoing' ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {loan.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'transparent', color: '#3b82f6', padding: '4px' }}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No loans found.</td>
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
