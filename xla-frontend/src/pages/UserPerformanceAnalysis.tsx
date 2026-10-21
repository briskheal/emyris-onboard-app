import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Calendar, Settings, Award, User, Save, Check
} from 'lucide-react';

function SquareMonthPicker({ value, onChange, label }: { value: string, onChange: (v: string) => void, label?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const parts = (value || '').trim().split(' ');
    const currentMonth = parts[0] || 'Sep';
    const currentYear = parseInt(parts[1]) || new Date().getFullYear();

    const [viewYear, setViewYear] = useState<number>(currentYear);

    useEffect(() => {
        const p = (value || '').trim().split(' ');
        if (p[1]) {
            const y = parseInt(p[1]);
            if (!isNaN(y)) setViewYear(y);
        }
    }, [value]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const handleSelectMonth = (m: string) => {
        onChange(`${m} ${viewYear}`);
        setIsOpen(false);
    };

    return (
        <div ref={pickerRef} className="relative w-64 select-none">
            {label && (
                <label className="block text-[11px] font-bold text-sky-400 mb-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#1e243d] text-slate-200 px-3.5 py-2.5 rounded-lg text-sm border border-sky-500/50 hover:border-sky-400 outline-none transition-colors cursor-pointer flex items-center justify-between shadow-sm"
            >
                <span className="font-medium text-white">{value || `${currentMonth} ${currentYear}`}</span>
                <Calendar size={16} className="text-sky-400" />
            </div>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-[270px] bg-[#1e243d] border border-sky-500/40 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#363e63]">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewYear(y => y - 1); }}
                            className="p-1 rounded hover:bg-[#282f4d] text-slate-300 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-bold text-base text-white tracking-wide">
                            {viewYear}
                        </span>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewYear(y => y + 1); }}
                            className="p-1 rounded hover:bg-[#282f4d] text-slate-300 hover:text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {months.map(m => {
                            const isSelected = value === `${m} ${viewYear}`;
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleSelectMonth(m)}
                                    className={`py-2 px-1 text-center text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                                        isSelected 
                                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/40 font-bold' 
                                            : 'text-slate-300 hover:bg-[#282f4d] hover:text-white border border-[#363e63]/40'
                                    }`}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}



// Budget vs Actual Variance Coloring: >100% Green, 80-90% Yellow, <80% Red
const getVarianceColor = (pct: number) => {
    if (pct > 100) return 'text-emerald-400 font-bold';
    if (pct >= 80) return 'text-yellow-400 font-bold';
    return 'text-rose-400 font-bold';
};

const getVarianceBadge = (pct: number) => {
    if (pct > 100) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold';
    if (pct >= 80) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold';
    return 'bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold';
};

function UserKpisView({ userRow, selectedMonth, onBack, onViewKpi }: { userRow: any, selectedMonth: string, onBack: () => void, onViewKpi: (k: string) => void }) {
    const kpis = [
        'Customer ROI Analysis',
        'Outstanding Analysis',
        'Effort Analysis',
        'Brand Analysis',
        'Key Customer Analysis',
        'Account Analysis'
    ];
    return (
        <div className="w-full pb-24 px-2 md:px-4">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center text-[#a1a5b7] gap-3">
                    <button onClick={onBack} className="p-2 rounded-lg bg-[#1e243d] border border-[#363e63] hover:bg-[#282f4d] hover:text-white transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            ANALYSIS REPORTS OF {userRow.user.toUpperCase()}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Select a report to view detailed weekly breakdown
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="border border-[#363e63] rounded-lg shadow-xl overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                        <thead className="bg-[#1e243d]">
                            <tr>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-20">Sr no.</th>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-left font-bold text-sky-300 uppercase tracking-wider">Report Name</th>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Percentage<br/>Achieved</th>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Points</th>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Achieved Points</th>
                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-20">View</th>
                                <th className="border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-24">Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kpis.map((kpiName, idx) => {
                                const kpiData = userRow.kpiBreakdown && userRow.kpiBreakdown[kpiName] ? userRow.kpiBreakdown[kpiName] : { percentage: 0, max: 0, points: 0 };
                                return (
                                    <tr key={kpiName} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-medium">{idx + 1}</td>
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-left font-semibold text-white">{kpiName}</td>
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-center"><span className={`inline-block ${getVarianceBadge(Number(kpiData.percentage || 0))}`}>{(kpiData.percentage || 0).toFixed(2)} %</span></td>
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-medium text-slate-300">{(kpiData.max || 0).toFixed(2)}</td>
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300">{(kpiData.points || 0).toFixed(2)}</td>
                                        <td className="border-r border-b border-[#363e63] px-4 py-3 text-center">
                                            <button onClick={() => onViewKpi(kpiName)} className="text-sky-400 hover:text-white transition-colors p-1 rounded hover:bg-sky-500/20">
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            </button>
                                        </td>
                                        <td className="border-b border-[#363e63] px-4 py-3 text-center">
                                            <button onClick={() => handleDownloadExcel(userRow.userId, selectedMonth)} className="text-sky-400 hover:text-white transition-colors p-1 rounded hover:bg-sky-500/20">
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KpiDetailsView({ userRow, kpiName, selectedMonth, onBack }: { userRow: any, kpiName: string, selectedMonth: string, onBack: () => void }) {
    const kpiData = userRow.kpiBreakdown && userRow.kpiBreakdown[kpiName] ? userRow.kpiBreakdown[kpiName] : { percentage: 0, max: 0, points: 0, data: [] };
    const [monthStr, yearStr] = selectedMonth.split(' ');
    const isEffort = kpiName === 'Effort Analysis';

    let tableContent;
    
    if (isEffort) {
        const matrix = kpiData.matrix || [];
        tableContent = (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                    <thead className="bg-[#1e243d]">
                        <tr>
                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-left font-bold text-sky-300 uppercase tracking-wider sticky left-0 bg-[#1e243d] z-10">Metrics</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 1</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 2</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 3</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 4</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 5</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 6</th>
                            <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-400 uppercase tracking-wider bg-[#222a47]">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row: any, i: number) => (
                            <tr key={i} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                <td className="border-r border-b border-[#363e63] px-4 py-2.5 font-semibold text-white whitespace-nowrap sticky left-0 bg-inherit z-10">{row.label}</td>
                                {row.data.map((val: any, colIdx: number) => {
                                    let displayVal = val;
                                    if (typeof val === 'number') {
                                        if (row.label.includes('Percentage')) displayVal = val.toFixed(2) + '%';
                                        else if (row.label.includes('Average')) displayVal = val.toFixed(2);
                                    }
                                    const isTotalCol = colIdx === 6;
                                    return (
                                        <td key={colIdx} className={`border-r border-b border-[#363e63] px-3 py-2.5 text-center ${isTotalCol ? 'font-bold text-sky-300 bg-[#1c233c]/60' : 'text-slate-200 font-medium'}`}>
                                            {displayVal}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    } else {
        const rows = Array.isArray(kpiData.data) ? kpiData.data : [];
        tableContent = (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                    <thead className="bg-[#1e243d]">
                        <tr>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Sr no.</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Entity Name</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Entity Type</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Monthly Target (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 1 Planned (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 1 Achieved (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 2 Planned (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 2 Achieved (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 3 Planned (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 3 Achieved (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 4 Planned (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 4 Achieved (₹)</th>
                            <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 5 Planned (₹)</th>
                            <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">Week 5 Achieved (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={14} className="border-b border-[#363e63] px-6 py-8 text-center text-slate-500">No raw data available for this report</td></tr>
                        ) : (
                            rows.map((r: any, i: number) => {
                                const parseVal = (v: any) => !v || v === '' || Number(v) === 0 ? 'N/A' : Number(v);
                                return (
                                <tr key={i} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-medium">{i + 1}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-medium text-white">{r.entityName || 'N/A'}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-300">{r.entityType || 'Doctor'}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-bold text-sky-300">{parseVal(r.monthlyTarget)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-400">{parseVal(r.week1?.planned)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-semibold text-emerald-400">{parseVal(r.week1?.achieved)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-400">{parseVal(r.week2?.planned)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-semibold text-emerald-400">{parseVal(r.week2?.achieved)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-400">{parseVal(r.week3?.planned)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-semibold text-emerald-400">{parseVal(r.week3?.achieved)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-400">{parseVal(r.week4?.planned)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center font-semibold text-emerald-400">{parseVal(r.week4?.achieved)}</td>
                                    <td className="border-r border-b border-[#363e63] px-3 py-2.5 text-center text-slate-400">{parseVal(r.week5?.planned)}</td>
                                    <td className="border-b border-[#363e63] px-3 py-2.5 text-center font-semibold text-emerald-400">{parseVal(r.week5?.achieved)}</td>
                                </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="w-full pb-24 px-2 md:px-4">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center text-[#a1a5b7] gap-3">
                    <button onClick={onBack} className="p-2 rounded-lg bg-[#1e243d] border border-[#363e63] hover:bg-[#282f4d] hover:text-white transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            {kpiName.toUpperCase()} REPORT OF {userRow.user.toUpperCase()}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Detailed performance breakdown &amp; tracking metrics
                        </p>
                    </div>
                </div>
            </div>

            {/* Compact Excel-styled KPI Summary Bar */}
            <div className="border border-[#363e63] bg-[#1e243d] rounded-lg overflow-hidden mb-6 shadow-md grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#363e63]">
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Month</span>
                    <span className="text-lg font-bold text-white">{monthStr}</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Year</span>
                    <span className="text-lg font-bold text-white">{yearStr}</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Percentage Achieved</span>
                    <span className={`text-lg font-bold ${getVarianceColor(Number(kpiData.percentage || 0))}`}>{(kpiData.percentage || 0).toFixed(2)} %</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Total Points Achieved</span>
                    <span className="text-lg font-bold text-sky-300">{(kpiData.points || 0).toFixed(2)} / {(kpiData.max || 0).toFixed(2)}</span>
                </div>
            </div>
            
            <div className="border border-[#363e63] rounded-lg shadow-xl overflow-hidden mt-6">
                {tableContent}
            </div>
        </div>
    );
}


function handleDownloadExcel(userId: string, selectedMonth: string) {
    if (!userId) {
        alert('User ID is missing');
        return;
    }
    const [month, year] = selectedMonth.split(' ');
    window.location.href = `/api/xl/user-performance/export?userId=${userId}&month=${month}&year=${year}`;
}

export default function UserPerformanceAnalysis() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('settings');
    const [viewState, setViewState] = useState('leaderboard');
    const [selectedRankingUser, setSelectedRankingUser] = useState<any>(null);
    const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Master data
    const [products, setProducts] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);

    const [users, setUsers] = useState<any[]>([]);

    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedReportType, setSelectedReportType] = useState('Effort Analysis');
    const [selectedUser, setSelectedUser] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const [rankingsData, setRankingsData] = useState<any[]>([]);

    
    useEffect(() => {
        if(activeTab === 'rankings' && selectedMonth) {
            setLoading(true);
            const [m, y] = selectedMonth.split(' ');
            axios.get(`/api/xl/user-performance/rankings?month=${m}&year=${y}`)
                .then(res => {
                    if(res.data.success) setRankingsData(res.data.data);
                })
                .finally(() => setLoading(false));
        }
    }, [activeTab, selectedMonth]);

    useEffect(() => {
        const d = new Date();
        setSelectedMonth(d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear());
        
        axios.get('/api/admin/users').then(res => {
            if(res.data.success) {
                setUsers(res.data.users || []);
                if(res.data.users && res.data.users.length > 0) setSelectedUser(res.data.users[0]._id);
            }
        });
    }, []);

    useEffect(() => {
        if(activeTab === 'userwise' && selectedMonth && selectedReportType && selectedUser) {
            const [m, y] = selectedMonth.split(' ');
            axios.get(`/api/xl/user-performance/userwise?month=${m}&year=${y}&reportType=${selectedReportType}&userId=${selectedUser}`)
                .then(res => {
                    if(res.data.success) setReportData(res.data.data);
                });
        }
    }, [activeTab, selectedMonth, selectedReportType, selectedUser]);


    // Settings State
    const [settings, setSettings] = useState({
        weightages: {
            effort: 30,
            brand: 15,
            keyCustomer: 15,
            customerRoi: 10,
            outstanding: 15,
            account: 15
        },
        brandProducts: [] as string[],
        brandSalesSelection: 'Secondary Sales',
        brandTargetAuto: true,
        effortThresholds: { coverage: 90, compliance: 90, drCallAvg: 8, chemistCallAvg: 2 }
    });

    useEffect(() => {
        fetchSettings();
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [pRes, sRes, cRes, dRes] = await Promise.all([
                axios.get('/api/xl/reports/products'),
                axios.get('/api/xl/stockists'),
                axios.get('/api/xl/chemists'),
                axios.get('/api/xl/doctors')
            ]);
            setProducts(pRes.data.data || []);
            setEntities([
                ...(sRes.data.data || []),
                ...(cRes.data.data || []),
                ...(dRes.data.data || [])
            ]);
        } catch (e) {
            console.error('Failed to fetch master data', e);
        }
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/xl/settings/preferences');
            if (res.data.success && res.data.data && res.data.data.userPerformance) {
                setSettings({
                    ...settings,
                    ...res.data.data.userPerformance
                });
            }
        } catch (e) {
            console.error('Failed to fetch settings', e);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        const totalWeightage = Object.values(settings.weightages).reduce((a, b) => Number(a) + Number(b), 0);
        if (totalWeightage !== 100) {
            alert(`Total weightage must be exactly 100%. Currently it is ${totalWeightage}%.`);
            return;
        }

        try {
            const res = await axios.post('/api/xl/settings/preferences', {
                settings: {
                    userPerformance: settings
                }
            });
            if (res.data.success) {
                alert('Settings saved successfully!');
            }
        } catch (e) {
            alert('Failed to save settings.');
            console.error(e);
        }
    };

    const handleWeightageChange = (field: keyof typeof settings.weightages, value: string) => {
        setSettings({
            ...settings,
            weightages: {
                ...settings.weightages,
                [field]: Number(value) || 0
            }
        });
    };

    const totalW = Object.values(settings.weightages).reduce((a, b) => Number(a) + Number(b), 0);

    const toggleProduct = (uid: string) => {
        const p = settings.brandProducts.includes(uid) 
            ? settings.brandProducts.filter(id => id !== uid)
            : [...settings.brandProducts, uid];
        setSettings({ ...settings, brandProducts: p });
    };

    return (
        <div className="h-screen bg-slate-900 flex flex-col md:flex-row font-sans text-slate-100 overflow-hidden relative z-10">
            {/* SIDEBAR */}
            <div className="w-full md:w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0 py-6 overflow-y-auto">
                <div className="px-5 pb-5 mb-4 border-b border-slate-800 flex flex-col gap-3">
                    <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
                        <ArrowLeft size={18} /> <span className="font-bold text-xs tracking-wide text-sky-400 hover:text-white transition-colors">Back to Admin Menu</span>
                    </button>
                    <h2 className="text-white font-bold text-base tracking-wide" style={{ fontSize: 'var(--menu-heading-size, 16px)' }}>
                        User Performance Analysis
                    </h2>
                </div>

                <div className="flex flex-col space-y-1.5 px-4">
                    <button 
                        onClick={() => setActiveTab('rankings')} 
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm ${
                            activeTab === 'rankings' 
                                ? 'bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-semibold'
                        }`}
                    >
                        <Award size={18} className={activeTab === 'rankings' ? 'text-sky-400' : 'text-slate-400'} />
                        Rankings
                    </button>
                    <button 
                        onClick={() => setActiveTab('userwise')} 
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm ${
                            activeTab === 'userwise' 
                                ? 'bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-semibold'
                        }`}
                    >
                        <User size={18} className={activeTab === 'userwise' ? 'text-sky-400' : 'text-slate-400'} />
                        Userwise Reports
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')} 
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm ${
                            activeTab === 'settings' 
                                ? 'bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-semibold'
                        }`}
                    >
                        <Settings size={18} className={activeTab === 'settings' ? 'text-sky-400' : 'text-slate-400'} />
                        Settings
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#14192d]">
{loading && <div className="hidden"></div>}
                
                {activeTab === 'settings' && (
                    <div className="w-full pb-24 px-2 md:px-4 max-w-5xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-slate-100 flex items-center gap-3">
                                <Settings className="text-sky-400" size={28} />
                                Configuration Settings
                            </h2>
                            <button onClick={saveSettings} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                                <Save size={18} />
                                Save
                            </button>
                        </div>

                        {/* 1. REPORT WEIGHTAGE */}
                        <div className="bg-[#1e243d] rounded-xl border border-[#363e63] shadow-xl overflow-hidden mb-8">
                            <div className="bg-[#191e33] p-4 border-b border-[#363e63]">
                                <h3 className="font-bold text-base md:text-lg tracking-wide text-slate-200">Configure Report Weightage</h3>
                                <p className="text-xs text-slate-400 mt-1">Assign percentages to each report. The total must equal 100%.</p>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full border-collapse border border-[#363e63] text-left text-xs md:text-sm">
                                    <thead className="bg-[#191e33]">
                                        <tr className="text-sky-300 uppercase tracking-wider">
                                            <th className="border-r border-b border-[#363e63] py-3 px-4 w-16 text-center font-bold">Sr. No.</th>
                                            <th className="border-r border-b border-[#363e63] py-3 px-4 font-bold">Report Name</th>
                                            <th className="border-b border-[#363e63] py-3 px-4 w-44 text-center font-bold">Set Weightage (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { key: 'effort', name: 'Effort Analysis' },
                                            { key: 'brand', name: 'Brand Analysis' },
                                            { key: 'keyCustomer', name: 'Key Customer Analysis' },
                                            { key: 'customerRoi', name: 'Customer ROI Analysis' },
                                            { key: 'outstanding', name: 'Outstanding Analysis' },
                                            { key: 'account', name: 'Account Analysis' }
                                        ].map((r, i) => (
                                            <tr key={r.key} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                                <td className="border-r border-b border-[#363e63] py-3 px-4 text-center text-slate-300 font-medium">{i + 1}</td>
                                                <td className="border-r border-b border-[#363e63] py-3 px-4 font-semibold text-white">{r.name}</td>
                                                <td className="border-b border-[#363e63] py-3 px-4 text-center">
                                                    <input 
                                                        type="number"
                                                        value={settings.weightages[r.key as keyof typeof settings.weightages]}
                                                        onChange={(e) => handleWeightageChange(r.key as keyof typeof settings.weightages, e.target.value)}
                                                        className="w-24 bg-[#14192d] border border-[#363e63] rounded p-2 text-center text-white focus:outline-none focus:border-sky-500 font-bold"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#191e33]">
                                            <td colSpan={2} className="border-r border-t border-[#363e63] py-3 px-4 text-right font-bold text-slate-200 uppercase tracking-wider text-xs">TOTAL:</td>
                                            <td className="border-t border-[#363e63] py-3 px-4 text-center font-bold text-emerald-400 text-base">
                                                {totalW} %
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* 2. FIX PRODUCTS FOR BRAND ANALYSIS */}
                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8">
                            <div className="bg-slate-800 p-4 border-b border-slate-700">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Fix Products for Brand Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Select the specific products you want to include in the brand analysis report.</p>
                            </div>
                            <div className="p-6">
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start">
                                    {products.map(p => {
                                        const isSelected = settings.brandProducts.includes(p.uid || p._id);
                                        return (
                                            <div 
                                                key={p.uid || p._id}
                                                onClick={() => toggleProduct(p.uid || p._id)}
                                                className={`px-3 py-1.5 rounded text-sm cursor-pointer border transition-colors flex items-center gap-2 ${isSelected ? 'bg-[#2563eb]/20 border-sky-500 text-[#60a5fa]' : 'bg-slate-700 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                            >
                                                {isSelected && <Check size={14} />}
                                                {p.productName}
                                            </div>
                                        );
                                    })}
                                    {products.length === 0 && <div className="text-slate-500 italic p-2">Loading products...</div>}
                                </div>
                            </div>
                        </div>

                        {/* 3. SALES SELECTION FOR BRAND ANALYSIS */}
                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8 flex justify-between items-center p-6 gap-6">
                            <div>
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Sales Selection for Brand Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Choose whether to consider primary sales or secondary sales for the brand analysis report.</p>
                            </div>
                            <div className="w-64 shrink-0">
                                <select 
                                    value={settings.brandSalesSelection}
                                    onChange={e => setSettings({...settings, brandSalesSelection: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-sky-500"
                                >
                                    <option value="Primary Sales">Primary Sales</option>
                                    <option value="Secondary Sales">Secondary Sales</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. TARGET SELECTION FOR BRAND ANALYSIS */}
                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Target Selection for Brand Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    This setting allows the application to automatically fetch the monthly target for the product from the user's target for the current month. If turned off, the target will be manually fetched.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.brandTargetAuto}
                                    onChange={(e) => setSettings({...settings, brandTargetAuto: e.target.checked})}
                                />
                                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                            </label>
                        </div>

                        {/* 5. MINIMUM PERFORMANCE THRESHOLDS */}
                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8">
                            <div className="bg-slate-800 p-4 border-b border-slate-700">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Set Minimum Performance Thresholds (KPIs) For Effort Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Define minimum performance standards that users must achieve to qualify.</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-900/50 border border-slate-700 rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Minimum Coverage Required</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Percentage of doctors that must be visited in a month.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds?.coverage || 90}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, coverage: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-slate-700 rounded p-3 pr-10 text-white focus:outline-none focus:border-sky-500"
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Doctor Call Average</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Average doctor calls required per worked day.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds?.drCallAvg || 8}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, drCallAvg: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Chemist Call Average</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Average chemist calls required per worked day.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds?.chemistCallAvg || 2}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, chemistCallAvg: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Minimum Compliance Rate</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Percentage of completed tasks that must meet quality standards.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds?.compliance || 90}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, compliance: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-slate-700 rounded p-3 pr-10 text-white focus:outline-none focus:border-sky-500"
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                
                {activeTab === 'rankings' && viewState === 'leaderboard' && (
                    <div className="w-full pb-24 px-2 md:px-4">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center text-[#a1a5b7] gap-3">
                                <button onClick={() => setActiveTab('settings')} className="p-2 rounded-lg bg-[#1e243d] border border-[#363e63] hover:bg-[#282f4d] hover:text-white transition-colors">
                                    <ChevronLeft size={18} />
                                </button>
                                <div>
                                    <h2 className="text-base font-bold uppercase tracking-wider text-white">
                                        Rankings for {selectedMonth}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Employee monthly leaderboard and scores
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <SquareMonthPicker 
                                label="Select Month"
                                value={selectedMonth} 
                                onChange={setSelectedMonth} 
                            />
                        </div>

                        {/* Full Leaderboard Table with Excel Grid */}
                        <div className="border border-[#363e63] rounded-lg shadow-xl overflow-hidden mt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                                    <thead className="bg-[#1e243d]">
                                        <tr>
                                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-24">Rankings</th>
                                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">
                                                <div className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                    Name
                                                </div>
                                            </th>
                                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">
                                                <div className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                    Headquarter &uarr;
                                                </div>
                                            </th>
                                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-40">
                                                Total Points<br/>Achieved &uarr;
                                            </th>
                                            <th className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-20">View</th>
                                            <th className="border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300 uppercase tracking-wider w-24">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankingsData.map((row) => (
                                            <tr key={row.user} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                                <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {row.rank === 1 && <Award className="text-yellow-400" size={18} />}
                                                        {row.rank === 2 && <Award className="text-slate-300" size={18} />}
                                                        {row.rank === 3 && <Award className="text-amber-600" size={18} />}
                                                        <span className={row.rank <= 3 ? (row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-slate-300' : 'text-amber-600') : 'text-slate-400'}>
                                                            {row.rank}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-semibold text-white">
                                                    {row.user}
                                                </td>
                                                <td className="border-r border-b border-[#363e63] px-4 py-3 text-center text-slate-300">
                                                    {row.hq}
                                                </td>
                                                <td className="border-r border-b border-[#363e63] px-4 py-3 text-center font-bold text-sky-300">
                                                    {row.totalScore.toFixed(2)}
                                                </td>
                                                <td className="border-r border-b border-[#363e63] px-4 py-3 text-center">
                                                    <button onClick={() => { setSelectedRankingUser(row); setViewState('user_kpis'); }} className="text-sky-400 hover:text-white transition-colors p-1 rounded hover:bg-sky-500/20">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                    </button>
                                                </td>
                                                <td className="border-b border-[#363e63] px-4 py-3 text-center">
                                                    <button onClick={() => handleDownloadExcel(row.userId, selectedMonth)} className="text-sky-400 hover:text-white transition-colors p-1 rounded hover:bg-sky-500/20">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {rankingsData.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={6} className="border-b border-[#363e63] px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                                    No rankings data found for this month
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                
                {activeTab === 'rankings' && viewState === 'user_kpis' && selectedRankingUser && (
                    <UserKpisView 
                        selectedMonth={selectedMonth}
                        userRow={selectedRankingUser} 
                        onBack={() => setViewState('leaderboard')} 
                        onViewKpi={(kpiKey) => { setSelectedKpi(kpiKey); setViewState('kpi_details'); }} 
                    />
                )}
                {activeTab === 'rankings' && viewState === 'kpi_details' && selectedRankingUser && selectedKpi && (
                    <KpiDetailsView 
                        userRow={selectedRankingUser} 
                        kpiName={selectedKpi}
                        selectedMonth={selectedMonth}
                        onBack={() => setViewState('user_kpis')}
                    />
                )}

                {activeTab === 'userwise' && (
                    <div className="w-full pb-24 px-2 md:px-4">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white">Performance</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Track your employees goals and achievements</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 mb-6">
                            <div className="w-64">
                                <SquareMonthPicker 
                                    label="Select Month"
                                    value={selectedMonth} 
                                    onChange={setSelectedMonth} 
                                />
                            </div>
                            <div className="w-60">
                                <label className="block text-[11px] font-bold text-sky-400 mb-1 uppercase tracking-wider">Select Report Type</label>
                                <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} className="w-full bg-[#1e243d] border border-sky-500/50 hover:border-sky-400 rounded-lg p-2.5 text-white text-sm focus:outline-none">
                                    <option value="Effort Analysis">Effort Analysis</option>
                                    <option value="Brand Analysis">Brand Analysis</option>
                                    <option value="Key Customer Analysis">Key Customer Analysis</option>
                                    <option value="Customer ROI Analysis">Customer ROI Analysis</option>
                                    <option value="Outstanding Analysis">Outstanding Analysis</option>
                                    <option value="Account Analysis">Account Analysis</option>
                                </select>
                            </div>
                            <div className="w-72">
                                <label className="block text-[11px] font-bold text-sky-400 mb-1 uppercase tracking-wider">Select User</label>
                                <div className="h-[42px] [&>div>div]:min-h-[42px] [&>div>div]:py-1.5 [&>div]:bg-[#1e243d] [&>div>div]:border-sky-500/50 [&>div>div>div]:text-white">
                                    <CustomSelect 
                                        options={users.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName || ''}`, subLabel: u.designation, showDefaultAvatar: true, avatarUrl: u.profilePic }))} showAllOption={false}
                                        value={selectedUser}
                                        onChange={(val) => setSelectedUser(val)}
                                        placeholder="Search user..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Effort Analysis Summary Table */}
                        {selectedReportType === 'Effort Analysis' && reportData && (
                            <div className="border border-[#363e63] rounded-lg shadow-xl overflow-hidden mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200 whitespace-nowrap">
                                        <thead className="bg-[#1e243d]">
                                            <tr>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Sr<br/>no.</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total<br/>Doctors</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Doctors<br/>Met</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Unique<br/>Doctors Visited</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Missed<br/>Doctors</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Non-<br/>Core Doctors Met</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Core<br/>Doctors Met</th>
                                                <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-300 uppercase tracking-wider">Total Super<br/>Core Doctors Met</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-[#14192d] hover:bg-[#20294a] transition-colors text-center">
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 font-medium">1</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 font-bold text-white">{reportData.totalDoctors}</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 font-semibold text-slate-200">{reportData.totalDoctorsMet}</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 font-semibold text-sky-300">{reportData.totalUniqueDoctors}</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 font-bold text-red-400">{reportData.totalMissedDoctors}</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 text-slate-300">{reportData.totalNonCore}</td>
                                                <td className="border-r border-b border-[#363e63] px-3 py-3 text-slate-300">{reportData.totalCore}</td>
                                                <td className="border-b border-[#363e63] px-3 py-3 text-slate-300">{reportData.totalSuperCore}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Effort Analysis Full 6-Week Matrix in Userwise Tab */}
                        {selectedReportType === 'Effort Analysis' && reportData && reportData.matrix && (
                            <div className="mt-8">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-sky-300 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                        Weekly Effort Breakdown Matrix
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Weekly &amp; Cumulative Metrics
                                    </span>
                                </div>
                                <div className="border border-[#363e63] rounded-lg shadow-xl overflow-x-auto">
                                    <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200">
                                        <thead className="bg-[#1e243d]">
                                            <tr>
                                                <th className="border-r border-b border-[#363e63] px-4 py-3 text-left font-bold text-sky-300 uppercase tracking-wider sticky left-0 bg-[#1e243d] z-10">Metrics</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 1</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 2</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 3</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 4</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 5</th>
                                                <th className="border-r border-b border-[#363e63] px-3 py-3 text-center font-bold text-slate-200 uppercase tracking-wider">Week 6</th>
                                                <th className="border-b border-[#363e63] px-3 py-3 text-center font-bold text-sky-400 uppercase tracking-wider bg-[#222a47]">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.matrix.map((row: any, i: number) => (
                                                <tr key={i} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors">
                                                    <td className="border-r border-b border-[#363e63] px-4 py-2.5 font-semibold text-white whitespace-nowrap sticky left-0 bg-inherit z-10">{row.label}</td>
                                                    {row.data.map((val: any, colIdx: number) => {
                                                        let displayVal = val;
                                                        if (typeof val === 'number') {
                                                            if (row.label.includes('Percentage')) displayVal = val.toFixed(2) + '%';
                                                            else if (row.label.includes('Average')) displayVal = val.toFixed(2);
                                                        }
                                                        const isTotalCol = colIdx === 6;
                                                        return (
                                                            <td key={colIdx} className={`border-r border-b border-[#363e63] px-3 py-2.5 text-center ${isTotalCol ? 'font-bold text-sky-300 bg-[#1c233c]/60' : 'text-slate-200 font-medium'}`}>
                                                                {displayVal}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Non-Effort Reports in Userwise Tab */}
                        {selectedReportType !== 'Effort Analysis' && reportData && Array.isArray(reportData) && (
                            <div className="border border-[#363e63] rounded-lg shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-[#363e63] text-xs md:text-sm text-slate-200 whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-[#1e243d] text-sky-300 text-xs font-bold uppercase tracking-wider text-center">
                                                <th className="border-r border-b border-[#363e63] p-3" rowSpan={2}>Sr<br/>no.</th>
                                                <th className="border-r border-b border-[#363e63] p-3" rowSpan={2}>Entity Name</th>
                                                <th className="border-r border-b border-[#363e63] p-3" rowSpan={2}>Type</th>
                                                <th className="border-r border-b border-[#363e63] p-3" rowSpan={2}>Monthly<br/>Target</th>
                                                <th className="border-r border-b border-[#363e63] p-3" colSpan={2}>Week 1</th>
                                                <th className="border-r border-b border-[#363e63] p-3" colSpan={2}>Week 2</th>
                                                <th className="border-r border-b border-[#363e63] p-3" colSpan={2}>Week 3</th>
                                                <th className="border-r border-b border-[#363e63] p-3" colSpan={2}>Week 4</th>
                                                <th className="border-b border-[#363e63] p-3" colSpan={2}>Week 5</th>
                                            </tr>
                                            <tr className="bg-[#171c31] text-slate-300 text-xs text-center font-semibold">
                                                <th className="border-r border-b border-[#363e63] p-2">Plan</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Achieved</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Plan</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Achieved</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Plan</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Achieved</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Plan</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Achieved</th>
                                                <th className="border-r border-b border-[#363e63] p-2">Plan</th>
                                                <th className="border-b border-[#363e63] p-2">Achieved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i} className="even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a] transition-colors text-center">
                                                    <td className="border-r border-b border-[#363e63] p-3 font-medium">{i + 1}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-left font-semibold text-white">
                                                        {(() => {
                                                            if (row.entityId) {
                                                                const foundEntity = entities.find(e => (row.entityId && (e.uid === row.entityId || e._id === row.entityId)) || (row.entityName && e.name === row.entityName));
                                                                if (foundEntity) {
                                                                    return foundEntity.businessName || foundEntity.name || row.entityName;
                                                                }
                                                            }
                                                            return row.entityName || (row.productId && (products.find(p => p.uid === row.productId || p._id === row.productId)?.productName)) || row.productName || '-';
                                                        })()}
                                                    </td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-300">{row.entityType || '-'}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 font-bold text-sky-300">{row.monthlyTarget || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-400">{row.week1?.planned || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 font-semibold text-emerald-400">{row.week1?.achieved || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-400">{row.week2?.planned || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 font-semibold text-emerald-400">{row.week2?.achieved || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-400">{row.week3?.planned || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 font-semibold text-emerald-400">{row.week3?.achieved || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-400">{row.week4?.planned || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 font-semibold text-emerald-400">{row.week4?.achieved || 0}</td>
                                                    <td className="border-r border-b border-[#363e63] p-3 text-slate-400">{row.week5?.planned || 0}</td>
                                                    <td className="border-b border-[#363e63] p-3 font-semibold text-emerald-400">{row.week5?.achieved || 0}</td>
                                                </tr>
                                            ))}
                                            {reportData.length === 0 && (
                                                <tr>
                                                    <td colSpan={14} className="border-b border-[#363e63] p-6 text-center text-slate-400 italic">No targets or achievements found for this report type.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!reportData && (
                            <div className="border border-[#363e63] rounded-lg p-12 text-center text-slate-400 bg-[#1e243d]">
                                Select a user and report type to view data...
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    );
}
