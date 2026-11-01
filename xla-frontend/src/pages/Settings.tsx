import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Settings as SettingsIcon, ShieldCheck, Search, X, Check,
  ChevronDown, ChevronUp, Lock, Unlock, UserCheck, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ControlDefinition {
  id: string;
  title: string;
  desc: string;
}

const USER_CONTROLS_DEFINITIONS: ControlDefinition[] = [
  {
    id: 'workInMandatory',
    title: 'Work-In Mandatory',
    desc: 'You must start your work before adding Daily Call Reports when this feature is enabled.'
  },
  {
    id: 'callPlanningMandatory',
    title: 'Call Planning Mandatory',
    desc: 'With this feature enabled, it is mandatory to create a Call Plan before submitting your Daily Call Reports for that particular day'
  },
  {
    id: 'callReportMandatoryForExpense',
    title: 'Call Report Mandatory For Expense',
    desc: 'Your expenses will be automatically submitted once the associated Call Report has been approved.'
  },
  {
    id: 'blockBacklogReporting',
    title: 'Block Backlog Reporting',
    desc: 'Enabling this feature prevents you from submitting backlog reports.'
  },
  {
    id: 'geoFencing',
    title: 'Geo Fencing',
    desc: "When enabled, you can only add a Call Report if you are within a specified range of the doctor's location."
  },
  {
    id: 'tourLimit',
    title: 'Tour Limit',
    desc: 'If enabled, you cannot create tour programs for a specific route beyond the limit set by the admin.'
  },
  {
    id: 'deletionRequest',
    title: 'Deletion Request',
    desc: 'With this feature enabled, you can access the Deletion Request panel in your Approval Section and approve or reject deletion requests for doctors, chemists, or stockists.'
  },
  {
    id: 'dcsListFilter',
    title: 'DCS List Filter',
    desc: 'This feature allows you to access and filter different lists in the Medorn app, helping you sort entries for doctors, chemists, and stockists.'
  }
];

const AUTO_APPROVAL_MODULES = [
  { id: 'callPlanning', label: 'Call Planning' },
  { id: 'callReport', label: 'Call Report' },
  { id: 'chemist', label: 'Chemist' },
  { id: 'city', label: 'City' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'expense', label: 'Expense' },
  { id: 'geoFencing', label: 'Geo Fencing' },
  { id: 'gift', label: 'Gift' },
  { id: 'leaveRequest', label: 'Leave Request' },
  { id: 'primarySale', label: 'Primary Sale' },
  { id: 'route', label: 'Route' },
  { id: 'sample', label: 'Sample' },
  { id: 'secondarySale', label: 'Secondary Sale' },
  { id: 'stockist', label: 'Stockist' },
  { id: 'tp', label: 'TP' }
];

