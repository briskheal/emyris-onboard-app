import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Users, Navigation, 
  Download, AlertCircle, Compass
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface UserItem {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  hq?: string;
}

interface TimelinePoint {
  seq: number;
  type: 'punch-in' | 'call' | 'punch-out';
  title: string;
  entityType: string;
  entityName: string;
  checkInTime: string;
  checkOutTime: string;
  lat: number | null;
  lng: number | null;
  geoAddress: string;
  meetingDurationMins: number;
  transitFromPrevMins: number;
  distanceFromPrevKm: number;
  cumulativeDistanceKm: number;
  isExtendedStoppage: boolean;
  discussion?: string;
  remarks?: string;
  productsDetailed?: string;
  samplesGiven?: string;
  rating?: number;
}

interface AnalysisSummary {
  totalDistanceKm: number;
  punchInTime: string;
  punchOutTime: string;
  totalWorkingHours: string;
  totalCalls: number;
  doctorCalls: number;
  chemistCalls: number;
  stockistCalls: number;
  totalMeetingTime: string;
  totalTransitTime: string;
  extendedStoppagesCount: number;
  hasGpsData: boolean;
}

interface AnalysisResponse {
  success: boolean;
  user: UserItem;
  date: string;
  summary: AnalysisSummary;
  timeline: TimelinePoint[];
  routePoints: TimelinePoint[];
  message?: string;
}

function toYYYYMMDD(str: string): string {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
}

