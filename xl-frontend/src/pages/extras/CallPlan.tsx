import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, CheckSquare, Square, Search } from 'lucide-react';
import axios from 'axios';

const USER_EMAIL = 'rep@emyris.in';

export default function CallPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayDate = new Date();
  const dateStr = todayDate.toISOString().split('T')[0];
  const displayDate = todayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch all doctors
      const drRes = await axios.get('/api/xl/entities?type=Doctor');
      setDoctors(drRes.data.data || []);

      // 2. Fetch existing call plan for today
      const planRes = await axios.get(`/api/xl/call-plan/my?email=${USER_EMAIL}&date=${dateStr}`);
      if (planRes.data.data && planRes.data.data.doctors) {
        setSelectedIds(new Set(JSON.parse(planRes.data.data.doctors)));
      }
    } catch (e) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDoctor = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (selectedIds.size < 8) {
      setError(`You must select at least 8 doctors to plan your day. Currently selected: ${selectedIds.size}`);
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/xl/call-plan', {
        employeeEmail: USER_EMAIL,
        date: dateStr,
        doctors: Array.from(selectedIds)
      });
      setSuccess('Call Plan saved successfully!');
      setTimeout(() => navigate(-1), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save Call Plan.');
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase()) || d.workingArea?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-slate-800 border-b border-slate-700/60 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600 flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Call Planning</h1>
          <p className="text-xs text-slate-400">{displayDate}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">Rule</p>
          <p className="text-sm text-slate-300">You must select a minimum of <strong className="text-white">8 doctors</strong> to plan your day.</p>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><Check size={16} />{success}</div>}

        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Available Doctors</span>
          <span className={`text-xs font-bold ${selectedIds.size >= 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {selectedIds.size} / 8 min
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pb-24">
          {loading ? (
             <p className="text-center text-sm text-slate-500 mt-10">Loading doctors...</p>
          ) : filteredDoctors.length === 0 ? (
             <p className="text-center text-sm text-slate-500 mt-10">No doctors found.</p>
          ) : (
            filteredDoctors.map(dr => {
              const selected = selectedIds.has(dr._id);
              return (
                <button
                  key={dr._id}
                  onClick={() => toggleDoctor(dr._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${selected ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-800 border-slate-700/50'}`}
                >
                  <div className="flex-shrink-0">
                    {selected ? <CheckSquare size={20} className="text-sky-400" /> : <Square size={20} className="text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${selected ? 'text-white' : 'text-slate-200'}`}>{dr.name}</p>
                    <p className="text-xs text-slate-400">{dr.specialization || 'General'} • {dr.workingArea || dr.hq}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Floating Save Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`w-full h-[48px] rounded-xl font-semibold text-sm transition-colors ${selectedIds.size >= 8 && !saving ? 'bg-sky-500 text-white active:bg-sky-600' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
          >
            {saving ? 'Saving...' : `Lock Plan (${selectedIds.size} selected)`}
          </button>
        </div>
      </div>
    </div>
  );
}
