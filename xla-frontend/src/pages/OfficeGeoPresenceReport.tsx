import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw,
  Building2,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function OfficeGeoPresenceReport() {
  const navigate = useNavigate();

  const [officeUsers, setOfficeUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [report, setReport] = useState<any>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const fetchEligibleOfficeUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('/api/xl/reports/office-geo-analysis?mode=users');
      const list = res.data?.users || [];
      setOfficeUsers(list);
      if (list.length > 0 && !selectedUser) {
        setSelectedUser(list[0].employeeId || list[0]._id);
      }
    } catch (e) {
      console.error('Failed to load office punching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOfficeReport = async (empId?: string, dateStr?: string) => {
    const targetUser = empId || selectedUser;
    const targetDate = dateStr || selectedDate;
    if (!targetUser || !targetDate) return;

    setLoadingReport(true);
    try {
      const res = await axios.get(
        `/api/xl/reports/office-geo-analysis?employeeId=${encodeURIComponent(targetUser)}&date=${encodeURIComponent(targetDate)}`
      );
      if (res.data?.success) {
        setReport(res.data);
      } else {
        setReport(null);
      }
    } catch (e) {
      console.error('Failed to load office geo-presence report:', e);
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchEligibleOfficeUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && selectedDate) {
      fetchOfficeReport(selectedUser, selectedDate);
    }
  }, [selectedUser, selectedDate]);

  // Render 480 sq.ft Office Geo-Fence Map & Session Markers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
      const map = L.map(mapContainerRef.current, {
        center: [22.3072, 73.1812],
        zoom: 18,
        zoomControl: true,
        attributionControl: false
      });
      L.tileLayer('/api/xl/tile-proxy?lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 21
      }).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    if (!report) return;

    const officeLat = report.officePremises?.officeLat;
    const officeLng = report.officePremises?.officeLng;
    const officeRadius = Number(report.officePremises?.officeRadius) || 15;
    const boundsPoints: [number, number][] = [];

    if (officeLat != null && officeLng != null && !isNaN(officeLat) && !isNaN(officeLng)) {
      boundsPoints.push([officeLat, officeLng]);

      // Draw 480 sq.ft Office Geo-Fence Circle
      L.circle([officeLat, officeLng], {
        radius: officeRadius,
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.2
      })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;">
            <strong>${report.officePremises?.officeName || 'Office Premises (480 sq.ft)'}</strong><br/>
            Allowed Radius: <b>${officeRadius}m</b><br/>
            Center: ${Number(officeLat).toFixed(6)}, ${Number(officeLng).toFixed(6)}
          </div>`
        )
        .addTo(group);

      const officeIcon = L.divIcon({
        className: 'custom-office-center-icon',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:11px;">HQ</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([officeLat, officeLng], { icon: officeIcon })
        .bindPopup(`<b>${report.officePremises?.officeName || 'Office Center'}</b>`)
        .addTo(group);
    }

    (report.sessions || []).forEach((s: any) => {
      if (s.punchInLat != null && s.punchInLng != null && !isNaN(s.punchInLat) && !isNaN(s.punchInLng)) {
        boundsPoints.push([s.punchInLat, s.punchInLng]);
        const sIcon = L.divIcon({
          className: 'custom-session-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:10px;">#${s.sessionNo}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([s.punchInLat, s.punchInLng], { icon: sIcon })
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;">
              <strong>Session #${s.sessionNo}</strong><br/>
              Punch In: <b>${s.punchInTime}</b><br/>
              Punch Out: <b>${s.punchOutTime}</b><br/>
              Inside Duration: <b>${s.durationFormatted}</b><br/>
              Exit Mode: <b>${s.outType}</b>
            </div>`
          )
          .addTo(group);
      }
    });

    if (boundsPoints.length > 0) {
      map.setView(boundsPoints[0], 19);
    }
  }, [report]);

  const handleExportExcel = () => {
    if (!report) return;
    const rows = (report.sessions || []).map((s: any) => ({
      'Employee Name': report.user?.name || '-',
      'Designation': report.user?.designation || '-',
      'Date': report.date,
      'Session #': `#${s.sessionNo}`,
      'Office Premises': s.officeName,
      'Login / Punch-In Time': s.punchInTime,
      'Punch-Out Time': s.punchOutTime,
      'Time Spent Inside Office': s.durationFormatted,
      'Break Before Session': s.breakBeforeFormatted,
      'Distance From Office Center (m)': `${s.distanceFromOfficeMeters}m`,
      'Punch-In Coordinates': s.punchInLat && s.punchInLng ? `${s.punchInLat}, ${s.punchInLng}` : '-',
      'Punch-Out Mode': s.outType
    }));

    if (rows.length === 0) {
      rows.push({
        'Employee Name': report.user?.name || '-',
        'Designation': report.user?.designation || '-',
        'Date': report.date,
        'Session #': '-',
        'Office Premises': report.officePremises?.officeName || '-',
        'Login / Punch-In Time': 'No sessions logged',
        'Punch-Out Time': '-',
        'Time Spent Inside Office': '0m',
        'Break Before Session': '-',
        'Distance From Office Center (m)': '-',
        'Punch-In Coordinates': '-',
        'Punch-Out Mode': '-'
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Office Geo Presence');
    XLSX.writeFile(wb, `Office_Geo_Presence_${report.user?.name || 'Staff'}_${report.date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#151623] text-slate-100 p-4 md:p-6 space-y-5 font-sans">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e2032] border border-slate-800 rounded-2xl px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports/geo-location-analysis')}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sky-400 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
                Office Staff Geo-Presence & Time Log Report
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                480 SQ.FT DUAL-LOCK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated report for Office/Admin Punching users (Historical login & session logs remain preserved even if Punching / Wi-Fi is toggled OFF)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/reports/geo-location-analysis')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Switch to Field Staff Geo-Analysis
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!report}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-[#1e2032] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[280px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Select Office / Admin Staff (Active or Past Punching Users)
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-[#151623] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
            >
              {loadingUsers ? (
                <option value="">Loading Office Staff...</option>
              ) : officeUsers.length === 0 ? (
                <option value="">No users with Office Punching enabled yet</option>
              ) : (
                officeUsers.map((u) => (
                  <option key={u._id} value={u.employeeId}>
                    {u.name} ({u.designation}) — {u.isPunchingCurrentlyEnabled ? '🟢 Active Office Mode' : '⚪ Toggled Off (DB History Preserved)'}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#151623] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={() => fetchOfficeReport()}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} className={loadingReport ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* User Office Punching Status Pill */}
        {report?.user && (
          <div className="flex items-center gap-2">
            {report.user.isPunchingCurrentlyEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <MapPin size={14} /> Office Geo-Punching Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldCheck size={14} /> Punching Toggled OFF (Historical DB Logs Preserved)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1e2032] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">First Login / Last Out</p>
                <p className="text-base font-black text-white mt-1">
                  {report.summary?.firstPunchIn || '--'} <span className="text-slate-500">→</span> {report.summary?.lastPunchOut || '--'}
                </p>
                <p className="text-[11px] text-sky-400 font-semibold mt-0.5">
                  {report.officePremises?.officeName} ({report.officePremises?.officeRadius || 15}m)
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Clock size={22} />
              </div>
            </div>

            <div className="bg-[#1e2032] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Total Time Inside Office</p>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {report.summary?.totalInsideFormatted || '0m'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Logged inside 480 sq.ft premises
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Building2 size={22} />
              </div>
            </div>

            <div className="bg-[#1e2032] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Outside / Break Time</p>
                <p className="text-xl font-black text-amber-400 mt-1">
                  {report.summary?.totalBreakOutsideFormatted || '0m'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gap between Punch-Out & Re-Punch-In
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <RotateCcw size={22} />
              </div>
            </div>

            <div className="bg-[#1e2032] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Sessions & Auto Punch-Outs</p>
                <p className="text-xl font-black text-white mt-1">
                  {report.summary?.totalSessions || 0} Sessions{' '}
                  <span className="text-xs font-bold text-rose-400">
                    ({report.summary?.autoPunchOutCount || 0} Auto-Out)
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Repeated In/Out cycles
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <UserCheck size={22} />
              </div>
            </div>
          </div>

          {/* Map + Session Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 480 sq.ft Satellite Map */}
            <div className="bg-[#1e2032] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-400" />
                  480 sq.ft Office Geo-Fence Map ({report.officePremises?.officeRadius || 15}m)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {report.officePremises?.officeLat != null
                    ? `${Number(report.officePremises.officeLat).toFixed(5)}, ${Number(report.officePremises.officeLng).toFixed(5)}`
                    : 'No Coords'}
                </span>
              </div>
              <div ref={mapContainerRef} className="w-full h-[340px] bg-slate-900" />
            </div>

            {/* Session-by-Session Login & Presence Audit Table */}
            <div className="lg:col-span-2 bg-[#1e2032] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={15} className="text-sky-400" />
                  Inside-Office Session & Login History ({report.sessions?.length || 0} Sessions)
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Total Inside Office: {report.summary?.totalInsideFormatted || '0m'}
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#151623] text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Login / Punch In</th>
                      <th className="py-3 px-4">Punch Out</th>
                      <th className="py-3 px-4">Inside Duration</th>
                      <th className="py-3 px-4">Break Before</th>
                      <th className="py-3 px-4">GPS Dist</th>
                      <th className="py-3 px-4">Login GPS Fix</th>
                      <th className="py-3 px-4">Punch-Out Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {!report.sessions || report.sessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No office punch sessions recorded for {report.user?.name} on {report.date}.
                        </td>
                      </tr>
                    ) : (
                      report.sessions.map((s: any) => (
                        <tr key={s.sessionNo} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-sky-400">#{s.sessionNo}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">{s.punchInTime}</td>
                          <td className="py-3 px-4 font-semibold text-rose-400">{s.punchOutTime}</td>
                          <td className="py-3 px-4 font-extrabold text-white">{s.durationFormatted}</td>
                          <td className="py-3 px-4 text-amber-300">{s.breakBeforeFormatted}</td>
                          <td className="py-3 px-4 text-slate-300">{s.distanceFromOfficeMeters}m</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-sky-300">
                            {s.punchInLat && s.punchInLng ? `${Number(s.punchInLat).toFixed(5)}, ${Number(s.punchInLng).toFixed(5)}` : 'Office Center'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                s.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : String(s.outType).includes('Auto')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              {s.outType}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
