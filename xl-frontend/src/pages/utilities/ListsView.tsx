import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, List, RefreshCw, Search, Download, MapPin, Phone, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

type ListTab = 'doctors' | 'chemists' | 'stockists' | 'call-plans' | 'products' | 'routes' | 'holidays';

function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function ListsView() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [activeTab, setActiveTab] = useState<ListTab>('doctors');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs: { id: ListTab; label: string }[] = [
    { id: 'doctors', label: 'Doctors' },
    { id: 'chemists', label: 'Chemists' },
    { id: 'stockists', label: 'Stockists' },
    { id: 'call-plans', label: 'Call Plans' },
    { id: 'products', label: 'Products' },
    { id: 'routes', label: 'Routes' },
    { id: 'holidays', label: 'Holidays' },
  ];

  const fetchList = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    try {
      let res;
      if (activeTab === 'doctors') {
        res = await axios.get('/api/xl/reports/doctors', { params: { employeeId: selectedUser.employeeId } });
      } else if (activeTab === 'chemists') {
        res = await axios.get('/api/xl/reports/chemists', { params: { employeeId: selectedUser.employeeId } });
      } else if (activeTab === 'stockists') {
        res = await axios.get('/api/xl/reports/stockists', { params: { employeeId: selectedUser.employeeId } });
      } else if (activeTab === 'call-plans') {
        res = await axios.get('/api/xl/reports/call-plans', {
          params: { employeeId: selectedUser.employeeId, month, year }
        });
      } else if (activeTab === 'products') {
        res = await axios.get('/api/xl/reports/products');
      } else if (activeTab === 'routes') {
        res = await axios.get('/api/xl/reports/routes', { params: { employeeId: selectedUser.employeeId } });
      } else if (activeTab === 'holidays') {
        res = await axios.get('/api/xl/settings/holidays');
      }

      if (res?.data?.success || res?.data?.data) {
        setItems(res.data.data || []);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchList();
    }
  }, [selectedUser?.employeeId, activeTab, month, year]);

  const filteredItems = items.filter((it: any) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (it.name && it.name.toLowerCase().includes(s)) ||
      (it.businessName && it.businessName.toLowerCase().includes(s)) ||
      (it.productName && it.productName.toLowerCase().includes(s)) ||
      (it.hospital && it.hospital.toLowerCase().includes(s)) ||
      (it.workingArea && it.workingArea.toLowerCase().includes(s)) ||
      (it.headquarter && it.headquarter.toLowerCase().includes(s)) ||
      (it.fromCity && it.fromCity.toLowerCase().includes(s)) ||
      (it.toCity && it.toCity.toLowerCase().includes(s)) ||
      (it.title && it.title.toLowerCase().includes(s)) ||
      (it.date && it.date.includes(s))
    );
  });

  const handleExport = () => {
    if (!filteredItems.length) return;
    let rows: any[] = [];
    if (activeTab === 'doctors') {
      rows = filteredItems.map((d, i) => ({
        'Sr No': i + 1,
        'Doctor Name': d.name,
        'Category': d.category || '-',
        'Degree': d.degree || '-',
        'Specialization': d.specialization || '-',
        'Hospital': d.hospital || '-',
        'Working Area': d.workingArea || '-',
        'Headquarter': d.headquarter || '-',
        'Mobile': d.mobile || '-'
      }));
    } else if (activeTab === 'chemists' || activeTab === 'stockists') {
      rows = filteredItems.map((c, i) => ({
        'Sr No': i + 1,
        'Business Name': c.businessName || c.name,
        'Contact Person': c.proprietorName || c.name || '-',
        'Working Area': c.workingArea || '-',
        'Headquarter': c.headquarter || '-',
        'Mobile': c.mobile || '-'
      }));
    } else if (activeTab === 'call-plans') {
      filteredItems.forEach((p) => {
        (p.doctors || []).forEach((doc: any, idx: number) => {
          rows.push({
            'Date': formatDDMMYYYY(p.date),
            'Day': p.dayOfWeek,
            'User': p.userName,
            'HQ': p.headquarter,
            'Visit #': idx + 1,
            'Doctor Name': doc.name,
            'Category': doc.category,
            'Hospital': doc.hospital,
            'Working Area': doc.workingArea
          });
        });
      });
    } else if (activeTab === 'products') {
      rows = filteredItems.map((p, i) => ({
        'Sr No': i + 1,
        'Product Name': p.productName || p.name,
        'Category': p.category || '-',
        'Packaging': p.packaging || '-',
        'MRP': p.mrp || 0,
        'PTR': p.ptr || 0,
        'PTS': p.pts || 0
      }));
    } else {
      rows = filteredItems;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
    XLSX.writeFile(wb, `${activeTab}_list_${selectedUser?.hq || 'export'}.xlsx`);
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
              <List size={16} className="text-sky-400" />
              MASTER <span className="text-sky-400">LISTS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Doctors, Chemists, Stockists, Call Plans & more</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95"
            title="Download Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchList}
            className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        {/* Horizontal Scrollable Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearch(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Call Plans Month/Year filter */}
        {activeTab === 'call-plans' && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${activeTab.replace('-', ' ')}...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Showing <strong className="text-white">{filteredItems.length}</strong> records</span>
          {selectedUser?.hq && <span>HQ: <strong className="text-sky-400">{selectedUser.hq}</strong></span>}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-sky-400" />
            <span className="text-xs font-semibold">Loading {activeTab}...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No records found in {activeTab.replace('-', ' ')}.
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === 'doctors' && filteredItems.map((d: any, i: number) => (
              <div key={d._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white">{d.name}</h4>
                    <p className="text-[10px] text-slate-400">
                      {[d.degree, d.specialization].filter(Boolean).join(' • ') || 'Doctor'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-bold">
                    {d.category || 'General'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  {d.hospital && <span>🏥 {d.hospital}</span>}
                  {d.workingArea && <span>📍 {d.workingArea}</span>}
                  {d.mobile && <span>📞 {d.mobile}</span>}
                </div>
              </div>
            ))}

            {(activeTab === 'chemists' || activeTab === 'stockists') && filteredItems.map((c: any, i: number) => (
              <div key={c._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white">{c.businessName || c.name}</h4>
                    {c.proprietorName && <p className="text-[10px] text-slate-400">Prop: {c.proprietorName}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[9px] font-bold">
                    {c.headquarter || '-'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  {c.workingArea && <span>📍 {c.workingArea}</span>}
                  {c.mobile && <span>📞 {c.mobile}</span>}
                </div>
              </div>
            ))}

            {activeTab === 'call-plans' && filteredItems.map((p: any, i: number) => {
              const isExp = expandedId === p._id;
              return (
                <div key={p._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl overflow-hidden">
                  <div
                    onClick={() => setExpandedId(isExp ? null : p._id)}
                    className="p-3.5 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white font-mono">{formatDDMMYYYY(p.date)}</span>
                        <span className="text-[10px] font-bold text-sky-400">{p.dayOfWeek}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Areas: <strong className="text-slate-200">{(p.workingAreas || []).join(', ') || '-'}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black">
                        {p.doctorCount || 0} Doctors
                      </span>
                      {isExp ? <ChevronUp size={16} className="text-sky-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  {isExp && (
                    <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-1.5">
                      {(p.doctors || []).map((doc: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{idx + 1}. {doc.name}</span>
                            <span className="text-[10px] text-slate-400">{doc.hospital} • {doc.workingArea}</span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 shrink-0">
                            {doc.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {activeTab === 'products' && filteredItems.map((p: any, i: number) => (
              <div key={p._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white">{p.productName || p.name}</h4>
                    <p className="text-[10px] text-slate-400">{p.composition || p.category || '-'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 text-[9px] font-bold">
                    {p.packaging || p.type || 'SKU'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 pt-1.5 border-t border-slate-800">
                  <span>MRP: <strong className="text-white">₹{p.mrp || 0}</strong></span>
                  <span>PTR: <strong className="text-sky-400">₹{p.ptr || 0}</strong></span>
                  <span>PTS: <strong className="text-emerald-400">₹{p.pts || 0}</strong></span>
                </div>
              </div>
            ))}

            {activeTab === 'routes' && filteredItems.map((r: any, i: number) => (
              <div key={r._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white">{r.fromCity} → {r.toCity}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{r.areaType || 'Route'} • HQ: {r.hq}</p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 text-sky-400 font-black text-xs">
                  {r.distance || 0} km
                </span>
              </div>
            ))}

            {activeTab === 'holidays' && filteredItems.map((h: any, i: number) => (
              <div key={h._id || i} className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white">{h.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{h.type || 'Holiday'} • {h.state || 'All States'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-400 font-mono font-bold text-xs">
                  {formatDDMMYYYY(h.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
