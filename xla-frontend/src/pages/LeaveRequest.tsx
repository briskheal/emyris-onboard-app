import { ArrowLeft, ChevronDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function LeaveRequest() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Filter State for Table
  const [filterMonth, setFilterMonth] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch(e) {}
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get('/api/xl/leave-types');
      setLeaveTypes(res.data.data || []);
    } catch(e) {}
  };

  const fetchLeaves = async () => {
    try {
      let url = '/api/xl/leave';
      const params = new URLSearchParams();
      if (filterUser) params.append('employeeId', filterUser);
      // Backend could be modified to filter by month natively, 
      // but for now we'll fetch based on user and filter locally if needed.
      if (params.toString()) url += '?' + params.toString();

      const res = await axios.get(url);
      let data = res.data.data || [];
      
      if (filterMonth) {
        data = data.filter((d:any) => d.startDate && d.startDate.startsWith(filterMonth));
      }
      setLeaves(data);
    } catch(e) {}
  };

  useEffect(() => {
    fetchUsers();
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [filterMonth, filterUser]);

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      alert("Please fill all fields.");
      return;
    }
    try {
      await axios.post('/api/xl/leave', formData);
      alert("Leave Request Submitted!");
      setFormData({ employeeId: '', leaveType: '', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (e) {
      alert("Error submitting leave request.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this leave request?")) return;
    try {
      await axios.delete(`/api/xl/leave/${id}`);
      fetchLeaves();
    } catch(e) {}
  };

  const getUserName = (id: string) => {
    const u = users.find(x => x.uid === id);
    return u ? `${u.firstName} ${u.lastName || ''}` : 'Unknown User';
  };

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-6 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Leave Request</h2>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 mb-8">
          
          {/* Calendar Block Replacement */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 max-w-xl flex flex-col gap-6 justify-center">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 border-b border-slate-700/50 pb-2">Select Dates</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Start Date *</label>
                <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">End Date *</label>
                <input type="date" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Form Block */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 w-full xl:w-[450px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User *</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId:e.target.value})}>
                  <option value="" disabled hidden>Select User</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.firstName} {u.lastName} ({u.designation || u.designationName})</option>)}
                </select>
                <ChevronDown size={18} className="text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Leave Type *</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-rose-500 transition-colors"
                  value={formData.leaveType} onChange={e=>setFormData({...formData, leaveType:e.target.value})}>
                  <option value="" disabled hidden>Select Leave Type</option>
                  {leaveTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
                <ChevronDown size={18} className="text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Reason for Leave *</label>
              <textarea 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none min-h-[120px]"
                placeholder="Enter Reason for Leave"
                value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})}
              />
            </div>

            <button onClick={handleSubmit} className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-4 font-bold shadow-lg shadow-sky-500/20 transition-colors flex items-center justify-center">
              Submit
            </button>
          </div>
        </div>

        {/* BOTTOM TABLE */}
        <div className="flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative mt-4">
          
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Showing ({leaves.length}) Entries</h3>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex flex-col gap-1.5 w-full md:w-48">
                <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Month</label>
                <input type="month" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors w-full"
                  value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 w-full md:w-64">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User</label>
                <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full"
                  value={filterUser} onChange={e=>setFilterUser(e.target.value)}>
                  <option value="">All Users</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sr no.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">Reason for Leave</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Type</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {leaves.map((l, i) => (
                  <tr key={l._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-slate-300 text-center bg-slate-900/20">{i+1}</td>
                    <td className="p-4 text-sm font-bold text-white">{getUserName(l.employeeId)}</td>
                    <td className="p-4 text-sm font-bold text-sky-400">{l.startDate}</td>
                    <td className="p-4 text-sm font-bold text-sky-400">{l.endDate}</td>
                    <td className="p-4 text-sm font-semibold text-slate-300 text-wrap max-w-xs leading-relaxed">{l.reason}</td>
                    <td className="p-4 text-sm font-semibold text-slate-300">{l.leaveType}</td>
                    <td className="p-4 text-sm font-semibold text-slate-300">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : l.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/20 text-sky-400'}`}>
                        {l.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(l._id)} className="text-rose-400/50 hover:text-rose-400 transition-colors p-1.5" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold">No Leaves Found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
