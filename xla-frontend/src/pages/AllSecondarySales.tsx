import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Home, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatMMDDYYYY } from '../utils/dateUtils';

export default function AllSecondarySales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockists, setStockists] = useState<any[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toLocaleString('en-US', { month: 'short' });
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [viewAll, setViewAll] = useState<boolean>(false);

  const fetchSales = async () => {
    try {
      const sRes = await axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } }));
      setStockists(sRes.data.data || []);
    } catch(e) {}

    try {
      setLoading(true);
      const params: any = {};
      if (!viewAll) {
        params.month = selectedMonth;
        params.year = String(selectedYear);
      }

      // XLA admin always sees all records — do NOT send designation/employeeId
      // (null values serialize as "null" string in URLSearchParams, breaking the admin check)
      const res = await axios.get('/api/xl/secondary-sales/all', { params });
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales', error);
    } finally {
      setLoading(false);
    }
  };

  
  const getStockistName = (id: string) => {
    const s = stockists.find(x => x.uid === id || x._id === id);
    return s ? (s.businessName || s.name || id) : id;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const token = sessionStorage.getItem('xla_token') || '';
        const res = await axios.delete(`/api/xl/secondary-sales/delete/${id}?fromAdmin=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data.success) {
          fetchSales();
        } else {
          alert(res.data.message || 'Failed to delete.');
        }
      } catch (error) {
        alert('Error deleting invoice.');
      }
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedMonth, selectedYear, viewAll]);

  // Generate month options (last 12 months)
  const monthOptions = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    monthOptions.push(nd.toLocaleString('en-US', { month: 'short' }) + ' ' + nd.getFullYear());
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-[#d1d5db] font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Dashboard">
              <Home size={18} />
            </button>
          <button onClick={() => navigate('/extras/secondary')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">ALL SECONDARY SALES</h1>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-6 bg-[#161625]">
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 p-4 mb-4 flex justify-between items-center">
           <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-lg text-xs font-semibold">
              <span className="font-bold uppercase tracking-wider block mb-0.5">NOTE</span>
              Only Admin-Approved Secondary Sales records are captured in this register. Pending submissions remain in the Approvals queue until approved.
           </div>
           
           <div className="flex flex-col gap-1 w-48 relative">
              <label className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Select Month *</label>
              <div 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center justify-between bg-[#1a1a2e] border border-[#3b3b5a] rounded px-3 h-[34px] text-xs text-white cursor-pointer hover:border-sky-500 transition-colors"
              >
                <span>{viewAll ? 'All Invoices' : `${selectedMonth} ${selectedYear}`}</span>
                <Calendar size={14} className="text-[#8b8baf]" />
              </div>
              {showMonthPicker && (
                <div className="absolute top-[52px] right-0 w-[240px] bg-[#212136] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 p-3">
                   <button 
                     onClick={() => { 
                       setViewAll(true); 
                       setShowMonthPicker(false); 
                     }} 
                     className={`w-full mb-2.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${viewAll ? 'bg-sky-500 text-white border-sky-400' : 'bg-[#1a1a2e] text-sky-400 border-sky-500/30 hover:bg-sky-500/10'}`}
                   >
                     SHOW ALL INVOICES
                   </button>
                   <div className="flex justify-between items-center mb-3">
                      <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedYear(y => y - 1); 
                      }} className="p-1 hover:bg-[#2a2a40] rounded text-[#8b8baf]"><ChevronLeft size={16} /></button>
                      <span className="font-bold text-white text-sm">{selectedYear}</span>
                      <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedYear(y => y + 1); 
                      }} className="p-1 hover:bg-[#2a2a40] rounded text-[#8b8baf]"><ChevronRight size={16} /></button>
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => {
                         const isSel = !viewAll && selectedMonth === m;
                         return (
                           <div 
                              key={m} 
                              onClick={() => { 
                                  setSelectedMonth(m); 
                                  setViewAll(false);
                                  setShowMonthPicker(false); 
                              }}
                              className={`text-center py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${isSel ? 'bg-sky-500 text-white' : 'text-[#8b8baf] hover:bg-[#2a2a40]'}`}
                           >{m}</div>
                         )
                      })}
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-[10px] uppercase tracking-wider border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-3 font-semibold text-center w-12 border-r border-[#3b3b5a]/50">Sr<br/>no.</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Month / Year</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Stockist</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Headquarter</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]/50">Division</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Total Value (₹)</th>
                  <th className="p-3 font-semibold text-center border-r border-[#3b3b5a]/50">Entry Date</th>
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
                    <td colSpan={8} className="p-8 text-center text-[#8b8baf]">
                      <p className="mb-2 font-medium">No approved sales records found for {viewAll ? 'All Months' : `${selectedMonth} ${selectedYear}`}</p>
                      {!viewAll && (
                        <button 
                          onClick={() => setViewAll(true)} 
                          className="text-xs text-sky-400 hover:text-sky-300 font-semibold bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 active:scale-95 transition-all"
                        >
                          View all approved records across all months
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, index) => {
                    return (
                      <tr key={sale._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                        <td className="p-3 text-center text-[#8b8baf] border-r border-[#3b3b5a]/50">{index + 1}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-bold text-sky-400">{sale.month} {sale.year}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 text-white truncate max-w-[150px]">{getStockistName(sale.stockist) || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[120px]">{sale.headquarter || '-'}</td>
                        <td className="p-3 border-r border-[#3b3b5a]/50 truncate max-w-[120px]">{sale.division || '-'}</td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 font-bold text-emerald-400">
                            {sale.amount ? sale.amount.toFixed(2) : '-'}
                        </td>
                        <td className="p-3 text-center border-r border-[#3b3b5a]/50 text-xs text-[#8b8baf]">{formatMMDDYYYY(sale.date || sale.createdAt)}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                              <button onClick={() => navigate(`/extras/secondary/edit/${sale._id}`)} className="text-emerald-400 hover:text-emerald-300 transition-colors p-1.5 rounded-full hover:bg-emerald-500/10" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(sale._id)} className="text-rose-400 hover:text-rose-300 transition-colors p-1.5 rounded-full hover:bg-rose-500/10" title="Delete">
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
