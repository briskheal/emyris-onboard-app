import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Paperclip, Building2, UserStar, Banknote, ShieldAlert, ChevronDown, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const getUserId = () => {
  const u = localStorage.getItem('xl_user');
  return u ? JSON.parse(u).employeeId : '';
};

const TARGET_KPIS = [
  { id: 'brand', label: 'Product Wise Analysis', icon: Paperclip },
  { id: 'account', label: 'Account Wise Analysis', icon: Building2 },
  { id: 'keyCustomer', label: 'Key Customer Analysis', icon: UserStar },
  { id: 'roi', label: 'Customer ROI Analysis', icon: Banknote },
  { id: 'outstanding', label: 'Outstanding Analysis', icon: ShieldAlert },
];

export default function PerformanceMenu() {
  const navigate = useNavigate();
  const today = new Date();
  
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState(today.toLocaleString('en-US', { month: 'long' }).toLowerCase());
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [isPlanningPhase, setIsPlanningPhase] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [plannedCount, setPlannedCount] = useState(0);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [unlockRequested, setUnlockRequested] = useState(false);
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);

  // Custom Dropdown State
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const years = ['2025', '2026', '2027'];

  const fetchPerformance = () => {
    axios.get(`/api/xl/performance/my?email=${getUserId()}&month=${selectedMonth}&year=${selectedYear}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setRecordId(data._id);
          setIsPlanningPhase(!data.planningSubmittedAt);
          setUnlockRequested(!!data.unlockRequested);
          
          // Calculate how many KPIs are planned
          let count = 0;
          if (data.brandData) count++;
          if (data.accountData) count++;
          if (data.keyCustomerData) count++;
          if (data.roiData) count++;
          if (data.outstandingData) count++;
          setPlannedCount(count);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchPerformance();
  }, [selectedMonth, selectedYear]);

  const handleFinalSubmit = async () => {
    if (!recordId) return;
    setIsSubmittingFinal(true);
    try {
        await axios.post('/api/xl/performance/submit-final', { id: recordId });
        alert('Final Monthly Plan locked successfully!');
        fetchPerformance();
    } catch (e) {
        alert('Failed to lock monthly plan');
    } finally {
        setIsSubmittingFinal(false);
    }
  };

  const handleRequestUnlock = async () => {
    if (!recordId) return;
    setIsRequestingUnlock(true);
    try {
        await axios.post('/api/xl/performance/request-unlock', { id: recordId });
        alert('Unlock requested successfully! Please wait for admin approval.');
        fetchPerformance();
    } catch (e) {
        alert('Failed to request unlock');
    } finally {
        setIsRequestingUnlock(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-800 flex flex-col font-sans pb-24 text-white">
      <div className="flex flex-col px-4 py-6 mb-4">
        <h2 className="text-xl font-black text-sky-400 mb-6">User Performance Analysis (KPI's)</h2>

        {/* Month & Year Selector */}
        <div className="flex gap-3 mb-8 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-inner">
          <div className="flex-1 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Month</label>
            <button 
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white font-semibold h-11 px-3 shadow-sm flex items-center justify-between focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <span>{selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {isMonthOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {months.map(m => (
                  <button 
                    key={m} 
                    onClick={() => { setSelectedMonth(m); setIsMonthOpen(false); }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-700/50 font-semibold transition-colors ${selectedMonth === m ? 'text-sky-400 bg-slate-700/50' : 'text-slate-200 hover:bg-slate-700'}`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Year</label>
            <button 
              onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white font-semibold h-11 px-3 shadow-sm flex items-center justify-between focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <span>{selectedYear}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {isYearOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {years.map(y => (
                  <button 
                    key={y} 
                    onClick={() => { setSelectedYear(y); setIsYearOpen(false); }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-700/50 font-semibold transition-colors ${selectedYear === y ? 'text-sky-400 bg-slate-700/50' : 'text-slate-200 hover:bg-slate-700'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Effort Analysis (Auto-calculated) */}
        <button
          onClick={() => navigate(`/extras/performance/effort?month=${selectedMonth}&year=${selectedYear}`)}
          className="w-full bg-gradient-to-r from-[#2a2d43] to-[#25273c] rounded-2xl p-6 flex items-center gap-4 shadow-xl mb-8 active:scale-95 transition-transform border border-slate-700/50"
        >
          <div className="w-14 h-14 bg-sky-500/20 rounded-xl flex items-center justify-center">
            <Users size={28} className="text-sky-400" />
          </div>
          <span className="text-lg font-bold text-white flex-1 text-left">Effort Analysis</span>
        </button>

        {/* Add Targets section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-slate-700 flex-1"></div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {isPlanningPhase ? "Add Planned Targets" : "Add Achieved Targets"}
          </h3>
          <div className="h-px bg-slate-700 flex-1"></div>
        </div>

        {/* Request Unlock Section */}
        {!isPlanningPhase && (
          <div className="mb-6">
            <button
              onClick={handleRequestUnlock}
              disabled={unlockRequested || isRequestingUnlock}
              className={`w-full h-12 rounded-xl font-bold flex items-center justify-center transition-all ${unlockRequested ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
              {isRequestingUnlock ? 'Requesting...' : unlockRequested ? 'Unlock Requested - Pending Approval' : 'Request Edit Access'}
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 pb-4">
          {TARGET_KPIS.map(kpi => (
            <button
              key={kpi.id}
              onClick={() => navigate(`/extras/performance/targets/${kpi.id}?month=${selectedMonth}&year=${selectedYear}`)}
              className="bg-[#25273c] rounded-3xl p-6 flex flex-col items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform border border-slate-700 hover:border-sky-500/50"
            >
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-inner mb-2">
                <kpi.icon size={32} className="text-sky-400" />
              </div>
              <span className="text-sm font-bold text-slate-300 text-center px-1 leading-tight">{kpi.label}</span>
            </button>
          ))}
        </div>

        {/* Final Submission Section */}
        {isPlanningPhase && (
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-medium text-slate-300">Planning Progress</span>
              <span className="text-sm font-bold text-sky-400">{plannedCount} / 5 KPIs Planned</span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(plannedCount / 5) * 100}%` }}
              ></div>
            </div>

            {plannedCount >= 5 ? (
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmittingFinal}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {isSubmittingFinal ? 'Locking Plan...' : 'Submit Final Monthly Plan'}
              </button>
            ) : (
              <button
                disabled
                className="w-full h-14 bg-slate-700 text-slate-400 font-bold rounded-2xl cursor-not-allowed border border-slate-600 border-dashed"
              >
                Plan all KPIs to Submit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


