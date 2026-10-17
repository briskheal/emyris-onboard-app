import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, User, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  avatarUrl?: string;
  showDefaultAvatar?: boolean;
  rightBadge?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  compact?: boolean;
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  showAllOption = false, 
  allOptionLabel = "All",
  compact = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedData = options.find(o => o.value === value);

  const filteredOptions = searchTerm
    ? options.filter(o =>
        o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* TRIGGER */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={
          compact
            ? `w-full bg-[#1a1a2e] border ${isOpen ? 'border-sky-400' : 'border-[#3b3b5a]'} text-white rounded-md px-2.5 py-0.5 flex items-center justify-between cursor-pointer transition-colors h-[30px] min-h-[30px]`
            : `w-full bg-slate-800 border ${isOpen ? 'border-[#00e5ff]' : 'border-slate-700'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[56px]`
        }
      >
        <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-3'} w-full pr-2 overflow-hidden`}>
          {isOpen ? (
            <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'} w-full`}>
              <Search size={compact ? 13 : 16} className="text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Search..."
                className={`w-full bg-transparent outline-none text-white placeholder:text-slate-500 font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
              />
            </div>
          ) : selectedData ? (
            <>
              {(selectedData.avatarUrl || selectedData.showDefaultAvatar) && (
                <div className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} rounded-full bg-slate-600 flex items-center justify-center shrink-0 border border-slate-500 overflow-hidden`}>
                  {selectedData.avatarUrl ? (
                    <img src={selectedData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={compact ? 12 : 16} className="text-slate-300" />
                  )}
                </div>
              )}
              <div className="flex flex-col overflow-hidden w-full">
                <span className={`${compact ? 'text-xs font-medium' : 'text-sm font-bold'} truncate`}>{selectedData.label}</span>
                {selectedData.subLabel && (
                  <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5`}>
                    {selectedData.subLabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={`flex items-center gap-2 text-slate-400 font-medium ${compact ? 'text-xs' : 'text-sm uppercase tracking-widest'}`}>
              <span className="truncate">{value === '' && showAllOption ? allOptionLabel : placeholder}</span>
            </div>
          )}
        </div>
        <ChevronDown size={compact ? 14 : 18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-sky-400' : ''}`} />
      </div>

      {/* DROPDOWN */}
      {isOpen && (
        <div className={`absolute top-full mt-1 left-0 right-0 z-[100] ${compact ? 'bg-[#1a1a2e] border-[#3b3b5a] rounded-lg' : 'bg-slate-800 border-slate-700 rounded-xl'} border shadow-2xl flex flex-col overflow-hidden`}>
          {/* LIST */}
          <div className={`${compact ? 'max-h-56 p-1' : 'max-h-64 p-1'} overflow-y-auto`}>
            {showAllOption && (
              <div
                onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center ${compact ? 'gap-2 p-1.5' : 'gap-3 p-2.5'} rounded-lg cursor-pointer transition-colors ${value === '' ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50'}`}
              >
                <div className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden`}>
                  <User size={compact ? 12 : 16} className="text-slate-300" />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-white truncate`}>{allOptionLabel}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">Filter</span>
                </div>
                {value === '' && <Check size={compact ? 13 : 16} className="text-[#00e5ff] shrink-0" />}
              </div>
            )}

            {filteredOptions.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center ${compact ? 'gap-2 p-1.5' : 'gap-3 p-2.5'} rounded-lg cursor-pointer transition-colors ${value === o.value ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50'}`}
              >
                {(o.avatarUrl || o.showDefaultAvatar) && (
                  <div className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden`}>
                    {o.avatarUrl ? (
                      <img src={o.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={compact ? 12 : 16} className="text-slate-300" />
                    )}
                  </div>
                )}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className={`${compact ? 'text-xs font-semibold' : 'text-sm font-bold'} text-white truncate`}>{o.label}</span>
                  {o.subLabel && (
                    <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5`}>{o.subLabel}</span>
                  )}
                </div>
                {o.rightBadge && <div className="shrink-0">{o.rightBadge}</div>}
                {value === o.value && <Check size={compact ? 13 : 16} className="text-[#00e5ff] shrink-0" />}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className={`${compact ? 'py-4' : 'py-8'} flex flex-col items-center justify-center text-center`}>
                <span className="text-slate-400 font-bold text-xs">No matches found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
