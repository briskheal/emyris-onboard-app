import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation, AlertCircle, ChevronDown, Search } from 'lucide-react';
import axios from 'axios';

type EntityType = 'doctor' | 'chemist' | 'stockist';

export default function GeoFencingTag() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: EntityType }>();
  
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Map/GPS state
  const watchIdRef = useRef<number | null>(null);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [tagging, setTagging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const [isMultiMode, setIsMultiMode] = useState(false);

  const startGpsWatch = () => {
    if (!navigator.geolocation) {
      setError('GPS is not supported on this device.');
      return;
    }
    setGeoLoading(true);
    setError('');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > 1000) return; // ignore wild jumps
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
        
        // Only update map if it moved significantly (> 15m) or first time to stop map dancing
        setMapLat(prev => {
           if (!prev) return pos.coords.latitude;
           if (Math.abs(prev - pos.coords.latitude) > 0.00015) return pos.coords.latitude;
           return prev;
        });
        setMapLng(prev => {
           if (!prev) return pos.coords.longitude;
           if (Math.abs(prev - pos.coords.longitude) > 0.00015) return pos.coords.longitude;
           return prev;
        });
        setGeoLoading(false);
      },
      (err) => {
        if (!myLat) {
          setError('Failed to get location. Ensure GPS is enabled.');
          setGeoLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const refreshLocation = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    startGpsWatch();
  };

  const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Doctor';

  const loadEntities = () => {
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
    
    Promise.all([
      axios.get(`/api/xl/${typeStr}?hq=${hq}&designation=${desig}`),
      axios.get(`/api/xl/geo-fencing/my-tags?employeeId=${uStr ? JSON.parse(uStr).employeeId : ''}`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([entitiesRes, tagsRes]) => {
        let allEntities = entitiesRes.data.data || [];
        const myTags = tagsRes.data.data || [];
        
        // Add tagCount to each entity
        allEntities = allEntities.map(e => {
          const tagCount = myTags.filter((t: any) => t.entityId === e._id && t.entityType.toLowerCase() === displayType.toLowerCase()).length;
          return { ...e, tagCount };
        });

        setEntities(allEntities);
      })
      .catch(() => setError(`Failed to load ${displayType}s.`));
  };

  useEffect(() => {
    loadEntities();
    startGpsWatch();

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [displayType]);

  const handleTag = () => {
    if (!selectedId) { setError(`Please select a ${displayType} first.`); return; }
    if (!myLat || !myLng) { setError('Waiting for GPS signal. Please ensure location is enabled.'); return; }
    
    setTagging(true);
    setError('');
    
    // For Doctor's second tag, it uses lat2 in the backend automatically based on empty slots
    const payload = { 
      lat1: myLat, 
      lng1: myLng, 
      geoAddress1: `${myLat.toFixed(5)}, ${myLng.toFixed(5)}`,
      employeeId: JSON.parse(localStorage.getItem('xl_user') || '{}').employeeId
    };

    axios.put(`/api/xl/${type}/${selectedId}/geo`, payload)
      .then(() => {
        setSuccess('Location tagged successfully!');
        setTagging(false);
        setSelectedId('');
        loadEntities();
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((err: any) => {
        setTagging(false);
        setError(err.response?.data?.error || err.message || 'Failed to save location.');
      });
  };

  const availableEntities = entities.filter(e => {
      if (displayType === 'Doctor' && isMultiMode) {
          return e.tagCount === 1;
      }
      return (e.tagCount || 0) === 0;
  });

  const selectedEntity = entities.find(e => e._id === selectedId);
  const selectedName = selectedEntity ? (selectedEntity.name || selectedEntity.businessName) : (isMultiMode ? 'Tap To Select A Tagged Doctor' : `Select ${displayType}`);
  
  const filteredEntities = availableEntities.filter(e => {
    const name = (e.name || e.businessName || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#1c1c2e] flex flex-col font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-[#1c1c2e] border-b border-[#3b3b5a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-300 active:scale-95 transition-transform bg-[#27273f] w-9 h-9 flex items-center justify-center rounded-xl">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">Tag Location for {displayType} DCR</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col">
        {/* Multi-Location Banner */}
        {isMultiMode && (
          <div className="mb-4 bg-[#234c4b] border border-[#2a6663] rounded-xl p-3 flex items-center gap-3">
            <div className="mt-1 flex-shrink-0 text-[#4ade80]">
              <MapPin size={24} />
              <div className="text-[10px] font-black absolute ml-[14px] -mt-[14px] bg-[#1c1c2e] rounded-full w-3 h-3 flex items-center justify-center text-[#4ade80]">+</div>
            </div>
            <div className="flex-1">
              <p className="text-[#4ade80] font-bold text-sm leading-tight">Multi-Location Mode: Add additional locations for tagged doctors</p>
            </div>
            <button onClick={() => { setIsMultiMode(false); setSelectedId(''); }} className="bg-[#ef4444] text-white font-bold text-xs px-3 py-1.5 rounded-lg active:scale-95">
              Exit
            </button>
          </div>
        )}

        {/* Dropdown UI */}
        <div className="mb-6 relative">
          <label className="block text-[14px] font-bold text-slate-300 tracking-wide mb-2">
            {isMultiMode ? 'Selected Doctor' : `Select ${displayType}`} <span className="text-rose-500">*</span>
          </label>
          
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full h-14 ${isMultiMode ? 'pl-4' : 'pl-14'} pr-10 border border-[#3b3b5a] rounded-2xl text-slate-300 font-semibold bg-[#27273f] flex items-center cursor-pointer relative`}
          >
            {!isMultiMode && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-[#1c1c2e] flex items-center justify-center text-emerald-400 text-xs font-black bg-[#234c4b]">
                {availableEntities.length}
              </div>
            )}
            
            <span className="truncate">{selectedName}</span>
            
            {!isMultiMode && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown size={20} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>
        </div>

        {/* Modal Dropdown matching screenshot 3 */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 bg-[#12121a]/80 flex flex-col justify-end">
            <div className="bg-[#27273f] h-[80vh] rounded-t-3xl border-t border-[#3b3b5a] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center relative">
                <h2 className="text-lg font-bold text-white pl-2">{isMultiMode ? 'Select Tagged Doctor' : `Select ${displayType}`}</h2>
                <button onClick={() => setIsDropdownOpen(false)} className="w-8 h-8 rounded-full bg-[#3b3b5a]/50 flex items-center justify-center text-slate-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-[#a1a1aa] text-sm">Choose a {displayType.toLowerCase()} to add {isMultiMode ? 'an additional' : 'a'} location</p>
              </div>
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={`Search ${displayType.toLowerCase()}s by name`} 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1c1c2e] text-slate-300 text-[15px] font-medium rounded-xl pl-11 pr-4 py-3.5 border border-[#3b3b5a] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-3">
                {filteredEntities.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No results found</div>
                ) : (
                  filteredEntities.map(e => (
                    <div 
                      key={e._id}
                      onClick={() => {
                        setSelectedId(e._id);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="bg-[#2f2f45] rounded-xl p-4 border border-[#3b3b5a]/40 shadow-sm active:scale-95 transition-transform cursor-pointer"
                    >
                      <h3 className="text-base font-bold text-white mb-1 tracking-wide">{e.name || e.businessName}</h3>
                      <p className="text-[13px] text-slate-400 leading-snug mb-3">
                        {e.hospital || e.specialization || ''}{e.hospital && e.specialization ? ',' : ''}{e.headquarter ? `, ${e.headquarter}` : ''}
                      </p>
                      {e.tagCount > 0 && (
                        <p className="text-[#4ade80] text-xs font-bold">Current locations: {e.tagCount}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      {/* Map Area */}
        <div className="flex flex-col">
          <label className="block text-[14px] font-bold text-slate-300 tracking-wide mb-2">
            Select Location <span className="text-rose-500">*</span>
          </label>
          
          <div className="h-[350px] w-full bg-[#27273f] rounded-2xl overflow-hidden relative border border-[#3b3b5a] shadow-lg shadow-black/20">
            {mapLat && mapLng ? (
              <iframe
                title="Map"
                className="absolute top-0 left-0 w-full h-full"
                style={{ width: '100%', height: '100%', border: 0 }} 
                src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=16&output=embed`}
                allowFullScreen
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Navigation size={32} className={`text-sky-400 ${geoLoading ? 'animate-pulse' : ''}`} />
                <p className="text-sm font-bold">{geoLoading ? 'Acquiring Precise GPS...' : 'No GPS Signal'}</p>
              </div>
            )}
            
            {/* Target overlay button for precise location refresh */}
            <button 
              type="button"
              onClick={refreshLocation}
              disabled={geoLoading}
              className={`absolute top-4 right-4 w-12 h-12 bg-white border-2 ${geoLoading ? 'border-sky-500 animate-pulse' : 'border-transparent'} rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.3)] flex items-center justify-center text-slate-700 active:scale-95 transition-all z-10`}
              title="Get Precise Location"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            </button>
          </div>
        </div>

        {error && <div className="mt-4 bg-rose-900/30 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium"><AlertCircle size={18} className="shrink-0" /> {error}</div>}
        {success && <div className="mt-4 bg-[#234c4b] border border-[#2a6663] text-[#4ade80] px-4 py-3 rounded-xl text-sm font-bold text-center">{success}</div>}

        {/* Action Buttons */}
        <div className="mt-6 space-y-4 pb-8">
          <button
            onClick={handleTag}
            disabled={tagging || !selectedId || !myLat}
            className={`w-full h-14 ${isMultiMode ? 'bg-[#234c4b] text-[#4ade80] border border-[#2a6663] hover:bg-[#2a6663]' : 'bg-[#2f4f4f] text-emerald-400 hover:bg-[#3d6666] border border-[#4ade80]/30'} font-bold rounded-2xl transition-colors disabled:opacity-50 text-[15px]`}
          >
            {tagging ? 'Saving...' : (isMultiMode ? 'Add Additional Location' : 'Tag Location')}
          </button>
          
          {/* ONLY DOCTORS CAN HAVE ADDITIONAL LOCATIONS */}
          {displayType === 'Doctor' && !isMultiMode && (
            <button onClick={() => setIsMultiMode(true)} className="w-full h-14 bg-[#3b82f6] text-white font-bold rounded-[30px] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto max-w-[280px] shadow-lg shadow-blue-900/40">
              <span className="text-[15px]">Additional locations</span>
              <div className="relative flex items-center justify-center">
                <MapPin size={18} />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-black bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center">+</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
