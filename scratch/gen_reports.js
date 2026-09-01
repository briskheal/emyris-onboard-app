const fs = require('fs');
const path = require('path');

const srcDir = 'xla-frontend/src';

const files = {
  'components/ChemistDetails.tsx': `import { useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';

export default function ChemistDetails({ chemist, onBack }: { chemist: any, onBack: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e]">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm hover:text-sky-300">
          <ChevronLeft size={18} /> CHEMIST DETAILS
        </button>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-16 right-4 w-80 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 border-b border-[#3b3b5a]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">ADDITIONAL DETAILS</h3>
            <button onClick={() => setShowInfo(false)} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-xs font-bold text-white">{chemist.createdAt ? new Date(chemist.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
              <p className="text-xs font-bold text-white">super admin</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approved By</p>
              <p className="text-xs font-bold text-white">NA</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">VISIBLE TO</p>
            <div className="bg-[#151521] rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-sky-400 font-semibold">{chemist.employeeId || 'No Employee Assigned'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">NAME</p>
              <p className="text-sm font-bold text-white">{chemist.proprietorName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">BUSINESS NAME</p>
              <p className="text-sm font-bold text-white">{chemist.businessName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">WORKING AREA</p>
              <p className="text-sm font-bold text-white">{chemist.workingArea || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">HEADQUARTER</p>
              <p className="text-sm font-bold text-white">{chemist.headquarter || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CERTIFICATION</p>
              <p className="text-sm font-bold text-white">{chemist.certifications || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CHEMIST CONTACT</p>
              <p className="text-sm font-bold text-white">{chemist.mobile || chemist.contact || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">E-MAIL</p>
              <p className="text-sm font-bold text-white">{chemist.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">BIRTHDAY</p>
              <p className="text-sm font-bold text-white">{chemist.birthday || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">ADDRESS</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{chemist.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">EXTRA INFO</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{chemist.extraInformation || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'components/StockistDetails.tsx': `import { useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';

export default function StockistDetails({ stockist, onBack }: { stockist: any, onBack: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e]">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm hover:text-sky-300">
          <ChevronLeft size={18} /> STOCKIST DETAILS
        </button>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-16 right-4 w-80 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 border-b border-[#3b3b5a]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">ADDITIONAL DETAILS</h3>
            <button onClick={() => setShowInfo(false)} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-xs font-bold text-white">{stockist.createdAt ? new Date(stockist.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
              <p className="text-xs font-bold text-white">super admin</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approved By</p>
              <p className="text-xs font-bold text-white">NA</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">VISIBLE TO</p>
            <div className="bg-[#151521] rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-sky-400 font-semibold">{stockist.employeeId || 'No Employee Assigned'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">NAME</p>
              <p className="text-sm font-bold text-white">{stockist.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">BUSINESS NAME</p>
              <p className="text-sm font-bold text-white">{stockist.businessName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">HEADQUARTER</p>
              <p className="text-sm font-bold text-white">{stockist.headquarter || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">WORKING AREA</p>
              <p className="text-sm font-bold text-white">{stockist.workingArea || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CERTIFICATION</p>
              <p className="text-sm font-bold text-white">{stockist.certifications || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">STOCKIST CONTACT</p>
              <p className="text-sm font-bold text-white">{stockist.mobile || stockist.contact || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">E-MAIL</p>
              <p className="text-sm font-bold text-white">{stockist.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">ESTABLISHMENT DATE</p>
              <p className="text-sm font-bold text-white">{stockist.establishmentDate || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">DRUG EXPIRY NUMBER</p>
              <p className="text-sm font-bold text-white">{stockist.drugExpiryDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">DRUG LICENSE NUMBER</p>
              <p className="text-sm font-bold text-white">{stockist.drugLicense || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">GST NUMBER</p>
              <p className="text-sm font-bold text-white">{stockist.gst || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">ADDRESS</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{stockist.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">EXTRA INFO</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{stockist.extraInformation || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'components/ProductDetails.tsx': `import { useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';

export default function ProductDetails({ product, onBack }: { product: any, onBack: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e]">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm hover:text-sky-300">
          <ChevronLeft size={18} /> PRODUCT DETAILS
        </button>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-16 right-4 w-80 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 border-b border-[#3b3b5a]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">ADDITIONAL DETAILS</h3>
            <button onClick={() => setShowInfo(false)} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-xs font-bold text-white">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-xs font-bold text-white">{product.status || 'Active'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">NAME</p>
              <p className="text-sm font-bold text-white">{product.productName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PTR</p>
              <p className="text-sm font-bold text-white">{product.ptr || '0'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PTS</p>
              <p className="text-sm font-bold text-white">{product.pts || '0'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MRP</p>
              <p className="text-sm font-bold text-white">{product.mrp || '0'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CATEGORY</p>
              <p className="text-sm font-bold text-white">{product.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">GST</p>
              <p className="text-sm font-bold text-white">{product.gst || '0'}%</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MANUFACTURER</p>
              <p className="text-sm font-bold text-white">{product.supplierName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">TYPE</p>
              <p className="text-sm font-bold text-white">{product.type || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PACKAGING</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{product.packaging || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">COMPOSITION</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{product.composition || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'pages/ChemistsListReport.tsx': `import { useState, useEffect } from 'react';
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
      const url = employeeId ? \`/api/xl/reports/chemists?employeeId=\${employeeId}\` : '/api/xl/reports/chemists';
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
}`,

  'pages/StockistsListReport.tsx': `import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import StockistDetails from '../components/StockistDetails';
import * as XLSX from 'xlsx';

export default function StockistsListReport() {
  const [loading, setLoading] = useState(true);
  const [stockists, setStockists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [viewingStockist, setViewingStockist] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchStockists('');
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/xl/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStockists = async (employeeId: string) => {
    setLoading(true);
    try {
      const url = employeeId ? \`/api/xl/reports/stockists?employeeId=\${employeeId}\` : '/api/xl/reports/stockists';
      const res = await axios.get(url);
      if (res.data.success) {
        setStockists(res.data.data);
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
    fetchStockists(val);
  };

  const exportToExcel = () => {
    const dataToExport = stockists.map((c, i) => ({
      'Sr no.': i + 1,
      'Business Name': c.businessName,
      'Proprietor Name': c.name,
      Address: c.address,
      Contact: c.mobile || c.contact,
      HQ: c.headquarter,
      'Working Area': c.workingArea,
      Email: c.email,
      'GST Number': c.gst,
      'Drug License Number': c.drugLicense,
      'Drug Expiry Date': c.drugExpiryDate,
      'Establishment Date': c.establishmentDate
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stockist List");
    XLSX.writeFile(wb, "Stockist List.xlsx");
  };

  if (viewingStockist) {
    return <StockistDetails stockist={viewingStockist} onBack={() => setViewingStockist(null)} />;
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
            SHOWING ({stockists.length}) ENTRIES
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
                ) : stockists.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Stockists Found</td></tr>
                ) : (
                  stockists.map((c, idx) => (
                    <tr key={c._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{c.businessName}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.name || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.address || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.mobile || c.contact || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{c.headquarter || '-'}</td>
                      <td className="px-4 py-4 text-sm text-sky-400">{c.workingArea || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => setViewingStockist(c)} 
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
            <button onClick={exportToExcel} disabled={stockists.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'pages/LocationsListReport.tsx': `import { useState, useEffect, useMemo } from 'react';
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
      const url = employeeId ? \`/api/xl/reports/locations?employeeId=\${employeeId}\` : '/api/xl/reports/locations';
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
}`,

  'pages/ProductsListReport.tsx': `import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import ProductDetails from '../components/ProductDetails';
import * as XLSX from 'xlsx';

export default function ProductsListReport() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const divisions = useMemo(() => {
    const divs = new Set(products.map(p => p.divisionName).filter(Boolean));
    return Array.from(divs);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedDivision) return products;
    return products.filter(p => p.divisionName === selectedDivision);
  }, [products, selectedDivision]);

  const exportToExcel = () => {
    const dataToExport = filteredProducts.map((p, i) => ({
      'Sr no.': i + 1,
      Name: p.productName,
      Division: p.divisionName,
      Packaging: p.packaging,
      MRP: p.mrp,
      PTS: p.pts,
      PTR: p.ptr,
      Category: p.category,
      Manufacturer: p.supplierName,
      Composition: p.composition
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product List");
    XLSX.writeFile(wb, "Product List.xlsx");
  };

  if (viewingProduct) {
    return <ProductDetails product={viewingProduct} onBack={() => setViewingProduct(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select Division</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <select 
            value={selectedDivision} 
            onChange={e => setSelectedDivision(e.target.value)}
            className="w-full max-w-sm bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
          >
            <option value="">All Divisions</option>
            {divisions.map(d => (
              <option key={d as string} value={d as string}>
                {d as string}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({filteredProducts.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">Name ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Division</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Packaging</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MRP</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PTS</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PTR</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Images</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Products Found</td></tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={p._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{p.productName}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.divisionName || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.packaging || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.mrp || '0'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.pts || '0'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.ptr || '0'}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="w-8 h-8 rounded bg-slate-800 mx-auto flex items-center justify-center text-[10px] text-slate-500">Img</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => setViewingProduct(p)} 
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
            <button onClick={exportToExcel} disabled={filteredProducts.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(srcDir, relPath), content);
  console.log('Created ' + relPath);
}

let appCode = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');

const imports = `import ChemistsListReport from './pages/ChemistsListReport';
import StockistsListReport from './pages/StockistsListReport';
import LocationsListReport from './pages/LocationsListReport';
import ProductsListReport from './pages/ProductsListReport';
`;

appCode = appCode.replace("import DoctorsListReport from './pages/DoctorsListReport';", "import DoctorsListReport from './pages/DoctorsListReport';\n" + imports);

const listRoutes = `<Route path="doctors" element={<DoctorsListReport />} />
            <Route path="chemists" element={<ChemistsListReport />} />
            <Route path="stockists" element={<StockistsListReport />} />
            <Route path="locations" element={<LocationsListReport />} />
            <Route path="products" element={<ProductsListReport />} />`;

appCode = appCode.replace(`<Route path="doctors" element={<DoctorsListReport />} />`, listRoutes);

fs.writeFileSync(path.join(srcDir, 'App.tsx'), appCode);
console.log('App.tsx updated');
