import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Save, Pencil } from 'lucide-react';
import axios from 'axios';

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

export default function TargetAchievementView({ kpiId, month, year, initialTargets, recordId }: any) {
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<{id: string, label: string, dateRange: string}[]>([]);
  const [activeWeek, setActiveWeek] = useState('week1');
  const [targets, setTargets] = useState<any[]>(initialTargets);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWeeks(getCalendarWeeks(month, year));
  }, [month, year]);

  const updateTarget = (entityId: string, value: number) => {
    setTargets(prev => prev.map(t => {
      if (t.entityId === entityId) {
        return {
          ...t,
          [activeWeek]: { ...t[activeWeek], achieved: value }
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
        alert('Achievements saved successfully!');
    } catch (e) {
        alert('Failed to save');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#2a2d45] flex flex-col font-sans pb-24 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#2a2d45]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/extras/performance')} className="text-sky-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-400 tracking-wider">Biolifesciences</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-sky-400">{KPI_TITLES[kpiId || 'roi']}</h2>
        <button className="w-10 h-10 bg-sky-500 rounded-full text-white flex items-center justify-center shadow-md">
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
                  ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30' 
                  : 'bg-[#353854] border-slate-600 text-slate-300'
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
          const progressRaw = weekData.planned > 0 ? Math.round((weekData.achieved / weekData.planned) * 100) : 0;
          const progressClamped = Math.min(100, progressRaw);
          
          let barColor = 'bg-rose-500';
          if (progressRaw >= 50 && progressRaw < 100) barColor = 'bg-amber-500';
          else if (progressRaw >= 100) barColor = 'bg-emerald-500';
          
          return (
            <div key={t.entityId} className="bg-[#353854] rounded-3xl p-5 shadow-lg border border-slate-600 relative overflow-hidden">
              {/* Colored accent bar on the left */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor} rounded-l-3xl`}></div>
              
              <div className="flex justify-between items-start pl-2">
                <h3 className="text-base font-bold text-white max-w-[70%]">
                  {t.entityName} <span className="text-sm font-medium text-slate-400 block mt-0.5">{t.entityType}</span>
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${barColor} text-white`}>
                  {progressRaw}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-5 flex items-center gap-3 pl-2">
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md">
                  0%
                </div>
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden relative">
                  {/* Dynamic gradient based on clamped progress */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500" 
                    style={{ width: `${progressClamped}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">100%</span>
              </div>

              {/* Metrics Grid */}
              <div className="mt-8 flex justify-between px-2 pb-4 border-b border-slate-600/50">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Monthly Target</p>
                  <p className="text-sm font-bold text-white mt-1">{t.monthlyTarget}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Planned Target</p>
                  <p className="text-sm font-bold text-white mt-1">{weekData.planned}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center px-2">
                <div>
                  <p className="text-sm text-slate-300 font-bold">Achieved Target</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <input 
                    type="number" 
                    value={weekData.achieved}
                    onChange={(e) => updateTarget(t.entityId, Number(e.target.value))}
                    className="w-20 text-right font-black text-white text-lg border-b border-slate-500 focus:border-sky-500 focus:outline-none bg-transparent pb-1"
                  />
                  <Pencil size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          );
        })}

        {targets.length === 0 && (
          <div className="text-center text-slate-500 py-10">
            No targets planned for this month.
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 right-4 z-40">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-sky-500 hover:bg-sky-400 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
          <Save size={20} />
        </button>
      </div>
    </div>
  );
}
