import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormProps {
  title: string;
  subtitle: string;
  endpoint: string;
  fields: Field[];
  accentColor?: string;
}

export default function MobileForm({ title, subtitle, endpoint, fields, accentColor = 'sky' }: FormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/xl/${endpoint}`, form);
      setSuccess(true);
      setForm({});
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-slate-800 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500/30 transition-colors`;
  const inputStyle = { height: '45px' };

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-5 bg-slate-800 border-b border-slate-700/60">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600 transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {field.label} {field.required && <span className="text-rose-400">*</span>}
            </label>
            {field.options ? (
              <select
                className={inputClass}
                style={inputStyle}
                value={form[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                className={inputClass}
                style={inputStyle}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={form[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 font-medium">Record saved successfully!</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full h-[45px] rounded-xl font-semibold text-sm text-white transition-all
            ${loading ? 'bg-slate-700 text-slate-400' : `bg-${accentColor}-500 active:bg-${accentColor}-600`}`}
        >
          {loading ? 'Saving...' : 'Save Record'}
        </button>
      </form>
    </div>
  );
}
