import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check, Search } from 'lucide-react';

interface CustomUserSelectProps {
  users: any[];
  selectedUser: string;
  onChange: (employeeId: string) => void;
}

export default function CustomUserSelect({ users, selectedUser, onChange }: CustomUserSelectProps) {
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

  const selectedData = users.find(u => u.employeeId === selectedUser);

  const filteredUsers = searchTerm
    ? users.filter(u => {
        const name = (u.firstName + ' ' + (u.lastName || '')).toLowerCase();
        const role = (u.designation || u.employeeId || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || role.includes(searchTerm.toLowerCase());
      })
    : users;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-[#27273f] border ${isOpen ? 'border-[#00e5ff]' : 'border-[#3b3b5a]'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[56px]`}
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
                placeholder="Search users..."
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 font-semibold text-sm"
              />
            </div>
          ) : selectedData ? (
            <>
              <div className="w-8 h-8 rounded-full bg-[#32324f] flex items-center justify-center shrink-0 border border-[#3b3b5a] overflow-hidden">
                {selectedData.profilePic ? (
                  <img src={selectedData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-bold truncate">{selectedData.firstName} {selectedData.lastName}</span>
                <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                  {selectedData.designation || selectedData.employeeId}
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-semibold text-sm uppercase tracking-widest">Select User</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#00e5ff]' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-[#1e1e30] border border-[#3b3b5a] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredUsers.map(u => (
              <div
                key={u.employeeId}
                onClick={() => { onChange(u.employeeId); setIsOpen(false); setSearchTerm(''); }}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedUser === u.employeeId ? 'bg-[#32324f] border border-[#00e5ff]/30' : 'hover:bg-[#27273f]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#27273f] flex items-center justify-center shrink-0 border border-[#3b3b5a] overflow-hidden">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{u.firstName} {u.lastName}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                    {u.designation || u.employeeId}
                  </span>
                </div>
                {selectedUser === u.employeeId && <Check size={16} className="text-[#00e5ff]" />}
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center">
                <span className="text-slate-400 font-bold text-sm">No users found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
