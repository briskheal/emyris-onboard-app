import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Search, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

type EntityType = 'Doctor' | 'Chemist' | 'Stockist';

export default function GeoFencing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EntityType>('Doctor');
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tagLoading, setTagLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEntities();
  }, [activeTab]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/xl/entities?type=${activeTab}`);
      setEntities(res.data.data || []);
    } catch (e) {
      setError(`Failed to fetch ${activeTab.toLowerCase()}s.`);
    } finally {
      setLoading(false);
    }
  };

  const handleTag = (entityId: string, slot: 1 | 2) => {
    if (!navigator.geolocation) { setError('GPS is not supported on this device.'); return; }
    setTagLoading(`${entityId}-${slot}`);
    setError('');
    setSuccess('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = slot === 1 
            ? { lat1: pos.coords.latitude, lng1: pos.coords.longitude, geoAddress1: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` }
            : { lat2: pos.coords.latitude, lng2: pos.coords.longitude, geoAddress2: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` };
          
          await axios.put(`/api/xl/${activeTab.toLowerCase()}/${entityId}/geo`, payload);
          await fetchEntities();
          setSuccess('Location tagged successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
          setError('Failed to save location.');
        } finally {
          setTagLoading(null);
        }
      },
      (err) => {
        setTagLoading(null);
        setError(err.code === 1 ? 'Location access denied.' : 'Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filteredEntities = entities.filter(e => 
    (e.name || e.businessName || '').toLowerCase().includes(search.toLowerCase()) || 
    (e.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = entities.filter(e => !e.lat1).length;

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600 flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight">Geo-Fencing</h1>
          <p className="text-xs text-slate-400">Manage field locations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700/60 px-4 pt-2 pb-0 flex gap-4 sticky top-[76px] z-10 overflow-x-auto">
        {(['Doctor', 'Chemist', 'Stockist'] as EntityType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
          >
            {tab}s
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {pendingCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-400">Missing Coordinates</p>
              <p className="text-xs text-amber-400/80 mt-0.5">You have {pendingCount} {activeTab.toLowerCase()}s without a primary location. DCR submission is blocked for them.</p>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

        <div className="space-y-3 flex-1 overflow-y-auto pb-6">
          {loading ? (
             <p className="text-center text-sm text-slate-500 mt-10">Loading {activeTab.toLowerCase()}s...</p>
          ) : filteredEntities.length === 0 ? (
             <p className="text-center text-sm text-slate-500 mt-10">No {activeTab.toLowerCase()}s found.</p>
          ) : (
            filteredEntities.map(e => (
              <div key={e._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="text-base font-bold text-white">{e.name || e.businessName}</h3>
                    <p className="text-xs text-slate-400">
                      {activeTab === 'Doctor' ? (e.specialization || 'General') : (e.proprietorName || 'Owner')} • {e.workingArea || e.hq}
                    </p>
                  </div>
                  {e.lat1 && e.lat2 ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">Fully Tagged</span>
                  ) : e.lat1 ? (
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">Primary Tagged</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">Not Tagged</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Primary Location */}
                  {e.lat1 ? (
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Primary</p>
                        <p className="text-[10px] text-slate-400 truncate">{e.geoAddress1}</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleTag(e._id, 1)} disabled={tagLoading !== null} className="h-[46px] rounded-xl border border-dashed border-slate-600 flex flex-col items-center justify-center gap-0.5 active:bg-slate-700 disabled:opacity-50">
                      {tagLoading === `${e._id}-1` ? <Navigation size={12} className="animate-spin text-emerald-400" /> : <MapPin size={12} className="text-emerald-400" />}
                      <span className="text-[10px] font-bold text-slate-300">Tag Primary</span>
                    </button>
                  )}

                  {/* Secondary Location */}
                  {e.lat2 ? (
                    <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-2.5 flex items-center gap-2">
                      <MapPin size={14} className="text-sky-400 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest leading-none mb-1">Secondary</p>
                        <p className="text-[10px] text-slate-400 truncate">{e.geoAddress2}</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleTag(e._id, 2)} disabled={tagLoading !== null} className="h-[46px] rounded-xl border border-dashed border-slate-600 flex flex-col items-center justify-center gap-0.5 active:bg-slate-700 disabled:opacity-50">
                      {tagLoading === `${e._id}-2` ? <Navigation size={12} className="animate-spin text-sky-400" /> : <MapPin size={12} className="text-sky-400" />}
                      <span className="text-[10px] font-bold text-slate-300">Tag Secondary</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
