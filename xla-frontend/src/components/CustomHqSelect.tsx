import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Search } from 'lucide-react';

interface CustomHqSelectProps {
  hqs: any[];
  selectedHq: string;
  onChange: (hqName: string) => void;
  placeholder?: string;
  countMap?: Record<string, number>;
}

export default function CustomHqSelect({
  hqs,
  selectedHq,
  onChange,
  placeholder = 'Select Headquarter...',
  countMap
}: CustomHqSelectProps) {
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

  const getHqName = (h: any) => (typeof h === 'string' ? h : h.hqName || h.name || '');
  const getHqState = (h: any) => (typeof h === 'string' ? '' : h.state || '');

  // Extract unique clean list
  const uniqueHqs = Array.from(
    new Map(
      hqs
        .filter(Boolean)
        .map(h => {
          const name = getHqName(h);
          return [name.toLowerCase().trim(), typeof h === 'string' ? { hqName: h, state: '' } : h];
        })
    ).values()
  ).filter(h => getHqName(h).trim() !== '');

  const selectedData = uniqueHqs.find(
    h => getHqName(h).toLowerCase().trim() === (selectedHq || '').toLowerCase().trim()
  );

  const filteredHqs = searchTerm
    ? uniqueHqs.filter(h => {
        const name = getHqName(h).toLowerCase();
        const state = getHqState(h).toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || state.includes(q);
      })
    : uniqueHqs;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-[#1e243d] border ${
          isOpen ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-[#363e63]'
        } text-slate-300 rounded-xl px-3 py-1 flex items-center justify-between cursor-pointer hover:border-sky-400 transition-colors h-[42px]`}
      >
        <div className="flex items-center gap-2.5 w-full pr-2 overflow-hidden">
          {isOpen ? (
            <div className="flex items-center gap-2 w-full">
              <Search size={16} className="text-sky-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Search HQ by name or state..."
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 font-semibold text-xs md:text-sm"
              />
            </div>
          ) : selectedData ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#283152] flex items-center justify-center shrink-0 border border-[#363e63]">
                <MapPin size={13} className="text-emerald-400" />
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-white truncate">
                    {getHqName(selectedData)}
                  </span>
                  {countMap && countMap[getHqName(selectedData).toLowerCase().trim()] !== undefined && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded-full font-mono">
                      {countMap[getHqName(selectedData).toLowerCase().trim()]} DCS
                    </span>
                  )}
                </div>
                {getHqState(selectedData) && (
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider leading-tight">
                    {getHqState(selectedData)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-semibold text-xs md:text-sm uppercase tracking-wider">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-[#181f38] border border-[#363e63] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-72">
          <div className="overflow-y-auto p-1.5 space-y-1">
            {filteredHqs.map(h => {
              const name = getHqName(h);
              const state = getHqState(h);
              const isSelected =
                (selectedHq || '').toLowerCase().trim() === name.toLowerCase().trim();
              const count = countMap ? countMap[name.toLowerCase().trim()] : undefined;

              return (
                <div
                  key={name}
                  onClick={() => {
                    onChange(name);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600/30 border border-sky-400/50'
                      : 'hover:bg-[#20294a]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#283152] flex items-center justify-center shrink-0 border border-[#363e63]">
                    <MapPin size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between pr-2">
                      <span className="text-xs md:text-sm font-bold text-white truncate">
                        {name}
                      </span>
                      {count !== undefined && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                          {count} records
                        </span>
                      )}
                    </div>
                    {state && (
                      <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
                        {state}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={16} className="text-sky-400 shrink-0" />}
                </div>
              );
            })}
            {filteredHqs.length === 0 && (
              <div className="py-6 text-center">
                <span className="text-slate-400 font-bold text-xs">No headquarters matching search</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
