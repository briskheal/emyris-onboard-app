import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, BarChart3, Package, RefreshCw } from 'lucide-react';
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
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Sales Insights</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">6-Month Primary vs Secondary Analytics</p>
                    </div>
                </div>
                <button onClick={fetchInsights} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Up To Month</label>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-700">
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Year</label>
                            <select value={endYear} onChange={e => setEndYear(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-700">
                                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Metric</label>
                            <select value={dataType} onChange={e => setDataType(e.target.value as any)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-700">
                                <option value="Price">Value (₹)</option>
                                <option value="Quantity">Units (Qty)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-3.5 text-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase opacity-80">6M Primary {dataType === 'Price' ? 'Sales' : 'Qty'}</p>
                        <p className="text-lg font-black mt-1">
                            {dataType === 'Price' ? `₹${totalPriVal.toLocaleString('en-IN')}` : totalPriVal.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-3.5 text-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase opacity-80">6M Secondary {dataType === 'Price' ? 'Sales' : 'Qty'}</p>
                        <p className="text-lg font-black mt-1">
                            {dataType === 'Price' ? `₹${totalSecVal.toLocaleString('en-IN')}` : totalSecVal.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {/* 6-Month Bar Chart */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-blue-600" /> 6-Month Trend
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span> Primary</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Secondary</span>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {chartData.map((c, idx) => {
                            const pPct = Math.min(100, Math.round((Number(c.rawPrimary || 0) / maxChartVal) * 100));
                            const sPct = Math.min(100, Math.round((Number(c.rawSecondary || 0) / maxChartVal) * 100));
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-gray-700">
                                        <span>{c.month} {c.year}</span>
                                        <span className="text-[10px] text-gray-500">
                                            P: {dataType === 'Price' ? `₹${Number(c.rawPrimary || 0).toLocaleString('en-IN')}` : c.rawPrimary} | S: {dataType === 'Price' ? `₹${Number(c.rawSecondary || 0).toLocaleString('en-IN')}` : c.rawSecondary}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pPct}%` }} />
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${sPct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Product Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-indigo-600" /> Product-Wise Breakdown (6M)
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400">{productRows.length} Products</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                        {productRows.map((row, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-800">{row.productName}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                        Pri Qty: <span className="text-blue-600 font-bold">{row.primarySalesQty}</span> • Sec Qty: <span className="text-emerald-600 font-bold">{row.secondarySalesQty}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-blue-600">P: ₹{Number(row.primarySalesValue || 0).toLocaleString('en-IN')}</p>
                                    <p className="text-[11px] font-black text-emerald-600">S: ₹{Number(row.secondarySalesValue || 0).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesInsightsView;
