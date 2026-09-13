import { ArrowLeft, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';

export default function LeaveRequest() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

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

  // Dropdown & Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const fetchBalances = async (empId: string) => {
    if (!empId) { setBalances([]); return; }
    try {
      const year = new Date().getMonth() >= 3 ? `${new Date().getFullYear()}-${new Date().getFullYear()+1}` : `${new Date().getFullYear()-1}-${new Date().getFullYear()}`;
      const res = await axios.get(`/api/xl/assigned-leaves/my?employeeId=${empId}&year=${year}`);
      setBalances(res.data.data || []);
    } catch(e) {}
  };

  const fetchLeaves = async () => {
    try {
      let url = '/api/xl/leave';
      const params = new URLSearchParams();
      if (filterUser) params.append('employeeId', filterUser);

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
    fetchBalances(formData.employeeId);
  }, [formData.employeeId]);

  useEffect(() => {
    fetchLeaves();
  }, [filterMonth, filterUser]);

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.leaveType || !formData.startDate || !formData.reason) {
      alert("Please fill all required fields (End Date is optional for a single day).");
      return;
    }
    // If end date is empty, set it to start date
    const submission = { ...formData };
    if (!submission.endDate) submission.endDate = submission.startDate;

    try {
      await axios.post('/api/xl/leave', submission);
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

  // Calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handleDateClick = (dateNum: number) => {
    const pad = (n:number) => n.toString().padStart(2, '0');
    const dateStr = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth()+1)}-${pad(dateNum)}`;

    if (!formData.startDate || (formData.startDate && formData.endDate)) {
      setFormData({...formData, startDate: dateStr, endDate: ''});
    } else {
      if (new Date(dateStr) < new Date(formData.startDate)) {
        setFormData({...formData, startDate: dateStr});
      } else {
        setFormData({...formData, endDate: dateStr});
      }
    }
  };

  const isSelected = (dateNum: number) => {
    const pad = (n:number) => n.toString().padStart(2, '0');
    const dateStr = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth()+1)}-${pad(dateNum)}`;
    if (formData.startDate === dateStr || formData.endDate === dateStr) return true;
    if (formData.startDate && formData.endDate) {
      return (new Date(dateStr) >= new Date(formData.startDate) && new Date(dateStr) <= new Date(formData.endDate));
    }
    return false;
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
          
          {/* Visual Calendar Block */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 max-w-xl">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors">
                <ChevronLeft size={18} className="text-slate-400" />
              </button>
              <span className="font-bold text-lg text-white">
                {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors">
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-6 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs font-bold text-slate-500 uppercase">{day}</div>
              ))}
              
              {/* Empty Days */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`}></div>
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dateNum = i + 1;
                const active = isSelected(dateNum);
                return (
                  <div key={dateNum} className="flex items-center justify-center relative">
                    {active && formData.startDate && formData.endDate && (
                      <div className="absolute inset-0 bg-sky-500/20 w-full"></div>
                    )}
                    <button 
                      onClick={() => handleDateClick(dateNum)}
                      className={`relative z-10 w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center transition-all ${
                        active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : 'text-slate-300 hover:bg-slate-700'
                      }`}>
                      {dateNum}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Block */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 w-full xl:w-[450px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User *</label>
              <CustomSelect 
                options={users.map(u => ({
                  value: u.uid,
                  label: u.firstName + ' ' + (u.lastName || ''),
                  subLabel: u.designation || u.designationName,
                  showDefaultAvatar: true,
                  avatarUrl: u.profilePic
                }))}
                value={formData.employeeId}
                onChange={(val) => setFormData({...formData, employeeId: val})}
                placeholder="Select User"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Leave Type *</label>
              <CustomSelect 
                options={leaveTypes.map(t => {
                  const b = balances.find((x:any) => x.leaveType === t.name);
                  const isLWP = t.name === 'Leave Without Pay' || t.name === 'LWP';
                  const remaining = b ? (b.assigned - b.used) : 0;
                  return {
                    value: t.name,
                    label: t.name,
                    rightBadge: !isLWP ? (
                      <span className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-sky-500/20">
                        {remaining}
                      </span>
                    ) : undefined
                  };
                })}
                value={formData.leaveType}
                onChange={(val) => setFormData({...formData, leaveType: val})}
                placeholder="Select Leave Type"
              />
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
