import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle2, AlertCircle, ReceiptIndianRupee } from 'lucide-react';
import axios from 'axios';

const USER_EMAIL = 'rep@emyris.in';
const EXPENSE_CATEGORIES = ['Travel', 'DA', 'Hotel', 'Miscellaneous'];

export default function Expense() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [remarks, setRemarks] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`/api/xl/expense/my?email=${USER_EMAIL}`);
      setExpenses(res.data.data || []);
    } catch (e) {
      setError('Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount || !category) { setError('Date, amount, and category are required.'); return; }
    if (isNaN(Number(amount)) || Number(amount) <= 0) { setError('Enter a valid amount.'); return; }

    setSubmitting(true);
    setError('');

    try {
      await axios.post('/api/xl/expense', { 
        employeeEmail: USER_EMAIL, 
        date, amount: Number(amount), category, remarks 
      });
      await fetchExpenses();
      setShowNew(false);
      setAmount('');
      setRemarks('');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to submit expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved': return { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 };
      case 'Rejected': return { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: AlertCircle };
      default: return { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock };
    }
  };

  const totalPending = expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-full bg-slate-800 flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-700 border-b border-slate-700/60 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600 active:bg-slate-600 flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Expenses</h1>
          <p className="text-xs text-slate-200">Track your daily allowances</p>
        </div>
        {!showNew && (
          <button onClick={() => setShowNew(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500 active:bg-sky-600 flex-shrink-0">
            <Plus size={20} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-200 font-bold uppercase tracking-widest mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-400">₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-200 font-bold uppercase tracking-widest mb-1">Approved</p>
            <p className="text-xl font-bold text-emerald-400">₹{totalApproved.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {showNew && (
          <div className="bg-slate-700 rounded-2xl border border-slate-700 p-4 mb-6 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none appearance-none">
                  {EXPENSE_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Train ticket, lunch, etc."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none" />
              </div>

              {error && <p className="text-rose-400 text-sm bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm active:bg-slate-600">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm disabled:opacity-50 active:bg-sky-600">{submitting ? 'Submitting...' : 'Submit Expense'}</button>
              </div>
            </form>
          </div>
        )}

        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 px-1">Expense History</h3>
        
        {loading ? (
          <p className="text-center text-sm text-slate-500 mt-10">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-center text-sm text-slate-500 mt-10">No expenses found.</p>
        ) : (
          <div className="space-y-3 pb-6">
            {expenses.map(exp => {
              const { color, icon: Icon } = getStatusConfig(exp.status);
              return (
                <div key={exp._id} className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                        <ReceiptIndianRupee size={16} className="text-slate-300" />
                      </div>
                      <div>
                        <span className="text-white font-bold text-base leading-none">₹{exp.amount.toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-200">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="text-xs font-semibold text-sky-400">{exp.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color}`}>
                      <Icon size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{exp.status}</span>
                    </div>
                  </div>

                  {exp.remarks && <p className="text-sm text-slate-300 ml-10 leading-relaxed">{exp.remarks}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
