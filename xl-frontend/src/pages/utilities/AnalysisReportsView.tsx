import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, BarChart3, RefreshCw, MapPin, Navigation, Target, Users, Calendar, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalysisReportsView() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [activeTab, setActiveTab] = useState<'effort' | 'geo' | 'kpi'>('effort');
  const [month, setMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [year, setYear] = useState<string>(String(now.getFullYear()));
  const [geoDate, setGeoDate] = useState<string>(now.toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [effortData, setEffortData] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);

  const fetchTabContent = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    try {
      if (activeTab === 'effort') {
        const res = await axios.get('/api/xl/performance/effort-matrix', {
          params: { employeeId: selectedUser.employeeId, month, year }
        });
        if (res.data?.success) setEffortData(res.data);
      } else if (activeTab === 'geo') {
        const res = await axios.get('/api/xl/reports/geo-location-analysis', {
          params: { employeeId: selectedUser.employeeId, date: geoDate }
        });
        if (res.data?.success) setGeoData(res.data);
      } else if (activeTab === 'kpi') {
        const fullMonth = new Date(Number(year), MONTHS.indexOf(month), 1)
          .toLocaleString('en-US', { month: 'long' })
          .toLowerCase();
        const res = await axios.get('/api/xl/performance/my', {
          params: { email: selectedUser.employeeId, month: fullMonth, year }
        });
        if (res.data?.success) setKpiData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchTabContent();
    }
  }, [selectedUser?.employeeId, activeTab, month, year, geoDate]);

  const effortSummary = effortData?.summary || {};
  const geoSummary = geoData?.summary || {};
  const geoTimeline = geoData?.timeline || [];

  const parseKpiCount = (raw: any) => {
    try {
      const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(p) ? p.length : 0;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24 text-white font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/utilities')}
            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-wide flex items-center gap-1.5">
              <BarChart3 size={16} className="text-indigo-400" />
              ANALYSIS <span className="text-indigo-400">REPORTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Effort, Geo-Route & KPI Performance Analysis</p>
          </div>
        </div>
        <button
          onClick={fetchTabContent}
          className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab('effort')}
            className={`py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'effort' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'
            }`}
          >
            Effort Coverage
          </button>
          <button
            onClick={() => setActiveTab('geo')}
            className={`py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'geo' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'
            }`}
          >
            Geo-Route
          </button>
          <button
            onClick={() => setActiveTab('kpi')}
            className={`py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'kpi' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'
            }`}
          >
            KPI Matrix
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'geo' ? (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Activity Date</label>
            <input
              type="date"
              value={geoDate}
              onChange={(e) => setGeoDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
              >
                {['2024', '2025', '2026', '2027', '2028'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
            <span className="text-xs font-semibold">Loading analysis...</span>
          </div>
        ) : activeTab === 'effort' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Doctors</div>
                <div className="text-lg font-black text-white mt-0.5">{effortSummary.totalDoctors || 0}</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Doctors Met</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{effortSummary.totalDoctorsMet || 0}</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Coverage %</div>
                <div className="text-lg font-black text-sky-400 mt-0.5">{effortSummary.coverage || '0%'}</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Compliance %</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{effortSummary.compliance || '0%'}</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Category Breakdown</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-[10px] text-purple-300 font-bold">Super Core</div>
                  <div className="text-sm font-black text-white mt-1">{effortSummary.totalSuperCore || '0/0'}</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-[10px] text-amber-300 font-bold">Core</div>
                  <div className="text-sm font-black text-white mt-1">{effortSummary.totalCore || '0/0'}</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700/50">
                  <div className="text-[10px] text-slate-300 font-bold">Non-Core</div>
                  <div className="text-sm font-black text-white mt-1">{effortSummary.totalNonCore || '0/0'}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/extras/performance/effort?month=${month}&year=${year}`)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span>Open Full Week-wise Effort Matrix</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : activeTab === 'geo' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3">
                <div className="text-sm font-black text-sky-400">{geoSummary.totalDistanceKm || 0} km</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Distance</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3">
                <div className="text-sm font-black text-emerald-400">{geoSummary.totalCalls || 0}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">GPS Calls</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-3">
                <div className="text-sm font-black text-amber-400">{geoSummary.totalWorkingHours || '0h 0m'}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Work Time</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Navigation size={14} /> Daily Route Timeline
              </h3>
              {geoTimeline.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No GPS route points recorded for this date.
                </div>
              ) : (
                <div className="space-y-2">
                  {geoTimeline.map((pt: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {pt.seq || i + 1}
                          </span>
                          <span className="font-bold text-white truncate">{pt.title || pt.entityName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 pl-6 truncate">{pt.geoAddress || '-'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-sky-400 block">{pt.checkInTime || '-'}</span>
                        {pt.distanceFromPrevKm > 0 && (
                          <span className="text-[9px] text-emerald-400 font-bold">+{pt.distanceFromPrevKm} km</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                5-Pillar KPI Planning & Achievement
              </h3>
              {[
                { id: 'brand', label: 'Product Wise Analysis', count: parseKpiCount(kpiData?.brandData) },
                { id: 'account', label: 'Account Wise Analysis', count: parseKpiCount(kpiData?.accountData) },
                { id: 'keyCustomer', label: 'Key Customer Analysis', count: parseKpiCount(kpiData?.keyCustomerData) },
                { id: 'roi', label: 'Customer ROI Analysis', count: parseKpiCount(kpiData?.roiData) },
                { id: 'outstanding', label: 'Outstanding Analysis', count: parseKpiCount(kpiData?.outstandingData) },
              ].map((k) => (
                <button
                  key={k.id}
                  onClick={() => navigate(`/extras/performance/targets/${k.id}`)}
                  className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">{k.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      {k.count} Entries
                    </span>
                    <ChevronRight size={15} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
