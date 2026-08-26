import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Navigation, MapPin, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

const CATEGORIES = ['A+', 'A', 'B', 'C', 'D'];

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
        // Parent handles state update via callback — see DoctorForm
      },
      err => {
        setLoading(false);
        setError(err.code === 1
          ? 'Access denied. Settings → Safari → Location → Allow.'
          : 'Could not get location. Try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (point) {
    return (
      <div className="bg-slate-700 rounded-xl border border-emerald-500/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <MapPin size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">{label} Tagged ✓</p>
              <p className="text-xs text-slate-200 mt-0.5">{point.address}</p>
            </div>
          </div>
          <button onClick={onClear} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        className="w-full h-[45px] rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 active:border-sky-500 active:text-sky-400 transition-colors disabled:opacity-50"
      >
        <Navigation size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Getting location...' : `Tap to Tag ${label}`}
      </button>
      {error && <p className="text-xs text-rose-400 mt-1.5 leading-relaxed">{error}</p>}
    </div>
  );
}

export default function DoctorForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [geo1, setGeo1] = useState<GeoPoint | null>(null);
  const [geo2, setGeo2] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Generic GPS capture — returns a GeoPoint via Promise
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
    if (!geo1) { setError('Please tag the Primary Location before saving.'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/xl/doctor', {
        ...form,
        lat1: geo1.lat, lng1: geo1.lng, geoAddress1: geo1.address,
        lat2: geo2?.lat ?? null, lng2: geo2?.lng ?? null, geoAddress2: geo2?.address ?? null,
      });
      setSuccess(true);
      setForm({});
      setGeo1(null);
      setGeo2(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-slate-700 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors';
  const inputStyle = { height: '45px' };

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean; options?: string[] }) => (
    <div key={name}>
      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
        {label} {opts?.required && <span className="text-rose-400">*</span>}
      </label>
      {opts?.options ? (
        <select className={inputClass} style={inputStyle} value={form[name] || ''} onChange={e => handleChange(name, e.target.value)} required={opts?.required}>
          <option value="">Select {label}</option>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={opts?.type || 'text'} className={inputClass} style={inputStyle}
          placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
          value={form[name] || ''} onChange={e => handleChange(name, e.target.value)} required={opts?.required} />
      )}
    </div>
  );

  return (
    <div className="min-h-full bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-700 border-b border-slate-700/60">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600 active:bg-slate-600">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Add Doctor</h1>
          <p className="text-xs text-slate-200">Create a new doctor profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">
        {/* Basic Info */}
        {field('name', 'Doctor Name', { required: true, placeholder: 'Dr. Full Name' })}
        {field('degree', 'Degree', { placeholder: 'e.g. MBBS, MD, DM' })}
        {field('specialization', 'Specialization', { placeholder: 'e.g. Cardiologist, GP' })}
        {field('hospital', 'Hospital / Clinic', { placeholder: 'Hospital name' })}
        {field('category', 'Category', { options: CATEGORIES })}
        {field('mobileNumber', 'Mobile Number', { type: 'tel', placeholder: '10-digit mobile' })}
        {field('contactNumber', 'Clinic Contact No.', { type: 'tel', placeholder: 'Alternate number' })}
        {field('emailAddress', 'Email Address', { type: 'email', placeholder: 'doctor@email.com' })}
        {field('hq', 'HQ', { required: true, placeholder: 'Headquarter city' })}
        {field('workingArea', 'Working Area', { placeholder: 'Area / locality' })}
        {field('birthday', 'Birthday', { type: 'date' })}
        {field('anniversary', 'Anniversary', { type: 'date' })}
        {field('address', 'Address', { placeholder: 'Full address' })}
        {field('extraInfo', 'Extra Info / Notes', { placeholder: 'Any additional notes' })}

        {/* ── Geo-Tagging Section ── */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            📍 Geo-Tag Locations
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Tag up to 2 locations where this doctor can be visited. DCR submission will be validated against these coordinates.
          </p>

          <div className="space-y-3">
            {/* Location 1 — required */}
            <div>
              <p className="text-xs text-slate-200 font-semibold mb-1.5">
                Primary Location <span className="text-rose-400">*</span>
              </p>
              <GeoTagButton
                label="Primary Location"
                point={geo1}
                onCapture={() => captureGeo().then(setGeo1).catch(() => {})}
                onClear={() => setGeo1(null)}
              />
            </div>

            {/* Location 2 — optional */}
            <div>
              <p className="text-xs text-slate-200 font-semibold mb-1.5">
                Secondary Location <span className="text-slate-500">(optional)</span>
              </p>
              <GeoTagButton
                label="Secondary Location"
                point={geo2}
                onCapture={() => captureGeo().then(setGeo2).catch(() => {})}
                onClear={() => setGeo2(null)}
              />
            </div>
          </div>
        </div>

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
            <p className="text-sm text-emerald-400 font-medium">Doctor saved successfully!</p>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading}
          className={`w-full h-[45px] rounded-xl font-semibold text-sm text-white transition-all
            ${loading ? 'bg-slate-600 text-slate-200' : 'bg-sky-500 active:bg-sky-600'}`}>
          {loading ? 'Saving...' : 'Save Doctor'}
        </button>
      </form>
    </div>
  );
}
