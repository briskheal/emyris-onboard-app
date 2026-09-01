import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function SettingsDoctorControls() {
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [type, setType] = useState('Specialization');
  const [inputValue, setInputValue] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/dcs/controls');
      setControls(res.data.controls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setAdding(true);
    try {
      await axios.post('/api/admin/dcs/controls', { type, name: inputValue.trim(), isActive: true });
      setInputValue('');
      fetchControls();
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
      fetchControls(); // revert on fail
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${c.name}"?`)) return;
    try {
      setControls(controls.filter(x => x._id !== c._id));
      await axios.delete(`/api/admin/dcs/controls/${c._id}`);
    } catch (e) {
      alert('Error deleting control');
      fetchControls();
    }
  };

  const filtered = controls.filter(c => c.type === type);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
      <div className="p-8 pb-4 border-b border-[#3b3b5a] shrink-0">
        <h2 className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={16} /> DOCTOR CONTROLS
        </h2>
      </div>

      <div className="p-8 shrink-0 flex items-end gap-6 bg-[#252538]/50 border-b border-[#3b3b5a]">
        <div className="flex-1 max-w-xs">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Select Type *</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors">
            <option value="Specialization">Specialization</option>
            <option value="Degree">Degree</option>
            <option value="Category">Category</option>
            <option value="Hospital">Hospital</option>
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Enter {type} *</label>
          <input 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Enter Option"
            className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
        <button onClick={handleAdd} disabled={adding || !inputValue.trim()} className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50">
          Add
        </button>
      </div>

      <div className="px-8 pt-6 pb-2 shrink-0 flex items-center justify-between">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-800/50 py-1.5 px-3 rounded">
          SHOWING ({filtered.length}) ENTRIES
        </span>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a40] sticky top-0 z-10 shadow-md">
            <tr className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
              <th className="p-4 border-b border-[#3b3b5a] w-24 text-center">Sr no.</th>
              <th className="p-4 border-b border-[#3b3b5a]">Name</th>
              <th className="p-4 border-b border-[#3b3b5a] text-center w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-slate-500">No entries found for {type}</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c._id} className="border-b border-[#3b3b5a]/50 hover:bg-[#252538] transition-colors group">
                <td className="p-4 text-slate-400 text-sm font-medium text-center">{i + 1}</td>
                <td className="p-4 text-white text-sm">{c.name}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={c.isActive !== false} // default true if undefined
                      onChange={() => handleToggle(c)}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <button onClick={() => handleDelete(c)} className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Permanently delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
