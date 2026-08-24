import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ManageLocations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route'>('state');
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
          <ArrowLeft size={24} /> <span className="font-bold text-lg tracking-wide uppercase">Back to Admin Menu</span>
        </button>
      </div>

      {/* Main Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar for Tabs */}
        <div className="w-72 bg-slate-800/50 border-r border-slate-800 flex flex-col py-6">
          <h2 className="px-6 text-emerald-400 font-black text-xl tracking-wider mb-6">AREA CREATION</h2>
          
          <div className="flex flex-col space-y-2 px-4">
            <button 
              onClick={() => setActiveTab('state')} 
              className={`text-left px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'state' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE STATE
            </button>
            <button 
              onClick={() => setActiveTab('hq')} 
              className={`text-left px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'hq' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE HEADQUARTERS
            </button>
            <button 
              onClick={() => setActiveTab('city')} 
              className={`text-left px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'city' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE CITY / AREA
            </button>
            <button 
              onClick={() => setActiveTab('route')} 
              className={`text-left px-6 py-4 rounded-xl font-bold transition-all ${activeTab === 'route' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE ROUTE
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto">
          {activeTab === 'state' && <StateTab />}
          {activeTab === 'hq' && <HQTab />}
          {activeTab === 'city' && <CityTab />}
          {activeTab === 'route' && <RouteTab />}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Desktop Subcomponents
// -------------------------------------------------------------

function StateTab() {
  const [states, setStates] = useState<any[]>([]);
  const [stateName, setStateName] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStates = async () => {
    try {
      const res = await axios.get('/api/admin/locations/states');
      if (res.data.success) setStates(res.data.states);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStates(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/states', { stateName, uid });
      if (res.data.success) {
        setStateName(''); setUid(''); fetchStates();
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/states/${id}`);
      if (res.data.success) fetchStates();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE STATE</h2>
      
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER STATE *</label>
          <input type="text" required value={stateName} onChange={e => setStateName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="State Name" />
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">UID</label>
          <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="e.g. STE1" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add State'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({states.length}) ENTRIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700 text-slate-300">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Sr No.</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">State</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">UID</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {states.map((s, i) => (
              <tr key={s._id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-slate-300">{i + 1}</td>
                <td className="p-5 text-white font-bold">{s.stateName}</td>
                <td className="p-5 text-slate-300">{s.uid || '-'}</td>
                <td className="p-5 text-center">
                  <button onClick={() => handleDelete(s._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {states.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No states found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HQTab() {
  const [hqs, setHqs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [hqRes, stateRes] = await Promise.all([axios.get('/api/admin/locations/hqs'), axios.get('/api/admin/locations/states')]);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
      if (stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/hqs', { state: stateName, hqName, uid });
      if (res.data.success) { setHqName(''); setUid(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this HQ?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/hqs/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE HEADQUARTER</h2>
      
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT STATE *</label>
          <select required value={stateName} onChange={e => setStateName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER HEADQUARTER *</label>
          <input type="text" required value={hqName} onChange={e => setHqName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="HQ Name" />
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">UID</label>
          <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="e.g. HQS1" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add HQ'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({hqs.length}) ENTRIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700 text-slate-300">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Sr No.</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">HQ</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">UID</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">State</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {hqs.map((h, i) => (
              <tr key={h._id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-slate-300">{i + 1}</td>
                <td className="p-5 text-white font-bold">{h.hqName}</td>
                <td className="p-5 text-slate-300">{h.uid || '-'}</td>
                <td className="p-5 text-slate-300">{h.state}</td>
                <td className="p-5 text-center">
                  <button onClick={() => handleDelete(h._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {hqs.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No HQs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CityTab() {
  const [cities, setCities] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  const [cityName, setCityName] = useState('');
  const [type, setType] = useState('City');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [cityRes, hqRes, stateRes] = await Promise.all([axios.get('/api/admin/locations/cities'), axios.get('/api/admin/locations/hqs'), axios.get('/api/admin/locations/states')]);
      if (cityRes.data.success) setCities(cityRes.data.cities);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
      if (stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);
  const filteredHqs = hqs.filter(h => h.state === stateName);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/cities', { state: stateName, hq: hqName, cityName, areaType: type, uid });
      if (res.data.success) { setCityName(''); setUid(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/cities/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">&lt; CREATE CITY / AREA</h2>
      
      <form onSubmit={handleAdd} className="flex flex-wrap gap-6 items-end mb-12">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">TYPE *</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="City">City</option><option value="Local Area">Local Area</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT STATE *</label>
          <select required value={stateName} onChange={e => { setStateName(e.target.value); setHqName(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT HQ *</label>
          <select required value={hqName} onChange={e => setHqName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select HQ</option>
            {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">CITY / AREA NAME *</label>
          <input type="text" required value={cityName} onChange={e => setCityName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Name" />
        </div>
        <div className="w-32">
          <label className="text-sm text-slate-400 font-bold mb-2 block">UID</label>
          <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="CTY1" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({cities.length}) CITIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700 text-slate-300">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Sr No.</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">City</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">UID</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">HQ</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">State</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {cities.map((c, i) => (
              <tr key={c._id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-slate-300">{i + 1}</td>
                <td className="p-5 text-white font-bold">
                  {c.cityName}
                  <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-normal">{c.areaType}</span>
                </td>
                <td className="p-5 text-slate-300">{c.uid || '-'}</td>
                <td className="p-5 text-slate-300">{c.hq}</td>
                <td className="p-5 text-slate-300">{c.state}</td>
                <td className="p-5 text-center">
                  <button onClick={() => handleDelete(c._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {cities.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No cities found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RouteTab() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [areaType, setAreaType] = useState('Local');
  const [distance, setDistance] = useState(0);
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [routeRes, cityRes, hqRes, stateRes] = await Promise.all([axios.get('/api/admin/locations/routes'), axios.get('/api/admin/locations/cities'), axios.get('/api/admin/locations/hqs'), axios.get('/api/admin/locations/states')]);
      if (routeRes.data.success) setRoutes(routeRes.data.routes);
      if (cityRes.data.success) setCities(cityRes.data.cities);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
      if (stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);
  const filteredHqs = hqs.filter(h => h.state === stateName);
  const filteredCities = cities.filter(c => c.hq === hqName);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/routes', { state: stateName, hq: hqName, fromCity, toCity, areaType, distance, uid });
      if (res.data.success) { setFromCity(''); setToCity(''); setDistance(0); setUid(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/routes/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-4 tracking-wide uppercase">&lt; CREATE ROUTE</h2>
      <div className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-8 font-bold text-sm">
        Note: If the distance of a route is edited, the updated distance will not be reflected in the tour programs. However, the new distance will be applied to newly created tour programs.
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-wrap gap-6 items-end mb-12">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">STATE *</label>
          <select required value={stateName} onChange={e => { setStateName(e.target.value); setHqName(''); setFromCity(''); setToCity(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">HQ *</label>
          <select required value={hqName} onChange={e => { setHqName(e.target.value); setFromCity(''); setToCity(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select HQ</option>
            {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">FROM *</label>
          <select required value={fromCity} onChange={e => setFromCity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select From</option>
            {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">TO *</label>
          <select required value={toCity} onChange={e => setToCity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select To</option>
            {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">AREA TYPE *</label>
          <select value={areaType} onChange={e => setAreaType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="Local">Local</option><option value="Ex-Station">Ex-Station</option><option value="Out-Station">Out-Station</option>
          </select>
        </div>
        <div className="w-32">
          <label className="text-sm text-slate-400 font-bold mb-2 block">DISTANCE *</label>
          <input type="number" required value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
        </div>
        <div className="w-32">
          <label className="text-sm text-slate-400 font-bold mb-2 block">UID</label>
          <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="RTE1" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({routes.length}) ROUTES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700 text-slate-300">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Sr No.</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">From City</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">To City</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Distance</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Type</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">UID</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {routes.map((r, i) => (
              <tr key={r._id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-slate-300">{i + 1}</td>
                <td className="p-5 text-white font-bold">{r.fromCity}</td>
                <td className="p-5 text-white font-bold">{r.toCity}</td>
                <td className="p-5 text-slate-300">{r.distance} km</td>
                <td className="p-5 text-slate-300">{r.areaType}</td>
                <td className="p-5 text-slate-300">{r.uid || '-'}</td>
                <td className="p-5 text-center">
                  <button onClick={() => handleDelete(r._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No routes found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
