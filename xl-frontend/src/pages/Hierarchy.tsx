import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Users, Search, X, Phone, MessageSquare, Mail, 
  MapPin, Building2, UserCheck, Banknote, Shield, RefreshCw, 
  ExternalLink, ChevronRight
} from 'lucide-react';

interface HierarchyUser {
  _id?: string;
  employeeId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  designation: string;
  level?: number;
  badge?: string;
  hq?: string;
  division?: string;
  phone?: string;
  email?: string;
  reportingManager?: string;
  dailyAllowance?: number | string;
  exStationAllowance?: number | string;
  outStationAllowance?: number | string;
  address?: string;
  status?: string;
}

export default function Hierarchy() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<HierarchyUser | null>(null);
  const [manager, setManager] = useState<any>(null);
  const [team, setTeam] = useState<HierarchyUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'nsm' | 'zsm' | 'rsm' | 'asm' | 'tbm'>('all');
  const [selectedProfile, setSelectedProfile] = useState<HierarchyUser | null>(null);
  const [profileTab, setProfileTab] = useState<'general' | 'extra'>('general');

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('xl_user') || localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      const empId = u?.employeeId || u?.email || '';

      const res = await axios.get(`/api/xl/user/hierarchy?employeeId=${encodeURIComponent(empId)}`);
      if (res.data?.success) {
        if (res.data.user) {
          setCurrentUser(res.data.user);
        } else if (u) {
          setCurrentUser({
            employeeId: u.employeeId || 'EMPHO',
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User',
            designation: u.designation || 'ADMIN',
            hq: u.hq || 'Corporate',
            division: u.division || 'CRITIZA',
            phone: u.phone || '',
            email: u.email || '',
            reportingManager: u.reportingManager || 'Management'
          });
        }
        setManager(res.data.manager || null);
        setTeam(res.data.reportees || []);
      }
    } catch (e) {
      console.error('Failed to load hierarchy', e);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge?: string, desig?: string) => {
    const d = (desig || badge || '').toLowerCase();
    if (d.includes('gm') || d.includes('general manager') || d.includes('admin')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    if (d.includes('national') || d.includes('nsm')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    if (d.includes('sales manager') && !d.includes('area') && !d.includes('zonal')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
    if (d.includes('zonal') || d.includes('zsm')) {
      return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
    if (d.includes('regional') || d.includes('rsm')) {
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
    if (d.includes('area') || d.includes('asm')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (d.includes('product manager') || d.includes('pm')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  const filteredTeam = team.filter(member => {
    // Level tab filter
    if (activeTab !== 'all') {
      const d = (member.designation || '').toLowerCase();
      if (activeTab === 'nsm' && !d.includes('national') && !d.includes('nsm')) return false;
      if (activeTab === 'zsm' && !d.includes('zonal') && !d.includes('zsm')) return false;
      if (activeTab === 'rsm' && !d.includes('regional') && !d.includes('rsm')) return false;
      if (activeTab === 'asm' && !d.includes('area') && !d.includes('asm')) return false;
      if (activeTab === 'tbm' && !d.includes('territory') && !d.includes('tbm')) return false;
    }

    // Search filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = (member.name || '').toLowerCase();
    const desig = (member.designation || '').toLowerCase();
    const hq = (member.hq || '').toLowerCase();
    const empId = (member.employeeId || '').toLowerCase();
    const rm = (member.reportingManager || '').toLowerCase();
    return name.includes(q) || desig.includes(q) || hq.includes(q) || empId.includes(q) || rm.includes(q);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PROFILE VIEW (MEDORN WAY - NEXT PAGE / DRILL DOWN WITH GENERAL & EXTRA INFO)
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedProfile) {
    const isSelf = currentUser && (selectedProfile.employeeId === currentUser.employeeId);
    const cleanPhone = (selectedProfile.phone || '').replace(/[^0-9+]/g, '');

    return (
      <div className="min-h-full bg-slate-800 pb-24 text-slate-100 font-sans">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/60 sticky top-0 z-30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedProfile(null)}
            className="w-9 h-9 bg-slate-700/60 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white tracking-wide">Profile</h1>
          <div className="w-9" />
        </div>

        <div className="px-5 py-6 flex flex-col items-center">
          {/* Large Avatar */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-900 border-2 border-sky-400/60 shadow-2xl flex items-center justify-center text-2xl font-bold text-white">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name || 'User')}&background=0f172a&color=38bdf8&size=180&bold=true`}
                alt={selectedProfile.name}
                className="w-full h-full object-cover"
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-800 rounded-full" title="Active" />
          </div>

          {/* User Name & Designation */}
          <h2 className="text-xl font-bold text-white tracking-tight text-center">
            {selectedProfile.name} {isSelf && <span className="text-xs text-sky-400 font-semibold">(You)</span>}
          </h2>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest mt-1 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-center">
            {selectedProfile.designation || 'TEAM MEMBER'}
          </span>

          {/* Quick Communication Actions */}
          {cleanPhone && (
            <div className="flex items-center gap-3 mt-4">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
              >
                <Phone size={14} /> Call
              </a>
              <a
                href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 text-xs font-bold transition-all active:scale-95"
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
              {selectedProfile.email && (
                <a
                  href={`mailto:${selectedProfile.email}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all active:scale-95"
                >
                  <Mail size={14} /> Email
                </a>
              )}
            </div>
          )}

          {/* Pill Tabs: General | Extra Info (Matching MEDORN UI) */}
          <div className="w-full max-w-sm mt-6 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex gap-1">
            <button
              type="button"
              onClick={() => setProfileTab('general')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                profileTab === 'general'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setProfileTab('extra')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                profileTab === 'extra'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Extra Info
            </button>
          </div>

          {/* Tab Content */}
          <div className="w-full max-w-sm mt-5 space-y-3">
            {profileTab === 'general' ? (
              <>
                {/* Division */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Division</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white mt-0.5">
                    <Building2 size={16} className="text-sky-400 shrink-0" />
                    <span>{selectedProfile.division || 'CRITIZA'}</span>
                  </div>
                </div>

                {/* Headquarter */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Headquarter</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white mt-0.5">
                    <MapPin size={16} className="text-rose-400 shrink-0" />
                    <span>{selectedProfile.hq || 'Corporate HQ'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Phone</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                      <Phone size={16} className="text-emerald-400 shrink-0" />
                      <span>{selectedProfile.phone || 'N/A'}</span>
                    </div>
                    {cleanPhone && (
                      <a href={`tel:${cleanPhone}`} className="text-xs text-sky-400 hover:text-sky-300 font-semibold">
                        Call now
                      </a>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Email</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-white min-w-0">
                      <Mail size={16} className="text-amber-400 shrink-0" />
                      <span className="truncate">{selectedProfile.email || 'N/A'}</span>
                    </div>
                    {selectedProfile.email && (
                      <a href={`mailto:${selectedProfile.email}`} className="text-xs text-sky-400 hover:text-sky-300 font-semibold shrink-0 ml-2">
                        Send
                      </a>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Address</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white mt-0.5">
                    <MapPin size={16} className="text-violet-400 shrink-0" />
                    <span>{selectedProfile.address || selectedProfile.hq || 'Hyderabad, Telangana'}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Reporting Manager */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Reporting Manager</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white mt-0.5">
                    <UserCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>{selectedProfile.reportingManager || manager?.name || 'Corporate Management'}</span>
                  </div>
                </div>

                {/* Daily Allowance */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Daily Allowance</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-400 mt-0.5">
                    <Banknote size={16} className="text-emerald-400 shrink-0" />
                    <span>₹{selectedProfile.dailyAllowance ?? 350}</span>
                  </div>
                </div>

                {/* Ex-Station Allowance */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Ex-Station Allowance</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-400 mt-0.5">
                    <Banknote size={16} className="text-emerald-400 shrink-0" />
                    <span>₹{selectedProfile.exStationAllowance ?? 370}</span>
                  </div>
                </div>

                {/* Out-Station Allowance */}
                <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-4 flex flex-col gap-1 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400">Out-Station Allowance</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white mt-0.5">
                    <Banknote size={16} className="text-sky-400 shrink-0" />
                    <span>{selectedProfile.outStationAllowance ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Employee ID & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-3.5 shadow-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Employee ID</span>
                    <span className="text-xs font-mono font-bold text-white mt-0.5 block truncate">
                      {selectedProfile.employeeId || 'EMYHO'}
                    </span>
                  </div>
                  <div className="bg-slate-700/70 border border-slate-600/60 rounded-2xl p-3.5 shadow-md">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Account Status</span>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                      Active
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MAIN HIERARCHY LIST VIEW (THE MEDORN WAY & BETTER)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-slate-800 pb-24 text-slate-100 font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/60 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-slate-700/60 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">My Hierarchy</h1>
            <p className="text-[11px] text-slate-400">
              {team.length} team member{team.length === 1 ? '' : 's'} in organogram
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHierarchy}
          className="w-9 h-9 bg-slate-700/60 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
          title="Refresh Hierarchy"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-sky-400' : ''} />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* TOP HIGHLIGHT CARD: CURRENT USER (Green border matching MEDORN) */}
        {currentUser && (
          <div
            onClick={() => setSelectedProfile(currentUser)}
            className="bg-slate-900/90 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-4 shadow-xl cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-400 shadow-md flex items-center justify-center shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=0f172a&color=10b981&size=120&bold=true`}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate">
                    {currentUser.name} <span className="text-xs text-emerald-400 font-semibold">(You)</span>
                  </h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    Current
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-300 uppercase mt-0.5 truncate">
                  {currentUser.designation || 'MANAGER'}
                </div>
                <div className="text-[10px] text-sky-400 font-medium mt-0.5 truncate">
                  HQ: {currentUser.hq || 'Corporate'} • {currentUser.division || 'CRITIZA'}
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-400 shrink-0" />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, designation, HQ, employee ID..."
            className="w-full bg-slate-900/60 border border-slate-700/70 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Level Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'nsm', label: 'NSM' },
            { id: 'zsm', label: 'ZSM' },
            { id: 'rsm', label: 'RSM' },
            { id: 'asm', label: 'ASM' },
            { id: 'tbm', label: 'TBM' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-700/60 text-slate-300 border border-slate-600/50 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Downline Hierarchy List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw size={28} className="text-sky-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading organizational organogram...</p>
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users size={36} className="mx-auto text-slate-500 opacity-60" />
            <p className="text-xs font-bold text-slate-300">
              {searchTerm ? 'No matching team members found' : 'No subordinate members found in organogram'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTeam.map((member, idx) => {
              const badgeClass = getBadgeColor(member.badge, member.designation);
              const cleanPhone = (member.phone || '').replace(/[^0-9+]/g, '');

              return (
                <div
                  key={member.employeeId || member._id || idx}
                  onClick={() => setSelectedProfile(member)}
                  className="bg-slate-700/80 hover:bg-slate-700 border border-slate-600/60 rounded-2xl p-3.5 shadow-md cursor-pointer transition-all active:scale-[0.99] flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-500/40 shadow-sm flex items-center justify-center text-sm font-bold text-white shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=1e293b&color=38bdf8&bold=true`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {member.name}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${badgeClass}`}>
                        {member.badge || member.designation.substring(0, 7)}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-tight mt-0.5 truncate">
                      {member.designation}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Reporting Manager: <strong className="text-slate-200">{member.reportingManager || '-'}</strong>
                    </div>

                    <div className="text-[10px] text-sky-400 font-medium mt-0.5">
                      HQ: {member.hq || '-'} • {member.division || 'CRITIZA'}
                    </div>
                  </div>

                  {/* Quick Action Icons */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="w-8 h-8 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all active:scale-95"
                        title="Call"
                      >
                        <Phone size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProfile(member)}
                      className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                      title="View Profile"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}