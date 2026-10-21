import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, ArrowLeft, ArrowUp, MapPin, Navigation, CheckCircle2, Wifi } from 'lucide-react';

const USER_CONTROLS_LIST = [
  {
    id: 'PUNCHING',
    title: 'PUNCHING',
    desc: 'Exclusively for Office / Admin staff (480 sq.ft Office Dual-Lock): Geo-tags the office center + locks to Office Wi-Fi IP, allows repeated Punch-In & Punch-Out while inside the office, and automatically Punches Out when leaving the office to log exact time spent inside.'
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
  const [detectingWifi, setDetectingWifi] = useState(false);
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
      officeName: existing.officeName || 'Corporate Office (480 sq.ft)',
      officeRadius: existing.officeRadius || 15,
      officeLat: existing.officeLat ?? '',
      officeLng: existing.officeLng ?? '',
      officeWifiIp: existing.officeWifiIp || '',
      requireWifiLock: existing.requireWifiLock !== undefined ? Boolean(existing.requireWifiLock) : Boolean(existing.officeWifiIp)
    });
  };

  const handleDetectOfficeWifiIp = async () => {
    setDetectingWifi(true);
    try {
      const res = await axios.get('/api/xl/office-network-info');
      const ip = res.data?.clientIp || '';
      if (ip) {
        setControls((prev: any) => ({
          ...prev,
          officeWifiIp: ip,
          requireWifiLock: true
        }));
        showToast(`Bound to Office Wi-Fi Public IP: ${ip}`, 'success');
      } else {
        showToast('Could not detect public IP.', 'error');
      }
    } catch (e) {
      showToast('Failed to detect Office Wi-Fi IP.', 'error');
    } finally {
      setDetectingWifi(false);
    }
  };

  // Multi-sample 5x GPS averaging + Wi-Fi IP lock for 480 sq.ft (20ft x 24ft) office calibration
  const handleCalibrate480SqftOffice = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.', 'error');
      return;
    }
    setLocatingGps(true);
    setCalibrationStep('Capturing Wi-Fi IP & GPS Sample 1/3...');

    // Also auto-detect current Office Wi-Fi IP if connected
    try {
      const netRes = await axios.get('/api/xl/office-network-info');
      if (netRes.data?.clientIp) {
        setControls((prev: any) => ({
          ...prev,
          officeWifiIp: prev.officeWifiIp || netRes.data.clientIp
        }));
      }
    } catch {}

    const samples: { lat: number; lng: number }[] = [];
    const getSingleFix = () =>
      new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

    try {
      for (let i = 1; i <= 3; i++) {
        setCalibrationStep(`Calibrating 480 sq.ft Center (${i}/3)...`);
        const fix = await getSingleFix();
        samples.push(fix);
        if (i < 3) await new Promise((r) => setTimeout(r, 600));
      }
      const avgLat = samples.reduce((s, p) => s + p.lat, 0) / samples.length;
      const avgLng = samples.reduce((s, p) => s + p.lng, 0) / samples.length;

      setControls((prev: any) => ({
        ...prev,
        officeLat: Number(avgLat.toFixed(6)),
        officeLng: Number(avgLng.toFixed(6)),
        officeRadius: prev.officeRadius || 15
      }));
      showToast('480 sq.ft Office Center calibrated (3x High-Accuracy GPS Average)!', 'success');
    } catch (err: any) {
      showToast(
        err?.code === 1
          ? 'Location permission denied. Please allow GPS or enter coordinates manually.'
          : 'Unable to fetch GPS location.',
        'error'
      );
    } finally {
      setLocatingGps(false);
      setCalibrationStep('');
    }
  };

  const handlePasteCoordinates = (raw: string) => {
    const match = raw.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      setControls((prev: any) => ({
        ...prev,
        officeLat: parseFloat(match[1]),
        officeLng: parseFloat(match[2])
      }));
      showToast(`Parsed coordinates: ${match[1]}, ${match[2]}`, 'success');
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (controls.PUNCHING && (!controls.officeLat || !controls.officeLng)) {
      showToast('Please set or calibrate the Office GPS Latitude & Longitude for Geo-Tagged Office Punching.', 'error');
      return;
    }
    setSaving(true);
    try {
      let normalizedControls: Record<string, any>;
      if (controls.PUNCHING) {
        normalizedControls = {
          ...controls,
          PUNCHING: true,
          everHadOfficePunching: true,
          officeLat: controls.officeLat !== '' ? Number(controls.officeLat) : null,
          officeLng: controls.officeLng !== '' ? Number(controls.officeLng) : null,
          officeRadius: Number(controls.officeRadius || 15),
          officeWifiIp: (controls.officeWifiIp || '').trim(),
          requireWifiLock: Boolean(controls.requireWifiLock && (controls.officeWifiIp || '').trim())
        };
      } else {
        // Admin toggled OFF PUNCHING -> remove all Wi-Fi credentials & office geo-lock from active user controls
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
          ? `Office Punching & Wi-Fi Lock saved for ${selectedUser.firstName} ${selectedUser.lastName}!`
          : `Office Punching disabled & Wi-Fi credentials removed for ${selectedUser.firstName} ${selectedUser.lastName} (login & geo logs preserved in DB).`,
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

              {/* Inline 480 sq.ft Dual-Lock Office Configuration when PUNCHING is enabled */}
              {ctrl.id === 'PUNCHING' && controls.PUNCHING && (
                <div className="mt-3 pt-4 border-t border-[#3b3b5a]/70 bg-[#1b1c2b] rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <MapPin size={15} />
                      <span>Lock #1: 480 sq.ft Office Micro-GPS Geo-Tag (Auto Punch-Out & Time Log)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCalibrate480SqftOffice}
                      disabled={locatingGps}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Navigation size={13} className={locatingGps ? 'animate-spin' : ''} />
                      <span>{locatingGps ? (calibrationStep || 'Calibrating...') : 'Calibrate 480 sq.ft Office Center (3x GPS)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Office Name / Premises
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Corporate Office (480 sq.ft)"
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
                        placeholder="e.g. 22.307159"
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
                        placeholder="e.g. 73.181219"
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
                        Allowed Radius (Meters)
                      </label>
                      <select
                        value={controls.officeRadius || 15}
                        onChange={(e) => setControls({ ...controls, officeRadius: Number(e.target.value) })}
                        className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value={15}>15 Meters (480 sq.ft Office Room)</option>
                        <option value={25}>25 Meters (480 sq.ft + Indoor Buffer)</option>
                        <option value={50}>50 Meters (Strict Building)</option>
                        <option value={100}>100 Meters (Standard Office)</option>
                        <option value={250}>250 Meters (Campus)</option>
                      </select>
                    </div>
                  </div>

                  {/* Lock #2: Office Wi-Fi Router IP Lock for Exact 480 sq.ft Room Presence */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!controls.requireWifiLock}
                          onChange={(e) => setControls({ ...controls, requireWifiLock: e.target.checked })}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <Wifi size={14} />
                          Lock #2: Require 480 sq.ft Office Wi-Fi Router Connection (Auto Punch-Out on Wi-Fi Disconnect)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectOfficeWifiIp}
                        disabled={detectingWifi}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Wifi size={13} />
                        <span>{detectingWifi ? 'Detecting...' : 'Bind Current Office Wi-Fi IP'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Office Wi-Fi Public IP (or comma-separated IPs)
                        </label>
                        <input
                          type="text"
                          placeholder="Click 'Bind Current Office Wi-Fi IP' while on Office Wi-Fi"
                          value={controls.officeWifiIp || ''}
                          onChange={(e) =>
                            setControls({
                              ...controls,
                              officeWifiIp: e.target.value,
                              requireWifiLock: e.target.value.trim() ? true : controls.requireWifiLock
                            })
                          }
                          className="w-full bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        🔒 <strong className="text-slate-200">480 sq.ft Exact Room Lock:</strong> When enabled, staff must be connected to the Office Wi-Fi and inside the {controls.officeRadius || 15}m GPS zone to Punch In. Walking out of the 480 sq.ft office (disconnecting from Wi-Fi or stepping outside {controls.officeRadius || 15}m) automatically triggers <strong className="text-amber-300">Auto Punch-Out</strong>.
                      </p>
                    </div>
                  </div>
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d]">
      <div className="p-8 pb-4 border-b border-[#3b3b5a] shrink-0">
        <h2 className="text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={16} /> User Controls
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
              <th className="p-4 border-b border-[#3b3b5a]"><div className="flex items-center gap-2">Headquarter <ArrowUp size={12}/></div></th>
              <th className="p-4 border-b border-[#3b3b5a] text-center w-24">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b3b5a]/40 text-xs">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No entries found</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u._id} className="hover:bg-[#252538]/80 transition-colors">
                  <td className="p-4 text-slate-400">{i + 1}</td>
                  <td className="p-4 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span>{u.firstName} {u.lastName}</span>
                      {u.controls?.PUNCHING && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Office Punching ({u.controls?.officeRadius || 15}m{u.controls?.requireWifiLock ? ' + Wi-Fi' : ''})
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
