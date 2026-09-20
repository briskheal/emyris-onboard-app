import { useState, useEffect, useMemo, } from 'react';

import { ArrowLeft, CheckCircle2, DollarSign, Settings as SettingsIcon, X, Info, ChevronDown, Calendar, PlusCircle, Trash2, Camera , Edit2 , ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  console.log(holidays);
  const [tpEntries, setTpEntries] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    if (isModalOpen) {
      setCalMonth(selectedMonth - 1);
      setCalYear(selectedYear);
    }
  }, [isModalOpen, selectedMonth, selectedYear]);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const [foodAmt, setFoodAmt] = useState(0);
  const [ticketAmt, setTicketAmt] = useState(0);
  const [hotelAmt, setHotelAmt] = useState(0);
  const [dailyAmt, setDailyAmt] = useState(0);
  const [miscAmt, setMiscAmt] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);

  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  
  const [isVoucherPreviewOpen, setIsVoucherPreviewOpen] = useState(false);
  const [previewVoucherUrl, setPreviewVoucherUrl] = useState('');

  

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.month-dropdown')) setIsMonthOpen(false);
      if (!target.closest('.filter-dropdown')) setIsFilterOpen(false);
      if (!target.closest('.actions-dropdown')) setIsActionsOpen(false);
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

  const fetchExpenses = async () => {
    if (!selectedUser) return;
    try {
      const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' });
      const [expRes, tpRes, holRes] = await Promise.all([
        axios.get(`/api/xl/expense/my?email=${selectedUser}`),
        axios.get(`/api/xl/tour-program/my?email=${selectedUser}&month=${monthLabel}&year=${selectedYear}`),
        axios.get('/api/xl/settings/holidays')
      ]);
      const holidayMap: Record<string, string> = {};
      if (holRes.data.success) {
        // Need user state. Let's find user object from users list
        const activeUser = users.find((u:any) => u.employeeId === selectedUser);
        holRes.data.data.forEach((h: any) => {
          if (h.type === 'National' || h.state === activeUser?.state) {
            const hd = new Date(h.date);
            holidayMap[`${hd.getFullYear()}-${String(hd.getMonth()+1).padStart(2,'0')}-${String(hd.getDate()).padStart(2,'0')}`] = h.title;
          }
        });
      }
      setHolidays(holidayMap);
      if (expRes.data.success) setRawExpenses(expRes.data.data || []);
      
      let parsed = [];
      if (tpRes.data.success && tpRes.data.data && tpRes.data.data.status === 'Approved') {
        try { parsed = JSON.parse(tpRes.data.data.entries || '[]'); } catch(e){}
      }
      if (!Array.isArray(parsed)) parsed = Object.values(parsed);
      setTpEntries(parsed);
    } catch (e) {}
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedUser, selectedMonth, selectedYear]);

  const expenses = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysArr: any[] = [];
    
    let pending = 0;
    let approved = 0;
    
    // Summary totals
    let sumTravel = 0, sumFood = 0, sumHotel = 0, sumTicket = 0, sumDaily = 0, sumMisc = 0, sumTotal = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(selectedYear, selectedMonth - 1, i);
      const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][dt.getDay()];
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const fullDateStr = `${i} ${dt.toLocaleString('default', { month: 'short' })} ${selectedYear}`;

      const dayExps = rawExpenses.filter((e: any) => e.date === dateStr);
      
      let travel = 0, food = 0, hotel = 0, ticket = 0, daily = 0, misc = 0, total = 0;
      let workArea = '';
      let workAreaType = 'Out-Station';
      const tp = tpEntries.find(t => {
         try { return new Date(t.date).toISOString().split('T')[0] === dateStr; } catch(x){ return t.date === dateStr; }
      });
      if (tp) {
         workArea = tp.toMarket || tp.workingArea || '';
         workAreaType = tp.type || tp.workAreaType || 'Out-Station';
      }
      
      let status = '';

      dayExps.forEach((e: any) => {
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
        workAreaType,
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

  // Auto fetch limits when Admin selects a date on the calendar
  useEffect(() => {
    if (expenseDate && selectedUser && expenses?.daysArr) {
      const dayData = expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate);
      if (dayData && !dayData.holidayName && !dayData.isSunday) {
         const currentType = dayData.workAreaType || 'Out-Station';
         const toMarket = dayData.workArea || dayData.toMarket || '';
         axios.get(`/api/xl/expense/limits?email=${selectedUser}&date=${expenseDate}&workAreaType=${encodeURIComponent(currentType)}&toMarket=${encodeURIComponent(toMarket)}`)
           .then(res => {
              if (res.data.success) {
                 setDailyAmt(res.data.dailyAllowance || 0);
                 setTicketAmt(res.data.travelAllowance || 0);
              }
           })
           .catch(() => { setDailyAmt(0); setTicketAmt(0); });
      }
    }
  }, [expenseDate, selectedUser, expenses]);

  const handleExportExcel = async () => {
    if (!expenses || !expenses.daysArr) return;

    // Fetch DCRs to get Total Calls per day
    let dcrMap: Record<string, number> = {};
    try {
       const res = await axios.get(`/api/xl/dcr/monthly?email=${selectedUser}&month=${selectedMonth}&year=${selectedYear}`);
       if (res.data.success) {
          res.data.data.forEach((dcr: any) => {
             dcrMap[dcr.date] = (dcrMap[dcr.date] || 0) + 1;
          });
       }
    } catch(e) { console.error(e); }

    let maxImages = 0;
    expenses.daysArr.forEach((item: any) => {
        const rawUrls = item.rawExps?.map((ex: any) => ex.receiptImage || ex.voucherUrl).filter(Boolean) || [];
        const allUrls = rawUrls.flatMap((s: string) => s.split(',')).filter(Boolean);
        const uniqueUrls = Array.from(new Set(allUrls));
        if (uniqueUrls.length > maxImages) maxImages = uniqueUrls.length;
    });

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
    const declaration = `This is to declare that the daily allowance as claimed for the month of ${monthName} are out of pocket expenses such as parking, snacks, stationary and other such expenses for which bills are not available.`;

    const wsData: any[][] = [];
    wsData.push([declaration]); // Row 1
    wsData.push([]);            // Row 2

    const headers = ['Date', 'Day', 'Area Type', 'Working Type', 'Total Calls', 'Work Areas', 'Travel', 'Food', 'Hotel', 'Ticket', 'Daily', 'Misc', 'Total', 'Remarks', 'Admin/Manager Remarks'];
    for (let i = 1; i <= maxImages; i++) {
        headers.push(`Image ${i}`);
    }
    wsData.push(headers);

    expenses.daysArr.forEach((item: any) => {
        const rawUrls = item.rawExps?.map((ex: any) => ex.receiptImage || ex.voucherUrl).filter(Boolean) || [];
        const allUrls = rawUrls.flatMap((s: string) => s.split(',')).filter(Boolean);
        const uniqueUrls = Array.from(new Set(allUrls));

        const totalCalls = dcrMap[item.dateStr] || 0;
        
        // Derive Working Type
        let workingType = 'Out-Station'; 
        if (item.workAreaType === 'HQ' || item.workAreaType === 'Local') workingType = 'Working';
        else if (item.workAreaType === 'Out-Station') workingType = 'Working';
        else if (item.workAreaType === 'Ex-Station' || item.workAreaType === 'Ex-Mkt') workingType = 'Meeting';
        else workingType = item.workAreaType || 'Working';

        const row: any[] = [
            item.fullDateStr || item.dateStr,
            item.day || '',
            item.workAreaType || 'Out-Station',
            workingType,
            totalCalls > 0 ? totalCalls : '',
            item.workArea || '',
            item.travel || 0,
            item.food || 0,
            item.hotel || 0,
            item.ticket || 0,
            item.daily || 0,
            item.misc || 0,
            item.total || 0,
            item.dayRemarks || '',
            item.rawExps?.[0]?.adminRemarks || ''
        ];

        for (let i = 0; i < maxImages; i++) {
            if (i < uniqueUrls.length) {
                const rawUrl = uniqueUrls[i] as string;
                let finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://emyrishr.in${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                // Use the force download endpoint
                if (finalUrl.includes('emyrishr.in/uploads')) {
                    const justPath = finalUrl.split('emyrishr.in')[1];
                    finalUrl = `https://emyrishr.in/api/xl/download?file=${encodeURIComponent(justPath)}`;
                }
                row.push({ t: 's', v: '⬇ Down', l: { Target: finalUrl } });
            } else {
                row.push('');
            }
        }
        wsData.push(row);
    });

    // Append the total row
    const totalRow = [
      'Total', '', '', '', '', '',
      expenses.totals.travel || 0,
      expenses.totals.food || 0,
      expenses.totals.hotel || 0,
      expenses.totals.ticket || 0,
      expenses.totals.daily || 0,
      expenses.totals.misc || 0,
      expenses.totals.total || 0,
      '', ''
    ];
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Merge Row 1 across all columns
    ws['!merges'] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } } ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const monthNameShort = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' });
    const uInfo = users.find(u => u.employeeId === selectedUser);
    const userName = uInfo ? (uInfo.name || uInfo.employeeId) : selectedUser;
    const fileName = `Expense_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthNameShort}_${selectedYear}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };
  
  const handleSubmitExpense = async () => {
    if (!expenseDate || !selectedUser) return;
    
    const dayData = expenses?.daysArr?.find((e: any) => e.dateStr === expenseDate);
    const workAreaType = dayData?.workAreaType || 'Out-Station';
    const isLocalOrEx = workAreaType === 'Local' || workAreaType === 'HQ' || workAreaType === 'Ex-Station' || workAreaType === 'Ex-Mkt';

    if (!voucherFile && !selectedExpense && (Number(miscAmt) > 0 || (Number(ticketAmt) > 0 && !isLocalOrEx))) {
       alert("Miscellaneous or Manual claims need support vouchers (image uploads) for approval.");
       return;
    }

    setSubmitting(true);
    
    try {
        let finalImageUrl = '';
        
        // Check if there are existing records for this date (either being edited directly, or selected via calendar)
        const existingData = selectedExpense || dayData;
        
        if (existingData && existingData.rawExps && existingData.rawExps.length > 0) {
            // Extract old images and deduplicate to preserve them
            const rawUrls = existingData.rawExps.map((ex: any) => ex.receiptImage || ex.voucherUrl).filter(Boolean) || [];
            const allUrls = rawUrls.flatMap((s: string) => s.split(',')).filter(Boolean);
            finalImageUrl = Array.from(new Set(allUrls)).join(',');
            
            // Soft delete old records for this specific date to replace them completely and prevent doubling
            await axios.delete(`/api/xl/expense?email=${selectedUser}&date=${expenseDate}&preserveFiles=true`);
        }

        // Upload new file if provided
        if (voucherFile) {
            const formData = new FormData();
            formData.append('file', voucherFile);
            const upRes = await axios.post('/api/upload', formData); // Correct generic image upload endpoint
            if (upRes.data.success && upRes.data.url) {
                // If a new file is uploaded, overwrite the old images
                finalImageUrl = upRes.data.url;
            }
        }

        const submits = [];
        const base = { employeeId: selectedUser, date: expenseDate, remarks, status: 'Pending', receiptImage: finalImageUrl };

        if (foodAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Food', amount: foodAmt }));
        if (ticketAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Ticket', amount: ticketAmt }));
        if (hotelAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Hotel', amount: hotelAmt }));
        if (dailyAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Daily', amount: dailyAmt }));
        if (miscAmt > 0) submits.push(axios.post('/api/xl/expense', { ...base, category: 'Misc', amount: miscAmt }));

        if (submits.length > 0) {
            await Promise.all(submits);
            fetchExpenses();
        }
    } catch (e) {
        console.error("Failed to submit expenses", e);
        alert("An error occurred while saving the expense.");
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
                      {monthOptions.map((opt: any, i: number) => (
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

              <div className="flex flex-col gap-1.5 mt-auto">
                  <button
                      onClick={handleExportExcel}
                      className="h-[42px] bg-[#1e271c] border border-emerald-500/50 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg px-5 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg whitespace-nowrap"
                  >
                      <Download size={16} />
                      Export to Excel
                  </button>
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
            
            {isModalOpen ? (
                <button onClick={() => { setIsModalOpen(false); setSelectedExpense(null); }} className="text-rose-500 hover:text-white transition-colors bg-rose-500/10 hover:bg-rose-500 p-1.5 rounded-full border border-rose-500/50 active:scale-95 shrink-0">
                  <X size={16} strokeWidth={2.5} />
                </button>
              ) : isDeleteMode ? (
                <div className="hidden md:flex gap-2 items-center shrink-0 z-40">
                   <button onClick={() => { setIsDeleteMode(false); setSelectedForDelete([]); }} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-full text-[12px] font-bold transition-colors">Cancel</button>
                   <button onClick={async () => {
                      if (selectedForDelete.length === 0) { setIsDeleteMode(false); return; }
                      setSubmitting(true);
                      try {
                        await Promise.all(selectedForDelete.map(d => axios.delete(`/api/xl/expense?email=${selectedUser}&date=${d}`)));
                        fetchExpenses();
                      } catch(e) {}
                      setSubmitting(false);
                      setIsDeleteMode(false);
                      setSelectedForDelete([]);
                   }} disabled={submitting} className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-full text-[12px] font-bold transition-colors shadow-[0_0_10px_rgba(225,29,72,0.5)]">
                     {submitting ? 'Deleting...' : `Confirm Delete (${selectedForDelete.length})`}
                   </button>
                </div>
              ) : (
                <div className="hidden md:flex flex-col justify-end relative actions-dropdown z-40 shrink-0">
                   <button 
                     onClick={() => setIsActionsOpen(!isActionsOpen)}
                     className="flex items-center justify-center gap-2 bg-[#0b0f19] border border-slate-700/60 rounded-full px-4 py-2 text-[12px] font-bold text-slate-300 hover:text-white hover:border-sky-500/50 transition-colors"
                   >
                     Actions <SettingsIcon size={14} className="text-sky-400" />
                   </button>
                   
                   {isActionsOpen && (
                      <div className="absolute top-[100%] right-0 mt-2 w-32 bg-[#151c2c] border border-slate-700 rounded-lg shadow-2xl overflow-hidden py-1">
                          <button 
                            onClick={() => { 
                              setIsActionsOpen(false); 
                              setSelectedExpense(null);
                              setExpenseDate(new Date().toISOString().split('T')[0]);
                              setFoodAmt(0); setTicketAmt(0); setHotelAmt(0); setDailyAmt(0); setMiscAmt(0); setRemarks(''); setVoucherFile(null);
                              setIsModalOpen(true); 
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] font-semibold text-slate-300 hover:bg-[#3b82f6] hover:text-white transition-colors flex items-center gap-2"
                          >
                            <PlusCircle size={14} /> Add
                          </button>
                          <button 
                              onClick={() => {
                                setIsActionsOpen(false);
                                setIsDeleteMode(true);
                                setSelectedForDelete([]);
                              }}
                              className="w-full text-left px-4 py-2 text-[13px] font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete Selected
                            </button>
                      </div>
                   )}
                </div>
              )}
            </div>

            {/* EXPANDED INLINE EXPENSE PANEL */}
            {isModalOpen && (
               <div className="bg-[#151c2c] p-6 border-b-4 border-slate-800 flex flex-col gap-6 shadow-inner">
                  {/* Top: Working Area Info */}
                  <div className="flex gap-16 border-b border-emerald-500/80 pb-4">
                     <div>
                        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Working Area Type</label>
                        <div className="text-[13px] font-bold text-slate-200">
                           {expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate)?.workAreaType || (expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate)?.holidayName ? 'Holiday' : (expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate)?.isSunday ? 'Sunday' : 'Out-Station'))}
                        </div>
                     </div>
                     <div>
                        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Working Areas</label>
                        <div className="text-[13px] font-bold text-slate-200 truncate max-w-lg" title={expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate)?.workArea || '-'}>
                           {expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate)?.workArea || '-'}
                        </div>
                     </div>
                  </div>

                  {/* Middle: 2-Columns */}
                  <div className="flex flex-col md:flex-row gap-10">
                     
                     {/* Left: Calendar Block */}
                     <div className="w-full md:w-[45%] bg-[#1a2235] p-5 rounded-xl border border-slate-700/50 flex flex-col shadow-lg shadow-black/20">
                        <div className="flex justify-between items-center mb-6 px-2">
                           <button onClick={() => {
                               if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                               else { setCalMonth(calMonth - 1); }
                           }} className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors active:scale-95"><ChevronLeft size={16}/></button>
                           <span className="font-black text-slate-200 text-sm tracking-wide capitalize">
                              {new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}
                           </span>
                           <button onClick={() => {
                               if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                               else { setCalMonth(calMonth + 1); }
                           }} className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors active:scale-95"><ChevronRight size={16}/></button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-y-3 gap-x-1 mb-2">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                              <div key={d} className="text-center text-[11px] font-black text-slate-500 uppercase">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                            {(() => {
                              const days = [];
                              const firstDay = new Date(calYear, calMonth, 1).getDay();
                              const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                              
                              for(let i = 0; i < firstDay; i++) {
                                  days.push(<div key={`empty-${i}`} className="h-8"></div>);
                              }
                              
                              for(let d = 1; d <= daysInMonth; d++) {
                                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                  const isSelected = expenseDate === dateStr;
                                  
                                  days.push(
                                    <div 
                                      key={d} 
                                      onClick={() => setExpenseDate(dateStr)}
                                      className={`h-8 flex items-center justify-center rounded-full text-[13px] font-bold cursor-pointer transition-colors mx-1 ${isSelected ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'text-slate-300 hover:bg-slate-800'}`}
                                    >
                                      {d}
                                    </div>
                                  );
                              }
                              return days;
                            })()}
                        </div>
                     </div>

                     {/* Right: Input Fields */}
                     <div className="w-full md:w-[55%] flex flex-col gap-4">
                        {(() => {
                          const dayData = expenses.daysArr.find((e: any) => (e as any).dateStr === expenseDate);
                          const currentType = dayData?.workAreaType || (dayData?.holidayName ? 'Holiday' : (dayData?.isSunday ? 'Sunday' : 'Out-Station'));
                          const isLocal = (currentType === 'Local' || currentType === 'HQ');
                          const isExStation = (currentType === 'Ex-Station' || currentType === 'Ex-Mkt');
                          const isBlocked = (currentType === 'Holiday' || currentType === 'Sunday');
                          
                          if (isBlocked) {
                            return (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="text-rose-500 font-bold uppercase mb-2">{currentType}</div>
                                <div className="text-[13px]">{dayData?.holidayName || 'No Working Area Found'}</div>
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              {isExStation && (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2 w-[40%]">
                                      <label className="text-[13px] font-bold text-slate-300 whitespace-nowrap">Travel Allowance</label>
                                    </div>
                                    <div className="w-[60%]">
                                      <input type="number" value={ticketAmt || ''} onChange={(e: any) => setTicketAmt(parseFloat(e.target.value)||0)} readOnly={isExStation} className={"w-full bg-[#0b0f19]/50 border border-slate-700/80 text-white text-[13px] font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-sky-500/50" + (isExStation ? ' opacity-70 cursor-not-allowed' : '')} placeholder="0" />
                                    </div>
                                </div>
                              )}

                              {!isLocal && !isExStation && [
                                { label: 'Hotel Allowance', val: hotelAmt, set: setHotelAmt, icon: true },
                                { label: 'Food Allowance', val: foodAmt, set: setFoodAmt, icon: true },
                                { label: 'Ticket Allowance', val: ticketAmt, set: setTicketAmt, icon: true },
                              ].map((f, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2 w-[40%]">
                                      <label className="text-[13px] font-bold text-slate-300 whitespace-nowrap">{f.label}</label>
                                      {f.icon && <Edit2 size={12} className="text-sky-500/50 group-hover:text-sky-400 transition-colors" />}
                                    </div>
                                    <div className="w-[60%]">
                                      <input type="number" value={f.val || ''} onChange={(e: any) => f.set(parseFloat(e.target.value)||0)} readOnly={(f as any).readOnly} className={"w-full bg-[#0b0f19]/50 border border-slate-700/80 text-white text-[13px] font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-sky-500/50" + ((f as any).readOnly ? ' opacity-70 cursor-not-allowed' : '')} placeholder="0" />
                                    </div>
                                </div>
                              ))}

                              <div className="flex items-center justify-between group">
                                  <div className="flex items-center gap-2 w-[40%]">
                                    <label className="text-[13px] font-bold text-slate-300 whitespace-nowrap">Vehicle Type</label>
                                    <Edit2 size={12} className="text-sky-500/50 group-hover:text-sky-400 transition-colors" />
                                  </div>
                                  <div className="w-[60%]">
                                    <select className="w-full bg-[#0b0f19]/50 border border-slate-700/80 text-white text-[13px] font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500/50 appearance-none">
                                        <option className="bg-[#151c2c]">2-Wheeler</option>
                                        <option className="bg-[#151c2c]">4-Wheeler</option>
                                        <option className="bg-[#151c2c]">Public Transport</option>
                                    </select>
                                  </div>
                              </div>

                              {[
                                { label: 'Daily Allowance', val: dailyAmt, set: setDailyAmt, icon: false, readOnly: isLocal || isExStation },
                                { label: 'Miscellaneous Expense', val: miscAmt, set: setMiscAmt, icon: false, readOnly: false },
                              ].map((f, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2 w-[40%]">
                                      <label className="text-[13px] font-bold text-slate-300 whitespace-nowrap">{f.label}</label>
                                      {f.icon && <Edit2 size={12} className="text-sky-500/50 group-hover:text-sky-400 transition-colors" />}
                                    </div>
                                    <div className="w-[60%]">
                                      <input type="number" value={f.val || ''} onChange={(e: any) => f.set(parseFloat(e.target.value)||0)} className="w-full bg-[#0b0f19]/50 border border-slate-700/80 text-white text-[13px] font-bold rounded-lg px-4 py-2 focus:outline-none focus:border-sky-500/50" placeholder="0" />
                                    </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}

                        <div className="flex items-center justify-between mt-1 group">
                            <div className="w-[40%]">
                              <label className="text-[13px] font-bold text-slate-300 whitespace-nowrap">Upload An Image</label>
                            </div>
                            <div className="w-[60%] flex items-center">
                              <label className="w-full bg-[#0b0f19]/50 border border-slate-700/80 text-slate-400 text-[12px] font-bold rounded-lg px-4 py-2 cursor-pointer hover:border-sky-500/60 flex items-center justify-between transition-colors">
                                  <span className="truncate pr-4">{voucherFile ? voucherFile.name : 'No file chosen'}</span>
                                  <span className="bg-slate-700 text-white px-3 py-1 rounded text-[10px] shrink-0 uppercase tracking-widest">Choose File</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={(e: any) => setVoucherFile(e.target.files?.[0] || null)} />
                              </label>
                            </div>
                        </div>
                     </div>
                  </div>

                  {/* Bottom: Remarks & Submit */}
                  <div className="flex flex-col md:flex-row gap-10 mt-2">
                     <div className="w-full md:w-[60%]">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Remarks</label>
                        <textarea rows={1} value={remarks} onChange={(e: any) => setRemarks(e.target.value)} className="w-full bg-[#0b0f19]/50 border border-slate-700/80 text-white rounded-lg px-4 py-2.5 text-[13px] font-medium focus:border-sky-500/50 outline-none resize-none placeholder:text-slate-600" placeholder="Enter Remarks"></textarea>
                     </div>
                     <div className="w-full md:w-[40%] flex items-end justify-end">
                        <button 
                          onClick={handleSubmitExpense} 
                          disabled={submitting} 
                          className="bg-transparent hover:bg-sky-500 border border-sky-500 text-sky-400 hover:text-white text-[13px] font-bold px-10 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest active:scale-95"
                        >
                          {submitting ? 'Submitting...' : 'Submit Expense'}
                        </button>
                     </div>
                  </div>
               </div>
            )}

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
                  <th className="p-4 text-[11px] font-bold text-slate-300 text-center sticky right-0 bg-[#242b42] z-30 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">{isDeleteMode ? 'Select' : 'View'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {expenses.daysArr.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#1e2336] transition-colors group">
                    <td className="p-4 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{(item as any).date}</td>
                    <td className="p-4 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10">{(item as any).fullDateStr}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 bg-slate-800/10 border-r border-slate-700/30">{(item as any).day}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{(item as any).badge || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 border-r border-slate-700/30 max-w-[150px] truncate">{(item as any).workArea || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).travel || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).food || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).hotel || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).ticket || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).daily || '-'}</td>
                    <td className="p-4 text-[13px] font-medium text-slate-300 text-right border-r border-slate-700/30">{(item as any).misc || '-'}</td>
                    <td className="p-4 text-[13px] font-black text-sky-400 text-right border-r border-slate-700/30">{(item as any).total || '-'}</td>
                    <td className="p-4 text-[12px] font-medium text-slate-400 max-w-[150px] truncate" title={(item as any).dayRemarks}>{(item as any).dayRemarks || '-'}</td>
                    <td className="p-3 text-center sticky right-0 bg-[#151c2c] group-hover:bg-[#1e2336] transition-colors z-30 border-l border-slate-700/50 shadow-[-4px_0_10px_rgba(0,0,0,0.2)] cursor-pointer flex items-center justify-center gap-2 h-full min-h-[56px]">
                      {isDeleteMode ? (
                         ((item as any).total || 0) > 0 ? (
                           <input 
                             type="checkbox" 
                             checked={selectedForDelete.includes((item as any).dateStr)}
                             onClick={(e) => e.stopPropagation()}
                             onChange={(e) => {
                               if(e.target.checked) setSelectedForDelete(p => [...p, (item as any).dateStr]);
                               else setSelectedForDelete(p => p.filter(d => d !== (item as any).dateStr));
                             }}
                             className="w-4 h-4 cursor-pointer accent-rose-500 rounded border-slate-600"
                           />
                         ) : <span className="text-slate-600">-</span>
                      ) : (
                        <>
                          {((item as any).total || 0) > 0 && (
                            <button 
                              onClick={(e) => { 
  e.stopPropagation();  const rawUrls = (item as any).rawExps.map((ex: any) => ex.receiptImage || ex.voucherUrl).filter(Boolean);
  const allUrls = rawUrls.flatMap((s: string) => s.split(',')).filter(Boolean);
  const imgs = Array.from(new Set(allUrls)).join(',');
  setPreviewVoucherUrl(imgs);
  setIsVoucherPreviewOpen(true); 
}}
                              className="text-slate-400 hover:text-sky-400 p-2 transition-all inline-flex items-center justify-center active:scale-95 z-20 relative"
                              title="View Voucher"
                            >
                              <Camera size={18} />
                            </button>
                          )}
                        </>
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
                    <p className="text-[18px] font-black text-amber-400 leading-none">₹ {Number(expenses.pending || 0).toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-[#1e2336] p-4 rounded-xl border border-slate-700/50 shadow-md w-full md:flex-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Approved Expense</p>
                    <p className="text-[18px] font-black text-emerald-400 leading-none">₹ {Number(expenses.approved || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* VOUCHER PREVIEW MODAL */}
      {isVoucherPreviewOpen && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-start justify-center p-4 sm:p-8 overflow-y-auto transition-opacity">
            <div className="w-full max-w-3xl flex flex-col relative my-4 sm:my-8">
              <div className="sticky top-0 z-50 flex justify-between items-center mb-4 bg-[#151c2c]/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-lg">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Voucher Preview</h3>
                  <button onClick={() => setIsVoucherPreviewOpen(false)} className="text-white hover:text-red-400 transition-colors bg-slate-800 p-2 rounded-full border border-slate-600 hover:bg-slate-700 active:scale-95 shadow-md">
                    <X size={24} strokeWidth={2.5} />
                  </button>
              </div>
              <div className="bg-[#151c2c] rounded-xl overflow-y-auto border border-slate-700/50 shadow-2xl flex flex-col items-center min-h-[400px] p-6 gap-8">
                  {!previewVoucherUrl || previewVoucherUrl.split(',').filter(Boolean).length === 0 ? (
                      <div className="text-slate-500 font-bold uppercase tracking-widest my-auto">No Voucher Uploaded</div>
                  ) : (
                      previewVoucherUrl.split(',').filter(Boolean).map((url, i) => {
                          const isPdf = url.toLowerCase().endsWith('.pdf');
                          return (
                              <div key={i} className="w-full flex flex-col items-center bg-[#1e2738] p-4 rounded-lg border border-slate-700/50">
                                {isPdf ? (
                                    <iframe src={`${url}#view=FitH`} className="w-full h-[600px] rounded-lg border border-slate-700/50 bg-white" />
                                ) : (
                                    <img src={url} alt={`Voucher ${i+1}`} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
                                )}
                                <a href={url} target="_blank" rel="noreferrer" className="mt-4 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-sm hover:bg-emerald-500/20 transition-colors">
                                    Open File in New Tab
                                </a>
                              </div>
                          )
                      })
                  )}
              </div>
                    </div>
        </div>
      )}
    </div>
  );
}
