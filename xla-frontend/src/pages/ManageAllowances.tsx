import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManageAllowances() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'travel' | 'outstation' | 'rates'>('travel');
  
  // States for dropdowns
  const [states, setStates] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Data lists
  const [travelAllowances, setTravelAllowances] = useState<any[]>([]);
  const [outStationAllowances, setOutStationAllowances] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [travelRows, setTravelRows] = useState(10);
  const [travelPage, setTravelPage] = useState(1);
  const [outStationRows, setOutStationRows] = useState(10);
  const [outStationPage, setOutStationPage] = useState(1);
  const [ratesRows, setRatesRows] = useState(10);
  const [ratesPage, setRatesPage] = useState(1);

  useEffect(() => {
    fetchDropdownData();
    fetchAllowances();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [stRes, desRes, usrRes, routesRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/designations'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/locations/routes') // for user routes matching Ex-Station logic
      ]);
      if (stRes.data.success) setStates(stRes.data.states);
      if (desRes.data.success) setDesignations(desRes.data.designations);
      if (usrRes.data.success) setUsers(usrRes.data.users);
      if (routesRes.data.success) setRoutes(routesRes.data.routes);
    } catch (e) { console.error(e); }
  };

  const fetchAllowances = async () => {
    try {
      const [tRes, oRes] = await Promise.all([
        axios.get('/api/admin/allowances/travel'),
        axios.get('/api/admin/allowances/outstation')
      ]);
      if (tRes.data.success) setTravelAllowances(tRes.data.allowances);
      if (oRes.data.success) setOutStationAllowances(oRes.data.allowances);
    } catch (e) { console.error(e); }
  };

  // --- TRAVEL ALLOWANCE TAB ---
  const TravelTab = () => {
    const [formData, setFormData] = useState({ state: '', designation: '', fromDistance: '', toDistance: '', allowancePerKm: '' });

    const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/allowances/travel', formData);
        if (res.data.success) {
          setFormData({ state: '', designation: '', fromDistance: '', toDistance: '', allowancePerKm: '' });
          fetchAllowances();
        } else alert(res.data.message);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
      if (!window.confirm("Delete this allowance?")) return;
      try {
        await axios.delete(`/api/admin/allowances/travel/${id}`);
        fetchAllowances();
      } catch (e) { console.error(e); }
    };

    const totalPages = Math.ceil(travelAllowances.length / travelRows);
    const displayedData = travelAllowances.slice((travelPage - 1) * travelRows, travelPage * travelRows);

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">SET ALLOWANCES</h2>
        
        <form onSubmit={handleAdd} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT STATE *</label><select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select State</option>{states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT DESIGNATION *</label><select required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Designation</option>{designations.map(d => <option key={d._id} value={d.designationName}>{d.designationName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">FROM DISTANCE *</label><input required type="number" value={formData.fromDistance} onChange={e => setFormData({...formData, fromDistance: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Distance" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">TO DISTANCE *</label><input required type="number" value={formData.toDistance} onChange={e => setFormData({...formData, toDistance: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Distance" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">TRAVEL ALLOWANCE (PER KM) *</label><input required type="number" step="0.01" value={formData.allowancePerKm} onChange={e => setFormData({...formData, allowancePerKm: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter TA" /></div>
          </div>
          <div><button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Set Allowance</button></div>
        </form>

        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50"><h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">PRESENT ALLOWANCES</h3></div>
          <div className="overflow-y-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase">
                  <th className="border-r border-slate-700 p-4 font-bold">Sr no.</th>
                  <th className="border-r border-slate-700 p-4 font-bold">State</th>
                  <th className="border-r border-slate-700 p-4 font-bold">Designation</th>
                  <th className="border-r border-slate-700 p-4 font-bold">From Distance</th>
                  <th className="border-r border-slate-700 p-4 font-bold">To Distance</th>
                  <th className="border-r border-slate-700 p-4 font-bold">Travel Allowance</th>
                  <th className="border-r border-slate-700 p-4 font-bold text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No data found</td></tr>
                ) : displayedData.map((a, i) => (
                  <tr key={a._id} className="border-b border-slate-700/50 border-b border-slate-700/50 hover:bg-slate-700/20 text-white">
                    <td className="border-r border-slate-700 p-4">{(travelPage - 1) * travelRows + i + 1}</td>
                    <td className="border-r border-slate-700 p-4">{a.state}</td>
                    <td className="border-r border-slate-700 p-4">{a.designation}</td>
                    <td className="border-r border-slate-700 p-4">{a.fromDistance}</td>
                    <td className="border-r border-slate-700 p-4">{a.toDistance}</td>
                    <td className="border-r border-slate-700 p-4">{a.allowancePerKm}</td>
                    <td className="border-r border-slate-700 p-4 text-center"><button onClick={() => handleDelete(a._id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400 bg-slate-800/50">
            <div>Page {travelPage} of {totalPages || 1}</div>
            <div className="flex gap-4 items-center">
              <button disabled={travelPage === 1} onClick={() => setTravelPage(p => p - 1)} className="hover:text-white disabled:opacity-50">Prev</button>
              <button disabled={travelPage >= totalPages} onClick={() => setTravelPage(p => p + 1)} className="hover:text-white disabled:opacity-50">Next</button>
            </div>
            <div className="flex gap-4 items-center">
              <button onClick={() => {/* Export Logic */}} className="hover:text-white border border-slate-600 px-3 py-1 rounded">Export</button>
              <select value={travelRows} onChange={(e) => { setTravelRows(Number(e.target.value)); setTravelPage(1); }} className="bg-slate-900 border border-slate-600 rounded px-2 py-1">
                <option value={10}>Show 10</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- OUT STATION ALLOWANCE TAB ---
  const OutStationTab = () => {
    const [formData, setFormData] = useState({ state: '', designation: '', category: '', amount: '' });

    const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/allowances/outstation', formData);
        if (res.data.success) {
          setFormData({ state: '', designation: '', category: '', amount: '' });
          fetchAllowances();
        } else alert(res.data.message);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
      if (!window.confirm("Delete this allowance?")) return;
      try {
        await axios.delete(`/api/admin/allowances/outstation/${id}`);
        fetchAllowances();
      } catch (e) { console.error(e); }
    };

    const totalPages = Math.ceil(outStationAllowances.length / outStationRows);
    const displayedData = outStationAllowances.slice((outStationPage - 1) * outStationRows, outStationPage * outStationRows);

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">OUT-STATION ALLOWANCES</h2>
        
        <form onSubmit={handleAdd} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT STATE *</label><select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select State</option>{states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT DESIGNATION *</label><select required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Designation</option>{designations.map(d => <option key={d._id} value={d.designationName}>{d.designationName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CATEGORY *</label><select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Category</option><option value="Hotel">Hotel</option><option value="Food">Food</option></select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">AMOUNT *</label><input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="0" /></div>
          </div>
          <div><button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Set Allowance</button></div>
        </form>

        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50"><h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">PRESENT ALLOWANCES</h3></div>
          <div className="overflow-y-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase">
                  <th className="border-r border-slate-700 p-4 font-bold">Sr no.</th>
                  <th className="border-r border-slate-700 p-4 font-bold">State</th>
                  <th className="border-r border-slate-700 p-4 font-bold">Designation</th>
                  <th className="border-r border-slate-700 p-4 font-bold">Category</th>
                  <th className="border-r border-slate-700 p-4 font-bold">Amount</th>
                  <th className="border-r border-slate-700 p-4 font-bold text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No data found</td></tr>
                ) : displayedData.map((a, i) => (
                  <tr key={a._id} className="border-b border-slate-700/50 border-b border-slate-700/50 hover:bg-slate-700/20 text-white">
                    <td className="border-r border-slate-700 p-4">{(outStationPage - 1) * outStationRows + i + 1}</td>
                    <td className="border-r border-slate-700 p-4">{a.state}</td>
                    <td className="border-r border-slate-700 p-4">{a.designation}</td>
                    <td className="border-r border-slate-700 p-4">{a.category}</td>
                    <td className="border-r border-slate-700 p-4">{a.amount}</td>
                    <td className="border-r border-slate-700 p-4 text-center"><button onClick={() => handleDelete(a._id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400 bg-slate-800/50">
            <div>Page {outStationPage} of {totalPages || 1}</div>
            <div className="flex gap-4 items-center">
              <button disabled={outStationPage === 1} onClick={() => setOutStationPage(p => p - 1)} className="hover:text-white disabled:opacity-50">Prev</button>
              <button disabled={outStationPage >= totalPages} onClick={() => setOutStationPage(p => p + 1)} className="hover:text-white disabled:opacity-50">Next</button>
            </div>
            <div className="flex gap-4 items-center">
              <button onClick={() => {/* Export Logic */}} className="hover:text-white border border-slate-600 px-3 py-1 rounded">Export</button>
              <select value={outStationRows} onChange={(e) => { setOutStationRows(Number(e.target.value)); setOutStationPage(1); }} className="bg-slate-900 border border-slate-600 rounded px-2 py-1">
                <option value={10}>Show 10</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- TOTAL RATES TAB ---
  const RatesTab = () => {
    const [selectedUser, setSelectedUser] = useState('');
    
    const userObj = users.find(u => u._id === selectedUser);
    const userDesigObj = userObj ? designations.find(d => d.designationName === userObj.designation) : null;
    
    // We infer Ex-Station travel rates based on routes assigned to this user's HQ
    const userRoutes = routes.filter(r => userObj && r.hqName === userObj.hq);
    
    const rateData = userRoutes.map(r => {
        // Find matching travel allowance rule based on user's designation and route distance
        const distance = r.distance || 0;
        const matchingRule = travelAllowances.find(ta => 
            ta.designation === userObj?.designation &&
            distance >= ta.fromDistance && distance <= ta.toDistance
        );
        const allowance = matchingRule ? (distance * matchingRule.allowancePerKm).toFixed(2) : '0.00';
        return { ...r, calculatedAllowance: allowance };
    });

    const totalPages = Math.ceil(rateData.length / ratesRows);
    const displayedData = rateData.slice((ratesPage - 1) * ratesRows, ratesPage * ratesRows);

    return (
      <div className="flex-1 overflow-auto p-8 relative z-10">
        <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">TOTAL RATES</h2>
        
        <div className="mb-10 w-full md:w-1/3">
          <label className="text-xs text-slate-400 font-bold mb-1 block">SELECT USER *</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
            <option value="">Select User</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.designation})</option>)}
          </select>
        </div>

        {selectedUser && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                <div className="text-sm text-slate-400 font-bold mb-2">DA</div>
                <div className="text-3xl font-black text-white">{userDesigObj?.dailyAllowance || 0}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                <div className="text-sm text-slate-400 font-bold mb-2">Ex-station DA</div>
                <div className="text-3xl font-black text-white">{userDesigObj?.exStationAllowance || 0}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                <div className="text-sm text-slate-400 font-bold mb-2">Out-Station DA</div>
                <div className="text-3xl font-black text-white">{userDesigObj?.outStationAllowance || 0}</div>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
              <div className="overflow-y-auto max-h-[50vh]">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                    <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase">
                      <th className="border-r border-slate-700 p-4 font-bold">Sr no.</th>
                      <th className="border-r border-slate-700 p-4 font-bold">Ex-Station</th>
                      <th className="border-r border-slate-700 p-4 font-bold">Distance</th>
                      <th className="border-r border-slate-700 p-4 font-bold">Travel Allowance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data found</td></tr>
                    ) : displayedData.map((r, i) => (
                      <tr key={r._id} className="border-b border-slate-700/50 border-b border-slate-700/50 hover:bg-slate-700/20 text-white">
                        <td className="border-r border-slate-700 p-4">{(ratesPage - 1) * ratesRows + i + 1}</td>
                        <td className="border-r border-slate-700 p-4">{r.routeName}</td>
                        <td className="border-r border-slate-700 p-4">{r.distance}</td>
                        <td className="border-r border-slate-700 p-4">{r.calculatedAllowance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400 bg-slate-800/50">
                <div>Page {ratesPage} of {totalPages || 1}</div>
                <div className="flex gap-4 items-center">
                  <button disabled={ratesPage === 1} onClick={() => setRatesPage(p => p - 1)} className="hover:text-white disabled:opacity-50">Prev</button>
                  <button disabled={ratesPage >= totalPages} onClick={() => setRatesPage(p => p + 1)} className="hover:text-white disabled:opacity-50">Next</button>
                </div>
                <div className="flex gap-4 items-center">
                  <button onClick={() => {/* Export Logic */}} className="hover:text-white border border-slate-600 px-3 py-1 rounded">Export</button>
                  <select value={ratesRows} onChange={(e) => { setRatesRows(Number(e.target.value)); setRatesPage(1); }} className="bg-slate-900 border border-slate-600 rounded px-2 py-1">
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
      </div>
      
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl">
        <div className="p-8 border-b border-slate-800 flex flex-col gap-4">
          <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
            <ArrowLeft size={18} /> <span className="font-black text-xs tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>
          </button>
          <h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE EXPENSES</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4 text-sm font-bold tracking-wider">
            <li>
              <button onClick={() => setActiveTab('travel')} className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'travel' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                TRAVEL ALLOWANCE
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('outstation')} className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'outstation' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                OUT STATION ALLOWANCE
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('rates')} className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'rates' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                RATES
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Main Content Area */}
      {activeTab === 'travel' && <TravelTab />}
      {activeTab === 'outstation' && <OutStationTab />}
      {activeTab === 'rates' && <RatesTab />}
    </div>
  );
}
