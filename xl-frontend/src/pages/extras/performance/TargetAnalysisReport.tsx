import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, Save, Pencil } from 'lucide-react';
import axios from 'axios';

const USER_EMAIL = 'rep@emyris.in';

// Helper to calculate calendar weeks for a given month and year
function getCalendarWeeks(monthStr: string, yearStr: string) {
  const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(monthStr.toLowerCase());
  const year = parseInt(yearStr);
  if (monthIndex === -1 || isNaN(year)) return [];

  const weeks = [];
  let currentStart = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0);

  let weekNum = 1;
  while (currentStart <= endOfMonth) {
    // Find the next Saturday (6)
    let currentEnd = new Date(currentStart);
    while (currentEnd.getDay() !== 6 && currentEnd < endOfMonth) {
      currentEnd.setDate(currentEnd.getDate() + 1);
    }

    const startStr = currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = currentEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      id: `week${weekNum}`,
      label: `Week ${weekNum}`,
      dateRange: `${startStr} - ${endStr}`
    });

    // Next week starts the day after currentEnd
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    weekNum++;
  }

  return weeks;
}

const KPI_TITLES: Record<string, string> = {
  brand: 'Brand Analysis Report',
  account: 'Account Analysis Report',
  keyCustomer: 'Key Customer Analysis Report',
  roi: 'Customer ROI Analysis Report',
  outstanding: 'Outstanding Analysis Report'
};

export default function TargetAnalysisReport() {
  const { kpiId } = useParams<{ kpiId: string }>();
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<{id: string, label: string, dateRange: string}[]>([]);
  const [activeWeek, setActiveWeek] = useState('week1');
  const [recordId, setRecordId] = useState<string | null>(null);
  
  // Array of target entities: { entityId, entityName, entityType, week1: { planned, achieved }, week2: ... }
  const [targets, setTargets] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWeeks(getCalendarWeeks(month, year));
  }, [month, year]);

  useEffect(() => {
    if (!kpiId) return;
    
    // Fetch data for this month
    axios.get(`/api/xl/performance/my?email=${USER_EMAIL}&month=${month}&year=${year}`)
      .then(res => {
        const perf = res.data.data;
        setRecordId(perf._id);
        
        let dataStr = '[]';
        if (kpiId === 'brand') dataStr = perf.brandData;
        else if (kpiId === 'account') dataStr = perf.accountData;
        else if (kpiId === 'keyCustomer') dataStr = perf.keyCustomerData;
        else if (kpiId === 'roi') dataStr = perf.roiData;
        else if (kpiId === 'outstanding') dataStr = perf.outstandingData;

        try {
          let parsed = JSON.parse(dataStr);
          // If empty, seed some dummy data for demonstration (in reality, admin sets targets or user creates them)
          if (parsed.length === 0) {
            parsed = [
               { entityId: 'e1', entityName: 'Dr Shrinivasa Kumaran', entityType: 'Doctor', monthlyTarget: 6 },
               { entityId: 'e2', entityName: 'Amruta Hospital Rajkot', entityType: 'Hospital', monthlyTarget: 25004 }
            ];
          }
          
          // Ensure week objects exist
          parsed = parsed.map((t: any) => {
             const updated = { ...t };
             getCalendarWeeks(month, year).forEach(w => {
                 if (!updated[w.id]) updated[w.id] = { planned: 0, achieved: 0 };
             });
             return updated;
          });

          setTargets(parsed);
        } catch (e) {
          setTargets([]);
        }
      })
      .catch(console.error);
  }, [kpiId, month, year]);

  const updateTarget = (entityId: string, field: 'planned' | 'achieved', value: number) => {
    setTargets(prev => prev.map(t => {
      if (t.entityId === entityId) {
        return {
          ...t,
          [activeWeek]: { ...t[activeWeek], [field]: value }
        };
      }
      return t;
    }));
  };

  const handleSave = async () => {
    if (!recordId || !kpiId) return;
    setIsSaving(true);
    try {
        const payload: any = { id: recordId };
        const dataStr = JSON.stringify(targets);
        
        if (kpiId === 'brand') payload.brandData = dataStr;
        else if (kpiId === 'account') payload.accountData = dataStr;
        else if (kpiId === 'keyCustomer') payload.keyCustomerData = dataStr;
        else if (kpiId === 'roi') payload.roiData = dataStr;
        else if (kpiId === 'outstanding') payload.outstandingData = dataStr;

        await axios.put('/api/xl/performance/achieve', payload);
        alert('Saved successfully!');
    } catch (e) {
        alert('Failed to save');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f4f4] flex flex-col font-sans pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#e9ecef]">
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
        <h2 className="text-lg font-bold text-sky-600">{KPI_TITLES[kpiId || 'roi']}</h2>
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

      {/* Target Cards */}
      <div className="px-4 space-y-4">
        {targets.map(t => {
          const weekData = t[activeWeek] || { planned: 0, achieved: 0 };
          const progress = weekData.planned > 0 ? Math.min(100, Math.round((weekData.achieved / weekData.planned) * 100)) : 0;
          
          return (
            <div key={t.entityId} className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
              {/* Black accent bar on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-900 rounded-l-3xl"></div>
              
              <h3 className="text-base font-bold text-slate-900 pl-2">
                {t.entityName} <span className="text-sm font-medium text-slate-500">({t.entityType})</span>
              </h3>

              {/* Progress Bar */}
              <div className="mt-4 flex items-center gap-3 pl-2">
                <div className="w-10 h-6 bg-sky-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sky-600/20">
                  {progress}%
                </div>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-6 flex justify-between px-2">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Monthly Target</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">₹ {t.monthlyTarget}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 font-medium">Planned Target</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-900">₹</span>
                    <input 
                      type="number" 
                      value={weekData.planned}
                      onChange={(e) => updateTarget(t.entityId, 'planned', Number(e.target.value))}
                      className="w-16 text-right font-bold text-slate-900 border-b border-slate-300 focus:border-sky-600 focus:outline-none bg-transparent pb-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-between px-2">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Achieved Target</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">₹</span>
                  <input 
                    type="number" 
                    value={weekData.achieved}
                    onChange={(e) => updateTarget(t.entityId, 'achieved', Number(e.target.value))}
                    className="w-16 text-right font-bold text-slate-900 border-b border-slate-300 focus:border-sky-600 focus:outline-none bg-transparent pb-0.5"
                  />
                  <Pencil size={12} className="text-slate-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_8px_20px_rgba(2,132,199,0.3)] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
          <Save size={20} />
        </button>
      </div>
    </div>
  );
}
