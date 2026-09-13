import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AllPrimarySales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const [month, year] = selectedMonth.split(' ');

      const res = await axios.get('/api/xl/primary-sales/all', {
        params: {
          employeeId: user.employeeId || user._id,
          designation: user.designation,
          month,
          year
        }
      });
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedMonth]);

  // Generate month options (last 12 months)
  const monthOptions = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    monthOptions.push(nd.toLocaleString('default', { month: 'short' }) + ' ' + nd.getFullYear());
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-[#d1d5db] font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">ALL PRIMARY SALES</h1>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-6 bg-[#161625]">
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 p-4 mb-4 flex justify-between items-center">
           <div className="bg-sky-500/10 text-sky-400 p-2 rounded text-xs font-semibold">
              <span className="font-bold uppercase tracking-wider block mb-1">NOTE</span>
              Primary Sales Report are shown which are submitted by the logged-in user! In order to view the complete list, visit - Reports - Primary Sales.
           </div>
           
           <div className="flex flex-col gap-1 w-48">
              <label className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Select Month *</label>
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-3 text-xs text-white outline-none focus:border-sky-500 transition-colors cursor-pointer appearance-none"
              >
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-[10px] uppercase tracking-wider border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-3 font-semibold text-center w-12 border-r border-[#3b3b5a]/50">Sr<br/>no.</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Date</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Invoice<br/>Number</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Invoice<br/>Date</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Stockist</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Headquarter</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Total (₹)</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Return<br/>Sale</th>
                  <th className="p-3 font-semibold text-center">View</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#3b3b5a]/30">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#8b8baf]">Loading records...</td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#8b8baf]">No sales records found for {selectedMonth}</td>
                  </tr>
                ) : (
                  sales.map((sale, index) => {
                    const returnTotal = sale.grossInvValue && sale.netInvValue ? sale.grossInvValue - sale.netInvValue : 0;
                    return (
                      <tr key={sale._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                        <td className="p-3 text-center text-[#8b8baf] border-r border-[#3b3b5a]/50">{index + 1}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50">{sale.date || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-medium text-white">{sale.invoiceNumber || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50">{sale.invoiceDate || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 text-white truncate max-w-[150px]">{sale.stockist || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[120px]">{sale.headquarter || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-bold text-sky-400">
                          {sale.netInvValue ? sale.netInvValue.toFixed(2) : '-'}
                        </td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 text-rose-400">
                          {returnTotal > 0 ? returnTotal.toFixed(2) : <X size={14} className="mx-auto text-[#8b8baf]" />}
                        </td>
                        <td className="p-3 text-center">
                          <button className="text-sky-400 hover:text-sky-300 transition-colors p-1.5 rounded-full hover:bg-sky-500/10 mx-auto">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
