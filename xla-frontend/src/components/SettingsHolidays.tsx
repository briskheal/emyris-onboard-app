import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trash2, CheckSquare, ChevronDown, X } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function SettingsHolidays() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [type, setType] = useState('National');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState('');
  const [adding, setAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchHolidays(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get('/api/xl/settings/holidays');
      if (res.data.success) setHolidays(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleState = (s: string) => {
    setSelectedStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleAddHoliday = async () => {
    setFormError('');
    if (!title || !date) { setFormError('Please fill in Title and Date.'); return; }
    if (type === 'State' && selectedStates.length === 0) { setFormError('Please select at least one State.'); return; }
    setAdding(true);
    try {
      if (type === 'National') {
        const res = await axios.post('/api/xl/settings/holidays', { type, state: null, date, title });
        if (res.data.success) setHolidays(prev => [...prev, res.data.data]);
      } else {
        // Create one row per selected state
        const results = await Promise.all(
          selectedStates.map(s => axios.post('/api/xl/settings/holidays', { type, state: s, date, title }))
        );
        const newHolidays = results.filter(r => r.data.success).map(r => r.data.data);
        setHolidays(prev => [...prev, ...newHolidays]);
      }
      setTitle(''); setDate(''); setSelectedStates(''.split(''));
      setSelectedStates([]);
    } catch (e) {
      setFormError('Failed to add holiday. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/xl/settings/holidays/${id}`);
      setHolidays(prev => prev.filter(h => h._id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e) { console.error(e); }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => axios.delete(`/api/xl/settings/holidays/${id}`)));
      setHolidays(prev => prev.filter(h => !selected.has(h._id)));
      setSelected(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const allSelected = holidays.length > 0 && selected.size === holidays.length;
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(holidays.map(h => h._id)));
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const renderDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const downloadHolidays = () => {
    if (holidays.length === 0) return;

    // Group by date + title to create one row per holiday with multiple state columns
    const grouped: Record<string, { date: string; title: string; type: string; states: string[] }> = {};
    holidays.forEach(h => {
      const key = `${h.date}__${h.title}`;
      if (!grouped[key]) {
        grouped[key] = { date: h.date, title: h.title, type: h.type, states: [] };
      }
      if (h.state && h.state !== 'N/A') {
        grouped[key].states.push(h.state);
      }
    });

    // Find max number of states across all rows
    const maxStates = Math.max(...Object.values(grouped).map(g => g.states.length), 1);

    // Build header row
    const stateHeaders = Array.from({ length: maxStates }, (_, i) => `State ${i + 1}`);
    const headers = ['Date', 'Holiday Name', 'Type', ...stateHeaders];

    // Build data rows
    const rows = Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(g => {
        const dateStr = new Date(g.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const stateColumns = Array.from({ length: maxStates }, (_, i) => g.states[i] || '');
        return [dateStr, g.title, g.type, ...stateColumns];
      });

    // Build worksheet using xlsx
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 12 },
        ...Array(maxStates).fill({ wch: 20 })
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Holiday List');
      XLSX.writeFile(wb, 'Holiday_List_2026.xlsx');
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Holidays...</div>;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-6 shrink-0">
        <h2 className="text-xl font-black text-white uppercase tracking-wide">CREATE HOLIDAYS</h2>
        {holidays.length > 0 && (
          <button
            onClick={downloadHolidays}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            ↓ Download Excel
          </button>
        )}
      </div>


      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
        <div>
          <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">HOLIDAY TYPE *</label>
          <select value={type} onChange={e => { setType(e.target.value); setSelectedStates([]); }} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
            <option value="National">National</option>
            <option value="State">State</option>
          </select>
        </div>
        {type === 'State' && (
          <div ref={dropdownRef} className="relative">
            <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">SELECT STATES *</label>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setStateDropdownOpen(o => !o)}
              className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 flex items-center justify-between gap-2"
            >
              <span className={selectedStates.length === 0 ? 'text-slate-500' : 'text-white'}>
                {selectedStates.length === 0
                  ? 'Select States'
                  : `${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown size={14} className={`transition-transform shrink-0 ${stateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Selected state tags */}
            {selectedStates.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedStates.map(s => (
                  <span key={s} className="flex items-center gap-1 px-2 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-black rounded-lg border border-sky-500/30">
                    {s}
                    <button onClick={() => toggleState(s)} className="hover:text-white transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown panel */}
            {stateDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                {/* Select All / Clear */}
                <div className="sticky top-0 bg-[#1c1c2e] border-b border-[#3b3b5a] px-3 py-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedStates(selectedStates.length === INDIAN_STATES.length ? [] : [...INDIAN_STATES])}
                    className="text-[10px] font-black text-sky-400 hover:text-sky-300 uppercase tracking-wider"
                  >
                    {selectedStates.length === INDIAN_STATES.length ? 'Clear All' : 'Select All'}
                  </button>
                  <span className="text-[10px] text-slate-500">{selectedStates.length}/{INDIAN_STATES.length}</span>
                </div>
                {INDIAN_STATES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleState(s)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors hover:bg-[#27273f] ${selectedStates.includes(s) ? 'text-sky-300 bg-sky-500/5' : 'text-slate-300'}`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selectedStates.includes(s) ? 'bg-sky-500 border-sky-500' : 'border-[#3b3b5a]'}`}>
                      {selectedStates.includes(s) && <CheckSquare size={10} className="text-white" />}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">SELECT DATE *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 [color-scheme:dark]" />
        </div>
        <div className={type === 'State' ? 'md:col-span-1' : 'md:col-span-2'}>
          <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">HOLIDAY TITLE *</label>
          <input type="text" placeholder="Enter title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500" />
        </div>
      </div>

      {formError && (
        <div className="mb-3 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl shrink-0">{formError}</div>
      )}

      <div className="mb-6 shrink-0">
        <button onClick={handleAddHoliday} disabled={adding} className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95">
          {adding ? 'Adding...' : 'Add Holiday'}
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl flex flex-col">
        {/* Bulk action bar — only shows when rows are selected */}
        {selected.size > 0 && (
          <div className="flex items-center gap-4 px-6 py-3 bg-rose-500/10 border-b border-rose-500/20 shrink-0">
            <span className="text-rose-400 text-xs font-black uppercase tracking-widest">{selected.size} selected</span>
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 size={13} strokeWidth={2.5} />
              {deleting ? 'Deleting...' : `Delete ${selected.size} Holiday${selected.size > 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors">
              Cancel
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-[#151521] border-b border-[#3b3b5a] z-10">
              <tr>
                <th className="px-4 py-4">
                  <button onClick={toggleSelectAll} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-rose-500 border-rose-500' : 'border-[#3b3b5a] hover:border-rose-500'}`}>
                    {allSelected && <CheckSquare size={12} className="text-white" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Type</th>
                <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">State</th>
                <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Holiday</th>
                <th className="px-4 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No data found</td></tr>
              ) : holidays.map((h, i) => (
                <tr key={h._id} className={`border-b border-[#3b3b5a] transition-colors ${selected.has(h._id) ? 'bg-rose-500/5' : 'hover:bg-[#27273f]/30'}`}>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(h._id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected.has(h._id) ? 'bg-rose-500 border-rose-500' : 'border-[#3b3b5a] hover:border-rose-500'}`}>
                      {selected.has(h._id) && <CheckSquare size={12} className="text-white" />}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-400">{i + 1}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-300">{renderDate(h.date)}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.type}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.state || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.title}</td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => handleDelete(h._id)} className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
