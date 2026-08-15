import React, { useState } from 'react';
import { Upload, Play, CheckCircle, Download, Mail, Eye, X, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../../api/client';
import SalarySlipTemplate from './SalarySlipTemplate';

const PayrunSystem: React.FC = () => {
    const [step, setStep] = useState(1);
    
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
                setStep(2); // Auto-advance to Review
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
        p.finalSalary = (parseFloat(p.baseNetSalary) - parseFloat(p.salDed) - (p.ptDed || 0) - (p.pfDed || 0)).toFixed(2);
        setPreviews(updated);
    };

    const handleEmailToggle = (index: number, checked: boolean) => {
        const updated = [...previews];
        updated[index].sendEmail = checked;
        setPreviews(updated);
    };

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

    // Robust HTML to Base64 PDF function
    const generatePdfBase64 = async (empCode: string) => {
        const element = document.getElementById(`salary-slip-${empCode}`);
        if (!element) throw new Error("Template not found");
        
        // Temporarily append to body to ensure it is rendered by html2canvas
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
            setError("No employees selected for email.");
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
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Payrun Wizard</h1>
                <div className="flex items-center space-x-2 text-sm font-medium">
                    <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1. Upload</span>
                    <span className="text-gray-300">?</span>
                    <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2. Review</span>
                    <span className="text-gray-300">?</span>
                    <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3. Distribute</span>
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg flex items-center shadow-sm">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Step 1: Upload Monthly Attendance (.xlsx)</h2>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mb-4 block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        <button onClick={handleUpload} disabled={uploading || !file} className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Data'}
                        </button>
                    </div>

                    {uploadSuccess && (
                        <div className="mt-8 pt-6 border-t flex items-center justify-between">
                            <div className="text-green-600 font-medium flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                File Uploaded Successfully. Ready for Engine.
                            </div>
                            <button onClick={fetchPreview} disabled={loadingPreview} className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors flex items-center disabled:opacity-50">
                                <Play className="w-5 h-5 mr-2" />
                                {loadingPreview ? 'Running Engine...' : 'Run Preview Engine'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: REVIEW */}
            {step === 2 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">Step 2: Review Math & Apply Penalties</h2>
                        <div className="space-x-3 flex">
                            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </button>
                            <button onClick={exportToExcel} className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 flex items-center font-medium text-sm transition-colors">
                                <Download className="w-4 h-4 mr-2" /> Export to Excel
                            </button>
                            <button onClick={() => setStep(3)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors flex items-center text-sm">
                                Next: Distribute <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tally (P/A/L/H)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Penalty Days</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Final Net</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previews.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{p.empName}</div>
                                            <div className="text-sm text-gray-500">{p.empCode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            <span className="text-green-600 font-medium">{p.present}</span> / 
                                            <span className="text-red-500"> {p.absent}</span> / 
                                            <span className="text-yellow-600"> {p.leave}</span> / 
                                            <span className="text-blue-500"> {p.holiday}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <input 
                                                type="number" min="0" step="0.5"
                                                value={p.penaltyDays} 
                                                onChange={(e) => handlePenaltyChange(idx, e.target.value)}
                                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 bg-gray-50">
                                            ?{p.finalSalary}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center space-x-2">
                                            <button onClick={() => setPreviewData(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="View Slip HTML">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => downloadPdf(p)} disabled={generatingPdf === p.empCode} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50" title="Download PDF">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* STEP 3: DISTRIBUTE */}
            {step === 3 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">Step 3: Mail Distribution</h2>
                        <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Review
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Email Form */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-medium text-gray-900 flex items-center mb-4"><Mail className="w-4 h-4 mr-2 text-indigo-600"/> Mail Content</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Message Body</label>
                                        <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={3} className="w-full border border-gray-300 rounded text-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Prepared By Signature</label>
                                        <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="w-full border border-gray-300 rounded text-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Sanctioned By Signature</label>
                                        <input type="text" value={sanctionedBy} onChange={(e) => setSanctionedBy(e.target.value)} className="w-full border border-gray-300 rounded text-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                                    </div>
                                </div>
                            </div>

                            <button onClick={sendEmails} disabled={sendingEmails} className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center">
                                <Mail className="w-5 h-5 mr-2" />
                                {sendingEmails ? 'Generating & Sending...' : 'Send Mails to Selected'}
                            </button>
                            {emailSuccess && <div className="text-center text-green-600 text-sm font-medium mt-2"><CheckCircle className="w-4 h-4 inline mr-1"/> {emailSuccess}</div>}
                        </div>

                        {/* Mail Targets List */}
                        <div className="lg:col-span-2">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Send?</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previews.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    <input type="checkbox" checked={!!p.sendEmail} onChange={(e) => handleEmailToggle(idx, e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"/>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{p.empName}</div>
                                                    <div className="text-xs text-gray-500">{p.email || 'No email found!'}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
                    <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ width: '220mm', height: '95vh' }}>
                        <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="text-lg font-medium text-gray-900">HTML Live Preview</h3>
                            <button onClick={() => setPreviewData(null)} className="text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full p-2">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-300 p-6 flex justify-center">
                            <div className="shadow-lg">
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
