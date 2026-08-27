import { useState } from 'react';
import axios from 'axios';
import { Users, ArrowRight, Save, X, AlertTriangle } from 'lucide-react';

interface TransferDataModalProps {
  onClose: () => void;
  users: any[];
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-indigo-200" />
            <h2 className="text-lg font-semibold">Transfer Territory Data</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Securely transfer territorial assets (Doctors, Chemists, etc.) from an outgoing employee to a new hire. Personal HR data (Leaves, DCRs, Expenses) is intentionally locked and cannot be transferred.
          </p>

          {/* Form */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">From Employee ID</label>
              <input 
                type="text" 
                placeholder="e.g. EMP001"
                className="w-full border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-indigo-500 uppercase"
                value={fromEmpId}
                onChange={e => setFromEmpId(e.target.value.toUpperCase())}
              />
            </div>
            
            <div className="flex flex-col items-center justify-center pt-5">
              <ArrowRight className="h-5 w-5 text-indigo-400" />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">To Employee ID</label>
              <input 
                type="text" 
                placeholder="e.g. EMP002"
                className="w-full border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-indigo-500 uppercase"
                value={toEmpId}
                onChange={e => setToEmpId(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-3">Modules to Transfer</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(modules).map(([mod, isSelected]) => (
                <label key={mod} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                    checked={isSelected}
                    onChange={() => toggleModule(mod as keyof typeof modules)}
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleTransfer}
              disabled={loading || !!success}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
