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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Performance KPI Approvals (Release Plans)</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold border-b border-slate-200">Employee</th>
              <th className="p-4 font-semibold border-b border-slate-200">Month / Year</th>
              <th className="p-4 font-semibold border-b border-slate-200">Status</th>
              <th className="p-4 font-semibold border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No submitted performance plans found.
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{item.employeeName}</div>
                    <div className="text-xs text-slate-500">ID: {item.employeeId}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    <span className="capitalize">{item.month}</span> {item.year}
                  </td>
                  <td className="p-4">
                    {item.unlockRequested ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <ShieldAlert size={14} />
                        Unlock Requested
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Final Submitted
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRelease(item._id)}
                      disabled={isReleasing === item._id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
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

