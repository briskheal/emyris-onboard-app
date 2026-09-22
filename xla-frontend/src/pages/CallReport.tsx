import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [adminsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/admins'),
          axios.get('/api/admin/users')
        ]);
        let all: any[] = [];
        if (adminsRes.data && adminsRes.data.success) {
          all = [...all, ...adminsRes.data.admins.map((x: any) => ({ ...x, isAdmin: true }))];
        }
        if (usersRes.data && usersRes.data.success) {
          all = [...all, ...usersRes.data.users.map((x: any) => ({ ...x, isAdmin: false }))];
        }
        setUsers(all);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, []);

  const [reportData, setReportData] = useState<any[]>([]);

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
      
      let allTPEntries: any[] = [];
      let allDCRs: any[] = [];
      
      for (const [metaKey, meta] of monthsToFetch.entries()) {
         try {
           const [tpRes, dcrRes] = await Promise.all([
               axios.get(`/api/xl/tour-program/my?email=${encodeURIComponent(selectedUser)}&month=${meta.mText}&year=${meta.y}`),
               axios.get(`/api/xl/dcr/monthly?email=${encodeURIComponent(selectedUser)}&month=${meta.mNum}&year=${meta.y}`)
           ]);
           
           if (tpRes.data && tpRes.data.success && tpRes.data.data) {
              let entries = [];
              try { entries = typeof tpRes.data.data.entries === 'string' ? JSON.parse(tpRes.data.data.entries) : tpRes.data.data.entries; } catch(e) {}
              if (Array.isArray(entries)) allTPEntries = [...allTPEntries, ...entries];
           }
           
           if (dcrRes.data && dcrRes.data.success && Array.isArray(dcrRes.data.data)) {
               allDCRs = [...allDCRs, ...dcrRes.data.data];
           }
         } catch (e) {
           console.error(e);
         }
      }
      
      const selectedUserObj = users.find(u => u.employeeId === selectedUser);
      const name = selectedUserObj ? `${selectedUserObj.firstName} ${selectedUserObj.lastName}` : selectedUser;
      
      let allBacklogs: any[] = [];
      try {
         const backRes = await axios.get(`/api/xl/backlog/my?email=${encodeURIComponent(selectedUser)}`);
         if (backRes.data && backRes.data.success) allBacklogs = backRes.data.data;
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
          
          formatted.push({
             id: idx++,
             date: new Date(dStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
             day: new Date(dStr).toLocaleDateString('en-GB', { weekday: 'long' }),
             name: name,
             activity: tp.activityType || tp.activity || 'Working',
             areaType: tp.type || tp.workAreaType || tp.areaType || '-',
             areas: tp.toMarket || tp.workingArea || tp.workArea || '-',
             docs: dcrsForDay.filter(d => d.entityType === 'Doctor').length,
             chems: dcrsForDay.filter(d => d.entityType === 'Chemist').length,
             stockists: dcrsForDay.filter(d => d.entityType === 'Stockist').length,
             backlog: backlog ? '✓' : '-'
          });
          
          dateIter.setDate(dateIter.getDate() + 1);
      }
      
      setReportData(formatted);
    };
    
    fetchReports();
  }, [startDate, endDate, selectedUser, users]);

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
                <option>Show Less Call Report</option>
                <option>Working Report</option>
                <option>Detailed Report</option>
                <option>Detailed With Report</option>
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
          {[{label: 'Avg. Doctors', val: '6.56'}, {label: 'Avg. Chemists', val: '3.67'}, {label: 'Avg. Stockists', val: '0.8'}].map(stat => (
            <div key={stat.label} className="bg-[#242538] border border-[#3b3b5a] rounded-xl px-5 py-3 flex flex-col min-w-[140px] shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <span className="text-lg font-black text-white mt-1">{stat.val}</span>
            </div>
          ))}
        </div>

        {/* Table Header Info */}
        <div className="mt-8 mb-4">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SHOWING ({reportData.length}) ENTRIES</h2>
        </div>

        {/* Data Table */}
        <div className="bg-[#1e2032] overflow-hidden">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#171f3a] border-b border-[#2d2f45]">
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">↑</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">⚲</span> Day
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">⚲</span> Name
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Activity</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Area-Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Working Areas</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Doctors ↑</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Chemists ↑</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Stockists ↑</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Backlog</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">View</th>
                </tr>
              </thead>
              <tbody>
                  {reportData.map((row) => (
                    <tr key={row.id} className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.date}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.day}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45] whitespace-nowrap">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.activity}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.areaType}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.areas}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.docs}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.chems}</td>
                      <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.stockists}</td>
                      <td className="px-4 py-3 text-xs text-emerald-400 border-r border-[#2d2f45] text-center">{row.backlog}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 text-center"><span className="cursor-pointer hover:text-white text-slate-400 text-lg">👁</span></td>
                    </tr>
                  ))}
                {/* Total Row */}
                <tr className="bg-[#171f3a] border-b-2 border-sky-500 font-bold">
                  <td colSpan={6} className="px-4 py-3 text-xs text-sky-400 text-right border-r border-[#2d2f45]">Total</td>
                  <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{reportData.reduce((acc, r) => acc + (r.docs || 0), 0)}</td>
                  <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{reportData.reduce((acc, r) => acc + (r.chems || 0), 0)}</td>
                  <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{reportData.reduce((acc, r) => acc + (r.stockists || 0), 0)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
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
    </div>
  );
}
