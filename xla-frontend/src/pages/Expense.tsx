import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, DollarSign, Settings as SettingsIcon, X, Edit2, Info, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Expense() {
  const navigate = useNavigate();
  // const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [rawExpenses, setRawExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Form states for the modal
  const [foodAmt, setFoodAmt] = useState(0);
  const [ticketAmt, setTicketAmt] = useState(0);
  const [hotelAmt, setHotelAmt] = useState(0);
  const [dailyAmt, setDailyAmt] = useState(0);
  const [miscAmt, setMiscAmt] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Determine initially logged in user from localStorage if possible
    let defaultUser = '';
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.email || u.employeeId) defaultUser = u.email || u.employeeId;
    } catch(e) {}
    
    // Fetch users for the dropdown
    axios.get('/api/admin/users').then(res => {
      if (res.data.success) {
        setUsers(res.data.users);
        if (defaultUser && res.data.users.find((u:any) => u.employeeId === defaultUser)) {
           setSelectedUser(defaultUser);
        } else if (res.data.users.length > 0) {
           setSelectedUser(res.data.users[0].employeeId);
        }
      }
    }).catch(console.error);
  }, []);

  const fetchExpenses = () => {
    if (!selectedUser) return;
    
    axios.get(`/api/xl/expense/my?email=${selectedUser}`).then(res => {
      if (res.data.success) setRawExpenses(res.data.data || []);
      
    }).catch(() => {});
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedUser]);

  // Compute days for the selected month and map expenses to them
  const expenses = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysArr = [];
    
    let pending = 0;
    let approved = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(selectedYear, selectedMonth - 1, i);
      const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][dt.getDay()];
      // Format as YYYY-MM-DD
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const fullDateStr = `${i} ${dt.toLocaleString('default', { month: 'short' })} ${selectedYear}`;

      // Filter raw expenses for this date
      const dayExps = rawExpenses.filter(e => e.date === dateStr);
      
      let travel = 0, food = 0, hotel = 0, ticket = 0, daily = 0, misc = 0, total = 0;
      let workArea = '';
      let status = '';

      dayExps.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        total += amt;
        const cat = (e.category || '').toLowerCase();
        if (cat.includes('travel')) travel += amt;
        else if (cat.includes('food')) food += amt;
        else if (cat.includes('hotel')) hotel += amt;
        else if (cat.includes('ticket')) ticket += amt;
        else if (cat.includes('da') || cat.includes('daily')) daily += amt;
        else misc += amt;
        
        status = e.status || status;
      });

      if (status.toLowerCase() === 'approved') approved += total;
      else if (total > 0) pending += total;

      daysArr.push({
        date: i,
        day: dayName,
        dateStr,
        fullDateStr,
        travel, food, hotel, ticket, daily, misc, total: total > 0 ? total : null,
        badge: total > 0 ? 'Submitted' : '',
        workArea,
        status: status || (total > 0 ? 'Pending' : 'Not Submitted'),
        noTp: false,
        rawExps: dayExps
      });
    }

    return { daysArr, pending, approved };
  }, [selectedMonth, selectedYear, rawExpenses]);

  const handleOpenModal = (item: any) => {
    setSelectedExpense(item);
    setFoodAmt(item.food || 0);
    setTicketAmt(item.ticket || 0);
    setHotelAmt(item.hotel || 0);
    setDailyAmt(item.daily || 0);
    setMiscAmt(item.misc || 0);
    setRemarks(item.rawExps?.[0]?.remarks || '');
    setIsModalOpen(true);
  };

  const handleSubmitExpense = async () => {
    if (!selectedExpense || !selectedUser) return;
    setSubmitting(true);
    
    const submits = [];
    const base = { employeeId: selectedUser, date: selectedExpense.dateStr, remarks, status: 'Pending' };

    // We submit separate requests for each category that has a value > 0, to match backend DB structure
    if (foodAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Food', amount: foodAmt }));
    if (ticketAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Ticket', amount: ticketAmt }));
    if (hotelAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Hotel', amount: hotelAmt }));
    if (dailyAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Daily', amount: dailyAmt }));
    if (miscAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Misc', amount: miscAmt }));

    if (submits.length > 0) {
      try {
        await Promise.all(submits);
        fetchExpenses();
      } catch (e) {
        console.error("Failed to submit expenses", e);
      }
    }
    
    setSubmitting(false);
    setIsModalOpen(false);
  };

  

  return (
    <div className="min-h-screen md:h-dvh bg-[#0b0f19] flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-[#0b0f19] border-b border-slate-800 sticky top-0 z-10 shadow-lg">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-4 md:p-8 overflow-y-auto custom-scrollbar">
        
        {/* DESKTOP HEADER & BANNER */}
        <div className="hidden md:block mb-6">
          <div className="bg-[#151c2c] border-l-4 border-emerald-500 rounded-r-xl p-4 shadow-lg flex items-start gap-3 border border-slate-800/50">
            <Info className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-slate-300 leading-relaxed">
              This is to declare that the daily allowance as claimed for the month are out of pocket expenses such as parking, snacks, stationery and other such expenses for which bills are not available.
            </p>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mt-8">Field Expense</h2>
        </div>

        {/* CONTROLS (Responsive) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-[#151c2c] p-5 rounded-2xl border border-slate-800/50 shadow-xl">
          <div className="flex flex-wrap items-end gap-5 w-full">
            
            {/* MONTH SELECTOR */}
            <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Select Month</label>
              <input 
                type="month" 
                value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setSelectedYear(parseInt(y));
                    setSelectedMonth(parseInt(m));
                  }
                }}
                className="w-full bg-[#0b0f19] border border-slate-700/60 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500" 
              />
            </div>
            
            {/* DESKTOP USER SELECTOR */}
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Select User</label>
              <select 
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700/60 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500 cursor-pointer appearance-none"
              >
                {users.map(u => (
                  <option key={u.employeeId} value={u.employeeId}>{u.firstName} {u.lastName} ({u.designation || 'Staff'})</option>
                ))}
              </select>
            </div>

            {/* ACTION MENU */}
            <div className="hidden md:flex flex-col justify-end min-w-[120px]">
               <button className="flex items-center justify-center gap-2 bg-[#0b0f19] border border-slate-700/60 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:border-sky-500/50 transition-colors w-full">
                 Actions <SettingsIcon size={16} className="text-sky-400" />
               </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative bg-[#151c2c] rounded-2xl border border-slate-800/50 shadow-2xl overflow-hidden">
          
          {/* Status Legends */}
          <div className="flex items-center gap-6 px-6 py-4 bg-[#0b0f19]/50 border-b border-slate-800/80 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div><span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Approved</span></div>
            <div className="flex items-center gap-2 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div><span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Rejected</span></div>
            <div className="flex items-center gap-2 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div><span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Pending</span></div>
            <div className="flex items-center gap-2 shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div><span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Not Submitted</span></div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto pb-16 custom-scrollbar">
            <table className="min-w-[1000px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151c2c] border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Sr no.</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Day</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Area Type</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Travel</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Food</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Hotel</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ticket</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Daily</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Misc.</th>
                  <th className="p-4 text-[10px] font-black text-sky-400 uppercase tracking-widest text-right">Total</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky right-0 bg-[#151c2c] z-10 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {expenses.daysArr.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-4 text-sm font-semibold text-slate-500 text-center">{item.date}</td>
                    <td className="p-4 text-sm font-bold text-white whitespace-nowrap">{item.fullDateStr}</td>
                    <td className="p-4 text-sm font-medium text-slate-400">{item.day}</td>
                    <td className="p-4 text-sm font-medium text-slate-300">{item.badge || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.travel || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.food || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.hotel || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.ticket || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.daily || '-'}</td>
                    <td className="p-4 text-sm font-medium text-slate-300 text-right">{item.misc || '-'}</td>
                    <td className="p-4 text-sm font-black text-sky-400 text-right">{item.total || '-'}</td>
                    <td className="p-3 text-center sticky right-0 bg-[#151c2c] group-hover:bg-slate-800/40 transition-colors z-10 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">
                      {item.day !== 'SUN' && (
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 p-2 rounded-xl transition-all inline-flex items-center justify-center active:scale-95"
                        >
                          {item.total ? <Eye size={18} strokeWidth={2.5} /> : <Edit2 size={18} strokeWidth={2.5} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop Table Footer (Sticky Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0b0f19]/95 border-t border-slate-700/50 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg tracking-widest uppercase shadow-sm">Page 1 of 1</span>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 bg-[#151c2c] px-4 py-2 rounded-xl border border-amber-500/20 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Pending Expense</p>
                  <p className="text-sm font-black text-amber-400 leading-none">,1 {expenses.pending}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-[#151c2c] px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Approved Expense</p>
                  <p className="text-sm font-black text-emerald-400 leading-none">,1 {expenses.approved}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0b0f19]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="bg-[#151c2c] border border-slate-700/60 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-100 transition-transform">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-[#0b0f19]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Complete Expense</h3>
                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-1">{selectedExpense?.fullDateStr}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setSelectedExpense(null); }} className="text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/50 p-2 rounded-full border border-slate-700/50 hover:bg-slate-800 active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Working Area Type</label>
                  <div className="w-full bg-[#0b0f19] border border-slate-700/50 text-slate-300 rounded-xl px-4 py-3 text-sm font-semibold">
                    {selectedExpense?.badge || 'Out-Station'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Working Areas</label>
                  <div className="w-full bg-[#0b0f19] border border-slate-700/50 text-slate-300 rounded-xl px-4 py-3 text-sm font-semibold truncate" title={selectedExpense?.workArea || 'N/A'}>
                    {selectedExpense?.workArea || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Food Allowance</label>
                    <input type="number" value={foodAmt || ''} onChange={e => setFoodAmt(parseFloat(e.target.value)||0)} className="w-full bg-[#0b0f19] border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500/80 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ticket Allowance</label>
                    <input type="number" value={ticketAmt || ''} onChange={e => setTicketAmt(parseFloat(e.target.value)||0)} className="w-full bg-[#0b0f19] border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500/80 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hotel Allowance</label>
                    <input type="number" value={hotelAmt || ''} onChange={e => setHotelAmt(parseFloat(e.target.value)||0)} className="w-full bg-[#0b0f19] border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500/80 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Daily Allowance</label>
                    <input type="number" value={dailyAmt || ''} onChange={e => setDailyAmt(parseFloat(e.target.value)||0)} className="w-full bg-[#0b0f19] border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500/80 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Miscellaneous Expense</label>
                    <input type="number" value={miscAmt || ''} onChange={e => setMiscAmt(parseFloat(e.target.value)||0)} className="w-full bg-sky-900/10 border border-sky-500/30 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600" placeholder="Enter misc amount..." />
                  </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-2">Remarks</label>
                <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-[#0b0f19] border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-sky-500 resize-none" placeholder="Add any comments..."></textarea>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-700/50 bg-[#0b0f19]">
              <button 
                onClick={handleSubmitExpense}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? 'Submitting...' : (selectedExpense?.total ? 'Update Expense' : 'Submit Expense')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
