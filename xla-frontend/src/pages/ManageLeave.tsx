import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Plus, X, Menu, Eye, EyeOff, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function CreateLeaveTypeTab() {
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', isPaid: true });
  
  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/xl/leave-types');
      if (res.data.success) setTypes(res.data.data);
    } catch (e) {}
  };
  useEffect(() => { fetchTypes(); }, []);

  const handleSave = async () => {
    if(!formData.name || !formData.code) return alert("Name and Code required");
    try {
      await axios.post('/api/xl/leave-types', formData);
      alert("Added");
      fetchTypes();
      setFormData({ name: '', code: '', description: '', isPaid: true });
    } catch (e) {}
  };
  const handleDelete = async (id: string) => {
    if(!window.confirm("Delete?")) return;
    try {
      await axios.delete(`/api/xl/leave-types/${id}`);
      fetchTypes();
    } catch(e) {}
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-slate-700 pb-2">Create Leave Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">ENTER LEAVE TYPE *</label>
          <input type="text" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">ENTER CODE *</label>
          <input type="text" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.code} onChange={e=>setFormData({...formData, code:e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-400 mb-1 block">ENTER DESCRIPTION</label>
          <input type="text" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={formData.isPaid} onChange={e=>setFormData({...formData, isPaid:e.target.checked})} className="w-5 h-5 accent-sky-500" />
          <span className="text-sm font-bold text-slate-300">PAID LEAVE</span>
        </div>
        <div className="flex justify-end md:col-span-2">
          <button onClick={handleSave} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg active:scale-95 transition-transform">Add Leave Type</button>
        </div>
      </div>
      <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase">Showing ({types.length}) Entries</h3>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3 text-xs text-sky-400">Sr no.</th>
              <th className="p-3 text-xs text-sky-400">Leave Types</th>
              <th className="p-3 text-xs text-sky-400">Code</th>
              <th className="p-3 text-xs text-sky-400">Status</th>
              <th className="p-3 text-xs text-sky-400">Description</th>
              <th className="p-3 text-xs text-sky-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t:any, i) => (
              <tr key={t._id} className="border-b border-slate-700/50">
                <td className="p-3 text-sm text-slate-300">{i+1}</td>
                <td className="p-3 text-sm text-slate-300">{t.name}</td>
                <td className="p-3 text-sm text-slate-300">{t.code}</td>
                <td className="p-3 text-sm text-slate-300">{t.isPaid ? 'Paid' : 'Unpaid'}</td>
                <td className="p-3 text-sm text-slate-300 truncate max-w-xs">{t.description}</td>
                <td className="p-3 text-sm text-slate-300"><button onClick={()=>handleDelete(t._id)}><Trash2 size={16} className="text-rose-400 hover:text-rose-300"/></button></td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No Leave Types Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssignLeaveTab({ users }: { users: any[] }) {
  const [types, setTypes] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [formData, setFormData] = useState({ year: '2026-2027', employeeId: '', leaveType: '', count: '', used: '' });
  
  const fetchAssigned = async () => {
    if(!formData.employeeId) { setAssigned([]); return; }
    try {
      const res = await axios.get('/api/xl/assigned-leaves/my?employeeId=' + formData.employeeId + '&year=' + formData.year);
      setAssigned(res.data.data||[]);
    } catch(e){}
  };

  useEffect(() => {
    axios.get('/api/xl/leave-types').then(res => setTypes(res.data.data||[]));
  }, []);
  
  useEffect(() => {
    fetchAssigned();
  }, [formData.employeeId, formData.year]);

  const handleAssign = async () => {
    if(!formData.employeeId || !formData.leaveType || !formData.count) return alert("Fill all fields");
    try {
      await axios.post('/api/xl/assign-leave', formData);
      alert("Leave successfully assigned!");
      setFormData({...formData, count: '', used: ''});
    } catch(e) {
      alert("Error assigning leave");
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-slate-700 pb-2">Assign Leave</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT YEAR *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.year} onChange={e=>setFormData({...formData, year:e.target.value})}>
            <option>2026-2027</option>
            <option>2027-2028</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT EMPLOYEE *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId:e.target.value})}>
            <option value="">Select Employee</option>
            {users.map((u:any) => <option key={u.uid} value={u.uid}>{u.firstName} {u.lastName} ({u.designation || u.designationName})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT LEAVE TYPE *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.leaveType} onChange={e=>setFormData({...formData, leaveType:e.target.value})}>
            <option value="">Select Leave Type</option>
            {types.map((t:any) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">ENTER NUMBER OF LEAVES *</label>
          <input type="text" inputMode="numeric" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.count} onChange={e=>setFormData({...formData, count:e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">ENTER USED LEAVES (Optional)</label>
          <input type="text" inputMode="numeric" placeholder="e.g. 2" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.used} onChange={e=>setFormData({...formData, used:e.target.value})} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <button onClick={async () => { await handleAssign(); await fetchAssigned(); }} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg active:scale-95 transition-transform">Assign Leave</button>
        </div>
      </div>

      {formData.employeeId && (
        <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Showing ({assigned.length}) Entries</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-3 text-xs text-sky-400">Sr no.</th>
                  <th className="p-3 text-xs text-sky-400 cursor-pointer">Year</th>
                  <th className="p-3 text-xs text-sky-400 cursor-pointer">Leave Types</th>
                  <th className="p-3 text-xs text-sky-400">Assigned Leaves</th>
                  <th className="p-3 text-xs text-sky-400">Used Leaves</th>
                  <th className="p-3 text-xs text-sky-400">Remaining Leaves</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((a:any, i) => (
                  <tr key={a._id} className="border-b border-slate-700/50">
                    <td className="p-3 text-sm text-slate-300 font-bold">{i+1}</td>
                    <td className="p-3 text-sm text-slate-300 font-bold">{a.year}</td>
                    <td className="p-3 text-sm text-slate-300">{a.leaveType}</td>
                    <td className="p-3 text-sm text-slate-300">{a.assigned}</td>
                    <td className="p-3 text-sm text-slate-300">{a.used}</td>
                    <td className="p-3 text-sm text-emerald-400 font-bold">{a.assigned - a.used}</td>
                  </tr>
                ))}
                {assigned.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No Leaves Assigned</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignedLeavesTab({ users }: { users: any[] }) {
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState('2026-2027');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [editItem, setEditItem] = useState<any>(null);
  const [editValue, setEditValue] = useState('');

  const fetchData = async () => {
    const res = await axios.get('/api/xl/assigned-leaves?year=' + year);
    setData(res.data.data || []);
  };
  
  useEffect(() => {
    fetchData();
  }, [year]);

  // Group data by employeeId
  const grouped = data.reduce((acc:any, curr:any) => {
    if (!acc[curr.employeeId]) acc[curr.employeeId] = [];
    acc[curr.employeeId].push(curr);
    return acc;
  }, {});

  const handleEditSave = async () => {
    if(!editItem) return;
    try {
      await axios.put('/api/xl/assign-leave/' + editItem._id, { assigned: editValue });
      setEditItem(null);
      fetchData();
    } catch(e) {
      alert('Error updating leave');
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Employee Name,Leave Type,Assigned Leaves,Used Leaves,Remaining Leaves\n";
    
    const rows: string[] = [];
    data.forEach((d:any) => {
      const u = users.find((usr:any) => usr.uid === d.employeeId);
      const empId = u?.employeeId || d.employeeId;
      const empName = u ? `${u.firstName} ${u.lastName || ''}` : 'Unknown';
      const remaining = (d.leaveType === 'Leave Without Pay' || d.leaveType === 'LWP') ? 0 : (d.assigned - d.used);
      
      const row = [
        `"${empId}"`,
        `"${empName}"`,
        `"${d.leaveType}"`,
        d.assigned,
        d.used,
        remaining
      ].join(",");
      rows.push(row);
    });
    
    csvContent += rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leave_Status_Report_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col relative">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Assigned Leaves</h2>
        <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors flex items-center gap-2">
          Export to CSV
        </button>
      </div>
      <div className="mb-4">
        <select className="bg-slate-800 text-white p-2 rounded-lg border border-slate-700 w-48" value={year} onChange={e=>setYear(e.target.value)}>
          <option>2026-2027</option>
          <option>2027-2028</option>
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
        <div className="p-4 border-b border-slate-700 bg-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Showing ({Object.keys(grouped).length}) Entries</h3>
        </div>
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3 text-xs text-sky-400">Sr no.</th>
              <th className="p-3 text-xs text-sky-400">Employee Name</th>
              <th className="p-3 text-xs text-sky-400">Assigned Leaves</th>
              <th className="p-3 text-xs text-sky-400">Used Leaves</th>
              <th className="p-3 text-xs text-sky-400">Remaining Leaves</th>
              <th className="p-3 text-xs text-sky-400 text-center">View</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped).map((empId, index) => {
              const items = grouped[empId];
              const user = users.find(u => u.uid === empId);
              const name = user ? `${user.firstName} ${user.lastName || ''}` : 'Unknown';
              
              // Calculate totals (excluding Leave Without Pay for standard totals, matching legacy video logic if needed, but for now we just sum)
              let assignedTotal = 0;
              let paidUsed = 0;
              let lwpUsed = 0;
              let remainingTotal = 0;
              
              items.forEach((item:any) => {
                if (item.leaveType === 'Leave Without Pay' || item.leaveType === 'LWP') {
                  lwpUsed += item.used;
                } else {
                  assignedTotal += item.assigned;
                  paidUsed += item.used;
                  remainingTotal += (item.assigned - item.used);
                }
              });
              
              const usedStr = lwpUsed > 0 ? `${paidUsed} + ${lwpUsed} LWP` : `${paidUsed}`;
              const isExpanded = expandedRow === empId;

              return (
                <React.Fragment key={empId}>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 text-sm text-slate-300 font-bold">{index + 1}</td>
                    <td className="p-3 text-sm text-slate-200">{name}</td>
                    <td className="p-3 text-sm text-slate-300">{assignedTotal}</td>
                    <td className="p-3 text-sm text-slate-300">{usedStr}</td>
                    <td className="p-3 text-sm text-slate-300">{remainingTotal}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => setExpandedRow(isExpanded ? null : empId)} className="text-slate-400 hover:text-sky-400 transition-colors">
                        {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={6} className="p-4 border-b border-slate-700">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                           <div className="p-3 border-b border-slate-700 bg-slate-700/50">
                             <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Showing ({items.length}) Entries</h4>
                           </div>
                           <table className="w-full text-left">
                             <thead className="bg-slate-700/30">
                               <tr>
                                 <th className="p-2 pl-4 text-[10px] text-slate-400 uppercase">Sr no.</th>
                                 <th className="p-2 text-[10px] text-slate-400 uppercase">Leave Types</th>
                                 <th className="p-2 text-[10px] text-slate-400 uppercase">Assigned Leaves</th>
                                 <th className="p-2 text-[10px] text-slate-400 uppercase">Used Leaves</th>
                                 <th className="p-2 pr-4 text-[10px] text-slate-400 uppercase">Remaining Leaves</th>
                               </tr>
                             </thead>
                             <tbody>
                               {items.map((it:any, idx:number) => (
                                 <tr key={it._id} className="border-t border-slate-700/30 hover:bg-slate-700/20">
                                   <td className="p-2 pl-4 text-xs text-slate-300">{idx+1}</td>
                                   <td className="p-2 text-xs text-slate-200">{it.leaveType}</td>
                                   <td className="p-2 text-xs text-slate-200">
                                     {it.leaveType === 'Leave Without Pay' || it.leaveType === 'LWP' ? '-' : (
                                        <div className="flex items-center gap-2">
                                          <span>{it.assigned}</span>
                                          <button onClick={() => { setEditItem({ ...it, user: name }); setEditValue(it.assigned); }} className="text-sky-400 hover:text-sky-300"><Edit2 size={12} /></button>
                                        </div>
                                     )}
                                   </td>
                                   <td className="p-2 text-xs text-slate-300">{it.used}</td>
                                   <td className="p-2 pr-4 text-xs text-slate-300">
                                     {it.leaveType === 'Leave Without Pay' || it.leaveType === 'LWP' ? '-' : (it.assigned - it.used)}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {Object.keys(grouped).length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No Leave Data Found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl w-full max-w-md relative">
            <button onClick={() => setEditItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Editing Assigned Leave</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">User</label>
                <div className="text-sm font-bold text-slate-200">{editItem.user}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Leave Type</label>
                <div className="text-sm font-bold text-slate-200">{editItem.leaveType}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-sky-400 uppercase">New Leave Allocation *</label>
                <input type="text" inputMode="numeric" value={editValue} onChange={e => setEditValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-sky-500 focus:outline-none" />
              </div>
            </div>
            
            <button onClick={handleEditSave} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function CreateLeaveTemplateTab() {
  const [templates, setTemplates] = useState([]);
  const [types, setTypes] = useState([]);
  
  const [formData, setFormData] = useState({ name: '', description: '', payload: [] as any[] });
  const [curType, setCurType] = useState('');
  const [curCount, setCurCount] = useState('');

  const fetchT = async () => {
    try {
      const res = await axios.get('/api/xl/leave-templates');
      if (res.data.success) setTemplates(res.data.data);
    } catch(e){}
  };
  useEffect(() => {
    fetchT();
    axios.get('/api/xl/leave-types').then(res => setTypes(res.data.data||[]));
  }, []);

  const addType = () => {
    if(!curType || !curCount) return;
    setFormData({...formData, payload: [...formData.payload, { leaveType: curType, count: curCount }]});
    setCurType(''); setCurCount('');
  };

  const handleSave = async () => {
    if(!formData.name || formData.payload.length === 0) return alert("Name and at least one leave type required");
    try {
      await axios.post('/api/xl/leave-templates', formData);
      alert("Template Saved");
      fetchT();
      setFormData({ name: '', description: '', payload: [] });
    } catch(e){}
  }
  const handleDelete = async (id:string) => {
    if(!window.confirm("Delete template?")) return;
    try {
      await axios.delete(`/api/xl/leave-templates/${id}`);
      fetchT();
    } catch(e){}
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-slate-700 pb-2">Create Leave Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">TEMPLATE NAME *</label>
          <input type="text" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">DESCRIPTION</label>
          <input type="text" className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
        </div>
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Leave Types in Template</h3>
          {formData.payload.map((p, index) => (
            <div key={index} className="flex justify-between items-center p-2 border-b border-slate-700 text-slate-300">
              <span>{p.leaveType}</span>
              <span className="font-bold text-sky-400">{p.count} leaves</span>
            </div>
          ))}
          {formData.payload.length === 0 && <p className="text-xs text-slate-500 italic mb-4">No leaves added yet</p>}
          <div className="flex flex-col md:flex-row gap-2 mt-4 items-end">
            <div className="flex-1 w-full">
               <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT LEAVE TYPE</label>
               <select className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-700" value={curType} onChange={e=>setCurType(e.target.value)}>
                 <option value="">Select</option>
                 {types.map((t:any) => <option key={t.name} value={t.name}>{t.name}</option>)}
               </select>
            </div>
            <div className="flex-1 w-full">
               <label className="text-xs font-bold text-slate-400 mb-1 block">NUMBER OF LEAVES</label>
               <input type="text" inputMode="numeric" className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-700" value={curCount} onChange={e=>setCurCount(e.target.value)} />
            </div>
            <button onClick={addType} className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg w-full md:w-auto h-10 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"><Plus size={20}/></button>
          </div>
        </div>
        <div className="md:col-span-2">
          <button onClick={handleSave} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg active:scale-95 transition-transform">Save Template</button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto mt-6">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3 text-xs text-sky-400">Template Name</th>
              <th className="p-3 text-xs text-sky-400">Configuration</th>
              <th className="p-3 text-xs text-sky-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t:any) => (
              <tr key={t._id} className="border-b border-slate-700/50">
                <td className="p-3 text-sm text-slate-300 font-bold">{t.name}</td>
                <td className="p-3 text-sm text-slate-300">
                  {(() => {
                     try { return JSON.parse(t.payload||'[]').map((p:any) => `${p.leaveType}: ${p.count}`).join(', ') }
                     catch(e){ return 'Invalid Data'; }
                  })()}
                </td>
                <td className="p-3 text-sm text-slate-300"><button onClick={()=>handleDelete(t._id)}><Trash2 size={16} className="text-rose-400 hover:text-rose-300"/></button></td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No Templates Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssignLeaveTemplateTab({ users }: { users: any[] }) {
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({ year: '2026-2027', employeeId: '', templateId: '' });
  
  useEffect(() => {
    axios.get('/api/xl/leave-templates').then(res => setTemplates(res.data.data||[]));
  }, []);

  const handleAssign = async () => {
    if(!formData.employeeId || !formData.templateId) return alert("Fill all fields");
    try {
      await axios.post('/api/xl/assign-leave-bulk', formData);
      alert("Assigned from Template!");
    } catch(e) {
      alert("Error assigning template");
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-slate-700 pb-2">Assign Leave Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT YEAR *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.year} onChange={e=>setFormData({...formData, year:e.target.value})}>
            <option>2026-2027</option>
            <option>2027-2028</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT EMPLOYEE *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId:e.target.value})}>
            <option value="">Select Employee</option>
            {users.map((u:any) => <option key={u.uid} value={u.uid}>{u.firstName} {u.lastName} ({u.designation || u.designationName})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">SELECT LEAVE TEMPLATE *</label>
          <select className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" value={formData.templateId} onChange={e=>setFormData({...formData, templateId:e.target.value})}>
            <option value="">Select Template</option>
            {templates.map((t:any) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <button onClick={handleAssign} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg active:scale-95 transition-transform">Assign Leave Template</button>
        </div>
      </div>
    </div>
  );
}

export default function ManageLeave() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsers(res.data.users||[]));
  }, []);
  const [activeTab, setActiveTab] = useState<'create-type' | 'assign-leave' | 'assigned-leaves' | 'create-template' | 'assign-template'>('create-type');
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'create-type', label: 'Create Leave Type' },
    { id: 'assign-leave', label: 'Assign Leave' },
    { id: 'assigned-leaves', label: 'Assigned Leaves' },
    { id: 'create-template', label: 'Create Leave Template' },
    { id: 'assign-template', label: 'Assign Leave Templates' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-2">Manage Leave</h1>
            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Leave Policy & Allocations</p>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-400 p-2">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div className={`absolute inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out z-10`}>
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Leave Admin</h3>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }} 
                className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-slate-900 p-4 md:p-8">
          {activeTab === 'create-type' && <CreateLeaveTypeTab />}
          {activeTab === 'assign-leave' && <AssignLeaveTab users={users} />}
          {activeTab === 'assigned-leaves' && <AssignedLeavesTab users={users} />}
          {activeTab === 'create-template' && <CreateLeaveTemplateTab />}
          {activeTab === 'assign-template' && <AssignLeaveTemplateTab users={users} />}
        </div>
      </div>
    </div>
  );
}

