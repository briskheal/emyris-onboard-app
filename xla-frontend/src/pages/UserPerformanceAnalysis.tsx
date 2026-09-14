import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Settings, Award, User, Save, Check
} from 'lucide-react';

export default function UserPerformanceAnalysis() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('settings');
    const [loading, setLoading] = useState(false);
    
    // Master data
    const [products, setProducts] = useState<any[]>([]);

    const [users, setUsers] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedReportType, setSelectedReportType] = useState('Effort Analysis');
    const [selectedUser, setSelectedUser] = useState('');
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        const d = new Date();
        setSelectedMonth(d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear());
        
        axios.get('/api/xl/users').then(res => {
            if(res.data.success) {
                setUsers(res.data.data);
                if(res.data.data.length > 0) setSelectedUser(res.data.data[0]._id);
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
        effortThresholds: {
            coverage: 90,
            compliance: 90
        }
    });

    useEffect(() => {
        fetchSettings();
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const pRes = await axios.get('/api/xl/reports/products');
            setProducts(pRes.data.data || []);
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
        <div className="min-h-screen bg-[#0f0f17] text-white flex flex-col md:flex-row relative z-10">
            {/* SIDEBAR */}
            <div className="w-full md:w-64 bg-[#141421] border-r border-[#3b3b5a] flex flex-col shrink-0 min-h-screen md:min-h-0">
                <div className="p-4 border-b border-[#3b3b5a] flex items-center gap-3">
                    <button onClick={() => navigate('/admin')} className="p-2 bg-[#2a2a40] rounded hover:bg-[#3b3b5a] transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="font-bold text-lg leading-tight uppercase text-slate-200">User Performance Analysis</h1>
                </div>

                <div className="flex flex-col p-4 gap-2">
                    <button onClick={() => setActiveTab('rankings')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors uppercase text-sm font-semibold tracking-wider ${activeTab === 'rankings' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:bg-[#1e1e30] hover:text-slate-200'}`}>
                        <Award size={18} />
                        Rankings
                    </button>
                    <button onClick={() => setActiveTab('userwise')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors uppercase text-sm font-semibold tracking-wider ${activeTab === 'userwise' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:bg-[#1e1e30] hover:text-slate-200'}`}>
                        <User size={18} />
                        Userwise Reports
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors uppercase text-sm font-semibold tracking-wider ${activeTab === 'settings' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:bg-[#1e1e30] hover:text-slate-200'}`}>
                        <Settings size={18} />
                        Settings
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
{loading && <div className="hidden"></div>}
                
                {activeTab === 'settings' && (
                    <div className="max-w-4xl mx-auto pb-32">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-100 flex items-center gap-3">
                                <Settings className="text-[#2563eb]" size={28} />
                                Configuration Settings
                            </h2>
                            <button onClick={saveSettings} className="bg-[#00e5ff] hover:bg-[#00c4cc] text-black px-6 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                                <Save size={18} />
                                Save
                            </button>
                        </div>

                        {/* 1. REPORT WEIGHTAGE */}
                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden mb-8">
                            <div className="bg-[#2a2a40] p-4 border-b border-[#3b3b5a]">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Configure Report Weightage</h3>
                                <p className="text-sm text-slate-400 mt-1">Assign percentages to each report. The total must equal 100%.</p>
                            </div>
                            <div className="p-6">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#3b3b5a] text-slate-400 uppercase text-xs tracking-wider">
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
                                            <tr key={r.key} className="hover:bg-[#2a2a40]/50 transition-colors">
                                                <td className="py-4 px-4 text-center text-slate-400">{i + 1}</td>
                                                <td className="py-4 px-4 font-semibold text-slate-200">{r.name}</td>
                                                <td className="py-4 px-4 text-center">
                                                    <input 
                                                        type="number"
                                                        value={settings.weightages[r.key as keyof typeof settings.weightages]}
                                                        onChange={(e) => handleWeightageChange(r.key as keyof typeof settings.weightages, e.target.value)}
                                                        className="w-24 bg-[#141421] border border-[#3b3b5a] rounded p-2 text-center text-white focus:outline-none focus:border-[#2563eb]"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#141421]">
                                            <td colSpan={2} className="py-4 px-4 text-right font-bold text-slate-300">TOTAL:</td>
                                            <td className="py-4 px-4 text-center font-bold text-[#00e5ff] text-lg">
                                                {totalW} %
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* 2. FIX PRODUCTS FOR BRAND ANALYSIS */}
                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden mb-8">
                            <div className="bg-[#2a2a40] p-4 border-b border-[#3b3b5a]">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Fix Products for Brand Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Select the specific products you want to include in the brand analysis report.</p>
                            </div>
                            <div className="p-6">
                                <div className="bg-[#141421] border border-[#3b3b5a] rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start">
                                    {products.map(p => {
                                        const isSelected = settings.brandProducts.includes(p.uid || p._id);
                                        return (
                                            <div 
                                                key={p.uid || p._id}
                                                onClick={() => toggleProduct(p.uid || p._id)}
                                                className={`px-3 py-1.5 rounded text-sm cursor-pointer border transition-colors flex items-center gap-2 ${isSelected ? 'bg-[#2563eb]/20 border-[#2563eb] text-[#60a5fa]' : 'bg-[#2a2a40] border-[#3b3b5a] text-slate-400 hover:border-slate-500'}`}
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
                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden mb-8 flex justify-between items-center p-6 gap-6">
                            <div>
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Sales Selection for Brand Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Choose whether to consider primary sales or secondary sales for the brand analysis report.</p>
                            </div>
                            <div className="w-64 shrink-0">
                                <select 
                                    value={settings.brandSalesSelection}
                                    onChange={e => setSettings({...settings, brandSalesSelection: e.target.value})}
                                    className="w-full bg-[#141421] border border-[#3b3b5a] rounded p-3 text-white focus:outline-none focus:border-[#2563eb]"
                                >
                                    <option value="Primary Sales">Primary Sales</option>
                                    <option value="Secondary Sales">Secondary Sales</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. TARGET SELECTION FOR BRAND ANALYSIS */}
                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden mb-8 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                                <div className="w-14 h-7 bg-[#2a2a40] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                            </label>
                        </div>

                        {/* 5. MINIMUM PERFORMANCE THRESHOLDS */}
                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden mb-8">
                            <div className="bg-[#2a2a40] p-4 border-b border-[#3b3b5a]">
                                <h3 className="font-bold text-lg uppercase tracking-wider text-slate-200">Set Minimum Performance Thresholds (KPIs) For Effort Analysis</h3>
                                <p className="text-sm text-slate-400 mt-1">Define minimum performance standards that users must achieve to qualify.</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-[#141421] border border-[#3b3b5a] rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Minimum Coverage Required</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Percentage of doctors that must be visited in a month.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds.coverage}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, coverage: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-[#3b3b5a] rounded p-3 pr-10 text-white focus:outline-none focus:border-[#2563eb]"
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="bg-[#141421] border border-[#3b3b5a] rounded p-5 flex flex-col">
                                    <span className="font-semibold text-slate-200 mb-2">Minimum Compliance Rate</span>
                                    <span className="text-xs text-slate-400 mb-4 h-8">Percentage of completed tasks that must meet quality standards.</span>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={settings.effortThresholds.compliance}
                                            onChange={(e) => setSettings({...settings, effortThresholds: {...settings.effortThresholds, compliance: Number(e.target.value)}})}
                                            className="w-full bg-[#1e1e30] border border-[#3b3b5a] rounded p-3 pr-10 text-white focus:outline-none focus:border-[#2563eb]"
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'rankings' && (
                    <div className="text-center p-20 text-slate-500">
                        <Award size={64} className="mx-auto mb-4 opacity-50" />
                        <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">Rankings</h2>
                        <p>This module is currently under construction (Phase 3).</p>
                    </div>
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
                                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-[#141421] border border-[#3b3b5a] rounded p-2 text-white">
                                    <option value="Aug 2026">Aug 2026</option>
                                    <option value="Sep 2026">Sep 2026</option>
                                </select>
                            </div>
                            <div className="w-56">
                                <label className="block text-xs text-slate-400 mb-1">Select Report Type</label>
                                <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} className="w-full bg-[#141421] border border-[#3b3b5a] rounded p-2 text-white">
                                    <option value="Effort Analysis">Effort Analysis</option>
                                    <option value="Brand Analysis">Brand Analysis</option>
                                </select>
                            </div>
                            <div className="w-56">
                                <label className="block text-xs text-slate-400 mb-1">Select User</label>
                                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-[#141421] border border-[#3b3b5a] rounded p-2 text-white">
                                    {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-hidden">
                            {selectedReportType === 'Effort Analysis' && reportData && (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-[#3b3b5a] text-slate-400 text-xs text-center">
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Sr<br/>no.</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total<br/>Doctors</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Doctors<br/>Met</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Unique<br/>Doctors Visited</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Missed<br/>Doctors</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Non-<br/>Core Doctors Met</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Core<br/>Doctors Met</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50">Total Super<br/>Core Doctors Met</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="text-center">
                                                <td className="p-3 border-r border-[#3b3b5a]/50">1</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalDoctors}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalDoctorsMet}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalUniqueDoctors}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50 text-red-400">{reportData.totalMissedDoctors}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalNonCore}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalCore}</td>
                                                <td className="p-3 border-r border-[#3b3b5a]/50">{reportData.totalSuperCore}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedReportType === 'Brand Analysis' && reportData && Array.isArray(reportData) && (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-[#3b3b5a] bg-[#2a2a40] text-slate-300 text-xs text-center">
                                                <th className="p-3 border-r border-[#3b3b5a]/50" rowSpan={2}>Sr<br/>no.</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" rowSpan={2}>Product Name</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" rowSpan={2}>Monthly<br/>Target</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" colSpan={2}>Week 1</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" colSpan={2}>Week 2</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" colSpan={2}>Week 3</th>
                                                <th className="p-3 border-r border-[#3b3b5a]/50" colSpan={2}>Week 4</th>
                                            </tr>
                                            <tr className="border-b border-[#3b3b5a] bg-[#141421] text-slate-400 text-xs text-center">
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Plan</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Achieved</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Plan</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Achieved</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Plan</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Achieved</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Plan</th>
                                                <th className="p-2 border-r border-[#3b3b5a]/50">Achieved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((row, i) => (
                                                <tr key={i} className="text-center hover:bg-[#2a2a40]/30">
                                                    <td className="p-3 border-r border-[#3b3b5a]/50">{i + 1}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 text-left font-medium text-slate-200">
                                                        {products.find(p => p.uid === row.productId || p._id === row.productId)?.productName || row.productName}
                                                    </td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 font-bold">{row.monthlyTarget}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 text-slate-400">{row.week1Plan}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 font-semibold text-[#00e5ff]">{row.week1Achieved}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 text-slate-400">{row.week2Plan}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 font-semibold text-[#00e5ff]">{row.week2Achieved}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 text-slate-400">{row.week3Plan}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 font-semibold text-[#00e5ff]">{row.week3Achieved}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 text-slate-400">{row.week4Plan}</td>
                                                    <td className="p-3 border-r border-[#3b3b5a]/50 font-semibold text-[#00e5ff]">{row.week4Achieved}</td>
                                                </tr>
                                            ))}
                                            {reportData.length === 0 && (
                                                <tr>
                                                    <td colSpan={11} className="p-6 text-center text-slate-500 italic">No products tracked. Please configure products in Settings.</td>
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
