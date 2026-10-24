import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Eye, Calendar, Search, X, Check, 
  MapPin, ChevronDown, ChevronUp, RefreshCw, FileSpreadsheet, ShieldCheck, ChevronsUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import CustomLocationSelect from '../components/CustomLocationSelect';
import CustomUserSelect from '../components/CustomUserSelect';
import { getDynamicYears } from '../utils/dateUtils';

const MONTHS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const YEARS = getDynamicYears(2, 2);

// Helper to format date string to DD-MM-YYYY (e.g. 01-10-2026)
const formatDisplayDate = (dStr: string) => {
  if (!dStr) return '-';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  }
  return dStr;
};

export default function CallPlanListReport() {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);

  // Filter States
  const [hqs, setHqs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedHq, setSelectedHq] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  
  const currentDate = new Date();
  const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(currentDate.getFullYear());
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown open states for month & year
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  // Modal State for Viewing Detailed Doctor Plan
  const [viewingPlan, setViewingPlan] = useState<any | null>(null);

  // Collapsible / Expandable rows state
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Initial Data Load (HQs and Users)
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [hqRes, userRes] = await Promise.all([
        axios.get('/api/admin/locations/hqs'),
        axios.get('/api/admin/users')
      ]);
      if (hqRes.data?.success) setHqs(hqRes.data.hqs || []);
      if (userRes.data?.success) setUsers(userRes.data.users || userRes.data.data || []);
    } catch (e) {
      console.error('Failed to load HQs or Users for Call Plan report', e);
    }
  };

  // Fetch approved call plans when filters change
  useEffect(() => {
    fetchCallPlans();
    setCurrentPage(1);
  }, [selectedHq, selectedUser, selectedMonth, selectedYear]);

  const fetchCallPlans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedHq && selectedHq !== 'ALL') params.append('hq', selectedHq);
      if (selectedUser && selectedUser !== 'ALL') params.append('employeeId', selectedUser);
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);

      const res = await axios.get(`/api/xl/reports/call-plans?${params.toString()}`);
      if (res.data?.success) {
        setPlans(res.data.data || []);
        setTotalCalls(res.data.totalCalls || 0);
      } else {
        setPlans([]);
        setTotalCalls(0);
      }
    } catch (e) {
      console.error('Failed to fetch call plans', e);
      setPlans([]);
      setTotalCalls(0);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on selected HQ
  const filteredUsersList = useMemo(() => {
    if (!selectedHq || selectedHq === 'ALL') return users;
    return users.filter(u => (u.hq || '').toLowerCase() === selectedHq.toLowerCase());
  }, [users, selectedHq]);

  // Client-side quick filter
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter(p => 
      p.userName.toLowerCase().includes(q) ||
      p.employeeId.toLowerCase().includes(q) ||
      p.headquarter.toLowerCase().includes(q) ||
      p.date.includes(q) ||
      formatDisplayDate(p.date).includes(q) ||
      (p.dayOfWeek || '').toLowerCase().includes(q) ||
      (p.workingAreas || []).some((w: string) => w.toLowerCase().includes(q)) ||
      (p.doctors || []).some((d: any) => d.name.toLowerCase().includes(q) || (d.hospital || '').toLowerCase().includes(q))
    );
  }, [plans, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    return filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  // Toggle single row expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle expand all rows on the current page
  const isAllExpanded = paginatedList.length > 0 && paginatedList.every(p => expandedPlanIds.has(p._id));
  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedPlanIds(new Set());
    } else {
      setExpandedPlanIds(new Set(paginatedList.map(p => p._id)));
    }
  };

  // Selected month name helper
  const selectedMonthObj = MONTHS.find(m => m.value === selectedMonth) || MONTHS[0];

  // Excel Export Logic with Light Blue Header Styling
  const handleExportToExcel = () => {
    if (plans.length === 0) {
      alert('No approved call plans available to export for the selected filters.');
      return;
    }

    // Helper to apply Light Blue Header style with heading items
    const applyLightBlueHeaderStyle = (ws: any) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          fill: {
            fgColor: { rgb: "D9E1F2" } // Light Blue header background
          },
          font: {
            name: "Calibri",
            sz: 11,
            bold: true,
            color: { rgb: "1F497D" } // Heading font color (Dark Blue / Navy)
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "B4C6E7" } },
            bottom: { style: "medium", color: { rgb: "41719C" } },
            left: { style: "thin", color: { rgb: "B4C6E7" } },
            right: { style: "thin", color: { rgb: "B4C6E7" } }
          }
        };
      }
    };

    // Sheet 1: Detailed Doctor-by-Doctor Call Plan Rows
    const detailedData: any[] = [];
    let rowSr = 1;

    plans.forEach(plan => {
      const formattedDate = formatDisplayDate(plan.date);
      if (plan.doctors && plan.doctors.length > 0) {
        plan.doctors.forEach((doc: any) => {
          detailedData.push({
            'Sr No.': rowSr++,
            'Plan Date': formattedDate,
            'Day': plan.dayOfWeek || '-',
            'Month & Year': `${selectedMonthObj.label} ${selectedYear}`,
            'Employee ID': plan.employeeId,
            'Employee Name': plan.userName,
            'Headquarter': plan.headquarter,
            'Designation': plan.designation || 'MR',
            'Doctor Name': doc.name,
            'Category': doc.category || 'General',
            'Hospital / Clinic': doc.hospital || '-',
            'Working Area': doc.workingArea || '-',
            'Degree & Specialization': [doc.degree, doc.specialization].filter(Boolean).join(' - ') || '-',
            'Mobile': doc.mobile || '-',
            'Status': plan.status || 'Approved',
            'Approved By': plan.approvedBy || 'Admin'
          });
        });
      } else {
        // Day with no doctors entered
        detailedData.push({
          'Sr No.': rowSr++,
          'Plan Date': formattedDate,
          'Day': plan.dayOfWeek || '-',
          'Month & Year': `${selectedMonthObj.label} ${selectedYear}`,
          'Employee ID': plan.employeeId,
          'Employee Name': plan.userName,
          'Headquarter': plan.headquarter,
          'Designation': plan.designation || 'MR',
          'Doctor Name': '(No Doctor Entries)',
          'Category': '-',
          'Hospital / Clinic': '-',
          'Working Area': '-',
          'Degree & Specialization': '-',
          'Mobile': '-',
          'Status': plan.status || 'Approved',
          'Approved By': plan.approvedBy || 'Admin'
        });
      }
    });

    // Sheet 2: Day-Wise Plan Summary
    const summaryData = plans.map((plan, idx) => ({
      'Sr No.': idx + 1,
      'Plan Date': formatDisplayDate(plan.date),
      'Day': plan.dayOfWeek || '-',
      'Employee ID': plan.employeeId,
      'Employee Name': plan.userName,
      'Headquarter': plan.headquarter,
      'Designation': plan.designation || 'MR',
      'Total Doctors Planned': plan.doctorCount || 0,
      'Working Areas Covered': (plan.workingAreas || []).join(', ') || '-',
      'Status': plan.status || 'Approved',
      'Approved By': plan.approvedBy || 'Admin'
    }));

    // Create Workbook
    const wb = XLSX.utils.book_new();

    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    // Apply Light Blue styled headers
    applyLightBlueHeaderStyle(wsDetailed);
    applyLightBlueHeaderStyle(wsSummary);

    // Auto column widths
    const detailedCols = [
      { wch: 8 },  // Sr No.
      { wch: 14 }, // Date (DD-MM-YYYY)
      { wch: 12 }, // Day
      { wch: 16 }, // Month Year
      { wch: 14 }, // Emp ID
      { wch: 22 }, // Emp Name
      { wch: 20 }, // Headquarter
      { wch: 20 }, // Designation
      { wch: 26 }, // Doctor Name
      { wch: 14 }, // Category
      { wch: 24 }, // Hospital
      { wch: 20 }, // Working Area
      { wch: 24 }, // Degree
      { wch: 16 }, // Mobile
      { wch: 12 }, // Status
      { wch: 14 }, // Approved By
    ];
    wsDetailed['!cols'] = detailedCols;

    const summaryCols = [
      { wch: 8 },  // Sr No.
      { wch: 14 }, // Date (DD-MM-YYYY)
      { wch: 12 }, // Day
      { wch: 14 }, // Emp ID
      { wch: 22 }, // Emp Name
      { wch: 20 }, // Headquarter
      { wch: 20 }, // Designation
      { wch: 22 }, // Total Doctors Planned
      { wch: 28 }, // Working Areas Covered
      { wch: 12 }, // Status
      { wch: 14 }, // Approved By
    ];
    wsSummary['!cols'] = summaryCols;

    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Approved Call Plans');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Day-wise Summary');

    const hqTag = selectedHq ? selectedHq.replace(/[^a-zA-Z0-9]/g, '_') : 'All_HQs';
    const fileName = `Approved_Call_Plans_${hqTag}_${selectedMonthObj.label}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans text-slate-100">
      
      {/* Top Controls Bar */}
      <div className="p-4 md:p-6 border-b border-slate-700/50 bg-[#1e1e2d] shrink-0 space-y-4">
        
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={20} />
              </span>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
                Call Plan Lists
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Approved Plans Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              View and download HQ-wise and Month-wise approved Call Plans designed for field operations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCallPlans}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-sky-400' : ''} />
            </button>

            <button
              onClick={handleExportToExcel}
              disabled={plans.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileSpreadsheet size={16} />
              <span>Download in Excel</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Headquarter Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Headquarter
              </label>
              {selectedHq && (
                <button
                  onClick={() => { setSelectedHq(''); setSelectedUser(''); }}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <CustomLocationSelect
              options={['ALL', ...new Set((hqs || []).map((h: any) => h.hqName || h.name).filter(Boolean))]}
              selectedValue={selectedHq || 'ALL'}
              onChange={(val) => {
                const nextHq = val === 'ALL' ? '' : val;
                setSelectedHq(nextHq);
                setSelectedUser('');
              }}
              placeholder="All Headquarters"
            />
          </div>

          {/* User Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                User / Representative
              </label>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser('')}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <CustomUserSelect
              users={[
                { employeeId: 'ALL', name: 'All Users', designation: 'All Representatives', hq: selectedHq || 'All HQs' },
                ...filteredUsersList
              ]}
              selectedUser={selectedUser || 'ALL'}
              onChange={(val) => setSelectedUser(val === 'ALL' ? '' : val)}
            />
          </div>

          {/* Month Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Month
            </label>
            <div
              onClick={() => { setMonthDropdownOpen(prev => !prev); setYearDropdownOpen(false); }}
              className="w-full bg-[#27273f] border border-[#3b3b5a] text-white rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors shadow-lg min-h-[40px]"
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-sky-400" />
                <span className="text-[13px] font-bold">{selectedMonthObj.label}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${monthDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
            </div>

            {monthDropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-[#1e1e30] border border-[#3b3b5a] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto p-1">
                {MONTHS.map(m => (
                  <div
                    key={m.value}
                    onClick={() => { setSelectedMonth(m.value); setMonthDropdownOpen(false); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                      selectedMonth === m.value ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:bg-[#27273f]'
                    }`}
                  >
                    <span>{m.label}</span>
                    {selectedMonth === m.value && <Check size={14} className="text-sky-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Year
            </label>
            <div
              onClick={() => { setYearDropdownOpen(prev => !prev); setMonthDropdownOpen(false); }}
              className="w-full bg-[#27273f] border border-[#3b3b5a] text-white rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors shadow-lg min-h-[40px]"
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-sky-400" />
                <span className="text-[13px] font-bold">{selectedYear}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${yearDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
            </div>

            {yearDropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-[#1e1e30] border border-[#3b3b5a] rounded-xl shadow-2xl overflow-hidden p-1">
                {YEARS.map(y => (
                  <div
                    key={y}
                    onClick={() => { setSelectedYear(y); setYearDropdownOpen(false); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                      selectedYear === y ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:bg-[#27273f]'
                    }`}
                  >
                    <span>{y}</span>
                    {selectedYear === y && <Check size={14} className="text-sky-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Live Filter Bar, Expand All, & KPI Cards */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, HQ, date (DD-MM-YYYY), doctor, hospital..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl py-2 pl-10 pr-9 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Expand/Collapse All Button & Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
            {paginatedList.length > 0 && (
              <button
                onClick={toggleExpandAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 border border-slate-700 transition-colors shadow-sm"
                title={isAllExpanded ? "Collapse all rows" : "Expand all rows to view all doctors"}
              >
                <ChevronsUpDown size={14} />
                <span>{isAllExpanded ? "Collapse All" : "Expand All"}</span>
              </button>
            )}

            <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved Days</span>
              <span className="text-sm font-black text-sky-400">{filteredList.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Planned Calls</span>
              <span className="text-sm font-black text-emerald-400">
                {searchQuery ? filteredList.reduce((acc, p) => acc + (p.doctorCount || 0), 0) : (totalCalls || filteredList.reduce((acc, p) => acc + (p.doctorCount || 0), 0))}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Table Content */}
      <div className="flex-1 p-4 md:p-6 overflow-x-auto">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw size={28} className="animate-spin text-sky-400" />
            <span className="text-xs font-semibold">Loading approved call plans...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-300">No Approved Call Plans Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No approved call plans match the selected filters ({selectedMonthObj.label} {selectedYear}
                {selectedHq ? ` • ${selectedHq}` : ''}). Only approved call plans are displayed in this list.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#181826] border border-slate-800 rounded-2xl shadow-xl overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-800 bg-[#141420] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center whitespace-nowrap">Sr.</th>
                  <th className="py-3 px-4 whitespace-nowrap">Date & Day</th>
                  <th className="py-3 px-4 whitespace-nowrap">User / Representative</th>
                  <th className="py-3 px-4 whitespace-nowrap">Headquarter</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Planned Calls</th>
                  <th className="py-3 px-4 whitespace-nowrap">Working Areas</th>
                  <th className="py-3 px-4 whitespace-nowrap">Planned Doctors</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center w-16 whitespace-nowrap">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedList.map((plan, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isExpanded = expandedPlanIds.has(plan._id);

                  return (
                    <React.Fragment key={plan._id || idx}>
                      {/* Main Plan Row */}
                      <tr 
                        className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-800/25' : ''}`}
                        onClick={() => toggleExpand(plan._id)}
                      >
                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(plan._id); }}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
                              title={isExpanded ? "Collapse Planned Doctors" : "Expand to view all Planned Doctors"}
                            >
                              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`} />
                            </button>
                            <span>{globalIdx}</span>
                          </div>
                        </td>

                        {/* Date formatted as DD-MM-YYYY */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-white text-xs tracking-wide">
                            {formatDisplayDate(plan.date)}
                          </div>
                          <span className="text-[10px] text-sky-400 font-medium">
                            {plan.dayOfWeek || '-'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-700/80 flex items-center justify-center text-slate-300 shrink-0 text-[10px] font-bold">
                              {plan.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-200 block truncate max-w-[150px]">
                                {plan.userName}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                {plan.employeeId} {plan.designation ? `• ${plan.designation}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 font-medium text-[11px]">
                            <MapPin size={11} className="text-rose-400 shrink-0" />
                            <span>{plan.headquarter}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                            {plan.doctorCount || 0} Calls
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-[180px]">
                          <div className="flex flex-wrap gap-1">
                            {plan.workingAreas && plan.workingAreas.length > 0 ? (
                              plan.workingAreas.map((w: string, wIdx: number) => (
                                <span 
                                  key={wIdx}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700/50 truncate max-w-[120px]"
                                >
                                  {w}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </div>
                        </td>

                        {/* Planned Doctors Column with interactive expansion trigger */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(plan._id); }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                isExpanded 
                                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
                              }`}
                              title={isExpanded ? "Collapse Planned Doctors" : "Click to view all Planned Doctors"}
                            >
                              <span>{plan.doctorCount || (plan.doctors ? plan.doctors.length : 0)} Doctors</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            {plan.doctors && plan.doctors.length > 0 && (
                              <span 
                                className="text-[11px] text-slate-400 truncate max-w-[150px] inline-block" 
                                title={plan.doctors.map((d: any) => `${d.name} (${d.category || 'General'})`).join(', ')}
                              >
                                {plan.doctors.slice(0, 2).map((d: any) => d.name).join(', ')}
                                {plan.doctors.length > 2 ? '...' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                            <Check size={11} strokeWidth={3} />
                            <span>Approved</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingPlan(plan); }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 transition-colors border border-slate-700 hover:border-sky-500/40"
                            title="View Complete Doctor Visit List"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>

                      {/* Collapsible / Expandable Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-[#151525] border-b border-slate-700/80">
                          <td colSpan={9} className="p-3 sm:p-4 max-w-full">
                            <div className="bg-[#1b1b2f] border border-slate-700/80 rounded-xl p-3 sm:p-4 shadow-inner space-y-3">
                              
                              {/* Header inside expanded sub-row */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span className="text-xs font-bold text-white">
                                    All Planned Doctors on {formatDisplayDate(plan.date)} ({plan.dayOfWeek})
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    {plan.doctors?.length || 0} Doctors Scheduled
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  {plan.workingAreas && plan.workingAreas.length > 0 && (
                                    <span>
                                      Route/Areas: <strong className="text-slate-200">{plan.workingAreas.join(', ')}</strong>
                                    </span>
                                  )}
                                  <button
                                    onClick={() => toggleExpand(plan._id)}
                                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                                  >
                                    <span>Collapse</span>
                                    <ChevronUp size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Doctor Grid - 2 columns maximum so right-side cards are never cut off */}
                              {(!plan.doctors || plan.doctors.length === 0) ? (
                                <div className="py-4 text-center text-slate-500 text-xs">
                                  No doctor records available for this day.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {plan.doctors.map((doc: any, dIdx: number) => (
                                    <div
                                      key={doc._id || dIdx}
                                      className="p-3 rounded-xl bg-[#22223a] border border-slate-700/60 hover:border-sky-500/40 transition-colors flex flex-col justify-between shadow-sm min-w-0"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center font-bold shrink-0 mt-0.5 border border-slate-700">
                                              {dIdx + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                              <h5 className="font-bold text-white text-xs leading-snug truncate" title={doc.name}>
                                                {doc.name}
                                              </h5>
                                              {(doc.degree || doc.specialization) && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={[doc.degree, doc.specialization].filter(Boolean).join(' • ')}>
                                                  {[doc.degree, doc.specialization].filter(Boolean).join(' • ')}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            doc.category === 'Super Core' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                            doc.category === 'Core' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                            'bg-slate-700 text-slate-300'
                                          }`}>
                                            {doc.category || 'General'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 min-w-0">
                                        {doc.hospital && doc.hospital !== '-' && (
                                          <span className="truncate max-w-[220px]" title={doc.hospital}>
                                            🏥 {doc.hospital}
                                          </span>
                                        )}
                                        {doc.workingArea && doc.workingArea !== '-' && (
                                          <span className="truncate max-w-[150px]" title={doc.workingArea}>
                                            📍 {doc.workingArea}
                                          </span>
                                        )}
                                        {doc.mobile && (
                                          <span>📞 {doc.mobile}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2 text-xs text-slate-400">
            <div>
              Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
              <strong className="text-white">
                {Math.min(currentPage * itemsPerPage, filteredList.length)}
              </strong>{' '}
              of <strong className="text-white">{filteredList.length}</strong> approved plans
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors border border-slate-700"
              >
                Previous
              </button>
              <span className="px-2 text-slate-400 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors border border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED VIEW MODAL */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181826] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-700/80 bg-[#141420] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-bold">
                    {formatDisplayDate(viewingPlan.date)}
                  </span>
                  <span className="text-xs text-slate-400">({viewingPlan.dayOfWeek})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase">
                    Approved
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {viewingPlan.userName} • {viewingPlan.headquarter}
                </h3>
                <span className="text-[11px] text-slate-400">
                  ID: {viewingPlan.employeeId} {viewingPlan.designation ? `• ${viewingPlan.designation}` : ''}
                </span>
              </div>

              <button
                onClick={() => setViewingPlan(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Doctor List Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Planned Doctor Visits ({viewingPlan.doctors?.length || 0})
                </h4>
                {viewingPlan.adminRemarks && (
                  <span className="text-xs text-amber-400">
                    Remarks: {viewingPlan.adminRemarks}
                  </span>
                )}
              </div>

              {(!viewingPlan.doctors || viewingPlan.doctors.length === 0) ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No doctor visit details recorded for this date.
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingPlan.doctors.map((doc: any, i: number) => (
                    <div
                      key={doc._id || i}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {doc.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              doc.category === 'Super Core' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              doc.category === 'Core' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {doc.category || 'General'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {doc.hospital && doc.hospital !== '-' && (
                              <span>🏥 {doc.hospital}</span>
                            )}
                            {doc.workingArea && doc.workingArea !== '-' && (
                              <span>📍 {doc.workingArea}</span>
                            )}
                            {(doc.degree || doc.specialization) && (
                              <span>🎓 {[doc.degree, doc.specialization].filter(Boolean).join(' • ')}</span>
                            )}
                            {doc.mobile && (
                              <span>📞 {doc.mobile}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700/80 bg-[#141420] flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Approved by: <strong className="text-slate-300">{viewingPlan.approvedBy || 'Admin'}</strong>
              </span>
              <button
                onClick={() => setViewingPlan(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
