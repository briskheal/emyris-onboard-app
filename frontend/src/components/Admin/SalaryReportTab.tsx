import React, { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import api from '../../api/client';
import * as XLSX from 'xlsx';

export const SalaryReportTab: React.FC = () => {
    const [startMonth, setStartMonth] = useState('April');
    const [startYear, setStartYear] = useState('2026');
    const [endMonth, setEndMonth] = useState('July');
    const [endYear, setEndYear] = useState('2026');
    const [reportType, setReportType] = useState<'company' | 'employee'>('employee');
    const [empCode, setEmpCode] = useState('');
    const [applicants, setApplicants] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const years = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

    useEffect(() => {
        api.get('/admin/applicants?month=all&year=all').then(res => {
            if (res.data.success && res.data.applicants) {
                setApplicants(res.data.applicants.filter((a: any) => a.applicantStatus === 'Verified' || a.applicantStatus === 'Employed'));
            }
        });
    }, []);

    const generateReport = async () => {
        let finalEmpCode = empCode;
        if (reportType === 'employee') {
            if (!empCode) {
                alert('Please select an employee.');
                return;
            }
            const match = empCode.match(/\(([^)]+)\)$/);
            if (match) {
                finalEmpCode = match[1];
            } else {
                const found = applicants.find(a => a.fullName.toLowerCase() === empCode.toLowerCase() || a.empCode.toLowerCase() === empCode.toLowerCase());
                if (found) finalEmpCode = found.empCode;
            }
        }

        setLoading(true);
        try {
            const res = await api.get('/admin/salary-report', {
                params: { startMonth, startYear, endMonth, endYear, reportType, empCode: finalEmpCode }
            });
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to generate report', err);
            alert('Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    const processData = () => {
        let rows: any[] = [];
        
        let totals = {
            basic: 0, conv: 0, edu: 0, fixed: 0, hra: 0, lta: 0, med: 0, special: 0,
            gross: 0, tax: 0, pt: 0, dedTotal: 0, expense: 0, reimbTotal: 0, net: 0, lop: 0, payableDays: 0, totalDays: 0
        };

        if (reportType === 'employee') {
            reportData.forEach(p => {
                const b = p.calculatedSalaryBreakup || {};
                const r = {
                    period: `${p.month} ${p.year}`,
                    basic: b.basic || 0,
                    conv: b.conv || 0,
                    edu: b.edu || 0,
                    fixed: b.fixed || 0,
                    hra: b.hra || 0,
                    lta: b.lta || 0,
                    med: b.med || 0,
                    special: b.special || 0,
                    gross: p.grossSalary || 0,
                    tax: 0,
                    pt: p.ptDed || 0,
                    dedTotal: (p.ptDed || 0) + (p.pfDed || 0) + (p.salDed || 0),
                    expense: b.reimbursement || 0,
                    reimbTotal: b.reimbursement || 0,
                    net: b.finalSalary || 0,
                    lop: (p.totalDays || 0) - (p.payableDays || 0),
                    payableDays: p.payableDays || 0,
                    totalDays: p.totalDays || 0
                };
                rows.push(r);
                Object.keys(totals).forEach(k => { if (k !== 'period') (totals as any)[k] += r[k as keyof typeof r] || 0; });
            });
        } else {
            // Aggregate across all employees for Company Report
            const periodMap: Record<string, any> = {};
            reportData.forEach(p => {
                const key = `${p.month} ${p.year}`;
                if (!periodMap[key]) {
                    periodMap[key] = {
                        period: key, basic: 0, conv: 0, edu: 0, fixed: 0, hra: 0, lta: 0, med: 0, special: 0,
                        gross: 0, tax: 0, pt: 0, dedTotal: 0, expense: 0, reimbTotal: 0, net: 0, lop: 0, payableDays: 0, totalDays: 0
                    };
                }
                const b = p.calculatedSalaryBreakup || {};
                const r = periodMap[key];
                r.basic += b.basic || 0; r.conv += b.conv || 0; r.edu += b.edu || 0; r.fixed += b.fixed || 0;
                r.hra += b.hra || 0; r.lta += b.lta || 0; r.med += b.med || 0; r.special += b.special || 0;
                r.gross += p.grossSalary || 0; r.tax += 0; r.pt += p.ptDed || 0; 
                r.dedTotal += (p.ptDed || 0) + (p.pfDed || 0) + (p.salDed || 0);
                r.expense += b.reimbursement || 0; r.reimbTotal += b.reimbursement || 0; r.net += b.finalSalary || 0;
                r.lop += (p.totalDays || 0) - (p.payableDays || 0); r.payableDays += p.payableDays || 0; r.totalDays += p.totalDays || 0;
            });
            rows = Object.values(periodMap);
            rows.forEach(r => {
                Object.keys(totals).forEach(k => { if (k !== 'period') (totals as any)[k] += r[k as keyof typeof r] || 0; });
            });
        }
        return { rows, totals };
    };

    const { rows, totals } = processData();

    const exportToExcel = () => {
        let finalEmpCode = empCode;
        const match = empCode.match(/\(([^)]+)\)$/);
        if (match) {
            finalEmpCode = match[1];
        } else {
            const found = applicants.find(a => a.fullName.toLowerCase() === empCode.toLowerCase() || a.empCode.toLowerCase() === empCode.toLowerCase());
            if (found) finalEmpCode = found.empCode;
        }

        const emp = reportType === 'employee' ? applicants.find(a => a.empCode === finalEmpCode) : null;
        
        let excelData = [];
        excelData.push([null, "             EMYRIS BIOLIFESCIENCES PVT LTD"]);
        excelData.push(["                                   Sumadhura pragati chambers, Park ln, kalasiguda, Secunderabad, 500003"]);
        excelData.push([]);
        excelData.push([]);
        if (emp) {
            excelData.push(["Employee ID:", emp.empCode, "", "Employee Name:", emp.fullName]);
            excelData.push(["Designation:", emp.designation || 'NA', "", "Department:", emp.department || 'NA']);
            excelData.push(["Gender:", emp.formData?.gender || '--', "", "Date Of Birth:", emp.formData?.dob || '--']);
            excelData.push(["Date Of Joining:", emp.dateOfJoining || '--']);
        } else {
            excelData.push(["Report:", "Company Wide Consolidated Salary Statement"]);
            excelData.push(["Period:", `${startMonth} ${startYear} to ${endMonth} ${endYear}`]);
        }
        excelData.push([]);
        excelData.push([]);
        excelData.push(["", "Earnings", null, null, null, null, null, null, null, null, "Deductions", null, null, "Reimbursements", null, "      ", "", "", ""]);
        
        const headers = ["Month/Particulars", "Basic Fixed", "Conveyance Allowance", "Educ Allowance", "Fixed Allowance", "HRA", "LTA", "Medical", "Special Allowance", "Gross Earning", "Income Tax", "Professional Tax", "Deduction Total", "Expense", "Reimbursement Total", "Net Salary", "LOP Days", "Payable Days", "Total Days"];
        excelData.push(headers);
        
        rows.forEach(r => {
            excelData.push([r.period, Math.round(r.basic), Math.round(r.conv), Math.round(r.edu), Math.round(r.fixed), Math.round(r.hra), Math.round(r.lta), Math.round(r.med), Math.round(r.special), Math.round(r.gross), Math.round(r.tax), Math.round(r.pt), Math.round(r.dedTotal), Math.round(r.expense), Math.round(r.reimbTotal), Math.round(r.net), Math.round(r.lop), Math.round(r.payableDays), Math.round(r.totalDays)]);
        });
        
        excelData.push(["Total", Math.round(totals.basic), Math.round(totals.conv), Math.round(totals.edu), Math.round(totals.fixed), Math.round(totals.hra), Math.round(totals.lta), Math.round(totals.med), Math.round(totals.special), Math.round(totals.gross), Math.round(totals.tax), Math.round(totals.pt), Math.round(totals.dedTotal), Math.round(totals.expense), Math.round(totals.reimbTotal), Math.round(totals.net), Math.round(totals.lop), Math.round(totals.payableDays), Math.round(totals.totalDays)]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Salary Statement");
        XLSX.writeFile(wb, `Salary_Statement_${reportType === 'company' ? 'Company' : emp?.fullName}_${startYear}.xlsx`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>Start Period</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="form-input-sm" style={{ width: '100px' }}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={startYear} onChange={e => setStartYear(e.target.value)} className="form-input-sm" style={{ width: '90px' }}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>End Period</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="form-input-sm" style={{ width: '100px' }}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={endYear} onChange={e => setEndYear(e.target.value)} className="form-input-sm" style={{ width: '90px' }}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>Report Type</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value as 'company' | 'employee')} className="form-input-sm" style={{ width: '150px' }}>
                            <option value="company">Company Wise</option>
                            <option value="employee">Employee Wise</option>
                        </select>
                    </div>
                    {reportType === 'employee' && (
                        <div>
                            <label className="form-label" style={{ fontSize: '12px' }}>Select Employee</label>
                            <input 
                                list="employee-list" 
                                value={empCode} 
                                onChange={e => setEmpCode(e.target.value)} 
                                className="form-input-sm" 
                                style={{ width: '250px' }}
                                placeholder="Search by name or code..."
                            />
                            <datalist id="employee-list">
                                {applicants.map(a => <option key={a.empCode} value={`${a.fullName} (${a.empCode})`} />)}
                            </datalist>
                        </div>
                    )}
                    <button onClick={generateReport} disabled={loading} className="btn btn-primary" style={{ padding: '6px 15px', height: '32px' }}>
                        <Search size={14} style={{ marginRight: '6px' }} /> {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                    {rows.length > 0 && (
                        <button onClick={exportToExcel} className="btn btn-success" style={{ padding: '6px 15px', height: '32px', backgroundColor: '#28a745', color: '#fff', border: 'none' }}>
                            <Download size={14} style={{ marginRight: '6px' }} /> Export Excel
                        </button>
                    )}
                </div>
            </div>

            {rows.length > 0 && (
                <div className="dash-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '12px', minWidth: '1500px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <th>Month</th>
                                <th>Basic Fixed</th>
                                <th>Conv. Allow</th>
                                <th>Educ Allow</th>
                                <th>Fixed Allow</th>
                                <th>HRA</th>
                                <th>LTA</th>
                                <th>Medical</th>
                                <th>Special Allow</th>
                                <th>Gross Earning</th>
                                <th>Income Tax</th>
                                <th>Prof. Tax</th>
                                <th>Deductions</th>
                                <th>Expense</th>
                                <th>Reimb. Total</th>
                                <th>Net Salary</th>
                                <th>LOP</th>
                                <th>Payable</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.period}</td>
                                    <td>{Math.round(r.basic)}</td>
                                    <td>{Math.round(r.conv)}</td>
                                    <td>{Math.round(r.edu)}</td>
                                    <td>{Math.round(r.fixed)}</td>
                                    <td>{Math.round(r.hra)}</td>
                                    <td>{Math.round(r.lta)}</td>
                                    <td>{Math.round(r.med)}</td>
                                    <td>{Math.round(r.special)}</td>
                                    <td>{Math.round(r.gross)}</td>
                                    <td>{Math.round(r.tax)}</td>
                                    <td>{Math.round(r.pt)}</td>
                                    <td>{Math.round(r.dedTotal)}</td>
                                    <td>{Math.round(r.expense)}</td>
                                    <td>{Math.round(r.reimbTotal)}</td>
                                    <td>{Math.round(r.net)}</td>
                                    <td>{Math.round(r.lop)}</td>
                                    <td>{Math.round(r.payableDays)}</td>
                                    <td>{Math.round(r.totalDays)}</td>
                                </tr>
                            ))}
                            <tr style={{ fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                <td>Total</td>
                                <td>{Math.round(totals.basic)}</td>
                                <td>{Math.round(totals.conv)}</td>
                                <td>{Math.round(totals.edu)}</td>
                                <td>{Math.round(totals.fixed)}</td>
                                <td>{Math.round(totals.hra)}</td>
                                <td>{Math.round(totals.lta)}</td>
                                <td>{Math.round(totals.med)}</td>
                                <td>{Math.round(totals.special)}</td>
                                <td>{Math.round(totals.gross)}</td>
                                <td>{Math.round(totals.tax)}</td>
                                <td>{Math.round(totals.pt)}</td>
                                <td>{Math.round(totals.dedTotal)}</td>
                                <td>{Math.round(totals.expense)}</td>
                                <td>{Math.round(totals.reimbTotal)}</td>
                                <td>{Math.round(totals.net)}</td>
                                <td>{Math.round(totals.lop)}</td>
                                <td>{Math.round(totals.payableDays)}</td>
                                <td>{Math.round(totals.totalDays)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
