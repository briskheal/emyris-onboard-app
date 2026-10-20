import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Reminders() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    employeeId: '',
    entityName: '',
    discussion: '',
    date: todayStr,
    time: '09:45'
  });

  useEffect(() => {
    axios.get('/api/xl/admin/users').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
      const active = list.filter((u: any) => u.status !== 'Blocked');
      setUsers(active);
      if (active.length > 0) {
        setForm(prev => ({ ...prev, employeeId: active[0].employeeId || active[0].uid || active[0]._id }));
      }
    }).catch(console.error);
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/reminders', {
        params: { employeeId: selectedUserId === 'all' ? undefined : selectedUserId }
      });
      if (res.data?.success) {
        setReminders(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [selectedUserId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entityName) return;
    try {
      const u = users.find(x => (x.employeeId || x.uid || x._id) === form.employeeId);
      const empName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : form.employeeId;
      await axios.post('/api/xl/reminders', {
        employeeId: form.employeeId,
        employeeName: empName,
        entityName: form.entityName,
        discussion: form.discussion,
        date: form.date,
        time: form.time
      });
      setForm(prev => ({ ...prev, entityName: '', discussion: '' }));
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/xl/reminders/${id}`);
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="hidden md:flex p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Reminder Call Reports & Scheduler</h2>
          </div>
          <button onClick={fetchReminders} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Reminder Call Reports Log */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-2xl flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-black text-white uppercase">Field Reminder Call Logs ({reminders.length})</h3>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-white"
              >
                <option value="all">All Field Users</option>
                {users.map((u, i) => {
                  const empId = u.employeeId || u.uid || u._id;
                  return (
                    <option key={i} value={empId}>
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || empId} ({u.hq || 'HQ'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-center text-slate-400 py-8 text-sm">Loading reminder calls...</p>
              ) : reminders.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No reminder calls found.</p>
              ) : (
                reminders.map((r, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-sky-400">{r.entityName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{r.displayDate}</span>
                        </div>
                        <p className="text-xs font-semibold text-white mt-0.5">User: {r.employeeName} {r.hq ? `(${r.hq})` : ''}</p>
                        {r.discussion && <p className="text-xs text-slate-400 mt-1">{r.discussion}</p>}
                        {Array.isArray(r.products) && r.products.length > 0 && (
                          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                            Products Reminded: {r.products.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(r._id)} className="text-rose-400/60 hover:text-rose-400 transition-colors p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Add Reminder Form */}
          <form onSubmit={handleAdd} className="flex flex-col gap-4 w-full lg:w-[380px] bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 h-fit">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Schedule / Log Reminder</h3>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assign To User</label>
              <select
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-white"
              >
                {users.map((u, i) => {
                  const empId = u.employeeId || u.uid || u._id;
                  return (
                    <option key={i} value={empId}>
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || empId}
                    </option>
                  );
                })}
              </select>
            </div>

            <input
              type="text"
              placeholder="Doctor / Reminder Title *"
              value={form.entityName}
              onChange={e => setForm({ ...form, entityName: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-semibold text-white placeholder:text-slate-500"
              required
            />

            <input
              type="text"
              placeholder="Reminder Notes / Products Discussed"
              value={form.discussion}
              onChange={e => setForm({ ...form, discussion: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-semibold text-white placeholder:text-slate-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Time</label>
                <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="bg-transparent text-sm font-bold text-sky-400 focus:outline-none w-full"
                  />
                  <Clock size={15} className="text-slate-500 shrink-0" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-3.5 font-bold shadow-lg shadow-sky-500/20 transition-colors flex items-center justify-center gap-2 mt-2">
              <Plus size={18} /> Add Reminder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
