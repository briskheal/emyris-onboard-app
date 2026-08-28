import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check } from 'lucide-react';

export default function TourProgram({ showToast }: { showToast: (msg: string) => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const [month, setMonth] = useState(monthNames[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [markets, setMarkets] = useState<any[]>([]);
  
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
      const res = await axios.get('/api/admin/locations/cities');
      if (res.data.success) {
        setMarkets(res.data.cities || []);
      }
    } catch (e) {
      console.error('Failed to fetch markets', e);
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
          const parsed = JSON.parse(tp.entries || '[]');
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

  const saveTP = async () => {
    setSaving(true);
    try {
      const entriesArr = Object.entries(entries).map(([date, val]) => {
        return { date, type: val.type || val.areaType, toMarket: val.toMarket };
      });
      const res = await axios.post('/api/xl/tour-program', {
        employeeId: user?.employeeId, 
        employeeName: user ? `${user.firstName} ${user.lastName}` : '',
        hq: user?.hq || '', 
        month, 
        year, 
        entries: entriesArr
      });
      setTpId(res.data.data._id);
      showToast('Tour Program saved!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const submitTP = async () => {
    if (!tpId) { showToast('Save the TP first before submitting.'); return; }
    if (Object.keys(entries).length === 0) { showToast('Please plan at least one day.'); return; }
    setSubmitting(true);
    try {
      await saveTP();
      await axios.put(`/api/xl/tour-program/${tpId}/submit`);
      setTpStatus('Submitted');
      showToast('Tour Program submitted for approval!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
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

  const applyForm = () => {
    if ((formArea === 'Ex Mkt' || formArea === 'Out Mkt') && !formLocation) {
      showToast('Please select a location');
      return;
    }
    
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
    setShowForm(false);
    setSelectionMode(false);
    setSelectedDates([]);
    showToast('Plan added locally. Remember to Save/Submit!');
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'HQ': return <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/30">LOC</span>;
      case 'Ex Mkt': return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded border border-orange-500/30">EX</span>;
      case 'Out Mkt': return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded border border-green-500/30">OUT</span>;
      default: return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded border border-purple-500/30">{type.substring(0,3).toUpperCase()}</span>;
    }
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col font-sans">
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
        <div className="p-4 flex flex-col gap-5 overflow-y-auto pb-24">
          <div className="text-xl font-semibold text-white mb-2 border-b border-slate-700 pb-2">Tour Program</div>

          {/* Activity Type */}
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block font-medium">Activity Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={formActivity} 
                onChange={e => setFormActivity(e.target.value)} 
                className="w-full bg-slate-800 text-slate-100 p-3.5 rounded-lg border border-slate-700 appearance-none outline-none focus:border-sky-500"
              >
                <option value="Working">Working</option>
                <option value="Training">Training</option>
                <option value="Seminar">Seminar</option>
                <option value="Transit">Transit</option>
                <option value="Meeting">Meeting</option>
                <option value="Camp">Camp</option>
                <option value="Conference">Conference</option>
                <option value="Half Day (Meeting)">Half Day (Meeting)</option>
                <option value="Half Day (Field Work)">Half Day (Field Work)</option>
                <option value="Admin">Admin</option>
                <option value="Market Survey">Market Survey</option>
              </select>
            </div>
          </div>

          {/* Area Type */}
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block font-medium">Area Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={formArea} 
                onChange={e => setFormArea(e.target.value)} 
                className="w-full bg-slate-800 text-slate-100 p-3.5 rounded-lg border border-slate-700 appearance-none outline-none focus:border-sky-500"
              >
                <option value="HQ">HQ</option>
                <option value="Ex Mkt">Ex Mkt</option>
                <option value="Out Mkt">Out Mkt</option>
                <option value="Conf/Mtng">Conf/Mtng</option>
                <option value="Leave">Leave</option>
                <option value="Admin">Admin</option>
                <option value="Transit">Transit</option>
              </select>
            </div>
          </div>

          {/* Route / Location */}
          {(formArea === 'Ex Mkt' || formArea === 'Out Mkt') && (
            <div>
              <label className="text-slate-300 text-sm mb-1.5 block font-medium">Location <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={formLocation} 
                  onChange={e => setFormLocation(e.target.value)} 
                  className="w-full bg-slate-800 text-slate-100 p-3.5 rounded-lg border border-slate-700 appearance-none outline-none focus:border-sky-500"
                >
                  <option value="">Select Work Area</option>
                  {markets.map((m: any) => (
                    <option key={m.city} value={m.city}>{user?.hq ? `${user.hq} - ` : ''}{m.city}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Form Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_15px_rgba(0,0,0,0.5)]">
          <button 
            onClick={applyForm}
            className="w-full bg-teal-600 active:bg-teal-700 text-white py-3.5 rounded-lg font-bold text-lg shadow-lg"
          >
            Apply TP {formDates.length > 1 ? `for ${formDates.length} days` : ''}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#1e2335] pb-32 font-sans flex flex-col">
      {/* App Header */}
      <div className="px-4 py-4 bg-slate-900 flex items-center gap-3 shadow-md border-b border-slate-800 z-10 sticky top-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-300">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">Tour Program</h1>
          <p className="text-slate-400 text-xs">Submit proposed activities</p>
        </div>
        <div className="ml-auto text-xs font-semibold text-slate-300 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          {tpStatus}
        </div>
      </div>

      {/* Selectors */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex gap-3 shadow-sm sticky top-[65px] z-10">
        <div className="flex-1 relative">
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="w-full bg-[#1e2335] text-slate-200 p-2.5 rounded border border-slate-600 appearance-none text-sm font-medium outline-none focus:border-sky-500"
          >
            {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-[#1e2335] text-slate-200 p-2.5 rounded border border-slate-600 appearance-none text-sm font-medium outline-none focus:border-sky-500"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
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

          // Colors
          const boxBg = entry ? 'bg-green-600' : isSunday ? 'bg-slate-700' : 'bg-[#293047]';
          const boxText = entry ? 'text-white' : 'text-slate-300';
          
          return (
            <div 
              key={dateStr} 
              className="flex items-center gap-3 p-3 border-b border-slate-800 bg-[#1e2335] hover:bg-slate-800/50 transition-colors"
              onClick={() => {
                if (selectionMode && !isSunday) toggleSelection(dateStr);
              }}
            >
              {/* Date Box */}
              <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold shadow-sm ${boxBg} ${boxText}`}>
                <span className="text-[1.1rem] leading-none mb-0.5">{dayNum}</span>
                <span className="text-[9px] leading-none opacity-90 tracking-wide uppercase">{dayName}</span>
              </div>
              
              {/* Middle Content */}
              <div className="flex-1 overflow-hidden">
                {isSunday ? (
                  <span className="text-slate-500 font-medium text-sm">Not Allowed</span>
                ) : entry ? (
                  <div className="text-slate-200 text-[13px] font-medium leading-snug truncate">
                    {entry.toMarket ? `${user?.hq ? user.hq + ' - ' : ''}${entry.toMarket}` : entry.type}
                  </div>
                ) : (
                  <span 
                    className="text-slate-400 text-sm font-medium cursor-pointer" 
                    onClick={(e) => { if(!selectionMode) { e.stopPropagation(); openFormForDates([dateStr]); } }}
                  >
                    + Add Tour Program
                  </span>
                )}
              </div>

              {/* Right Action/Badge */}
              {selectionMode ? (
                !isSunday && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-sky-500 bg-sky-500/20' : 'border-slate-600'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full" />}
                  </div>
                )
              ) : (
                isSunday ? (
                  <div className="w-8 h-8 text-slate-600 flex items-center justify-center font-bold text-xl">+</div>
                ) : entry ? (
                  getBadge(entry.type)
                ) : (
                  <button 
                    className="w-8 h-8 text-slate-400 flex items-center justify-center font-bold text-2xl hover:text-white active:scale-90 transition-transform" 
                    onClick={() => openFormForDates([dateStr])}
                  >
                    +
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Multiple TPs Button */}
      {!selectionMode && (
        <button 
          onClick={() => setSelectionMode(true)} 
          className="fixed bottom-28 right-4 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 rounded-full font-bold shadow-[0_4px_12px_rgba(14,165,233,0.4)] flex items-center gap-2 z-20 transition-transform active:scale-95 text-sm tracking-wide"
        >
          <Plus size={16} strokeWidth={3} /> Multiple TPs
        </button>
      )}

      {/* Bottom Save/Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.5)] z-20">
        {selectionMode ? (
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
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={saveTP} 
              disabled={saving}
              className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-3.5 rounded-lg font-bold text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={submitTP} 
              disabled={submitting}
              className="flex-[2] bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white py-3.5 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              {submitting ? 'Submitting...' : 'Submit TP'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  );
}
