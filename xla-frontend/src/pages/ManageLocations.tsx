import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Trash2, Edit, Save, X,
  Map, Building2, MapPin, Route, UploadCloud, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

// -------------------------------------------------------------
// Helper Component: TableFooter
// -------------------------------------------------------------
function TableFooter({ data, fileName, currentPage, setCurrentPage, pageSize, setPageSize }: any) {
  const totalPages = Math.ceil(data.length / pageSize) || 1;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <div className="px-3.5 py-2.5 border-t border-slate-700/80 bg-slate-800/90 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          &lt; Prev
        </button>
        <span className="px-2 text-slate-300 text-xs font-medium">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          Next &gt;
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleExport} className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5">
          <Download size={13} />
          Export
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Show</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-0.5 text-xs outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Desktop Subcomponents with Inline Editing
// -------------------------------------------------------------

function StateTab() {
  const [states, setStates] = useState<any[]>([]);
  const [stateName, setStateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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

  const startEdit = (s: any) => {
    setEditId(s._id);
    setEditData({ ...s });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`/api/admin/locations/states/${editId}`, editData);
      if (res.data.success) {
        fetchStates();
        cancelEdit();
      }
    } catch (e) { console.error(e); alert('Error updating state'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/states/${id}`);
      if (res.data.success) fetchStates();
    } catch (e) { console.error(e); }
  };

  const searchedStates = states.filter(s => (s.stateName||'').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedStates = searchedStates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Form Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-bold text-sky-400 mb-3 tracking-wider uppercase flex items-center gap-1.5">
          <Map size={14} /> Create State
        </h2>
        
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">State Name *</label>
            <input 
              type="text" 
              required 
              value={stateName} 
              onChange={e => setStateName(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors" 
              placeholder="e.g. Maharashtra, Gujarat" 
            />
          </div>
          <button 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-1.5 text-xs rounded-lg transition-colors h-[32px] shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add State'}
          </button>
        </form>
      </div>
      
      {/* Search & Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Showing ({searchedStates.length}) States</h3>
        <input 
          type="text" 
          placeholder="Search State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-sky-500 w-64 placeholder-slate-500"
        />
      </div>
      
      {/* Grid Table */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow-md flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
              <tr className="border-b border-slate-700/80 text-slate-300">
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-16 text-center">Sr No.</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">State</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-28">UID</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] text-center bg-slate-800 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedStates.map((s, i) => (
                <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 text-center">{(currentPage - 1) * pageSize + i + 1}</td>
                  
                  {editId === s._id ? (
                    <td className="border-r border-slate-700/60 px-2 py-1">
                      <input type="text" value={editData.stateName} onChange={e => setEditData({...editData, stateName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" />
                    </td>
                  ) : (
                    <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-white font-semibold">{s.stateName}</td>
                  )}
                  
                  <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 font-mono">{s.uid || '-'}</td>
                  
                  <td className="border-r border-slate-700/60 px-2 py-1.5 text-center flex justify-center items-center gap-1.5">
                    {editId === s._id ? (
                      <>
                        <button onClick={saveEdit} title="Save" className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded"><Save size={14} /></button>
                        <button onClick={cancelEdit} title="Cancel" className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)} title="Edit" className="text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-1.5 rounded"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(s._id)} title="Delete" className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-1.5 rounded"><Trash2 size={14} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {states.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500 text-xs font-semibold">No states found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={searchedStates} fileName="States" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
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
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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

  const startEdit = (h: any) => {
    setEditId(h._id);
    setEditData({ ...h });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`/api/admin/locations/hqs/${editId}`, editData);
      if (res.data.success) {
        fetchData();
        cancelEdit();
      }
    } catch (e) { console.error(e); alert('Error updating HQ'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this HQ?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/hqs/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const searchedHqs = hqs.filter(h => (h.hqName||'').toLowerCase().includes(searchTerm.toLowerCase()) || (h.state||'').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedHqs = searchedHqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Form Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-bold text-sky-400 mb-3 tracking-wider uppercase flex items-center gap-1.5">
          <Building2 size={14} /> Create Headquarters
        </h2>
        
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select State *</label>
            <select 
              required 
              value={stateName} 
              onChange={e => setStateName(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">HQ Name *</label>
            <input 
              type="text" 
              required 
              value={hqName} 
              onChange={e => setHqName(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors" 
              placeholder="Headquarter Name" 
            />
          </div>
          <button 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-1.5 text-xs rounded-lg transition-colors h-[32px] shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add HQ'}
          </button>
        </form>
      </div>
      
      {/* Search & Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Showing ({searchedHqs.length}) Headquarters</h3>
        <input 
          type="text" 
          placeholder="Search HQ or State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-sky-500 w-64 placeholder-slate-500"
        />
      </div>
      
      {/* Grid Table */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow-md flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
              <tr className="border-b border-slate-700/80 text-slate-300">
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-16 text-center">Sr No.</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">HQ</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-28">UID</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">State</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] text-center bg-slate-800 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedHqs.map((h, i) => (
                <tr key={h._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 text-center">{(currentPage - 1) * pageSize + i + 1}</td>
                  
                  {editId === h._id ? (
                    <>
                      <td className="border-r border-slate-700/60 px-2 py-1">
                        <input type="text" value={editData.hqName} onChange={e => setEditData({...editData, hqName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" />
                      </td>
                      <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 font-mono">{h.uid || '-'}</td>
                      <td className="border-r border-slate-700/60 px-2 py-1">
                        <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                          <option value="">Select State</option>
                          {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-white font-semibold">{h.hqName}</td>
                      <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 font-mono">{h.uid || '-'}</td>
                      <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{h.state}</td>
                    </>
                  )}
                  
                  <td className="border-r border-slate-700/60 px-2 py-1.5 text-center flex justify-center items-center gap-1.5">
                    {editId === h._id ? (
                      <>
                        <button onClick={saveEdit} title="Save" className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded"><Save size={14} /></button>
                        <button onClick={cancelEdit} title="Cancel" className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(h)} title="Edit" className="text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-1.5 rounded"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(h._id)} title="Delete" className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-1.5 rounded"><Trash2 size={14} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {hqs.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500 text-xs font-semibold">No HQs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={searchedHqs} fileName="HQs" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function CityTab() {
  const [searchTerm, setSearchTerm] = useState('');
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
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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
    } catch (e: any) { 
      console.error(e); 
      alert(e.response?.data?.message || e.response?.data?.error || 'Failed to create city');
    } finally { setLoading(false); }
  };

  const startEdit = (c: any) => {
    setEditId(c._id);
    setEditData({ ...c });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`/api/admin/locations/cities/${editId}`, editData);
      if (res.data.success) {
        fetchData();
        cancelEdit();
      }
    } catch (e) { console.error(e); alert('Error updating City'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/cities/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const searchedCities = cities.filter(c => !searchTerm || (c.cityName && c.cityName.toLowerCase().includes(searchTerm.toLowerCase())) || (c.hq && c.hq.toLowerCase().includes(searchTerm.toLowerCase())) || (c.state && c.state.toLowerCase().includes(searchTerm.toLowerCase())));
  const paginatedCities = searchedCities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Form Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-bold text-sky-400 mb-3 tracking-wider uppercase flex items-center gap-1.5">
          <MapPin size={14} /> Create City / Area
        </h2>
        
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Type *</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="City">City</option>
              <option value="Local Area">Local Area</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select State *</label>
            <select 
              required 
              value={stateName} 
              onChange={e => { setStateName(e.target.value); setHqName(''); }} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select HQ *</label>
            <select 
              required 
              value={hqName} 
              onChange={e => setHqName(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select HQ</option>
              {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">City / Area Name *</label>
            <input 
              type="text" 
              required 
              value={cityName} 
              onChange={e => setCityName(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors" 
              placeholder="Name" 
            />
          </div>
          <button 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-1.5 text-xs rounded-lg transition-colors h-[32px] shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>
      
      {/* Search & Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Showing ({searchedCities.length}) Cities</h3>
        <input 
          type="text" 
          placeholder="Search City, HQ, or State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-sky-500 w-64 placeholder-slate-500"
        />
      </div>
      
      {/* Grid Table */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow-md flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
              <tr className="border-b border-slate-700/80 text-slate-300">
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-16 text-center">Sr No.</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">City</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-28">UID</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">HQ</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">State</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] text-center bg-slate-800 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedCities.map((c, i) => {
                const isEditing = editId === c._id;
                const activeEditState = isEditing ? editData.state : c.state;
                const dynamicHqs = hqs.filter(h => h.state === activeEditState);

                return (
                  <tr key={c._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 text-center">{(currentPage - 1) * pageSize + i + 1}</td>
                    
                    {isEditing ? (
                      <td className="border-r border-slate-700/60 px-2 py-1">
                        <div className="flex gap-1.5">
                          <input type="text" value={editData.cityName} onChange={e => setEditData({...editData, cityName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" />
                          <select value={editData.areaType} onChange={e => setEditData({...editData, areaType: e.target.value})} className="bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-white text-[10px] w-24">
                            <option value="City">City</option>
                            <option value="Local Area">Local Area</option>
                          </select>
                        </div>
                      </td>
                    ) : (
                      <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-white font-semibold">
                        {c.cityName}
                        <span className="ml-2 text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300 font-normal">{c.areaType}</span>
                      </td>
                    )}
                    
                    <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 font-mono">{c.uid || '-'}</td>
                    
                    {isEditing ? (
                      <>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.hq} onChange={e => setEditData({...editData, hq: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select HQ</option>
                            {dynamicHqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value, hq: ''})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select State</option>
                            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{c.hq}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{c.state}</td>
                      </>
                    )}
                    
                    <td className="border-r border-slate-700/60 px-2 py-1.5 text-center flex justify-center items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} title="Save" className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded"><Save size={14} /></button>
                          <button onClick={cancelEdit} title="Cancel" className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(c)} title="Edit" className="text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-1.5 rounded"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(c._id)} title="Delete" className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-1.5 rounded"><Trash2 size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cities.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500 text-xs font-semibold">No cities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={searchedCities} fileName="Cities" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function RouteTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  
  const [stateName, setStateName] = useState('');
  const [hqName, setHqName] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [distance, setDistance] = useState<number | ''>('');
  const [areaType, setAreaType] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchData = async () => {
    try {
      const [routeRes, cityRes, hqRes, stateRes] = await Promise.all([
        axios.get('/api/admin/locations/routes'), axios.get('/api/admin/locations/cities'), 
        axios.get('/api/admin/locations/hqs'), axios.get('/api/admin/locations/states')
      ]);
      if (routeRes.data.success) setRoutes(routeRes.data.routes);
      if (cityRes.data.success) setCities(cityRes.data.cities);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
      if (stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredHqs = hqs.filter(h => h.state === stateName);
  const filteredCities = cities.filter(c => c.state === stateName);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDist = (areaType === 'Local' || areaType === 'Out-Station') ? 0 : Number(distance);
    if (areaType === 'Ex-Station' && (!finalDist || finalDist <= 0)) {
      return alert('Enter a valid distance for Ex-Station route');
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/routes', { 
        state: stateName, 
        hq: hqName, 
        fromCity, 
        toCity, 
        distance: finalDist, 
        areaType 
      });
      if (res.data.success) {
        setFromCity(''); setToCity(''); setDistance(''); setAreaType(''); fetchData();
      } else alert(res.data.message);
    } catch (e: any) { 
      console.error(e); 
      alert(e.response?.data?.message || 'Failed to add route');
    } finally { setLoading(false); }
  };

  const startEdit = (r: any) => {
    setEditId(r._id);
    setEditData({ ...r });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`/api/admin/locations/routes/${editId}`, editData);
      if (res.data.success) {
        fetchData();
        cancelEdit();
      }
    } catch (e) { console.error(e); alert('Error updating Route'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/locations/routes/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const searchedRoutes = routes.filter(r => !searchTerm || (r.fromCity && r.fromCity.toLowerCase().includes(searchTerm.toLowerCase())) || (r.toCity && r.toCity.toLowerCase().includes(searchTerm.toLowerCase())) || (r.hq && r.hq.toLowerCase().includes(searchTerm.toLowerCase())));
  const paginatedRoutes = searchedRoutes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl space-y-4">
      {/* Form Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-sky-400 tracking-wider uppercase flex items-center gap-1.5">
            <Route size={14} /> Create Route
          </h2>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            Updated distance applies to newly created tour programs
          </span>
        </div>
        
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2.5 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select State *</label>
            <select 
              required 
              value={stateName} 
              onChange={e => { setStateName(e.target.value); setHqName(''); setFromCity(''); setToCity(''); }} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select HQ *</label>
            <select 
              required 
              value={hqName} 
              onChange={e => { setHqName(e.target.value); setFromCity(''); setToCity(''); }} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select HQ</option>
              {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">From City *</label>
            <select 
              required 
              value={fromCity} 
              onChange={e => setFromCity(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">From City</option>
              {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">To City *</label>
            <select 
              required 
              value={toCity} 
              onChange={e => setToCity(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">To City</option>
              {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Area Type *</label>
            <select 
              required 
              value={areaType} 
              onChange={e => {
                const val = e.target.value;
                setAreaType(val);
                if (val === 'Local' || val === 'Out-Station') setDistance(0);
              }} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">Select Area Type</option>
              <option value="Local">Local (0 KM)</option>
              <option value="Ex-Station">Ex-Station</option>
              <option value="Out-Station">Out-Station (Ticket)</option>
            </select>
          </div>
          <div className="w-28">
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">
              {areaType === 'Local' ? 'Dist (0)' : areaType === 'Out-Station' ? 'Dist (Ticket)' : 'Dist (KM) *'}
            </label>
            <input 
              type="number" 
              required={areaType === 'Ex-Station'} 
              disabled={areaType === 'Local' || areaType === 'Out-Station'}
              value={areaType === 'Local' || areaType === 'Out-Station' ? 0 : distance} 
              onChange={e => setDistance(Number(e.target.value))} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-50" 
              placeholder="KM"
            />
          </div>
          <button 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-1.5 text-xs rounded-lg transition-colors h-[32px] shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Route'}
          </button>
        </form>
      </div>
      
      {/* Search & Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Showing ({searchedRoutes.length}) Routes</h3>
        <input 
          type="text" 
          placeholder="Search HQ or City..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-sky-500 w-64 placeholder-slate-500"
        />
      </div>
      
      {/* Grid Table */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow-md flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-sm">
              <tr className="border-b border-slate-700/80 text-slate-300">
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 w-14 text-center">Sr no.</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">Area Type</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">From City</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">To City</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">HQ</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800">State</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] bg-slate-800 text-right w-20">Distance</th>
                <th className="border-r border-slate-700/80 px-3 py-2 font-bold uppercase tracking-wider text-[11px] text-center bg-slate-800 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedRoutes.map((r, i) => {
                const isEditing = editId === r._id;
                const activeEditState = isEditing ? editData.state : r.state;
                
                const dynamicHqs = hqs.filter(h => h.state === activeEditState);
                const dynamicCities = cities.filter(c => c.state === activeEditState);

                return (
                  <tr key={r._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-400 text-center">{(currentPage - 1) * pageSize + i + 1}</td>
                    
                    {isEditing ? (
                      <>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.areaType} onChange={e => setEditData({...editData, areaType: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select</option>
                            <option value="Local">Local</option><option value="Ex-Station">Ex-Station</option><option value="Out-Station">Out-Station</option>
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.fromCity} onChange={e => setEditData({...editData, fromCity: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select From</option>
                            {dynamicCities.map((c: any) => <option key={`f_${c._id}`} value={c.cityName}>{c.cityName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.toCity} onChange={e => setEditData({...editData, toCity: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select To</option>
                            {dynamicCities.map((c: any) => <option key={`t_${c._id}`} value={c.cityName}>{c.cityName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.hq} onChange={e => setEditData({...editData, hq: e.target.value, fromCity: '', toCity: ''})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select HQ</option>
                            {dynamicHqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value, hq: '', fromCity: '', toCity: ''})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <option value="">Select State</option>
                            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700/60 px-2 py-1">
                          <input type="number" value={editData.distance} onChange={e => setEditData({...editData, distance: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{r.areaType || '-'}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-white font-semibold">{r.fromCity}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-white font-semibold">{r.toCity}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{r.hq || '-'}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300">{r.state || '-'}</td>
                        <td className="border-r border-slate-700/60 px-3 py-2 text-xs text-slate-300 text-right font-mono">{r.distance}</td>
                      </>
                    )}
                    
                    <td className="border-r border-slate-700/60 px-2 py-1.5 text-center flex justify-center items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} title="Save" className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded"><Save size={14} /></button>
                          <button onClick={cancelEdit} title="Cancel" className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(r)} title="Edit" className="text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-1.5 rounded"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(r._id)} title="Delete" className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-1.5 rounded"><Trash2 size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {routes.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500 text-xs font-semibold">No routes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={searchedRoutes} fileName="Routes" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Upload Location Tab
// -------------------------------------------------------------

function UploadLocationTab() {
  const [uploadType, setUploadType] = React.useState('State');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleDownloadFormat = async () => {
    const { utils, writeFile } = await import('xlsx');
    let headers: string[] = [];
    let filename = '';

    if (uploadType === 'State') {
      headers = ['State Name'];
      filename = 'state_upload_format.xlsx';
    } else if (uploadType === 'Headquarter') {
      headers = ['HQ Name', 'State'];
      filename = 'hq_upload_format.xlsx';
    } else if (uploadType === 'CityOrArea') {
      headers = ['City Name', 'HQ', 'State', 'Area Type'];
      filename = 'city_upload_format.xlsx';
    } else if (uploadType === 'Route') {
      headers = ['From City', 'To City', 'HQ', 'State', 'Distance', 'Area Type'];
      filename = 'route_upload_format.xlsx';
    }

    const ws = utils.aoa_to_sheet([headers]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, filename);
  };

  const handleUpload = async () => {
    if (!uploadFile) return alert('Please select an Excel file.');
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', uploadType);
    
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert('Upload successful! Saved ' + res.data.count + ' records.');
      } else {
        alert('Upload failed: ' + res.data.message);
      }
    } catch (e: any) {
      alert('Error uploading file: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-sky-400 mb-3 tracking-wider uppercase flex items-center gap-1.5">
          <UploadCloud size={14} /> Upload Locations
        </h2>
        
        <p className="text-xs text-slate-400 mb-4 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          The UID is a system-generated unique identifier assigned to each entity (e.g. STE1, HQS1, CTY1, RTE1). These UIDs are automatically created by the system upon upload.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Select Type *</label>
            <select 
              value={uploadType} 
              onChange={e => setUploadType(e.target.value)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="State">State</option>
              <option value="Headquarter">Headquarter</option>
              <option value="CityOrArea">City / Area</option>
              <option value="Route">Route</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Upload Excel *</label>
            <input 
              type="file" 
              accept=".xlsx,.csv" 
              onChange={e => setUploadFile(e.target.files?.[0] || null)} 
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30" 
            />
          </div>
        </div>
        
        <div className="mt-5 flex justify-between items-center pt-4 border-t border-slate-700/60">
          <button 
            onClick={handleUpload} 
            disabled={loading} 
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Data'}
          </button>
          <button 
            onClick={handleDownloadFormat} 
            className="text-emerald-400 font-semibold text-xs hover:underline border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            Download Format
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Export Layout
// -------------------------------------------------------------

export default function ManageLocations() {
  const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route' | 'upload'>('city');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'state', label: 'Create State', icon: Map },
    { id: 'hq', label: 'Create Headquarters', icon: Building2 },
    { id: 'city', label: 'Create City / Area', icon: MapPin },
    { id: 'route', label: 'Create Route', icon: Route },
    { id: 'upload', label: 'Upload Locations', icon: UploadCloud },
  ] as const;

  return (
    <div className="h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
          <ArrowLeft size={18} /> <span className="font-bold text-sm tracking-wide uppercase">Back to Admin Menu</span>
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Menu */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-slate-800/60 border-r border-slate-800 flex flex-col py-3 overflow-y-auto transition-all duration-200 flex-shrink-0`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3.5'} mb-2.5`}>
            {!sidebarCollapsed && (
              <h2 className="text-emerald-400 font-black text-xs tracking-wider uppercase truncate">
                Area Creation
              </h2>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu to Free Space"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <div className="flex flex-col space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-xs font-medium ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'text-left'
                  } ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right Content Area */}
        <div className="flex-1 min-w-0 bg-slate-900 p-4 md:p-5 overflow-y-auto">
          {activeTab === 'state' && <StateTab />}
          {activeTab === 'hq' && <HQTab />}
          {activeTab === 'city' && <CityTab />}
          {activeTab === 'route' && <RouteTab />}
          {activeTab === 'upload' && <UploadLocationTab />}
        </div>
      </div>
    </div>
  );
}
