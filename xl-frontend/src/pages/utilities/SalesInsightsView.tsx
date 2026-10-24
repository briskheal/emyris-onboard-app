import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, BarChart3, Package, RefreshCw } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SalesInsightsView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [endMonth, setEndMonth] = useState(MONTHS[new Date().getMonth()]);
    const [endYear, setEndYear] = useState(String(new Date().getFullYear()));
    const [dataType, setDataType] = useState<'Price' | 'Quantity'>('Price');
    const [chartData, setChartData] = useState<any[]>([]);
    const [productRows, setProductRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInsights = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const [chartRes, tableRes] = await Promise.all([
                axios.get('/api/xl/reports/sales-insights/charts', {
                    params: {
                        endMonth,
                        endYear,
                        dataType,
                        valueFormat: 'Thousands',
                        filterType: 'User',
                        filterValue: selectedUser.employeeId
                    }
                }),
                axios.get('/api/xl/reports/sales-insights/table', {
                    params: {
                        endMonth,
                        endYear,
                        drillLevel: 'user_products',
                        filterValue: selectedUser.employeeId
                    }
                })
            ]);
            if (chartRes.data?.success) setChartData(chartRes.data.data || []);
            if (tableRes.data?.success) setProductRows(tableRes.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser) fetchInsights();
    }, [selectedUser, endMonth, endYear, dataType]);

    const maxChartVal = Math.max(
        1,
        ...chartData.map(c => Math.max(Number(c.rawPrimary || 0), Number(c.rawSecondary || 0)))
    );

    const totalPriVal = chartData.reduce((s, c) => s + Number(c.rawPrimary || 0), 0);
    const totalSecVal = chartData.reduce((s, c) => s + Number(c.rawSecondary || 0), 0);

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
                            <BarChart3 className="w-4 h-4 text-sky-400" />
                            SALES <span className="text-sky-400">INSIGHTS</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-semibold">6-Month Primary vs Secondary Analytics</p>
                    </div>
                </div>
                <button 
                    onClick={fetchInsights} 
                    className="p-2 rounded-xl bg-slate-700/60 text-sky-400 hover:bg-slate-700 active:scale-95"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                {/* Filters */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Up To Month</label>
                            <select 
                                value={endMonth} 
                                onChange={e => setEndMonth(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                            >
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
                            <select 
                                value={endYear} 
                                onChange={e => setEndYear(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                            >
                                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Metric</label>
                            <select 
                                value={dataType} 
                                onChange={e => setDataType(e.target.value as any)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                            >
                                <option value="Price">Value (₹)</option>
                                <option value="Quantity">Units (Qty)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-blue-600/90 to-indigo-800/90 rounded-2xl p-3.5 text-white shadow-md border border-blue-500/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">6M Primary {dataType === 'Price' ? 'Sales' : 'Qty'}</p>
                        <p className="text-lg font-black mt-1 text-white">
                            {dataType === 'Price' ? `₹${Math.round(totalPriVal).toLocaleString('en-IN')}` : totalPriVal.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600/90 to-teal-800/90 rounded-2xl p-3.5 text-white shadow-md border border-emerald-500/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">6M Secondary {dataType === 'Price' ? 'Sales' : 'Qty'}</p>
                        <p className="text-lg font-black mt-1 text-white">
                            {dataType === 'Price' ? `₹${Math.round(totalSecVal).toLocaleString('en-IN')}` : totalSecVal.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {/* 6-Month Bar Chart */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70">
                    <div className="flex items-center justify-between mb-3.5">
                        <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-sky-400" /> 6-Month Trend
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span> Primary
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Secondary
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {chartData.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No trend data available for selected period.</p>
                        ) : (
                            chartData.map((c, idx) => {
                                const pPct = Math.min(100, Math.round((Number(c.rawPrimary || 0) / maxChartVal) * 100));
                                const sPct = Math.min(100, Math.round((Number(c.rawSecondary || 0) / maxChartVal) * 100));
                                return (
                                    <div key={idx} className="space-y-1.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                                            <span>{c.month} {c.year}</span>
                                            <span className="text-[10px] text-slate-400">
                                                <span className="text-sky-400 font-bold">P:</span> {dataType === 'Price' ? `₹${Math.round(Number(c.rawPrimary || 0)).toLocaleString('en-IN')}` : c.rawPrimary}
                                                <span className="mx-1 text-slate-600">|</span>
                                                <span className="text-emerald-400 font-bold">S:</span> {dataType === 'Price' ? `₹${Math.round(Number(c.rawSecondary || 0)).toLocaleString('en-IN')}` : c.rawSecondary}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                            <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pPct}%` }} />
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${sPct}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Product Breakdown */}
                <div className="bg-slate-800/90 rounded-2xl shadow-lg border border-slate-700/70 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-700/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-sky-400" /> Product-Wise Breakdown (6M)
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                            {productRows.length} Products
                        </span>
                    </div>
                    <div className="divide-y divide-slate-700/40 max-h-96 overflow-y-auto">
                        {productRows.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">No product transactions found.</p>
                        ) : (
                            productRows.map((row, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-xs font-bold text-slate-100 truncate">{row.productName}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                            Pri Qty: <span className="text-sky-400 font-bold">{row.primarySalesQty || 0}</span> • Sec Qty: <span className="text-emerald-400 font-bold">{row.secondarySalesQty || 0}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] font-black text-sky-400">P: ₹{Math.round(Number(row.primarySalesValue || 0)).toLocaleString('en-IN')}</p>
                                        <p className="text-[11px] font-black text-emerald-400">S: ₹{Math.round(Number(row.secondarySalesValue || 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesInsightsView;