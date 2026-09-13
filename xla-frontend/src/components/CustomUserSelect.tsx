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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedData = users.find(u => u.employeeId === selectedUser);

  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const designation = (u.designation || u.employeeId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || designation.includes(search);
  });

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#27273f] border ${isOpen ? 'border-[#00e5ff]' : 'border-[#3b3b5a]'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedData ? (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0 border border-slate-500 overflow-hidden">
                {selectedData.profilePic ? (
                  <img src={selectedData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">
                  {selectedData.firstName} {selectedData.lastName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">
                  {selectedData.designation || selectedData.employeeId}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <User size={18} />
              <span>All Users</span>
            </div>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00e5ff]' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#27273f] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
          {users.length > 5 && (
            <div className="p-3 border-b border-[#3b3b5a] bg-[#27273f]/90 backdrop-blur sticky top-0 z-10 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1e1e2d] border border-[#3b3b5a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00e5ff] transition-colors"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {!searchTerm && (
              <div 
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selectedUser === '' ? 'bg-[#32324f]' : 'hover:bg-[#32324f]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                  <User size={16} className="text-slate-400" />
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex-1">All Users</span>
                {selectedUser === '' && <Check size={16} className="text-[#00e5ff]" />}
              </div>
            )}
            
            {filteredUsers.map(u => (
              <div 
                key={u.employeeId}
                onClick={() => { onChange(u.employeeId); setIsOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-t border-[#3b3b5a]/50 ${selectedUser === u.employeeId ? 'bg-[#32324f]' : 'hover:bg-[#32324f]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">
                    {u.designation || u.employeeId}
                  </span>
                </div>
                {selectedUser === u.employeeId && <Check size={16} className="text-[#00e5ff]" />}
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="px-4 py-6 text-center text-sm font-bold text-slate-500">
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