export default function Settings() {
  const navigate = useNavigate();

  // Navigation Views: 'menu' | 'user_controls' | 'access_control'
  const [currentView, setCurrentView] = useState<'menu' | 'user_controls' | 'access_control'>('menu');

  // Users Data
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [accessSearch, setAccessSearch] = useState('');

  // User Controls State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userControls, setUserControls] = useState<Record<string, any>>({});
  const [autoApprovalOpen, setAutoApprovalOpen] = useState(false);
  const [savingControls, setSavingControls] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Access Control Lock/Unlock Modal
  const [lockTarget, setLockTarget] = useState<any | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<any | null>(null);
  const [lockReasonCategory, setLockReasonCategory] = useState('Resigned');
  const [lockCustomReason, setLockCustomReason] = useState('');
  const [lockActionLoading, setLockActionLoading] = useState(false);

  // Fetch users (with deactivated users included for access control)
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('/api/admin/users?includeDeactivated=true');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isUserLocked = (user: any) => {
    if (user.status === 'Deactivated' || user.status === 'Inactive' || user.status === 'Blocked') return true;
    let c = user.controls;
    if (typeof c === 'string') {
      try { c = JSON.parse(c); } catch (e) { return false; }
    }
    return c?.locked === true;
  };

  // Active users for User Controls
  const activeUsers = useMemo(() => {
    return users.filter(u => !isUserLocked(u));
  }, [users]);

  // Filtered active users for User Controls dropdown
  const filteredActiveUsers = useMemo(() => {
    if (!userSearch.trim()) return activeUsers;
    const q = userSearch.toLowerCase();
    return activeUsers.filter(u => 
      `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.designation && u.designation.toLowerCase().includes(q)) ||
      (u.hq && u.hq.toLowerCase().includes(q))
    );
  }, [activeUsers, userSearch]);

  // Filtered all users for Access Control list
  const filteredAccessUsers = useMemo(() => {
    if (!accessSearch.trim()) return users;
    const q = accessSearch.toLowerCase();
    return users.filter(u => 
      `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.designation && u.designation.toLowerCase().includes(q)) ||
      (u.hq && u.hq.toLowerCase().includes(q))
    );
  }, [users, accessSearch]);

  // Select User for Controls
  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    let c = user.controls || {};
    if (typeof c === 'string') {
      try { c = JSON.parse(c); } catch (e) { c = {}; }
    }
    setUserControls({
      workInMandatory: Boolean(c.workInMandatory ?? c.WORKIN_MANDATORY),
      callPlanningMandatory: Boolean(c.callPlanningMandatory ?? c.CALL_PLANNING_MANDATORY),
      callReportMandatoryForExpense: Boolean(c.callReportMandatoryForExpense ?? c.CALL_REPORT_MANDATORY_FOR_EXPENSE),
      blockBacklogReporting: Boolean(c.blockBacklogReporting ?? c.BLOCK_BACKLOG_REPORTING),
      geoFencing: Boolean(c.geoFencing ?? c.GEO_FENCING),
      tourLimit: Boolean(c.tourLimit ?? c.TOUR_LIMIT),
      deletionRequest: Boolean(c.deletionRequest ?? c.DELETION_REQUEST),
      dcsListFilter: Boolean(c.dcsListFilter ?? c.DCS_LIST_FILTER),
      autoApproval: Boolean(c.autoApproval ?? c.AUTO_APPROVAL),
      autoApprovals: c.autoApprovals || {}
    });
    setAutoApprovalOpen(Boolean(c.autoApproval ?? c.AUTO_APPROVAL));
  };

  // Toggle Auto Approval sub-module
  const handleToggleAutoApprovalModule = (modId: string) => {
    setUserControls(prev => {
      const current = prev.autoApprovals || {};
      return {
        ...prev,
        autoApprovals: {
          ...current,
          [modId]: !current[modId]
        }
      };
    });
  };

  // Save User Controls
  const handleSaveUserControls = async () => {
    if (!selectedUser) return;
    setSavingControls(true);
    try {
      let existingControls = selectedUser.controls || {};
      if (typeof existingControls === 'string') {
        try { existingControls = JSON.parse(existingControls); } catch (e) { existingControls = {}; }
      }

      const updatedControls = {
        ...existingControls,
        workInMandatory: userControls.workInMandatory,
        WORKIN_MANDATORY: userControls.workInMandatory,
        callPlanningMandatory: userControls.callPlanningMandatory,
        CALL_PLANNING_MANDATORY: userControls.callPlanningMandatory,
        callReportMandatoryForExpense: userControls.callReportMandatoryForExpense,
        CALL_REPORT_MANDATORY_FOR_EXPENSE: userControls.callReportMandatoryForExpense,
        blockBacklogReporting: userControls.blockBacklogReporting,
        BLOCK_BACKLOG_REPORTING: userControls.blockBacklogReporting,
        geoFencing: userControls.geoFencing,
        GEO_FENCING: userControls.geoFencing,
        tourLimit: userControls.tourLimit,
        TOUR_LIMIT: userControls.tourLimit,
        deletionRequest: userControls.deletionRequest,
        DELETION_REQUEST: userControls.deletionRequest,
        dcsListFilter: userControls.dcsListFilter,
        DCS_LIST_FILTER: userControls.dcsListFilter,
        autoApproval: userControls.autoApproval,
        AUTO_APPROVAL: userControls.autoApproval,
        autoApprovals: userControls.autoApprovals || {}
      };

      const res = await axios.put(`/api/admin/users/${selectedUser._id}`, {
        controls: updatedControls
      });

      if (res.data.success) {
        setShowSuccessModal(true);
        // Update local users array
        setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, controls: updatedControls } : u));
        setSelectedUser({ ...selectedUser, controls: updatedControls });
      } else {
        alert(res.data.message || 'Failed to save controls');
      }
    } catch (e: any) {
      console.error('Error saving user controls:', e);
      alert(e.response?.data?.message || 'Failed to save user controls');
    } finally {
      setSavingControls(false);
    }
  };

  // Lock User Confirmation
  const handleConfirmLock = async () => {
    if (!lockTarget) return;
    setLockActionLoading(true);
    try {
      const finalReason = lockReasonCategory === 'Other'
        ? (lockCustomReason.trim() || 'Other')
        : (lockCustomReason.trim() ? `${lockReasonCategory} - ${lockCustomReason.trim()}` : lockReasonCategory);

      let currentControls = lockTarget.controls || {};
      if (typeof currentControls === 'string') {
        try { currentControls = JSON.parse(currentControls); } catch (e) { currentControls = {}; }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const updatedControls = {
        ...currentControls,
        locked: true,
        lockedReason: finalReason,
        lockedDate: dateStr
      };

      const res = await axios.put(`/api/admin/users/${lockTarget._id}`, {
        controls: updatedControls,
        status: 'Deactivated',
        deactivateReason: finalReason,
        deactivateDate: dateStr
      });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === lockTarget._id ? {
          ...u,
          status: 'Deactivated',
          deactivateReason: finalReason,
          deactivateDate: dateStr,
          controls: updatedControls
        } : u));
        setLockTarget(null);
        setLockCustomReason('');
      } else {
        alert(res.data.message || 'Failed to lock user');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to lock user');
    } finally {
      setLockActionLoading(false);
    }
  };

  // Unlock User Confirmation
  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    setLockActionLoading(true);
    try {
      let currentControls = unlockTarget.controls || {};
      if (typeof currentControls === 'string') {
        try { currentControls = JSON.parse(currentControls); } catch (e) { currentControls = {}; }
      }

      const updatedControls = {
        ...currentControls,
        locked: false,
        lockedReason: '',
        lockedDate: ''
      };

      const res = await axios.put(`/api/admin/users/${unlockTarget._id}`, {
        controls: updatedControls,
        status: 'Active',
        deactivateReason: null,
        deactivateDate: null
      });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === unlockTarget._id ? {
          ...u,
          status: 'Active',
          deactivateReason: null,
          deactivateDate: null,
          controls: updatedControls
        } : u));
        setUnlockTarget(null);
      } else {
        alert(res.data.message || 'Failed to unlock user');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to unlock user');
    } finally {
      setLockActionLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#151928] text-white font-sans flex flex-col pb-24">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. SETTINGS MAIN MENU VIEW (Matching video frame 00:00) */}
      {/* ────────────────────────────────────────────────────────── */}
      {currentView === 'menu' && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/extras')}
              className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
              title="Back to Extras"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black text-white tracking-wide">Settings</h1>
          </div>

          <p className="text-xs text-slate-400 mb-6 px-1">
            Configure field member app controls and account access privileges.
          </p>

          {/* Quick Action Menu Cards */}
          <div className="space-y-4">
            {/* User Controls Button */}
            <button
              onClick={() => { setCurrentView('user_controls'); setSelectedUser(null); }}
              className="w-full bg-[#1e243d] hover:bg-[#252c4a] border border-[#333e66] hover:border-sky-500/50 rounded-2xl p-5 flex items-center gap-4 text-left shadow-lg active:scale-[0.99] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <SettingsIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  User Controls
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Call planning, work-in, backlog, geo-fencing &amp; auto-approvals
                </p>
              </div>
            </button>

            {/* Access Control Button */}
            <button
              onClick={() => setCurrentView('access_control')}
              className="w-full bg-[#1e243d] hover:bg-[#252c4a] border border-[#333e66] hover:border-rose-500/50 rounded-2xl p-5 flex items-center gap-4 text-left shadow-lg active:scale-[0.99] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                  Access Control
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Lock or deactivate field accounts &amp; manage portal access
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. USER CONTROLS: SELECT USER SCREEN (Video frame 00:02-04) */}
      {/* ────────────────────────────────────────────────────────── */}
      {currentView === 'user_controls' && !selectedUser && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setCurrentView('menu')}
              className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black text-white tracking-wide">Select User</h1>
          </div>

          {/* User Selector Dropdown Card */}
          <div className="bg-[#1e243d] border border-[#333e66] rounded-2xl p-4 shadow-xl mb-4">
            <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <span className="font-bold text-sm text-white">Select User</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {activeUsers.length}
              </span>
            </div>

            {/* Live Search Input */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user..."
                className="w-full bg-[#151928] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* User List */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar divide-y divide-slate-800/80 pr-1">
              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading active users...</div>
              ) : filteredActiveUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No matching active users found</div>
              ) : (
                filteredActiveUsers.map((u) => {
                  const fullName = `${u.firstName} ${u.lastName || ''}`.trim();
                  return (
                    <button
                      key={u._id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full py-3 px-2 flex items-center gap-3 text-left hover:bg-slate-800/50 rounded-xl transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-sky-300 shrink-0 overflow-hidden">
                        {u.profilePic ? (
                          <img src={u.profilePic} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors truncate">
                          {fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {u.designation || 'Staff'} {u.hq ? `• ${u.hq}` : ''}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. USER CONTROLS: CONTROLS FORM (Video frame 00:05-20)     */}
      {/* ────────────────────────────────────────────────────────── */}
      {currentView === 'user_controls' && selectedUser && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black text-white tracking-wide">User Controls</h1>
          </div>

          {/* Selected User Banner */}
          <div className="bg-[#1e243d] border border-[#333e66] rounded-xl px-4 py-3 flex items-center justify-between mb-5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Selected User :</span>
              <span className="text-xs font-black text-sky-400">
                {selectedUser.firstName} {selectedUser.lastName || ''}
              </span>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Change user"
            >
              <X size={16} />
            </button>
          </div>

          {/* Controls List Cards */}
          <div className="space-y-3.5 mb-8">
            {USER_CONTROLS_DEFINITIONS.map((ctrl) => {
              const isChecked = Boolean(userControls[ctrl.id]);
              return (
                <div
                  key={ctrl.id}
                  className="bg-[#1e243d] border border-[#333e66] rounded-2xl p-4 shadow-md transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <SettingsIcon size={14} className="text-sky-400 shrink-0" />
                        <h4 className="text-xs font-bold text-white tracking-wide">
                          {ctrl.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                        {ctrl.desc}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setUserControls(prev => ({ ...prev, [ctrl.id]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Auto Approval Accordion Card (Video frame 00:40-01:04) */}
            <div className="bg-[#1e243d] border border-[#333e66] rounded-2xl p-4 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white tracking-wide">Auto Approval</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                    With this feature enabled, selected entries will be automatically approved without requiring admin approval.
                    <span className="text-amber-400 block mt-1 font-semibold">
                      WARNING: No admin notification will be sent for these approvals.
                    </span>
                  </p>
                </div>

                {/* Main Auto Approval Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={Boolean(userControls.autoApproval)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUserControls(prev => ({ ...prev, autoApproval: checked }));
                      if (checked) setAutoApprovalOpen(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              {/* Accordion Trigger */}
              <button
                type="button"
                onClick={() => setAutoApprovalOpen(!autoApprovalOpen)}
                className="mt-3 pt-3 border-t border-slate-700/60 w-full flex items-center justify-between text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>Select Auto Approval Modules ({AUTO_APPROVAL_MODULES.length})</span>
                {autoApprovalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Sub-Modules Switch List */}
              {autoApprovalOpen && (
                <div className="mt-3 pt-2 space-y-2.5 divide-y divide-slate-800/80">
                  {AUTO_APPROVAL_MODULES.map((mod) => {
                    const isModActive = Boolean(userControls.autoApprovals?.[mod.id]);
                    return (
                      <div key={mod.id} className="pt-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{mod.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isModActive}
                            onChange={() => handleToggleAutoApprovalModule(mod.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button (Video frame 01:04) */}
          <button
            type="button"
            onClick={handleSaveUserControls}
            disabled={savingControls}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {savingControls ? 'Saving Controls...' : 'Submit'}
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. ACCESS CONTROL VIEW (Video frame 00:23-34)               */}
      {/* ────────────────────────────────────────────────────────── */}
      {currentView === 'access_control' && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setCurrentView('menu')}
              className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black text-white tracking-wide">Access Control</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={accessSearch}
              onChange={(e) => setAccessSearch(e.target.value)}
              placeholder="Search user by name, ID, HQ..."
              className="w-full bg-[#1e243d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Access Control Table / Card List */}
          <div className="bg-[#1e243d] border border-[#333e66] rounded-2xl overflow-hidden shadow-xl">
            {/* Table Header Row */}
            <div className="px-4 py-3 bg-[#171c31] border-b border-slate-700/70 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span>User</span>
              <span>Lock Status</span>
            </div>

            {/* User Rows */}
            <div className="divide-y divide-slate-800/80 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading user list...</div>
              ) : filteredAccessUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No users found</div>
              ) : (
                filteredAccessUsers.map((u) => {
                  const locked = isUserLocked(u);
                  const fullName = `${u.firstName} ${u.lastName || ''}`.trim();
                  return (
                    <div
                      key={u._id}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-sky-400 shrink-0 overflow-hidden">
                          {u.profilePic ? (
                            <img src={u.profilePic} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate flex items-center gap-2">
                            <span>{fullName}</span>
                            {locked && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Locked
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {u.employeeId} &bull; {u.designation || 'Staff'} {u.hq ? `• ${u.hq}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Lock Toggle Switch (Video frame 00:24-34) */}
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (locked) {
                              setUnlockTarget(u);
                            } else {
                              setLockTarget(u);
                            }
                          }}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                            locked ? 'bg-rose-600 justify-end' : 'bg-slate-700 justify-start'
                          }`}
                          title={locked ? 'Click to Unlock' : 'Click to Lock'}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md flex items-center justify-center">
                            {locked ? (
                              <Lock size={10} className="text-rose-600" />
                            ) : (
                              <Unlock size={10} className="text-slate-700" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUCCESS MODAL (Matching video frame 01:05)                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c233c] border border-slate-700 rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center text-center relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/30">
              <Check size={36} strokeWidth={3} />
            </div>

            <h3 className="text-lg font-black text-white mb-1">Success !</h3>
            <p className="text-xs text-slate-300 font-medium">Updated Successfully!</p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* LOCK CONFIRMATION MODAL                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c233c] border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col text-left">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <ShieldAlert size={20} />
              <h3 className="text-sm font-black text-white">Lock User Account</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to lock and de-activate <strong className="text-white">{lockTarget.firstName} {lockTarget.lastName}</strong>? They will not be able to log in or submit reports.
            </p>

            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Reason
            </label>
            <select
              value={lockReasonCategory}
              onChange={(e) => setLockReasonCategory(e.target.value)}
              className="w-full bg-[#151928] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 mb-3"
            >
              <option value="Resigned">Resigned</option>
              <option value="Asked to resign due to behavioural issues.">Behavioural issues</option>
              <option value="Integrity issues with candidate">Integrity issues</option>
              <option value="Other">Other Reason</option>
            </select>

            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Resigned due to health issues"
              value={lockCustomReason}
              onChange={(e) => setLockCustomReason(e.target.value)}
              className="w-full bg-[#151928] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 mb-5"
            />

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setLockTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                disabled={lockActionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md shadow-rose-600/30"
              >
                {lockActionLoading ? 'Locking...' : 'Confirm Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* UNLOCK CONFIRMATION MODAL                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c233c] border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col text-left">
            <div className="flex items-center gap-2.5 text-emerald-400 mb-3">
              <Unlock size={20} />
              <h3 className="text-sm font-black text-white">Unlock &amp; Re-activate User</h3>
            </div>

            <p className="text-xs text-slate-300 mb-5">
              Re-activate <strong className="text-white">{unlockTarget.firstName} {unlockTarget.lastName}</strong>? This user will regain full access to the portal and mobile app.
            </p>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setUnlockTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                disabled={lockActionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/30"
              >
                {lockActionLoading ? 'Unlocking...' : 'Confirm Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
