import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check } from 'lucide-react';


function SearchableSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: any[], placeholder?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative">
            <button 
               type="button"
               onClick={() => setIsOpen(!isOpen)}
               className="w-full text-left bg-[#27273f] text-sky-300 font-bold p-3.5 rounded-lg border border-[#3b3b5a] focus:border-sky-500 shadow-sm flex justify-between items-center"
            >
               <span className="truncate">{value || placeholder}</span>
               <span className="text-slate-400 text-xs">▼</span>
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-2xl z-[100] overflow-hidden">
                        {options.length > 8 && (
                            <div className="p-2 border-b border-[#3b3b5a] bg-[#1e2335]">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full bg-[#1c1c2e] text-white p-2 rounded-md border border-[#3b3b5a] outline-none text-sm placeholder:text-slate-500"
                                />
                            </div>
                        )}
                        <div className="max-h-[350px] overflow-y-auto">
                            {filtered.map((o, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => { onChange(o.value); setIsOpen(false); setSearch(''); }}
                                    className="p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0 cursor-pointer text-sm"
                                >
                                    {o.label}
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="p-4 text-center text-slate-400 text-sm font-medium">No results found</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


export default function TourProgram() {
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const [month, setMonth] = useState(monthNames[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear().toString());
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [routeList, setRouteList] = useState<any[]>([]);
  
  const [tpId, setTpId] = useState<string | null>(null);
  const [tpStatus, setTpStatus] = useState<string>('Draft');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [formDates, setFormDates] = useState<string[]>([]);
  const [formActivity, setFormActivity] = useState('Working');
  const [formArea, setFormArea] = useState('HQ');
  const [formLocation, setFormLocation] = useState('');

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('xl_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTP();
      fetchMarkets();
    }
  }, [month, year, user]);

  const fetchMarkets = async () => {
    try {
      const res = await axios.get(`/api/xl/routes?designation=${user?.designation || ''}&hq=${user?.hq || ''}`);
      if (res.data.success) {
        setRouteList(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch routes', e);
    }
  };

  const fetchTP = async () => {
    try {
      setEntries({});
      setTpId(null);
      setTpStatus('Draft');
      
      const res = await axios.get(`/api/xl/tour-program/my?email=${user.employeeId}&month=${month}&year=${year}`);
      if (res.data.success && res.data.data) {
        const tp = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
        if (!tp) return;
        setTpId(tp._id);
        setTpStatus(tp.status || 'Draft');
        const loadedEntries: Record<string, any> = {};
        try {
          let parsed = JSON.parse(tp.entries || '[]');
            if (!Array.isArray(parsed)) parsed = Object.values(parsed);
            parsed.forEach((e: any) => {
            if (e.date) loadedEntries[e.date] = e;
          });
        } catch(e){}
        setEntries(loadedEntries);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDaysInMonth = () => {
    const mIndex = monthNames.indexOf(month);
    const y = parseInt(year);
    const days = new Date(y, mIndex + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, mIndex, i + 1);
      const padM = (mIndex + 1).toString().padStart(2, '0');
      const padD = d.getDate().toString().padStart(2, '0');
      return `${y}-${padM}-${padD}`;
    });
  };

  const daysInMonth = getDaysInMonth();

  const toggleSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const openFormForDates = (dates: string[]) => {
    setFormDates(dates);
    setFormActivity('Working');
    setFormArea('HQ');
    setFormLocation('');
    setShowForm(true);
  };

  const applyForm = async () => {
      let resubmitRemark = '';
      if (tpStatus === 'Submitted' || tpStatus === 'Approved') {
        const r = window.prompt("You are modifying a submitted Tour Program. Please provide a reason/remark for this change:");
        if (r === null) return;
        resubmitRemark = r;
      }
    if (['Ex-Mkt', 'Out-Mkt', 'Out-Ex-Mkt', 'Out-Stn-Last-Day'].includes(formArea) && !formLocation) {
      showToast('Please select a location');
      return;
    }
    
    // 1. Update Local State
    const newEntries = { ...entries };
    formDates.forEach(d => {
      newEntries[d] = { 
        activityType: formActivity, 
        type: formArea, 
        areaType: formArea, 
        toMarket: formLocation 
      };
    });
    setEntries(newEntries);
    
    // 2. Auto-Save to DB
    setSaving(true);
    try {
      const entriesArr = Object.entries(newEntries).map(([date, val]) => {
        return { date, type: val.type || val.areaType, toMarket: val.toMarket };
      });
      const saveRes = await axios.post('/api/xl/tour-program', {
        employeeId: user?.employeeId, 
        employeeName: user ? `${user.firstName} ${user.lastName}` : '',
        hq: user?.hq || '', 
        month, 
        year, 
        entries: entriesArr
      });
      
      const newTpId = saveRes.data.data._id;
      setTpId(newTpId);
      
      // 3. Auto-Submit for Approval
      await axios.put(`/api/xl/tour-program/${newTpId}/submit`);
      setTpStatus('Submitted');
      
      setShowForm(false);
      setSelectionMode(false);
      setSelectedDates([]);
      showToast('Auto Approved! Tour Program Created Successfully');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save to database');
    } finally {
      setSaving(false);
    }
  };

  const getBadge = (type: string) => {
    if (!type) return null; switch (type) {
      case 'HQ': return <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/30">LOC</span>;
      case 'Ex Mkt': return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded border border-orange-500/30">EX</span>;
      case 'Out Mkt': return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded border border-green-500/30">OUT</span>;
      default: return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded border border-purple-500/30">{type.substring(0,3).toUpperCase()}</span>;
    }
  };

  if (showForm) {
    return (
      <div className="fixed inset-y-0 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 bg-slate-900 z-[100] flex flex-col font-sans">
        {/* Form Header */}
        <div className="flex items-center px-4 py-3 bg-slate-800 gap-3 border-b border-slate-700 shadow-md">
          <button onClick={() => setShowForm(false)} className="text-slate-300 hover:text-white">
            <ChevronLeft size={24}/>
          </button>
          <div>
            <div className="text-white font-bold text-lg">
              {formDates.length === 1 ? formDates[0] : `Creating Tour Programs for ${formDates.length} dates`}
            </div>
            <div className="text-sky-400 text-xs">Tap to view all dates</div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 flex flex-col gap-5 overflow-y-auto pb-[140px] relative z-[60]">
          <div className="text-xl font-semibold text-white mb-2 border-b border-slate-700 pb-2">Tour Program</div>

          {/* Activity Type */}
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block font-medium">Activity Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <SearchableSelect 
                  value={formActivity}
                  onChange={val => setFormActivity(val)}
                  options={[
                    {value: 'Working', label: 'Working'},
                    {value: 'Half Day', label: 'Half Day'},
                    {value: 'Training', label: 'Training'},
                    {value: 'Seminar', label: 'Seminar'},
                    {value: 'Transit', label: 'Transit'},
                    {value: 'Meeting', label: 'Meeting'},
                    {value: 'Conference', label: 'Conference'},
                    {value: 'Half Day (Meeting)', label: 'Half Day (Meeting)'},
                    {value: 'Half Day (Field Work)', label: 'Half Day (Field Work)'},
                    {value: 'Admin', label: 'Admin'},
                    {value: 'Market Survey', label: 'Market Survey'},
                    {value: 'Leave', label: 'Leave'}
                  ]}
                />
            </div>
          </div>

          {/* Area Type */}
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block font-medium">Area Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <SearchableSelect 
                  value={formArea}
                  onChange={val => { setFormArea(val); setFormLocation(''); }}
                  options={[
                    {value: 'HQ', label: 'HQ'},
                    {value: 'Ex-Mkt', label: 'Ex-Mkt'},
                    {value: 'Out-Mkt', label: 'Out-Mkt'},
                    {value: 'Out-Ex-Mkt', label: 'Out-Ex-Mkt'},
                    {value: 'Out-Stn-Last-Day', label: 'Out-Stn-Last-Day'}
                  ]}
                />
            </div>
          </div>

          {/* Route / Location */}
          {/* Route / Location */}
            <div>
      <label className="text-slate-300 text-sm mb-1.5 block font-medium">Route / Location <span className="text-red-500">*</span></label>
      <div className="relative">
        {(() => {
            const filteredRoutes = routeList ? routeList.filter((r: any) => {
                  const at = formArea;
                  let expectedType = '';
                  if (at === 'HQ') expectedType = 'Local';
                  else if (at === 'Ex-Mkt' || at === 'Out-Ex-Mkt') expectedType = 'Ex-Station';
                  else if (at === 'Out-Mkt' || at === 'Out-Stn-Last-Day') expectedType = 'Out-Station';
                  
                  if (!expectedType) return true;
                  return r.areaType === expectedType;
            }).map((r: any) => ({
                value: `${r.fromCity} - ${r.toCity}`,
                label: `${r.fromCity} - ${r.toCity}`
            })) : [];

            return (
                <SearchableSelect 
                  value={formLocation}
                  onChange={val => setFormLocation(val)}
                  placeholder="Select Route"
                  options={filteredRoutes}
                />
            );
          })()}
        </div>
      </div>
          </div>
  
          {/* Form Footer */}
        <div className="fixed bottom-0 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_15px_rgba(0,0,0,0.5)] z-[50]">
          <button 
            onClick={applyForm}
            className="w-full bg-teal-600 active:bg-teal-700 text-white py-3.5 rounded-lg font-bold text-lg shadow-lg"
          >
            Save & Submit for Approval
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#1e2335] pb-32 font-sans flex flex-col">
      {/* App Header Removed */}

      {/* Selectors */}
      <div className="px-2 py-1.5 bg-slate-800 border-b border-slate-700 flex items-center gap-2 shadow-sm sticky top-0 z-10">
        <div className="text-[10px] font-bold text-slate-300 flex flex-col justify-center items-center px-2">
           <span className="text-orange-400">{tpStatus}</span>
        </div>
        <div className="flex-1 relative">
            <button onClick={() => {setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false)}} className="w-full text-left bg-[#27273f] border border-[#3b3b5a] rounded-lg p-2 text-sky-300 font-bold flex justify-between items-center text-sm shadow-sm">
              <span>{month}</span>
              <span className="text-slate-400">v</span>
            </button>
            {showMonthDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {monthNames.map(m => (
                  <button key={m} onClick={() => { setMonth(m); setShowMonthDropdown(false); }} className="w-full text-left p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0 text-sm">
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <button onClick={() => {setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false)}} className="w-full text-left bg-[#27273f] border border-[#3b3b5a] rounded-lg p-2 text-sky-300 font-bold flex justify-between items-center text-sm shadow-sm">
              <span>{year}</span>
              <span className="text-slate-400">v</span>
            </button>
            {showYearDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {['2025','2026','2027','2028'].map(y => (
                  <button key={y} onClick={() => { setYear(y); setShowYearDropdown(false); }} className="w-full text-left p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0 text-sm">
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
      </div>
      
      <div className="px-4 py-2 bg-green-500/10 text-green-400 text-center text-sm font-medium border-b border-green-500/20 flex items-center justify-center gap-2">
        <UserIcon /> Add Tour Program for another user
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col">
        {daysInMonth.map((dateStr) => {
          const d = new Date(dateStr);
          const dayNum = d.getDate();
          const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
          const isSunday = d.getDay() === 0;
          const entry = entries[dateStr];
          const isSelected = selectedDates.includes(dateStr);
          
          return (
            <div 
              key={dateStr} 
              className={`flex ${isSunday ? 'opacity-50' : ''} border-b border-[#3b3b5a] bg-[#1e2335]`}
              onClick={() => {
                  if (selectionMode && !isSunday) toggleSelection(dateStr);
                  else if (!selectionMode && !isSunday) {
                    if (entry) {
                      setFormActivity(entry.activityType || entry.type || 'Working');
                      setFormArea(entry.areaType || entry.type || 'HQ');
                      setFormLocation(entry.toMarket || '');
                      setFormDates([dateStr]);
                      setShowForm(true);
                    } else {
                      openFormForDates([dateStr]);
                    }
                  }
                }}
            >
              {/* Date Box */}
              <div className={`w-16 flex flex-col items-center justify-center p-2 border-r border-[#3b3b5a] ${isSunday ? 'bg-[#1c1c2e]' : 'bg-[#27273f]'}`}>
                <span className="text-xl font-bold text-white">{dayNum.toString().padStart(2, '0')}</span>
                <span className="text-xs text-sky-400 font-bold uppercase">{dayName}</span>
              </div>
              
              {/* Middle Content */}
              <div className="flex-1 p-4 flex justify-between items-center cursor-pointer">
                <div className="flex-1 overflow-hidden pr-2">
                  {isSunday ? (
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Not Allowed</span>
                  ) : entry ? (
                    <div className="text-sm font-bold text-slate-200 leading-snug truncate">
                      {entry.toMarket ? entry.toMarket : entry.type}
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">
                      + Add Tour Program
                    </span>
                  )}
                </div>

                {/* Right Action/Badge */}
                {selectionMode ? (
                  !isSunday && (
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-sky-500 bg-sky-500/20' : 'border-[#3b3b5a]'}`}>
                      {isSelected && <div className="w-3 h-3 bg-sky-500 rounded-sm" />}
                    </div>
                  )
                ) : (
                  !isSunday && entry ? (
                    getBadge(entry.type)
                  ) : !isSunday ? (
                    <span className="w-6 h-6 text-emerald-500 flex items-center justify-center font-bold text-xl">+</span>
                  ) : null
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Multiple TPs Button */}
      {!selectionMode && (
        <button 
          onClick={() => setSelectionMode(true)} 
          className="fixed bottom-[90px] right-4 sm:right-auto sm:left-1/2 sm:ml-[100px] bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2 z-20 active:scale-95 text-sm"
        >
          <Plus size={16} strokeWidth={3} /> Multiple TPs
        </button>
      )}

      {/* Bottom Save/Submit Bar */}
      {selectionMode && (
        <div className="fixed bottom-[75px] w-full max-w-md mx-auto left-1/2 -translate-x-1/2 bg-slate-900 border-t border-slate-800 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.5)] z-40">
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-red-500/20 text-red-400 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
              onClick={() => { setSelectionMode(false); setSelectedDates([]); }}
            >
              X Clear ({selectedDates.length})
            </button>
            <button 
              className={`flex-[2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${selectedDates.length > 0 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}
              onClick={() => { if(selectedDates.length > 0) openFormForDates(selectedDates); }}
            >
              <Plus size={18} strokeWidth={3} /> Add {selectedDates.length} TPs
            </button>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-32 left-4 right-4 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm font-bold text-white text-center z-[150] shadow-2xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  );
}
