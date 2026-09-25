import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, CheckCheck, X, Clock, Edit2, Eye, FileText, Search } from 'lucide-react';
import axios from 'axios';

export default function PrimarySalesHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      
      const [histRes, stkRes] = await Promise.all([
        axios.get(`/api/xl/primary-sales/all?employeeId=${user.employeeId}`),
        axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } }))
      ]);

      if (histRes.data.success) {
        const sorted = (histRes.data.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(sorted);
      }
      
      if (stkRes.data.data) {
        setStockists(stkRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockistName = (id: string) => {
    const s = stockists.find(x => x.uid === id || x._id === id);
    return s ? (s.businessName || s.name || id) : id;
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const sName = getStockistName(inv.stockist || '').toLowerCase();
    return sName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-full bg-slate-800 pb-24 font-sans text-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-slate-700/50 p-1.5 rounded-lg active:scale-95">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">
            PRIMARY <span className="text-cyan-400 font-bold text-[13px] ml-1">HISTORY</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="bg-slate-700/50 text-slate-300 p-1.5 rounded-lg active:scale-95 hover:bg-slate-700">
            <Search size={20} />
          </button>
          <button onClick={() => navigate('/creation/primary-sales')} className="bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg active:scale-95 hover:bg-cyan-500/20">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1">
        {showSearch && (
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-700/50 sticky top-[57px] z-10 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                autoFocus
                placeholder="Search by stockist name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Table Header */}
        <div className={`flex items-center gap-1 px-4 py-2.5 bg-slate-900/80 border-b border-slate-700/50 sticky z-10 backdrop-blur-sm shadow-sm ${showSearch ? 'top-[115px]' : 'top-[57px]'}`}>
          <div className="w-[45%] text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Stockist</div>
          <div className="w-[20%] text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">Date</div>
          <div className="w-[15%] text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">Appv</div>
          <div className="w-[20%] text-[9px] text-slate-400 font-black uppercase tracking-widest text-right pr-1">Act</div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center p-8 mt-6 mx-4 bg-slate-700/30 rounded-2xl border border-slate-600/30">
            <FileText size={48} className="mx-auto text-slate-500 mb-3 opacity-50" />
            <p className="text-slate-400 text-sm">No primary sales history found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredInvoices.map((inv) => {
              const isApproved = inv.status === 'Approved';
              const isRejected = inv.status === 'Rejected';
              
              return (
                <div 
                  key={inv._id}
                  className={`flex items-center gap-1 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${inv.status === 'Re-Submitted' ? 'bg-amber-500/5' : ''}`}
                >
                  <div className="w-[45%] flex flex-col overflow-hidden pl-1">
                    <span className="text-[13px] leading-tight font-bold text-slate-100 truncate pr-2">
                      {getStockistName(inv.stockist || 'N/A')}
                    </span>
                    {isRejected && inv.adminRemarks && (
                       <span className="text-[9px] text-rose-400 truncate pr-2 mt-0.5" title={inv.adminRemarks}>Note: {inv.adminRemarks}</span>
                    )}
                  </div>
                  
                  {/* Date format updated to DD/MM/YY */}
                  <div className="w-[20%] text-[10px] text-slate-400 text-center font-medium whitespace-nowrap">
                    {inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                  </div>
                  
                  <div className={`w-[15%] flex justify-center ${isApproved ? 'text-emerald-400' : isRejected ? 'text-rose-400' : 'text-amber-400'}`}>
                    {isApproved ? <CheckCheck size={16} strokeWidth={2.5} /> : isRejected ? <X size={16} strokeWidth={2.5} /> : <Clock size={16} strokeWidth={2.5} />}
                  </div>
                  
                  <div className="w-[20%] flex justify-end pr-1">
                    {isApproved ? (
                      <button onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)} className="bg-sky-500/10 border border-sky-500/20 text-sky-400 p-1.5 rounded-md hover:bg-sky-500/20 active:scale-95 transition-transform cursor-pointer">
                        <Eye size={14} strokeWidth={2} />
                      </button>
                    ) : (
                      <button onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)} className="bg-cyan-500 text-white p-1.5 rounded-md shadow-md hover:bg-cyan-400 active:scale-95 transition-transform cursor-pointer">
                        <Edit2 size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
