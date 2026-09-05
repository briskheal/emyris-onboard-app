import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-[#1c1c2e] flex flex-col font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-[#1c1c2e] border-b border-[#3b3b5a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-300 active:scale-95 transition-transform bg-[#27273f] w-9 h-9 flex items-center justify-center rounded-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">Tag Location</h1>
            <p className="text-[10px] font-bold text-sky-400 tracking-wider uppercase mt-1">{displayType}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col">
        {/* Dropdown */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Select {displayType} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs font-black bg-emerald-500/10">
              {entities.length}
            </div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-14 pl-14 pr-10 border border-[#3b3b5a] rounded-2xl text-white font-semibold appearance-none bg-[#27273f] focus:outline-none focus:border-sky-500 shadow-sm"
            >
              <option value="">Select {displayType}</option>
              {entities.map(e => (
                <option key={e._id} value={e._id}>{e.name || e.businessName}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 flex flex-col min-h-[350px] max-h-[500px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            GPS Location <span className="text-rose-500">*</span>
          </label>
          
          <div className="flex-1 bg-[#27273f] rounded-3xl overflow-hidden relative border border-[#3b3b5a] shadow-lg shadow-black/20">
            {myLat && myLng ? (
              <iframe
                title="Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                src={`https://maps.google.com/maps?q=${myLat},${myLng}&z=16&output=embed`}
                allowFullScreen
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Navigation size={32} className="animate-pulse text-sky-400" />
                <p className="text-sm font-bold">Acquiring GPS Signal...</p>
              </div>
            )}
            
            {/* Target overlay icon */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-[#1c1c2e] border border-[#3b3b5a] rounded-full shadow-lg flex items-center justify-center text-sky-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 bg-rose-900/30 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium"><AlertCircle size={18} className="shrink-0" /> {error}</div>}
        {success && <div className="mt-4 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold text-center">{success}</div>}

        {/* Action Buttons */}
        <div className="mt-6 space-y-3 pb-8">
          <button
            onClick={handleTag}
            disabled={tagging || !selectedId || !myLat}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
          >
            {tagging ? 'Saving Coordinates...' : 'SAVE TAGGED LOCATION'}
          </button>
          
          <button className="w-full h-14 bg-[#27273f] border border-[#3b3b5a] text-sky-400 font-bold rounded-2xl hover:bg-[#3b3b5a]/50 transition-colors flex items-center justify-center gap-2">
            <MapPin size={18} /> Additional Locations
          </button>
        </div>
      </div>
    </div>
  );
}
