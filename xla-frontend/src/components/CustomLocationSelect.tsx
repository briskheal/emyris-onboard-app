import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Search } from 'lucide-react';

interface CustomLocationSelectProps {
  options: string[]; // List of strings (State names or HQ names)
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export default function CustomLocationSelect({ options, selectedValue, onChange, placeholder }: CustomLocationSelectProps) {
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

  const filteredOptions = searchTerm
    ? options.filter(o => (o || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-[#27273f] border ${isOpen ? 'border-sky-500' : 'border-[#3b3b5a]'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[50px]`}
      >
        <div className="flex items-center gap-3 w-full pr-4 overflow-hidden">
          {isOpen ? (
            <div className="flex items-center gap-2 w-full">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 font-semibold text-sm"
              />
            </div>
          ) : selectedValue ? (
            <>
              <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0 border border-sky-500/20 text-sky-400">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-bold truncate text-white">{selectedValue}</span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-semibold text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-[#1e1e30] border border-[#3b3b5a] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.map(o => (
              <div
                key={o}
                onClick={() => { onChange(o); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedValue === o ? 'bg-[#32324f] border border-sky-500/30' : 'hover:bg-[#27273f]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#27273f] flex items-center justify-center shrink-0 border border-[#3b3b5a]">
                  <MapPin size={16} className="text-slate-300" />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{o}</span>
                </div>
                {selectedValue === o && <Check size={16} className="text-sky-500" />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="py-8 text-center">
                <span className="text-slate-400 font-bold text-sm">No results found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
