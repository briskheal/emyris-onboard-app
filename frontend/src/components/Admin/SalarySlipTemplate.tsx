import React from 'react';

interface Props {
  data: any;
  preparedBy?: string;
  sanctionedBy?: string;
  month?: string;
  year?: string;
  logoId?: string | null;
  signatureId?: string | null;
}

const SalarySlipTemplate: React.FC<Props> = ({ data, preparedBy, sanctionedBy, month, year, logoId, signatureId }) => {
  if (!data) return null;

  const currentMonth = month || new Date().toLocaleString('default', { month: 'long' }).toUpperCase();
  const currentYear = year || new Date().getFullYear().toString();

  // Helper to format currency
  const f = (val: any) => Math.round(parseFloat(val || '0')).toString();

  // Computed Values
  const basic = f(data.calcBreakup?.basic);
  const hra = f(data.calcBreakup?.hra);
  const lta = f(data.calcBreakup?.lta);
  const conv = f(data.calcBreakup?.conveyance);
  const med = f(data.calcBreakup?.medical);
  const edu = f(data.calcBreakup?.edu);
  const special = f(data.calcBreakup?.special);
  const fixed = "0.00"; // Based on original screenshot logic

  const origBasic = f(parseFloat(basic) > 0 ? (parseFloat(basic) / (data.payableDays / data.totalMonthDays)) : 0);
  const origHra = f(parseFloat(hra) > 0 ? (parseFloat(hra) / (data.payableDays / data.totalMonthDays)) : 0);
  const origLta = f(parseFloat(lta) > 0 ? (parseFloat(lta) / (data.payableDays / data.totalMonthDays)) : 0);
  // Fixed allowances stay the same
  const origConv = conv;
  const origMed = med;
  const origEdu = edu;
  const origSpecial = f(parseFloat(special) > 0 ? (parseFloat(special) / (data.payableDays / data.totalMonthDays)) : 0);

  const pt = f(data.ptDed);
  const pf = f(data.pfDed);
  const salDed = f(data.salDed);
  const totalDeductions = f(parseFloat(pt) + parseFloat(pf) + parseFloat(salDed));

  const totalSalaryPayable = f(data.finalSalary);

  const borderStyle = "1px solid #000";

  return (
    <div id={`salary-slip-${data.empCode}`} style={{ width: '210mm', height: '297mm', overflow: 'hidden', padding: '10mm', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        {logoId ? (
          <img src={`${window.location.origin}/api/admin/api/public/asset/${logoId}`} alt="Company Logo" style={{ maxWidth: '180px', maxHeight: '90px', marginRight: '20px' }} crossOrigin="anonymous" />
        ) : (
          <div style={{ width: '180px', marginRight: '20px' }}></div>
        )}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>EMYRIS BIOLIFESCIENCES PVT LTD</h1>
          <p style={{ margin: '5px 0', fontSize: '10px' }}>Sumadhura pragati chambers, Park ln, kalasiguda, Secunderabad, 500003</p>
          <h2 style={{ textAlign: 'center', margin: '0', fontSize: '14px', backgroundColor: '#e2e8f0', padding: '5px', fontWeight: 'bold' }}>
            PAYSLIP FOR THE MONTH OF {String(currentMonth).toUpperCase()} {currentYear}
          </h2>
        </div>
        <div style={{ width: '120px', marginLeft: '20px' }}></div>
      </div>

      {/* Main Box */}
      <div style={{ border: borderStyle, width: '100%', fontSize: '14px' }}>
        
        {/* Employee Details Section */}
        <div style={{ padding: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0', textDecoration: 'underline', fontSize: '16px' }}>EMPLOYEE DETAILS</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '20%', padding: '4px 0', fontWeight: 'bold' }}>Code</td>
                <td style={{ width: '30%', padding: '4px 0' }}>: {data.empCode}</td>
                <td style={{ width: '20%', padding: '4px 0', fontWeight: 'bold' }}>Division</td>
                <td style={{ width: '30%', padding: '4px 0' }}>: {data.division || 'NA'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Name</td>
                <td style={{ padding: '4px 0' }}>: {data.empName}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Father's Name</td>
                <td style={{ padding: '4px 0' }}>: {data.fatherName || 'NA'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Department</td>
                <td style={{ padding: '4px 0' }}>: {data.department || 'SALES'}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Designation</td>
                <td style={{ padding: '4px 0' }}>: {data.designation || 'NA'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>E.P.F. Number</td>
                <td style={{ padding: '4px 0' }}>: {data.epfNumber || 'NA'}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>E.S.I.C Number</td>
                <td style={{ padding: '4px 0' }}>: {data.esiNumber || 'NA'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>UAN</td>
                <td style={{ padding: '4px 0' }}>: {data.uanNumber || 'NA'}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>PAN Number</td>
                <td style={{ padding: '4px 0' }}>: {data.panNumber || 'NA'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: borderStyle }}></div>

        {/* Working Details */}
        <div style={{ padding: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0', textDecoration: 'underline', fontSize: '16px' }}>WORKING DETAILS</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '4px 0', fontWeight: 'bold' }}>Actual Payable Days</td>
                <td style={{ width: '25%', padding: '4px 0' }}>: {data.totalMonthDays}</td>
                <td style={{ width: '25%', padding: '4px 0', fontWeight: 'bold' }}>Loss Of Pay Days</td>
                <td style={{ width: '25%', padding: '4px 0' }}>: {data.totalMonthDays - data.payableDays + parseFloat(data.penaltyDays || '0')}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Total Month Days</td>
                <td style={{ padding: '4px 0' }}>: {data.totalMonthDays}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Days Payable</td>
                <td style={{ padding: '4px 0' }}>: {data.payableDays - parseFloat(data.penaltyDays || '0')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Earnings and Deductions Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderTop: borderStyle, borderBottom: borderStyle, borderRight: borderStyle, padding: '10px', textAlign: 'left', width: '50%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textDecoration: 'underline' }}>EARNINGS</span>
                  <span style={{ paddingRight: '40px' }}>Payable</span>
                  <span>Paid</span>
                </div>
              </th>
              <th style={{ borderTop: borderStyle, borderBottom: borderStyle, padding: '10px', textAlign: 'left', width: '50%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textDecoration: 'underline' }}>DEDUCTIONS</span>
                  <span>Amount</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ borderRight: borderStyle, padding: '10px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>Basic Fixed</span> <span>: {origBasic}</span> <span>{basic}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>HRA</span> <span>: {origHra}</span> <span>{hra}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>LTA</span> <span>: {origLta}</span> <span>{lta}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>Conveyance Allowance</span> <span>: {origConv}</span> <span>{conv}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>Medical</span> <span>: {origMed}</span> <span>{med}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>Special Allowance</span> <span>: {origSpecial}</span> <span>{special}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold', width:'150px'}}>Educ Allowance</span> <span>: {origEdu}</span> <span>{edu}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><span style={{fontWeight:'bold', width:'150px'}}>Fixed Allowance</span> <span>: {fixed}</span> <span>{fixed}</span></div>
              </td>
              <td style={{ padding: '10px', verticalAlign: 'top' }}>
                {parseFloat(pt) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold'}}>Professional Tax (PT)</span> <span>: {pt}</span></div>}
                {parseFloat(pf) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold'}}>Provident Fund (PF)</span> <span>: {pf}</span></div>}
                {parseFloat(salDed) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{fontWeight:'bold'}}>Salary Deduction</span> <span>: {salDed}</span></div>}
              </td>
            </tr>
            <tr>
              <td style={{ borderTop: borderStyle, borderRight: borderStyle, padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Gross Total</span> <span>: {f(data.originalGross)}</span> <span>{f(data.baseNetSalary)}</span>
                </div>
              </td>
              <td style={{ borderTop: borderStyle, padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Total Deductions</span> <span>: {totalDeductions}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Reimbursements (Placeholder for format) */}
        <div style={{ borderTop: borderStyle, padding: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0', textDecoration: 'underline', fontSize: '16px' }}>REIMBURSEMENTS</h3>
          <div style={{ display: 'flex' }}>
            <span style={{ fontWeight: 'bold', width: '200px' }}>Expense</span>
            <span>: 0</span>
          </div>
        </div>

        <div style={{ borderTop: borderStyle, padding: '10px', fontWeight: 'bold', display: 'flex' }}>
          <span style={{ width: '200px' }}>Reimbursement Total</span>
          <span>: 0</span>
        </div>

        {/* Payment Summary */}
        <div style={{ borderTop: borderStyle, padding: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '4px 0' }}>Payment Mode</td>
                <td style={{ width: '25%', padding: '4px 0' }}>: Bank Transfer</td>
                <td style={{ width: '25%', padding: '4px 0', fontWeight: 'bold' }}>Gross Earnings</td>
                <td style={{ width: '25%', padding: '4px 0' }}>: {f(data.baseNetSalary)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>A/c. No.</td>
                <td style={{ padding: '4px 0' }}>: {data.accNo || 'NA'}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Less Deductions</td>
                <td style={{ padding: '4px 0' }}>: {totalDeductions}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>Bank Name</td>
                <td style={{ padding: '4px 0' }}>: {data.bankName || 'NA'}</td>
                <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Reimbursement</td>
                <td style={{ padding: '4px 0' }}>: 0</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0 4px 0' }}>IFSC Code</td>
                <td style={{ padding: '10px 0 4px 0' }}>: {data.ifsc || 'NA'}</td>
                <td style={{ borderTop: borderStyle, padding: '10px 0 4px 0', fontWeight: 'bold' }}>Total Salary Payable</td>
                <td style={{ borderTop: borderStyle, padding: '10px 0 4px 0', fontWeight: 'bold' }}>: {totalSalaryPayable}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ borderTop: borderStyle, padding: '10px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', alignItems: 'flex-end' }}>
          <div>
            <div style={{ marginBottom: '30px' }}>Prepared By:</div>
            <div style={{ fontWeight: 'normal' }}>{preparedBy}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            {signatureId ? (
              <img src={`${window.location.origin}/api/admin/api/public/asset/${signatureId}`} alt="Authorized Signature" style={{ maxWidth: '150px', maxHeight: '60px', marginBottom: '5px', mixBlendMode: 'multiply' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ height: '50px' }}></div>
            )}
            <div>Authorized Signatory</div>
            <div style={{ fontWeight: 'normal', fontSize: '12px', marginTop: '4px' }}>{sanctionedBy}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '30px' }}>Received By:</div>
            <div style={{ fontWeight: 'normal', marginTop: '5px' }}>{data.empName}</div>
          </div>
        </div>

      </div>

      {/* Footer Note */}
      <div style={{ marginTop: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px' }}>
          <span>Computer generated Slip. No signature required.</span>
          <span>Powered By: Emyris IT Dept</span>
        </div>
        <div style={{ marginTop: '5px', fontSize: '10px', fontWeight: 'bold' }}>
          NOTE : All amounts displayed in this payment slip are in INR
        </div>
      </div>
    </div>
  );
};

export default SalarySlipTemplate;
