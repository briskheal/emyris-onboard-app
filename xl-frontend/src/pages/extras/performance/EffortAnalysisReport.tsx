import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Activity, Users, Target } from 'lucide-react';
import axios from 'axios';

const USER_EMAIL = 'rep@emyris.in';

// Same calendar calculation helper as TargetAnalysisReport
function getCalendarWeeks(monthStr: string, yearStr: string) {
  const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(monthStr.toLowerCase());
  const year = parseInt(yearStr);
  if (monthIndex === -1 || isNaN(year)) return [];

  const weeks = [];
  let currentStart = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0);

  let weekNum = 1;
  while (currentStart <= endOfMonth) {
    let currentEnd = new Date(currentStart);
    while (currentEnd.getDay() !== 6 && currentEnd < endOfMonth) {
      currentEnd.setDate(currentEnd.getDate() + 1);
    }
    
    // For backend query
    const isoStart = currentStart.toISOString().split('T')[0];
    const isoEnd = currentEnd.toISOString().split('T')[0];

    const startStr = currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = currentEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      id: `week${weekNum}`,
      label: `Week ${weekNum}`,
      dateRange: `${startStr} - ${endStr}`,
      isoStart,
      isoEnd
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    weekNum++;
  }

  return weeks;
}

export default function EffortAnalysisReport() {
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<any[]>([]);
  const [activeWeek, setActiveWeek] = useState('week1');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWeeks(getCalendarWeeks(month, year));
  }, [month, year]);

  useEffect(() => {
    const selectedWeek = weeks.find(w => w.id === activeWeek);
    if (!selectedWeek) return;

    setLoading(true);
    axios.post('/api/xl/performance/effort-analysis', {
      email: USER_EMAIL,
      startDate: selectedWeek.isoStart,
      endDate: selectedWeek.isoEnd
    })
      .then(res => setMetrics(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [activeWeek, weeks]);

  return (
    <div className="min-h-full bg-[#f4f4f4] flex flex-col font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-[#e9ecef]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/extras/performance')} className="text-slate-700">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-600 tracking-wider">Biolifesciences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-sky-500"></div>
          <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
          <div className="flex flex-col gap-1 w-6">
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-sky-600">Effort Analysis Report</h2>
        <button className="w-10 h-10 bg-sky-600 rounded-full text-white flex items-center justify-center shadow-md">
          <Share2 size={18} />
        </button>
      </div>

      {/* Week Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {weeks.map(w => (
            <button
              key={w.id}
              onClick={() => setActiveWeek(w.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-2 px-6 rounded-3xl border transition-all ${
                activeWeek === w.id 
                  ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/30' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <span className="text-[13px] font-bold">{w.label}</span>
              <span className={`text-[10px] ${activeWeek === w.id ? 'text-sky-100' : 'text-slate-500'}`}>{w.dateRange}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Metrics Content */}
      {!loading && metrics && (
        <div className="px-4 space-y-4">
          
          {/* Key Percentages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Coverage</p>
              <p className="text-3xl font-black text-sky-600">{metrics.coveragePercentage}%</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500 font-bold mb-1">Compliance</p>
              <p className="text-3xl font-black text-emerald-600">{metrics.compliancePercentage}%</p>
            </div>
          </div>

          {/* Doctor Stats Block */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-3xl"></div>
            <div className="flex items-center gap-3 mb-4 pl-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Users size={16} className="text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800">Doctor Metrics</h3>
            </div>
            
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Total Doctors List</span>
                <span className="font-bold text-slate-900">{metrics.totalDoctors}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Total Calls Made</span>
                <span className="font-bold text-slate-900">{metrics.totalDrCalls}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Unique Visited</span>
                <span className="font-bold text-sky-600">{metrics.totalUniqueDoctorsVisited}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Missed Doctors</span>
                <span className="font-bold text-rose-500">{metrics.totalMissedDoctors}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-slate-600">Call Average / Day</span>
                <span className="font-bold text-slate-900">{metrics.doctorCallAverage}</span>
              </div>
            </div>
          </div>

          {/* Categorization Block */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-3xl"></div>
            <div className="flex items-center gap-3 mb-4 pl-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <Target size={16} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-800">List Categorization</h3>
            </div>

            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Super Core</span>
                <span className="font-bold text-slate-900">{metrics.numSuperCore}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Core</span>
                <span className="font-bold text-slate-900">{metrics.numCore}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-slate-600">Non Core</span>
                <span className="font-bold text-slate-900">{metrics.numNonCore}</span>
              </div>
            </div>
          </div>

          {/* Chemist / Stockist Block */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500 rounded-l-3xl"></div>
            <div className="flex items-center gap-3 mb-4 pl-2">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                <Activity size={16} className="text-teal-600" />
              </div>
              <h3 className="font-bold text-slate-800">Trade Metrics</h3>
            </div>

            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Total Chemists</span>
                <span className="font-bold text-slate-900">{metrics.totalChemists}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Chemist Calls</span>
                <span className="font-bold text-slate-900">{metrics.totalChemCalls}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Total Stockists</span>
                <span className="font-bold text-slate-900">{metrics.totalStockists}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-slate-600">Stockist Calls</span>
                <span className="font-bold text-slate-900">{metrics.totalStockCalls}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
