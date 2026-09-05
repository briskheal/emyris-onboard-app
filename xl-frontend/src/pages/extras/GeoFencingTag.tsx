import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation, AlertCircle } from 'lucide-react';
import axios from 'axios';

type EntityType = 'doctor' | 'chemist' | 'stockist';

export default function GeoFencingTag() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: EntityType }>();
  
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Map/GPS state
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [tagging, setTagging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Doctor';

  useEffect(() => {
    // 1. Fetch entities
    const uStr = localStorage.getItem('xl_user');
    let hq = '';
    let desig = '';
    if (uStr) {
        try {
            const u = JSON.parse(uStr);
            hq = u.hq || '';
            desig = u.designation || '';
        } catch(e){}
    }
    const typeStr = displayType.toLowerCase() + 's';
    axios.get(`/api/xl/${typeStr}?hq=${hq}&designation=${desig}`)
      .then(res => setEntities(res.data.data || []))
      .catch(() => setError(`Failed to load ${displayType}s.`));

    // 2. Start watching GPS for the map
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setMyLat(pos.coords.latitude);
          setMyLng(pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }, [displayType]);

  const handleTag = () => {
    if (!selectedId) { setError(`Please select a ${displayType} first.`); return; }
    if (!myLat || !myLng) { setError('Waiting for GPS signal. Please ensure location is enabled.'); return; }
    
    setTagging(true);
    setError('');
    
    const payload = { 
      lat1: myLat, 
      lng1: myLng, 
      geoAddress1: `${myLat.toFixed(5)}, ${myLng.toFixed(5)}` 
    };

    axios.put(`/api/xl/${type}/${selectedId}/geo`, payload)
      .then(() => {
        setSuccess('Location tagged successfully!');
        setTimeout(() => navigate('/extras/geo-fencing'), 2000);
      })
      .catch(() => setError('Failed to save location.'))
      .finally(() => setTagging(false));
  };

  return (
    <div className="min-h-full bg-[#f4f4f4] flex flex-col font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-[#e9ecef]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-700">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">EMYRIS</h1>
            <p className="text-[10px] font-bold text-emerald-600 tracking-wider">Biolifesciences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-sky-500"></div>
          <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
          <div className="flex flex-col gap-1 w-6">
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
            <div className="h-0.5 bg-sky-600 w-full rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl flex-1 px-4 py-6 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] mt-2 flex flex-col">
        <h2 className="text-lg font-bold text-sky-600 mb-6">Tag Location for {displayType} DCR</h2>

        {/* Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select {displayType} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-xs font-bold bg-emerald-50">
              {entities.length}
            </div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-14 pl-12 pr-10 border-2 border-sky-600/30 rounded-2xl text-slate-700 font-semibold appearance-none bg-white focus:outline-none focus:border-sky-500 shadow-sm"
            >
              <option value="">Select {displayType}</option>
              {entities.map(e => (
                <option key={e._id} value={e._id}>{e.name || e.businessName}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-sky-600">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Location <span className="text-rose-500">*</span>
          </label>
          
          <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200">
            {myLat && myLng ? (
              <iframe
                title="Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${myLat},${myLng}&z=16&output=embed`}
                allowFullScreen
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 gap-2">
                <Navigation size={32} className="animate-pulse" />
                <p className="text-sm font-medium">Getting GPS signal...</p>
              </div>
            )}
            
            {/* GPS Target overlay icon (mimicking the screenshot) */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex gap-2"><AlertCircle size={18} /> {error}</div>}
        {success && <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}

        {/* Tag Button */}
        <button
          onClick={handleTag}
          disabled={tagging || !selectedId || !myLat}
          className="mt-4 w-full h-14 bg-emerald-200/50 border-2 border-emerald-500 text-emerald-700 font-bold rounded-xl active:bg-emerald-300/50 transition-colors disabled:opacity-50"
        >
          {tagging ? 'Saving...' : 'Tag Location'}
        </button>
      </div>

      {/* Floating Additional Locations Button (Only for doctors per screenshot, but we can show it generally or hide it) */}
      <button className="fixed bottom-6 right-6 bg-sky-600 text-white px-5 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
        Additional locations <MapPin size={18} /> <span className="text-xs absolute right-3 top-3">+</span>
      </button>
    </div>
  );
}
