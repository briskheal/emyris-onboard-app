import { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export default function PerformanceApproval({ items, fetchPending, fetchCounts }: any) {
  const [isReleasing, setIsReleasing] = useState<string | null>(null);

  const handleRelease = async (id: string) => {
    if (!window.confirm('Are you sure you want to unlock this plan? The user will be able to edit their planned targets again.')) return;
    
    setIsReleasing(id);
    try {
      const res = await axios.post('/api/xl/performance/release', { id });
      if (res.data.success) {
        alert('Plan successfully unlocked for the user.');
        fetchPending();
        fetchCounts();
      }
    } catch (e) {
      alert('Failed to release plan');
    } finally {
      setIsReleasing(null);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#1e1e2d]">
      <div className="p-6 md:p-8 pb-5 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Performance KPI Approvals (Release Plans)</h2>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6 md:p-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-[#1c1c2e]">
              <th className="p-4 font-semibold border-b border-[#3b3b5a]">Employee</th>
              <th className="p-4 font-semibold border-b border-[#3b3b5a]">Month / Year</th>
              <th className="p-4 font-semibold border-b border-[#3b3b5a]">Status</th>
              <th className="p-4 font-semibold border-b border-[#3b3b5a] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b3b5a]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                  No submitted performance plans found.
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item._id} className="hover:bg-[#252538] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{item.employeeName}</div>
                    <div className="text-xs text-slate-500">ID: {item.employeeId}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-300">
                    <span className="capitalize">{item.month}</span> {item.year}
                  </td>
                  <td className="p-4">
                    {item.unlockRequested ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <ShieldAlert size={14} />
                        Unlock Requested
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Final Submitted
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRelease(item._id)}
                      disabled={isReleasing === item._id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 uppercase tracking-widest"
                    >
                      <RefreshCcw size={16} className={isReleasing === item._id ? 'animate-spin' : ''} />
                      {isReleasing === item._id ? 'Releasing...' : 'Release'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


