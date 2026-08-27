import { useState } from 'react';
import axios from 'axios';
import { Users, ArrowRight, Save, X, AlertTriangle } from 'lucide-react';

interface TransferDataModalProps {
  onClose: () => void;
  users?: any[];
}

export default function TransferDataModal({ onClose }: TransferDataModalProps) {
  const [fromEmpId, setFromEmpId] = useState('');
  const [toEmpId, setToEmpId] = useState('');
  
  const [modules, setModules] = useState({
    doctors: true,
    chemists: true,
    stockists: true,
    cities: false,
    routes: false,
    geofencing: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleModule = (mod: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const handleTransfer = async () => {
    if (!fromEmpId || !toEmpId) {
      setError('Please provide both Source and Destination Employee IDs.');
      return;
    }
    if (fromEmpId === toEmpId) {
      setError('Source and Destination cannot be the same.');
      return;
    }

    const selectedModules = Object.entries(modules).filter(([_, isSelected]) => isSelected).map(([key]) => key);
    if (selectedModules.length === 0) {
      setError('Please select at least one module to transfer.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/admin/users/transfer-data', {
        fromEmpId,
        toEmpId,
        modules: selectedModules
      });
      setSuccess(res.data.message || 'Data transferred successfully.');
      setTimeout(() => onClose(), 2500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to transfer data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-wide">TRANSFER TERRITORY DATA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-400 mb-6">
            Securely transfer territorial assets (Doctors, Chemists, etc.) from an outgoing employee to a new hire. Personal HR data (Leaves, DCRs, Expenses) is intentionally locked and cannot be transferred.
          </p>

          {/* Form */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">From Employee ID</label>
              <input 
                type="text" 
                placeholder="e.g. EMP001"
                className="w-full border border-slate-600 rounded-lg text-sm bg-slate-900 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase text-white p-3"
                value={fromEmpId}
                onChange={e => setFromEmpId(e.target.value.toUpperCase())}
              />
            </div>
            
            <div className="flex flex-col items-center justify-center pt-6">
              <ArrowRight className="h-6 w-6 text-indigo-500" />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">To Employee ID</label>
              <input 
                type="text" 
                placeholder="e.g. EMP002"
                className="w-full border border-slate-600 rounded-lg text-sm bg-slate-900 focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase text-white p-3"
                value={toEmpId}
                onChange={e => setToEmpId(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Modules to Transfer</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(modules).map(([mod, isSelected]) => (
                <label key={mod} className="flex items-center gap-3 p-3 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-500 bg-slate-900 border-slate-500 focus:ring-indigo-500"
                    checked={isSelected}
                    onChange={() => toggleModule(mod as keyof typeof modules)}
                  />
                  <span className="text-sm font-bold text-slate-300 capitalize">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-emerald-400 font-bold">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 mt-2">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors uppercase tracking-wide"
            >
              Cancel
            </button>
            <button 
              onClick={handleTransfer}
              disabled={loading || !!success}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'TRANSFERRING...' : 'EXECUTE TRANSFER'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
