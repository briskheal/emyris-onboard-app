import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, ChevronDown, RefreshCw } from 'lucide-react';
import MedornDateRangePicker from '../components/MedornDateRangePicker';

export default function CallReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));
  const [reportType, setReportType] = useState('Call Report');

  const reportData = [
    { id: 1, date: '01 Sep 2026', name: 'Jigar Joshi', areaType: 'Out-Station', docs: 12, chems: 5, stockists: 2, pob: '15,000', activity: 'Working', workedWith: 'Admin' },
    { id: 2, date: '02 Sep 2026', name: 'Jigar Joshi', areaType: 'Local', docs: 8, chems: 3, stockists: 0, pob: '4,500', activity: 'Working', workedWith: '-' },
  ];

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
            <label className="text-xs font-bold text-emerald-400 mb-2 block">Select User</label>
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-between bg-[#242538] border border-emerald-500/30 rounded-md px-4 py-2 min-w-[250px]">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    <UserPlus size={12} className="text-slate-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-none">Jigar Joshi</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sales Manager</p>
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
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
        <MedornDateRangePicker 
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

        {/* Data Table */}
        <div className="mt-6 bg-[#242538] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e1e2d] border-b border-[#3b3b5a]">
                  {['Sr no.', 'Date', 'Name', 'Area Type', 'Doctors', 'Chemists', 'Stockists', 'POB', 'Activity', 'Worked with'].map(th => (
                    <th key={th} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={row.id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-xs font-bold text-white whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 text-xs text-sky-400 font-bold whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{row.areaType}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-400">{row.docs}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-400">{row.chems}</td>
                    <td className="px-4 py-3 text-xs font-bold text-purple-400">{row.stockists}</td>
                    <td className="px-4 py-3 text-xs font-bold text-white">₹{row.pob}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.activity}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.workedWith}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
