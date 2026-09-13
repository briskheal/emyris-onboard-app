import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, User } from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedData = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-800 border ${isOpen ? 'border-[#00e5ff]' : 'border-slate-700'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[56px]`}
      >
        <div className="flex items-center gap-3 overflow-hidden w-full pr-4">
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
                <span className={`font-bold truncate ${selectedData.subLabel ? 'text-sm' : 'text-sm'}`}>
                  {selectedData.label}
                </span>
                {selectedData.subLabel && (
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                    {selectedData.subLabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-400 font-semibold text-sm uppercase tracking-widest">
              <span>{value === '' && showAllOption ? allOptionLabel : placeholder}</span>
            </div>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#00e5ff]' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto custom-scrollbar py-2">
            
            {showAllOption && (
              <div 
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${value === '' ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
              >
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex-1">{allOptionLabel}</span>
                {value === '' && <Check size={16} className="text-[#00e5ff]" />}
              </div>
            )}
            
            {options.map((o) => (
              <div 
                key={o.value}
                onClick={() => { onChange(o.value); setIsOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${value === o.value ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
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
                  <span className="text-sm font-bold text-white truncate">
                    {o.label}
                  </span>
                  {o.subLabel && (
                    <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                      {o.subLabel}
                    </span>
                  )}
                </div>

                {o.rightBadge && (
                  <div className="shrink-0">
                    {o.rightBadge}
                  </div>
                )}

                {value === o.value && <Check size={16} className="text-[#00e5ff] shrink-0 ml-2" />}
              </div>
            ))}
            
            {options.length === 0 && (
              <div className="px-4 py-6 text-center text-sm font-bold text-slate-500">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
