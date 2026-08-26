import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Reusable Table Footer Component for Pagination and Export
function TableFooter({ data, fileName, currentPage, setCurrentPage, pageSize, setPageSize }: any) {
  const totalPages = Math.ceil(data.length / pageSize) || 1;
  
  const handleExport = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt');
    const csvContent = [
      keys.join(','),
      ...data.map((row: any) => keys.map(k => `"${row[k] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center justify-between bg-slate-800 p-4 border-t border-slate-700">
      <div className="flex items-center gap-4">
        <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
          Export to CSV
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <span>Show</span>
          <select 
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 focus:outline-none"
          >
            {[10, 25, 50, 100, 1000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>records</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
          className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
          className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >Next &gt;</button>
      </div>
    </div>
  );
}

export default function ManageLocations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route'>('state');
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
          <ArrowLeft size={24} /> <span className="font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>
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
              className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'state' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE STATE
            </button>
            <button 
              onClick={() => setActiveTab('hq')} 
              className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'hq' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE HEADQUARTERS
            </button>
            <button 
              onClick={() => setActiveTab('city')} 
              className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'city' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              CREATE CITY / AREA
            </button>
            <button 
              onClick={() => setActiveTab('route')} 
              className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'route' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const res = await axios.post('/api/admin/locations/states', { stateName });
      if (res.data.success) {
        setStateName(''); fetchStates();
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit State Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/locations/states/${id}`, { stateName: newName.trim() });
      if (res.data.success) fetchStates();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/states/${id}`);
      if (res.data.success) fetchStates();
    } catch (e) { console.error(e); }
  };

  const paginatedStates = states.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE STATE</h2>
      
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER STATE *</label>
          <input type="text" required value={stateName} onChange={e => setStateName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="State Name" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add State'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({states.length}) ENTRIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">State</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedStates.map((s, i) => (
                <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{s.stateName}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{s.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(s._id, s.stateName)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg">
                      <Edit size={20} />
                    </button>
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
        <TableFooter data={states} fileName="States" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function HQTab() {
  const [hqs, setHqs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const res = await axios.post('/api/admin/locations/hqs', { state: stateName, hqName });
      if (res.data.success) { setHqName(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit HQ Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/locations/hqs/${id}`, { hqName: newName.trim() });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this HQ?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/hqs/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginatedHqs = hqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE HEADQUARTER</h2>
      
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
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add HQ'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({hqs.length}) ENTRIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">HQ</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">State</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedHqs.map((h, i) => (
                <tr key={h._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{h.hqName}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{h.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{h.state}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(h._id, h.hqName)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg">
                      <Edit size={20} />
                    </button>
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
        <TableFooter data={hqs} fileName="Headquarters" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const res = await axios.post('/api/admin/locations/cities', { state: stateName, hq: hqName, cityName, areaType: type });
      if (res.data.success) { setCityName(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit City/Area Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/locations/cities/${id}`, { cityName: newName.trim() });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/cities/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginatedCities = cities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE CITY / AREA</h2>
      
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
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({cities.length}) CITIES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">City</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">HQ</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">State</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedCities.map((c, i) => (
                <tr key={c._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">
                    {c.cityName}
                    <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-normal">{c.areaType}</span>
                  </td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{c.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{c.hq}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{c.state}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(c._id, c.cityName)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg">
                      <Edit size={20} />
                    </button>
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
        <TableFooter data={cities} fileName="Cities" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const res = await axios.post('/api/admin/locations/routes', { state: stateName, hq: hqName, fromCity, toCity, areaType, distance });
      if (res.data.success) { setFromCity(''); setToCity(''); setDistance(0); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentDistance: number) => {
    const newDistance = window.prompt("Edit Distance (km):", currentDistance.toString());
    if (!newDistance || isNaN(Number(newDistance)) || Number(newDistance) === currentDistance) return;
    try {
      const res = await axios.put(`/api/admin/locations/routes/${id}`, { distance: Number(newDistance) });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/routes/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginatedRoutes = routes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-4 tracking-wide uppercase">CREATE ROUTE</h2>
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
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({routes.length}) ROUTES</h3>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr No.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">From City</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">To City</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Distance</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Type</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedRoutes.map((r, i) => (
                <tr key={r._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{r.fromCity}</td>
                  <td className="border-r border-slate-700 p-5 text-white font-bold">{r.toCity}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{r.distance} km</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{r.areaType}</td>
                  <td className="border-r border-slate-700 p-5 text-slate-300">{r.uid || '-'}</td>
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(r._id, r.distance)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg">
                      <Edit size={20} />
                    </button>
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
        <TableFooter data={routes} fileName="Routes" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}
