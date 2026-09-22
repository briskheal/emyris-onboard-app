import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import EmyrisDateRangePicker from '../components/EmyrisDateRangePicker';
import CustomUserSelect from '../components/CustomUserSelect';
import axios from 'axios';

export default function TourProgramReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));
  const [frequencyReport, setFrequencyReport] = useState(false);
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

  // Dummy data based on standard report columns
  const reportData = [
    { id: 1, date: '01 Sep 2026', name: 'Jigar Joshi', areaType: 'Out-Station', areas: 'Mumbai', oldAreas: '-', edited: 'No', remarks: 'Started early', activity: 'Working', workedWith: 'Admin' },
    { id: 2, date: '02 Sep 2026', name: 'Jigar Joshi', areaType: 'Local', areas: 'Thane', oldAreas: '-', edited: 'Yes', remarks: '-', activity: 'Working', workedWith: '-' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a27] flex flex-col text-slate-100 font-sans pb-24 md:pb-0 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#3b3b5a] bg-[#1a1a27]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[13px] font-black text-white tracking-widest uppercase">TOUR PROGRAM REPORTS</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Frequency Report</span>
          <button 
            onClick={() => setFrequencyReport(!frequencyReport)}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${frequencyReport ? 'bg-sky-500' : 'bg-[#3b3b5a]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${frequencyReport ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Select User Area */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">Select User</label>
          <div className="flex items-center gap-3">
            <div className="w-full max-w-sm">
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

        {/* Date Picker */}
        <EmyrisDateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
        />

        {/* Table Header Info */}
        <div className="mt-8 mb-4 flex justify-between items-end">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SHOWING ({reportData.length}) ENTRIES</h2>
          <button className="border border-sky-500 text-sky-400 px-4 py-1.5 rounded text-xs font-bold hover:bg-sky-500/10">
            View Status
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-[#1e2032] overflow-hidden">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#171f3a] border-b border-[#2d2f45]">
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date ↑</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">⚲</span> Name ↑
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Area Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Areas</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Old Areas</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Edited</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Remarks</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Activity</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Worked with</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">View Details</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id} className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap">{row.areaType}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.areas}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.oldAreas}</td>
                    <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{row.edited}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.remarks}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.activity}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{row.workedWith}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 text-center"><span className="cursor-pointer hover:text-white text-slate-400 text-lg">👁</span></td>
                  </tr>
                ))}
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
