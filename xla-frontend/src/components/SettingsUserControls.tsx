import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, ArrowLeft, ArrowUp } from 'lucide-react';

const USER_CONTROLS_LIST = [
  { id: 'PUNCHING', title: 'PUNCHING', subtitle: '(Only Available in Advance Plan)', desc: 'This will allow the user to Check-In and Check-Out from their app during their working hours.' },
  { id: 'TRACKER', title: 'TRACKER', subtitle: '(Only Available in Advance Plan)', desc: 'This will allow the managers to see the Live Location of Checked-In users on Google Map.' },
  { id: 'CHECK_IN_MANDATORY', title: 'CHECK IN MANDATORY', subtitle: '(Only Available in Advance Plan)', desc: 'This feature makes it compulsory to be Checked-In for submitting Daily Call Reports.' },
  { id: 'WORKIN_MANDATORY', title: 'WORKIN MANDATORY', desc: 'This feature makes it compulsory to be Checked-In for submitting Daily Call Reports.' },
  { id: 'CALL_PLANNING_MANDATORY', title: 'CALL PLANNING MANDATORY', desc: 'It allows automatic approval of call planning reports for this user. When a user creates new call report it won\'t go for approval to admin or manager.' },
  { id: 'CALL_REPORT_MANDATORY_FOR_EXPENSE', title: 'CALL REPORT MANDATORY FOR EXPENSE', desc: 'This feature will allow the Expense to be submitted automatically once the Call Report has been approved.' },
  { id: 'BLOCK_BACKLOG_REPORTING', title: 'BLOCK BACKLOG REPORTING', desc: 'This feature allows an admin to prohibit a user from submitting backlog reports.' },
  { id: 'GEO_FENCING', title: 'GEO FENCING', desc: 'If Geo Fencing is turned on then user will only be able to add call report when he is in fixed range of the Doctor\'s Location.' },
  { id: 'TOUR_LIMIT', title: 'TOUR LIMIT', desc: 'If Tour Limit is turned on then user won\'t be able to create tour programs for a particular route more than specified by Admin.' },
  { id: 'DCS_LIST_FILTER', title: 'DCS LIST FILTER', desc: 'This feature allows access to different lists Modern App has, to sort the entries of Doc/Chem/Stk. Using this feature you can restrict the user to only make calls that he originally planned and was approved for in Daily Planning.' }
];

export default function SettingsUserControls() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [controls, setControls] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleView = (user: any) => {
    setSelectedUser(user);
    setControls(user.controls || {});
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}`, { controls });
      alert('Preferences saved successfully!');
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (selectedUser) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
        <div className="p-8 pb-4 border-b border-[#3b3b5a] flex items-center justify-between shrink-0">
          <button onClick={() => setSelectedUser(null)} className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2 hover:underline">
            <ArrowLeft size={16} /> SET PREFERENCES FOR "{selectedUser.firstName} {selectedUser.lastName}"
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {USER_CONTROLS_LIST.map((ctrl) => (
            <div key={ctrl.id} className="flex items-start justify-between p-4 bg-[#252538] rounded-xl border border-[#3b3b5a]/50">
              <div className="flex-1 pr-8">
                <h3 className="text-white font-bold text-sm tracking-wide mb-1">
                  {ctrl.title} {ctrl.subtitle && <span className="text-red-400 font-medium text-xs ml-2">{ctrl.subtitle}</span>}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">{ctrl.desc}</p>
              </div>
              <div className="pt-2">
                <input
                  type="checkbox"
                  checked={!!controls[ctrl.id]}
                  onChange={(e) => setControls({ ...controls, [ctrl.id]: e.target.checked })}
                  className="w-5 h-5 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
          
          <div className="pt-6 pb-12">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-colors"
            >
              {saving ? 'SAVING...' : 'SUBMIT'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
      <div className="p-8 pb-4 border-b border-[#3b3b5a] shrink-0">
        <h2 className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={16} /> USER CONTROLS
        </h2>
      </div>

      <div className="p-8 shrink-0 flex items-center justify-between">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-800/50 py-1.5 px-3 rounded">
          SHOWING ({users.length}) ENTRIES
        </span>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a40] sticky top-0 z-10 shadow-md">
            <tr className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
              <th className="p-4 border-b border-[#3b3b5a] w-24">Sr no.</th>
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Name <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Designation <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a] text-center w-24">View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : users.map((u, i) => (
              <tr key={u._id} className="border-b border-[#3b3b5a]/50 hover:bg-[#252538] transition-colors group">
                <td className="p-4 text-slate-400 text-sm font-medium">{i + 1}</td>
                <td className="p-4 text-white text-sm">{u.firstName} {u.lastName}</td>
                <td className="p-4 text-slate-300 text-sm">{u.designation || '-'}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleView(u)} className="p-2 text-slate-400 hover:text-sky-400 bg-slate-800/50 hover:bg-sky-500/10 rounded-lg transition-all group-hover:scale-110">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
