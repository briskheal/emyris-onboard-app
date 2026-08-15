import React, { useState, useEffect } from 'react';
import { Upload, Play, CheckCircle, Download, Mail, Eye, X, AlertCircle, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../../api/client';
import SalarySlipTemplate from './SalarySlipTemplate';

const PayrunSystem: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');

    const [previews, setPreviews] = useState<any[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const [emailMessage, setEmailMessage] = useState('Please find attached your salary slip for this month.');
    const [preparedBy, setPreparedBy] = useState('Medorn HRMS Software');
    const [sanctionedBy, setSanctionedBy] = useState('Rishita Dash');
    const [logoId, setLogoId] = useState<string | null>(null);
    const [signatureId, setSignatureId] = useState<string | null>(null);
    const [sendingEmails, setSendingEmails] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [finalizing, setFinalizing] = useState(false);
    
    const [payrunMonth, setPayrunMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [payrunYear, setPayrunYear] = useState(new Date().getFullYear().toString());

    const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);

    useEffect(() => {
        fetchPreview();
    }, [payrunMonth, payrunYear]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadSuccess(false);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select an Excel file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError('');
        try {
            const res = await api.post('/admin/upload-attendance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setUploadSuccess(true);
            } else {
                setError(res.data.error || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload attendance file.');
        } finally {
            setUploading(false);
        }
    };

    const fetchPreview = async () => {
        setLoadingPreview(true);
        setError('');
        try {
            const res = await api.get(`/admin/payrun-preview?month=${payrunMonth}&year=${payrunYear}`);
            if (res.data.success) {
                const initializedPreviews = res.data.previews.map((p: any) => {
                    const salDed = p.salDed !== undefined ? p.salDed : 0;
                    const finalNet = p.finalSalary !== undefined ? p.finalSalary : (parseFloat(p.baseNetSalary) - (p.ptDed || 0) - (p.pfDed || 0) - salDed).toFixed(2);
                    return {
                        ...p,
                        penaltyDays: p.penaltyDays !== undefined ? p.penaltyDays : 0,
                        salDed: typeof salDed === 'number' ? salDed.toFixed(2) : salDed,
                        finalSalary: finalNet,
                        sendEmail: p.sendEmail !== undefined ? p.sendEmail : true
                    };
                });
                setPreviews(initializedPreviews);
                if (res.data.mailConfig) {
                    if (res.data.mailConfig.emailMessage) setEmailMessage(res.data.mailConfig.emailMessage);
                    if (res.data.mailConfig.preparedBy) setPreparedBy(res.data.mailConfig.preparedBy);
                    if (res.data.mailConfig.sanctionedBy) setSanctionedBy(res.data.mailConfig.sanctionedBy);
                    if (res.data.mailConfig.logoId) setLogoId(res.data.mailConfig.logoId);
                    if (res.data.mailConfig.signatureId) setSignatureId(res.data.mailConfig.signatureId);
                }
            } else {
                setError(res.data.error || 'Failed to fetch preview');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch payrun preview.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const saveMailConfig = async () => {
        try {
            const res = await api.post('/admin/save-payrun-config', { emailMessage, preparedBy, sanctionedBy });
            if (res.data.success) {
                alert('Mail configuration saved securely.');
            } else {
                alert('Failed to save configuration: ' + res.data.error);
            }
        } catch (err: any) {
            alert('Failed to save configuration. Please try again.');
        }
    };

    const handlePenaltyChange = (index: number, daysStr: string) => {
        const days = parseFloat(daysStr) || 0;
        const updated = [...previews];
        const p = updated[index];
        p.penaltyDays = days;
        p.salDed = (days * parseFloat(p.dailyRate)).toFixed(2);
        p.finalSalary = (parseFloat(p.baseNetSalary) - parseFloat(p.salDed) - parseFloat(p.ptDed || 0) - parseFloat(p.pfDed || 0)).toFixed(2);
        setPreviews(updated);
    };

    const handlePTChange = (index: number, valStr: string) => {
        const val = parseFloat(valStr) || 0;
        const updated = [...previews];
        const p = updated[index];
        p.ptDed = val;
        p.finalSalary = (parseFloat(p.baseNetSalary) - parseFloat(p.salDed) - parseFloat(p.ptDed || 0) - parseFloat(p.pfDed || 0)).toFixed(2);
        setPreviews(updated);
    };

    const handlePFChange = (index: number, valStr: string) => {
        const val = parseFloat(valStr) || 0;
        const updated = [...previews];
        const p = updated[index];
        p.pfDed = val;
        p.finalSalary = (parseFloat(p.baseNetSalary) - parseFloat(p.salDed) - parseFloat(p.ptDed || 0) - parseFloat(p.pfDed || 0)).toFixed(2);
        setPreviews(updated);
    };

    const handleEmailToggle = (index: number, checked: boolean) => {
        const updated = [...previews];
        updated[index].sendEmail = checked;
        setPreviews(updated);
    };

    const handleSelectAll = (checked: boolean) => {
        const updated = previews.map(p => ({ ...p, sendEmail: checked }));
        setPreviews(updated);
    };

    const isAllSelected = previews.length > 0 && previews.every(p => p.sendEmail);

    const exportToExcel = () => {
        if (previews.length === 0) return;
        const exportData = previews.map(p => ({
            "Employee Name": p.empName,
            "Employee Code": p.empCode,
            "Total Days in Month": p.totalMonthDays,
            "Total Days Present": p.present,
            "Total Holidays": p.holiday,
            "Total Leave": p.leave,
            "Total Absent": p.absent,
            "Total Earnings": p.baseNetSalary,
            "Sal Ded": parseFloat(p.salDed) || 0,
            "PT Ded": p.ptDed || 0,
            "PF Ded": p.pfDed || 0,
            "Net Payable Salary": parseFloat(p.finalSalary)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payrun Report");
        XLSX.writeFile(wb, `Payrun_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const generatePdfBase64 = async (empCode: string) => {
        const element = document.getElementById(`salary-slip-${empCode}`);
        if (!element) throw new Error("Template not found");
        
        const originalParent = element.parentElement;
        document.body.appendChild(element);
        
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.zIndex = '-9999';
        
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return pdf.output('datauristring');
        } finally {
            element.style.display = 'none';
            if (originalParent) {
                originalParent.appendChild(element);
            }
        }
    };

    const downloadPdf = async (p: any) => {
        setGeneratingPdf(p.empCode);
        try {
            const pdfBase64 = await generatePdfBase64(p.empCode);
            const a = document.createElement('a');
            a.href = pdfBase64;
            a.download = `Salary_Slip_${p.empName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert("Failed to download PDF");
        } finally {
            setGeneratingPdf(null);
        }
    };

    const sendEmails = async () => {
        const targets = previews.filter(p => p.sendEmail);
        if (targets.length === 0) {
            setError("No employees selected for processing.");
            return;
        }

        setSendingEmails(true);
        setError('');
        setEmailSuccess('');

        try {
            const payloadEmails = [];

            for (const p of targets) {
                const pdfBase64 = await generatePdfBase64(p.empCode);
                payloadEmails.push({
                    email: p.email,
                    empName: p.empName,
                    pdfBase64
                });
            }

            const res = await api.post('/admin/email-payslips', {
                emails: payloadEmails,
                message: emailMessage,
                month: payrunMonth,
                year: payrunYear
            });

            if (res.data.success) {
                setEmailSuccess(`Successfully sent ${res.data.count} emails!`);
            } else {
                setError(res.data.error || 'Failed to send emails.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to send emails due to an error.');
        } finally {
            setSendingEmails(false);
        }
    };

    const finalizePayrun = async () => {
        if (!confirm(`Are you sure you want to finalize the payrun for ${payrunMonth} ${payrunYear}? This will permanently save the data for annual reports. Any existing saved data for this month will be overwritten.`)) {
            return;
        }
        
        setFinalizing(true);
        setError('');
        setEmailSuccess('');

        try {
            const res = await api.post('/admin/finalize-payrun', {
                month: payrunMonth,
                year: payrunYear,
                previews
            });

            if (res.data.success) {
                setEmailSuccess(`Successfully finalized payrun for ${payrunMonth} ${payrunYear}!`);
            } else {
                setError(res.data.error || 'Failed to finalize payrun.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to finalize payrun due to an error.');
        } finally {
            setFinalizing(false);
        }
    };

    return (
        <div style={{ padding: '0', width: '100%', maxWidth: '100%', margin: '0' }}>
            <div className="dash-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2>Payrun & Attendance Module</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button className="btn btn-sm" style={{ background: '#f8f9fa', border: '1px solid #ddd', color: '#333' }} onClick={exportToExcel}>
                            <Download size={14} style={{ marginRight: '5px' }}/> Export Excel
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                        <AlertCircle size={18} style={{ marginRight: '8px' }} />
                        {error}
                    </div>
                )}
                {emailSuccess && (
                    <div style={{ padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                        {emailSuccess}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                    <input type="file" className="form-control form-control-sm" accept=".xlsx, .xls" onChange={handleFileChange} style={{ maxWidth: '250px', fontSize: '0.875rem' }}/>
                    <select className="form-control form-control-sm" value={payrunMonth} onChange={e => setPayrunMonth(e.target.value)} style={{ width: 'auto', fontSize: '0.875rem' }}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="form-control form-control-sm" value={payrunYear} onChange={e => setPayrunYear(e.target.value)} style={{ width: 'auto', fontSize: '0.875rem' }}>
                        {[2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                        <Upload size={14} style={{ marginRight: '4px' }} />
                        {uploading ? 'Wait...' : 'Upload'}
                    </button>
                    {uploadSuccess && (
                        <button onClick={fetchPreview} disabled={loadingPreview} className="btn btn-sm btn-success" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                            <Play size={14} style={{ marginRight: '4px' }} />
                            {loadingPreview ? 'Wait...' : 'Run Preview'}
                        </button>
                    )}
                </div>

                {previews.length > 0 && (
                    <>
                        <div className="table-responsive" style={{ maxHeight: '650px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAllSelected} 
                                                    onChange={(e) => handleSelectAll(e.target.checked)} 
                                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                />
                                                <span style={{ fontSize: '10px', marginTop: '4px' }}>All</span>
                                            </div>
                                        </th>
                                        <th>Employee Details</th>
                                        <th style={{ textAlign: 'center' }}>Attendance (P/A/L/H)</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>PT Ded</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>PF Ded</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Penalty Days</th>
                                        <th style={{ textAlign: 'right' }}>Final Net (₹)</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previews.map((p, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="checkbox" checked={!!p.sendEmail} onChange={(e) => handleEmailToggle(idx, e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }}/>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{p.empName}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{p.empCode}</div>
                                            </td>
                                            <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{p.present}</span> / 
                                                <span> {p.absent}</span> / 
                                                <span> {p.leave}</span> / 
                                                <span> {p.holiday}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="number" min="0" value={p.ptDed} onChange={(e) => handlePTChange(idx, e.target.value)} className="form-input-sm" style={{ width: '70px', textAlign: 'center', padding: '4px' }}/>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="number" min="0" value={p.pfDed} onChange={(e) => handlePFChange(idx, e.target.value)} className="form-input-sm" style={{ width: '70px', textAlign: 'center', padding: '4px' }}/>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="number" min="0" step="0.5" value={p.penaltyDays} onChange={(e) => handlePenaltyChange(idx, e.target.value)} className="form-input-sm" style={{ width: '70px', textAlign: 'center', padding: '4px' }}/>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem' }}>
                                                ₹{p.finalSalary}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button onClick={() => setPreviewData(p)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }} title="Preview HTML">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button onClick={() => downloadPdf(p)} disabled={generatingPdf === p.empCode} style={{ background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', opacity: generatingPdf === p.empCode ? 0.5 : 1 }} title="Download PDF">
                                                        <Download size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: '1rem' }}>
                            <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Mail Configurations</h3>
                                    <button onClick={saveMailConfig} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Save Config</button>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Message Body</label>
                                    <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={2} className="form-input" style={{ width: '100%', padding: '6px' }}/>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Prepared By</label>
                                        <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="form-input-sm" style={{ width: '100%' }}/>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Sanctioned By</label>
                                        <input type="text" value={sanctionedBy} onChange={(e) => setSanctionedBy(e.target.value)} className="form-input-sm" style={{ width: '100%' }}/>
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: '0 0 auto', display: 'flex', gap: '10px' }}>
                                <button onClick={finalizePayrun} disabled={finalizing || previews.length === 0} className="btn btn-success" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#28a745', color: '#fff', border: 'none' }}>
                                    <Save size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    {finalizing ? 'Saving...' : 'Finalize & Save Payrun'}
                                </button>
                                <button onClick={sendEmails} disabled={sendingEmails} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                                    <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    {sendingEmails ? 'Processing & Sending...' : 'Process All Selected'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Hidden Templates purely for html2canvas to fetch */}
            <div style={{ display: 'none' }}>
                {previews.map((p, idx) => (
                    <div key={idx} id={`salary-slip-${p.empCode}`} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                        <SalarySlipTemplate data={p} preparedBy={preparedBy} sanctionedBy={sanctionedBy} month={payrunMonth} year={payrunYear} logoId={logoId} signatureId={signatureId} />
                    </div>
                ))}
            </div>

            {/* HTML Preview Modal */}
            {previewData && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '220mm', height: '95vh', maxWidth: '100%' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>HTML Live Preview</h3>
                            <button onClick={() => setPreviewData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', background: '#e9ecef', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-50px' }}>
                                <SalarySlipTemplate data={previewData} preparedBy={preparedBy} sanctionedBy={sanctionedBy} month={payrunMonth} year={payrunYear} logoId={logoId} signatureId={signatureId} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrunSystem;
