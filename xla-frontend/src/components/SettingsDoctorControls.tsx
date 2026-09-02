import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Edit2, X, Check, Search } from 'lucide-react';

export default function SettingsDoctorControls() {
  const [controls, setControls] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [type, setType] = useState('Specialization');
  const [inputValue, setInputValue] = useState('');
  
  const [hospitalHq, setHospitalHq] = useState('');
  const [hospitalArea, setHospitalArea] = useState('');

  const [adding, setAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHq, setEditHq] = useState('');
  const [editArea, setEditArea] = useState('');

  // Bulk State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkHq, setBulkHq] = useState('');
  const [bulkArea, setBulkArea] = useState('');
  const [bulking, setBulking] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ctrlRes, hqRes, cityRes] = await Promise.all([
        axios.get('/api/admin/dcs/controls'),
        axios.get('/api/admin/locations/hqs'),
        axios.get('/api/admin/locations/cities')
      ]);
      setControls(ctrlRes.data.controls || []);
      setHqs(hqRes.data.hqs || []);
      setCities(cityRes.data.cities || []);
    } catch (e) {
      console.error('Error fetching data:', e);
      // Fallback if hq/cities endpoints don't exist in standard format
      // Just load controls
      try {
        const c = await axios.get('/api/admin/dcs/controls');
        setControls(c.data.controls || []);
      } catch(ex) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  


  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setAdding(true);
    try {
      await axios.post('/api/admin/dcs/controls', { 
        type, 
        name: inputValue.trim(), 
        hq: type === 'Hospital' ? hospitalHq : null,
        area: type === 'Hospital' ? hospitalArea : null,
        isActive: true 
      });
      setInputValue('');
      setHospitalHq('');
      setHospitalArea('');
      fetchData();
    } catch (e) {
      alert('Error adding control');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (c: any) => {
    try {
      const newStatus = !c.isActive;
      setControls(controls.map(x => x._id === c._id ? { ...x, isActive: newStatus } : x));
      await axios.put(`/api/admin/dcs/controls/${c._id}`, { isActive: newStatus });
    } catch (e) {
      alert('Error updating control status');
      fetchData(); 
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${c.name}"?`)) return;
    try {
      setControls(controls.filter(x => x._id !== c._id));
      await axios.delete(`/api/admin/dcs/controls/${c._id}`);
    } catch (e) {
      alert('Error deleting control');
      fetchData();
    }
  };

  const startEdit = (c: any) => {
    setEditingId(c._id);
    setEditName(c.name);
    setEditHq(c.hq || '');
    setEditArea(c.area || '');
  };

  const saveEdit = async (c: any) => {
    if (!editName.trim()) return;
    try {
      setControls(controls.map(x => x._id === c._id ? { ...x, name: editName.trim(), hq: type === 'Hospital' ? editHq : null, area: type === 'Hospital' ? editArea : null } : x));
      setEditingId(null);
      await axios.put(`/api/admin/dcs/controls/${c._id}`, { name: editName.trim(), hq: type === 'Hospital' ? editHq : null, area: type === 'Hospital' ? editArea : null });
    } catch (e) {
      alert('Error updating control');
      fetchData();
    }
  };

  const handleBulkUpdate = async () => {
      if(selectedIds.length === 0) return;
      setBulking(true);
      try {
          await axios.put('/api/admin/dcs/controls/bulk-update', {
              ids: selectedIds,
              updates: { hq: bulkHq, area: bulkArea }
          });
          setControls(controls.map(c => selectedIds.includes(c._id) ? { ...c, hq: bulkHq, area: bulkArea } : c));
          setSelectedIds([]);
          setBulkHq('');
          setBulkArea('');
      } catch (e) {
          alert('Error bulk updating');
      } finally {
          setBulking(false);
      }
  };

  const filteredByType = controls.filter(c => c.type === type);
  
  // Search for the grid
  const displayList = filteredByType.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.hq && c.hq.toLowerCase().includes(searchQuery.toLowerCase())));
  
  // Suggestions for the ADD input
  const inputSuggestions = inputValue.length >= 3 
    ? filteredByType.filter(c => c.name.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 5)
    : [];

  const hqOptions = Array.from(new Set(hqs.map(h => h.hqName))).filter(Boolean).sort();
  

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
      <div className="p-8 pb-4 border-b border-[#3b3b5a] shrink-0">
        <h2 className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={16} /> DOCTOR CONTROLS
        </h2>
      </div>

      <div className="p-8 shrink-0 flex items-end gap-6 bg-[#252538]/50 border-b border-[#3b3b5a] relative z-20">
        <div className="w-48">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Type *</label>
          <select value={type} onChange={e => {setType(e.target.value); setEditingId(null); setSelectedIds([]);}} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors">
            <option value="Specialization">Specialization</option>
            <option value="Degree">Degree</option>
            <option value="Category">Category</option>
            <option value="Hospital">Hospital</option>
          </select>
        </div>
        
        <div className="flex-1 relative">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Enter {type} Name *</label>
          <input 
            ref={inputRef}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Type at least 3 characters to search..."
            className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
          />
          {showSuggestions && inputSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 bg-slate-900/50 uppercase tracking-wider border-b border-slate-700">Similar Existing Entries (Avoid Duplicates)</div>
              {inputSuggestions.map(s => (
                <div key={s._id} className="px-4 py-3 text-sm text-white hover:bg-sky-500/20 cursor-pointer" onClick={() => setInputValue(s.name)}>
                  {s.name} {s.hq && <span className="text-slate-400 ml-2 text-xs">({s.hq})</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {type === 'Hospital' && (
          <>
            <div className="w-48">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">HQ *</label>
              <select value={hospitalHq} onChange={e => setHospitalHq(e.target.value)} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
                  <option value="">Select HQ</option>
                  {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">City/Area *</label>
              <input list="add-city-list" value={hospitalArea} onChange={e => setHospitalArea(e.target.value)} placeholder="Type or Select Area" className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500" />
              <datalist id="add-city-list">
                  {cities.filter(city => !hospitalHq || city.hq === hospitalHq).map(city => <option key={city._id} value={city.cityName} />)}
              </datalist>
            </div>
          </>
        )}

        <button onClick={handleAdd} disabled={adding || !inputValue.trim() || (type === 'Hospital' && (!hospitalHq || !hospitalArea.trim()))} className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50">
          Add
        </button>
      </div>

      {type === 'Hospital' && selectedIds.length > 0 && (
          <div className="bg-sky-900/20 border-b border-sky-500/30 p-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <span className="text-sky-400 font-bold text-sm">{selectedIds.length} Hospitals Selected</span>
                  <select value={bulkHq} onChange={e=>setBulkHq(e.target.value)} className="bg-slate-900 border border-sky-500/50 rounded-lg p-2 text-sm text-white outline-none">
                      <option value="">Select Bulk HQ</option>
                      {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <div className="relative">
                      <input list="bulk-city-list" value={bulkArea} onChange={e=>setBulkArea(e.target.value)} placeholder="Type or Select Area" className="bg-slate-900 border border-sky-500/50 rounded-lg p-2 text-sm text-white outline-none w-40" />
                      <datalist id="bulk-city-list">
                          {cities.filter(city => !bulkHq || city.hq === bulkHq).map(city => <option key={city._id} value={city.cityName} />)}
                      </datalist>
                  </div>
              </div>
              <button onClick={handleBulkUpdate} disabled={bulking} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-lg transition-colors">
                  {bulking ? 'Applying...' : 'Apply to Selected'}
              </button>
          </div>
      )}

      <div className="px-8 pt-6 pb-2 shrink-0 flex items-center justify-between">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-800/50 py-1.5 px-3 rounded">
          SHOWING ({displayList.length}) ENTRIES
        </span>
        <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search list..."
              className="w-full bg-[#252538] border border-[#3b3b5a] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8 relative z-10">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a40] sticky top-0 z-10 shadow-md">
            <tr className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
              {type === 'Hospital' && (
                  <th className="p-4 border-b border-[#3b3b5a] w-12 text-center">
                      <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? displayList.map(d=>d._id) : [])} checked={selectedIds.length === displayList.length && displayList.length > 0} className="w-4 h-4 accent-sky-500" />
                  </th>
              )}
              {type === 'Hospital' && <th className="p-4 border-b border-[#3b3b5a] w-48">HQ</th>}
              <th className="p-4 border-b border-[#3b3b5a]">Name</th>
              {type === 'Hospital' && <th className="p-4 border-b border-[#3b3b5a] w-48">City / Area</th>}
              <th className="p-4 border-b border-[#3b3b5a] text-center w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={type === 'Hospital' ? 5 : 2} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : displayList.length === 0 ? (
              <tr><td colSpan={type === 'Hospital' ? 5 : 2} className="p-8 text-center text-slate-500">No entries found</td></tr>
            ) : displayList.map((c) => (
              <tr key={c._id} className="border-b border-[#3b3b5a]/50 hover:bg-[#252538] transition-colors group h-14">
                
                {type === 'Hospital' && (
                    <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, c._id] : prev.filter(id => id !== c._id))} className="w-4 h-4 accent-sky-500" />
                    </td>
                )}
                
                {editingId === c._id ? (
                  <>
                    {type === 'Hospital' && (
                      <td className="p-2">
                        <select value={editHq} onChange={e => setEditHq(e.target.value)} className="w-full bg-slate-900 border border-sky-500 rounded p-2 text-sm text-white focus:outline-none">
                            <option value="">Select HQ</option>
                            {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    )}
                    <td className="p-2">
                      <input 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveEdit(c)}
                        className="w-full bg-slate-900 border border-sky-500 rounded p-2 text-sm text-white focus:outline-none" 
                      />
                    </td>
                    {type === 'Hospital' && (
                      <td className="p-2">
                        <input list={`edit-city-list-${c._id}`} value={editArea} onChange={e => setEditArea(e.target.value)} placeholder="Type or Select Area" className="w-full bg-slate-900 border border-sky-500 rounded p-2 text-sm text-white focus:outline-none" />
                        <datalist id={`edit-city-list-${c._id}`}>
                            {cities.filter(city => !editHq || city.hq === editHq).map(city => <option key={city._id} value={city.cityName} />)}
                        </datalist>
                      </td>
                    )}
                  </>
                ) : (
                  <>
                    {type === 'Hospital' && <td className="p-4 text-sky-400 font-bold text-xs uppercase">{c.hq || '-'}</td>}
                    <td className="p-4 text-white text-sm font-medium">{c.name}</td>
                    {type === 'Hospital' && <td className="p-4 text-slate-400 text-sm">{c.area || '-'}</td>}
                  </>
                )}
                
                <td className="p-4">
                  {editingId === c._id ? (
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => saveEdit(c)} className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 bg-emerald-500/10 rounded" title="Save">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-700/50 rounded" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <input 
                        type="checkbox" 
                        checked={c.isActive !== false}
                        onChange={() => handleToggle(c)}
                        className="w-4 h-4 accent-sky-500 cursor-pointer"
                        title="Toggle visibility in dropdowns"
                      />
                      <button onClick={() => startEdit(c)} className="text-emerald-400 hover:text-emerald-300 transition-colors opacity-0 group-hover:opacity-100" title="Edit entry">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-rose-400 hover:text-rose-300 transition-colors opacity-0 group-hover:opacity-100" title="Permanently delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
