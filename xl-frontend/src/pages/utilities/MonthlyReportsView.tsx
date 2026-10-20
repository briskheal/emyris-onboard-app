import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowLeft, Calendar, Download, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

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
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Monthly Reports</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">Day-by-Day Consolidated Work Summary</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={handleExport} className="p-2 rounded-lg bg-emerald-50 text-emerald-600" title="Export Excel">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={fetchMonthly} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
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

                {/* Approvals Status Strip */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Tour Program</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${s.tpStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {s.tpStatus || 'Not Submitted'}
                        </span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Call Plan</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${s.cpStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {s.cpStatus || 'Not Submitted'}
                        </span>
                    </div>
                </div>

                {/* Monthly Scorecard Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Working Days</p>
                        <p className="text-sm font-black text-blue-600 mt-0.5">{s.workingDays || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Leaves / Hol.</p>
                        <p className="text-sm font-black text-amber-600 mt-0.5">{s.leaveDays || 0} / {s.holidaysCount || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Calls/Day</p>
                        <p className="text-sm font-black text-indigo-600 mt-0.5">{s.avgDoctorCalls || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Dr / Ch / St</p>
                        <p className="text-xs font-black text-gray-800 mt-0.5">{s.totalDoctorCalls || 0} / {s.totalChemistCalls || 0} / {s.totalStockistCalls || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total POB</p>
                        <p className="text-xs font-black text-emerald-600 mt-0.5">₹{Number(s.totalPobValue || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Expenses</p>
                        <p className="text-xs font-black text-rose-600 mt-0.5">₹{Number(s.totalExpense || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Day-by-Day List */}
                <div className="space-y-2">
                    <h3 className="text-xs font-black text-gray-700 uppercase px-1">Day-by-Day Activity Log</h3>
                    {loading ? (
                        <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">Loading monthly summary...</div>
                    ) : (
                        (report?.dailyRows || []).map((r: any, idx: number) => {
                            const statusColors: Record<string, string> = {
                                'Field Work': 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                'Leave': 'bg-rose-50 text-rose-600 border-rose-200',
                                'Holiday': 'bg-purple-50 text-purple-600 border-purple-200',
                                'Sunday': 'bg-gray-100 text-gray-500 border-gray-200',
                                'Absent / No DCR': 'bg-amber-50 text-amber-600 border-amber-200'
                            };
                            return (
                                <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-800">{r.displayDate}</span>
                                            <span className="text-[10px] font-bold text-gray-400">({r.dayOfWeek})</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[r.status] || 'bg-gray-50 text-gray-600'}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                                        <span>Tour: <strong className="text-gray-800">{r.plannedCities || r.plannedActivity}</strong></span>
                                        <span>Calls: <strong className="text-blue-600">{r.doctorCalls}D • {r.chemistCalls}C • {r.stockistCalls}S</strong></span>
                                    </div>
                                    {(r.punchIn !== '-' || r.pobValue > 0 || r.expenseAmount > 0) && (
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                                            <span>Punch: {r.punchIn} - {r.punchOut}</span>
                                            <span>POB: ₹{r.pobValue} • Exp: ₹{r.expenseAmount}</span>
                                        </div>
                                    )}
                                    {r.visitedDoctors && (
                                        <p className="text-[10px] text-gray-500 truncate">Visited: {r.visitedDoctors}</p>
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
