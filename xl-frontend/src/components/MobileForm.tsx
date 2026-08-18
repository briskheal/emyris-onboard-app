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

interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

function GeoTagButton({
  label,
  point,
  onCapture,
  onClear,
}: {
  label: string;
  point: GeoPoint | null;
  onCapture: () => void;
  onClear: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = () => {
    if (!navigator.geolocation) { setError('GPS not supported on this device.'); return; }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      () => {
        onCapture();
        setLoading(false);
      },
      err => {
        setLoading(false);
        setError(err.code === 1 ? 'Access denied. Enable GPS.' : 'Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (point) {
    return (
      <div className="bg-slate-800 rounded-xl border border-emerald-500/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">{label} Tagged</p>
              <p className="text-xs text-slate-400 mt-0.5">{point.address}</p>
            </div>
          </div>
          <button type="button" onClick={onClear} className="text-slate-500">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={capture} disabled={loading} className="w-full h-[45px] rounded-xl border-2 border-dashed border-slate-600 text-sm font-semibold text-slate-300">
        {loading ? 'Locating...' : `Tag ${label}`}
      </button>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

export default function MobileForm({ title, subtitle, endpoint, fields, accentColor = 'sky', enableGeoTagging = false }: FormProps & { enableGeoTagging?: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [geo1, setGeo1] = useState<GeoPoint | null>(null);
  const [geo2, setGeo2] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const captureGeo = (): Promise<GeoPoint> => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enableGeoTagging && !geo1) { setError('Primary Location tag is required.'); return; }
    
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (enableGeoTagging) {
        Object.assign(payload, {
          lat1: geo1?.lat, lng1: geo1?.lng, geoAddress1: geo1?.address,
          lat2: geo2?.lat || null, lng2: geo2?.lng || null, geoAddress2: geo2?.address || null,
        });
      }

      await axios.post(`/api/xl/${endpoint}`, payload);
      setSuccess(true);
      setForm({});
      setGeo1(null);
      setGeo2(null);
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
      <div className="flex items-center gap-3 px-4 pt-12 pb-5 bg-slate-800 border-b border-slate-700/60">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {field.label} {field.required && <span className="text-rose-400">*</span>}
            </label>
            {field.options ? (
              <select className={inputClass} style={inputStyle} value={form[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} required={field.required}>
                <option value="">Select {field.label}</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input type={field.type || 'text'} className={inputClass} style={inputStyle} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} value={form[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} required={field.required} />
            )}
          </div>
        ))}

        {enableGeoTagging && (
          <div className="pt-2 border-t border-slate-700/50 mt-4 space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">📍 Geo-Tag Locations</p>
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1.5">Primary Location <span className="text-rose-400">*</span></p>
              <GeoTagButton label="Primary Location" point={geo1} onCapture={() => captureGeo().then(setGeo1).catch(()=>{})} onClear={() => setGeo1(null)} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1.5">Secondary Location <span className="text-slate-500">(optional)</span></p>
              <GeoTagButton label="Secondary Location" point={geo2} onCapture={() => captureGeo().then(setGeo2).catch(()=>{})} onClear={() => setGeo2(null)} />
            </div>
          </div>
        )}

        {error && <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" /><p className="text-sm text-emerald-400 font-medium">Record saved successfully!</p></div>}
        
        <button type="submit" disabled={loading} className={`w-full h-[45px] rounded-xl font-semibold text-sm text-white transition-all ${loading ? 'bg-slate-700 text-slate-400' : `bg-${accentColor}-500 active:bg-${accentColor}-600`}`}>
          {loading ? 'Saving...' : 'Save Record'}
        </button>
      </form>
    </div>
  );
}
