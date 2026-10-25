import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle } from 'lucide-react';

function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0') + '-' + parts[0];
  }
  try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
      }
  } catch (e) {}
  return dateStr;
}

export default function ExpenseApproval({ items, fetchPending, fetchCounts, selectedModule }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [detailedMonthData, setDetailedMonthData] = useState<{employeeId: string, month: string, year: string, name: string} | null>(null);
  
  // Users for dropdown
  const users = useMemo(() => {
    const map = new Map();
    items.forEach((i: any) => {
      const name = i.employeeName || i.employeeEmail || i.employeeId;
      if (!map.has(i.employeeId)) map.set(i.employeeId, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Group by Employee + Date
  const dayWiseData = useMemo(() => {
    const grouped: Record<string, any> = {};
    items.forEach((i: any) => {
      if (selectedUser && i.employeeId !== selectedUser) return;
      const key = `${i.employeeId}_${formatDDMMYYYY(i.date)}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: i.employeeId,
          employeeName: i.employeeName || i.employeeEmail || i.employeeId,
          designation: i.designation || '-',
          reportingManager: i.reportingManager || '-',
          date: i.date,
          areaType: i.areaType || 'Out-Station',
          travel: 0, food: 0, hotel: 0, ticket: 0, daily: 0, misc: 0, total: 0,
          remarks: i.remarks || '',
          workAreas: i.workAreas || '-'
        };
      }
      const amt = parseFloat(i.amount) || 0;
      grouped[key].total += amt;
      const cat = (i.category || '').toLowerCase();
      if (cat.includes('travel')) grouped[key].travel += amt;
      else if (cat.includes('food')) grouped[key].food += amt;
      else if (cat.includes('hotel')) grouped[key].hotel += amt;
      else if (cat.includes('ticket')) grouped[key].ticket += amt;
      else if (cat.includes('da') || cat.includes('daily')) grouped[key].daily += amt;
      else grouped[key].misc += amt;
      if (i.remarks && !grouped[key].remarks) grouped[key].remarks = i.remarks;
    });
    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, selectedUser]);

  // Group by Employee + Month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, any> = {};
    dayWiseData.forEach((d: any) => {
      const dt = new Date(d.date);
      const month = dt.toLocaleString('default', { month: 'long' });
      const year = dt.getFullYear().toString();
      const key = `${d.employeeId}_${month}_${year}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: d.employeeId,
          name: d.employeeName,
          month, year,
          designation: d.designation || '-',
          reportingManager: d.reportingManager || '-',
          days: []
        };
      }
      grouped[key].days.push(d);
    });
    return Object.values(grouped);
  }, [dayWiseData]);

  const handleAction = async (action: string, record: any) => {
    let finalRemarks = record.remarks || '';
    if (action === 'Rejected') {
        const reason = window.prompt("Please enter the reason for rejection (this will be shown to the employee):");
        if (reason === null) return; // Cancelled
        if (!reason.trim()) {
            alert("A rejection reason is mandatory.");
            return;
        }
        finalRemarks = reason.trim();
    }

    try {
      const res = await axios.post('/api/xl/approvals/action', {
        type: 'ExpenseGroup',
        action,
        employeeId: record.employeeId,
        date: record.date,
        remarks: finalRemarks,
        approvedBy: (JSON.parse(localStorage.getItem('user') || '{}').employeeId || JSON.parse(localStorage.getItem('user') || '{}').uid || 'Admin')
      });
      if (res.data.success) {
        fetchPending();
        fetchCounts();
      } else {
        alert(res.data.message || 'Action failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  if (detailedMonthData) {
    const activeMonthDays = monthlyData.find((m: any) => m.employeeId === detailedMonthData.employeeId && m.month === detailedMonthData.month && m.year === detailedMonthData.year)?.days || [];
    
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
         <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-4">
               <button onClick={() => setDetailedMonthData(null)} className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors">
                  <ChevronLeft size={16} /> MONTHLY EXPENSE: {detailedMonthData.name} ({detailedMonthData.month} {detailedMonthData.year})
               </button>
               <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                 {activeMonthDays.length} {activeMonthDays.length === 1 ? 'Entry' : 'Entries'}
               </span>
               <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
               </div>
            </div>
         </div>

         {/* Detailed Month Excel Grid */}
         <div className="flex-1 overflow-auto custom-scrollbar bg-[#151c2c]">
            <table className="w-full text-left border-collapse relative">
              <thead>
                <tr className="bg-[#242b42] border-b border-slate-700/50 sticky top-0 z-20 shadow-sm">
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 text-center w-14 border-r border-slate-700/50">Sr no.</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date ↑</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Day</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Area Type</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Work Areas</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Travel</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Food</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Hotel</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Ticket</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Daily</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Misc.</th>
                  <th className="p-3.5 text-[11px] font-bold text-sky-400 uppercase tracking-wider border-r border-slate-700/50 text-right">Total ↑</th>
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {activeMonthDays.length === 0 ? (
                  <tr><td colSpan={13} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Expense Records</td></tr>
                ) : activeMonthDays.map((d: any, idx: number) => {
                  const dt = new Date(d.date);
                  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
                  return (
                    <tr key={formatDDMMYYYY(d.date)} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap bg-slate-800/10 border-r border-slate-700/30">{formatDDMMYYYY(d.date)}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{dayName}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.areaType}</td>
                      <td className="p-3 text-[13px] text-sky-400 border-r border-slate-700/30">{d.workAreas}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.travel || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.food || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.hotel || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.ticket || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.daily || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.misc || 0}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30 text-right font-mono">{d.total}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAction('Approved', d)} className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Approve">
                            <CheckCircle size={15} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleAction('Rejected', d)} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reject">
                            <XCircle size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#151c2c] relative">
       {/* Top Control Bar */}
       <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#1e2336] border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <h1 className="text-sm font-black text-white uppercase tracking-wider">APPROVE {selectedModule}</h1>
             </div>
             <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
               {isMonthlyView ? monthlyData.length : dayWiseData.length} {((isMonthlyView ? monthlyData.length : dayWiseData.length) === 1) ? 'Entry' : 'Entries'}
             </span>
             {/* Status Legend Pills */}
             <div className="hidden lg:flex items-center gap-4 ml-2 border-l border-slate-700/50 pl-4">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-300">Approved</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-300">Rejected</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div><span className="text-[11px] font-bold text-slate-300">Pending</span></div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Monthly View Toggle Switch */}
            <div 
              onClick={() => setIsMonthlyView(!isMonthlyView)} 
              className="flex items-center gap-2 bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isMonthlyView ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isMonthlyView ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-xs font-bold text-slate-300">Monthly Expense</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide hidden sm:inline">User:</span>
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)} 
                className="bg-[#0b0f19] border border-slate-700/60 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-sky-500"
              >
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
       </div>

       {/* Full Width Excel Grid Table */}
       <div className="flex-1 overflow-auto custom-scrollbar bg-[#151c2c] p-3 md:p-0">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden space-y-3 mb-6">
             {isMonthlyView ? (
               monthlyData.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly Expenses</div>
               ) : monthlyData.map((m: any) => (
                 <div key={`${m.employeeId}_${m.month}`} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-sky-400">{m.name}</span>
                       <span className="text-[10px] font-black uppercase bg-slate-700/80 text-white px-2 py-0.5 rounded">{m.month} {m.year}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                       <span>{m.designation}</span> • <span className="text-slate-300">Manager: {m.reportingManager}</span>
                    </div>
                    <button 
                      onClick={() => setDetailedMonthData({employeeId: m.employeeId, month: m.month, year: m.year, name: m.name})}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-sky-600/20 border border-sky-500/40 text-sky-300 rounded-lg text-xs font-bold active:scale-95 transition-all"
                    >
                       <Eye size={14} /> View Month Breakdown
                    </button>
                 </div>
               ))
             ) : (
               dayWiseData.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Daily Expenses</div>
               ) : dayWiseData.map((d: any, idx: number) => (
                 <div key={`${d.employeeId}_${formatDDMMYYYY(d.date)}`} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded">#{idx + 1}</span>
                          <span className="text-xs font-bold text-sky-400">{d.employeeName}</span>
                       </div>
                       <span className="text-base font-black text-emerald-400 font-mono">₹{d.total}</span>
                    </div>

                    <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40 text-xs space-y-1.5">
                       <div className="flex items-center justify-between text-slate-300">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Date:</span>
                          <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{formatDDMMYYYY(d.date)}</span>
                       </div>
                       <div className="flex items-center justify-between text-slate-300">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Area Type:</span>
                          <span className="text-slate-200">{d.areaType || 'Out-Station'}</span>
                       </div>
                       {/* Mini expense chips */}
                       <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px]">
                          {d.travel > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Travel: ₹{d.travel}</span>}
                          {d.daily > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">DA: ₹{d.daily}</span>}
                          {d.hotel > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Hotel: ₹{d.hotel}</span>}
                          {d.food > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Food: ₹{d.food}</span>}
                          {d.ticket > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Ticket: ₹{d.ticket}</span>}
                          {d.misc > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Misc: ₹{d.misc}</span>}
                       </div>
                       {d.remarks && (
                          <div className="text-slate-400 pt-1 text-[11px] italic">
                             Remarks: {d.remarks}
                          </div>
                       )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                       <button
                         onClick={() => handleAction('Approved', d)}
                         className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                       >
                         <CheckCircle size={14} /> Approve
                       </button>
                       <button
                         onClick={() => handleAction('Rejected', d)}
                         className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                       >
                         <XCircle size={14} /> Reject
                       </button>
                    </div>
                 </div>
               ))
             )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse relative">
              <thead>
                <tr className="bg-[#242b42] border-b border-slate-700/50 sticky top-0 z-20 shadow-sm">
                  <th className="p-3.5 text-[11px] font-bold text-slate-300 text-center w-14 border-r border-slate-700/50">Sr no.</th>
                  {isMonthlyView ? (
                    <>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Month ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Year ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Name ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Designation ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Reporting Manager</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-16">View</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Employee Name ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Date ↑</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Area Type</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Travel</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Food</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Hotel</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Ticket</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Daily</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50 text-right">Misc.</th>
                      <th className="p-3.5 text-[11px] font-bold text-sky-400 uppercase tracking-wider border-r border-slate-700/50 text-right">Total</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700/50">Remarks</th>
                      <th className="p-3.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center w-24">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {isMonthlyView ? (
                  monthlyData.length === 0 ? (
                    <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly Expenses</td></tr>
                  ) : monthlyData.map((m: any, idx: number) => (
                    <tr key={`${m.employeeId}_${m.month}`} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-white capitalize bg-slate-800/10 border-r border-slate-700/30 whitespace-nowrap">{m.month}</td>
                      <td className="p-3 text-[13px] font-medium text-slate-300 border-r border-slate-700/30">{m.year}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30">{m.name}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{m.designation}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{m.reportingManager}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setDetailedMonthData({employeeId: m.employeeId, month: m.month, year: m.year, name: m.name})} className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                          <Eye size={16} strokeWidth={2.5}/>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  dayWiseData.length === 0 ? (
                    <tr><td colSpan={13} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Daily Expenses</td></tr>
                  ) : dayWiseData.map((d: any, idx: number) => (
                    <tr key={`${d.employeeId}_${formatDDMMYYYY(d.date)}`} className="hover:bg-[#1e2336] transition-colors border-b border-slate-700/30 group">
                      <td className="p-3 text-[13px] font-semibold text-slate-400 text-center bg-slate-800/10 border-r border-slate-700/30">{idx + 1}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 bg-slate-800/10 border-r border-slate-700/30">{d.employeeName}</td>
                      <td className="p-3 text-[13px] font-bold text-white whitespace-nowrap border-r border-slate-700/30">{formatDDMMYYYY(d.date)}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30">{d.areaType}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.travel || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.food || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.hotel || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.ticket || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.daily || 0}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 text-right font-mono">{d.misc || 0}</td>
                      <td className="p-3 text-[13px] font-bold text-sky-400 border-r border-slate-700/30 text-right font-mono">{d.total}</td>
                      <td className="p-3 text-[13px] text-slate-300 border-r border-slate-700/30 truncate max-w-[150px]">{d.remarks}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAction('Approved', d)} className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Approve">
                            <CheckCircle size={15} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleAction('Rejected', d)} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reject">
                            <XCircle size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}
