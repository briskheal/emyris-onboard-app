import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function SettingsHolidays() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [type, setType] = useState('National');
  const [state, setState] = useState('');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get('/api/xl/settings/holidays');
      if (res.data.success) {
        setHolidays(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!title || !date) return alert('Please fill in title and date');
    if (type === 'State' && !state) return alert('Please select a state');
    
    try {
      const res = await axios.post('/api/xl/settings/holidays', {
        type, state: type === 'State' ? state : null, date, title
      });
      if (res.data.success) {
        setHolidays([...holidays, res.data.data]);
        setTitle('');
        setDate('');
        setState('');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to add holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await axios.delete(\`/api/xl/settings/holidays/\${id}\`);
      setHolidays(holidays.filter(h => h._id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete holiday');
    }
  };

  const renderDate = (d: string) => {
    const obj = new Date(d);
    return obj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Holidays...</div>;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
       <div className="flex items-center gap-3 mb-6 shrink-0">
          <h2 className="text-xl font-black text-white uppercase tracking-wide">CREATE HOLIDAYS</h2>
       </div>

       {/* Form Section */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
          <div>
            <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">HOLIDAY TYPE *</label>
            <select value={type} onChange={e => { setType(e.target.value); setState(''); }} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
              <option value="National">National</option>
              <option value="State">State</option>
            </select>
          </div>
          
          {type === 'State' && (
            <div>
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">SELECT STATE *</label>
              <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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

       <div className="mb-8 shrink-0">
          <button onClick={handleAddHoliday} className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95">
             Add Holiday
          </button>
       </div>

       {/* Table Section */}
       <div className="flex-1 overflow-hidden bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-[#151521] border-b border-[#3b3b5a] z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">State</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Holiday</th>
                  <th className="px-4 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No data found</td></tr>
                ) : holidays.map((h, i) => (
                  <tr key={h._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-400">{i + 1}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-300">{renderDate(h.date)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.type}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.state || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-300">{h.title}</td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => handleDelete(h._id)} className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                        <Trash2 size={16} strokeWidth={2.5}/>
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
