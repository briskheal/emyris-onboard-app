import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import CustomUserSelect from '../components/CustomUserSelect';

export default function RoutesListReport() {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoutes('');
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) setUsers(res.data.users || res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoutes = async (employeeId: string) => {
    setLoading(true);
    try {
      const url = employeeId ? `/api/xl/reports/routes?employeeId=${employeeId}` : '/api/xl/reports/routes';
      const res = await axios.get(url);
      if (res.data.success) {
        setRoutes(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (val: string) => {
    setSelectedUser(val);
    fetchRoutes(val);
  };

  const exportToExcel = () => {
    const dataToExport = routes.map((r, i) => ({
      'Sr no.': i + 1,
      'Employee ID': r.employeeId,
      'HQ': r.hq,
      'State': r.state,
      'From City': r.fromCity,
      'To City': r.toCity,
      'Area Type': r.areaType,
      'Distance': r.distance,
      'Status': r.status,
      'Admin Remarks': r.adminRemarks,
      'Created At': new Date(r.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Route List");
    XLSX.writeFile(wb, "Route List.xlsx");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select User</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <CustomUserSelect users={users} selectedUser={selectedUser} onChange={handleUserChange} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({routes.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">User ID</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route (From - To)</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Area Type</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Distance</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td></tr>
                ) : routes.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Routes Found</td></tr>
                ) : (
                  routes.map((r, idx) => (
                    <tr key={r._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{r.employeeId || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{r.hq || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300 font-medium">
                        {r.fromCity} <span className="text-slate-500 mx-1">→</span> {r.toCity}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{r.areaType || '-'}</td>
                      <td className="px-4 py-4 text-sm text-sky-400 font-semibold">{r.distance || '0'} km</td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {r.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e] flex justify-end">
            <button onClick={exportToExcel} disabled={routes.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}