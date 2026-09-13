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
}

export default function CustomSelect({ options, value, onChange, placeholder = "Select...", showAllOption = false, allOptionLabel = "All" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

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
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-slate-800 border ${isOpen ? 'border-[#00e5ff]' : 'border-slate-700'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[56px]`}
      >
        <div className="flex items-center gap-3 w-full pr-4 overflow-hidden">
          {selectedData ? (
            <>
              {(selectedData.avatarUrl || selectedData.showDefaultAvatar) && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0 border border-slate-500 overflow-hidden">
                  {selectedData.avatarUrl ? (
                    <img src={selectedData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-300" />
                  )}
                </div>
              )}
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-bold truncate">{selectedData.label}</span>
                {selectedData.subLabel && (
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                    {selectedData.subLabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
              {value === '' && showAllOption ? allOptionLabel : placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#00e5ff]' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60">
            <Search size={15} className="text-slate-500 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500 font-semibold"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {showAllOption && (
              <div
                onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${value === '' ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50'}`}
              >
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex-1">{allOptionLabel}</span>
                {value === '' && <Check size={16} className="text-[#00e5ff]" />}
              </div>
            )}
            {filteredOptions.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${value === o.value ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50'}`}
              >
                {(o.avatarUrl || o.showDefaultAvatar) && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
                    {o.avatarUrl ? (
                      <img src={o.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-slate-300" />
                    )}
                  </div>
                )}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{o.label}</span>
                  {o.subLabel && (
                    <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">{o.subLabel}</span>
                  )}
                </div>
                {o.rightBadge && <div className="shrink-0">{o.rightBadge}</div>}
                {value === o.value && <Check size={16} className="text-[#00e5ff] shrink-0" />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="py-8 text-center">
                <span className="text-slate-400 font-bold text-sm">No matches found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
