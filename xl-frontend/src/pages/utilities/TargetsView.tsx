import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Target, Award, TrendingUp, RefreshCw, Package } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TargetsView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchTargets = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/xl/reports/targets', {
                params: {
                    employeeId: selectedUser.employeeId,
                    month,
                    year
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
        if (selectedUser) fetchTargets();
    }, [selectedUser, month, year]);

    const s = data?.summary || {};
    const productTargets = data?.productTargets || [];

    return (
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Targets vs Achievement</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">XLA Allocated Targets & Live Sales Achievement</p>
                    </div>
                </div>
                <button onClick={fetchTargets} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Month</label>
                            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-gray-700">
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Year</label>
                            <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-gray-700">
                                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Target Scorecard */}
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase opacity-80">Total Monthly Target ({month} {year})</p>
                            <h2 className="text-2xl font-black mt-0.5">₹{Number(s.totalTarget || 0).toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs">
                        <div>
                            <span className="text-[10px] opacity-75 block uppercase">Lump-Sum Target</span>
                            <strong className="font-black">₹{Number(s.lumpSumTarget || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                            <span className="text-[10px] opacity-75 block uppercase">Product-Wise Target</span>
                            <strong className="font-black">₹{Number(s.productTargetTotal || 0).toLocaleString('en-IN')}</strong>
                        </div>
                    </div>
                </div>

                {/* Achievement Progress Cards */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3.5">
                    <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-blue-600" /> Achievement Breakdown
                    </h3>

                    {/* Primary Sales vs Target */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-600">Primary Sales Achievement</span>
                            <span className="text-blue-600">₹{Number(s.primarySalesAchieved || 0).toLocaleString('en-IN')} ({s.primaryAchievementPct || 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Number(s.primaryAchievementPct || 0))}%` }} />
                        </div>
                    </div>

                    {/* Secondary Sales vs Target */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-600">Secondary Sales Achievement</span>
                            <span className="text-emerald-600">₹{Number(s.secondarySalesAchieved || 0).toLocaleString('en-IN')} ({s.secondaryAchievementPct || 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Number(s.secondaryAchievementPct || 0))}%` }} />
                        </div>
                    </div>

                    {/* POB Achieved */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-500">POB (Personal Order Booking)</span>
                        <span className="font-black text-indigo-600">₹{Number(s.pobAchieved || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Product-Wise Target vs Actual */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-indigo-600" /> Product Target vs Sales ({productTargets.length})
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-xs font-bold text-gray-400">Loading product targets...</div>
                    ) : productTargets.length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-gray-400">No product-specific targets or sales found for {month} {year}.</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {productTargets.map((pt: any, idx: number) => (
                                <div key={idx} className="p-3.5 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-800">{pt.productName}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${pt.achievementPct >= 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {pt.achievementPct}% Achieved
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-gray-500">
                                        <div>
                                            <span className="block text-gray-400 uppercase">Target</span>
                                            <strong className="text-gray-800">₹{Number(pt.targetAmount || 0).toLocaleString('en-IN')} ({pt.targetQty}u)</strong>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 uppercase">Primary</span>
                                            <strong className="text-blue-600">₹{Number(pt.achievedPrimaryVal || 0).toLocaleString('en-IN')} ({pt.achievedPrimaryQty}u)</strong>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 uppercase">Secondary</span>
                                            <strong className="text-emerald-600">₹{Number(pt.achievedSecondaryVal || 0).toLocaleString('en-IN')} ({pt.achievedSecondaryQty}u)</strong>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, Number(pt.achievementPct || 0))}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TargetsView;
