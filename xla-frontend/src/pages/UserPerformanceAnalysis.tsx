import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Settings, Award, User, Save, Check

} from 'lucide-react';


function UserKpisView({ userRow, selectedMonth, onBack, onViewKpi }: { userRow: any, selectedMonth: string, onBack: () => void, onViewKpi: (k: string) => void }) { userRow: any, onBack: () => void, onViewKpi: (k: string) => void }) {
    const kpis = [
        'Customer ROI Analysis',
        'Outstanding Analysis',
        'Effort Analysis',
        'Brand Analysis',
        'Key Customer Analysis',
        'Account Analysis'
    ];
    return (
        <div className="max-w-7xl mx-auto pb-32">
            <div className="mb-6 flex items-center text-[#a1a5b7] gap-2 w-max">
                <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#b5b5c3] flex items-center gap-2">
                    <span onClick={onBack} className="cursor-pointer hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </span>
                    ANALYSIS REPORTS OF {userRow.user.toUpperCase()}
                </h2>
            </div>
            
            <div className="bg-[#242b47] rounded-md border border-[#363e63] shadow-xl overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-300">
                        <thead className="bg-[#282f4d] border-b border-[#363e63]">
                            <tr>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-24">Sr no.</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Report Name</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Percentage &uarr;<br/>Achieved</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Total Points &uarr;</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Achieved Points</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-20">View</th>
                                <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-24">Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kpis.map((kpiName, idx) => {
                                const kpiData = userRow.kpiBreakdown && userRow.kpiBreakdown[kpiName] ? userRow.kpiBreakdown[kpiName] : { percentage: 0, max: 0, points: 0 };
                                return (
                                    <tr key={kpiName} className="border-b border-[#363e63] hover:bg-[#2a3152] transition-colors">
                                        <td className="px-6 py-4 text-center text-[#b5b5c3]">{idx + 1}</td>
                                        <td className="px-6 py-4 text-center text-[#b5b5c3]">{kpiName}</td>
                                        <td className="px-6 py-4 text-center text-[#b5b5c3]">{(kpiData.percentage || 0).toFixed(2)} %</td>
                                        <td className="px-6 py-4 text-center text-[#b5b5c3]">{(kpiData.max || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center text-[#b5b5c3]">{(kpiData.points || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => onViewKpi(kpiName)} className="text-[#a1a5b7] hover:text-white transition-colors">
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDownloadExcel(userRow.userId, selectedMonth)} className="text-[#a1a5b7] hover:text-white transition-colors">
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
        const d = kpiData.data || {};
        tableContent = (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-[#282f4d] border-b border-[#363e63]">
                        <tr>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Working Days</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Total Dr Calls</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Actual Dr Call Avg</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Total Chemist Calls</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Actual Chemist Call Avg</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Coverage %</th>
                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">Compliance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[#363e63] hover:bg-[#2a3152] transition-colors">
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{d.workingDays || 0}</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{d.totalDrCalls || 0}</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{(d.actualDrCallAvg || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{d.totalChemistCalls || 0}</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{(d.actualChemistCallAvg || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{(d.coveragePercent || 0).toFixed(2)}%</td>
                            <td className="px-6 py-4 text-center text-[#b5b5c3]">{(d.compliancePercent || 0).toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    } else {
        const rows = Array.isArray(kpiData.data) ? kpiData.data : [];
        tableContent = (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-[#282f4d] border-b border-[#363e63]">
                        <tr>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Sr no.</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Entity Name</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Entity Type</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Monthly Target (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 1 Planned (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 1 Achieved (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 2 Planned (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 2 Achieved (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 3 Planned (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 3 Achieved (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 4 Planned (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 4 Achieved (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 5 Planned (₹)</th>
                            <th className="px-4 py-4 text-center font-bold text-[#b5b5c3] whitespace-nowrap">Week 5 Achieved (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={14} className="px-6 py-8 text-center text-slate-500">No raw data available for this report</td></tr>
                        ) : (
                            rows.map((r: any, i: number) => {
                                const parseVal = (v: any) => !v || v === '' || Number(v) === 0 ? 'N/A' : Number(v);
                                return (
                                <tr key={i} className="border-b border-[#363e63] hover:bg-[#2a3152] transition-colors">
                                    <td className="px-4 py-4 text-center">{i + 1}</td>
                                    <td className="px-4 py-4 text-center">{r.entityName || 'N/A'}</td>
                                    <td className="px-4 py-4 text-center">{r.entityType || 'Doctor'}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.monthlyTarget)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week1?.planned)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week1?.achieved)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week2?.planned)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week2?.achieved)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week3?.planned)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week3?.achieved)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week4?.planned)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week4?.achieved)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week5?.planned)}</td>
                                    <td className="px-4 py-4 text-center">{parseVal(r.week5?.achieved)}</td>
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
        <div className="max-w-[95%] mx-auto pb-32">
            <div className="mb-6 flex items-center text-[#a1a5b7] gap-2 w-max">
                <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#b5b5c3] flex items-center gap-2">
                    <span onClick={onBack} className="cursor-pointer hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </span>
                    {kpiName.toUpperCase()} REPORT OF {userRow.user.toUpperCase()}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#242b47] rounded-md border border-[#363e63] p-6 shadow-lg">
                    <div className="text-[#a1a5b7] font-bold uppercase mb-2">Month</div>
                    <div className="text-xl font-medium text-slate-200">{monthStr}</div>
                </div>
                <div className="bg-[#242b47] rounded-md border border-[#363e63] p-6 shadow-lg">
                    <div className="text-[#a1a5b7] font-bold uppercase mb-2">Year</div>
                    <div className="text-xl font-medium text-slate-200">{yearStr}</div>
                </div>
                <div className="bg-[#242b47] rounded-md border border-[#363e63] p-6 shadow-lg">
                    <div className="text-[#a1a5b7] font-bold uppercase mb-2">Percentage Achieved</div>
                    <div className="text-xl font-medium text-slate-200">{(kpiData.percentage || 0).toFixed(2)} %</div>
                </div>
                <div className="bg-[#242b47] rounded-md border border-[#363e63] p-6 shadow-lg">
                    <div className="text-[#a1a5b7] font-bold uppercase mb-2">Total Points Achieved</div>
                    <div className="text-xl font-medium text-slate-200">{(kpiData.points || 0).toFixed(2)}/{(kpiData.max || 0).toFixed(2)}</div>
                </div>
            </div>
            
            <div className="bg-[#242b47] rounded-md border border-[#363e63] shadow-xl mt-6">
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
            <div className="w-full md:w-72 bg-slate-800/50 border-r border-slate-800 flex flex-col shrink-0 py-6 overflow-y-auto">
                <div className="px-6 mb-6 flex items-center gap-3 border-b-0">
                    <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors bg-transparent p-0">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-emerald-400 font-black text-xl tracking-wider uppercase">User Performance Analysis</h1>
                </div>

                <div className="flex flex-col space-y-2 px-4">
                    <button onClick={() => setActiveTab('rankings')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'rankings' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Award size={18} />
                        Rankings
                    </button>
                    <button onClick={() => setActiveTab('userwise')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'userwise' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <User size={18} />
                        Userwise Reports
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all flex items-center gap-3 ${activeTab === 'settings' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={18} />
                        Settings
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-900">
{loading && <div className="hidden"></div>}
                
                {activeTab === 'settings' && (
                    <div className="max-w-4xl mx-auto pb-32">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-100 flex items-center gap-3">
                                <Settings className="text-sky-400" size={28} />
                                Configuration Settings
                            </h2>
                            <button onClick={saveSettings} className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                                <Save size={18} />
                                Save
                            </button>
                        </div>

                        {/* 1. REPORT WEIGHTAGE */}
                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden mb-8">
                            <div className="bg-slate-800 p-4 border-b border-slate-700">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Configure Report Weightage</h3>
                                <p className="text-sm text-slate-400 mt-1">Assign percentages to each report. The total must equal 100%.</p>
                            </div>
                            <div className="p-6">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                            <th className="pb-3 px-4 w-16 text-center">Sr. No.</th>
                                            <th className="pb-3 px-4">Report Name</th>
                                            <th className="pb-3 px-4 w-40 text-center">Set Weightage (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3b3b5a]/50">
                                        {[
                                            { key: 'effort', name: 'Effort Analysis' },
                                            { key: 'brand', name: 'Brand Analysis' },
                                            { key: 'keyCustomer', name: 'Key Customer Analysis' },
                                            { key: 'customerRoi', name: 'Customer ROI Analysis' },
                                            { key: 'outstanding', name: 'Outstanding Analysis' },
                                            { key: 'account', name: 'Account Analysis' }
                                        ].map((r, i) => (
                                            <tr key={r.key} className="hover:bg-slate-700/50 transition-colors">
                                                <td className="py-4 px-4 text-center text-slate-400">{i + 1}</td>
                                                <td className="py-4 px-4 font-semibold text-slate-200">{r.name}</td>
                                                <td className="py-4 px-4 text-center">
                                                    <input 
                                                        type="number"
                                                        value={settings.weightages[r.key as keyof typeof settings.weightages]}
                                                        onChange={(e) => handleWeightageChange(r.key as keyof typeof settings.weightages, e.target.value)}
                                                        className="w-24 bg-slate-900/50 border border-slate-700 rounded p-2 text-center text-white focus:outline-none focus:border-sky-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#141421]">
                                            <td colSpan={2} className="py-4 px-4 text-right font-bold text-slate-300">TOTAL:</td>
                                            <td className="py-4 px-4 text-center font-bold text-emerald-400 text-lg">
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
                    <div className="max-w-7xl mx-auto pb-32">
                        <div className="mb-6 flex items-center text-[#a1a5b7] gap-2 w-max">
                            <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#b5b5c3] flex items-center gap-2">
                                <span onClick={() => setActiveTab('settings')} className="cursor-pointer hover:text-white transition-colors">
                                    <ChevronLeft size={20} />
                                </span>
                                RANKINGS FOR {selectedMonth.toUpperCase()}
                            </h2>
                        </div>
                        
                        <div className="w-64 mb-6">
                            <label className="block text-[11px] font-bold text-sky-400 mb-1 uppercase tracking-wider">Select Year *</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-transparent text-slate-200 p-2.5 rounded text-sm border border-sky-500/50 outline-none focus:border-sky-500 transition-colors cursor-pointer appearance-none"
                                    value={selectedMonth} 
                                    onChange={e => setSelectedMonth(e.target.value)}
                                >
                                    {[...Array(6)].map((_, i) => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - i);
                                        const val = d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear();
                                        return <option key={i} value={val} className="bg-slate-800">{val}</option>;
                                    })}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Full Leaderboard Table matching Medorn ERP design */}
                        <div className="bg-[#242b47] rounded-md border border-[#363e63] shadow-xl overflow-hidden mt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-slate-300">
                                    <thead className="bg-[#282f4d] border-b border-[#363e63]">
                                        <tr>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-24">Rankings</th>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                    Name
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                    Headquarter &uarr;
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-40">
                                                Total Points<br/>Achieved &uarr;
                                            </th>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-20">View</th>
                                            <th className="px-6 py-4 text-center font-bold text-[#b5b5c3] w-24">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankingsData.map((row) => (
                                            <tr key={row.user} className="border-b border-[#363e63] hover:bg-[#2a3152] transition-colors">
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 font-bold text-[15px]">
                                                        {row.rank === 1 && <Award className="text-yellow-400" size={18} />}
                                                        {row.rank === 2 && <Award className="text-slate-300" size={18} />}
                                                        {row.rank === 3 && <Award className="text-amber-600" size={18} />}
                                                        <span className={row.rank <= 3 ? (row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-slate-300' : 'text-amber-600') : 'text-slate-400'}>
                                                            {row.rank}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-[#b5b5c3] text-[15px]">
                                                    {row.user}
                                                </td>
                                                <td className="px-6 py-4 text-center text-[#b5b5c3] text-[15px]">
                                                    {row.hq}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-slate-200 text-[15px]">{row.totalScore.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => { setSelectedRankingUser(row); setViewState('user_kpis'); }} className="text-[#a1a5b7] hover:text-white transition-colors">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleDownloadExcel(row.userId, selectedMonth)} className="text-[#a1a5b7] hover:text-white transition-colors">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {rankingsData.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-[#a1a5b7] font-bold uppercase tracking-widest text-sm">
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
                    <div className="max-w-6xl mx-auto pb-32">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-100">Performance</h2>
                                <p className="text-sm text-slate-400 mt-1">Track your employees goals and achievements</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-8">
                            <div className="w-48">
                                <label className="block text-xs text-slate-400 mb-1">Select Month</label>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white">
                                    <option value="Aug 2026">Aug 2026</option>
                                    <option value="Sep 2026">Sep 2026</option>
                                </select>
                            </div>
                            <div className="w-56">
                                <label className="block text-xs text-slate-400 mb-1">Select Report Type</label>
                                <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white">
                                    <option value="Effort Analysis">Effort Analysis</option>
                                    <option value="Brand Analysis">Brand Analysis</option>
                                    <option value="Key Customer Analysis">Key Customer Analysis</option>
                                    <option value="Customer ROI Analysis">Customer ROI Analysis</option>
                                    <option value="Outstanding Analysis">Outstanding Analysis</option>
                                    <option value="Account Analysis">Account Analysis</option>
                                </select>
                            </div>
                            <div className="w-64">
                                <label className="block text-xs text-slate-400 mb-1">Select User</label>
                                <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5 [&>div]:bg-slate-900/50 [&>div>div]:border-slate-700 [&>div>div>div]:text-white">
                                    <CustomSelect 
                                        options={users.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName || ''}`, subLabel: u.designation, showDefaultAvatar: true, avatarUrl: u.profilePic }))} showAllOption={false}
                                        value={selectedUser}
                                        onChange={(val) => setSelectedUser(val)}
                                        placeholder="Search user..."
                                    />
                                </div>
                            </div></div>

                        <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                            {selectedReportType === 'Effort Analysis' && reportData && (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-slate-400 text-xs text-center">
                                                <th className="p-3 border-r border-slate-700/50">Sr<br/>no.</th>
                                                <th className="p-3 border-r border-slate-700/50">Total<br/>Doctors</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Doctors<br/>Met</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Unique<br/>Doctors Visited</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Missed<br/>Doctors</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Non-<br/>Core Doctors Met</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Core<br/>Doctors Met</th>
                                                <th className="p-3 border-r border-slate-700/50">Total Super<br/>Core Doctors Met</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="text-center">
                                                <td className="p-3 border-r border-slate-700/50">1</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalDoctors}</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalDoctorsMet}</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalUniqueDoctors}</td>
                                                <td className="p-3 border-r border-slate-700/50 text-red-400">{reportData.totalMissedDoctors}</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalNonCore}</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalCore}</td>
                                                <td className="p-3 border-r border-slate-700/50">{reportData.totalSuperCore}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            
                            {selectedReportType !== 'Effort Analysis' && reportData && Array.isArray(reportData) && (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-slate-700 bg-slate-700 text-slate-300 text-xs text-center">
                                                <th className="p-3 border-r border-slate-700/50" rowSpan={2}>Sr<br/>no.</th>
                                                <th className="p-3 border-r border-slate-700/50" rowSpan={2}>Entity Name</th>
                                                <th className="p-3 border-r border-slate-700/50" rowSpan={2}>Type</th>
                                                <th className="p-3 border-r border-slate-700/50" rowSpan={2}>Monthly<br/>Target</th>
                                                <th className="p-3 border-r border-slate-700/50" colSpan={2}>Week 1</th>
                                                <th className="p-3 border-r border-slate-700/50" colSpan={2}>Week 2</th>
                                                <th className="p-3 border-r border-slate-700/50" colSpan={2}>Week 3</th>
                                                <th className="p-3 border-r border-slate-700/50" colSpan={2}>Week 4</th>
                                                <th className="p-3 border-r border-slate-700/50" colSpan={2}>Week 5</th>
                                            </tr>
                                            <tr className="border-b border-slate-700 bg-[#141421] text-slate-400 text-xs text-center">
                                                <th className="p-2 border-r border-slate-700/50">Plan</th>
                                                <th className="p-2 border-r border-slate-700/50">Achieved</th>
                                                <th className="p-2 border-r border-slate-700/50">Plan</th>
                                                <th className="p-2 border-r border-slate-700/50">Achieved</th>
                                                <th className="p-2 border-r border-slate-700/50">Plan</th>
                                                <th className="p-2 border-r border-slate-700/50">Achieved</th>
                                                <th className="p-2 border-r border-slate-700/50">Plan</th>
                                                <th className="p-2 border-r border-slate-700/50">Achieved</th>
                                                <th className="p-2 border-r border-slate-700/50">Plan</th>
                                                <th className="p-2 border-r border-slate-700/50">Achieved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i} className="text-center hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3 border-r border-slate-700/50">{i + 1}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-left font-medium text-slate-200">
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
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.entityType || '-'}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-bold">{row.monthlyTarget || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.week1?.planned || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-semibold text-emerald-400">{row.week1?.achieved || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.week2?.planned || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-semibold text-emerald-400">{row.week2?.achieved || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.week3?.planned || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-semibold text-emerald-400">{row.week3?.achieved || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.week4?.planned || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-semibold text-emerald-400">{row.week4?.achieved || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 text-slate-400">{row.week5?.planned || 0}</td>
                                                    <td className="p-3 border-r border-slate-700/50 font-semibold text-emerald-400">{row.week5?.achieved || 0}</td>
                                                </tr>
                                            ))}
                                            {reportData.length === 0 && (
                                                <tr>
                                                    <td colSpan={14} className="p-6 text-center text-slate-500 italic">No targets or achievements found for this report type.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!reportData && (
                                <div className="p-10 text-center text-slate-500 italic">Select a user and report type to view data...</div>
                            )}
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
