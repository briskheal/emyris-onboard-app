import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Target, Award, RefreshCw, Package } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';
import { getDynamicYears } from '../../utils/dateUtils';

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
                            <Target className="w-4 h-4 text-indigo-400" />
                            TARGETS & <span className="text-indigo-400">ACHIEVEMENT</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-semibold">XLA Allocated Targets & Live Sales Achievement</p>
                    </div>
                </div>
                <button 
                    onClick={fetchTargets} 
                    className="p-2 rounded-xl bg-slate-700/60 text-indigo-400 hover:bg-slate-700 active:scale-95"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                {/* Filter Box */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Month</label>
                            <select 
                                value={month} 
                                onChange={e => setMonth(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                            >
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
                            <select 
                                value={year} 
                                onChange={e => setYear(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                            >
                                {getDynamicYears(2, 2).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Target Scorecard */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Total Monthly Target ({month} {year})</p>
                            <h2 className="text-2xl font-black mt-0.5 text-white">₹{Math.round(Number(s.totalTarget || 0)).toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/15 text-xs">
                        <div>
                            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Lump-Sum Target</span>
                            <strong className="font-black text-white">₹{Math.round(Number(s.lumpSumTarget || 0)).toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Product-Wise Target</span>
                            <strong className="font-black text-white">₹{Math.round(Number(s.productTargetTotal || 0)).toLocaleString('en-IN')}</strong>
                        </div>
                    </div>
                </div>

                {/* Achievement Progress Cards */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70 space-y-3.5">
                    <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-400" /> Achievement Breakdown
                    </h3>

                    {/* Primary Sales vs Target */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">Primary Sales Achievement</span>
                            <span className="text-sky-400">₹{Math.round(Number(s.primarySalesAchieved || 0)).toLocaleString('en-IN')} ({s.primaryAchievementPct || 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Number(s.primaryAchievementPct || 0))}%` }} />
                        </div>
                    </div>

                    {/* Secondary Sales vs Target */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">Secondary Sales Achievement</span>
                            <span className="text-emerald-400">₹{Math.round(Number(s.secondarySalesAchieved || 0)).toLocaleString('en-IN')} ({s.secondaryAchievementPct || 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Number(s.secondaryAchievementPct || 0))}%` }} />
                        </div>
                    </div>

                    {/* POB Achieved */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400">POB (Personal Order Booking)</span>
                        <span className="font-black text-indigo-400">₹{Math.round(Number(s.pobAchieved || 0)).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Product-Wise Target vs Actual */}
                <div className="bg-slate-800/90 rounded-2xl shadow-lg border border-slate-700/70 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-700/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-indigo-400" /> Product Target vs Sales ({productTargets.length})
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-xs font-bold text-slate-400">Loading product targets...</div>
                    ) : productTargets.length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-slate-400">No product-specific targets or sales found for {month} {year}.</div>
                    ) : (
                        <div className="divide-y divide-slate-700/40">
                            {productTargets.map((pt: any, idx: number) => (
                                <div key={idx} className="p-3.5 space-y-2 hover:bg-slate-700/20 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-white">{pt.productName}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pt.achievementPct >= 100 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'}`}>
                                            {pt.achievementPct}% Achieved
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-400">
                                        <div>
                                            <span className="block text-slate-500 uppercase text-[9px] font-bold">Target</span>
                                            <strong className="text-slate-200">₹{Math.round(Number(pt.targetAmount || 0)).toLocaleString('en-IN')} ({pt.targetQty}u)</strong>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 uppercase text-[9px] font-bold">Primary</span>
                                            <strong className="text-sky-400">₹{Math.round(Number(pt.achievedPrimaryVal || 0)).toLocaleString('en-IN')} ({pt.achievedPrimaryQty}u)</strong>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 uppercase text-[9px] font-bold">Secondary</span>
                                            <strong className="text-emerald-400">₹{Math.round(Number(pt.achievedSecondaryVal || 0)).toLocaleString('en-IN')} ({pt.achievedSecondaryQty}u)</strong>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" style={{ width: `${Math.min(100, Number(pt.achievementPct || 0))}%` }} />
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