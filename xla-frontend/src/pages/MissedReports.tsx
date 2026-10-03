import { useState, useEffect } from 'react';
import { Download, ChevronLeft, Target, ShieldAlert, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';


interface MissedReportData {
  _id: string;
  uid: string;
  name: string;
  degree?: string;
  category?: string;
  expected?: number;
  actual?: number;
  status: 'Met' | 'Partially Missed' | 'Missed';
  meetingDate: string;
  employeeName: string;
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
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedUser, setSelectedUser] = useState('all');
  
  const [users, setUsers] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<MissedReportData[]>([]);
  const [userwiseData, setUserwiseData] = useState<UserwiseData[]>([]);
  const [summary, setSummary] = useState({ met: 0, partiallyMissed: 0, missed: 0 });

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];

  const years = Array.from({length: 5}, (_, i) => (currentDate.getFullYear() - i).toString());

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, entityType, selectedMonth, selectedYear, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/api/xl/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setUsers(res.data.data.map((u: any) => ({ _id: u._id, name: `${u.firstName} ${u.lastName}` })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: reportType === 'Download Report' ? 'Monthly' : reportType.split(' ')[0], // 'Met/Missed', 'Monthly', 'Userwise'
        entityType,
        month: selectedMonth,
        year: selectedYear,
        userAllotted: selectedUser
      });

      const res = await axios.get(`/api/xl/missed-reports?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        setSummary(res.data.summary);
        if (reportType === 'Userwise Report') {
          setUserwiseData(res.data.data);
          setData([]);
        } else {
          setData(res.data.data);
          setUserwiseData([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const downloadExcel = () => {
    if (reportType === 'Userwise Report') {
      const ws = XLSX.utils.json_to_sheet(userwiseData.map((d, i) => ({
        'Sr no.': i + 1,
        'Employee Name': d.employeeName,
        [`Total ${entityType}`]: d.total,
        'Met': d.met,
        'Partially Missed': d.partiallyMissed,
        'Missed': d.missed
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Userwise Report");
      XLSX.writeFile(wb, `Userwise_${entityType}_Report.xlsx`);
    } else {
      const ws = XLSX.utils.json_to_sheet(data.map((d, i) => {
        let row: any = {
          'Sr no.': i + 1,
          'Employee Name': d.employeeName,
          'Name': d.name,
          'Status': d.status
        };
        if (entityType === 'Doctor') {
          row['UID'] = d.uid;
          row['Degree'] = d.degree;
          row['Category'] = d.category;
          row['Expected Visit'] = d.expected;
        }
        row['Actual Visits'] = d.actual;
        row['Meeting Date/Time'] = d.meetingDate;
        return row;
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${entityType} Report`);
      XLSX.writeFile(wb, `${entityType}_Missed_Report.xlsx`);
    }
  };

  return (
    <div className="min-h-screen bg-[#151521] text-slate-300 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1e1e2d] rounded-lg transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-wide">MISSED REPORTS</h1>
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
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none w-full">
              <option>Met/Missed Report</option>
              <option>Monthly Report</option>
              <option>Userwise Report</option>
              <option>Download Report</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Doc / Chem / Stk</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none w-full">
              <option>Doctor</option>
              <option>Chemist</option>
              <option>Stockist</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Month & Year</label>
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none w-full">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none w-full">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {reportType !== 'Userwise Report' && (
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none w-full">
                <option value="all">All Users</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
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
        <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#2d2d44] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              SHOWING ({reportType === 'Userwise Report' ? userwiseData.length : data.length}) ENTRIES
            </h2>
            {reportType !== 'Download Report' && (
              <button onClick={downloadExcel} className="text-xs flex items-center gap-1.5 bg-[#2d2d44] hover:bg-[#3b3b5a] text-slate-300 px-3 py-1.5 rounded transition-colors">
                <Download size={14} /> Export
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading records...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a]">
                  {reportType === 'Userwise Report' ? (
                    <tr>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium w-[1%] whitespace-nowrap">Sr no.</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">Employee Name</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium text-center">Total {entityType}</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium text-center text-emerald-400">Met</th>
                      {entityType === 'Doctor' && <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium text-center text-blue-400">Partially Missed</th>}
                      <th className="px-4 py-3 font-medium text-center text-orange-400">Missed</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium w-[1%] whitespace-nowrap">Sr no.</th>
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium w-[1%] whitespace-nowrap">Met/Missed</th>
                      {reportType === 'Monthly Report' && <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">Employee</th>}
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">Name</th>
                      {entityType === 'Doctor' && (
                        <>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">UID</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">Degree</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium">Category</th>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium text-center">Expected Visit</th>
                        </>
                      )}
                      <th className="px-4 py-3 border-r border-[#3b3b5a] font-medium text-center">Actual Visits</th>
                      <th className="px-4 py-3 font-medium text-center">Meeting Date</th>
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
                        <td className="px-4 py-2 border-r border-[#3b3b5a]">
                          <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide
                            ${d.status === 'Met' ? 'bg-emerald-500/10 text-emerald-400' : 
                              d.status === 'Partially Missed' ? 'bg-blue-500/10 text-blue-400' : 
                              'bg-orange-500/10 text-orange-400'}`}>
                            {d.status}
                          </span>
                        </td>
                        {reportType === 'Monthly Report' && <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.employeeName}</td>}
                        <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-indigo-300">{d.name}</td>
                        {entityType === 'Doctor' && (
                          <>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.uid}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.degree}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.category}</td>
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-center text-slate-400 font-semibold">{d.expected}</td>
                          </>
                        )}
                        <td className="px-4 py-2 border-r border-[#3b3b5a] text-center font-bold text-slate-200">{d.actual}</td>
                        <td className="px-4 py-2 text-center text-slate-400">{d.meetingDate}</td>
                      </tr>
                    ))
                  )}
                  {(reportType === 'Userwise Report' ? userwiseData.length : data.length) === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500">No data found for the selected criteria.</td>
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
