import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, User, Search} from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      
    }
    return () => {
      
    };
  }, [isOpen]);

  const selectedData = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.subLabel && o.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(true
      )}
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
        <div className="absolute top-full mt-2 left-0 right-0 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
          
          
          
          <div className="bg-slate-800 w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-700">
            
            <div className="relative shrink-0 border-b border-slate-700/50 bg-transparent">
  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
  <input
    ref={inputRef}
    type="text"
    placeholder="Search options..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full bg-transparent outline-none pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-500 font-bold transition-colors"
  />
</div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {showAllOption && !searchTerm && (
                <div 
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${value === '' ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50 border border-transparent'}`}
                >
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex-1 pl-2">{allOptionLabel}</span>
                  {value === '' && <Check size={18} className="text-[#00e5ff]" />}
                </div>
      )}
              
              {filteredOptions.map((o) => (
                <div 
                  key={o.value}
                  onClick={() => { onChange(o.value); setIsOpen(false); }}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${value === o.value ? 'bg-slate-700 border border-sky-500/30' : 'hover:bg-slate-700/50 border border-transparent'}`}
                >
                  {(o.avatarUrl || o.showDefaultAvatar) && (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
                      {o.avatarUrl ? (
                        <img src={o.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-slate-300" />
      )}
                    </div>
      )}
                  
                  <div className="flex flex-col flex-1 overflow-hidden pl-2">
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

                  {value === o.value && <Check size={18} className="text-[#00e5ff] shrink-0 ml-2" />}
                </div>
              )
      )}
              
              {filteredOptions.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Search size={48} className="text-slate-700 mb-4" />
                  <span className="text-slate-400 font-bold">No matches found</span>
                </div>
      )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




