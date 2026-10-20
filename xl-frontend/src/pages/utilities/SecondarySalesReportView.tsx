import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Eye, PlusCircle, History, RefreshCw, X, Building2 } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SecondarySalesReportView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [startMonth, setStartMonth] = useState(MONTHS[new Date().getMonth()]);
    const [startYear, setStartYear] = useState(String(new Date().getFullYear()));
    const [endMonth, setEndMonth] = useState(MONTHS[new Date().getMonth()]);
    const [endYear, setEndYear] = useState(String(new Date().getFullYear()));
    const [type, setType] = useState<'Stockist' | 'Headquarter' | 'Inventory'>('Stockist');
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<{ title: string; items: any[] } | null>(null);

    const fetchReport = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/xl/reports/secondary-sales', {
                params: {
                    startMonth,
                    startYear,
                    endMonth,
                    endYear,
                    type,
                    employeeId: selectedUser.employeeId
                }
            });
            if (res.data?.success) {
                setRows(res.data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser) fetchReport();
    }, [selectedUser, startMonth, startYear, endMonth, endYear, type]);

    const openDetail = async (row: any) => {
        try {
            const res = await axios.get('/api/xl/reports/secondary-sales/detail', {
                params: {
                    type: 'Product',
                    stockist: row.stockist,
                    headquarter: row.headquarter,
                    month: row.month,
                    year: row.year
                }
            });
            if (res.data?.success) {
                setDetailModal({
                    title: `${row.stockistName || row.headquarter || 'Details'} (${row.month} ${row.year})`,
                    items: res.data.data || []
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const totalAmount = rows.reduce((s, r) => s + Number(r.totalSales || 0), 0);
    const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);

    return (
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Secondary Sales Reports</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">Stockist & HQ Wise Secondary Sales</p>
                    </div>
                </div>
                <button onClick={fetchReport} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                {/* Quick Action Links to Secondary Sales Entry & History */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        onClick={() => navigate('/creation/secondary-sales')}
                        className="bg-blue-600 text-white rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" /> New Sec. Sales
                    </button>
                    <button
                        onClick={() => navigate('/creation/secondary-sales/history')}
                        className="bg-white text-gray-700 border border-gray-200 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                    >
                        <History className="w-4 h-4 text-blue-600" /> Entry History
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">From Month</label>
                            <div className="flex gap-1">
                                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold">
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={startYear} onChange={e => setStartYear(e.target.value)} className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold">
                                    {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">To Month</label>
                            <div className="flex gap-1">
                                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold">
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={endYear} onChange={e => setEndYear(e.target.value)} className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold">
                                    {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
                        {(['Stockist', 'Headquarter', 'Inventory'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${type === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-3.5 text-white flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-80">
                            {type === 'Inventory' ? 'Total Secondary Units' : 'Total Secondary Sales'}
                        </p>
                        <p className="text-xl font-black mt-0.5">
                            {type === 'Inventory' ? `${totalQty.toLocaleString('en-IN')} Units` : `₹${totalAmount.toLocaleString('en-IN')}`}
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">{rows.length} Records</span>
                </div>

                {/* Records */}
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">Loading secondary sales...</div>
                ) : rows.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">No secondary sales found for selected period.</div>
                ) : (
                    <div className="space-y-2.5">
                        {rows.map((r, i) => (
                            <div key={i} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-xs font-black text-gray-800">
                                            {type === 'Headquarter' ? (r.headquarter || 'HQ') : (r.stockistName || r.stockist || 'Stockist')}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-semibold">
                                        HQ: {r.headquarter || '-'} • {r.month} {r.year}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-emerald-600">
                                            {type === 'Inventory' ? `${r.quantity || 0} Qty` : `₹${Number(r.totalSales || 0).toLocaleString('en-IN')}`}
                                        </p>
                                    </div>
                                    {type !== 'Inventory' && (
                                        <button onClick={() => openDetail(r)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {detailModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-800 uppercase">{detailModal.title}</h3>
                            <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-3.5 overflow-y-auto divide-y divide-gray-50">
                            {detailModal.items.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-6">No product items found.</p>
                            ) : (
                                detailModal.items.map((it, idx) => (
                                    <div key={idx} className="py-2.5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{it.productName || it.product}</p>
                                            <p className="text-[10px] text-gray-400 font-semibold">Qty: {it.quantity} • Rate: ₹{Number(it.price || 0).toFixed(2)}</p>
                                        </div>
                                        <p className="text-xs font-black text-emerald-600">₹{Number(it.totalSales || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecondarySalesReportView;
