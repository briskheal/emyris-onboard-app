import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Search, X, Plus, MapPin, Users, Package } from 'lucide-react';
import axios from 'axios';

// Interfaces for structured JSON
interface ProductSelect { product: string; qty: number; }
interface GiftSelect { item: string; qty: number; }
interface PlannedEntity { id: string; name: string; info: string; samples: ProductSelect[]; gifts: GiftSelect[]; }

function CallPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const storedUser = localStorage.getItem('xl_user');
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  
  // State for user context (Manager selecting a subordinate)
  const [activeUser, setActiveUser] = useState<any>(loggedInUser);
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const [showSubordinateModal, setShowSubordinateModal] = useState(false);

  // Month & Year State
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Data fetching state
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]); // Array of XlCallPlan from backend
  
  // Calendar Days Calculation
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Master Data
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // For Samples
  const [giftsList, setGiftsList] = useState<any[]>([]); // For Gifts

  // Multi-Select CPs
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<number>>(new Set());

  // Plan Calls Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDates, setPlanDates] = useState<number[]>([]); // Array of dates being planned (1 if single, >1 if multi)
  
  const [activeTab, setActiveTab] = useState<'Doctors' | 'Chemists' | 'Stockists'>('Doctors');
  
  const [plannedDocs, setPlannedDocs] = useState<PlannedEntity[]>([]);
  const [plannedChems, setPlannedChems] = useState<PlannedEntity[]>([]);
  const [plannedStocks, setPlannedStocks] = useState<PlannedEntity[]>([]);

  // Entity Selection Modal
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  
  // Sample/Gift Config Modal
  const [configuringEntity, setConfiguringEntity] = useState<PlannedEntity | null>(null);
  const [configType, setConfigType] = useState<'Doctors' | 'Chemists' | 'Stockists'>('Doctors');

  useEffect(() => {
    if (!loggedInUser) navigate('/login');
    else {
      fetchMasterData();
      fetchSubordinates();
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMonthlyPlans();
    }
  }, [activeUser, month, year]);

  const fetchMasterData = async () => {
    try {
      const hq = activeUser?.hq || '';
      const drRes = axios.get(`/api/xl/doctors?hq=${hq}`);
      const chRes = axios.get(`/api/xl/chemists?hq=${hq}`);
      const stRes = axios.get(`/api/xl/stockists?hq=${hq}`); // If doesn't exist, will fail silently or return 404
      const prRes = axios.get('/api/admin/products');
      const gfRes = axios.get('/api/admin/gifts'); // Assuming a gifts API exists, if not we'll handle gracefully

      const [dr, ch, st, pr, gf] = await Promise.allSettled([drRes, chRes, stRes, prRes, gfRes]);
      
      if (dr.status === 'fulfilled' && dr.value.data.success) setDoctors(dr.value.data.data);
      if (ch.status === 'fulfilled' && ch.value.data.success) setChemists(ch.value.data.data);
      if (st.status === 'fulfilled' && st.value.data.success) setStockists(st.value.data.data || []);
      if (pr.status === 'fulfilled' && pr.value.data.success) setProducts(pr.value.data.products || []);
      if (gf.status === 'fulfilled' && gf.value.data.success) setGiftsList(gf.value.data.gifts || []);
      
    } catch (e) { console.error(e); }
  };

  const fetchSubordinates = async () => {
    try {
      const res = await axios.get(`/api/xl/subordinates?designation=${loggedInUser.designation}`);
      if (res.data.success) setSubordinates(res.data.data);
    } catch(e) {}
  };

  const fetchMonthlyPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/call-plan/month?email=${activeUser.employeeId}&month=${month}&year=${year}`);
      if (res.data.success) {
        setMonthlyPlans(res.data.data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Helper to get plan for a specific day
  const getPlanForDay = (day: number) => {
    const dStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
    return monthlyPlans.find(p => p.date === dStr);
  };

  const isSunday = (day: number) => {
    const d = new Date(parseInt(year), parseInt(month) - 1, day);
    return d.getDay() === 0;
  };

  const openSinglePlan = (day: number) => {
    if (isSunday(day)) return;
    setPlanDates([day]);
    const p = getPlanForDay(day);
    loadPlanIntoState(p);
    setShowPlanModal(true);
  };

  const openMultiPlan = () => {
    if (selectedDates.size === 0) return;
    setPlanDates(Array.from(selectedDates));
    // Load the first selected date's plan into state just to prepopulate if it exists
    const firstDate = Array.from(selectedDates)[0];
    const p = getPlanForDay(firstDate);
    loadPlanIntoState(p);
    setShowPlanModal(true);
  };

  const loadPlanIntoState = (p: any) => {
    if (!p) {
      setPlannedDocs([]); setPlannedChems([]); setPlannedStocks([]);
      return;
    }
    try {
      setPlannedDocs(JSON.parse(p.doctors || '[]'));
      setPlannedChems(JSON.parse(p.chemists || '[]'));
      setPlannedStocks(JSON.parse(p.stockists || '[]'));
    } catch(e) {
      setPlannedDocs([]); setPlannedChems([]); setPlannedStocks([]);
    }
  };

  const toggleMultiSelect = (day: number) => {
    if (isSunday(day)) return;
    const ns = new Set(selectedDates);
    if (ns.has(day)) ns.delete(day); else ns.add(day);
    setSelectedDates(ns);
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      const datesToSave = planDates.map(d => `${year}-${month}-${d.toString().padStart(2, '0')}`);
      
      const payload = {
        employeeId: activeUser.employeeId,
        dates: datesToSave,
        doctors: plannedDocs,
        chemists: plannedChems,
        stockists: plannedStocks
      };

      await axios.post('/api/xl/call-plan/bulk', payload);
      alert('Auto Approved !\\nCall plan created successfully.');
      setShowPlanModal(false);
      setIsMultiMode(false);
      setSelectedDates(new Set());
      fetchMonthlyPlans();
    } catch (e) {
      alert('Failed to save call plan.');
    }
    setLoading(false);
  };

  const addEntities = (entities: any[], type: 'Doctors' | 'Chemists' | 'Stockists') => {
    const newItems = entities.map(e => ({
      id: e._id,
      name: e.name || e.hospital || 'Unknown',
      info: e.workingArea || e.address || e.headquarter || '',
      samples: [],
      gifts: []
    }));

    if (type === 'Doctors') setPlannedDocs([...plannedDocs, ...newItems]);
    if (type === 'Chemists') setPlannedChems([...plannedChems, ...newItems]);
    if (type === 'Stockists') setPlannedStocks([...plannedStocks, ...newItems]);
    setShowEntityModal(false);
  };

  const updateEntityConfig = (entity: PlannedEntity) => {
    if (configType === 'Doctors') {
      setPlannedDocs(plannedDocs.map(d => d.id === entity.id ? entity : d));
    } else if (configType === 'Chemists') {
      setPlannedChems(plannedChems.map(d => d.id === entity.id ? entity : d));
    } else {
      setPlannedStocks(plannedStocks.map(d => d.id === entity.id ? entity : d));
    }
    setConfiguringEntity(null);
  };

  return (
    <div className="min-h-screen bg-[#1c1c2e] text-white pb-20 font-sans">
      {/* Header */}
      <div className="bg-[#1c1c2e] p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/xl/dashboard')}><ChevronLeft className="w-6 h-6 text-sky-400" /></button>
          <div>
            <h1 className="font-bold text-lg leading-tight uppercase tracking-widest text-slate-100 flex items-center gap-2">EMYRIS</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest leading-none">Biolifesciences</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Month/Year Selection */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs text-rose-400 font-bold mb-1 block">Select Month *</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg p-3 text-sky-300 font-bold appearance-none">
              <option value="01">January</option><option value="02">February</option><option value="03">March</option>
              <option value="04">April</option><option value="05">May</option><option value="06">June</option>
              <option value="07">July</option><option value="08">August</option><option value="09">September</option>
              <option value="10">October</option><option value="11">November</option><option value="12">December</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-rose-400 font-bold mb-1 block">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg p-3 text-sky-300 font-bold appearance-none">
              <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
          </div>
        </div>

        {/* Manager Override Banner */}
        {subordinates.length > 0 && (
          <div 
            onClick={() => setShowSubordinateModal(true)}
            className="bg-emerald-900/40 border border-emerald-500/50 p-3 rounded-lg mb-4 flex items-center gap-3 cursor-pointer"
          >
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-400 leading-tight">Add Call Planning Report for another user</p>
              {activeUser.employeeId !== loggedInUser.employeeId && (
                <p className="text-xs text-white font-bold uppercase mt-1">FOR: {activeUser.firstName} {activeUser.lastName}</p>
              )}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="space-y-2 relative">
          {daysArray.map(day => {
            const plan = getPlanForDay(day);
            let pDocs = [], pChems = [], pStocks = [];
            if (plan) {
              try { pDocs = JSON.parse(plan.doctors||'[]'); pChems = JSON.parse(plan.chemists||'[]'); pStocks = JSON.parse(plan.stockists||'[]'); } catch(e){}
            }
            const isHol = isSunday(day);

            return (
              <div 
                key={day} 
                onClick={() => isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day)}
                className={`flex items-center rounded-lg overflow-hidden border ${isMultiMode && selectedDates.has(day) ? 'border-sky-500 bg-sky-900/20' : 'border-[#3b3b5a] bg-[#27273f]'} transition-colors`}
              >
                <div className={`w-14 shrink-0 flex flex-col items-center justify-center p-2 ${isHol ? 'bg-slate-700/50 text-slate-400' : 'bg-sky-500 text-white'}`}>
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-1">
                    {new Date(parseInt(year), parseInt(month) - 1, day).toLocaleString('en-US', { weekday: 'short' })}
                  </span>
                </div>
                
                <div className="flex-1 p-4 flex items-center justify-between">
                  {isHol ? (
                    <span className="text-slate-500 font-bold italic">Not Allowed</span>
                  ) : (
                    <>
                      {plan ? (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 font-bold">{pDocs.length}</span></div>
                          <div className="flex items-center gap-1.5"><Package className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400 font-bold">{pChems.length}</span></div>
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-400" /><span className="text-orange-400 font-bold">{pStocks.length}</span></div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium">Plan DCS calls</span>
                      )}
                    </>
                  )}
                  
                  {isMultiMode && !isHol && (
                    <div className="w-6 h-6 rounded border border-sky-400 flex items-center justify-center">
                      {selectedDates.has(day) && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                  )}
                  {!isMultiMode && !isHol && !plan && <Plus className="w-5 h-5 text-sky-400" />}
                </div>
              </div>
            );
          })}

          {/* Floating Multiple CPs button */}
          <div className="sticky bottom-6 flex justify-end px-2">
            {!isMultiMode ? (
              <button onClick={() => setIsMultiMode(true)} className="bg-sky-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Multiple CPs
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsMultiMode(false); setSelectedDates(new Set()); }} className="bg-slate-700 text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
                  <X className="w-5 h-5" /> Cancel
                </button>
                <button onClick={openMultiPlan} disabled={selectedDates.size === 0} className="bg-sky-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2 disabled:opacity-50">
                  <Check className="w-5 h-5" /> Add {selectedDates.size} CPs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Calls Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-[#1c1c2e] flex flex-col">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center gap-3">
            <button onClick={() => setShowPlanModal(false)}><ChevronLeft className="w-6 h-6 text-sky-400" /></button>
            <div>
              <h1 className="font-bold text-lg text-white">Plan Calls</h1>
              {planDates.length > 1 ? (
                <p className="text-xs text-sky-400">Creating Call Plans for {planDates.length} dates</p>
              ) : (
                <p className="text-xs text-sky-400">Call plans for {year}-{month}-{planDates[0].toString().padStart(2, '0')}</p>
              )}
            </div>
          </div>
          
          <div className="flex border-b border-[#3b3b5a]">
            {['Doctors', 'Chemists', 'Stockists'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400'}`}
              >
                {t} ({(t==='Doctors'?plannedDocs:t==='Chemists'?plannedChems:plannedStocks).length})
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <button onClick={() => setShowEntityModal(true)} className="flex items-center gap-2 text-sky-400 font-bold mb-4">
              <Plus className="w-5 h-5" /> Add {activeTab}
            </button>

            {(activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks).map(e => (
              <div key={e.id} className="bg-[#27273f] rounded-lg border border-[#3b3b5a] overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{e.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{e.info}</p>
                  </div>
                  <button 
                    onClick={() => { setConfigType(activeTab); setConfiguringEntity(e); }}
                    className="w-8 h-8 flex items-center justify-center bg-sky-900/30 text-sky-400 rounded-lg border border-sky-500/50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {(e.samples.length > 0 || e.gifts.length > 0) && (
                  <div className="bg-[#1c1c2e] p-3 border-t border-[#3b3b5a] flex gap-3">
                    {e.samples.map((s,i) => <span key={i} className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded font-bold border border-emerald-500/30">{s.qty} {s.product}</span>)}
                    {e.gifts.map((g,i) => <span key={i} className="text-[10px] bg-purple-900/50 text-purple-400 px-2 py-1 rounded font-bold border border-purple-500/30">{g.qty} {g.item}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            <button onClick={handleSavePlan} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50">
              Submit For Approval
            </button>
          </div>
        </div>
      )}

      {/* Entity Selection Modal */}
      {showEntityModal && (
        <div className="fixed inset-0 z-[60] bg-[#1c1c2e] flex flex-col">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Select {activeTab}</h2>
            <button onClick={() => setShowEntityModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="p-4 border-b border-[#3b3b5a]">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Search for ${activeTab}`}
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
                className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Extremely simplified selection list for brevity. A real implementation would map state and allow selection, then return selected entities to addEntities() */}
            <p className="text-slate-400 text-sm text-center mt-10">Use checkboxes to select entities...</p>
          </div>
        </div>
      )}

      {/* Configuration Modal (Samples & Gifts) */}
      {configuringEntity && (
        <div className="fixed inset-0 z-[70] bg-[#1c1c2e] flex flex-col">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <h2 className="font-bold text-lg text-sky-400">{configuringEntity.name}</h2>
            <button onClick={() => setConfiguringEntity(null)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="text-sm font-bold text-slate-300 block mb-2">Planned POB / Samples</label>
              {/* Fake dropdowns for simulation based on video */}
              <div className="bg-[#27273f] border border-[#3b3b5a] rounded-lg p-4 text-slate-400 text-sm">Select Samples v</div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-300 block mb-2">Planned Gifts</label>
              <div className="bg-[#27273f] border border-[#3b3b5a] rounded-lg p-4 text-slate-400 text-sm">Select Gifts v</div>
            </div>
          </div>
          <div className="p-4 border-t border-[#3b3b5a]">
            <button onClick={() => updateEntityConfig(configuringEntity)} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg">Save</button>
          </div>
        </div>
      )}

    </div>
  );
}


class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red', background: '#fff'}}><h1>Runtime Crash:</h1><pre>{this.state.error.toString()}</pre><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children; 
  }
}

export default function SafeCallPlan() {
  return <ErrorBoundary><CallPlan /></ErrorBoundary>;
}
