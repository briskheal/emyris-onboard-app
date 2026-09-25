import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle2, AlertCircle, Edit, FileText } from 'lucide-react';
import axios from 'axios';

export default function PrimarySalesHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const storedUser = localStorage.getItem('xl_user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      
      const res = await axios.get(`/api/xl/primary-sales/all?employeeId=${user.employeeId}`);
      if (res.data.success) {
        // Sort newest first
        const sorted = (res.data.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'rejected': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20'; // Pending
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <CheckCircle2 size={14} />;
      case 'rejected': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-slate-700/50 p-1.5 rounded-lg active:scale-95">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">
            PRIMARY <span className="text-cyan-400 font-bold text-[13px] ml-1">HISTORY</span>
          </h1>
        </div>
        <button onClick={() => navigate('/creation/primary-sales')} className="bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg active:scale-95">
          <Plus size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : invoices.length === 0 ? (
          <div className="text-center p-8 bg-slate-700/30 rounded-2xl border border-slate-600/30">
            <FileText size={48} className="mx-auto text-slate-500 mb-3 opacity-50" />
            <p className="text-slate-400 text-sm">No primary sales history found.</p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv._id} className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/50 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">{inv.stockist || 'N/A'}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Inv No: <span className="text-slate-300">{inv.invoiceNumber}</span></p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold tracking-wide uppercase shadow-sm \${getStatusColor(inv.status)}`}>
                  {getStatusIcon(inv.status)}
                  {inv.status || 'Pending'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-800/50 p-2.5 rounded-lg">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Sale Date</span>
                  <span className="text-xs text-slate-300 font-medium">{new Date(inv.date).toLocaleDateString('en-GB')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Net Value</span>
                  <span className="text-xs text-emerald-400 font-bold">₹{parseFloat(inv.netInvValue || 0).toFixed(2)}</span>
                </div>
              </div>

              {inv.status === 'Rejected' && inv.adminRemarks && (
                <div className="mb-3 bg-rose-500/10 border border-rose-500/20 rounded p-2 text-xs text-rose-300">
                  <span className="font-bold block mb-0.5">Rejection Reason:</span>
                  {inv.adminRemarks}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-600/30">
                {(inv.status === 'Rejected' || inv.status === 'Pending' || inv.status === 'Re-Submitted' || inv.status === 'Approved') && (
                  <button 
                    onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors active:scale-95"
                  >
                    {inv.status === 'Approved' ? <Eye size={14} /> : <Edit size={14} />}
                    {inv.status === 'Rejected' ? 'Edit & Resubmit' : (inv.status === 'Approved' ? 'View Details' : 'Edit')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
