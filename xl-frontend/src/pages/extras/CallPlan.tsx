import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Search, X, Plus, MapPin, Users, Package } from 'lucide-react';
import axios from 'axios';

interface ProductSelect { product: string; qty: number; }
interface GiftSelect { item: string; qty: number; }
interface PlannedEntity { id: string; name: string; info: string; samples: ProductSelect[]; gifts: GiftSelect[]; }

function CallPlan() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('xl_user');
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  
  const [activeUser, setActiveUser] = useState<any>(loggedInUser);
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const [showSubordinateModal, setShowSubordinateModal] = useState(false);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [giftsList, setGiftsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [configuringEntity, setConfiguringEntity] = useState<PlannedEntity | null>(null);

  const [isMultiMode, setIsMultiMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<number>>(new Set());
  const [planDates, setPlanDates] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState<'Doctors' | 'Chemists' | 'Stockists'>('Doctors');
  const [plannedDocs, setPlannedDocs] = useState<PlannedEntity[]>([]);
  const [plannedChems, setPlannedChems] = useState<PlannedEntity[]>([]);
  const [plannedStocks, setPlannedStocks] = useState<PlannedEntity[]>([]);
  
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loggedInUser) {
        navigate('/login');
    } else {
        fetchSubordinates();
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMasterData();
      fetchMonthlyPlans();
    }
  }, [activeUser, month, year]);

  const fetchSubordinates = async () => {
    try {
      const res = await axios.get(`/api/xl/subordinates?designation=${loggedInUser.designation}`);
      if (res.data.success) setSubordinates(res.data.data);
    } catch(e) {}
  };

  const fetchMasterData = async () => {
    try {
      const hq = activeUser?.hq || '';
      const designation = activeUser?.designation || '';
      
      const drRes = axios.get(`/api/xl/doctors?hq=${hq}&designation=${designation}`);
      const chRes = axios.get(`/api/xl/chemists?hq=${hq}&designation=${designation}`);
      const stRes = axios.get(`/api/xl/stockists?hq=${hq}&designation=${designation}`);
      const prRes = axios.get('/api/admin/products');
      const gfRes = axios.get('/api/admin/gifts');

      const [dr, ch, st, pr, gf] = await Promise.allSettled([drRes, chRes, stRes, prRes, gfRes]);
      
      if (dr.status === 'fulfilled' && dr.value.data.success) setDoctors(dr.value.data.data || []);
      if (ch.status === 'fulfilled' && ch.value.data.success) setChemists(ch.value.data.data || []);
      if (st.status === 'fulfilled' && st.value.data.success) setStockists(st.value.data.data || []);
      if (pr.status === 'fulfilled' && pr.value.data.success) setProducts(pr.value.data.products || []);
      if (gf.status === 'fulfilled' && gf.value.data.success) setGiftsList(gf.value.data.gifts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMonthlyPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/call-plan/month?email=${activeUser?.employeeId}&month=${month}&year=${year}`);
      if (res.data.success) {
        setMonthlyPlans(res.data.data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getPlanForDay = (day: number) => {
    const dStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
    return (monthlyPlans || []).find(p => p.date === dStr);
  };

  const isSunday = (day: number) => {
    const d = new Date(parseInt(year), parseInt(month) - 1, day);
    return d.getDay() === 0;
  };

  const loadPlanIntoState = (p: any) => {
    if (!p) {
      setPlannedDocs([]); setPlannedChems([]); setPlannedStocks([]);
      return;
    }
    
    const safeParse = (str: any, defaultKey: string) => {
      try {
        const parsed = JSON.parse(str || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => {
          if (typeof item === 'string') {
            return { id: item, name: item, info: 'Imported', samples: [], gifts: [] };
          }
          return item;
        });
      } catch(e) {
        return [];
      }
    };
    
    setPlannedDocs(safeParse(p.doctors, 'name'));
    setPlannedChems(safeParse(p.chemists, 'name'));
    setPlannedStocks(safeParse(p.stockists, 'name'));
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
    const firstDate = Array.from(selectedDates)[0];
    const p = getPlanForDay(firstDate);
    loadPlanIntoState(p);
    setShowPlanModal(true);
  };

  const toggleMultiSelect = (day: number) => {
    if (isSunday(day)) return;
    const ns = new Set(selectedDates);
    if (ns.has(day)) ns.delete(day); else ns.add(day);
    setSelectedDates(ns);
  };

  const openEntitySelector = () => {
    const existing = (activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks).map(e => e.id);
    setSelectedEntityIds(new Set(existing));
    setEntitySearch('');
    setShowEntityModal(true);
  };

  const confirmEntitySelection = () => {
    const list = activeTab === 'Doctors' ? doctors : activeTab === 'Chemists' ? chemists : stockists;
    const current = activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks;
    
    const newEntities = Array.from(selectedEntityIds).map(id => {
      const existing = current.find(e => e.id === id);
      if (existing) return existing;
      const item = list.find(l => (l._id || l.id) === id) || {};
      return {
        id: id,
        name: item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName || id,
        info: item.headquarter || item.hq || item.address || '',
        samples: [],
        gifts: []
      };
    });

    if (activeTab === 'Doctors') setPlannedDocs(newEntities);
    if (activeTab === 'Chemists') setPlannedChems(newEntities);
    if (activeTab === 'Stockists') setPlannedStocks(newEntities);
    
    setShowEntityModal(false);
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      const datesToSave = planDates.map(d => `${year}-${month}-${d.toString().padStart(2, '0')}`);
      
      const payload = {
        employeeId: activeUser?.employeeId,
        dates: datesToSave,
        doctors: plannedDocs,
        chemists: plannedChems,
        stockists: plannedStocks
      };

      const res = await axios.post('/api/xl/call-plan/bulk', payload);
      if (res.data.success) {
        setShowPlanModal(false);
        setIsMultiMode(false);
        setSelectedDates(new Set());
        fetchMonthlyPlans();
      }
    } catch (e) {
      alert('Failed to save call plan.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1c1c2e] text-white pb-20 font-sans">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-[#1c1c2e] shadow-md border-b border-[#3b3b5a] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/extras')} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[#27273f] active:bg-[#3b3b5a]">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Call Planning</h1>
            <p className="text-xs text-slate-400">Plan your daily visits and samples</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {subordinates.length > 0 && (
          <div 
            onClick={() => setShowSubordinateModal(true)}
            className="bg-emerald-900/40 border border-emerald-500/50 p-3 rounded-lg mb-4 flex items-center gap-3 cursor-pointer"
          >
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-400 leading-tight">Add Call Planning Report for another user</p>
              {activeUser?.employeeId !== loggedInUser?.employeeId && (
                <p className="text-xs text-white font-bold uppercase mt-1">FOR: {activeUser?.firstName} {activeUser?.lastName}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <label className="text-xs text-rose-400 font-bold mb-1 block">Select Month *</label>
            <button onClick={() => setShowMonthDropdown(!showMonthDropdown)} className="w-full text-left bg-[#27273f] border border-[#3b3b5a] rounded-lg p-3 text-sky-300 font-bold flex justify-between items-center">
              <span>{new Date(2000, parseInt(month)-1, 1).toLocaleString('default', { month: 'long' })}</span>
              <span className="text-slate-400">v</span>
            </button>
            {showMonthDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto">
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                  <button key={m} onClick={() => { setMonth(m); setShowMonthDropdown(false); }} className="w-full text-left p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0">
                    {new Date(2000, parseInt(m)-1, 1).toLocaleString('default', { month: 'long' })}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <label className="text-xs text-rose-400 font-bold mb-1 block">Year *</label>
            <button onClick={() => setShowYearDropdown(!showYearDropdown)} className="w-full text-left bg-[#27273f] border border-[#3b3b5a] rounded-lg p-3 text-sky-300 font-bold flex justify-between items-center">
              <span>{year}</span>
              <span className="text-slate-400">v</span>
            </button>
            {showYearDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto">
                {['2025','2026','2027','2028'].map(y => (
                  <button key={y} onClick={() => { setYear(y); setShowYearDropdown(false); }} className="w-full text-left p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0">
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-10 font-bold">Loading plans...</p>
        ) : (
          <div className="space-y-2 relative">
            {daysArray.map(day => {
              const plan = getPlanForDay(day);
              let pDocs = [], pChems = [], pStocks = [];
              if (plan) {
                try { 
                  pDocs = JSON.parse(plan.doctors||'[]'); 
                  pChems = JSON.parse(plan.chemists||'[]'); 
                  pStocks = JSON.parse(plan.stockists||'[]'); 
                } catch(e){}
              }
              const isHol = isSunday(day);
              const isPlanned = !!plan && (pDocs.length > 0 || pChems.length > 0 || pStocks.length > 0);

              return (
                <div 
                  key={day} 
                  onClick={() => isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day)}
                  className={`flex items-center rounded-lg overflow-hidden border ${isMultiMode && selectedDates.has(day) ? 'border-sky-500 bg-sky-900/20' : 'border-[#3b3b5a] bg-[#27273f]'} transition-colors mb-2`}
                >
                  <div className={`w-14 h-16 shrink-0 flex flex-col items-center justify-center ${isHol ? 'bg-slate-700/50' : isPlanned ? 'bg-emerald-600' : 'bg-[#1e88e5]'}`}>
                    <span className={`text-xl font-bold leading-none text-white opacity-90`}>{day}</span>
                    <span className={`text-[9px] font-bold uppercase text-white opacity-75 mt-0.5`}>
                      {new Date(parseInt(year), parseInt(month) - 1, day).toLocaleString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-4 flex justify-between items-center cursor-pointer">
                    {isHol ? (
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Not Allowed</span>
                    ) : (
                      <>
                        {plan ? (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 font-bold">{pDocs.length}</span></div>
                            <div className="flex items-center gap-1.5"><Package className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400 font-bold">{pChems.length}</span></div>
                            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-400" /><span className="text-orange-400 font-bold">{pStocks.length}</span></div>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-slate-200">Plan DCS calls</span>
                        )}
                      </>
                    )}
                    
                    {isMultiMode && !isHol && (
                      <div className="w-6 h-6 rounded border border-sky-400 flex items-center justify-center">
                        {selectedDates.has(day) && <Check className="w-4 h-4 text-sky-400" />}
                      </div>
                    )}
                    {!isMultiMode && !isHol && !plan && <Plus className="w-5 h-5 text-emerald-500" />}
                  </div>
                </div>
              );
            })}

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
        )}
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-[60] bg-[#1c1c2e] flex flex-col">
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
            <button onClick={openEntitySelector} className="flex items-center gap-2 text-sky-400 font-bold mb-4">
              <Plus className="w-5 h-5" /> Add {activeTab}
            </button>

            {(activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks).map(e => (
              <div key={e.id} className="bg-[#27273f] rounded-lg border border-[#3b3b5a] overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{e.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{e.info}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            <button onClick={handleSavePlan} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50">
              SAVE & SUBMIT FOR APPROVAL
            </button>
          </div>
        </div>
      )}

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
            {(activeTab === 'Doctors' ? doctors : activeTab === 'Chemists' ? chemists : stockists)
              .filter(item => {
                const name = (item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName || '').toLowerCase();
                return name.includes(entitySearch.toLowerCase());
              })
              .map(item => {
                const id = item._id || item.id;
                const isChecked = selectedEntityIds.has(id);
                return (
                  <div key={id} onClick={() => {
                    const ns = new Set(selectedEntityIds);
                    if (ns.has(id)) ns.delete(id); else ns.add(id);
                    setSelectedEntityIds(ns);
                  }} className="flex items-center gap-3 bg-[#27273f] p-3 rounded-lg border border-[#3b3b5a] cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName}</p>
                      <p className="text-xs text-slate-400">{item.headquarter || item.hq || item.address}</p>
                    </div>
                  </div>
                );
              })
            }
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            <button onClick={confirmEntitySelection} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg">
              Confirm Selection ({selectedEntityIds.size})
            </button>
          </div>
        </div>
      )}

      {showSubordinateModal && (
        <div className="fixed inset-0 z-[80] bg-[#1c1c2e] flex flex-col">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Select User to Plan For</h2>
            <button onClick={() => setShowSubordinateModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <button 
              onClick={() => { setActiveUser(loggedInUser); setShowSubordinateModal(false); }}
              className="w-full text-left bg-[#27273f] p-4 rounded-lg font-bold text-emerald-400 border border-emerald-500/30"
            >
              Myself ({loggedInUser?.firstName} {loggedInUser?.lastName})
            </button>
            {subordinates.map(sub => (
              <button 
                key={sub.employeeId}
                onClick={() => { setActiveUser(sub); setShowSubordinateModal(false); }}
                className="w-full text-left bg-[#27273f] p-4 rounded-lg font-bold text-white border border-[#3b3b5a]"
              >
                {sub.firstName} {sub.lastName}
                <span className="block text-xs text-slate-400 font-normal mt-1">{sub.designation} - {sub.hq}</span>
              </button>
            ))}
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
