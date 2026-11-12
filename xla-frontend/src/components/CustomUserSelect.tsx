import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check, Search } from 'lucide-react';

interface CustomUserSelectProps {
  users: any[];
  selectedUser: string;
  onChange: (employeeId: string) => void;
  placeholder?: string;
}

export default function CustomUserSelect({ users, selectedUser, onChange, placeholder = 'Select User' }: CustomUserSelectProps) {
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

  const getDisplayName = (u: any) => u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.employeeId || 'User';

  const isDeactivated = (u: any) => {
    const s = (u.status || '').toLowerCase();
    return s === 'deactivated' || s === 'inactive' || s === 'blocked' || Boolean(u.isLocked);
  };

  const selectedData = users.find(u => u.employeeId === selectedUser || u._id === selectedUser);

  const filteredUsers = searchTerm
    ? users.filter(u => {
        const name = getDisplayName(u).toLowerCase();
        const role = (u.designation || '').toLowerCase();
        const empId = (u.employeeId || '').toLowerCase();
        const hq = (u.hq || '').toLowerCase();
        const status = (u.status || '').toLowerCase();
        const q = searchTerm.toLowerCase();
        return name.includes(q) || role.includes(q) || empId.includes(q) || hq.includes(q) || status.includes(q);
      })
    : users;

  return (
    <div ref={containerRef} className="relative w-full min-w-[240px]">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-[#1e243d] border ${isOpen ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-[#363e63]'} text-slate-300 rounded-xl px-3.5 py-1.5 flex items-center justify-between cursor-pointer hover:border-sky-400 transition-colors min-h-[44px]`}
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
                placeholder="Search user by name, ID, HQ..."
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 font-semibold text-xs md:text-sm pl-1"
              />
            </div>
          ) : selectedData ? (
            <>
              <div className="w-7 h-7 rounded-full bg-[#283152] flex items-center justify-center shrink-0 border border-[#363e63] overflow-hidden">
                {selectedData.profilePic ? (
                  <img src={selectedData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-sky-400" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs md:text-sm font-bold text-white truncate">
                    {getDisplayName(selectedData)}
                  </span>
                  {isDeactivated(selectedData) && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded font-black shrink-0">
                      DEACTIVATED
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider leading-tight">
                  {selectedData.employeeId}{selectedData.hq ? ` • ${selectedData.hq}` : ''}{selectedData.designation ? ` • ${selectedData.designation}` : ''}
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-semibold text-xs md:text-sm uppercase tracking-wider truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-sky-400' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 min-w-[340px] w-full z-50 bg-[#181f38] border border-[#363e63] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-80">
          <div className="overflow-y-auto p-1.5 space-y-1">
            {filteredUsers.map(u => {
              const uId = u.employeeId || u._id;
              const isSelected = selectedUser === uId || selectedUser === u.employeeId;
              const deactivated = isDeactivated(u);
              return (
                <div
                  key={uId}
                  onClick={() => { onChange(u.employeeId || uId); setIsOpen(false); setSearchTerm(''); }}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-sky-600/30 border border-sky-400/50' : 'hover:bg-[#20294a]'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#283152] flex items-center justify-center shrink-0 border border-[#363e63] overflow-hidden">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className={deactivated ? 'text-rose-400' : 'text-slate-300'} />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-bold text-white truncate">
                        {getDisplayName(u)}
                      </span>
                      {deactivated && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded font-black shrink-0">
                          DEACTIVATED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
                      {u.employeeId}{u.hq ? ` • ${u.hq}` : ''}{u.designation ? ` • ${u.designation}` : ''}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="text-sky-400 shrink-0" />}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="py-6 text-center">
                <span className="text-slate-400 font-bold text-xs">No users matching search</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
