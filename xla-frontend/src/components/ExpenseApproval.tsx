import { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Eye, ChevronLeft, XCircle } from 'lucide-react';

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
      const key = `${i.employeeId}_${i.date}`;
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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
         <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
            <button onClick={() => setDetailedMonthData(null)} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider mb-4 hover:text-sky-300 transition-colors">
               <ChevronLeft size={20} /> MONTHLY EXPENSE VIEW: {detailedMonthData.name}
            </button>
            <div className="flex flex-wrap gap-6 items-center text-xs font-black uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Approved</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Rejected</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Pending</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Not Submitted</div>
            </div>
         </div>
         
         
         

         <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-[#3b3b5a] bg-[#1c1c2e]">
                       <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date ↑</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Area Type</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Areas</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Travel</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Food</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hotel</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ticket</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Daily</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Misc.</th>
                       <th className="px-4 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest text-right">Total ↑</th>
                       <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {activeMonthDays.map((d: any, idx: number) => {
                       const dt = new Date(d.date);
                       const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
                       return (
                         <tr key={d.date} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                           <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                           <td className="px-4 py-4 text-sm font-bold text-white">{dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                           <td className="px-4 py-4 text-sm font-medium text-slate-300">{dayName}</td>
                           <td className="px-4 py-4 text-sm text-slate-300">{d.areaType}</td>
                           <td className="px-4 py-4 text-sm text-sky-400">{d.workAreas}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.travel || 0}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.food || 0}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.hotel || 0}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.ticket || 0}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.daily || 0}</td>
                           <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.misc || 0}</td>
                           <td className="px-4 py-4 text-sm font-bold text-sky-400 text-right">{d.total}</td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleAction('Approved', d)} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Approve">
                                  <CheckCircle size={16} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => handleAction('Rejected', d)} className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reject">
                                  <XCircle size={16} strokeWidth={2.5} />
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
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e2d] relative">
       

       <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
          <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                     <CheckCircle size={24} strokeWidth={2.5}/>
                 </div>
                 <div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">APPROVE {selectedModule}</h1>
                 </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex-1">
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 block">Select User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full max-w-sm bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500">
                <option value="">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 bg-[#151521] px-5 py-3 rounded-xl border border-[#3b3b5a]">
              <div 
                onClick={() => setIsMonthlyView(!isMonthlyView)} 
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isMonthlyView ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isMonthlyView ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-bold text-slate-300">View Monthly Expense</span>
            </div>
          </div>
       </div>

       <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1c1c2e]">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SHOWING ({isMonthlyView ? monthlyData.length : dayWiseData.length}) ENTRIES</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#3b3b5a] bg-[#151521]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                    {isMonthlyView ? (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Month ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Year ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Name ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Designation ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Reporting Manager</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">View</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Employee Name ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Date ↑</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Area Type</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Travel</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Food</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Hotel</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Ticket</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Daily</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-right">Misc.</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest text-right">Total</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest">Remarks</th>
                        <th className="px-4 py-4 text-[10px] font-black text-sky-500 uppercase tracking-widest text-center">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isMonthlyView ? (
                    monthlyData.length === 0 ? (
                      <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Monthly Expenses</td></tr>
                    ) : monthlyData.map((m: any, idx: number) => (
                      <tr key={`${m.employeeId}_${m.month}`} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white capitalize">{m.month}</td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-300">{m.year}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400">{m.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{m.designation}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{m.reportingManager}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => setDetailedMonthData({employeeId: m.employeeId, month: m.month, year: m.year, name: m.name})} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block">
                            <Eye size={18} strokeWidth={2.5}/>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    dayWiseData.length === 0 ? (
                      <tr><td colSpan={13} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Daily Expenses</td></tr>
                    ) : dayWiseData.map((d: any, idx: number) => (
                      <tr key={`${d.employeeId}_${d.date}`} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400">{d.employeeName}</td>
                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{d.areaType}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.travel || 0}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.food || 0}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.hotel || 0}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.ticket || 0}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.daily || 0}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 text-right">{d.misc || 0}</td>
                        <td className="px-4 py-4 text-sm font-bold text-sky-400 text-right">{d.total}</td>
                        <td className="px-4 py-4 text-sm text-slate-300 truncate max-w-[150px]">{d.remarks}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleAction('Approved', d)} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Approve">
                                <CheckCircle size={16} strokeWidth={2.5} />
                              </button>
                              <button onClick={() => handleAction('Rejected', d)} className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reject">
                                <XCircle size={16} strokeWidth={2.5} />
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
    </div>
  );
}
