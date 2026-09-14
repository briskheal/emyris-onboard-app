import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AllSecondarySales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockists, setStockists] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear();
  });

  const fetchSales = async () => {
    try {
      const sRes = await axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } }));
      setStockists(sRes.data.data || []);
    } catch(e) {}

    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const [month, year] = selectedMonth.split(' ');

      const res = await axios.get('/api/xl/secondary-sales/all', {
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedMonth]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await axios.delete(`/api/xl/secondary-sales/${id}`);
      if (res.data.success) {
        setSales(prev => prev.filter(s => s._id !== id));
      }
    } catch(e) {
      alert('Error deleting record');
    }
  };

  const getStockistName = (uid: string) => {
    const st = stockists.find(s => s.uid === uid || s.stockistName === uid);
    return st ? st.stockistName : uid;
  };

  const generateMonths = () => {
    const months = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < 12; i++) {
      months.push(d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear());
      d.setMonth(d.getMonth() - 1);
    }
    return months;
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col font-sans relative">
      <div className="bg-[#1e1e30] border-b border-[#3b3b5a] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/extras/secondary')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">ALL SECONDARY SALES</h1>
        </div>

        <div className="flex items-center gap-3 bg-[#27273f] p-1.5 rounded-lg border border-[#3b3b5a]/50">
          <select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer px-2 py-1"
          >
            {generateMonths().map(m => (
              <option key={m} value={m} className="bg-slate-800">{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col relative z-10">
        <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
          <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl overflow-auto custom-scrollbar flex-1 relative z-10">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#27273f] sticky top-0 z-20 shadow-md">
                <tr className="text-[10px] uppercase tracking-widest text-[#8b8baf]">
                  <th className="p-3 font-semibold text-center w-12 border-r border-[#3b3b5a]/50">Sr<br/>no.</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Date</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Invoice<br/>Number</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Invoice<br/>Date</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Stockist</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Headquarter</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Total Value (₹)</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#3b3b5a]/30">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8b8baf]">Loading records...</td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8b8baf]">No sales records found for {selectedMonth}</td>
                  </tr>
                ) : (
                  sales.map((sale, index) => {
                    return (
                      <tr key={sale._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                        <td className="p-3 text-center text-[#8b8baf] border-r border-[#3b3b5a]/50">{index + 1}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 text-slate-300">{sale.date || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-medium text-white">{sale.invoiceNumber || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 text-slate-300">{sale.invoiceDate || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 text-white truncate max-w-[200px]">{getStockistName(sale.stockist) || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[150px] text-slate-300">{sale.headquarter || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-bold text-[#00e5ff]">
                          {sale.amount ? sale.amount.toFixed(2) : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => navigate(`/extras/secondary/edit/${sale._id}`)}
                              className="text-sky-400 hover:text-sky-300 transition-colors p-1"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(sale._id)}
                              className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
