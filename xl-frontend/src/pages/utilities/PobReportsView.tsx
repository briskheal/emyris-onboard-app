import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowLeft, ShoppingBag, Download, RefreshCw, Package } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

const PobReportsView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(todayStr);
    const [tab, setTab] = useState<'orders' | 'products'>('orders');
    const [data, setData] = useState<any>({ summary: { totalOrders: 0, totalQty: 0, totalValue: 0 }, orders: [], productWise: [] });
    const [loading, setLoading] = useState(false);

    const fetchPob = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/xl/reports/pob', {
                params: {
                    employeeId: selectedUser.employeeId,
                    startDate,
                    endDate
                }
            });
            if (res.data?.success) {
                setData(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser) fetchPob();
    }, [selectedUser, startDate, endDate]);

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const orderRows = (data.orders || []).map((o: any, idx: number) => ({
            'Sr No.': idx + 1,
            'Date': o.displayDate,
            'Employee': o.employeeName,
            'Customer Name': o.entityName,
            'Customer Type': o.entityType,
            'Total Qty': o.totalOrderQty,
            'Order Value (₹)': o.totalOrderValue,
            'Products': (o.items || []).map((i: any) => `${i.productName} (${i.qty})`).join(', ')
        }));
        const prodRows = (data.productWise || []).map((p: any, idx: number) => ({
            'Sr No.': idx + 1,
            'Product Name': p.productName,
            'Orders Count': p.orderCount,
            'Total Qty': p.totalQty,
            'Total Value (₹)': p.totalValue
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows), 'POB Orders');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Product Summary');
        XLSX.writeFile(wb, `POB_Report_${selectedUser?.name || 'User'}_${startDate}_to_${endDate}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">POB Reports</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">Personal Order Booking Analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={handleExport} className="p-2 rounded-lg bg-emerald-50 text-emerald-600" title="Download Excel">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={fetchPob} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-3.5 space-y-3.5">
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700" />
                        </div>
                    </div>
                </div>

                {/* KPI Summary */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Orders</p>
                        <p className="text-base font-black text-blue-600 mt-0.5">{data.summary?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Units</p>
                        <p className="text-base font-black text-indigo-600 mt-0.5">{data.summary?.totalQty || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">POB Value</p>
                        <p className="text-base font-black text-emerald-600 mt-0.5">₹{Number(data.summary?.totalValue || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setTab('orders')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                        Order List ({data.orders?.length || 0})
                    </button>
                    <button onClick={() => setTab('products')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                        Product Summary ({data.productWise?.length || 0})
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">Loading POB data...</div>
                ) : tab === 'orders' ? (
                    (data.orders || []).length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">No POB orders recorded in this date range.</div>
                    ) : (
                        <div className="space-y-2.5">
                            {data.orders.map((o: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">{o.entityType}</span>
                                            <h4 className="text-xs font-black text-gray-800 mt-1">{o.entityName}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-emerald-600">₹{Number(o.totalOrderValue || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] font-semibold text-gray-400">{o.displayDate}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-50 pt-2 space-y-1">
                                        {(o.items || []).map((it: any, i2: number) => (
                                            <div key={i2} className="flex justify-between text-[11px] text-gray-600">
                                                <span className="font-semibold">{it.productName}</span>
                                                <span className="font-bold">Qty: {it.qty} • ₹{Number(it.value || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    (data.productWise || []).length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">No product POB records found.</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                            {data.productWise.map((p: any, idx: number) => (
                                <div key={idx} className="p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{p.productName}</p>
                                            <p className="text-[10px] font-semibold text-gray-400">{p.orderCount} Orders • {p.totalQty} Units</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-emerald-600">₹{Number(p.totalValue || 0).toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default PobReportsView;
