import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
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
  
  const [loading, setLoading] = useState(false);

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
        setEmployees(empRes.data.data.filter((e: any) => e.status === 'approved'));
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

  const filteredAdvances = filterEmployee
    ? assignedAdvances.filter(a => a.employeeEmail === filterEmployee)
    : assignedAdvances;

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
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>EMPLOYEE NAME *</label>
                  <select className="form-input" value={assignEmpEmail} onChange={e => setAssignEmpEmail(e.target.value)} required>
                    <option value="">Select Name</option>
                    {employees.map(emp => (
                      <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>NAME ON PAYSLIP *</label>
                  <input type="text" className="form-input" value={assignNameOnPayslip} onChange={e => setAssignNameOnPayslip(e.target.value)} required />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>ADVANCE AMOUNT *</label>
                  <input type="number" className="form-input" placeholder="Enter Amount" value={assignAdvanceAmount} onChange={e => setAssignAdvanceAmount(e.target.value)} required />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>INSTALLMENT AMOUNT *</label>
                  <input type="number" className="form-input" placeholder="Enter Amount" value={assignInstallmentAmount} onChange={e => setAssignInstallmentAmount(e.target.value)} required />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DEDUCTION TYPE</label>
                  <select className="form-input" value={assignDeductionType} onChange={e => setAssignDeductionType(e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>DEDUCTION MONTH *</label>
                  <input type="date" className="form-input" value={assignDeductionMonth} onChange={e => setAssignDeductionMonth(e.target.value)} required />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>ADVANCE SANCTION DATE *</label>
                  <input type="date" className="form-input" value={assignSanctionDate} onChange={e => setAssignSanctionDate(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', padding: '0 2.5rem' }}>
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
              <div style={{ marginBottom: '1.5rem', width: '250px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SELECT EMPLOYEE</label>
                <select className="form-input" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.email} value={emp.email}>{emp.fullName}</option>
                  ))}
                </select>
              </div>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SHOW ENTRIES ({filteredAdvances.length})</h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>SR NO</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>Q EMPLOYEE NAME ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>ADVANCE AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>AMOUNT PAID ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>BALANCE AMOUNT ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>Q STATUS ↑</th>
                      <th style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvances.map((adv, i) => (
                      <tr key={adv._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{i + 1}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{adv.employeeName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{adv.advanceAmount}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{adv.amountPaid}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>{adv.balanceAmount}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ color: adv.status === 'Ongoing' ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {adv.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'transparent', color: '#3b82f6', padding: '4px' }}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAdvances.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No salary advances found.</td>
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

export default AdvanceSalaryManagement;