export default function GeoLocationAnalysisReport() {
  const navigate = useNavigate();

  // Filters State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'osm'>('roadmap');

  // Analysis Data State
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Fetch Users for dropdown
  useEffect(() => {
    axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.data.success && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
          if (res.data.users.length > 0) {
            const first = res.data.users[0];
            setSelectedUser(first.employeeId || first._id);
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load admin users:', err);
      });
  }, []);

  // 2. Fetch Geo-Location Analysis Report
  const fetchAnalysis = async (userIdToFetch?: string, dateToFetch?: string) => {
    const targetUser = userIdToFetch || selectedUser;
    const targetDate = dateToFetch || selectedDate;
    if (!targetUser || !targetDate) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `/api/xl/reports/geo-location-analysis?employeeId=${targetUser}&date=${targetDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message || 'No analysis data found for this selection.');
        setData(null);
      }
    } catch (err: any) {
      console.error('Error fetching geo analysis:', err);
      setError(err.response?.data?.message || 'Could not fetch geo-location analysis for this user.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when user or date changes (after initial user load)
  useEffect(() => {
    if (selectedUser && selectedDate) {
      fetchAnalysis(selectedUser, selectedDate);
    }
  }, [selectedUser, selectedDate]);

  // Tile URL resolver
  const getTileUrl = (type: string) => {
    if (type === 'satellite') {
      return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    }
    if (type === 'osm') {
      return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  };

  // 3. Initialize & Update Leaflet Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous map instance if element changed or exists
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing old map instance:', e);
      }
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    }

    // Clear any residual Leaflet identifier on the DOM element
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India default
      zoom: 5,
      zoomControl: true,
      attributionControl: false
    });

    const tileUrl = getTileUrl(mapType);
    const tiles = L.tileLayer(tileUrl, { 
      maxZoom: 20,
      subdomains: mapType === 'osm' ? ['a', 'b', 'c'] : ['mt0', 'mt1', 'mt2', 'mt3']
    });
    tiles.addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    tileLayerRef.current = tiles;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Render markers and polyline
    const validPoints = (data?.routePoints || []).filter(
      p => p.lat != null && p.lng != null && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)) &&
           !(Number(p.lat) === 0 && Number(p.lng) === 0)
    );

    if (validPoints.length > 0) {
      const latLngs: [number, number][] = [];

      validPoints.forEach((point) => {
        const lat = Number(point.lat!);
        const lng = Number(point.lng!);
        latLngs.push([lat, lng]);

        let iconHtml = '';
        if (point.type === 'punch-in') {
          iconHtml = `
            <div style="background-color: #10b981; color: white; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; line-height: 1;">
              <span>IN</span>
            </div>
          `;
        } else if (point.type === 'punch-out') {
          iconHtml = `
            <div style="background-color: #ef4444; color: white; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; line-height: 1;">
              <span>OUT</span>
            </div>
          `;
        } else {
          // Doctor / Chemist stop with number badge
          const isExtended = point.isExtendedStoppage;
          const bg = isExtended ? '#f59e0b' : '#38bdf8';
          iconHtml = `
            <div style="background-color: ${bg}; color: #0f172a; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;">
              ${point.seq}
            </div>
          `;
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18]
        });

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; min-width: 200px;">
            <div style="font-weight: 800; font-size: 13px; color: ${point.type === 'punch-in' ? '#059669' : point.type === 'punch-out' ? '#dc2626' : '#0284c7'}; margin-bottom: 4px;">
              ${point.title}
            </div>
            <div style="color: #475569; margin-bottom: 2px;">
              <strong>Time:</strong> ${point.checkInTime} ${point.checkOutTime !== point.checkInTime ? `&ndash; ${point.checkOutTime}` : ''}
            </div>
            ${point.type === 'call' ? `
              <div style="color: #475569; margin-bottom: 2px;">
                <strong>Meeting Duration:</strong> ${point.meetingDurationMins} mins
              </div>
              <div style="color: #475569; margin-bottom: 2px;">
                <strong>Transit from Prev:</strong> ${point.transitFromPrevMins} mins (${point.distanceFromPrevKm} km)
              </div>
              ${point.isExtendedStoppage ? `
                <div style="background-color: #fef3c7; color: #b45309; padding: 4px 6px; border-radius: 6px; font-weight: 700; margin-top: 4px; font-size: 11px;">
                  ⚠️ Extended Stoppage / Waiting
                </div>
              ` : ''}
              ${point.remarks ? `
                <div style="margin-top: 4px; font-style: italic; color: #64748b; font-size: 11px;">
                  "${point.remarks}"
                </div>
              ` : ''}
            ` : `
              <div style="color: #475569;">
                <strong>Total Distance Covered:</strong> ${point.cumulativeDistanceKm} km
              </div>
            `}
            <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
              📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon });
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });

      // Calculate max spread
      let maxSpread = 0;
      const [lat0, lng0] = latLngs[0];
      for (let i = 1; i < latLngs.length; i++) {
        const d = Math.hypot(latLngs[i][0] - lat0, latLngs[i][1] - lng0);
        if (d > maxSpread) maxSpread = d;
      }

      // Add Polyline connecting all points if there is measurable movement
      if (latLngs.length > 1 && maxSpread > 0.0003) {
        const polyline = L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          lineJoin: 'round'
        });
        markersLayer.addLayer(polyline);

        try {
          map.fitBounds(polyline.getBounds(), {
            padding: [50, 50],
            maxZoom: 16
          });
        } catch (e) {
          map.setView(latLngs[0], 15);
        }
      } else {
        // Virtually same location or single stop
        map.setView(latLngs[0], 16);
      }
    }

    // Critical: Invalidate size after DOM has rendered so tiles immediately load!
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      try {
        map.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, [data, mapType]);

  // Export Timeline to Excel
  const handleExportExcel = () => {
    if (!data || !data.timeline || data.timeline.length === 0) {
      alert('No data available to export.');
      return;
    }

    const rows: any[][] = [];
    rows.push(['GEO-LOCATION ANALYSIS & STOPPAGE TRACKING REPORT']);
    rows.push([`User: ${data.user.name || data.user.employeeId || 'User'} (${data.user.employeeId || '--'})`, `Designation: ${data.user.designation || '--'}`, `HQ: ${data.user.hq || '--'}`]);
    rows.push([`Date: ${data.date}`, `Generated: ${new Date().toLocaleDateString()}`]);
    rows.push([]);

    rows.push(['SUMMARY OVERVIEW']);
    rows.push(['Total Distance (km)', 'Punch-In Time', 'Punch-Out Time', 'Total Working Hours', 'Total Calls', 'In-Call Time', 'Transit/Stoppage Time', 'Extended Stoppages']);
    rows.push([
      data.summary.totalDistanceKm,
      data.summary.punchInTime,
      data.summary.punchOutTime,
      data.summary.totalWorkingHours,
      data.summary.totalCalls,
      data.summary.totalMeetingTime,
      data.summary.totalTransitTime,
      data.summary.extendedStoppagesCount
    ]);
    rows.push([]);

    rows.push(['CHRONOLOGICAL JOURNEY & STOPPAGE LOG']);
    rows.push([
      'Stop #',
      'Activity / Milestone',
      'Entity Type',
      'Check-In Time',
      'Check-Out Time',
      'Meeting Stoppage (mins)',
      'Transit from Prev (mins)',
      'Leg Distance (km)',
      'Cum. Distance (km)',
      'Latitude',
      'Longitude',
      'Location / Address',
      'Stoppage Reason / Remarks'
    ]);

    data.timeline.forEach(p => {
      rows.push([
        p.seq === 0 ? 'Start' : p.type === 'punch-out' ? 'End' : p.seq,
        p.entityName,
        p.entityType,
        p.checkInTime,
        p.checkOutTime,
        p.meetingDurationMins,
        p.transitFromPrevMins,
        p.distanceFromPrevKm,
        p.cumulativeDistanceKm,
        p.lat ?? '',
        p.lng ?? '',
        p.geoAddress,
        p.remarks || p.discussion || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Geo-Location Analysis');
    const safeUserName = (data.user.name || data.user.employeeId || 'User').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Geo_Location_Analysis_${safeUserName}_${data.date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#0f1422] text-slate-100 flex flex-col font-sans pb-16">
      
      {/* Top Header */}
      <div className="bg-[#14192d] border-b border-[#232a45] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/utilities')}
            className="w-10 h-10 rounded-xl bg-[#1e243d] hover:bg-[#283152] border border-[#363e63] flex items-center justify-center text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Back to Utilities"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-sky-400 tracking-tight leading-tight flex items-center gap-2">
              <MapPin size={22} className="text-sky-400" />
              Geo-Location Analysis Report
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Punch-in to punch-out distance, doctor call locations & stoppage time analysis
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={!data || loading}
          className="h-10 px-4 bg-sky-600 hover:bg-sky-500 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition-all disabled:opacity-50 text-xs md:text-sm cursor-pointer"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export Excel</span>
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Filter Card */}
        <div className="bg-[#14192d] border border-[#363e63] rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            
            {/* User Select */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-sky-400" />
                Select Field User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-[#1e243d] border border-[#363e63] rounded-xl text-white font-semibold text-xs md:text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {users.map(u => {
                  const displayName = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.employeeId || 'User';
                  return (
                    <option key={u._id} value={u.employeeId || u._id}>
                      {displayName} ({u.employeeId || 'ID'}) {u.hq ? `- ${u.hq}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-400" />
                  Working Date
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setSelectedDate(today);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      selectedDate === new Date().toISOString().split('T')[0]
                        ? 'bg-sky-500 text-white'
                        : 'bg-[#1e243d] text-slate-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yest = new Date();
                      yest.setDate(yest.getDate() - 1);
                      setSelectedDate(yest.toISOString().split('T')[0]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#1e243d] text-slate-400 hover:text-white font-bold cursor-pointer transition-colors"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={toYYYYMMDD(selectedDate)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#1e243d] border border-[#363e63] rounded-xl text-white font-semibold text-xs md:text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Refresh Button */}
            <div>
              <button
                type="button"
                onClick={() => fetchAnalysis()}
                disabled={loading}
                className="w-full h-11 bg-sky-600 hover:bg-sky-500 rounded-xl text-white font-bold text-xs md:text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Compass size={16} />
                    <span>Run Geo Analysis</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400 animate-pulse">Calculating travel trajectory & stoppage times...</p>
          </div>
        )}

        {/* Error / No Data State */}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400 space-y-2">
            <AlertCircle size={32} className="mx-auto text-rose-400" />
            <p className="font-bold text-sm">{error}</p>
            <p className="text-xs text-slate-400">Please choose a different date or field user to see logged visits.</p>
          </div>
        )}

        {/* Report Content */}
        {!loading && data && (
          <div className="space-y-6">

            {/* Quick KPI Ribbon (Excel Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              
              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Total Distance
                </span>
                <span className="text-xl font-black text-sky-400">
                  {data.summary.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
                </span>
              </div>

              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Working Span
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {data.summary.totalWorkingHours}
                </span>
              </div>

              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Punch-In / Out
                </span>
                <span className="text-xs font-bold text-white">
                  {data.summary.punchInTime} <span className="text-slate-500">&bull;</span> {data.summary.punchOutTime}
                </span>
              </div>

              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Calls Met (DCR)
                </span>
                <span className="text-xl font-black text-indigo-400">
                  {data.summary.totalCalls} <span className="text-xs font-medium text-slate-400">({data.summary.doctorCalls} Dr, {data.summary.chemistCalls} Ch)</span>
                </span>
              </div>

              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  In-Call Meeting Time
                </span>
                <span className="text-xl font-black text-teal-400">
                  {data.summary.totalMeetingTime}
                </span>
              </div>

              <div className="bg-[#14192d] border border-[#363e63] rounded-xl p-3 shadow-md flex flex-col justify-between text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Stoppage / Waiting
                </span>
                <span className={`text-xl font-black ${data.summary.extendedStoppagesCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {data.summary.totalTransitTime}
                  {data.summary.extendedStoppagesCount > 0 && (
                    <span className="text-[10px] font-bold block text-amber-400">
                      ({data.summary.extendedStoppagesCount} flagged &gt;30m)
                    </span>
                  )}
                </span>
              </div>

            </div>

            {/* Google Maps Interactive Container */}
            <div className="bg-[#14192d] border border-[#363e63] rounded-2xl shadow-xl overflow-hidden flex flex-col">
              
              {/* Map Bar Controls */}
              <div className="px-4 py-3 bg-[#181f38] border-b border-[#363e63] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Google Map Route ({data.routePoints.length} Geotagged Stops)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mr-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Punch-In
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span> Doctor Calls
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Waiting (&gt;30m)
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Punch-Out
                    </span>
                  </div>

                  {/* Roadmap / Satellite / OpenStreet Toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-[#363e63]">
                    <button
                      type="button"
                      onClick={() => setMapType('roadmap')}
                      className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        mapType === 'roadmap' ? 'bg-sky-600 text-white' : 'bg-[#1e243d] text-slate-300 hover:bg-[#283152]'
                      }`}
                    >
                      Roadmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapType('satellite')}
                      className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        mapType === 'satellite' ? 'bg-sky-600 text-white' : 'bg-[#1e243d] text-slate-300 hover:bg-[#283152]'
                      }`}
                    >
                      Satellite
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapType('osm')}
                      className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        mapType === 'osm' ? 'bg-sky-600 text-white' : 'bg-[#1e243d] text-slate-300 hover:bg-[#283152]'
                      }`}
                    >
                      OpenStreet
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="relative w-full h-[460px] bg-[#0c101c]">
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-full" 
                  style={{ height: '460px', width: '100%', minHeight: '460px', zIndex: 1 }} 
                />
                
                {data.routePoints.length === 0 && (
                  <div className="absolute inset-0 bg-[#0c101c]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2 z-10">
                    <Navigation size={36} className="text-slate-600" />
                    <p className="text-sm font-bold text-white">No Coordinates Logged for this Day</p>
                    <p className="text-xs max-w-md text-slate-400">
                      Attendance or call reports for this date were recorded without precise GPS coordinates. Points will appear once field visits are logged with GPS enabled.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Chronological Stoppage & Journey Log (Excel-like Grid Table) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-sky-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  Chronological Journey & Stoppage Analysis Table
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {data.timeline.length} Total Sequential Milestones
                </span>
              </div>

              <div className="border border-[#363e63] rounded-lg shadow-xl overflow-x-auto">
                <table className="w-full border-collapse border border-[#363e63] text-[11px] sm:text-xs text-slate-200">
                  <thead className="bg-[#1e243d]">
                    <tr>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">
                        Stop #
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-2.5 text-left font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">
                        Activity / Doctor Name
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Type
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Check-In
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Check-Out
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
                        In-Call Time
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap">
                        Transit / Stoppage
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Leg Dist
                      </th>
                      <th className="border-r border-b border-[#363e63] px-2.5 py-2.5 text-center font-bold text-sky-300 uppercase tracking-wider whitespace-nowrap">
                        Cum Dist
                      </th>
                      <th className="border-r border-b border-[#363e63] px-3 py-2.5 text-left font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Location / Address
                      </th>
                      <th className="border-b border-[#363e63] px-3 py-2.5 text-left font-bold text-sky-300 uppercase tracking-wider">
                        Discussion / Why User Waited (Stoppage Remarks)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.timeline.map((point, idx) => {
                      const isPunchIn = point.type === 'punch-in';
                      const isPunchOut = point.type === 'punch-out';
                      const isExtended = point.isExtendedStoppage;

                      return (
                        <tr 
                          key={idx}
                          className={`border-b border-[#363e63] transition-colors ${
                            isPunchIn 
                              ? 'bg-[#10b981]/10 hover:bg-[#10b981]/15' 
                              : isPunchOut 
                              ? 'bg-[#ef4444]/10 hover:bg-[#ef4444]/15'
                              : isExtended
                              ? 'bg-[#f59e0b]/10 hover:bg-[#f59e0b]/15'
                              : 'even:bg-[#181f38] odd:bg-[#14192d] hover:bg-[#20294a]'
                          }`}
                        >
                          {/* Stop # */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-bold whitespace-nowrap">
                            {isPunchIn ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                                START
                              </span>
                            ) : isPunchOut ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black">
                                END
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 inline-flex items-center justify-center font-bold text-[11px]">
                                {point.seq}
                              </span>
                            )}
                          </td>

                          {/* Activity / Name */}
                          <td className="border-r border-[#363e63] px-3 py-2 font-semibold text-white whitespace-nowrap">
                            {point.entityName}
                          </td>

                          {/* Entity Type */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center text-slate-400 whitespace-nowrap text-[11px]">
                            {point.entityType}
                          </td>

                          {/* Check-In */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-medium text-slate-200 whitespace-nowrap">
                            {point.checkInTime}
                          </td>

                          {/* Check-Out */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-medium text-slate-200 whitespace-nowrap">
                            {point.checkOutTime}
                          </td>

                          {/* In-Call Meeting Duration */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-bold text-emerald-400 whitespace-nowrap">
                            {point.type === 'call' ? `${point.meetingDurationMins}m` : '--'}
                          </td>

                          {/* Transit / Stoppage Duration */}
                          <td className={`border-r border-[#363e63] px-2.5 py-2 text-center font-bold whitespace-nowrap ${
                            isExtended ? 'text-amber-400 font-black' : 'text-slate-300'
                          }`}>
                            {point.transitFromPrevMins > 0 ? (
                              <span>
                                {point.transitFromPrevMins}m
                                {isExtended && <span className="ml-1 text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">WAIT</span>}
                              </span>
                            ) : '--'}
                          </td>

                          {/* Leg Distance */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-medium text-slate-300 whitespace-nowrap">
                            {point.distanceFromPrevKm > 0 ? `${point.distanceFromPrevKm} km` : '--'}
                          </td>

                          {/* Cumulative Distance */}
                          <td className="border-r border-[#363e63] px-2.5 py-2 text-center font-bold text-sky-300 whitespace-nowrap">
                            {point.cumulativeDistanceKm} km
                          </td>

                          {/* Geo Address */}
                          <td className="border-r border-[#363e63] px-3 py-2 text-slate-300 text-[11px] max-w-xs truncate" title={point.geoAddress}>
                            {point.geoAddress || (point.lat && point.lng ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : '--')}
                          </td>

                          {/* Stoppage Reason / Discussion */}
                          <td className="px-3 py-2 text-slate-300 text-[11px]">
                            {isExtended && (
                              <div className="text-amber-400 font-bold text-[10px] uppercase mb-0.5">
                                ⚠️ Extended Stoppage ({point.transitFromPrevMins} mins with minimal travel)
                              </div>
                            )}
                            <span>{point.remarks || point.discussion || 'Routine field visit'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
