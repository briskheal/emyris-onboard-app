import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronDown, RefreshCw, Settings as SettingsIcon, Search, Calendar as CalendarIcon, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Attendance() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  
  const fetchAllData = async () => {
      setLoading(true);
      try {
          // fetch users
          const uRes = await axios.get('/api/admin/users');
          let uList = [];
          if (uRes.data && uRes.data.success) {
              uList = uRes.data.users;
          }
          setUsers(uList);
          
          // fetch all monthly attendances
          const attRes = await axios.get(`/api/xl/attendance/monthly/all?month=${selectedMonth}&year=${selectedYear}`);
          if (attRes.data && attRes.data.success) {
              setAttendances(attRes.data.data);
          }
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };
  
  useEffect(() => {
      fetchAllData();
  }, [selectedMonth, selectedYear]);

  // Generate days array for the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = monthNames[selectedMonth - 1];
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    const dObj = new Date(selectedYear, selectedMonth - 1, date);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const yyyymmdd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return {
      date: date < 10 ? `0${date}` : `${date}`,
      day: dayName,
      yyyymmdd
    };
  });
  
  // Aggregate data per user
  const aggregatedData = useMemo(() => {
      return users.map(user => {
          let presentCount = 0;
          let absentCount = 0;
          let leaveCount = 0;
          let holidayCount = 0;
          
          const dailyMap: Record<string, string> = {}; // YYYY-MM-DD -> Status letter
          
          // Count weekends as holidays unless they punched in? The system has punch in for 'P', leave for 'L'.
          // Let's populate default statuses.
          days.forEach(d => {
              // check if weekend
              if (d.day === 'Sunday' || d.day === 'Saturday') {
                  dailyMap[d.yyyymmdd] = 'H';
              }
          });
          
          // Map real attendances
          const userAtts = attendances.filter(a => a.employeeId === user.email);
          userAtts.forEach(a => {
              if (a.date && dailyMap[a.date] !== 'P') {
                  // If they punch in, it's present. (Emyris marks attendance via DCR punch in usually)
                  // Let's assume if there is a record, they were present.
                  // Wait, Emyris 'attendance' model has status? Let's check status if it exists.
                  const status = a.status || 'Present';
                  if (status.toLowerCase().includes('leave')) {
                      dailyMap[a.date] = 'L';
                  } else if (status.toLowerCase().includes('absent')) {
                      dailyMap[a.date] = 'A';
                  } else {
                      dailyMap[a.date] = 'P';
                  }
              }
          });
          
          // Emyris specifically requires any day before 'today' that isn't P, H, or L to be Absent
          const today = new Date();
          const todayYMD = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          days.forEach(d => {
              if (d.yyyymmdd < todayYMD && !dailyMap[d.yyyymmdd]) {
                  dailyMap[d.yyyymmdd] = 'A';
              }
              
              const st = dailyMap[d.yyyymmdd];
              if (st === 'P') presentCount++;
              if (st === 'A') absentCount++;
              if (st === 'L') leaveCount++;
              if (st === 'H') holidayCount++;
          });
          
          // Remaining days
          const remainingDays = daysInMonth - (presentCount + absentCount + leaveCount + holidayCount);
          
          
          return {
              ...user,
              dailyMap,
              presentCount,
              absentCount,
              leaveCount,
              holidayCount,
              remainingDays: remainingDays > 0 ? remainingDays : 0,
              totalWorkingDays: daysInMonth - holidayCount
          };
      });
  }, [users, attendances, days]);

  const [now] = useState(new Date());

  return (
    <div className="min-h-screen md:h-dvh bg-[#1c1c2e] flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-[#1c1c2e] border-b border-[#2d2f45] sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-4 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:block mb-8">
          <h2 className="text-[16px] font-black text-slate-200 uppercase tracking-wider">ATTENDANCE SUMMARY</h2>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs font-medium text-slate-300">Select Type</label>
              <button className="flex items-center justify-between bg-[#1c1c2e] border border-sky-500 rounded-lg px-4 py-2.5 hover:bg-[#27273f] transition-colors">
                <span className="font-semibold text-sm text-slate-300">Monthly Attendance</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs font-medium text-slate-300">Select Month</label>
              <div className="flex items-center justify-between bg-[#1c1c2e] border border-sky-500 rounded-lg px-4 py-2.5 relative">
                <input 
                    type="month" 
                    value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                    onChange={(e) => {
                        if (e.target.value) {
                            const [y, m] = e.target.value.split('-');
                            setSelectedYear(parseInt(y, 10));
                            setSelectedMonth(parseInt(m, 10));
                        }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="font-semibold text-sm text-slate-300 pointer-events-none">{mName}, {selectedYear}</span>
                <CalendarIcon size={16} className="text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-slate-400 text-xs font-semibold">
            <span>Last Synced</span>
            <span className="text-slate-300">{now.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})} | {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="hidden md:flex flex-col flex-1 bg-[#27273f] border border-[#3b3b5a] rounded-lg overflow-hidden shadow-2xl relative">
          
          {/* Table Header Controls */}
          <div className="px-6 py-4 bg-[#1c1c2e] border-b border-[#3b3b5a] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" /><span className="text-sm font-bold text-slate-300">Present</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span className="text-sm font-bold text-slate-300">Absent</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /><span className="text-sm font-bold text-slate-300">Leave</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /><span className="text-sm font-bold text-slate-300">Holiday</span></div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
                Actions <SettingsIcon size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="p-10 flex justify-center text-slate-400"><RefreshCw className="animate-spin" /></div>
            ) : (
            <table className="w-[3000px] xl:w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#27273f] border-b border-[#3b3b5a]">
                  <th className="p-4 text-[13px] font-bold text-slate-300 w-16 sticky left-0 bg-[#27273f] z-10 border-r border-[#3b3b5a]">
                     <div className="flex flex-col items-center">
                        <span>Sr</span>
                        <span>no.</span>
                     </div>
                  </th>
                  <th className="p-4 text-[13px] font-bold text-slate-300 sticky left-16 bg-[#27273f] z-10 border-r border-[#3b3b5a] w-48 text-center">
                    <div className="flex items-center justify-center gap-2 cursor-pointer">
                        <Search size={14} className="text-slate-400" />
                        <div className="flex flex-col items-center">
                            <span>Employee</span>
                            <span>Name</span>
                        </div>
                        <ArrowUp size={14} className="text-slate-400" />
                    </div>
                  </th>
                  {days.map((d, i) => (
                    <th key={i} className="p-4 border-r border-[#3b3b5a] w-24">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <span className="text-[13px] font-bold text-slate-300">{d.date} {mName}</span>
                        <span className="text-[11px] font-semibold text-slate-400">({d.day})</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                    <div className="flex items-center justify-center gap-1 cursor-pointer">Present <ArrowUp size={12} className="text-slate-400"/></div>
                  </th>
                  <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                    <div className="flex items-center justify-center gap-1 cursor-pointer">Absent <ArrowUp size={12} className="text-slate-400"/></div>
                  </th>
                  <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                    <div className="flex items-center justify-center gap-1 cursor-pointer">Leave <ArrowUp size={12} className="text-slate-400"/></div>
                  </th>
                  <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                    <div className="flex items-center justify-center gap-1 cursor-pointer">Holiday <ArrowUp size={12} className="text-slate-400"/></div>
                  </th>
                  <th className="p-4 border-r border-[#3b3b5a] w-24 text-[13px] font-bold text-slate-300">
                    <div className="flex flex-col items-center cursor-pointer">
                        <div className="flex items-center gap-1">Remaining <ArrowUp size={12} className="text-slate-400"/></div>
                        <span>Days</span>
                    </div>
                  </th>
                  <th className="p-4 text-[13px] font-bold text-slate-300">
                     <div className="flex flex-col items-center cursor-pointer">
                        <div className="flex items-center gap-1">Total <ArrowUp size={12} className="text-slate-400"/></div>
                        <span>working</span>
                        <span>Days</span>
                     </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b3b5a]">
                {aggregatedData.map((row, idx) => (
                    <tr key={row._id || idx} className="hover:bg-[#2d2f45] transition-colors">
                      <td className="p-4 text-sm font-semibold text-slate-300 sticky left-0 bg-[#27273f] border-r border-[#3b3b5a] z-10">{idx + 1}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300 text-center sticky left-16 bg-[#27273f] border-r border-[#3b3b5a] z-10 truncate">{row.name}</td>
                      {days.map((d, i) => {
                          const status = row.dailyMap[d.yyyymmdd];
                          let color = 'text-slate-400';
                          if (status === 'P') color = 'text-[#4ade80]';
                          if (status === 'A') color = 'text-[#ef4444]';
                          if (status === 'L') color = 'text-[#f97316]';
                          if (status === 'H') color = 'text-[#eab308]';
                          return (
                            <td key={i} className={`p-4 text-sm font-semibold border-r border-[#3b3b5a] ${color}`}>
                              {status || ''}
                            </td>
                          );
                      })}
                      <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.presentCount}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.absentCount}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.leaveCount}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.holidayCount}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.remainingDays}</td>
                      <td className="p-4 text-sm font-semibold text-slate-300">{row.totalWorkingDays}</td>
                    </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
