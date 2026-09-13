import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check, Search} from 'lucide-react';

interface CustomUserSelectProps {
  users: any[];
  selectedUser: string;
  onChange: (employeeId: string) => void;
}

export default function CustomUserSelect({ users, selectedUser, onChange }: CustomUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      // Prevent body scrolling when modal is open
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      
    }
    return () => {
      
    };
  }, [isOpen]);

  const selectedData = users.find(u => u.employeeId === selectedUser);

  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const designation = (u.designation || u.employeeId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || designation.includes(search);
  });

  return (
    <div className="relative w-full">
      {/* TRIGGER BUTTON */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full bg-[#27273f] border ${isOpen ? 'border-[#00e5ff]' : 'border-[#3b3b5a]'} text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-lg min-h-[56px]`}
      >
        <div className="flex items-center gap-3 w-full pr-4 overflow-hidden">
          {selectedData ? (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0 border border-slate-500 overflow-hidden">
                {selectedData.profilePic ? (
                  <img src={selectedData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-bold truncate">
                  {selectedData.firstName} {selectedData.lastName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                  {selectedData.designation || selectedData.employeeId}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <User size={18} />
              <span>Select User</span>
            </div>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#00e5ff]' : ''}`} />
      </div>

      {/* PORTAL MODAL */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
          
          {/* BACKDROP CLICK DISMISS */}
          
          
          <div className="bg-[#1e1e30] w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-[#3b3b5a]">
            
            {/* HEADER & SEARCH */}
            <div className="p-4 border-b border-[#3b3b5a] bg-[#1e1e30] flex flex-col gap-3 shrink-0">
              
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#27273f] border border-[#3b3b5a] outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 font-bold focus:border-[#00e5ff] transition-colors"
                />
              </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {!searchTerm && (
                <div 
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${selectedUser === '' ? 'bg-[#32324f] border border-[#00e5ff]/30' : 'hover:bg-[#27273f] border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#27273f] flex items-center justify-center shrink-0 border border-[#3b3b5a]">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex-1">All Users</span>
                  {selectedUser === '' && <Check size={18} className="text-[#00e5ff]" />}
                </div>
              )}
              
              {filteredUsers.map(u => (
                <div 
                  key={u.employeeId}
                  onClick={() => { onChange(u.employeeId); setIsOpen(false); }}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors mb-1 ${selectedUser === u.employeeId ? 'bg-[#32324f] border border-[#00e5ff]/30' : 'hover:bg-[#27273f] border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#27273f] flex items-center justify-center shrink-0 border border-[#3b3b5a] overflow-hidden">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-bold text-white truncate">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest mt-0.5">
                      {u.designation || u.employeeId}
                    </span>
                  </div>
                  {selectedUser === u.employeeId && <Check size={18} className="text-[#00e5ff]" />}
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <User size={48} className="text-[#3b3b5a] mb-4" />
                  <span className="text-slate-400 font-bold">No users found</span>
                  <span className="text-slate-500 text-xs mt-1">Try a different search term</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


