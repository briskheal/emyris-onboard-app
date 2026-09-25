import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, CheckCheck, X, Clock, Edit2, Eye, FileText } from 'lucide-react';
import axios from 'axios';

export default function PrimarySalesHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      
      // Fetch both history and stockists in parallel
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

  return (
    <div className="min-h-full bg-[#0f0f16] pb-24 font-sans text-white">
      {/* Header */}
      <div className="px-4 py-4 bg-[#1c1c2e] border-b border-[#3b3b5a] flex items-center justify-between sticky top-0 z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 active:scale-95">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[13px] font-black uppercase tracking-widest text-white">
          Primary History
        </h1>
        <button onClick={() => navigate('/creation/primary-sales')} className="text-cyan-400 active:scale-95">
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[11fr_4fr_3fr_3fr] gap-2 px-4 py-2.5 bg-[#181826] border-b border-[#3b3b5a] shrink-0 sticky top-[53px] z-10">
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Stockist</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Date</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Status</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-right">Act</div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : invoices.length === 0 ? (
          <div className="text-center p-8 mt-4 mx-4 bg-[#1c1c2e] rounded-xl border border-[#3b3b5a]">
            <FileText size={48} className="mx-auto text-slate-500 mb-3 opacity-50" />
            <p className="text-slate-400 text-sm">No primary sales history found.</p>
          </div>
        ) : (
          invoices.map((inv) => {
            const isApproved = inv.status === 'Approved';
            const isRejected = inv.status === 'Rejected';
            
            return (
              <div 
                key={inv._id}
                onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)} 
                className={`grid grid-cols-[11fr_4fr_3fr_3fr] gap-2 px-4 py-3 border-b border-[#3b3b5a]/40 items-center hover:bg-[#27273f]/50 cursor-pointer transition-colors ${inv.status === 'Re-Submitted' ? 'bg-amber-500/5' : ''}`}
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate pr-2">
                    {getStockistName(inv.stockist || 'N/A')}
                  </span>
                  {isRejected && inv.adminRemarks && (
                     <span className="text-[9px] text-rose-400 truncate pr-2 mt-0.5">Note: {inv.adminRemarks}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 text-center font-medium">
                  {inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                </div>
                <div className={`flex justify-center ${isApproved ? 'text-emerald-400' : isRejected ? 'text-rose-500' : 'text-amber-400'}`}>
                  {isApproved ? <CheckCheck size={16} strokeWidth={2.5} /> : isRejected ? <X size={16} strokeWidth={2.5} /> : <Clock size={16} strokeWidth={2.5} />}
                </div>
                <div className="flex justify-end">
                  {isApproved ? (
                    <div className="bg-sky-500/10 border border-sky-500/20 text-sky-400 p-1.5 rounded-md hover:bg-sky-500/20">
                      <Eye size={14} strokeWidth={2} />
                    </div>
                  ) : (
                    <div className="bg-cyan-500 text-white p-1.5 rounded-md shadow-md hover:bg-cyan-400">
                      <Edit2 size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
