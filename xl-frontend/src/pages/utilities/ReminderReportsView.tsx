import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, BellRing, RefreshCw, Plus, Trash2, Calendar, Clock, Download, X
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

export default function ReminderReportsView() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modal State for Adding Reminder Call
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState<string>(now.toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('09:45');
  const [newDoctor, setNewDoctor] = useState<string>('');
  const [newProduct, setNewProduct] = useState<string>('');
  const [newRemarks, setNewRemarks] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    try {
      const [remRes, docRes, prodRes] = await Promise.all([
        axios.get('/api/xl/reports/reminders', {
          params: { employeeId: selectedUser.employeeId, month, year }
        }),
        axios.get(`/api/xl/reports/doctors?employeeId=${encodeURIComponent(selectedUser.employeeId)}`).catch(() => ({ data: { data: [] } })),
        axios.get('/api/xl/reports/products').catch(() => ({ data: { data: [] } }))
      ]);
      if (remRes.data?.success) setReminders(remRes.data.data || []);
      if (docRes.data?.data) setDoctors(docRes.data.data || []);
      if (prodRes.data?.data) setProducts(prodRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchReminders();
    }
  }, [selectedUser?.employeeId, month, year]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.employeeId || !newDoctor || !newDate) return;
    setSaving(true);
    try {
      const res = await axios.post('/api/xl/reminders', {
        employeeId: selectedUser.employeeId,
        date: newDate,
        time: newTime,
        doctorName: newDoctor,
        productsDetailed: newProduct ? [newProduct] : [],
        remarks: newRemarks
      });
      if (res.data?.success) {
        setShowAddModal(false);
        setNewDoctor('');
        setNewProduct('');
        setNewRemarks('');
        fetchReminders();
      }
    } catch (err) {
      alert('Failed to save reminder call');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reminder call entry?')) return;
    try {
      await axios.delete(`/api/xl/reminders/${id}`);
      fetchReminders();
    } catch (e) {
      alert('Failed to delete reminder');
    }
  };

  const handleExport = () => {
    if (!reminders.length) return;
    const rows = reminders.map((r, i) => ({
      'Sr No': i + 1,
      'Date': r.displayDate,
      'Time': r.checkInTime,
      'User': r.employeeName,
      'Headquarter': r.headquarter,
      'Doctor / Entity': r.doctorName,
      'Products Reminded': (r.productsDetailed || []).join(', '),
      'Outcome / Remarks': r.remarks
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reminder Calls');
    XLSX.writeFile(wb, `Reminder_Calls_${month}_${year}.xlsx`);
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24 text-white font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/utilities')}
            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-wide flex items-center gap-1.5">
              <BellRing size={16} className="text-yellow-400" />
              REMINDER <span className="text-yellow-400">REPORTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Reminder call logs & follow-up outcomes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 active:scale-95"
            title="Add Reminder Call"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95"
            title="Export Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchReminders}
            className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Reminder Calls</span>
            <span className="text-lg font-black text-yellow-400">{reminders.length}</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus size={14} /> Log Reminder Call
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-yellow-400" />
            <span className="text-xs font-semibold">Loading reminder calls...</span>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No reminder calls found for this month. Tap "+ Log Reminder Call" to record one.
          </div>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((r, i) => (
              <div
                key={r._id || i}
                className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 space-y-2 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        {r.displayDate}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {r.checkInTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1.5">{r.doctorName}</h4>
                  </div>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="p-1.5 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {r.productsDetailed && r.productsDetailed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.productsDetailed.map((p: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {r.remarks && (
                  <p className="text-xs text-slate-300 bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50">
                    {r.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Log Reminder Call</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Doctor / Customer *</label>
                <input
                  type="text"
                  list="reminder-doctors-list"
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  placeholder="Select or type Doctor name..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
                <datalist id="reminder-doctors-list">
                  {doctors.map((d: any) => (
                    <option key={d._id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Reminded</label>
                <select
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="">-- Select Product (Optional) --</option>
                  {products.map((p: any) => (
                    <option key={p._id} value={p.productName || p.name}>
                      {p.productName || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Outcome / Follow-up Notes</label>
                <textarea
                  rows={3}
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="Enter reminder call outcome or follow-up notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3 rounded-xl shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Reminder Call'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
