import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LocationsListReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ doctors: [], chemists: [], stockists: [] });
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [areaType, setAreaType] = useState('HQ'); // HQ, City, Local Area

  useEffect(() => {
    fetchUsers();
    fetchLocations('');
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/xl/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLocations = async (employeeId: string) => {
    setLoading(true);
    try {
      const url = employeeId ? `/api/xl/reports/locations?employeeId=${employeeId}` : '/api/xl/reports/locations';
      const res = await axios.get(url);
      if (res.data.success) {
        setData(res.data.data);
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
    fetchLocations(val);
  };

  // Grouping logic
  const groupedData = useMemo(() => {
    const groups: { [key: string]: { doctors: number, stockists: number, chemists: number } } = {};
    
    // Determine which field to group by based on areaType (For simplicity, using HQ for HQ and City, workingArea for Local Area)
    const getGroupKey = (record: any) => {
      if (areaType === 'Local Area') return record.workingArea || 'Unknown';
      return record.headquarter || 'Unknown';
    };

    const filterByUser = (record: any) => selectedUser ? record.employeeId === selectedUser : true;

    data.doctors.filter(filterByUser).forEach((d: any) => {
      const key = getGroupKey(d);
      if (!groups[key]) groups[key] = { doctors: 0, stockists: 0, chemists: 0 };
      groups[key].doctors++;
    });

    data.chemists.filter(filterByUser).forEach((c: any) => {
      const key = getGroupKey(c);
      if (!groups[key]) groups[key] = { doctors: 0, stockists: 0, chemists: 0 };
      groups[key].chemists++;
    });

    data.stockists.filter(filterByUser).forEach((s: any) => {
      const key = getGroupKey(s);
      if (!groups[key]) groups[key] = { doctors: 0, stockists: 0, chemists: 0 };
      groups[key].stockists++;
    });

    return Object.entries(groups).map(([key, counts]) => ({
      name: key,
      ...counts
    })).sort((a, b) => b.doctors - a.doctors); // sort by total doctors desc
  }, [data, areaType, selectedUser]);

  const exportToExcel = () => {
    const dataToExport = groupedData.map((g, i) => ({
      'Sr no.': i + 1,
      [areaType]: g.name,
      'Total Doctors': g.doctors,
      'Total Stockists': g.stockists,
      'Total Chemists': g.chemists
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Locations List");
    XLSX.writeFile(wb, "Locations List.xlsx");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select Area Type</h2>
            <select 
              value={areaType} 
              onChange={e => setAreaType(e.target.value)}
              className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
            >
              <option value="HQ">HQ</option>
              <option value="City">City</option>
              <option value="Local Area">Local Area</option>
            </select>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select User</h2>
            <select 
              value={selectedUser} 
              onChange={handleUserChange}
              className="w-full bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
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
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({groupedData.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">{areaType} ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Doctors ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Stockists ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Chemists</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td></tr>
                ) : groupedData.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Data Found</td></tr>
                ) : (
                  groupedData.map((g, idx) => (
                    <tr key={idx} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{g.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-300 text-center">{g.doctors}</td>
                      <td className="px-4 py-4 text-sm text-slate-300 text-center">{g.stockists}</td>
                      <td className="px-4 py-4 text-sm text-slate-300 text-center">{g.chemists}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e] flex justify-end">
            <button onClick={exportToExcel} disabled={groupedData.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}