import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Search, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function TargetPlanningView({ kpiId, month, year, initialTargets, recordId, onPlanSubmitted }: any) {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<{id: string, label: string, dateRange: string}[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [addedEntities, setAddedEntities] = useState<any[]>(initialTargets);
  
  const [showModal, setShowModal] = useState(false);
  const [activeModalEntity, setActiveModalEntity] = useState<any>(null);
  
  // Weekly plans state for the modal
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate calendar weeks
    const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(month.toLowerCase());
    const y = parseInt(year);
    if (monthIndex === -1 || isNaN(y)) return;

    const w = [];
    let currentStart = new Date(y, monthIndex, 1);
    const endOfMonth = new Date(y, monthIndex + 1, 0);

    let weekNum = 1;
    while (currentStart <= endOfMonth) {
      let currentEnd = new Date(currentStart);
      while (currentEnd.getDay() !== 6 && currentEnd < endOfMonth) {
        currentEnd.setDate(currentEnd.getDate() + 1);
      }

      const startStr = currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = currentEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      w.push({ id: `week${weekNum}`, label: `Week ${weekNum} Plan`, dateRange: `${startStr} - ${endStr}` });

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      weekNum++;
    }
    setWeeks(w);
  }, [month, year]);

  // Mock search results (in reality, fetch from API based on KPI)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    // Dummy search
    setSearchResults([
      { id: `e_${searchQuery}_1`, name: `${searchQuery} Product A`, type: 'Product' },
      { id: `e_${searchQuery}_2`, name: `${searchQuery} Product B`, type: 'Product' },
      { id: `e_${searchQuery}_3`, name: `${searchQuery} Product C`, type: 'Product' },
    ]);
  }, [searchQuery]);

  const handleSelectToAddList = () => {
    if (!selectedEntity) return;
    if (addedEntities.find(e => e.entityId === selectedEntity.id)) {
        alert('Already added to the list');
        return;
    }
    
    // Seed with empty weekly plans
    const newEntity = {
        entityId: selectedEntity.id,
        entityName: selectedEntity.name,
        entityType: selectedEntity.type,
        monthlyTarget: 0
    };
    weeks.forEach(w => {
        (newEntity as any)[w.id] = { planned: 0, achieved: 0 };
    });

    setAddedEntities([...addedEntities, newEntity]);
    setSelectedEntity(null);
    setSearchQuery('');
  };

  const openModalFor = (entity: any) => {
    setActiveModalEntity(entity);
    const plans: Record<string, number> = {};
    weeks.forEach(w => {
        plans[w.id] = entity[w.id]?.planned || 0;
    });
    setWeeklyPlans(plans);
    setShowModal(true);
  };

  const calculateMonthlyTarget = () => {
    return Object.values(weeklyPlans).reduce((acc, curr) => acc + (curr || 0), 0);
  };

  const saveModalEntity = () => {
    const total = calculateMonthlyTarget();
    setAddedEntities(prev => prev.map(e => {
        if (e.entityId === activeModalEntity.entityId) {
            const updated = { ...e, monthlyTarget: total };
            weeks.forEach(w => {
                updated[w.id] = { planned: weeklyPlans[w.id] || 0, achieved: 0 };
            });
            return updated;
        }
        return e;
    }));
    setShowModal(false);
  };

  const submitEntirePlan = async () => {
    if (addedEntities.length === 0) {
        alert("Please add and plan targets for at least one item.");
        return;
    }
    setIsSubmitting(true);
    try {
        const payload: any = { id: recordId };
        const dataStr = JSON.stringify(addedEntities);
        
        if (kpiId === 'brand') payload.brandData = dataStr;
        else if (kpiId === 'account') payload.accountData = dataStr;
        else if (kpiId === 'keyCustomer') payload.keyCustomerData = dataStr;
        else if (kpiId === 'roi') payload.roiData = dataStr;
        else if (kpiId === 'outstanding') payload.outstandingData = dataStr;

        await axios.post('/api/xl/performance/plan', payload);
        alert('Monthly Plan Locked In Successfully!');
        onPlanSubmitted(); // Trigger switch to achievement view
    } catch (e) {
        alert('Failed to submit plan');
    } finally {
        setIsSubmitting(false);
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

      <div className="px-4 py-4">
        <h2 className="text-xl font-bold text-sky-400 mb-6">Plan Targets</h2>

        {/* Search & Add Bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 relative">
            <div className="bg-[#353854] border border-slate-600 rounded-2xl flex items-center px-4 h-14">
              <span className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-bold text-sky-400 mr-3">
                {addedEntities.length}
              </span>
              <input
                type="text"
                placeholder="Select Entity..."
                value={selectedEntity ? selectedEntity.name : searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedEntity(null);
                }}
                className="bg-transparent border-none focus:outline-none flex-1 text-white placeholder:text-slate-500 font-semibold"
              />
              <Search size={18} className="text-slate-500" />
            </div>

            {/* Dropdown Results */}
            {searchQuery.length >= 2 && !selectedEntity && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#353854] border border-slate-600 rounded-xl shadow-xl z-10 overflow-hidden">
                {searchResults.map(res => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedEntity(res)}
                    className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-[#404363] transition-colors"
                  >
                    <span className="font-semibold text-white">{res.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSelectToAddList}
            className="w-14 h-14 rounded-2xl border-2 border-emerald-500 flex items-center justify-center active:bg-emerald-500/20 transition-colors"
          >
            <Plus size={24} className="text-emerald-500" />
          </button>
        </div>

        {/* Selected Entities List */}
        <h3 className="text-sm font-bold text-sky-400 mb-4">Selected Items</h3>
        <div className="space-y-3">
          {addedEntities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Plus size={32} className="mb-2" />
              <p>Select items to plan</p>
            </div>
          )}
          {addedEntities.map((e, idx) => (
            <div key={idx} className="bg-[#353854] rounded-2xl p-4 flex items-center justify-between border border-slate-600">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-sky-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{e.entityName}</p>
                  <p className="text-xs text-slate-400">Total Planned: {e.monthlyTarget}</p>
                </div>
              </div>
              <button 
                onClick={() => openModalFor(e)}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                + Add Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#2a2d45] border-t border-slate-700">
        <button 
          onClick={submitEntirePlan}
          disabled={isSubmitting || addedEntities.length === 0}
          className="w-full h-14 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Monthly Plan'}
        </button>
      </div>

      {/* Bottom Sheet Modal for Week-by-Week Planning */}
      {showModal && activeModalEntity && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#2a2d45] w-full max-w-md rounded-t-3xl border-t border-slate-700 max-h-[85vh] flex flex-col relative animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-700 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sky-400 leading-tight">{activeModalEntity.entityName}</h3>
                  <p className="text-xs text-slate-400 mt-1">{activeModalEntity.entityType}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto pb-32">
              <div className="mb-6">
                <label className="text-sm font-bold text-white block mb-1">My Monthly Target</label>
                <p className="text-[10px] text-slate-400 mb-3">{month.charAt(0).toUpperCase() + month.slice(1)} 1 - {month.charAt(0).toUpperCase() + month.slice(1)} 30</p>
                <div className="bg-[#353854] border border-slate-600 rounded-xl px-4 py-3 font-black text-xl text-emerald-400 w-1/2">
                  {calculateMonthlyTarget()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {weeks.map(w => (
                  <div key={w.id}>
                    <label className="text-sm font-bold text-white block mb-1">{w.label} <span className="text-rose-500">*</span></label>
                    <p className="text-[10px] text-slate-400 mb-2">{w.dateRange}</p>
                    <input 
                      type="number"
                      value={weeklyPlans[w.id] || ''}
                      onChange={e => setWeeklyPlans({...weeklyPlans, [w.id]: Number(e.target.value)})}
                      placeholder="Qty"
                      className="w-full bg-[#353854] border border-slate-600 rounded-xl px-4 py-3 font-semibold text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2a2d45] border-t border-slate-700">
              <button 
                onClick={saveModalEntity}
                className="w-full h-14 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
