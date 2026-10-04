import { useState, useEffect } from 'react';
import { Download, ChevronLeft, Target, ShieldAlert, XCircle, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';
import CustomUserSelect from '../components/CustomUserSelect';

interface MissedReportData {
  _id: string;
  uid: string;
  name: string;
  degree?: string;
  category?: string;
  expected?: number;
  actual?: number;
  status: 'Met' | 'Partially Missed' | 'Missed' | 'Fully Missed';
  meetingDate: string;
  employeeName: string;
  monthlyBreakdown?: Record<string, string>;
}

interface UserwiseData {
  employeeId: string;
  employeeName: string;
  total: number;
  met: number;
  partiallyMissed: number;
  missed: number;
}

export default function MissedReports() {
  const navigate = useNavigate();
  
  const [reportType, setReportType] = useState('Met/Missed Report');
  const [entityType, setEntityType] = useState('Doctor');
  
  const currentDate = new Date();
  
  // Single Month State
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Range Month State (For Monthly Report)
  const [startMonth, setStartMonth] = useState((currentDate.getMonth() + 1).toString());
  const [startYear, setStartYear] = useState(currentDate.getFullYear().toString());
  const [showStartMonthPicker, setShowStartMonthPicker] = useState(false);

  const [endMonth, setEndMonth] = useState((currentDate.getMonth() + 1).toString());
  const [endYear, setEndYear] = useState(currentDate.getFullYear().toString());
  const [showEndMonthPicker, setShowEndMonthPicker] = useState(false);

  const [selectedUser, setSelectedUser] = useState('all');
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<MissedReportData[]>([]);
  const [userwiseData, setUserwiseData] = useState<UserwiseData[]>([]);
  const [summary, setSummary] = useState({ met: 0, partiallyMissed: 0, missed: 0 });
  const [monthsInRange, setMonthsInRange] = useState<string[]>([]);

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, entityType, selectedMonth, selectedYear, startMonth, startYear, endMonth, endYear, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        const mapped = res.data.users.map((u: any) => ({
          ...u,
          _realEmployeeId: u.employeeId,
          employeeId: u._id // override to make CustomUserSelect use _id for selection
        }));
        mapped.unshift({
          employeeId: 'all',
          firstName: 'All',
          lastName: 'Users',
          designation: 'View all users'
        });
        setUsers(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const typeStr = reportType === 'Download Report' ? 'Monthly' : reportType.split(' ')[0];
      const params: any = {
        reportType: typeStr, // 'Met/Missed', 'Monthly', 'Userwise'
        entityType,
        userAllotted: typeStr === 'Userwise' ? 'all' : selectedUser
      };

      if (typeStr === 'Monthly') {
         params.startMonth = startMonth;
         params.startYear = startYear;
         params.endMonth = endMonth;
         params.endYear = endYear;
      } else {
         params.month = selectedMonth;
         params.year = selectedYear;
      }

      const res = await axios.get('/api/xl/missed-reports', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        setSummary(res.data.summary);
        if (typeStr === 'Userwise') {
          setUserwiseData(res.data.data);
          setData([]);
          setMonthsInRange([]);
        } else {
          setData(res.data.data);
          setUserwiseData([]);
          setMonthsInRange(res.data.monthsInRange || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const downloadExcel = () => {
    const applyHeaderStyle = (ws: any) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          fill: { fgColor: { rgb: "4F81BD" } },
          font: { color: { rgb: "FFFFFF" }, bold: true }
        };
      }
    };

    if (reportType === 'Userwise Report') {
      const ws = XLSX.utils.json_to_sheet(userwiseData.map((d, i) => ({
        'Sr no.': i + 1,
        'Employee Name': d.employeeName,
        ['Total ' + entityType]: d.total,
        'Met': d.met,
        'Partially Missed': d.partiallyMissed,
        'Missed': d.missed
      })));
      applyHeaderStyle(ws);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Userwise Report");
      XLSX.writeFile(wb, 'Userwise_' + entityType + '_Report.xlsx');
    } else {
      const isMonthly = reportType === 'Monthly Report' || reportType === 'Download Report';
      const ws = XLSX.utils.json_to_sheet(data.map((d, i) => {
        let row: any = {
          'Sr no.': i + 1
        };
        if (isMonthly) row['Employee'] = d.employeeName;
        row['Status'] = d.status;
        row['Name'] = d.name;
        
        if (entityType === 'Doctor') {
          row['UID'] = d.uid;
          row['Degree'] = d.degree;
          row['Speciality'] = (d as any).specialization;
          row['Category'] = d.category;
          row['Expected Visit'] = d.expected;
        }
        row['Actual Visits'] = d.actual;
        
        if (isMonthly && d.monthlyBreakdown) {
           monthsInRange.forEach(m => {
              row[m] = d.monthlyBreakdown![m] || '-';
           });
        } else {
           row['Meeting Date/Time'] = d.meetingDate;
        }

        return row;
      }));
      applyHeaderStyle(ws);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entityType + ' Report');
      XLSX.writeFile(wb, entityType + '_Missed_Report.xlsx');
    }
  };

  return (

    <div className="min-h-screen bg-[#151521] text-slate-300 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1e1e2d] rounded-lg transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">MISSED REPORTS</h1>
          </div>
          {reportType === 'Download Report' && (
            <button onClick={downloadExcel} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
              <Download size={18} />
              Download Reports
            </button>
          )}
        </div>

        {/* Filters Box */}
        <div className="bg-[#1e1e2d] border border-[#2d2d44] p-4 flex flex-wrap gap-6 items-end shadow-sm">
          <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-500 focus:outline-none w-full transition-colors h-[42px] cursor-pointer">
              <option>Met/Missed Report</option>
              <option>Monthly Report</option>
              <option>Userwise Report</option>
              <option>Download Report</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Doc / Chem / Stk</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-500 focus:outline-none w-full transition-colors h-[42px] cursor-pointer">
              <option>Doctor</option>
              <option>Chemist</option>
              <option>Stockist</option>
            </select>
          </div>

          {(reportType === 'Monthly Report' || reportType === 'Download Report') ? (
            <>
              <div className="flex flex-col gap-2 flex-1 min-w-[140px] relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Start Month</label>
                <div 
                  onClick={() => { setShowStartMonthPicker(!showStartMonthPicker); setShowEndMonthPicker(false); }}
                  className="flex items-center justify-between bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 h-[42px] text-slate-300 font-semibold text-sm cursor-pointer hover:border-indigo-500 transition-colors"
                >
                  <span>{months.find(m => m.value === startMonth)?.label} {startYear}</span>
                  <Calendar size={16} className="text-slate-400" />
                </div>
                {showStartMonthPicker && (
                  <div className="absolute top-[68px] left-0 w-[260px] bg-[#1e1e2d] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                     <div className="flex justify-between items-center mb-4">
                        <button onClick={(e) => { e.stopPropagation(); setStartYear((parseInt(startYear)-1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronLeft size={16} /></button>
                        <span className="font-bold text-white">{startYear}</span>
                        <button onClick={(e) => { e.stopPropagation(); setStartYear((parseInt(startYear)+1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronRight size={16} /></button>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {months.map((m) => (
                           <div 
                              key={m.value} 
                              onClick={() => { setStartMonth(m.value); setShowStartMonthPicker(false); }}
                              className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${startMonth === m.value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-[#2a2a40]'}`}
                           >{m.label}</div>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[140px] relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select End Month</label>
                <div 
                  onClick={() => { setShowEndMonthPicker(!showEndMonthPicker); setShowStartMonthPicker(false); }}
                  className="flex items-center justify-between bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 h-[42px] text-slate-300 font-semibold text-sm cursor-pointer hover:border-indigo-500 transition-colors"
                >
                  <span>{months.find(m => m.value === endMonth)?.label} {endYear}</span>
                  <Calendar size={16} className="text-slate-400" />
                </div>
                {showEndMonthPicker && (
                  <div className="absolute top-[68px] left-0 w-[260px] bg-[#1e1e2d] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                     <div className="flex justify-between items-center mb-4">
                        <button onClick={(e) => { e.stopPropagation(); setEndYear((parseInt(endYear)-1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronLeft size={16} /></button>
                        <span className="font-bold text-white">{endYear}</span>
                        <button onClick={(e) => { e.stopPropagation(); setEndYear((parseInt(endYear)+1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronRight size={16} /></button>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {months.map((m) => (
                           <div 
                              key={m.value} 
                              onClick={() => { setEndMonth(m.value); setShowEndMonthPicker(false); }}
                              className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${endMonth === m.value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-[#2a2a40]'}`}
                           >{m.label}</div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 flex-1 min-w-[140px] relative">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Month & Year</label>
              <div 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center justify-between bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 h-[42px] text-slate-300 font-semibold text-sm cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <span>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                <Calendar size={16} className="text-slate-400" />
              </div>
              {showMonthPicker && (
                <div className="absolute top-[68px] left-0 w-[260px] bg-[#1e1e2d] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-4">
                   <div className="flex justify-between items-center mb-4">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedYear((parseInt(selectedYear)-1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronLeft size={16} /></button>
                      <span className="font-bold text-white">{selectedYear}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedYear((parseInt(selectedYear)+1).toString()); }} className="p-1 hover:bg-[#2a2a40] rounded text-slate-400"><ChevronRight size={16} /></button>
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {months.map((m) => (
                         <div 
                            key={m.value} 
                            onClick={() => { setSelectedMonth(m.value); setShowMonthPicker(false); }}
                            className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${selectedMonth === m.value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-[#2a2a40]'}`}
                         >{m.label}</div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {reportType !== 'Userwise Report' && (
            <div className="flex flex-col gap-2 flex-1 min-w-[140px] z-50">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select User</label>
              <CustomUserSelect users={users} selectedUser={selectedUser} onChange={setSelectedUser} />
            </div>
          )}
        </div>

        {/* KPI Cards */}
        {reportType !== 'Userwise Report' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-emerald-400/80 text-sm font-semibold mb-1 uppercase">Met</p>
                <h3 className="text-3xl font-bold text-emerald-400">{summary.met}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Target className="text-emerald-400" size={24} />
              </div>
            </div>

            {entityType === 'Doctor' && (
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-blue-400/80 text-sm font-semibold mb-1 uppercase">Partially Missed</p>
                  <h3 className="text-3xl font-bold text-blue-400">{summary.partiallyMissed}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShieldAlert className="text-blue-400" size={24} />
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-orange-400/80 text-sm font-semibold mb-1 uppercase">Missed</p>
                <h3 className="text-3xl font-bold text-orange-400">{summary.missed}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <XCircle className="text-orange-400" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
          <div className="p-4 border-b border-[#2d2d44] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              SHOWING ({reportType === 'Userwise Report' ? userwiseData.length : data.length}) ENTRIES
            </h2>
            {reportType !== 'Download Report' && (
              <button onClick={downloadExcel} className="text-xs flex items-center gap-1.5 bg-[#2d2d44] hover:bg-[#3b3b5a] text-slate-300 px-3 py-1.5 rounded transition-colors border border-[#3b3b5a]">
                <Download size={14} /> Export
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading records...</div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a]">
                  {reportType === 'Userwise Report' ? (
                    <tr>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] w-[1%]">Sr no.</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a]">Employee Name</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] text-center">Total {entityType}</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] text-center text-emerald-400">Met</th>
                      {entityType === 'Doctor' && <th className="px-4 py-3 border-r border-[#3b3b5a] text-center text-blue-400">Partially Missed</th>}
                      <th className="px-4 py-3 text-center text-orange-400">Missed</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] w-[1%]">Sr no.</th>
                      
                      {(reportType === 'Monthly Report' || reportType === 'Download Report') && (
                        <th className="px-4 py-3 border-r border-[#3b3b5a]">Employee</th>
                      )}
                      
                      <th className="px-4 py-3 border-r border-[#3b3b5a] text-center w-[1%]">Met/Missed</th>
                      
                      <th className="px-4 py-3 border-r border-[#3b3b5a]">Name</th>
                      
                      {entityType === 'Doctor' && (
                        <>
                          <th className="px-4 py-3 border-r border-[#3b3b5a]">UID</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a]">Degree</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a]">Category</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] text-center text-indigo-300">Expected Visit</th>
                        </>
                      )}
                      
                      <th className="px-4 py-3 border-r border-[#3b3b5a] text-center text-indigo-300">Actual Visits</th>
                      
                      {(reportType === 'Monthly Report' || reportType === 'Download Report') ? (
                         monthsInRange.map(m => (
                            <th key={m} className="px-4 py-3 border-r border-[#3b3b5a] text-center text-sky-400">{m}</th>
                         ))
                      ) : (
                         <th className="px-4 py-3 text-center">Meeting Date</th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {reportType === 'Userwise Report' ? (
                    userwiseData.map((d, i) => (
                      <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium">{d.employeeName}</td>
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-center font-bold text-slate-200">{d.total}</td>
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-center font-bold text-emerald-400">{d.met}</td>
                        {entityType === 'Doctor' && <td className="px-4 py-2 border-r border-[#3b3b5a] text-center font-bold text-blue-400">{d.partiallyMissed}</td>}
                        <td className="px-4 py-2 text-center font-bold text-orange-400">{d.missed}</td>
                      </tr>
                    ))
                  ) : (
                    data.map((d, i) => (
                      <tr key={d._id} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                        
                        {(reportType === 'Monthly Report' || reportType === 'Download Report') && (
                          <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-300 font-medium">{d.employeeName}</td>
                        )}

                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                            ${d.status === 'Met' ? 'bg-emerald-500/10 text-emerald-400' : 
                              d.status === 'Partially Missed' ? 'bg-blue-500/10 text-blue-400' : 
                              'bg-rose-500/10 text-rose-400'}`}>
                            {d.status}
                          </span>
                        </td>
                        
                        <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.name}</td>
                        
                        {entityType === 'Doctor' && (
                          <>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.uid}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.degree}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.category}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-center text-slate-300 font-semibold">{d.expected}</td>
                          </>
                        )}
                        
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-center font-bold text-slate-200">{d.actual}</td>
                        
                        {(reportType === 'Monthly Report' || reportType === 'Download Report') ? (
                           monthsInRange.map(m => (
                              <td key={m} className="px-4 py-2 border-r border-[#3b3b5a] text-center font-semibold text-slate-300">
                                 {d.monthlyBreakdown?.[m] || '-'}
                              </td>
                           ))
                        ) : (
                           <td className="px-4 py-2 text-center text-slate-400">{d.meetingDate}</td>
                        )}
                      </tr>
                    ))
                  )}
                  {(reportType === 'Userwise Report' ? userwiseData.length : data.length) === 0 && !loading && (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-slate-500 font-medium">No data found for the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}







