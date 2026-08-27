import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserRound, ShoppingBag, CheckCircle2, MapPin, Search, Navigation, Building2, Phone } from 'lucide-react';
import axios from 'axios';

interface Doctor { _id: string; name: string; degree: string; specialization: string; hospital: string; }
interface Chemist { _id: string; businessName: string; proprietorName: string; }



const today = new Date().toISOString().split('T')[0];

export default function DCRModal({ onClose, overrideDate }: { onClose: () => void; overrideDate?: string }) {
  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const USER_EMAIL = user ? user.employeeId : '';
  const USER_NAME = user ? `${user.firstName} ${user.lastName}` : '';

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<'Doctor' | 'Chemist' | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [chemists, setChemists] = useState<Chemist[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [discussion, setDiscussion] = useState('');
  const [checkInTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dcrDate] = useState(overrideDate || today);

  useEffect(() => {
    // Only prefetch entity lists — NO auto GPS
    axios.get('/api/xl/doctors').then(r => setDoctors(r.data.data || [])).catch(() => {});
    axios.get('/api/xl/chemists').then(r => setChemists(r.data.data || [])).catch(() => {});
  }, []);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS is not supported on this device.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGeoLoading(false);
      },
      err => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Access denied. Go to Settings → Safari → Location and allow this site.');
        } else {
          setGeoError('Could not get location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filteredList = entityType === 'Doctor'
    ? doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase()))
    : chemists.filter(c => c.businessName.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!selected || !entityType) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/xl/dcr', {
        employeeId: USER_EMAIL, employeeName: USER_NAME,
        date: dcrDate, entityType,
        entityId: selected.id, entityName: selected.name,
        discussion, checkInTime,
        latitude: lat, longitude: lng, geoAddress,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed top-16 inset-x-0 bottom-0 z-30 bg-slate-800 flex flex-col items-center justify-center px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <CheckCircle2 size={64} className="text-emerald-400 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white mb-2">Call Reported!</h2>
        <p className="text-slate-200 text-sm text-center mb-8">
          Visit to <span className="text-white font-semibold">{selected?.name}</span> recorded.
        </p>
        <button onClick={onClose} className="w-full h-[45px] bg-emerald-500 rounded-xl text-white font-semibold text-sm">Done</button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 z-30 bg-slate-800 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-slate-700 border-b border-slate-700/60">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-600">
          <X size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Daily Call Report</h1>
          <p className="text-xs text-slate-200">
            {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {checkInTime}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">

        {/* ── STEP 1: Entity type (Card Grid) ──────────────────────── */}
        {step === 1 && (
          <div className="pb-24">
            {/* Welcome Section */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-600 rounded-full border-2 border-sky-400 flex items-center justify-center overflow-hidden">
                 <UserRound size={28} className="text-slate-200 mt-2" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Welcome,</p>
                <h2 className="text-xl font-black text-white">{USER_NAME}</h2>
              </div>
            </div>

            {/* Working Status */}
            <div className="bg-slate-700 border border-slate-700 rounded-3xl p-5 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-300">Today's Working Area</h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  Working
                </span>
              </div>
              <button onClick={() => { onClose(); navigate("/extras/tour-program"); }} className="text-sm font-medium text-slate-200 flex items-center gap-2 active:text-rose-300"><Navigation size={16} className="text-rose-400" />Tour Program not found. Click to create!</button>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Doctor Call */}
              <button 
                onClick={() => { setEntityType('Doctor'); setStep(2); }}
                className="bg-slate-700 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <UserRound size={32} className="text-emerald-400" />
                </div>
                <span className="font-bold text-slate-300 text-sm">Doctor Call</span>
              </button>

              {/* Chemist Call */}
              <button 
                onClick={() => { setEntityType('Chemist'); setStep(2); }}
                className="bg-slate-700 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-sky-400/10 flex items-center justify-center">
                  <ShoppingBag size={32} className="text-sky-400" />
                </div>
                <span className="font-bold text-slate-300 text-sm">Chemist Call</span>
              </button>

              {/* Stockist Call */}
              <button 
                onClick={() => { alert('Stockist reporting coming soon!'); }}
                className="bg-slate-700 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center">
                  <Building2 size={32} className="text-amber-400" />
                </div>
                <span className="font-bold text-slate-300 text-sm">Stockist Call</span>
              </button>

              {/* Reminder Call */}
              <button 
                onClick={() => { alert('Reminder Call coming soon!'); }}
                className="bg-slate-700 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-rose-400/10 flex items-center justify-center">
                  <Phone size={32} className="text-rose-400" />
                </div>
                <span className="font-bold text-slate-300 text-sm text-center leading-tight">Reminder Call</span>
              </button>
            </div>

            {/* Sticky Final Call Report Footer */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-700 border-t border-slate-700 px-5 py-4 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
              <div>
                <h4 className="font-bold text-white text-sm">Final Call Report List</h4>
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1.5">
                    <UserRound size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-200">0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-sky-400" />
                    <span className="text-[10px] font-bold text-slate-200">0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-200">0</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-black text-xl">0</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Search & Select ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(1)} className="text-sky-400 text-sm font-medium">← Back</button>
              <p className="text-sm font-semibold text-white">Select {entityType}</p>
            </div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${entityType?.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-700 border border-slate-700 rounded-xl pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                style={{ height: '45px' }}
              />
            </div>
            <div className="space-y-2">
              {filteredList.length === 0 && (
                <p className="text-slate-200 text-sm text-center py-8">
                  No {entityType?.toLowerCase()}s found.<br />Add them from Creation Menu first.
                </p>
              )}
              {filteredList.map((item: any) => (
                <button key={item._id}
                  onClick={() => { setSelected({ id: item._id, name: item.name || item.businessName }); setStep(3); }}
                  className="w-full flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3 border border-slate-700/50 active:bg-slate-600 text-left">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entityType === 'Doctor' ? 'bg-sky-500/10' : 'bg-emerald-500/10'}`}>
                    {entityType === 'Doctor'
                      ? <UserRound size={16} className="text-sky-400" />
                      : <ShoppingBag size={16} className="text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name || item.businessName}</p>
                    <p className="text-xs text-slate-200">
                      {item.degree || item.proprietorName || ''}
                      {item.specialization ? ` · ${item.specialization}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Location + Discussion + Submit ───────────────── */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(2)} className="text-sky-400 text-sm font-medium">← Back</button>
              <p className="text-sm font-semibold text-white">{selected?.name}</p>
            </div>

            {/* GPS Card — manual capture */}
            <div className="bg-slate-700 rounded-2xl p-4 border border-slate-700/50 mb-4">
              <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Location Proof</p>

              {geoAddress ? (
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-400 font-medium">{geoAddress}</p>
                  </div>
                  <button onClick={() => { setGeoAddress(''); setLat(null); setLng(null); }}
                    className="text-xs text-slate-500 underline">Retake location</button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={captureLocation}
                    disabled={geoLoading}
                    className="w-full h-[45px] rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 active:border-sky-500 active:text-sky-400 transition-colors disabled:opacity-50"
                  >
                    <Navigation size={16} className={geoLoading ? 'animate-spin' : ''} />
                    {geoLoading ? 'Getting location...' : 'Tap to Capture My Location'}
                  </button>
                  {geoError
                    ? <p className="text-xs text-rose-400 mt-2 leading-relaxed">{geoError}</p>
                    : <p className="text-[10px] text-slate-500 mt-2">Used only to verify your field visit.</p>
                  }
                </div>
              )}
            </div>

            {/* Check-in time */}
            <div className="bg-slate-700 rounded-2xl px-4 py-3 border border-slate-700/50 mb-4 flex justify-between text-xs">
              <span className="text-slate-200">Check-in Time</span>
              <span className="text-white font-semibold">{checkInTime}</span>
            </div>

            {/* Discussion */}
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
              Discussion / Remarks
            </label>
            <textarea
              placeholder="Products promoted, feedback received, next steps..."
              value={discussion}
              onChange={e => setDiscussion(e.target.value)}
              rows={4}
              className="w-full bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 resize-none mb-4"
            />

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400 mb-4">
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full h-[45px] rounded-xl bg-sky-500 text-white font-semibold text-sm active:bg-sky-600 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Call Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
