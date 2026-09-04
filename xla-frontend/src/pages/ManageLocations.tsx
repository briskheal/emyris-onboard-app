import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Edit, Save, X } from 'lucide-react';
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
    <div className="p-4 border-t border-slate-700 bg-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex gap-2">
        <button 
          onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 text-sm font-bold"
        >
          &lt; Prev
        </button>
        <span className="px-4 py-2 text-slate-300 text-sm font-bold">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 text-sm font-bold"
        >
          Next &gt;
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleExport} className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Export
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-bold">Show</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-slate-700 border border-slate-600 text-white rounded p-1 text-sm outline-none"
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

  const paginatedStates = states.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">CREATE STATE</h2>
      
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12">
        <div className="flex-1 min-w-0">
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
                  
                  {editId === s._id ? (
                    <td className="border-r border-slate-700 p-3">
                      <input type="text" value={editData.stateName} onChange={e => setEditData({...editData, stateName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                    </td>
                  ) : (
                    <td className="border-r border-slate-700 p-5 text-white font-bold">{s.stateName}</td>
                  )}
                  
                  <td className="border-r border-slate-700 p-5 text-slate-300">{s.uid || '-'}</td>
                  
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    {editId === s._id ? (
                      <>
                        <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg"><Save size={20} /></button>
                        <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg"><X size={20} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg"><Edit size={20} /></button>
                        <button onClick={() => handleDelete(s._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                      </>
                    )}
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

  const paginatedHqs = hqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">CREATE HEADQUARTERS</h2>
      
      <form onSubmit={handleAdd} className="flex flex-wrap gap-6 items-end mb-12">
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT STATE *</label>
          <select required value={stateName} onChange={e => setStateName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">HQ NAME *</label>
          <input type="text" required value={hqName} onChange={e => setHqName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Headquarter Name" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add HQ'}
        </button>
      </form>
      
      <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wider uppercase">SHOWING ({hqs.length}) HEADQUARTERS</h3>
      
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
                  
                  {editId === h._id ? (
                    <>
                      <td className="border-r border-slate-700 p-3">
                        <input type="text" value={editData.hqName} onChange={e => setEditData({...editData, hqName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                      </td>
                      <td className="border-r border-slate-700 p-5 text-slate-300">{h.uid || '-'}</td>
                      <td className="border-r border-slate-700 p-3">
                        <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                          <option value="">Select State</option>
                          {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-r border-slate-700 p-5 text-white font-bold">{h.hqName}</td>
                      <td className="border-r border-slate-700 p-5 text-slate-300">{h.uid || '-'}</td>
                      <td className="border-r border-slate-700 p-5 text-slate-300">{h.state}</td>
                    </>
                  )}
                  
                  <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                    {editId === h._id ? (
                      <>
                        <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg"><Save size={20} /></button>
                        <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg"><X size={20} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(h)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg"><Edit size={20} /></button>
                        <button onClick={() => handleDelete(h._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {hqs.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No HQs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableFooter data={hqs} fileName="HQs" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">CREATE CITY / AREA</h2>
      
      <form onSubmit={handleAdd} className="flex flex-wrap gap-6 items-end mb-12">
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">TYPE *</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="City">City</option><option value="Local Area">Local Area</option>
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT STATE *</label>
          <select required value={stateName} onChange={e => { setStateName(e.target.value); setHqName(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">SELECT HQ *</label>
          <select required value={hqName} onChange={e => setHqName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select HQ</option>
            {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block">CITY / AREA NAME *</label>
          <input type="text" required value={cityName} onChange={e => setCityName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Name" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-400 tracking-wider uppercase">SHOWING ({searchedCities.length}) CITIES</h3>
        <input 
          type="text" 
          placeholder="Search City, HQ, or State..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-sky-500 w-72"
        />
      </div>
      
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
              {paginatedCities.map((c, i) => {
                const isEditing = editId === c._id;
                const activeEditState = isEditing ? editData.state : c.state;
                const dynamicHqs = hqs.filter(h => h.state === activeEditState);

                return (
                  <tr key={c._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                    
                    {isEditing ? (
                      <td className="border-r border-slate-700 p-3">
                        <div className="flex gap-2">
                          <input type="text" value={editData.cityName} onChange={e => setEditData({...editData, cityName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" />
                          <select value={editData.areaType} onChange={e => setEditData({...editData, areaType: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs w-28">
                            <option value="City">City</option>
                            <option value="Local Area">Local Area</option>
                          </select>
                        </div>
                      </td>
                    ) : (
                      <td className="border-r border-slate-700 p-5 text-white font-bold">
                        {c.cityName}
                        <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-normal">{c.areaType}</span>
                      </td>
                    )}
                    
                    <td className="border-r border-slate-700 p-5 text-slate-300">{c.uid || '-'}</td>
                    
                    {isEditing ? (
                      <>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.hq} onChange={e => setEditData({...editData, hq: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select HQ</option>
                            {dynamicHqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value, hq: ''})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select State</option>
                            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{c.hq}</td>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{c.state}</td>
                      </>
                    )}
                    
                    <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg"><Save size={20} /></button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg"><X size={20} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(c)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg"><Edit size={20} /></button>
                          <button onClick={() => handleDelete(c._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cities.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No cities found.</td></tr>
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
    if (!distance) return alert('Enter distance');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/routes', { state: stateName, hq: hqName, fromCity, toCity, distance, areaType });
      if (res.data.success) {
        setFromCity(''); setToCity(''); setDistance(''); setAreaType(''); fetchData();
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
    <div className="max-w-6xl">
      <h2 className="text-lg font-bold text-white mb-4 tracking-wide uppercase">CREATE ROUTE</h2>
      <div className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-8 font-bold text-sm">
        Note: If the distance of a route is edited, the updated distance will not be reflected in the tour programs. However, the new distance will be applied to newly created tour programs.
      </div>
      
      <form onSubmit={handleAdd} className="flex flex-wrap gap-6 items-end mb-12">
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">SELECT STATE *</label>
          <select required value={stateName} onChange={e => { setStateName(e.target.value); setHqName(''); setFromCity(''); setToCity(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">SELECT HQ *</label>
          <select required value={hqName} onChange={e => { setHqName(e.target.value); setFromCity(''); setToCity(''); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select Headquarter</option>
            {filteredHqs.map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">FROM CITY *</label>
          <select required value={fromCity} onChange={e => setFromCity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select From City</option>
            {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">TO CITY *</label>
          <select required value={toCity} onChange={e => setToCity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select To City</option>
            {filteredCities.map(c => <option key={c._id} value={c.cityName}>{c.cityName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0 min-w-[200px]">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">SELECT AREA TYPE *</label>
          <select required value={areaType} onChange={e => setAreaType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select Area Type</option>
            <option value="Local">Local</option><option value="Ex-Station">Ex-Station</option><option value="Out-Station">Out-Station</option>
          </select>
        </div>
        <div className="w-48">
          <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">ENTER DISTANCE (ONE SIDE) *</label>
          <input type="number" required value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">
          {loading ? 'Adding...' : 'Add Route'}
        </button>
      </form>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-400 tracking-wider uppercase">SHOWING ({searchedRoutes.length}) ROUTES</h3>
        <input 
          type="text" 
          placeholder="Search HQ or City..." 
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-sky-500 w-72"
        />
      </div>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700/50 text-slate-300">
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Area Type</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">From City</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">To City</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">HQ</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">State</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Distance</th>
                <th className="border-r border-slate-700 p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
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
                    <td className="border-r border-slate-700 p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                    
                    {isEditing ? (
                      <>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.areaType} onChange={e => setEditData({...editData, areaType: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select</option>
                            <option value="Local">Local</option><option value="Ex-Station">Ex-Station</option><option value="Out-Station">Out-Station</option>
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.fromCity} onChange={e => setEditData({...editData, fromCity: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select From</option>
                            {dynamicCities.map((c: any) => <option key={`f_${c._id}`} value={c.cityName}>{c.cityName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.toCity} onChange={e => setEditData({...editData, toCity: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select To</option>
                            {dynamicCities.map((c: any) => <option key={`t_${c._id}`} value={c.cityName}>{c.cityName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.hq} onChange={e => setEditData({...editData, hq: e.target.value, fromCity: '', toCity: ''})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select HQ</option>
                            {dynamicHqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <select value={editData.state} onChange={e => setEditData({...editData, state: e.target.value, hq: '', fromCity: '', toCity: ''})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                            <option value="">Select State</option>
                            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-slate-700 p-3">
                          <input type="number" value={editData.distance} onChange={e => setEditData({...editData, distance: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{r.areaType || '-'}</td>
                        <td className="border-r border-slate-700 p-5 text-white font-bold">{r.fromCity}</td>
                        <td className="border-r border-slate-700 p-5 text-white font-bold">{r.toCity}</td>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{r.hq || '-'}</td>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{r.state || '-'}</td>
                        <td className="border-r border-slate-700 p-5 text-slate-300">{r.distance}</td>
                      </>
                    )}
                    
                    <td className="border-r border-slate-700 p-5 text-center flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg"><Save size={20} /></button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300 transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-lg"><X size={20} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(r)} className="text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 hover:bg-sky-500/20 p-2 rounded-lg"><Edit size={20} /></button>
                          <button onClick={() => handleDelete(r._id)} className="text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {routes.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold">No routes found.</td></tr>
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
// Main Export Layout
// -------------------------------------------------------------

export default function ManageLocations() {
  const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route'>('city');
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-900 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
      </div>
      
      <div className="w-full flex h-full relative z-10 backdrop-blur-sm">
        {/* Left Sidebar Menu */}
        <div className="w-64 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col backdrop-blur-xl">
          <div className="p-8 border-b border-slate-800">
            <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2 mb-8">
              <ArrowLeft size={18} /> <span className="font-black text-xs tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>
            </button>
            <h2 className="text-white font-black text-sm tracking-widest uppercase">AREA CREATION</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
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
        <div className="flex-1 min-w-0 bg-slate-900 p-8 overflow-y-auto">
          {activeTab === 'state' && <StateTab />}
          {activeTab === 'hq' && <HQTab />}
          {activeTab === 'city' && <CityTab />}
          {activeTab === 'route' && <RouteTab />}
        </div>
      </div>
    </div>
  );
}
