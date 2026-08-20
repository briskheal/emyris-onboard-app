import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EDetailing() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('All Images');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menuItems = [
    'All Images',
    'Doctor Wise Product Images',
    'Specialization Wise Product List',
    'Other Images',
    'Presentations'
  ];

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-6 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">E-Detailing</h2>
          <button className="text-sm font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-all">
            Do you want to upload more images ?
          </button>
        </div>

        {/* CONTROLS */}
        <div className="relative w-full max-w-xs mb-8">
          <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1 mb-1.5">Select Type *</label>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center justify-between bg-slate-800/80 border ${isDropdownOpen ? 'border-sky-500' : 'border-slate-700/80'} rounded-xl px-4 py-3 hover:border-sky-500/50 transition-colors`}
          >
            <span className="font-semibold text-sm text-white">{selectedType}</span>
            <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a304e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
              <div className="flex flex-col py-1">
                {menuItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedType(item);
                      setIsDropdownOpen(false);
                    }}
                    className={`text-left px-5 py-3 text-sm font-semibold transition-colors
                      ${selectedType === item ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                    `}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-black text-white">NO</div>
        </div>

      </div>
    </div>
  );
}
