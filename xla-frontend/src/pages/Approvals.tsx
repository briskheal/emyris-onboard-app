import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, CheckCircle, XCircle } from 'lucide-react';

const modules = [
  'Call Report', 'Tour Program', 'Call Plans', 'Doctors', 'Chemists', 'Stockists', 'Expense', 'Leave Request',
  'City', 'Routes', 'Samples', 'Gifts', 'Primary Sales', 'Secondary Sales', 'Geo Fencing'
];

export default function Approvals() {
  const [selectedModule, setSelectedModule] = useState('Tour Program');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/xl/approvals/pending?type=${encodeURIComponent(selectedModule)}&designation=ADMIN`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [selectedModule]);

  const handleAction = async (recordId: string, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      const res = await axios.post('/api/xl/approvals/action', {
        recordId,
        type: selectedModule,
        action,
        remarks: ''
      });
      if (res.data.success) {
        setItems(prev => prev.filter(item => item._id !== recordId));
        setSelectedRows(prev => prev.filter(id => id !== recordId));
      } else {
        alert(res.data.message || 'Action failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) return alert('Select rows first');
    if (!window.confirm(`Are you sure you want to bulk ${action} ${selectedRows.length} requests?`)) return;
    
    let successCount = 0;
    for (const recordId of selectedRows) {
      try {
        const res = await axios.post('/api/xl/approvals/action', {
          recordId,
          type: selectedModule,
          action,
          remarks: 'Bulk Admin Action'
        });
        if (res.data.success) successCount++;
      } catch (e) { console.error(e); }
    }
    alert(`Successfully processed ${successCount} out of ${selectedRows.length} requests.`);
    setSelectedRows([]);
    fetchPending();
  };

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRows.length === items.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(items.map(i => i._id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Global Approvals</h1>
          <p className="text-slate-400">Review and override approvals across the company.</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedModule} 
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500"
          >
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="mb-4 flex gap-4 p-4 bg-sky-900/30 rounded-xl border border-sky-500/30 items-center">
          <span className="text-sky-400 font-bold">{selectedRows.length} items selected</span>
          <button onClick={() => handleBulkAction('Approved')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Bulk Approve</button>
          <button onClick={() => handleBulkAction('Rejected')} className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Bulk Reject</button>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-x-auto shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/50">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" checked={selectedRows.length > 0 && selectedRows.length === items.length} onChange={toggleAll} className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900" />
              </th>
              <th className="p-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Employee</th>
              <th className="p-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Details</th>
              <th className="p-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="p-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No pending approvals for this module.</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                <td className="p-4 text-center">
                  <input type="checkbox" checked={selectedRows.includes(item._id)} onChange={() => toggleRow(item._id)} className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900" />
                </td>
                <td className="p-4">
                  <div className="text-sm font-bold text-white">{item.employeeName || item.employeeEmail || item.name || 'Unknown'}</div>
                  <div className="text-xs text-slate-400">{item.employeeEmail}</div>
                </td>
                <td className="p-4 text-sm text-slate-300">{item.hq || item.entityName || item.date || item.month || '-'}</td>
                <td className="p-4"><span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg uppercase tracking-wider">{item.status}</span></td>
                <td className="p-4 text-sm text-slate-300">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(item._id, 'Approved')} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/40" title="Approve">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => handleAction(item._id, 'Rejected')} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/40" title="Reject">
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
