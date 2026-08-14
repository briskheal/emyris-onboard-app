import React, { useState } from 'react';
import { Upload, Play, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import api from '../../api/client';

const PayrunSystem: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');

    const [previews, setPreviews] = useState<any[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generationSuccess, setGenerationSuccess] = useState(false);

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
                setPreviews(res.data.previews);
            } else {
                setError(res.data.error || 'Failed to fetch preview');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch payrun preview.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const generatePayslips = async () => {
        if (previews.length === 0) return;
        setGenerating(true);
        setError('');
        try {
            const res = await api.post('/admin/generate-payslips', { previews });
            if (res.data.success) {
                setGenerationSuccess(true);
            } else {
                setError(res.data.error || 'Failed to generate payslips');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate payslips.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FileSpreadsheet className="w-8 h-8 mr-3 text-indigo-600" />
                    Attendance & Payrun System
                </h1>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Upload Attendance Report</h2>
                    <div className="flex items-center space-x-4">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center whitespace-nowrap"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                    </div>
                    {uploadSuccess && (
                        <p className="mt-3 text-green-600 flex items-center text-sm font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" /> File uploaded successfully!
                        </p>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Step 2: Payrun Preview</h2>
                        <button
                            onClick={fetchPreview}
                            disabled={loadingPreview}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {loadingPreview ? 'Calculating...' : 'Run Preview Engine'}
                        </button>
                    </div>

                    {previews.length > 0 ? (
                        <div className="space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance<br/><span className="text-[10px] text-gray-400">(P / A / L / H)</span></th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payable Days</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross (Original)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Calculated Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previews.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{p.empName}</div>
                                                    <div className="text-sm text-gray-500">{p.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    <span className="text-green-600 font-medium">{p.present}</span> / 
                                                    <span className="text-red-500"> {p.absent}</span> / 
                                                    <span className="text-yellow-600"> {p.leave}</span> / 
                                                    <span className="text-blue-500"> {p.holiday}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                        {p.payableDays} / {p.totalWorkingDays}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                    ₹{p.originalGross}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                    ₹{p.finalSalary}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4">
                                {generationSuccess ? (
                                    <div className="px-6 py-3 bg-green-50 text-green-700 rounded-md font-medium flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Payslips Generated Successfully!
                                    </div>
                                ) : (
                                    <button
                                        onClick={generatePayslips}
                                        disabled={generating}
                                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center"
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        {generating ? 'Generating Payslips...' : 'Approve & Generate Payslips'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-medium text-gray-900">No Preview Data</h3>
                            <p className="text-sm text-gray-500 mt-1">Upload a file and click "Run Preview Engine" to calculate salaries.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayrunSystem;
