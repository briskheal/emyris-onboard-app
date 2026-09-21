import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, ChevronDown, RefreshCw } from 'lucide-react';
import MedornDateRangePicker from '../components/MedornDateRangePicker';

export default function TourProgramReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));
  const [frequencyReport, setFrequencyReport] = useState(false);

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

        {/* Date Picker */}
        <MedornDateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
        />

        {/* Data Table */}
        <div className="mt-8 bg-[#242538] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e1e2d] border-b border-[#3b3b5a]">
                  {['Sr no.', 'Date', 'Name', 'Area Type', 'Areas', 'Old Areas', 'Edited', 'Remarks', 'Activity', 'Worked with'].map(th => (
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
                    <td className="px-4 py-3 text-xs text-slate-300">{row.areas}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.oldAreas}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.edited}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{row.remarks}</td>
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
