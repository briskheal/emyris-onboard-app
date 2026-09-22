import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MedornDateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export default function MedornDateRangePicker({ startDate, endDate, onChange }: MedornDateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // September 2026 default based on screenshot

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const leftCalendarDate = currentMonth;
  const rightCalendarDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const leftDays = generateCalendar(leftCalendarDate);
  const rightDays = generateCalendar(rightCalendarDate);

  const isSelected = (date: Date) => {
    if (!date || !startDate) return false;
    if (!endDate) return date.getTime() === startDate.getTime();
    return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
  };

  const isEdge = (date: Date) => {
    if (!date || !startDate) return false;
    if (!endDate) return date.getTime() === startDate.getTime();
    return date.getTime() === startDate.getTime() || date.getTime() === endDate.getTime();
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      onChange(date, null);
    } else {
      if (date < startDate) {
        onChange(date, startDate);
      } else {
        onChange(startDate, date);
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const setQuickFilter = (type: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let start = new Date(today);
    let end = new Date(today);

    switch(type) {
      case 'Today':
        break;
      case 'Yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'This Week':
        const day = today.getDay();
        start.setDate(today.getDate() - day);
        break;
      case 'Last Week':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        start = new Date(lastWeek);
        start.setDate(lastWeek.getDate() - lastWeek.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'This Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last Month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
    }
    setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    onChange(start, end);
  };

  const renderCalendar = (days: (Date | null)[], title: string) => (
    <div className="flex-1">
      <div className="mb-4 text-xs font-bold text-slate-300 ml-2">{title}</div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] uppercase font-bold text-slate-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="py-1.5"></div>;
          const selected = isSelected(d);
          const edge = isEdge(d);
          return (
            <div key={i} className={`py-1.5 cursor-pointer text-xs font-medium transition-colors ${selected ? (edge ? 'bg-sky-500 text-white rounded shadow-lg' : 'bg-sky-500/20 text-sky-400') : 'text-slate-300 hover:bg-slate-700 rounded'}`}
                 onClick={() => handleDateClick(d)}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row w-full mt-4 bg-[#1e2032]">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 bg-[#1a1b2d] flex flex-col border-r border-[#2d2f45]">
        {['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month'].map(f => (
          <button key={f} onClick={() => setQuickFilter(f)} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-[#27273f] border-b border-[#3b3b5a]/50 transition-colors">
            {f}
          </button>
        ))}
        <div className="p-4 mt-auto space-y-2">
          <div className="bg-[#27273f] rounded px-3 py-2 text-xs text-slate-400 flex justify-between items-center border border-[#3b3b5a]">
            <span className="font-bold text-slate-300">21</span> <span className="text-[10px]">days up to today</span>
          </div>
          <div className="bg-[#27273f] rounded px-3 py-2 text-xs text-slate-400 flex justify-between items-center border border-[#3b3b5a]">
            <span className="font-bold text-slate-300">-</span> <span className="text-[10px]">days starting today</span>
          </div>
        </div>
      </div>

      {/* Calendars Area */}
      <div className="flex-1 p-5 flex flex-col bg-transparent">
        {/* Top Selected Dates */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-[#27273f] border border-[#3b3b5a] rounded-md py-2 px-4 text-center text-xs font-bold text-slate-300">
            {formatDate(startDate)}
          </div>
          <div className="flex-1 bg-[#27273f] border border-[#3b3b5a] rounded-md py-2 px-4 text-center text-xs font-bold text-slate-300">
            {formatDate(endDate)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button onClick={handlePrevMonth} className="p-2 bg-[#27273f] rounded text-slate-400 hover:text-sky-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex gap-3 relative z-10">
            <select 
              className="bg-[#27273f] text-xs font-bold text-slate-300 px-3 py-1.5 rounded outline-none border border-[#3b3b5a] cursor-pointer"
              value={currentMonth.getMonth()}
              onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              className="bg-[#27273f] text-xs font-bold text-slate-300 px-3 py-1.5 rounded outline-none border border-[#3b3b5a] cursor-pointer"
              value={currentMonth.getFullYear()}
              onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))}
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button onClick={handleNextMonth} className="p-2 bg-[#27273f] rounded text-slate-400 hover:text-sky-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dual Calendar Grid */}
        <div className="flex flex-col md:flex-row gap-6">
          {renderCalendar(leftDays, leftCalendarDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))}
          {renderCalendar(rightDays, rightCalendarDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))}
        </div>
      </div>
    </div>
  );
}
