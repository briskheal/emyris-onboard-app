import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Settings as SettingsIcon, ShieldCheck, Search, X, Check,
  ChevronDown, ChevronUp, Lock, Unlock, UserCheck, Calendar, Sliders,
  RotateCcw, Activity, Type, Megaphone, Smartphone, Monitor
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Desktop Subcomponents
import SettingsPreferences from '../components/SettingsPreferences';
import SettingsHolidays from '../components/SettingsHolidays';
import SettingsDoctorControls from '../components/SettingsDoctorControls';
import TypographySettingsModal from '../components/TypographySettingsModal';

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

const DESKTOP_SIDEBAR_ITEMS = [
  { id: 'holidays', label: 'Create Holidays', icon: Calendar },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'restore', label: 'Restore Deleted', icon: RotateCcw },
  { id: 'user_controls', label: 'User Controls', icon: UserCheck },
  { id: 'doctor_controls', label: 'Doctor Controls', icon: Activity },
  { id: 'access_control', label: 'Access Control', icon: ShieldCheck },
  { id: 'typography', label: 'Display & Typography', icon: Type },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, isNew: true },
];

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Responsive device check: Mobile (< 1024px) vs Desktop (>= 1024px)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop active tab
  const initialDesktopTab = queryParams.get('tab') || 'holidays';
  const [desktopTab, setDesktopTab] = useState<string>(initialDesktopTab);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) {
      setDesktopTab(tab);
    }
  }, [location.search]);

  const handleSelectDesktopTab = (tabId: string) => {
    setDesktopTab(tabId);
    navigate(`/extras/settings?tab=${tabId}`, { replace: true });
  };

  // Mobile Navigation Views: 'menu' | 'user_controls' | 'access_control'
  const [currentView, setCurrentView] = useState<'menu' | 'user_controls' | 'access_control'>('menu');

  // If user opens URL directly with ?tab=user_controls or ?tab=access_control on mobile
  useEffect(() => {
    const tab = queryParams.get('tab');
    if (isMobile) {
      if (tab === 'user_controls') setCurrentView('user_controls');
      else if (tab === 'access_control') setCurrentView('access_control');
    }
  }, [location.search, isMobile]);

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
      const finalReason = lockReasonCategory === 'Other' ? (lockCustomReason || 'Other') : lockReasonCategory;
      let existingControls = lockTarget.controls || {};
      if (typeof existingControls === 'string') {
        try { existingControls = JSON.parse(existingControls); } catch (e) { existingControls = {}; }
      }
      const updatedControls = {
        ...existingControls,
        locked: true,
        lockReason: finalReason,
        lockedAt: new Date().toISOString()
      };

      const res = await axios.put(`/api/admin/users/${lockTarget._id}`, {
        status: 'Deactivated',
        controls: updatedControls
      });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === lockTarget._id ? { ...u, status: 'Deactivated', controls: updatedControls } : u));
        setLockTarget(null);
        setLockCustomReason('');
        setLockReasonCategory('Resigned');
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
      let existingControls = unlockTarget.controls || {};
      if (typeof existingControls === 'string') {
        try { existingControls = JSON.parse(existingControls); } catch (e) { existingControls = {}; }
      }
      const updatedControls = {
        ...existingControls,
        locked: false,
        lockReason: null,
        unlockedAt: new Date().toISOString()
      };

      const res = await axios.put(`/api/admin/users/${unlockTarget._id}`, {
        status: 'Active',
        controls: updatedControls
      });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === unlockTarget._id ? { ...u, status: 'Active', controls: updatedControls } : u));
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

  // Shared User Controls Panel (used in both desktop and mobile user controls view)
  const renderUserControlsConfig = () => (
    <div className="space-y-4">
      {/* User Information Pill */}
      <div className="bg-[#1e243d] border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-sm">
            {selectedUser.firstName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              {selectedUser.firstName} {selectedUser.lastName || ''}
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedUser.employeeId} &bull; {selectedUser.designation || 'Staff'} {selectedUser.hq ? `• ${selectedUser.hq}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
        >
          Change
        </button>
      </div>

      {/* 8 Mandatory / Permission Control Cards */}
      <div className="space-y-3">
        {USER_CONTROLS_DEFINITIONS.map((ctrl) => {
          const isActive = Boolean(userControls[ctrl.id]);
          return (
            <div
              key={ctrl.id}
              className="bg-[#1e243d] border border-[#333e66] rounded-2xl p-4 shadow-md flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-bold text-white tracking-wide">{ctrl.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">{ctrl.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUserControls(prev => ({ ...prev, [ctrl.id]: checked }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          );
        })}

        {/* Auto Approval Accordion Card */}
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

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSaveUserControls}
        disabled={savingControls}
        className="w-full mt-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {savingControls ? (
          <span>Saving Controls...</span>
        ) : (
          <>
            <Check size={18} />
            <span>Submit</span>
          </>
        )}
      </button>
    </div>
  );

  // Shared Access Control Table Component
  const renderAccessControlTable = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
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
        <div className="px-4 py-3 bg-[#171c31] border-b border-slate-700/70 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
          <span>User</span>
          <span>Lock Status</span>
        </div>

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

                  {/* Lock Toggle Switch */}
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
  );

  return (
    <div className="min-h-screen bg-[#151521] text-white font-sans flex flex-col">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. MOBILE VIEW (Screen width < 1024px)                          */}
      {/* ONLY User Controls and Access Control are visible on mobile     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <div className="flex-1 flex flex-col pb-24 bg-[#151928]">
          {/* Mobile View: Main Menu */}
          {currentView === 'menu' && (
            <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
                    title="Back to Admin Panel"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h1 className="text-xl font-black text-white tracking-wide">Settings</h1>
                </div>
                {/* Switch to Desktop View option for mobile tablets if needed */}
                <button
                  onClick={() => setIsMobile(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1.5"
                  title="Switch to Desktop Settings View"
                >
                  <Monitor size={12} /> Desktop
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-6 px-1">
                Configure field member app controls and account access privileges.
              </p>

              {/* Mobile Only: 2 Cards (User Controls & Access Control) */}
              <div className="space-y-4">
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

          {/* Mobile View: Select User / User Controls */}
          {currentView === 'user_controls' && (
            <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    if (selectedUser) setSelectedUser(null);
                    else setCurrentView('menu');
                  }}
                  className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-black text-white tracking-wide">
                  {selectedUser ? 'User Controls' : 'Select User'}
                </h1>
              </div>

              {!selectedUser ? (
                /* Select User Dropdown Card */
                <div className="bg-[#1e243d] border border-[#333e66] rounded-2xl p-4 shadow-xl">
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

                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar divide-y divide-slate-800/80 pr-1">
                    {loadingUsers ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading active users...</div>
                    ) : filteredActiveUsers.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No active users found</div>
                    ) : (
                      filteredActiveUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left py-3 px-2 flex items-center justify-between hover:bg-slate-800/50 rounded-xl transition-colors group"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="font-bold text-xs text-white group-hover:text-sky-300 truncate">
                              {u.firstName} {u.lastName || ''}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {u.employeeId} &bull; {u.designation || 'Staff'} {u.hq ? `• ${u.hq}` : ''}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
                            Select &rarr;
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                renderUserControlsConfig()
              )}
            </div>
          )}

          {/* Mobile View: Access Control */}
          {currentView === 'access_control' && (
            <div className="flex-1 flex flex-col max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="p-2 rounded-xl bg-[#1e243d] border border-slate-700/60 text-sky-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-black text-white tracking-wide">Access Control</h1>
              </div>

              {renderAccessControlTable()}
            </div>
          )}
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════ */
        /* 2. DESKTOP VIEW (Screen width >= 1024px)                        */
        /* Full Medorn-Style Master-Detail layout with all settings tabs   */
        /* ════════════════════════════════════════════════════════════════ */
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 bg-[#1c1c2e] border-r border-[#3b3b5a] flex flex-col shrink-0 relative z-10 shadow-2xl">
            <div className="p-6 border-b border-[#3b3b5a] flex items-center justify-between">
              <button 
                onClick={() => navigate('/admin')} 
                className="flex items-center gap-2 text-sky-400 font-bold hover:text-sky-300 transition-colors text-base tracking-wide"
                title="Back to Admin Panel"
              >
                <ArrowLeft size={18} /> Settings
              </button>
              {/* Optional Mobile preview trigger */}
              <button
                onClick={() => setIsMobile(true)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-700 transition-colors"
                title="Preview Mobile Settings View"
              >
                <Smartphone size={15} />
              </button>
            </div>

            <div className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
              {DESKTOP_SIDEBAR_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = desktopTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectDesktopTab(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs tracking-normal transition-all duration-200 flex items-center justify-between ${
                      isActive 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                        : 'text-slate-400 hover:bg-[#27273f] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.isNew && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        new
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-[#1e1e2d] relative flex flex-col h-full overflow-y-auto custom-scrollbar">
            {desktopTab === 'holidays' ? (
              <div className="p-8">
                <SettingsHolidays />
              </div>
            ) : desktopTab === 'preferences' ? (
              <div className="p-8">
                <SettingsPreferences />
              </div>
            ) : desktopTab === 'doctor_controls' ? (
              <div className="h-full">
                <SettingsDoctorControls />
              </div>
            ) : desktopTab === 'user_controls' ? (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <div className="mb-6 pb-4 border-b border-[#3b3b5a] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">User Controls</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure field member mandatory rules, geo-fencing, limits &amp; automatic approval modules.
                    </p>
                  </div>
                </div>

                {!selectedUser ? (
                  <div className="bg-[#1c233c] border border-[#333e66] rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                          <UserCheck size={20} />
                        </div>
                        <span className="font-bold text-base text-white">Select User to Configure</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        {activeUsers.length} Active Users
                      </span>
                    </div>

                    <div className="relative mb-4">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search active user by name, ID, designation, HQ..."
                        className="w-full bg-[#151928] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto custom-scrollbar divide-y divide-slate-800/80 pr-1">
                      {loadingUsers ? (
                        <div className="p-8 text-center text-xs text-slate-400">Loading active users...</div>
                      ) : filteredActiveUsers.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">No active users found</div>
                      ) : (
                        filteredActiveUsers.map((u) => (
                          <div
                            key={u._id}
                            className="py-3 px-3 flex items-center justify-between hover:bg-slate-800/50 rounded-xl transition-colors"
                          >
                            <div className="min-w-0 pr-4">
                              <div className="font-bold text-sm text-white">{u.firstName} {u.lastName || ''}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {u.employeeId} &bull; {u.designation || 'Staff'} {u.hq ? `• ${u.hq}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectUser(u)}
                              className="px-4 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500 hover:text-white font-bold text-xs transition-colors"
                            >
                              Configure &rarr;
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1c233c] border border-[#333e66] rounded-2xl p-6 shadow-xl">
                    {renderUserControlsConfig()}
                  </div>
                )}
              </div>
            ) : desktopTab === 'access_control' ? (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <div className="mb-6 pb-4 border-b border-[#3b3b5a]">
                  <h2 className="text-xl font-bold text-white tracking-wide">Access Control</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Lock or deactivate field accounts, specify separation reasons, and manage mobile app portal access.
                  </p>
                </div>
                {renderAccessControlTable()}
              </div>
            ) : desktopTab === 'typography' ? (
              <div className="p-8 max-w-5xl">
                <TypographySettingsModal isInline={true} />
              </div>
            ) : desktopTab === 'restore' ? (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <div className="mb-6 pb-4 border-b border-[#3b3b5a]">
                  <h2 className="text-xl font-bold text-white tracking-wide">Restore Deleted</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Restore archived or inadvertently deleted doctors, chemists, stockists, and operational routes.
                  </p>
                </div>
                <div className="bg-[#1c233c] border border-slate-700/80 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4">
                    <RotateCcw size={32} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Trash &amp; Data Recovery Hub</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                    No soft-deleted records currently pending recovery. Any doctor, chemist, stockist, or city deleted from active lists within the last 30 days can be audited and restored here.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check size={14} /> Database Integrity Verified
                  </div>
                </div>
              </div>
            ) : desktopTab === 'campaigns' ? (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <div className="mb-6 pb-4 border-b border-[#3b3b5a]">
                  <h2 className="text-xl font-bold text-white tracking-wide">Campaigns &amp; Brand Drives</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage active marketing initiatives, specialized product campaigns, and field incentive programs.
                  </p>
                </div>
                <div className="bg-[#1c233c] border border-slate-700/80 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
                    <Megaphone size={32} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Field Campaign Hub</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Campaign tracking module is active and synchronizing brand drive targets with monthly DCR detailing.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUCCESS MODAL                                              */}
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
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Check size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Saved Successfully</h3>
            <p className="text-xs text-slate-400 mb-5">
              User controls and auto-approvals for {selectedUser?.firstName} have been updated.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* LOCK REASON MODAL                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c233c] border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Lock User Account</h3>
                  <p className="text-[11px] text-slate-400">{lockTarget.firstName} {lockTarget.lastName || ''}</p>
                </div>
              </div>
              <button onClick={() => setLockTarget(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Locking this user will immediately deactivate their account, revoke mobile app access, and prohibit call reporting.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">
                Reason for Separation / Lock *
              </label>
              <select
                value={lockReasonCategory}
                onChange={(e) => setLockReasonCategory(e.target.value)}
                className="w-full bg-[#151928] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
                <option value="Absconding">Absconding</option>
                <option value="Disciplinary Action">Disciplinary Action</option>
                <option value="Prolonged Inactivity">Prolonged Inactivity</option>
                <option value="Temporary Suspension">Temporary Suspension</option>
                <option value="Other">Other (Specify)</option>
              </select>
            </div>

            {lockReasonCategory === 'Other' && (
              <div className="mb-4">
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">
                  Specify Custom Reason
                </label>
                <textarea
                  rows={2}
                  value={lockCustomReason}
                  onChange={(e) => setLockCustomReason(e.target.value)}
                  placeholder="Enter custom separation reason..."
                  className="w-full bg-[#151928] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setLockTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                disabled={lockActionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {lockActionLoading ? 'Locking...' : 'Confirm Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* UNLOCK MODAL                                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c233c] border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Unlock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Unlock User Account</h3>
                  <p className="text-[11px] text-slate-400">{unlockTarget.firstName} {unlockTarget.lastName || ''}</p>
                </div>
              </div>
              <button onClick={() => setUnlockTarget(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-5">
              Are you sure you want to reactivate this account? The user will regain access to log into the mobile app and submit field reports.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUnlockTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                disabled={lockActionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
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
