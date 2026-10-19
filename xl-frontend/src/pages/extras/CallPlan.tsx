import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Search, X, Plus, MapPin, Users, Package, Trash2, BarChart2, AlertCircle } from 'lucide-react';
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
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [giftsList, setGiftsList] = useState<any[]>([]);

  // Planning Analytics & Missed Doctors Modal
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [missedSearch, setMissedSearch] = useState('');
  const [missedFilterCat, setMissedFilterCat] = useState<'All' | 'Super Core' | 'Core' | 'Non-Core'>('All');

  // 'loading' = calendar list loading; 'saving' = save button submitting
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchHolidays();
    }
  }, [activeUser, month, year]);

  const fetchSubordinates = async () => {
    try {
      const res = await axios.get(`/api/xl/subordinates?designation=${loggedInUser.designation}`);
      if (res.data.success) setSubordinates(res.data.data);
    } catch(e) {}
  };

  const fetchHolidays = async () => {
    try {
      const res = await axios.get('/api/xl/settings/holidays');
      if (res.data.success) {
        const holidayMap: Record<string, string> = {};
          res.data.data.forEach((h: any) => {
            const hState = (h.state || '').toLowerCase().trim();
            const uState = (activeUser?.state || '').toLowerCase().trim();
            if (!h.state || h.state === 'All' || h.state === 'N/A' || hState === uState) {
              const d = new Date(h.date);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              holidayMap[`${y}-${m}-${day}`] = h.title;
            }
          });
        setHolidays(holidayMap);
      }
    } catch (e) {
      console.error('Failed to fetch holidays', e);
    }
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
    } catch (e) { console.error(e); }
  };

  const fetchMonthlyPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/call-plan/month?email=${activeUser?.employeeId}&month=${month}&year=${year}`);
      if (res.data.success) setMonthlyPlans(res.data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getPlanForDay = (day: number) => {
    const dStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
    return (monthlyPlans || []).find(p => p.date === dStr);
  };

  const isSunday = (day: number) => new Date(parseInt(year), parseInt(month) - 1, day).getDay() === 0;

  const safeParse = (str: any, type: 'Doctors' | 'Chemists' | 'Stockists' = 'Doctors'): PlannedEntity[] => {
    try {
      const parsed = typeof str === 'string' ? JSON.parse(str || '[]') : str;
      if (!Array.isArray(parsed)) return [];
      const masterList = type === 'Doctors' ? doctors : type === 'Chemists' ? chemists : stockists;
      return parsed.map((item: any) => {
        const id = typeof item === 'string' ? item : (item.id || item._id);
        const m = masterList.find((l: any) => (l._id || l.id) === id);
        const rawName = typeof item === 'object' ? (item.name || item.doctorName || item.chemistName || item.stockistName || '') : '';
        const isNameAnId = !rawName || rawName === id || (rawName.length > 15 && !rawName.includes(' ') && /^[a-z0-9]+$/i.test(rawName));
        const resolvedName = (m ? (m.name || m.businessName || m.doctorName || m.chemistName || m.stockistName) : null) ||
                             (!isNameAnId ? rawName : null) ||
                             (String(id).startsWith('slot_open_') ? '(Open Slot - Pending Doctor Addition)' : id);
        const resolvedInfo = (m ? (m.workingArea || m.hospital || m.headquarter || m.hq || m.address) : null) ||
                             (typeof item === 'object' && item.info && item.info !== 'Imported' ? item.info : null) ||
                             (typeof item === 'object' && (item.workingArea || item.hospital || item.headquarter || item.hq)) ||
                             '';
        return {
          id,
          name: resolvedName,
          info: resolvedInfo,
          samples: (typeof item === 'object' && item.samples) ? item.samples : [],
          gifts: (typeof item === 'object' && item.gifts) ? item.gifts : []
        };
      });
    } catch(e) { return []; }
  };

  const loadPlanIntoState = (p: any) => {
    if (!p) { setPlannedDocs([]); setPlannedChems([]); setPlannedStocks([]); return; }
    setPlannedDocs(safeParse(p.doctors, 'Doctors'));
    setPlannedChems(safeParse(p.chemists, 'Chemists'));
    setPlannedStocks(safeParse(p.stockists, 'Stockists'));
  };

  const planningStats = useMemo(() => {
    const isSuperCore = (d: any) => (d.category || '').toLowerCase().includes('super');
    const isCore = (d: any) => {
      const c = (d.category || '').toLowerCase();
      return c.includes('core') && !c.includes('super') && !c.includes('non');
    };
    const isNonCore = (d: any) => !isSuperCore(d) && !isCore(d);

    const superCoreDocs = doctors.filter(isSuperCore);
    const coreDocs = doctors.filter(isCore);
    const nonCoreDocs = doctors.filter(isNonCore);

    const plannedDocIds = new Set<string>();
    const docCallsCount: Record<string, number> = {};
    let totalPlannedCalls = 0;

    (monthlyPlans || []).forEach(p => {
      let pDocs: any[] = [];
      try {
        pDocs = typeof p.doctors === 'string' ? JSON.parse(p.doctors || '[]') : (p.doctors || []);
      } catch(e) {}
      if (!Array.isArray(pDocs)) pDocs = Object.values(pDocs || {});
      pDocs.forEach(item => {
        const id = typeof item === 'string' ? item : (item.id || item._id);
        if (id && !String(id).startsWith('slot_open_')) {
          plannedDocIds.add(id);
          docCallsCount[id] = (docCallsCount[id] || 0) + 1;
          totalPlannedCalls++;
        }
      });
    });

    const plannedSuperCore = superCoreDocs.filter(d => plannedDocIds.has(d._id || d.id)).length;
    const superCoreCalls = superCoreDocs.reduce((acc, d) => acc + (docCallsCount[d._id || d.id] || 0), 0);

    const plannedCore = coreDocs.filter(d => plannedDocIds.has(d._id || d.id)).length;
    const coreCalls = coreDocs.reduce((acc, d) => acc + (docCallsCount[d._id || d.id] || 0), 0);

    const plannedNonCore = nonCoreDocs.filter(d => plannedDocIds.has(d._id || d.id)).length;
    const nonCoreCalls = nonCoreDocs.reduce((acc, d) => acc + (docCallsCount[d._id || d.id] || 0), 0);

    const missedDoctors = doctors.filter(d => !plannedDocIds.has(d._id || d.id));
    const missedCount = missedDoctors.length;

    const totalDoctorsCount = doctors.length;
    const coveragePct = totalDoctorsCount > 0 ? Math.round((plannedDocIds.size / totalDoctorsCount) * 100) : 0;
    const targetCalls = (superCoreDocs.length * 3) + (coreDocs.length * 2) + (nonCoreDocs.length * 1);

    return {
      totSuperCore: superCoreDocs.length,
      plannedSuperCore,
      superCoreCalls,
      totCore: coreDocs.length,
      plannedCore,
      coreCalls,
      totNonCore: nonCoreDocs.length,
      plannedNonCore,
      nonCoreCalls,
      missedDoctors,
      missedCount,
      totalDoctorsCount,
      uniquePlannedCount: plannedDocIds.size,
      coveragePct,
      totalPlannedCalls,
      targetCalls
    };
  }, [doctors, monthlyPlans]);

  const openSinglePlan = (day: number) => {
    if (isSunday(day)) return;
    setPlanDates([day]);
    loadPlanIntoState(getPlanForDay(day));
    setShowPlanModal(true);
  };

  const openMultiPlan = () => {
    if (selectedDates.size === 0) return;
    const dates = Array.from(selectedDates);
    setPlanDates(dates);
    loadPlanIntoState(getPlanForDay(dates[0]));
    setShowPlanModal(true);
  };

  const toggleMultiSelect = (day: number) => {
    if (isSunday(day)) return;
    const ns = new Set(selectedDates);
    if (ns.has(day)) ns.delete(day); else ns.add(day);
    setSelectedDates(ns);
  };

  const clearDayPlan = () => {
    if (window.confirm('Clear all planned DCS for this day?')) {
      setPlannedDocs([]); setPlannedChems([]); setPlannedStocks([]);
    }
  };

  const openEntitySelector = () => {
    const current = activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks;
    setSelectedEntityIds(new Set(current.map(e => e.id)));
    setEntitySearch('');
    setShowEntityModal(true);
  };

  const confirmEntitySelection = () => {
    const list = activeTab === 'Doctors' ? doctors : activeTab === 'Chemists' ? chemists : stockists;
    const current = activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks;
    const newEntities = Array.from(selectedEntityIds).map(id => {
      const existing = current.find(e => e.id === id);
      const item = (list.find((l: any) => (l._id || l.id) === id) || {}) as any;
      const realName = item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName || (existing ? existing.name : id);
      const realInfo = item.workingArea || item.hospital || item.headquarter || item.hq || item.address || (existing ? existing.info : '');
      if (existing) {
        return {
          ...existing,
          name: realName,
          info: realInfo
        };
      }
      return {
        id,
        name: realName,
        info: realInfo,
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
    setSaving(true);
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
        alert('Call Plan saved successfully!');
        setShowPlanModal(false);
        setIsMultiMode(false);
        setSelectedDates(new Set());
        fetchMonthlyPlans();
      } else {
        alert(res.data.message || 'Could not save. Ensure your Tour Program is approved for this month.');
      }
    } catch (e) {
      alert('Failed to save call plan. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-full bg-[#1c1c2e] text-white font-sans pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-[#1c1c2e] shadow-md border-b border-[#3b3b5a] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-[#27273f] active:bg-[#3b3b5a]">
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
          <div onClick={() => setShowSubordinateModal(true)} className="bg-emerald-900/40 border border-emerald-500/50 p-3 rounded-lg mb-4 flex items-center gap-3 cursor-pointer">
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

        {/* Planning Analytics Dashboard Bar */}
        <div className="bg-[#24243a] border border-[#3b3b5a] rounded-xl p-3.5 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#3b3b5a]/60">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Monthly Call Plan Analytics
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {planningStats.totalPlannedCalls} Total Calls Planned
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Super Core */}
            <div className="bg-[#1c1c2e] p-2.5 rounded-lg border border-purple-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-300 uppercase">Tot S.Core / Plan</span>
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              </div>
              <div className="mt-1.5">
                <p className="text-base font-extrabold text-white leading-none">
                  {planningStats.plannedSuperCore} <span className="text-xs font-normal text-slate-400">/ {planningStats.totSuperCore}</span>
                </p>
                <p className="text-[10px] text-purple-300/80 mt-1">
                  {planningStats.superCoreCalls} calls (3x target)
                </p>
              </div>
            </div>

            {/* Core */}
            <div className="bg-[#1c1c2e] p-2.5 rounded-lg border border-sky-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-300 uppercase">Tot Core / Plan</span>
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              </div>
              <div className="mt-1.5">
                <p className="text-base font-extrabold text-white leading-none">
                  {planningStats.plannedCore} <span className="text-xs font-normal text-slate-400">/ {planningStats.totCore}</span>
                </p>
                <p className="text-[10px] text-sky-300/80 mt-1">
                  {planningStats.coreCalls} calls (2x target)
                </p>
              </div>
            </div>

            {/* Non-Core */}
            <div className="bg-[#1c1c2e] p-2.5 rounded-lg border border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Tot N.Core / Plan</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="mt-1.5">
                <p className="text-base font-extrabold text-white leading-none">
                  {planningStats.plannedNonCore} <span className="text-xs font-normal text-slate-400">/ {planningStats.totNonCore}</span>
                </p>
                <p className="text-[10px] text-emerald-300/80 mt-1">
                  {planningStats.nonCoreCalls} calls (1x target)
                </p>
              </div>
            </div>

            {/* Missed Doctors */}
            <div 
              onClick={() => setShowMissedModal(true)}
              className="bg-[#1c1c2e] p-2.5 rounded-lg border border-rose-500/40 hover:border-rose-400 flex flex-col justify-between cursor-pointer transition-all active:scale-95 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
                  Miss. Nos <span className="underline decoration-dotted text-[9px] text-rose-400">(View)</span>
                </span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-1.5">
                <p className="text-base font-extrabold text-rose-400 leading-none">
                  {planningStats.missedCount} <span className="text-xs font-normal text-slate-400">Drs</span>
                </p>
                <p className="text-[10px] text-rose-300/80 mt-1">
                  {planningStats.missedCount === 0 ? 'All doctors planned!' : 'Tap to see missed list'}
                </p>
              </div>
            </div>

            {/* Coverage % */}
            <div className="col-span-2 sm:col-span-1 bg-[#1c1c2e] p-2.5 rounded-lg border border-amber-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase">Coverage %</span>
                <span className={`w-2 h-2 rounded-full ${planningStats.coveragePct >= 90 ? 'bg-emerald-400' : planningStats.coveragePct >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
              </div>
              <div className="mt-1.5">
                <p className={`text-base font-extrabold leading-none ${planningStats.coveragePct >= 90 ? 'text-emerald-400' : planningStats.coveragePct >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {planningStats.coveragePct}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {planningStats.uniquePlannedCount}/{planningStats.totalDoctorsCount} Drs planned
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-10 font-bold">Loading plans...</p>
        ) : (
          <div className="space-y-2">
            {daysArray.map(day => {
              const plan = getPlanForDay(day);
              let pDocs: any[] = [], pChems: any[] = [], pStocks: any[] = [];
              if (plan) {
                try { pDocs = JSON.parse(plan.doctors||'[]'); } catch(e){}
                try { pChems = JSON.parse(plan.chemists||'[]'); } catch(e){}
                try { pStocks = JSON.parse(plan.stockists||'[]'); } catch(e){}
              }
              const dateStr = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
              const isHolidayDate = !!holidays[dateStr];
              const isHol = isSunday(day) || isHolidayDate;
              const isPlanned = !!plan && (pDocs.length > 0 || pChems.length > 0 || pStocks.length > 0);

              return (
                <div
                  key={day}
                  onClick={() => isHol ? null : (isMultiMode ? toggleMultiSelect(day) : openSinglePlan(day))}
                  className={`flex items-center rounded-lg overflow-hidden border ${isMultiMode && selectedDates.has(day) ? 'border-sky-500 bg-sky-900/20' : 'border-[#3b3b5a] bg-[#27273f]'} transition-colors`}
                >
                  <div className={`w-14 h-16 shrink-0 flex flex-col items-center justify-center ${isHol ? 'bg-slate-700/50' : isPlanned ? 'bg-emerald-600' : 'bg-[#1e88e5]'}`}>
                    <span className="text-xl font-bold leading-none text-white opacity-90">{day}</span>
                    <span className="text-[9px] font-bold uppercase text-white opacity-75 mt-0.5">
                      {new Date(parseInt(year), parseInt(month)-1, day).toLocaleString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 p-4 flex justify-between items-center cursor-pointer">
                    {isHol ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-rose-500 uppercase tracking-wider">{isHolidayDate ? 'HOLIDAY' : 'Sunday'}</span>
                        {isHolidayDate && <span className="text-xs font-medium text-slate-500 truncate">{holidays[dateStr]}</span>}
                      </div>
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
                        {isMultiMode ? (
                          <div className="w-6 h-6 rounded border border-sky-400 flex items-center justify-center">
                            {selectedDates.has(day) && <Check className="w-4 h-4 text-sky-400" />}
                          </div>
                        ) : (
                          !plan && <Plus className="w-5 h-5 text-emerald-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multiple CPs button - Fixed bottom */}
      {!loading && (
        <div 
          className="fixed right-4 sm:right-auto sm:left-1/2 sm:ml-[110px] z-50 flex gap-2"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)' }}
        >
          {!isMultiMode ? (
            <button onClick={() => setIsMultiMode(true)} className="bg-sky-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Multiple CPs
            </button>
          ) : (
            <>
              <button onClick={() => { setIsMultiMode(false); setSelectedDates(new Set()); }} className="bg-slate-700 text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
                <X className="w-5 h-5" /> Cancel
              </button>
              <button onClick={openMultiPlan} disabled={selectedDates.size === 0} className="bg-sky-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2 disabled:opacity-50">
                <Check className="w-5 h-5" /> Add {selectedDates.size} CPs
              </button>
            </>
          )}
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 w-full max-w-md mx-auto z-[60] bg-[#1c1c2e] flex flex-col sm:shadow-2xl sm:border-x sm:border-[#3b3b5a]">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center gap-3">
            <button onClick={() => setShowPlanModal(false)}><ChevronLeft className="w-6 h-6 text-sky-400" /></button>
            <div>
              <h1 className="font-bold text-lg text-white">Plan Calls</h1>
              {planDates.length > 1
                ? <p className="text-xs text-sky-400">Creating Call Plans for {planDates.length} dates</p>
                : <p className="text-xs text-sky-400">Call plans for {year}-{month}-{planDates[0]?.toString().padStart(2,'0')}</p>
              }
            </div>
          </div>

          <div className="flex border-b border-[#3b3b5a]">
            {(['Doctors', 'Chemists', 'Stockists'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400'}`}>
                {t} ({(t==='Doctors'?plannedDocs:t==='Chemists'?plannedChems:plannedStocks).length})
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <button onClick={openEntitySelector} className="flex items-center gap-2 text-sky-400 font-bold active:scale-95 transition-transform">
                <Plus className="w-5 h-5" /> Add {activeTab}
              </button>
              <button onClick={clearDayPlan} className="flex items-center gap-2 text-red-500 font-bold active:scale-95 px-3 py-1 bg-red-500/10 rounded-lg">
                <Trash2 className="w-4 h-4" /> Clear Day
              </button>
            </div>
            {(activeTab === 'Doctors' ? plannedDocs : activeTab === 'Chemists' ? plannedChems : plannedStocks).map(e => (
              <div key={e.id} className="bg-[#27273f] rounded-lg border border-[#3b3b5a] p-4">
                <h3 className="font-bold text-white text-sm">{e.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{e.info}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            {/* Uses saving state - prevents save button disabling on calendar load */}
            <button onClick={handleSavePlan} disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50">
              {saving ? 'Saving...' : 'SAVE & SUBMIT FOR APPROVAL'}
            </button>
          </div>
        </div>
      )}

      {/* Entity Selector Modal */}
      {showEntityModal && (
        <div className="fixed inset-0 w-full max-w-md mx-auto z-[70] bg-[#1c1c2e] flex flex-col sm:shadow-2xl sm:border-x sm:border-[#3b3b5a]">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Select {activeTab}</h2>
            <button onClick={() => setShowEntityModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="p-4 border-b border-[#3b3b5a]">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder={`Search for ${activeTab}`} value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
                className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {(activeTab === 'Doctors' ? doctors : activeTab === 'Chemists' ? chemists : stockists)
              .filter((item: any) => {
                const name = (item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName || '').toLowerCase();
                return name.includes(entitySearch.toLowerCase());
              })
              .map((item: any) => {
                const id = item._id || item.id;
                return (
                  <div key={id} onClick={() => {
                    const ns = new Set(selectedEntityIds);
                    if (ns.has(id)) ns.delete(id); else ns.add(id);
                    setSelectedEntityIds(ns);
                  }} className="flex items-center gap-3 bg-[#27273f] p-3 rounded-lg border border-[#3b3b5a] cursor-pointer">
                    <input type="checkbox" checked={selectedEntityIds.has(id)} readOnly className="w-5 h-5 rounded accent-emerald-500" />
                    <div>
                      <p className="font-bold text-white text-sm">{item.name || item.businessName || item.doctorName || item.chemistName || item.stockistName}</p>
                      <p className="text-xs text-slate-400">{item.headquarter || item.hq || item.address}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            <button onClick={confirmEntitySelection} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg">
              Confirm Selection ({selectedEntityIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Missed Doctors Modal */}
      {showMissedModal && (
        <div className="fixed inset-0 w-full max-w-md mx-auto z-[85] bg-[#1c1c2e] flex flex-col sm:shadow-2xl sm:border-x sm:border-[#3b3b5a]">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <div>
                <h2 className="font-bold text-base text-white">Missed Doctors ({planningStats.missedCount})</h2>
                <p className="text-xs text-slate-400">Allotted doctors not yet planned in this month</p>
              </div>
            </div>
            <button onClick={() => setShowMissedModal(false)} className="w-8 h-8 rounded-lg bg-[#27273f] flex items-center justify-center">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Search & Filter pills */}
          <div className="p-3 border-b border-[#3b3b5a] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search missed doctors or areas..."
                value={missedSearch}
                onChange={e => setMissedSearch(e.target.value)}
                className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['All', 'Super Core', 'Core', 'Non-Core'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setMissedFilterCat(cat)}
                  className={`px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0 transition-colors ${
                    missedFilterCat === cat 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-[#27273f] text-slate-300 border border-[#3b3b5a]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Missed Doctors */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {planningStats.missedDoctors
              .filter(d => {
                const name = (d.name || d.doctorName || '').toLowerCase();
                const area = (d.workingArea || d.hospital || '').toLowerCase();
                const q = missedSearch.toLowerCase();
                const matchSearch = !q || name.includes(q) || area.includes(q);

                const c = (d.category || '').toLowerCase();
                const isSC = c.includes('super');
                const isC = c.includes('core') && !isSC && !c.includes('non');
                const isNC = !isSC && !isC;

                const matchCat = missedFilterCat === 'All' 
                  ? true 
                  : missedFilterCat === 'Super Core' 
                    ? isSC 
                    : missedFilterCat === 'Core' 
                      ? isC 
                      : isNC;

                return matchSearch && matchCat;
              })
              .map(doc => {
                const id = doc._id || doc.id;
                const c = (doc.category || '').toLowerCase();
                const isSC = c.includes('super');
                const isC = c.includes('core') && !isSC && !c.includes('non');

                return (
                  <div key={id} className="bg-[#27273f] border border-[#3b3b5a] rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{doc.name || doc.doctorName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{doc.workingArea || doc.hospital || doc.headquarter || '-'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        isSC 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                          : isC 
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {doc.category || 'General'}
                      </span>
                    </div>
                    {doc.visitDays && (
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="font-bold text-slate-300">Visit Days:</span>
                        <span className="text-amber-300">{doc.visitDays}</span>
                      </div>
                    )}
                  </div>
                );
              })}

            {planningStats.missedDoctors.length === 0 && (
              <div className="text-center py-12">
                <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Congratulations!</p>
                <p className="text-xs text-slate-400 mt-1">All doctors from your master list have been planned for this month.</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#3b3b5a] bg-[#1c1c2e]">
            <button
              onClick={() => setShowMissedModal(false)}
              className="w-full bg-[#27273f] hover:bg-[#3b3b5a] text-white font-bold py-2.5 rounded-lg text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Subordinate Selector Modal */}
      {showSubordinateModal && (
        <div className="fixed inset-0 w-full max-w-md mx-auto z-[80] bg-[#1c1c2e] flex flex-col sm:shadow-2xl sm:border-x sm:border-[#3b3b5a]">
          <div className="p-4 border-b border-[#3b3b5a] flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Select User to Plan For</h2>
            <button onClick={() => setShowSubordinateModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <button onClick={() => { setActiveUser(loggedInUser); setShowSubordinateModal(false); }}
              className="w-full text-left bg-[#27273f] p-4 rounded-lg font-bold text-emerald-400 border border-emerald-500/30">
              Myself ({loggedInUser?.firstName} {loggedInUser?.lastName})
            </button>
            {subordinates.map(sub => (
              <button key={sub.employeeId} onClick={() => { setActiveUser(sub); setShowSubordinateModal(false); }}
                className="w-full text-left bg-[#27273f] p-4 rounded-lg font-bold text-white border border-[#3b3b5a]">
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

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red', background: '#fff'}}><h1>Runtime Crash:</h1><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

export default function SafeCallPlan() {
  return <ErrorBoundary><CallPlan /></ErrorBoundary>;
}
