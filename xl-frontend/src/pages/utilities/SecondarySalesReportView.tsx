import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Eye, PlusCircle, History, RefreshCw, X, Building2, ChevronDown, Package, Maximize2 } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';
import { getDynamicYears } from '../../utils/dateUtils';

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

    // Inline expansion state & cache
    const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
    const [rowCache, setRowCache] = useState<Record<string, { loading: boolean; items: any[] }>>({});

    // Popout modal state (soft background)
    const [detailModal, setDetailModal] = useState<{ title: string; items: any[]; loading?: boolean } | null>(null);

    const fetchReport = async () => {
        if (!selectedUser) return;
        setLoading(true);
        setExpandedRowKey(null);
        setRowCache({});
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

    const getRowKey = (r: any, i: number) => 
        `${r.stockist || ''}_${r.headquarter || ''}_${r.month || ''}_${r.year || ''}_${i}`;

    const fetchDetailItems = async (row: any): Promise<any[]> => {
        const res = await axios.get('/api/xl/reports/secondary-sales/detail', {
            params: {
                type: 'Product',
                stockist: row.stockist || row.stockistName,
                headquarter: row.headquarter,
                month: row.month,
                year: row.year
            }
        });
        return res.data?.success ? (res.data.data || []) : [];
    };

    // Toggle inline accordion
    const handleToggleInline = async (row: any, key: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (expandedRowKey === key) {
            setExpandedRowKey(null);
            return;
        }

        setExpandedRowKey(key);

        if (!rowCache[key] || !rowCache[key].items.length) {
            setRowCache(prev => ({ ...prev, [key]: { loading: true, items: [] } }));
            try {
                const items = await fetchDetailItems(row);
                setRowCache(prev => ({ ...prev, [key]: { loading: false, items } }));
            } catch (err) {
                console.error(err);
                setRowCache(prev => ({ ...prev, [key]: { loading: false, items: [] } }));
            }
        }
    };

    // Open structured modal dialog
    const handleOpenModal = async (row: any, key: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const title = `${row.stockistName || row.stockist || row.headquarter || 'Details'} (${row.month} ${row.year})`;

        if (rowCache[key]?.items?.length) {
            setDetailModal({ title, items: rowCache[key].items, loading: false });
            return;
        }

        setDetailModal({ title, items: [], loading: true });
        try {
            const items = await fetchDetailItems(row);
            setDetailModal({ title, items, loading: false });
            setRowCache(prev => ({ ...prev, [key]: { loading: false, items } }));
        } catch (err) {
            console.error(err);
            setDetailModal({ title, items: [], loading: false });
        }
    };

    const totalAmount = rows.reduce((s, r) => s + Number(r.totalSales || 0), 0);
    const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 pb-24 font-sans">
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => navigate('/utilities')} 
                        className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            SECONDARY <span className="text-emerald-400">SALES</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-semibold">Stockist & HQ Wise Secondary Sales</p>
                    </div>
                </div>
                <button 
                    onClick={fetchReport} 
                    className="p-2 rounded-xl bg-slate-700/60 text-emerald-400 hover:bg-slate-700 active:scale-95"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                {/* Quick Action Links */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        onClick={() => navigate('/creation/secondary-sales')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold shadow-md active:scale-95 transition"
                    >
                        <PlusCircle className="w-4 h-4" /> New Sec. Sales
                    </button>
                    <button
                        onClick={() => navigate('/creation/secondary-sales/history')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold shadow-md active:scale-95 transition"
                    >
                        <History className="w-4 h-4 text-emerald-400" /> Entry History
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Month</label>
                            <div className="flex gap-1.5">
                                <select 
                                    value={startMonth} 
                                    onChange={e => setStartMonth(e.target.value)} 
                                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select 
                                    value={startYear} 
                                    onChange={e => setStartYear(e.target.value)} 
                                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {getDynamicYears(2, 2).map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Month</label>
                            <div className="flex gap-1.5">
                                <select 
                                    value={endMonth} 
                                    onChange={e => setEndMonth(e.target.value)} 
                                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select 
                                    value={endYear} 
                                    onChange={e => setEndYear(e.target.value)} 
                                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {getDynamicYears(2, 2).map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/60">
                        {(['Stockist', 'Headquarter', 'Inventory'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${type === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-emerald-600/90 to-teal-800/90 rounded-2xl p-4 text-white flex items-center justify-between shadow-md border border-emerald-500/20">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                            {type === 'Inventory' ? 'Total Secondary Units' : 'Total Secondary Sales'}
                        </p>
                        <p className="text-xl font-black mt-0.5 text-white">
                            {type === 'Inventory' ? `${totalQty.toLocaleString('en-IN')} Units` : `₹${Math.round(totalAmount).toLocaleString('en-IN')}`}
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-xl">{rows.length} Records</span>
                </div>

                {/* Records List */}
                {loading ? (
                    <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 text-center text-xs font-bold text-slate-400">Loading secondary sales...</div>
                ) : rows.length === 0 ? (
                    <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 text-center text-xs font-bold text-slate-400">No secondary sales found for selected period.</div>
                ) : (
                    <div className="space-y-2.5">
                        {rows.map((r, i) => {
                            const key = getRowKey(r, i);
                            const isExpanded = expandedRowKey === key;
                            const cached = rowCache[key];

                            return (
                                <div 
                                    key={key} 
                                    className={`bg-slate-800/90 rounded-2xl overflow-hidden transition-all shadow-lg border ${
                                        isExpanded ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-700/70 hover:border-slate-600'
                                    }`}
                                >
                                    {/* Card Header (Clickable Accordion Trigger) */}
                                    <div
                                        onClick={(e) => type !== 'Inventory' && handleToggleInline(r, key, e)}
                                        className={`p-3.5 flex items-center justify-between gap-2 select-none ${
                                            type !== 'Inventory' ? 'cursor-pointer' : ''
                                        }`}
                                    >
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <span className="text-xs font-black text-white truncate">
                                                    {type === 'Headquarter' ? (r.headquarter || 'HQ') : (r.stockistName || r.stockist || 'Stockist')}
                                                </span>
                                                {isExpanded && (
                                                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                                        Expanded
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-semibold">
                                                HQ: {r.headquarter || '-'} • {r.month} {r.year}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="text-right">
                                                <p className="text-xs font-black text-emerald-400">
                                                    {type === 'Inventory' ? `${r.quantity || 0} Qty` : `₹${Math.round(Number(r.totalSales || 0)).toLocaleString('en-IN')}`}
                                                </p>
                                            </div>

                                            {type !== 'Inventory' && (
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleToggleInline(r, key, e)}
                                                    className={`p-2 rounded-xl border transition-all ${
                                                        isExpanded 
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 rotate-180' 
                                                            : 'bg-slate-700/80 text-emerald-400 hover:bg-slate-700 border-slate-600'
                                                    }`}
                                                    title={isExpanded ? 'Collapse Product Details' : 'Expand Product Details'}
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Expanded Product Breakdown Panel */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-700/50 bg-slate-950/60 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                                            <div className="flex items-center justify-between text-xs pb-1">
                                                <div className="flex items-center gap-1.5 font-black text-emerald-400 uppercase text-[11px] tracking-wide">
                                                    <Package size={14} /> Product Wise Breakdown
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {cached?.loading ? 'Loading...' : `${cached?.items?.length || 0} Products`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleOpenModal(r, key, e)}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition"
                                                        title="Open in focused dialog"
                                                    >
                                                        <Maximize2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {cached?.loading ? (
                                                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                                    <RefreshCw size={14} className="animate-spin text-emerald-400" />
                                                    <span>Fetching products...</span>
                                                </div>
                                            ) : (cached?.items || []).length === 0 ? (
                                                <div className="py-4 text-center text-xs text-slate-500 italic">
                                                    No product line items found for this record.
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {cached!.items.map((it: any, idx: number) => {
                                                        const qty = Number(it.quantity || 0);
                                                        const rate = Math.round(Number(it.price || 0));
                                                        const lineTotal = Math.round(Number(it.totalSales || 0));

                                                        return (
                                                            <div 
                                                                key={idx} 
                                                                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-bold text-white truncate">
                                                                        {it.productName || it.product}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                                        <span>Qty: <strong className="text-emerald-300">{qty.toLocaleString('en-IN')}</strong></span>
                                                                        <span>•</span>
                                                                        <span>Rate: <strong className="text-slate-200">₹{rate.toLocaleString('en-IN')}</strong></span>
                                                                    </div>
                                                                </div>
                                                                <div className="font-black text-emerald-400 shrink-0 text-right">
                                                                    ₹{lineTotal.toLocaleString('en-IN')}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Focused Product Detail Dialog (Soft Non-Dimming Backdrop) */}
            {detailModal && (
                <div 
                    onClick={() => setDetailModal(null)}
                    className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl"
                    >
                        {/* Dialog Header */}
                        <div className="p-4 border-b border-slate-700/60 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                    Product Wise Breakdown
                                </span>
                                <h3 className="text-sm font-black text-white mt-0.5">{detailModal.title}</h3>
                            </div>
                            <button 
                                onClick={() => setDetailModal(null)} 
                                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Product Items List */}
                        <div className="p-4 overflow-y-auto space-y-2 flex-1">
                            {detailModal.loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                                    <RefreshCw size={20} className="animate-spin text-emerald-400" />
                                    <span>Loading product breakdown...</span>
                                </div>
                            ) : detailModal.items.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">No product items found.</p>
                            ) : (
                                detailModal.items.map((it, idx) => {
                                    const qty = Number(it.quantity || 0);
                                    const rate = Math.round(Number(it.price || 0));
                                    const lineTotal = Math.round(Number(it.totalSales || 0));

                                    return (
                                        <div 
                                            key={idx} 
                                            className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition"
                                        >
                                            <div>
                                                <div className="font-bold text-white text-xs">{it.productName || it.product}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                                    <span className="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700 text-slate-300">
                                                        Qty: <strong className="text-emerald-300">{qty.toLocaleString('en-IN')}</strong>
                                                    </span>
                                                    <span>Rate: <strong className="text-slate-200">₹{rate.toLocaleString('en-IN')}</strong></span>
                                                </div>
                                            </div>
                                            <div className="font-black text-emerald-400 text-sm">
                                                ₹{lineTotal.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Dialog Footer Summary */}
                        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                                Total Products: <strong className="text-white">{detailModal.items.length}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setDetailModal(null)}
                                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecondarySalesReportView;
