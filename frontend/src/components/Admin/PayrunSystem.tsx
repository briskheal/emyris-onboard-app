import React, { useState } from 'react';
import { Upload, Play, CheckCircle, Download, Mail, Eye, X, AlertCircle } from 'lucide-react';
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
    const [sendingEmails, setSendingEmails] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    
    const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);

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
            const res = await api.get('/admin/payrun-preview');
            if (res.data.success) {
                const initializedPreviews = res.data.previews.map((p: any) => {
                    const salDed = 0;
                    const finalNet = (parseFloat(p.baseNetSalary) - (p.ptDed || 0) - (p.pfDed || 0) - salDed).toFixed(2);
                    return {
                        ...p,
                        penaltyDays: 0,
                        salDed: salDed.toFixed(2),
                        finalSalary: finalNet,
                        sendEmail: true
                    };
                });
                setPreviews(initializedPreviews);
            } else {
                setError(res.data.error || 'Failed to fetch preview');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch payrun preview.');
        } finally {
            setLoadingPreview(false);
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
                message: emailMessage
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

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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

                <div style={{ padding: '1.5rem', background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: '#555', fontWeight: '500' }}>Upload Monthly Attendance (.xlsx)</p>
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ marginBottom: '1rem' }}/>
                    <div>
                        <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-sm btn-primary" style={{ marginRight: '10px' }}>
                            <Upload size={14} style={{ marginRight: '5px' }} />
                            {uploading ? 'Uploading...' : 'Upload Data'}
                        </button>
                        {uploadSuccess && (
                            <button onClick={fetchPreview} disabled={loadingPreview} className="btn btn-sm" style={{ background: '#28a745', color: '#fff' }}>
                                <Play size={14} style={{ marginRight: '5px' }} />
                                {loadingPreview ? 'Running Engine...' : 'Run Preview Engine'}
                            </button>
                        )}
                    </div>
                </div>

                {previews.length > 0 && (
                    <>
                        <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto', marginBottom: '2rem' }}>
                            <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
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
                                                <span style={{ fontSize: '10px', marginTop: '4px', color: '#555' }}>All</span>
                                            </div>
                                        </th>
                                        <th>Employee Details</th>
                                        <th style={{ textAlign: 'center' }}>Attendance (P/A/L/H)</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>PT Ded</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>PF Ded</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Penalty Days</th>
                                        <th style={{ textAlign: 'right' }}>Final Net (?)</th>
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
                                                <div style={{ fontWeight: '600', color: '#333' }}>{p.empName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#777' }}>{p.empCode}</div>
                                            </td>
                                            <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                                                <span style={{ color: '#28a745', fontWeight: 'bold' }}>{p.present}</span> / 
                                                <span style={{ color: '#dc3545' }}> {p.absent}</span> / 
                                                <span style={{ color: '#ffc107' }}> {p.leave}</span> / 
                                                <span style={{ color: '#17a2b8' }}> {p.holiday}</span>
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
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: '#111' }}>
                                                ?{p.finalSalary}
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

                        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#333' }}>Mail Configurations</h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px' }}>Message Body</label>
                                    <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={3} className="form-input" style={{ width: '100%' }}/>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px' }}>Prepared By</label>
                                        <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="form-input-sm" style={{ width: '100%' }}/>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px' }}>Sanctioned By</label>
                                        <input type="text" value={sanctionedBy} onChange={(e) => setSanctionedBy(e.target.value)} className="form-input-sm" style={{ width: '100%' }}/>
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                <button onClick={sendEmails} disabled={sendingEmails} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 'bold' }}>
                                    <Mail size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
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
                    <div key={idx} id={`salary-slip-${p.empCode}`}>
                        <SalarySlipTemplate data={p} preparedBy={preparedBy} sanctionedBy={sanctionedBy} />
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
                            <div style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <SalarySlipTemplate data={previewData} preparedBy={preparedBy} sanctionedBy={sanctionedBy} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrunSystem;
