import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';

export default function GeoFencingListReport() {
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState('Doctor');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) setUsers(res.data.users || res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm mb-4">
          <ChevronLeft size={18} /> GEO FENCING
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select User</h2>
            <select 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
            >
              <option value="">Select...</option>
              {users.map(u => (
                <option key={u.employeeId} value={u.employeeId}>
                  {u.firstName} {u.lastName} ({u.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select Type</h2>
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
            >
              <option value="Doctor">Doctor</option>
              <option value="Chemist">Chemist</option>
              <option value="Stockist">Stockist</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 items-center justify-center">
        <div className="text-slate-500 font-bold uppercase tracking-widest text-sm">
          No Tagged Data Found
        </div>
      </div>
    </div>
  );
}
