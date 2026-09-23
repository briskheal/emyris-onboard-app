import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronDown, RefreshCw, Settings as SettingsIcon, Search, Calendar as CalendarIcon, ArrowUp, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function Attendance() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [workingDaysPref, setWorkingDaysPref] = useState<any>({ Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false });
  const [monthHolidays, setMonthHolidays] = useState<string[]>([]);
  
  const [attendanceType, setAttendanceType] = useState<'monthly' | 'daily'>('monthly');
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [selectedDate, setSelectedDate] = useState<string>(
      `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  );
  
  const [loading, setLoading] = useState(false);
  
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllData = async () => {
      setLoading(true);
      try {
          const uRes = await axios.get('/api/admin/users');
          let uList = [];
          if (uRes.data && uRes.data.success) {
              uList = uRes.data.users;
          }
          setUsers(uList);
          
          let y = selectedYear;
          let m = selectedMonth;
          if (attendanceType === 'daily' && selectedDate) {
              const parts = selectedDate.split('-');
              y = parseInt(parts[0], 10);
              m = parseInt(parts[1], 10);
          }
          
          const attRes = await axios.get(`/api/xl/attendance/monthly/all?month=${m}&year=${y}`);
          if (attRes.data && attRes.data.success) {
              setAttendances(attRes.data.data);
                if (attRes.data.workingDays) setWorkingDaysPref(attRes.data.workingDays);
                if (attRes.data.holidays) setMonthHolidays(attRes.data.holidays);
          }
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };
  
  useEffect(() => {
      fetchAllData();
  }, [selectedMonth, selectedYear, attendanceType, selectedDate]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = monthNames[selectedMonth - 1];
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    const dObj = new Date(selectedYear, selectedMonth - 1, date);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const yyyymmdd = selectedYear + '-' + String(selectedMonth).padStart(2, '0') + '-' + String(date).padStart(2, '0');
    return {
      date: date < 10 ? '0' + date : String(date),
      day: dayName,
      yyyymmdd
    };
  });
  
  const aggregatedMonthly = useMemo(() => {
      return users.map(user => {
          let presentCount = 0;
          let absentCount = 0;
          let leaveCount = 0;
          let holidayCount = 0;
          
          const dailyMap: Record<string, string> = {}; 
          
          days.forEach(d => {
              if (d.day === 'Sunday' || d.day === 'Saturday') {
                  dailyMap[d.yyyymmdd] = 'H';
              }
          });
          
          const userAtts = attendances.filter(a => a.employeeId === user.employeeId || a.employeeId === user.email);
          userAtts.forEach(a => {
              if (a.date && dailyMap[a.date] !== 'P') {
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
          
          const today = new Date();
          const todayYMD = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
          
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
          
          const remainingDays = daysInMonth - (presentCount + absentCount + leaveCount + holidayCount);
          const fullName = (user.firstName || '') + ' ' + (user.lastName || '');
          
          return {
              ...user,
              fullName: fullName.trim(),
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

  const aggregatedDaily = useMemo(() => {
      if (attendanceType !== 'daily') return [];
      
      const dObj = new Date(selectedDate);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayStr = dayNames[dObj.getDay()];
      const isWeekend = !workingDaysPref[dayStr] || monthHolidays.includes(selectedDate);
      
      const today = new Date();
      const todayYMD = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const isPast = selectedDate < todayYMD;
      
      return users.map(user => {
          const fullName = (user.firstName || '') + ' ' + (user.lastName || '');
          const att = attendances.find(a => (a.employeeId === user.employeeId || a.employeeId === user.email) && a.date === selectedDate);
          
          let status = '';
          if (att) {
              const s = att.status || 'Present';
              if (s.toLowerCase().includes('leave')) status = 'L';
              else if (s.toLowerCase().includes('absent')) status = 'A';
              else status = 'P';
          } else {
              if (isWeekend) status = 'H';
              else if (isPast) status = 'A';
          }
          
          return {
              ...user,
              fullName: fullName.trim(),
              status,
              punchInTime: att ? (att.punchInTime || '-') : '-',
              punchOutTime: att ? (att.punchOutTime || '-') : '-'
          };
      });
  }, [users, attendances, selectedDate, attendanceType]);

  const activeData = attendanceType === 'monthly' ? aggregatedMonthly : aggregatedDaily;
  const filteredData = activeData.filter((u:any) => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const [now] = useState(new Date());

  const handleExport = () => {
    let exportData = [];
    if (attendanceType === 'monthly') {
        exportData = filteredData.map((row:any) => {
          const flatObj: any = {
            'Employee Name': row.fullName
          };
          days.forEach(d => {
            flatObj[d.date + ' ' + mName] = row.dailyMap[d.yyyymmdd] || '';
          });
          flatObj['Present'] = row.presentCount;
          flatObj['Absent'] = row.absentCount;
          flatObj['Leave'] = row.leaveCount;
          flatObj['Holiday'] = row.holidayCount;
          flatObj['Remaining Days'] = row.remainingDays;
          flatObj['Total Working Days'] = row.totalWorkingDays;
          return flatObj;
        });
    } else {
        exportData = filteredData.map((row:any) => ({
            'Employee Name': row.fullName,
            'Status': row.status === 'P' ? 'Present' : row.status === 'A' ? 'Absent' : row.status === 'L' ? 'Leave' : row.status === 'H' ? 'Holiday' : '',
            'Punch In': row.punchInTime,
            'Punch Out': row.punchOutTime
        }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    const fn = attendanceType === 'monthly' ? "Attendance_" + mName + "_" + selectedYear + ".xlsx" : "Attendance_" + selectedDate + ".xlsx";
    XLSX.writeFile(wb, fn);
  };

  return (
    <div className="min-h-screen bg-[#1c1c2e] flex flex-col text-slate-100 font-sans pb-24 md:pb-8">
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-[#1c1c2e] border-b border-[#2d2f45] sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      <div className="flex flex-col px-3 py-4 md:px-4 md:py-6">
        <div className="hidden md:block mb-6 md:mb-8">
          <h2 className="text-[16px] font-black text-slate-200 uppercase tracking-wider">ATTENDANCE SUMMARY</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 min-w-[200px] relative">
              <label className="text-xs font-medium text-slate-300">Select Type</label>
              <button 
                onClick={() => setShowTypePicker(!showTypePicker)}
                className="flex items-center justify-between bg-[#1c1c2e] border border-sky-500 rounded-lg px-4 py-2.5 hover:bg-[#27273f] transition-colors w-full"
              >
                <span className="font-semibold text-sm text-slate-300 pointer-events-none">{attendanceType === 'monthly' ? 'Monthly Attendance' : 'Daily Attendance'}</span>
                <ChevronDown size={18} className="text-slate-400 pointer-events-none" />
              </button>
              {showTypePicker && (
                <div className="absolute top-[65px] left-0 w-full bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-2 overflow-hidden">
                    <button onClick={() => {setAttendanceType('monthly'); setShowTypePicker(false);}} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#27273f] hover:text-white rounded-lg">Monthly Attendance</button>
                    <button onClick={() => {setAttendanceType('daily'); setShowTypePicker(false);}} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#27273f] hover:text-white rounded-lg">Daily Attendance</button>
                </div>
              )}
            </div>
            
            {attendanceType === 'monthly' ? (
                <div className="flex flex-col gap-1.5 min-w-[200px] relative">
                  <label className="text-xs font-medium text-slate-300">Select Month</label>
                  <button 
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className="flex items-center justify-between bg-[#1c1c2e] border border-sky-500 rounded-lg px-4 py-2.5 hover:bg-[#27273f] transition-colors w-full"
                  >
                    <span className="font-semibold text-sm text-slate-300 pointer-events-none">{mName}, {selectedYear}</span>
                    <CalendarIcon size={16} className="text-slate-400 pointer-events-none" />
                  </button>
                  
                  {showMonthPicker && (
                    <div className="absolute top-[65px] left-0 w-[240px] bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setSelectedYear(y => y - 1)} className="text-slate-400 hover:text-white">&lt;&lt;</button>
                        <span className="font-bold text-sm text-slate-200">{selectedYear}</span>
                        <button onClick={() => setSelectedYear(y => y + 1)} className="text-slate-400 hover:text-white">&gt;&gt;</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {monthNames.map((mn, idx) => (
                          <button 
                            key={mn}
                            onClick={() => {
                              setSelectedMonth(idx + 1);
                              setShowMonthPicker(false);
                            }}
                            className={"py-2 text-xs font-semibold rounded-lg transition-colors " + (selectedMonth === idx + 1 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-[#27273f] hover:text-white')}
                          >
                            {mn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            ) : (
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <label className="text-xs font-medium text-slate-300">Select Date</label>
                  <div className="flex items-center justify-between bg-[#1c1c2e] border border-sky-500 rounded-lg px-4 py-2.5 relative">
                    <input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="font-semibold text-sm text-slate-300 pointer-events-none">{selectedDate}</span>
                    <CalendarIcon size={16} className="text-slate-400 pointer-events-none" />
                  </div>
                </div>
            )}
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-slate-400 text-xs font-semibold">
            <span>Last Synced</span>
            <span className="text-slate-300">{now.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})} | {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex flex-col bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-2xl relative">
          
          <div className="px-4 md:px-6 py-4 bg-[#1c1c2e] border-b border-[#3b3b5a] rounded-t-lg flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" /><span className="text-sm font-bold text-slate-300">Present</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span className="text-sm font-bold text-slate-300">Absent</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /><span className="text-sm font-bold text-slate-300">Leave</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /><span className="text-sm font-bold text-slate-300">Holiday</span></div>
            </div>
            
            <div className="relative">
              <button onClick={() => setShowActions(!showActions)} className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
                Actions <SettingsIcon size={16} className="text-slate-400" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-3 w-48 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1">
                    <button onClick={() => { fetchAllData(); setShowActions(false); }} className="w-full flex items-center gap-3 text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#27273f] px-4 py-3 rounded-lg transition-colors">
                      <RefreshCw size={15} /> Sync Attd
                    </button>
                    <button onClick={() => { handleExport(); setShowActions(false); }} className="w-full flex items-center gap-3 text-left text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#27273f] px-4 py-3 rounded-lg transition-colors">
                      <Download size={15} /> Download Attd
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {loading ? (
                <div className="p-10 flex justify-center text-slate-400"><RefreshCw className="animate-spin" /></div>
            ) : (
            <table className="w-max xl:w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#27273f] border-b border-[#3b3b5a]">
                  <th className="p-4 text-[13px] font-bold text-slate-300 w-16 sticky left-0 bg-[#27273f] z-20 border-r border-[#3b3b5a]">
                     <div className="flex flex-col items-center">
                        <span>Sr</span>
                        <span>no.</span>
                     </div>
                  </th>
                  <th className="p-4 text-[13px] font-bold text-slate-300 sticky left-[64px] bg-[#27273f] z-20 border-r border-[#3b3b5a] w-56 text-center shadow-[4px_0_10px_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                            <Search size={14} className="text-slate-400" />
                            <div className="flex flex-col items-center">
                                <span>Employee Name</span>
                            </div>
                            <ArrowUp size={14} className="text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          className="w-full bg-[#1c1c2e] border border-[#3b3b5a] rounded px-2 py-1 text-xs font-normal text-white mt-1 outline-none focus:border-sky-500"
                        />
                    </div>
                  </th>
                  
                  {attendanceType === 'monthly' ? (
                      <>
                      {days.map((d, i) => (
                        <th key={i} className="p-4 border-r border-[#3b3b5a] w-[70px]">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="text-[12px] font-bold text-slate-300">{d.date} {mName}</span>
                            <span className="text-[10px] font-semibold text-slate-400">({d.day})</span>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                        <div className="flex flex-col items-center justify-center gap-1"><span>Present</span><ArrowUp size={12} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                        <div className="flex flex-col items-center justify-center gap-1"><span>Absent</span><ArrowUp size={12} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                        <div className="flex flex-col items-center justify-center gap-1"><span>Leave</span><ArrowUp size={12} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] w-20 text-[13px] font-bold text-slate-300">
                        <div className="flex flex-col items-center justify-center gap-1"><span>Holiday</span><ArrowUp size={12} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] w-24 text-[13px] font-bold text-slate-300">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1"><span>Remaining</span><ArrowUp size={12} className="text-slate-400"/></div>
                            <span>Days</span>
                        </div>
                      </th>
                      <th className="p-4 text-[13px] font-bold text-slate-300">
                         <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1"><span>Total</span><ArrowUp size={12} className="text-slate-400"/></div>
                            <span>working Days</span>
                         </div>
                      </th>
                      </>
                  ) : (
                      <>
                      <th className="p-4 border-r border-[#3b3b5a] text-[13px] font-bold text-slate-300">
                        <div className="flex items-center justify-center gap-1"><span>Status</span></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] text-[13px] font-bold text-slate-300">
                        <div className="flex items-center justify-center gap-1"><span>Punch In</span></div>
                      </th>
                      <th className="p-4 border-r border-[#3b3b5a] text-[13px] font-bold text-slate-300">
                        <div className="flex items-center justify-center gap-1"><span>Punch Out</span></div>
                      </th>
                      </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b3b5a]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={attendanceType === 'monthly' ? days.length + 8 : 5} className="p-8 text-center text-slate-400">No employees found.</td>
                  </tr>
                ) : paginatedData.map((row:any, idx:number) => (
                    <tr key={row._id || idx} className="hover:bg-[#2d2f45] transition-colors">
                      <td className="p-4 text-sm font-semibold text-slate-300 sticky left-0 bg-[#27273f] border-r border-[#3b3b5a] z-10">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-300 text-center sticky left-[64px] bg-[#27273f] border-r border-[#3b3b5a] z-10 truncate shadow-[4px_0_10px_rgba(0,0,0,0.1)]">
                        {row.fullName}
                      </td>
                      
                      {attendanceType === 'monthly' ? (
                          <>
                          {days.map((d, i) => {
                              const status = row.dailyMap[d.yyyymmdd];
                              let color = 'text-slate-400';
                              if (status === 'P') color = 'text-[#4ade80]';
                              if (status === 'A') color = 'text-[#ef4444]';
                              if (status === 'L') color = 'text-[#f97316]';
                              if (status === 'H') color = 'text-[#eab308]';
                              return (
                                <td key={i} className={"p-4 text-sm font-bold border-r border-[#3b3b5a] " + color}>
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
                          </>
                      ) : (
                          <>
                          <td className={"p-4 text-sm font-bold border-r border-[#3b3b5a] " + (row.status === 'P' ? 'text-[#4ade80]' : row.status === 'A' ? 'text-[#ef4444]' : row.status === 'L' ? 'text-[#f97316]' : 'text-[#eab308]')}>
                            {row.status || ''}
                          </td>
                          <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.punchInTime}</td>
                          <td className="p-4 text-sm font-semibold text-slate-300 border-r border-[#3b3b5a]">{row.punchOutTime}</td>
                          </>
                      )}
                    </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          
          {/* Table Footer */}
          <div className="bg-[#1c1c2e] border-t border-[#3b3b5a] rounded-b-lg flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                <ChevronDown size={14} className="rotate-90" /> Prev
              </button>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                Next <ChevronDown size={14} className="-rotate-90" />
              </button>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={handleExport} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                <Download size={16} /> Export
              </button>
              <div className="relative group">
                  <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                    Show {rowsPerPage} <ChevronDown size={16} />
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 w-24 bg-[#1c1c2e] border border-[#3b3b5a] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {[10, 20, 50, 100].map(n => (
                        <button 
                            key={n}
                            onClick={() => { setRowsPerPage(n); setCurrentPage(1); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#27273f] hover:text-white"
                        >
                            {n}
                        </button>
                    ))}
                  </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}



