import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ChevronLeft, Calendar, Download, RefreshCw } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';
import { getDynamicYears } from '../../utils/dateUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyReportsView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchMonthly = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/xl/reports/monthly-summary', {
                params: {
                    employeeId: selectedUser.employeeId,
                    month,
                    year
                }
            });
            if (res.data?.success) {
                setReport(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser) fetchMonthly();
    }, [selectedUser, month, year]);

    const handleExport = () => {
        if (!report?.dailyRows) return;
        const wb = XLSX.utils.book_new();
        const rows = report.dailyRows.map((r: any) => ({
            'Date': r.displayDate,
            'Day': r.dayOfWeek,
            'Status': r.status,
            'Planned Activity': r.plannedActivity,
            'Planned City/Tour': r.plannedCities,
            'Punch In': r.punchIn,
            'Punch Out': r.punchOut,
            'Dr Planned': r.plannedDoctorsCount,
            'Dr Visited': r.doctorCalls,
            'Chemist Calls': r.chemistCalls,
            'Stockist Calls': r.stockistCalls,
            'Total Calls': r.totalCalls,
            'POB Value (₹)': r.pobValue,
            'Expense (₹)': r.expenseAmount,
            'Visited Entities': r.visitedDoctors
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), `${month}_${year}`);
        XLSX.writeFile(wb, `Monthly_Report_${selectedUser?.name || 'User'}_${month}_${year}.xlsx`);
    };

    const s = report?.summary || {};

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
                            <Calendar className="w-4 h-4 text-sky-400" />
                            MONTHLY <span className="text-sky-400">REPORTS</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-semibold">Day-by-Day Consolidated Work Summary</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExport} 
                        className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95" 
                        title="Export Excel"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={fetchMonthly} 
                        className="p-2 rounded-xl bg-slate-700/60 text-sky-400 hover:bg-slate-700 active:scale-95"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
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
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                            >
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
                            <select 
                                value={year} 
                                onChange={e => setYear(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                            >
                                {getDynamicYears(2, 2).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Approvals Status Strip */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/70 flex items-center justify-between shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tour Program</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${s.tpStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                            {s.tpStatus || 'Not Submitted'}
                        </span>
                    </div>
                    <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/70 flex items-center justify-between shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Call Plan</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${s.cpStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                            {s.cpStatus || 'Not Submitted'}
                        </span>
                    </div>
                </div>

                {/* Monthly Scorecard Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Working Days</p>
                        <p className="text-base font-black text-sky-400 mt-0.5">{s.workingDays || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Leaves / Hol.</p>
                        <p className="text-base font-black text-amber-400 mt-0.5">{s.leaveDays || 0} / {s.holidaysCount || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Calls/Day</p>
                        <p className="text-base font-black text-indigo-400 mt-0.5">{s.avgDoctorCalls || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dr / Ch / St</p>
                        <p className="text-xs font-black text-white mt-0.5">{s.totalDoctorCalls || 0} / {s.totalChemistCalls || 0} / {s.totalStockistCalls || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total POB</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">₹{Math.round(Number(s.totalPobValue || 0)).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 text-center shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Expenses</p>
                        <p className="text-xs font-black text-rose-400 mt-0.5">₹{Math.round(Number(s.totalExpense || 0)).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Day-by-Day List */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-300 uppercase px-1">Day-by-Day Activity Log</h3>
                    {loading ? (
                        <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 text-center text-xs font-bold text-slate-400">Loading monthly summary...</div>
                    ) : (
                        (report?.dailyRows || []).map((r: any, idx: number) => {
                            const sStr = String(r.status || '');
                            const badgeStyle = sStr.startsWith('Field Work')
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : sStr.startsWith('Holiday')
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : sStr.startsWith('Leave')
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : sStr === 'Sunday'
                                ? 'bg-slate-700 text-slate-300 border-slate-600'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                            return (
                                <div key={idx} className="bg-slate-800/90 rounded-2xl p-3.5 shadow-lg border border-slate-700/70 space-y-2 hover:border-slate-600 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white">{r.displayDate}</span>
                                            <span className="text-[10px] font-bold text-slate-400">({r.dayOfWeek})</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                        <span>Tour: <strong className="text-white">{r.plannedCities || r.plannedActivity}</strong></span>
                                        <span>Calls: <strong className="text-sky-400">{r.doctorCalls}D • {r.chemistCalls}C • {r.stockistCalls}S</strong></span>
                                    </div>
                                    {(r.punchIn !== '-' || r.pobValue > 0 || r.expenseAmount > 0) && (
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-700/50">
                                            <span>Punch: {r.punchIn} - {r.punchOut}</span>
                                            <span>POB: ₹{Math.round(Number(r.pobValue || 0))} • Exp: ₹{Math.round(Number(r.expenseAmount || 0))}</span>
                                        </div>
                                    )}
                                    {r.visitedDoctors && (
                                        <p className="text-[10px] text-slate-400 truncate">Visited: {r.visitedDoctors}</p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonthlyReportsView;