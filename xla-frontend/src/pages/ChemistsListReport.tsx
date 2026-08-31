import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import ChemistDetails from '../components/ChemistDetails';
import * as XLSX from 'xlsx';

export default function ChemistsListReport() {
  const [loading, setLoading] = useState(true);
  const [chemists, setChemists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [viewingChemist, setViewingChemist] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchChemists('');
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/xl/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChemists = async (employeeId: string) => {
    setLoading(true);
    try {
      const url = employeeId ? `/api/xl/reports/chemists?employeeId=${employeeId}` : '/api/xl/reports/chemists';
      const res = await axios.get(url);
      if (res.data.success) {
        setChemists(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedUser(val);
    fetchChemists(val);
  };

  const exportToExcel = () => {
    const dataToExport = chemists.map((c, i) => ({
      'Sr no.': i + 1,
      'Business Name': c.businessName,
      'Proprietor Name': c.proprietorName,
      Address: c.address,
      Contact: c.mobile || c.contact,
      HQ: c.headquarter,
      'Working Area': c.workingArea,
      Email: c.email,
      Birthday: c.birthday,
      Certifications: c.certifications
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chemist List");
    XLSX.writeFile(wb, "Chemist List.xlsx");
  };

  if (viewingChemist) {
    return <ChemistDetails chemist={viewingChemist} onBack={() => setViewingChemist(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select User</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <select 
            value={selectedUser} 
            onChange={handleUserChange}
            className="w-full max-w-sm bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.employeeId} value={u.employeeId}>
                {u.firstName} {u.lastName} ({u.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({chemists.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">Business Name ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietor Name ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Address ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Area</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td></tr>
                ) : chemists.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Chemists Found</td></tr>
                ) : (
                  chemists.map((c, idx) => (
                    <tr key={c._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{c.businessName}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.proprietorName || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.address || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.mobile || c.contact || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.headquarter || '-'}</td>
                      <td className="px-4 py-4 text-sm text-sky-400">{c.workingArea || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => setViewingChemist(c)} 
                          className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm mx-auto block"
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e] flex justify-end">
            <button onClick={exportToExcel} disabled={chemists.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}