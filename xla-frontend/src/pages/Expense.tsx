
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, DollarSign, Settings as SettingsIcon, X, Edit2, Info, Eye, ChevronDown, Calendar, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomUserSelect from '../components/CustomUserSelect';

export default function Expense() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
  
  const [rawExpenses, setRawExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const [foodAmt, setFoodAmt] = useState(0);
  const [ticketAmt, setTicketAmt] = useState(0);
  const [hotelAmt, setHotelAmt] = useState(0);
  const [dailyAmt, setDailyAmt] = useState(0);
  const [miscAmt, setMiscAmt] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.month-dropdown')) setIsMonthOpen(false);
      if (!target.closest('.filter-dropdown')) setIsFilterOpen(false);
          };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let defaultUser = '';
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.email || u.employeeId) defaultUser = u.email || u.employeeId;
    } catch(e) {}
    
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

  const expenses = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysArr = [];
    
    let pending = 0;
    let approved = 0;
    
    // Summary totals
    let sumTravel = 0, sumFood = 0, sumHotel = 0, sumTicket = 0, sumDaily = 0, sumMisc = 0, sumTotal = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(selectedYear, selectedMonth - 1, i);
      const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][dt.getDay()];
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const fullDateStr = `${i} ${dt.toLocaleString('default', { month: 'short' })} ${selectedYear}`;

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
      
      let finalStatus = status || (total > 0 ? 'Pending' : 'Not Submitted');
      
      sumTravel += travel;
      sumFood += food;
      sumHotel += hotel;
      sumTicket += ticket;
      sumDaily += daily;
      sumMisc += misc;
      sumTotal += total;

      daysArr.push({
        date: i,
        day: dayName,
        dateStr,
        fullDateStr,
        travel, food, hotel, ticket, daily, misc, total: total > 0 ? total : null,
        badge: total > 0 ? 'Submitted' : '',
        workArea,
        status: finalStatus,
        noTp: false,
        rawExps: dayExps,
        dayRemarks: dayExps[0]?.remarks || ''
      });
    }

    const filteredArr = filterStatus === 'All' 
        ? daysArr 
        : daysArr.filter(d => d.status.toLowerCase() === filterStatus.toLowerCase());

    return { 
      daysArr: filteredArr, 
      pending, 
      approved,
      totals: { travel: sumTravel, food: sumFood, hotel: sumHotel, ticket: sumTicket, daily: sumDaily, misc: sumMisc, total: sumTotal }
    };
  }, [selectedMonth, selectedYear, rawExpenses, filterStatus]);

  const handleOpenModal = (item: any) => {
    setSelectedExpense(item);
    setFoodAmt(item.food || 0);
    setTicketAmt(item.ticket || 0);
    setHotelAmt(item.hotel || 0);
    setDailyAmt(item.daily || 0);
    setMiscAmt(item.misc || 0);
    setRemarks(item.dayRemarks || '');
    setIsModalOpen(true);
  };

  const handleSubmitExpense = async () => {
    if (!selectedExpense || !selectedUser) return;
    setSubmitting(true);
    
    const submits = [];
    const base = { employeeId: selectedUser, date: selectedExpense.dateStr, remarks, status: 'Pending' };

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

  const monthOptions = useMemo(() => {
      const opts = [];
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      for(let i=0; i<12; i++) {
          opts.push({ m: d.getMonth()+1, y: d.getFullYear(), label: `${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}` });
          d.setMonth(d.getMonth() + 1);
      }
      return opts.reverse();
  }, []);

  const getSelectedMonthLabel = () => {
      const d = new Date(selectedYear, selectedMonth - 1, 1);
      return `${d.toLocaleString('default', { month: 'short' })}, ${selectedYear}`;
  };

    
  return (
    <div className="bg-[#0b0f19] flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative w-full">
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-[#0b0f19] border-b border-slate-800 sticky top-0 z-10 shadow-lg">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 py-4 md:p-8">
        <div className="hidden md:block mb-6">
          <div className="bg-[#1e271c] border border-emerald-500/30 rounded-xl p-3 shadow-lg flex items-center gap-3">
            <Info className="text-emerald-400 shrink-0" size={18} />
            <p className="text-[13px] text-emerald-100/80 leading-relaxed font-medium">
              This is to declare that the daily allowance as claimed for the month of {new Date(selectedYear, selectedMonth-1).toLocaleString('default', {month:'long'})} are out of pocket expenses such as parking, snacks, stationery and other such expenses for which bills are not available.
            </p>
          </div>
          <h2 className="text-[15px] font-black text-white uppercase tracking-wider mt-6 mb-4">FIELD EXPENSE</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div className="flex flex-wrap items-end gap-6 w-full relative z-20">
            <div className="flex flex-col gap-1.5 min-w-[200px] month-dropdown relative">
              <label className="text-[11px] font-bold text-white tracking-wide">Select Month <span className="text-rose-500">*</span></label>
              <div 
                onClick={() => setIsMonthOpen(!isMonthOpen)}
                className="w-full bg-[#1e2336] border border-[#3b82f6] text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center justify-between cursor-pointer hover:bg-[#252b42] transition-colors"
              >
                {getSelectedMonthLabel()}
                <Calendar size={16} className="text-slate-400" />
              </div>
              {isMonthOpen && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#151c2c] border border-[#3b82f6] rounded-lg shadow-2xl overflow-hidden z-50">
                      {monthOptions.map((opt, i) => (
                          <div 
                              key={i} 
                              onClick={() => { setSelectedMonth(opt.m); setSelectedYear(opt.y); setIsMonthOpen(false); }}
                              className="px-4 py-2.5 text-sm text-slate-200 hover:bg-[#3b82f6] hover:text-white cursor-pointer transition-colors"
                          >
                              {opt.label}
                          </div>
                      ))}
                  </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-[200px] filter-dropdown relative">
              <label className="text-[11px] font-bold text-white tracking-wide">Filter Data</label>
              <div 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full bg-[#1e2336] border border-[#3b82f6] text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center justify-between cursor-pointer hover:bg-[#252b42] transition-colors"
              >
                {filterStatus}
                <div className="flex items-center gap-2">
                    <div className="w-px h-4 bg-slate-600"></div>
                    <ChevronDown size={16} className="text-sky-400" />
                </div>
              </div>
              {isFilterOpen && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#151c2c] border border-[#3b82f6] rounded-lg shadow-2xl overflow-hidden z-50">
                      {['All', 'Approved', 'Pending', 'Rejected', 'Not Submitted'].map((sts) => (
                          <div 
                              key={sts} 
                              onClick={() => { setFilterStatus(sts); setIsFilterOpen(false); }}
                              className="px-4 py-2.5 text-sm text-slate-200 hover:bg-[#3b82f6] hover:text-white cursor-pointer transition-colors"
                          >
                              {sts}
                          </div>
                      ))}
                  </div>
              )}
            </div>

            <div className="flex-1 hidden md:block"></div>

            <div className="flex flex-col gap-1.5 min-w-[300px] relative">
              <label className="text-[11px] font-bold text-emerald-400 tracking-wide text-right">Select User</label>
              <CustomUserSelect users={users} selectedUser={selectedUser} onChange={(id) => setSelectedUser(id)} />
            </div>
          </div>
        </div>

        <div className="bg-[#151c2c] rounded-t-lg border border-slate-800/50 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-[#1e2336] border-b border-slate-800/80">
            <div className="flex items-center gap-6 overflow-x-auto">
              <div className="flex items-center gap-2 shrink-0"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[12px] font-bold text-slate-300">Approved</span></div>
              <div className="flex items-center gap-2 shrink-0"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-[12px] font-bold text-slate-300">Rejected</span></div>
              <div className="flex items-center gap-2 shrink-0"><div className="w-3 h-3 rounded-full bg-sky-500"></div><span className="text-[12px] font-bold text-slate-300">Pending</span></div>
              <div className="flex items-center gap-2 shrink-0"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-[12px] font-bold text-slate-300">Not Submitted</span></div>
            </div>
            
            <div className="hidden md:flex flex-col justify-end">
               <button className="flex items-center justify-center gap-2 bg-[#0b0f19] border border-slate-700/60 rounded-full px-4 py-2 text-[12px] font-bold text-slate-300 hover:text-white hover:border-sky-500/50 transition-colors">
                 Actions <SettingsIcon size={14} className="text-sky-400" />
               </button>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-[1200px] w-full text-left border-collapse relative">
              <thead>
                <tr className="bg-[#242b42] border-b border-slate-700/50">
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-center w-16">Sr no.</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300">Date ↑</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300">Day</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300">Area Type</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300">Work Areas</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Travel</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Food</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Hotel</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Ticket</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Daily</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Misc.</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-right">Total ↑</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300">Remarks</th>
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-center sticky right-0 bg-[#242b42] z-30 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {expenses.daysArr.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#1e2336] transition-colors group">
                    <td className="p-4 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{item.date}</td>
                    <td className="p-4 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10">{item.fullDateStr}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 bg-slate-800/10 border-r border-slate-700/30">{item.day}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{item.badge || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 border-r border-slate-700/30 max-w-[150px] truncate">{item.workArea || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.travel || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.food || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.hotel || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.ticket || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.daily || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{item.misc || '-'}</td>
                    <td className="p-4 text-[13px] font-black text-sky-400 text-right border-r border-slate-700/30">{item.total || '-'}</td>
                    <td className="p-4 text-[12px] font-medium text-slate-400 max-w-[150px] truncate" title={item.dayRemarks}>{item.dayRemarks || '-'}</td>
                    <td className="p-3 text-center sticky right-0 bg-[#151c2c] group-hover:bg-[#1e2336] transition-colors z-30 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)] cursor-pointer">
                      {item.day !== 'SUN' && (
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="text-slate-400 hover:text-sky-400 p-2 transition-all inline-flex items-center justify-center active:scale-95"
                        >
                          {item.total ? <Eye size={16} /> : <Edit2 size={16} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* MEDORN STYLE TOTALS ROW */}
                <tr className="bg-[#242b42] font-bold group border-t-2 border-sky-500">
                    <td colSpan={5} className="p-4 text-center text-sky-400 text-[14px]">Total</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.travel || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.food || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.hotel || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.ticket || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.daily || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right">{expenses.totals.misc || '0'}</td>
                    <td className="p-4 text-sky-400 text-[14px] text-right border-r border-slate-700/30">{expenses.totals.total || '0'}</td>
                    <td className="p-4 bg-transparent border-r border-slate-700/30"></td>
                    <td className="p-4 bg-[#242b42] sticky right-0 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.2)] border-l border-slate-700/50"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* STATIC BLOCKS BELOW TABLE (MATCHING MEDORN) */}
        <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-6">
                    <span className="text-[12px] font-bold text-slate-400 flex items-center gap-2 cursor-pointer hover:text-white"><ChevronDown size={14} className="rotate-90"/> Prev</span>
                    <span className="text-[12px] font-bold text-white px-2 py-1 rounded">Page 1 of 1</span>
                    <span className="text-[12px] font-bold text-slate-400 flex items-center gap-2 cursor-pointer hover:text-white">Next <ChevronDown size={14} className="-rotate-90"/></span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 bg-[#1e2336] p-4 rounded-xl border border-slate-700/50 shadow-md w-full md:flex-1">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <DollarSign size={20} className="text-amber-400" />
                    </div>
                    <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Pending Expense</p>
                    <p className="text-[18px] font-black text-amber-400 leading-none">,1 {expenses.pending}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-[#1e2336] p-4 rounded-xl border border-slate-700/50 shadow-md w-full md:flex-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Approved Expense</p>
                    <p className="text-[18px] font-black text-emerald-400 leading-none">,1 {expenses.approved}</p>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* MODAL */}
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
