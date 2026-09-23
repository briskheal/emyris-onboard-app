import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, ChevronDown, X } from 'lucide-react';
import EmyrisDateRangePicker from '../components/EmyrisDateRangePicker';
import CustomUserSelect from '../components/CustomUserSelect';
import axios from 'axios';

export default function CallReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 30));
  const [reportType, setReportType] = useState('Call Report');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [adminsRes, usersRes, productsRes] = await Promise.all([
          axios.get('/api/admin/admins'),
          axios.get('/api/admin/users'),
          axios.get('/api/admin/products')
        ]);
        
        let allUsers: any[] = [];
        if (adminsRes.data && adminsRes.data.success) {
          allUsers = [...allUsers, ...adminsRes.data.admins.map((x: any) => ({ ...x, isAdmin: true }))];
        }
        if (usersRes.data && usersRes.data.success) {
          allUsers = [...allUsers, ...usersRes.data.users.map((x: any) => ({ ...x, isAdmin: false }))];
        }
        
        setUsers(allUsers);
        
        if (productsRes.data && productsRes.data.success) {
            setProducts(productsRes.data.products || []);
        }
      } catch (e) { console.error(e); }
    };
    fetchInitialData();
  }, []);

  const [reportData, setReportData] = useState<any[]>([]);
  const [rawDCRs, setRawDCRs] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedUser || !startDate || !endDate) {
      setReportData([]);
      return;
    }
    
    const fetchReports = async () => {
      const monthsToFetch = new Map<string, any>();
      let current = new Date(startDate);
      while (current <= endDate) {
         const mText = current.toLocaleString('default', { month: 'long' }).toLowerCase();
         const mNum = current.getMonth() + 1;
         const y = current.getFullYear().toString();
         monthsToFetch.set(`${y}-${mNum}`, { mText, mNum, y });
         current.setDate(current.getDate() + 1);
      }
      
      const selectedUserObj = users.find(u => u.employeeId === selectedUser);
      const name = selectedUserObj ? `${selectedUserObj.firstName} ${selectedUserObj.lastName}` : selectedUser;

      let allTPEntries: any[] = [];
      let allDCRs: any[] = [];
      let allAttendances: any[] = [];
      let allHolidays: any[] = [];
      
      try {
          const hRes = await axios.get('/api/xl/extras/holidays');
          if (hRes.data && hRes.data.success) {
              const userState = (selectedUserObj?.state || '').toLowerCase().trim();
              allHolidays = hRes.data.data.filter((h: any) => {
                  if (!h.state || h.state === 'All' || h.state === 'N/A') return true;
                  return h.state.toLowerCase().trim() === userState;
              });
          }
      } catch (e) { console.error('Holidays error', e); }

      for (const [, meta] of monthsToFetch.entries()) {
         try {
           const [tpRes, dcrRes, attRes] = await Promise.all([
               axios.get(`/api/xl/tour-program/my?email=${encodeURIComponent(selectedUser)}&month=${meta.mText}&year=${meta.y}`),
               axios.get(`/api/xl/dcr/monthly?email=${encodeURIComponent(selectedUser)}&month=${meta.mNum}&year=${meta.y}`),
               axios.get(`/api/xl/attendance/monthly?email=${encodeURIComponent(selectedUser)}&month=${meta.mNum}&year=${meta.y}`)
           ]);
           
           if (tpRes.data && tpRes.data.success && tpRes.data.data) {
              let entries = [];
              try { entries = typeof tpRes.data.data.entries === 'string' ? JSON.parse(tpRes.data.data.entries) : tpRes.data.data.entries; } catch(e) {}
              if (Array.isArray(entries)) allTPEntries = [...allTPEntries, ...entries.map(e => ({ ...e, approvedBy: tpRes.data.data.approvedBy }))];
           }
           
           if (dcrRes.data && dcrRes.data.success && Array.isArray(dcrRes.data.data)) {
               allDCRs = [...allDCRs, ...dcrRes.data.data];
           }

           if (attRes.data && attRes.data.success && Array.isArray(attRes.data.data)) {
               allAttendances = [...allAttendances, ...attRes.data.data];
           }
         } catch (e) {
           console.error(e);
         }
      }
      
      let allBacklogs: any[] = [];
        try {
            const bRes = await axios.get(`/api/xl/backlog/my?email=${encodeURIComponent(selectedUser)}`);
            if (bRes.data && bRes.data.success) {
                allBacklogs = bRes.data.data;
            }
        } catch(e) {}
      const formatDateStr = (d: Date) => {
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().split('T')[0];
      };
      
      let dateIter = new Date(startDate);
      const formatted = [];
      let idx = 1;
      
      while (dateIter <= endDate) {
          const dStr = formatDateStr(dateIter);
          
          const tp = allTPEntries.find(e => e.date === dStr) || {};
          const dcrsForDay = allDCRs.filter(d => d.date === dStr);
          const backlog = allBacklogs.find(b => b.date === dStr);
          const holiday = allHolidays.find(h => h.date === dStr);
          const att = allAttendances.find(a => a.date === dStr);
          const isSunday = new Date(dStr).getDay() === 0;

          let finalActivity = tp.activityType || tp.activity;
          if (!finalActivity) {
              if (holiday) finalActivity = holiday.title || 'Holiday';
              else if (isSunday) finalActivity = 'Weekly Off';
              else finalActivity = 'Working';
          }
          
          let jointCallsCount = 0;
          dcrsForDay.forEach(d => {
             try {
                let w = typeof d.workedWith === 'string' ? JSON.parse(d.workedWith) : d.workedWith;
                if (Array.isArray(w) && w.length > 0) jointCallsCount++;
             } catch(e) {}
          });

          formatted.push({
             id: idx++,
             rawDate: dStr,
             hasDCR: dcrsForDay.length > 0,
             daySubmitted: att ? att.daySubmitted : false,
             status: dcrsForDay.length > 0 ? dcrsForDay[0].status : (tp.tpStatus || tp.status || 'Pending'),
             approvedBy: (dcrsForDay.length > 0 && dcrsForDay[0].approvedBy) ? dcrsForDay[0].approvedBy : tp.approvedBy,
             date: new Date(dStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
             day: new Date(dStr).toLocaleDateString('en-GB', { weekday: 'long' }),
             name: name,
             activity: finalActivity,
             isHoliday: !!holiday,
             isWeeklyOff: isSunday,
             areaType: tp.type || tp.workAreaType || tp.areaType || '-',
             areas: tp.toMarket || tp.workingArea || tp.workArea || '-',
             docs: dcrsForDay.filter(d => d.entityType === 'Doctor').length,
             chems: dcrsForDay.filter(d => d.entityType === 'Chemist').length,
             stockists: dcrsForDay.filter(d => d.entityType === 'Stockist').length,
             jointCalls: jointCallsCount,
             backlog: backlog ? (backlog.status === 'Approved' ? '✅' : (backlog.status === 'Pending' || backlog.status === 'Submitted' ? '⏳' : '❌')) : '-'
          });
          
          dateIter.setDate(dateIter.getDate() + 1);
      }
      
      const finalFormatted = formatted.filter(r => {
            // Include holidays/weekly offs ONLY if they are in the past or today
            if (r.isHoliday || r.isWeeklyOff) {
                const rowDate = new Date(r.rawDate);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return rowDate <= today;
            }
            // For any scheduled activity (Working, Admin, Transit, Camp), ONLY show if the user 
            // actually clicked "Submit Day Final Report" (daySubmitted === true)
            // OR if the admin already approved the calls (so hasDCR is true AND status is Approved)
            return r.daySubmitted || (r.hasDCR && r.status === 'Approved');
        });

      setReportData(finalFormatted);
      setRawDCRs(allDCRs);
    };
    
    fetchReports();
  }, [startDate, endDate, selectedUser, users]);

  const displayedData = useMemo(() => {
    if (reportType === 'Show Last Call Report') {
        const workingDays = reportData.filter(r => !r.isHoliday && !r.isWeeklyOff);
        if (workingDays.length > 0) {
            workingDays.sort((a,b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
            return [workingDays[0]];
        }
        return [];
    }

    if (reportType === 'Backlog Report') {
        return reportData.filter(r => r.backlog !== '-' && !r.isHoliday && !r.isWeeklyOff);
    }

    if (reportType === 'Joint Call Report') {
        return reportData.filter(r => r.jointCalls > 0);
    }

    return reportData;
  }, [reportData, reportType]);

  const { workingDaysCount, totalDocs, totalChems, totalStockists } = useMemo(() => {
    let wd = 0, d = 0, c = 0, s = 0;
    displayedData.forEach(r => {
      // Only count as a "working" day for averages if they actually submitted DCRs 
      // (or if they submitted and it's approved). The user specifically requested 
      // not dividing by future/unsubmitted working days in the month.
      if ((r.activity || '').toLowerCase().includes('working') && r.hasDCR) {
        wd++;
      }
      d += (r.docs || 0);
      c += (r.chems || 0);
      s += (r.stockists || 0);
    });
    return { workingDaysCount: wd, totalDocs: d, totalChems: c, totalStockists: s };
  }, [displayedData]);

  const detailedData = useMemo(() => {
    if (reportType !== 'Detailed Report' && reportType !== 'Worked With Report') return [];
    
    let filtered = [...rawDCRs];
    
    if (reportType === 'Worked With Report') {
        filtered = filtered.filter(d => {
            try {
                let w = typeof d.workedWith === 'string' ? JSON.parse(d.workedWith) : d.workedWith;
                return Array.isArray(w) && w.length > 0;
            } catch(e) { return false; }
        });
    }
    
    // Sort by date (descending) then time
    filtered.sort((a,b) => {
        if (a.date !== b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
        return (a.checkInTime || '').localeCompare(b.checkInTime || '');
    });
    
    return filtered;
  }, [rawDCRs, reportType]);

  const avgDocs = workingDaysCount > 0 ? (totalDocs / workingDaysCount).toFixed(2) : '0';
  const avgChems = workingDaysCount > 0 ? (totalChems / workingDaysCount).toFixed(2) : '0';
  const avgStockists = workingDaysCount > 0 ? (totalStockists / workingDaysCount).toFixed(2) : '0';

  return (
    <div className="min-h-screen bg-[#1a1a27] flex flex-col text-slate-100 font-sans pb-24 md:pb-0 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#3b3b5a] bg-[#1a1a27]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[13px] font-black text-white tracking-widest uppercase">CALL REPORTS</h1>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* Filters Area */}
        <div className="mb-6 flex flex-wrap gap-6 items-end">
          {/* Select User Area */}
          <div>
            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">Select User</label>
            <div className="flex items-center gap-3">
              <div className="flex-grow min-w-[250px] max-w-sm">
                <CustomUserSelect 
                  users={users}
                  selectedUser={selectedUser}
                  onChange={(id) => setSelectedUser(id)}
                />
              </div>
              <button className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Select Report Type */}
          <div>
            <label className="text-xs font-bold text-sky-400 mb-2 block">Select Report Type</label>
            <div className="relative">
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="appearance-none bg-[#242538] border border-sky-500/30 rounded-md px-4 py-2 min-w-[250px] text-xs font-bold text-white outline-none cursor-pointer pr-10"
              >
                  <option>Call Report</option>
                  <option>Show Last Call Report</option>
                  <option>Backlog Report</option>
                  <option>Detailed Report</option>
                  <option>Worked With Report</option>
                  <option>Joint Call Report</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date Picker */}
        <EmyrisDateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
        />

        {/* Summary Stats */}
        <div className="mt-6 flex flex-wrap gap-4">
          {[{label: 'Avg. Doctors', val: avgDocs}, {label: 'Avg. Chemists', val: avgChems}, {label: 'Avg. Stockists', val: avgStockists}].map(stat => (
            <div key={stat.label} className="bg-[#242538] border border-[#3b3b5a] rounded-xl px-5 py-3 flex flex-col min-w-[140px] shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <span className="text-lg font-black text-white mt-1">{stat.val}</span>
            </div>
          ))}
        </div>

        {/* Table Header Info */}
        <div className="mt-8 mb-4">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SHOWING ({(reportType === 'Detailed Report' || reportType === 'Worked With Report') ? detailedData.length : displayedData.length}) ENTRIES</h2>
        </div>

        {/* Data Table */}
        <div className="bg-[#1e2032] overflow-hidden">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              {(reportType === 'Detailed Report' || reportType === 'Worked With Report') ? (
                <>
                  <thead>
                    <tr className="bg-[#171f3a] border-b border-[#2d2f45]">
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Sr</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Submitter</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">ActivityType</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">AreaType</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Time</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Campaign</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Products</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">POB</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Samples</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Gifts</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Remarks</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Work Areas</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">Worked With</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedData.map((dcr, index) => {
                      let workedWithStr = '-';
                      try {
                        let w = typeof dcr.workedWith === 'string' ? JSON.parse(dcr.workedWith) : dcr.workedWith;
                        if (Array.isArray(w)) workedWithStr = w.join(', ');
                      } catch(e) {}
                        let productsStr = '-';
                        try {
                          let p = typeof dcr.productsDetailed === 'string' ? JSON.parse(dcr.productsDetailed) : dcr.productsDetailed;
                          if (Array.isArray(p)) {
                              productsStr = p.map((x:any) => {
                                  const prodId = x.product || x;
                                  const found = products.find((pr: any) => pr._id === prodId);
                                  return found ? found.productName : prodId;
                              }).join(', ');
                          }
                        } catch(e) {}
                      let samplesStr = '-';
                      try {
                        let s = typeof dcr.samplesGiven === 'string' ? JSON.parse(dcr.samplesGiven) : dcr.samplesGiven;
                        if (Array.isArray(s)) samplesStr = s.map((x:any) => `${x.qty} ${x.product || x.item}`).join(', ');
                      } catch(e) {}
                      let giftsStr = '-';
                      try {
                        let g = typeof dcr.gifts === 'string' ? JSON.parse(dcr.gifts) : dcr.gifts;
                        if (Array.isArray(g)) giftsStr = g.map((x:any) => `${x.qty} ${x.item}`).join(', ');
                      } catch(e) {}
                      
                      let pobAmt = 0;
                      try {
                        let pob = typeof dcr.pobItems === 'string' ? JSON.parse(dcr.pobItems) : dcr.pobItems;
                        if (Array.isArray(pob)) pobAmt = pob.reduce((sum:number, item:any) => sum + (parseFloat(item.amount) || 0), 0);
                      } catch(e) {}

                      return (
                        <tr key={dcr._id} className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{index + 1}</td>
                          <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45] whitespace-nowrap">{dcr.employeeName || (users.find(u => u.employeeId === dcr.employeeId)?.firstName || dcr.employeeId)}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">Working</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{dcr.workingAreaType || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{dcr.date}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{dcr.checkInTime || '-'}</td>
                          <td className={`px-4 py-3 text-xs border-r border-[#2d2f45] whitespace-nowrap ${
                            dcr.entityType === 'Doctor' ? 'text-sky-400' :
                            dcr.entityType === 'Chemist' ? 'text-emerald-400' :
                            dcr.entityType === 'Stockist' ? 'text-amber-400' : 'text-slate-400'
                          }`}>{dcr.entityType}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{dcr.entityName}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 border-r border-[#2d2f45]">-</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{productsStr}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">₹{pobAmt}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{samplesStr}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{giftsStr}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{dcr.discussion || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{dcr.workingAreas || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{workedWithStr || '-'}</td>
                        </tr>
                      );
                    })}
                    {detailedData.length === 0 && (
                      <tr>
                        <td colSpan={16} className="px-4 py-8 text-center text-slate-500 text-sm">No detailed calls found for this period.</td>
                      </tr>
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-[#171f3a] border-b border-[#2d2f45]">
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Sr</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">📅</span> Day
                        </div>
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">👤</span> Name
                        </div>
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Activity</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Area-Type</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Working Areas</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Doctors ⚕️</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Chemists 💊</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Stockists 📦</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                        {reportType === 'Joint Call Report' ? 'Joint Calls' : 'Backlog'}
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">View</th>
                    </tr>
                  </thead>
                  <tbody>
                      {displayedData.map((row) => (
                        <tr key={row.id} className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.date}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.day}</td>
                          <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45] whitespace-nowrap">{row.name}</td>
                          <td className={`px-4 py-3 text-xs border-r border-[#2d2f45] whitespace-nowrap ${row.isWeeklyOff ? 'text-amber-400 font-bold' : row.isHoliday ? 'text-fuchsia-400 font-bold' : 'text-slate-300'}`}>{row.activity}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.areaType}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.areas}</td>
                          <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.docs}</td>
                          <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.chems}</td>
                          <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.stockists}</td>
                          <td className={`px-4 py-3 text-xs border-r border-[#2d2f45] text-center ${reportType === 'Joint Call Report' ? 'text-emerald-400 font-bold' : row.backlog === '✅' ? 'text-emerald-400 font-bold' : row.backlog === '⏳' ? 'text-amber-400' : row.backlog === '❌' ? 'text-rose-400' : 'text-slate-500'}`}>
                            {reportType === 'Joint Call Report' ? row.jointCalls : row.backlog}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 text-center"><span onClick={() => setSelectedView(row)} className="cursor-pointer hover:text-white text-slate-400 text-lg">👁️</span></td>
                        </tr>
                      ))}
                    {/* Total Row */}
                    <tr className="bg-[#171f3a] border-b-2 border-sky-500 font-bold">
                      <td colSpan={6} className="px-4 py-3 text-xs text-sky-400 text-right border-r border-[#2d2f45]">Total</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{displayedData.reduce((acc, r) => acc + (r.docs || 0), 0)}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{displayedData.reduce((acc, r) => acc + (r.chems || 0), 0)}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{displayedData.reduce((acc, r) => acc + (r.stockists || 0), 0)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center bg-[#171f3a] px-4 py-3 mt-1">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <button className="hover:text-white transition-colors">&lt; Prev</button>
            <span className="text-white">Page 1 of 1</span>
            <button className="hover:text-white transition-colors">Next &gt;</button>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#2d2f45] px-3 py-1.5 rounded text-xs font-bold text-white hover:bg-slate-600">
              <span className="text-emerald-400">▤</span> Export
            </button>
            <div className="bg-[#2d2f45] rounded px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              Show 50 <span className="text-slate-400">▼</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Modal */}
      {selectedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a27] w-full max-w-4xl max-h-[80vh] rounded-lg flex flex-col shadow-xl border border-[#3b3b5a]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b3b5a]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h1 className="text-[12px] font-black text-white tracking-widest uppercase">CALL REPORT DETAILS</h1>
              </div>
              <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-[#242538] p-4 rounded-md border border-[#32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Date</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.date} - {selectedView.day}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[#32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Activity</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.activity}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[#32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Area Type</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.areaType}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[#32334b] border-b-2 border-b-sky-500">
                    <p className="text-xs font-bold text-slate-300 mb-1">Approved By</p>
                    <p className="text-xs font-medium text-slate-400">
                      {(() => {
                        if (selectedView.status === 'Pending' || selectedView.status === 'Submitted' || selectedView.status === 'pending' || selectedView.status === 'submitted') return <span className="text-amber-400">Pending Approval</span>;
                        const approverId = selectedView.approvedBy;
                        if (approverId) {
                          const manager = users.find(u => u.uid === approverId || u.employeeId === approverId);
                          if (manager) return `${manager.firstName} ${manager.lastName} (${manager.designation})`;
                          return approverId;
                        }
                        const employee = users.find(u => u.employeeId === selectedUser);
                        if (!employee || !employee.reportingManager) return 'Admin (Assumed)';
                        const manager = users.find(u => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager);
                        return manager ? `${manager.firstName} ${manager.lastName} (Assumed)` : employee.reportingManager;
                      })()}
                    </p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[#32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Areas</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.areas}</p>
                </div>
              </div>
              
              <div className="bg-[#171f3a] rounded-md border border-[#2d2f45] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#101525] border-b border-[#2d2f45]">
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">Order & POB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawDCRs.filter(l => l.date === selectedView.rawDate).map((dcr, i) => (
                      <tr key={i} className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                        <td className={`px-4 py-3 text-xs border-r border-[#2d2f45] ${
                          dcr.entityType === 'Doctor' ? 'text-sky-400' :
                          dcr.entityType === 'Chemist' ? 'text-emerald-400' :
                          dcr.entityType === 'Stockist' ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>{dcr.entityType}</td>
                        <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{dcr.entityName}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">POB: -</td>
                      </tr>
                    ))}
                    {rawDCRs.filter(l => l.date === selectedView.rawDate).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-xs">No Calls Reported</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
