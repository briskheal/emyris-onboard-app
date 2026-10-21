import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, ArrowLeft, ArrowUp, MapPin, Navigation, CheckCircle2, Search, X } from 'lucide-react';

const USER_CONTROLS_LIST = [
  {
    id: 'PUNCHING',
    title: 'PUNCHING',
    desc: 'Exclusively for Office / Admin staff: Link the Office Geo-Location inside the office. Once the user visits the office and their location matches the Admin-inserted Office Geo-Location, it automatically prompts Punch-In / Re-Punch-In and triggers Auto Punch-Out when leaving the office.'
  },
  {
    id: 'TRACKER',
    title: 'TRACKER',
    desc: 'This will allow the managers to see the Live Location of Checked-In users on Google Map.'
  },
  {
    id: 'CHECK_IN_MANDATORY',
    title: 'CHECK IN MANDATORY',
    desc: 'This feature makes it compulsory to be Checked-In for submitting Daily Call Reports.'
  },
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
  const [controls, setControls] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    const existing = user.controls || {};
    setControls({
      ...existing,
      officeName: existing.officeName || 'Corporate Office',
      officeRadius: existing.officeRadius || 50,
      officeLat: existing.officeLat ?? '',
      officeLng: existing.officeLng ?? ''
    });
  };

  // Multi-sample GPS capture for linking the Office Geo-Location
  const handleCalibrate480SqftOffice = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.', 'error');
      return;
    }
    setLocatingGps(true);
    setCalibrationStep('Capturing Office GPS Location...');

    const getSingleFix = (highAcc: boolean) =>
      new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: highAcc, timeout: highAcc ? 6000 : 10000, maximumAge: 0 }
        );
      });

    try {
      let fix: { lat: number; lng: number };
      try {
        fix = await getSingleFix(true);
      } catch {
        fix = await getSingleFix(false);
      }

      setControls((prev: any) => ({
        ...prev,
        officeLat: Number(fix.lat.toFixed(6)),
        officeLng: Number(fix.lng.toFixed(6)),
        officeRadius: prev.officeRadius || 50
      }));
      showToast('Office Geo-Location linked successfully!', 'success');
    } catch (err: any) {
      showToast(
        err?.code === 1
          ? 'Location permission denied. Please allow GPS or enter coordinates manually.'
          : 'Unable to fetch GPS location. Please enter coordinates or paste a Google Maps link.',
        'error'
      );
    } finally {
      setLocatingGps(false);
      setCalibrationStep('');
    }
  };

  const handlePasteCoordinates = (raw: string) => {
    // Support both raw "20.4625, 85.8830" and Google Maps URLs like ".../@20.462521,85.882989,17z..." or "?q=20.4625,85.8830"
    const match = raw.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      setControls((prev: any) => ({
        ...prev,
        officeLat: parseFloat(match[1]),
        officeLng: parseFloat(match[2])
      }));
      showToast(`Linked Office Geo-Location: ${match[1]}, ${match[2]}`, 'success');
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (controls.PUNCHING && (controls.officeLat === '' || controls.officeLng === '' || controls.officeLat === null || controls.officeLng === null)) {
      showToast('Please link or enter the Office Geo-Location (Latitude & Longitude) for Office Punching.', 'error');
      return;
    }
    setSaving(true);
    try {
      let normalizedControls: Record<string, any>;
      if (controls.PUNCHING) {
        const copy = { ...controls };
        delete copy.officeWifiIp;
        delete copy.requireWifiLock;
        normalizedControls = {
          ...copy,
          PUNCHING: true,
          everHadOfficePunching: true,
          officeName: (controls.officeName || 'Corporate Office').trim(),
          officeLat: controls.officeLat !== '' ? Number(controls.officeLat) : null,
          officeLng: controls.officeLng !== '' ? Number(controls.officeLng) : null,
          officeRadius: Number(controls.officeRadius || 50),
          requireWifiLock: false,
          officeWifiIp: ''
        };
      } else {
        // Admin toggled OFF PUNCHING -> remove linked office geo-location from active user controls
        const copy = { ...controls };
        delete copy.officeWifiIp;
        delete copy.requireWifiLock;
        delete copy.officeLat;
        delete copy.officeLng;
        delete copy.officeRadius;
        delete copy.officeName;
        normalizedControls = {
          ...copy,
          PUNCHING: false,
          everHadOfficePunching: Boolean(selectedUser.controls?.PUNCHING || selectedUser.controls?.everHadOfficePunching)
        };
      }
      await axios.put(`/api/admin/users/${selectedUser._id}`, { controls: normalizedControls });
      showToast(
        controls.PUNCHING
          ? `Office Geo-Location linked & saved for ${selectedUser.firstName} ${selectedUser.lastName}!`
          : `Office Punching disabled for ${selectedUser.firstName} ${selectedUser.lastName} (historical geo-presence logs preserved in DB).`,
        'success'
      );
      await fetchUsers();
      setTimeout(() => setSelectedUser(null), 600);
    } catch (e) {
      showToast('Error saving preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (selectedUser) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-300'
          }`}>
            <CheckCircle2 size={16} />
            <span>{toast.text}</span>
          </div>
        )}

        <div className="p-8 pb-4 border-b border-[#3b3b5a] flex items-center justify-between shrink-0">
          <button onClick={() => setSelectedUser(null)} className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2 hover:underline">
            <ArrowLeft size={16} /> SET PREFERENCES FOR "{selectedUser.firstName} {selectedUser.lastName}"
          </button>
          <span className="text-xs font-bold text-slate-400 bg-[#252538] px-3 py-1.5 rounded-lg border border-[#3b3b5a]">
            {selectedUser.designation || 'Staff'} • {selectedUser.hq || 'Office'}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-5">
          {USER_CONTROLS_LIST.map((ctrl) => (
            <div key={ctrl.id} className="p-4 bg-[#252538] rounded-xl border border-[#3b3b5a]/50 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-8">
                  <h3 className="text-white font-bold text-sm tracking-wide mb-1">
                    {ctrl.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{ctrl.desc}</p>
                </div>
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={!!controls[ctrl.id]}
                    onChange={(e) => setControls({ ...controls, [ctrl.id]: e.target.checked })}
                    className="w-5 h-5 accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Inline Office Geo-Location Configuration when PUNCHING is enabled */}
              {ctrl.id === 'PUNCHING' && controls.PUNCHING && (
                <div className="mt-3 pt-4 border-t border-[#3b3b5a]/70 bg-[#1b1c2b] rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <MapPin size={15} />
                      <span>Link Office Geo-Location (Auto Punch-In on Visit & Auto Punch-Out on Exit)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCalibrate480SqftOffice}
                      disabled={locatingGps}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Navigation size={13} className={locatingGps ? 'animate-spin' : ''} />
                      <span>{locatingGps ? (calibrationStep || 'Capturing...') : 'Capture Current Office Location (GPS)'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Quick Link: Paste Google Maps Link or &quot;Lat, Lng&quot; Coordinates
                    </label>
                    <input
                      type="text"
                      placeholder="Paste Google Maps URL or e.g. 20.462521, 85.882989 to auto-fill below"
                      onChange={(e) => {
                        if (e.target.value.includes(',')) {
                          handlePasteCoordinates(e.target.value);
                        }
                      }}
                      className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Office Name / Premises
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Corporate Office"
                        value={controls.officeName || ''}
                        onChange={(e) => setControls({ ...controls, officeName: e.target.value })}
                        className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Office Latitude *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 20.462521"
                        value={controls.officeLat ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes(',')) {
                            handlePasteCoordinates(val);
                          } else {
                            setControls({ ...controls, officeLat: val });
                          }
                        }}
                        className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Office Longitude *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 85.882989"
                        value={controls.officeLng ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes(',')) {
                            handlePasteCoordinates(val);
                          } else {
                            setControls({ ...controls, officeLng: val });
                          }
                        }}
                        className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Office Match Radius
                      </label>
                      <select
                        value={controls.officeRadius || 50}
                        onChange={(e) => setControls({ ...controls, officeRadius: Number(e.target.value) })}
                        className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value={25}>25 Meters (Office Room)</option>
                        <option value={50}>50 Meters (Recommended Office Floor)</option>
                        <option value={100}>100 Meters (Office Building)</option>
                        <option value={200}>200 Meters (Wide Office Zone)</option>
                        <option value={300}>300 Meters (Campus)</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    📍 <strong className="text-slate-200">Pure Geo-Location Matching (No Wi-Fi Dependency):</strong> When this employee opens the app inside the linked office location ({controls.officeRadius || 50}m radius), it immediately prompts <strong className="text-emerald-300">&quot;You are in Office. Please Punch In to Start.&quot;</strong> (or <strong className="text-emerald-300">&quot;Welcome Back. Tap to Re-Punch In&quot;</strong>) and automatically Punches Out when they leave the office location.
                  </p>
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-4 pb-12">
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

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.name || ''}`.toLowerCase();
    const desig = String(u.designation || '').toLowerCase();
    const hq = String(u.hq || '').toLowerCase();
    const empId = String(u.employeeId || u.uid || '').toLowerCase();
    return fullName.includes(q) || desig.includes(q) || hq.includes(q) || empId.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
      <div className="p-8 pb-4 border-b border-[#3b3b5a] shrink-0">
        <h2 className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={16} /> User Controls
        </h2>
      </div>

      <div className="p-8 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-800/50 py-1.5 px-3 rounded">
          SHOWING ({filteredUsers.length}) ENTRIES
        </span>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee name, HQ, designation..."
            className="w-full bg-[#252538] border border-[#3b3b5a] focus:border-sky-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a40] sticky top-0 z-10 shadow-md">
            <tr className="text-slate-300 text-[10px] uppercase tracking-wider font-bold">
              <th className="p-4 border-b border-[#3b3b5a] w-24">Sr no.</th>
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Name <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Designation <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Headquarter <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a] text-center w-24">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b3b5a]/40 text-xs">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No entries found</td></tr>
            ) : (
              filteredUsers.map((u, i) => (
                <tr key={u._id} className="hover:bg-[#252538]/80 transition-colors">
                  <td className="p-4 text-slate-400">{i + 1}</td>
                  <td className="p-4 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span>{u.firstName} {u.lastName}</span>
                      {u.controls?.PUNCHING && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Office Geo-Linked ({u.controls?.officeRadius || 50}m)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 uppercase">{u.designation || '-'}</td>
                  <td className="p-4 text-slate-400">{u.hq || '-'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleView(u)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-400/10 transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
