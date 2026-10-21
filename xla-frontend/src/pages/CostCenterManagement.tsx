import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  Plus, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw, 
  ChevronDown, 
  Users, 
  Stethoscope, 
  Building2, 
  ShoppingBag, 
  FileText, 
  PieChart, 
  Zap, 
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CustomSelect from '../components/CustomSelect';

type CostCenterTab = 'EMPLOYEE' | 'DOCTOR' | 'STOCKIST' | 'CHEMIST' | 'MISCELLANEOUS' | 'TOTAL EXPENSES';

interface CostCenterRecord {
  _id: string;
  type: string;
  month: string;
  year: string;
  hq: string;
  entityId: string;
  entityName: string;
  amount: number;
  breakdown?: string;
  remarks?: string;
  status?: string;
  createdAt?: string;
}

const TABS: { id: CostCenterTab; label: string; icon: any }[] = [
  { id: 'EMPLOYEE', label: 'EMPLOYEE', icon: Users },
  { id: 'DOCTOR', label: 'DOCTOR', icon: Stethoscope },
  { id: 'STOCKIST', label: 'STOCKIST', icon: Building2 },
  { id: 'CHEMIST', label: 'CHEMIST', icon: ShoppingBag },
  { id: 'MISCELLANEOUS', label: 'MISCELLANEOUS', icon: FileText },
  { id: 'TOTAL EXPENSES', label: 'TOTAL EXPENSES', icon: PieChart }
];

export default function CostCenterManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CostCenterTab>('EMPLOYEE');
  
  // Date Filters
  const currentDate = new Date();
  const currentMonthStr = currentDate.toLocaleString('en-US', { month: 'short' });
  const currentYearStr = String(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(`${currentMonthStr}, ${currentYearStr}`);
  
  // HQ & Entity Filters
  const [hqs, setHqs] = useState<string[]>([]);
  const [selectedHq, setSelectedHq] = useState<string>('ALL');
  
  // System Master Lists
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  
  // Selected Entity for quick add
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Table Data
  const [records, setRecords] = useState<CostCenterRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalExpensesReport, setTotalExpensesReport] = useState<any>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<CostCenterRecord | null>(null);

  // Form State
  const [formEntityName, setFormEntityName] = useState<string>('');
  const [formEntityId, setFormEntityId] = useState<string>('');
  const [formHq, setFormHq] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');
  // Detailed Employee breakdown
  const [formSalary, setFormSalary] = useState<string>('0');
  const [formDa, setFormDa] = useState<string>('0');
  const [formTa, setFormTa] = useState<string>('0');
  const [formHotel, setFormHotel] = useState<string>('0');
  const [formOther, setFormOther] = useState<string>('0');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Parse Month & Year
  const [monthName, yearVal] = useMemo(() => {
    if (selectedMonth.includes(',')) {
      const parts = selectedMonth.split(',');
      return [parts[0].trim(), parts[1].trim()];
    }
    return [currentMonthStr, currentYearStr];
  }, [selectedMonth, currentMonthStr, currentYearStr]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const monthsMap: Record<string, number> = {
      jan: 31, feb: 28, mar: 31, apr: 30, may: 31, jun: 30,
      jul: 31, aug: 31, sep: 30, oct: 31, nov: 30, dec: 31
    };
    const key = monthName.toLowerCase().substring(0, 3);
    const yr = Number(yearVal) || 2026;
    if (key === 'feb' && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0)) return 29;
    return monthsMap[key] || 30;
  }, [monthName, yearVal]);

  // Load initial dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [uRes, hRes, dRes, sRes, cRes] = await Promise.allSettled([
          axios.get('/api/admin/users').catch(() => axios.get('/api/xl/admin/users')),
          axios.get('/api/xl/locations/hqs').catch(() => axios.get('/api/xl/hqs')),
          axios.get('/api/xl/doctors').catch(() => axios.get('/api/xl/reports/doctors')),
          axios.get('/api/xl/stockists').catch(() => axios.get('/api/xl/reports/stockists')),
          axios.get('/api/xl/chemists').catch(() => axios.get('/api/xl/reports/chemists'))
        ]);

        if (uRes.status === 'fulfilled' && uRes.value?.data) {
          const raw = uRes.value.data;
          const uList = Array.isArray(raw) ? raw : (raw.users || raw.data || []);
          setUsers(uList);
        }
        if (hRes.status === 'fulfilled' && hRes.value?.data) {
          const raw = hRes.value.data;
          const hList = Array.isArray(raw) ? raw : (raw.hqs || raw.data || []);
          const names = hList.map((h: any) => typeof h === 'string' ? h : (h.name || h.headquarter || '')).filter(Boolean);
          setHqs(Array.from(new Set(names)) as string[]);
        }
        if (dRes.status === 'fulfilled' && dRes.value?.data) {
          const raw = dRes.value.data;
          setDoctors(Array.isArray(raw) ? raw : (raw.doctors || raw.data || []));
        }
        if (sRes.status === 'fulfilled' && sRes.value?.data) {
          const raw = sRes.value.data;
          setStockists(Array.isArray(raw) ? raw : (raw.stockists || raw.data || []));
        }
        if (cRes.status === 'fulfilled' && cRes.value?.data) {
          const raw = cRes.value.data;
          setChemists(Array.isArray(raw) ? raw : (raw.chemists || raw.data || []));
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch Cost Center Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (activeTab === 'TOTAL EXPENSES') {
        const res = await axios.get('/api/xl/cost-center/total-expenses', {
          params: { month: selectedMonth, year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setTotalExpensesReport(res.data);
          setRecords(res.data.rows || []);
        }
      } else {
        const res = await axios.get('/api/xl/cost-center', {
          params: { type: activeTab, month: selectedMonth, year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setRecords(res.data.data || []);
        }
      }
    } catch (e) {
      console.error('Error fetching cost center records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, selectedMonth, selectedHq]);

  // Compute Total Cost
  const totalCost = useMemo(() => {
    return records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  }, [records]);

  // Entity options depending on activeTab
  const entityOptions = useMemo(() => {
    if (activeTab === 'EMPLOYEE') {
      const filtered = selectedHq === 'ALL' 
        ? users 
        : users.filter(u => (u.hq || u.headquarter || '') === selectedHq);
      return filtered.map(u => {
        const empId = u.employeeId || u.uid || u._id;
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId;
        return {
          value: empId,
          label: name,
          subLabel: `${u.designation || 'MR'}${u.hq ? ` • ${u.hq}` : ''} (${empId})`,
          raw: u
        };
      });
    }
    if (activeTab === 'DOCTOR') {
      const filtered = selectedHq === 'ALL' 
        ? doctors 
        : doctors.filter(d => (d.hq || d.headquarter || '') === selectedHq);
      return filtered.map(d => ({
        value: d._id || d.uid || d.doctorCode || d.name,
        label: d.doctorName || d.name,
        subLabel: `${d.speciality || 'General'}${d.hq ? ` • ${d.hq}` : ''}`,
        raw: d
      }));
    }
    if (activeTab === 'STOCKIST') {
      const filtered = selectedHq === 'ALL' 
        ? stockists 
        : stockists.filter(s => (s.hq || s.headquarter || '') === selectedHq);
      return filtered.map(s => ({
        value: s._id || s.uid || s.stockistName || s.name,
        label: s.stockistName || s.name,
        subLabel: `${s.city || ''}${s.hq ? ` • ${s.hq}` : ''}`,
        raw: s
      }));
    }
    if (activeTab === 'CHEMIST') {
      const filtered = selectedHq === 'ALL' 
        ? chemists 
        : chemists.filter(c => (c.hq || c.headquarter || '') === selectedHq);
      return filtered.map(c => ({
        value: c._id || c.uid || c.chemistName || c.name,
        label: c.chemistName || c.name,
        subLabel: `${c.contactPerson || ''}${c.hq ? ` • ${c.hq}` : ''}`,
        raw: c
      }));
    }
    if (activeTab === 'MISCELLANEOUS') {
      return [
        { value: 'Office Rent & Utilities', label: 'Office Rent & Utilities' },
        { value: 'Courier & Freight', label: 'Courier & Freight' },
        { value: 'Conference & Meetings', label: 'Conference & Meetings' },
        { value: 'Marketing Collaterals & Printing', label: 'Marketing Collaterals & Printing' },
        { value: 'Software & Technology Subscriptions', label: 'Software & Technology Subscriptions' },
        { value: 'Legal & Accounting Fees', label: 'Legal & Accounting Fees' },
        { value: 'General Miscellaneous', label: 'General Miscellaneous' }
      ];
    }
    return [];
  }, [activeTab, selectedHq, users, doctors, stockists, chemists]);

  // Handle Quick Add Entity Selection
  const handleSelectEntityForAdd = (val: string) => {
    setSelectedEntityId(val);
    const opt = entityOptions.find(o => o.value === val) as any;
    if (opt) {
      setFormEntityId(opt.value);
      setFormEntityName(opt.label);
      if (opt.raw?.hq) setFormHq(opt.raw.hq);
      else if (selectedHq !== 'ALL') setFormHq(selectedHq);
      // Auto-populate salary if employee
      if (activeTab === 'EMPLOYEE' && opt.raw?.salary) {
        setFormSalary(String(opt.raw.salary));
        setFormAmount(String(opt.raw.salary));
      } else {
        setFormAmount('');
      }
      setShowAddModal(true);
    }
  };

  // Recalculate amount if detailed breakdown changes
  useEffect(() => {
    if (activeTab === 'EMPLOYEE') {
      const sum = (Number(formSalary) || 0) + 
                  (Number(formDa) || 0) + 
                  (Number(formTa) || 0) + 
                  (Number(formHotel) || 0) + 
                  (Number(formOther) || 0);
      if (sum > 0) setFormAmount(String(sum));
    }
  }, [formSalary, formDa, formTa, formHotel, formOther, activeTab]);

  // Submit Cost Center Form
  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEntityName || !formAmount) {
      alert('Please enter entity name and cost amount.');
      return;
    }
    setSubmitting(true);
    try {
      let breakdownObj: any = {};
      if (activeTab === 'EMPLOYEE') {
        breakdownObj = {
          salary: Number(formSalary) || 0,
          dailyAllowance: Number(formDa) || 0,
          travelAllowance: Number(formTa) || 0,
          hotelBoarding: Number(formHotel) || 0,
          otherExpenses: Number(formOther) || 0
        };
      }
      await axios.post('/api/xl/cost-center', {
        type: activeTab,
        month: selectedMonth,
        year: yearVal,
        hq: formHq || (selectedHq !== 'ALL' ? selectedHq : ''),
        entityId: formEntityId || formEntityName,
        entityName: formEntityName,
        amount: Number(formAmount),
        breakdown: breakdownObj,
        remarks: formRemarks
      });
      setShowAddModal(false);
      resetForm();
      fetchRecords();
    } catch (err: any) {
      console.error('Error saving cost center entry:', err);
      alert(err.response?.data?.message || 'Error saving cost center record');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormEntityName('');
    setFormEntityId('');
    setFormHq('');
    setFormAmount('');
    setFormRemarks('');
    setFormSalary('0');
    setFormDa('0');
    setFormTa('0');
    setFormHotel('0');
    setFormOther('0');
    setSelectedEntityId('');
  };

  // Delete Record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost center record?')) return;
    try {
      await axios.delete(`/api/xl/cost-center/${id}`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Failed to delete record');
    }
  };

  // One-click Auto Sync from System Expenses
  const handleAutoSync = async () => {
    if (!confirm(`Auto-sync approved field expenses and salaries for ${selectedMonth}? This will calculate TA/DA/Hotel and add them to Employee Cost Center.`)) return;
    setSyncing(true);
    try {
      const res = await axios.post('/api/xl/cost-center/auto-sync', {
        month: selectedMonth,
        year: yearVal,
        hq: selectedHq
      });
      if (res.data?.success) {
        alert(res.data.message || 'Auto-sync completed!');
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
      alert('Error during auto-sync');
    } finally {
      setSyncing(false);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData = records.map((r, i) => ({
      'Sr no.': i + 1,
      'Type': r.type,
      'Name': r.entityName,
      'Headquarter': r.hq || 'N/A',
      'Total Cost (Rs)': r.amount,
      'Period': `${r.month} ${r.year}`,
      'Remarks': r.remarks || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), `${activeTab}_Cost_Center`);
    XLSX.writeFile(wb, `Cost_Center_${activeTab}_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-16 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center justify-between px-4 pt-8 pb-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/extras/profit')} className="text-white active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold">
          <ArrowLeft size={18} /> Cost Center
        </button>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{activeTab}</span>
      </div>

      {/* Main Layout: Sub-menu Sidebar + Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">

        {/* LEFT SUB-SIDEBAR: MANAGE COST CENTER (Matches Medom Reference) */}
        <aside className="w-full md:w-60 bg-slate-900 md:bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-300 flex items-center gap-2">
              Manage Cost Center
            </h2>
            <ChevronDown size={14} className="text-emerald-400" />
          </div>

          <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-3 gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-left relative ${
                    isActive 
                      ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Blue indicator bar on the left matching Medom */}
                  {isActive && (
                    <div className="hidden md:block absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r-full" />
                  )}
                  <Icon size={16} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col overflow-y-auto px-4 py-3 md:px-6 md:py-4">
          
          {/* TOP BREADCRUMB & HELP HEADER */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/extras/profit')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="uppercase text-sm font-black text-white tracking-wide">&lt; {activeTab}</span>
              </button>
            </div>
            <button 
              onClick={() => setShowHelpModal(true)}
              className="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} /> How does it work?
            </button>
          </div>

          {/* CONTROLS BAR & KPI SUMMARY CARD ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 items-stretch">
            
            {/* Filter Controls (Cols 8) */}
            <div className="lg:col-span-8 bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl shadow-lg flex flex-col justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Select Month */}
                <div>
                  <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    Select Month *
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                    >
                      {['Oct, 2026', 'Sep, 2026', 'Aug, 2026', 'Jul, 2026', 'Jun, 2026', 'May, 2026', 'Apr, 2026', 'Mar, 2026'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select HQ */}
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Select Headquarter *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'ALL', label: 'All Headquarters' },
                      ...hqs.map(hq => ({ value: hq, label: hq }))
                    ]}
                    value={selectedHq}
                    onChange={(val) => setSelectedHq(val)}
                    placeholder="Select HQ"
                    compact={true}
                  />
                </div>
              </div>

              {/* Entity Picker & Action Buttons */}
              {activeTab !== 'TOTAL EXPENSES' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 pt-1 border-t border-slate-700/50">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Select {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} *
                    </label>
                    <CustomSelect
                      options={entityOptions}
                      value={selectedEntityId}
                      onChange={(val) => handleSelectEntityForAdd(val)}
                      placeholder={`Choose ${activeTab.toLowerCase()} to add cost...`}
                      compact={true}
                    />
                  </div>

                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow shadow-sky-500/20 h-[34px] shrink-0"
                  >
                    <Plus size={14} /> Add {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
                  </button>

                  {activeTab === 'EMPLOYEE' && (
                    <button
                      onClick={handleAutoSync}
                      disabled={syncing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow shadow-emerald-600/20 h-[34px] shrink-0"
                      title="Auto-calculate and import approved expenses & salaries"
                    >
                      <Zap size={14} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Auto-Sync Expenses'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SUMMARY CARD (Top Right, Cols 4 - Faithful reproduction of Medom card) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between text-white relative overflow-hidden border border-sky-400/20">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-xs font-black tracking-widest uppercase opacity-90">
                  {records.length} {activeTab === 'TOTAL EXPENSES' ? 'ENTRIES' : `${activeTab}S`}
                </span>
                <p className="text-[11px] font-medium text-sky-100 mt-1">
                  Period: {monthName} {yearVal} | {daysInMonth} Days
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/15">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-sky-200">Rs</span>
                  <span className="text-2xl md:text-3xl font-black tracking-tight font-mono">
                    {totalCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-sky-200/90">
                  TOTAL COST
                </span>
              </div>
            </div>

          </div>

          {/* TOTAL EXPENSES OVERVIEW TAB OR STANDARD GRID TABLE */}
          {activeTab === 'TOTAL EXPENSES' ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {totalExpensesReport?.breakdown?.map((cat: any, i: number) => (
                  <div key={i} className="bg-slate-800/70 border border-slate-700/60 p-3 rounded-xl shadow-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {cat.category}
                    </span>
                    <span className="text-base font-black text-white font-mono mt-1 block">
                      ₹ {cat.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{cat.count} items</span>
                      <span className="text-sky-400 font-bold">{cat.percentage}%</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1 mt-1 overflow-hidden">
                      <div 
                        className="bg-sky-400 h-full rounded-full" 
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Master Expenses Grid */}
              <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[300px]">
                <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Consolidated Cost Center Register ({records.length} Records)
                  </h3>
                  <button
                    onClick={handleExport}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5"
                  >
                    <Download size={13} /> Export Excel
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-center border-collapse border border-slate-700 text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                        <th className="border border-slate-700 px-3 py-2 w-12">Sr no.</th>
                        <th className="border border-slate-700 px-3 py-2 text-left">Category</th>
                        <th className="border border-slate-700 px-3 py-2 text-left">Entity Name</th>
                        <th className="border border-slate-700 px-3 py-2">Headquarter</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Total (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                            No expense data found for selected period.
                          </td>
                        </tr>
                      ) : (
                        records.map((r, i) => (
                          <tr key={r._id} className="hover:bg-slate-700/40 transition-colors">
                            <td className="border border-slate-700 px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                            <td className="border border-slate-700 px-3 py-2 text-left font-bold text-sky-400">{r.type}</td>
                            <td className="border border-slate-700 px-3 py-2 text-left font-semibold text-white">{r.entityName}</td>
                            <td className="border border-slate-700 px-3 py-2 text-slate-300">{r.hq || 'N/A'}</td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-emerald-400">
                              ₹ {Number(r.amount).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setDetailItem(r)}
                                  className="text-sky-400 hover:text-sky-300 p-1"
                                  title="View breakdown"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(r._id)}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TABULAR GRID MATCHING MEDOM SCREENSHOT */
            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[300px]">
              <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Showing ({records.length}) Entries
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchRecords}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                  <button
                    onClick={handleExport}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5"
                  >
                    <Download size={13} /> Export
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-center border-collapse border border-slate-700 text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                      <th className="border border-slate-700 px-3 py-2 w-14">Sr no.</th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        {activeTab === 'EMPLOYEE' ? 'Employee' : 
                         activeTab === 'DOCTOR' ? 'Doctor' : 
                         activeTab === 'STOCKIST' ? 'Stockist' : 
                         activeTab === 'CHEMIST' ? 'Chemist' : 'Expense / Title'}
                      </th>
                      <th className="border border-slate-700 px-3 py-2">Headquarter</th>
                      <th className="border border-slate-700 px-3 py-2 text-right">Total</th>
                      <th className="border border-slate-700 px-3 py-2 w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-400" />
                          Loading Cost Center Data...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      records.map((r, i) => (
                        <tr key={r._id} className="hover:bg-slate-700/40 transition-colors">
                          <td className="border border-slate-700 px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="border border-slate-700 px-3 py-2 text-left font-bold text-white">
                            {r.entityName}
                            {r.entityId && r.entityId !== r.entityName && (
                              <span className="block text-[10px] font-normal text-slate-400 font-mono">
                                ID: {r.entityId}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-slate-300 font-medium">
                            {r.hq || 'N/A'}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-emerald-400 text-sm">
                            ₹ {Number(r.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setDetailItem(r)}
                                className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 p-1.5 rounded transition-colors"
                                title="View cost breakdown"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(r._id)}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-1.5 rounded transition-colors"
                                title="Delete record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">&lt; Prev</span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-white font-bold">Page 1 of 1</span>
                  <span className="font-semibold">Next &gt;</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-bold">
                    Subtotal: ₹ {totalCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500">Show {records.length}</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD / EDIT COST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-sky-400" />
                Add {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Cost Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCost} className="p-5 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Name *
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${activeTab.toLowerCase()} name`}
                  value={formEntityName}
                  onChange={e => setFormEntityName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Headquarter
                  </label>
                  <CustomSelect
                    options={hqs.map(h => ({ value: h, label: h }))}
                    value={formHq}
                    onChange={(val) => setFormHq(val)}
                    placeholder="Select HQ"
                    compact={true}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedMonth}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs font-bold text-slate-400"
                  />
                </div>
              </div>

              {/* Detailed Breakdown for Employee */}
              {activeTab === 'EMPLOYEE' ? (
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    Employee Cost Breakdown (₹)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-slate-400 block">Basic / Gross Salary</label>
                      <input
                        type="number"
                        min="0"
                        value={formSalary}
                        onChange={e => setFormSalary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block">Daily Allowance (DA)</label>
                      <input
                        type="number"
                        min="0"
                        value={formDa}
                        onChange={e => setFormDa(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block">Travel Allowance (TA / Fuel)</label>
                      <input
                        type="number"
                        min="0"
                        value={formTa}
                        onChange={e => setFormTa(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block">Hotel & Boarding</label>
                      <input
                        type="number"
                        min="0"
                        value={formHotel}
                        onChange={e => setFormHotel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Total Amount (Rs) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g., 45000"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional cost notes or justification"
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow shadow-sky-500/20"
                >
                  {submitting ? 'Saving...' : 'Save Cost Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Cost Breakdown: {detailItem.entityName}
              </h3>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-sky-400">{detailItem.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Headquarter</span>
                  <span className="font-bold text-slate-200">{detailItem.hq || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Period</span>
                  <span className="font-bold text-slate-200">{detailItem.month} {detailItem.year}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total Cost</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ₹ {Number(detailItem.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Parsed Breakdown */}
              {(() => {
                try {
                  const b = typeof detailItem.breakdown === 'string' ? JSON.parse(detailItem.breakdown) : detailItem.breakdown;
                  if (b && Object.keys(b).length > 0) {
                    return (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Component Breakdown
                        </span>
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-2">
                          {Object.entries(b).map(([k, v]) => {
                            if (typeof v === 'boolean') return null;
                            return (
                              <div key={k} className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-1 last:border-0 last:pb-0">
                                <span className="capitalize text-slate-400">{k.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="font-mono font-bold text-slate-200">
                                  ₹ {Number(v).toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  return null;
                }
              })()}

              {detailItem.remarks && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remarks</span>
                  <p className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-slate-300 italic text-[11px]">
                    {detailItem.remarks}
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW DOES IT WORK HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <HelpCircle size={16} className="text-sky-400" />
                How Cost Center Works in Pharma ERP
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs text-slate-300">
              <p>
                A <strong>Cost Center</strong> is a departmental unit that incurs costs without directly generating revenues. It tracks exactly where operational capital is being spent across your field organization.
              </p>
              <div className="space-y-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">1. Employee Cost Center</span>
                  <span className="text-[11px] text-slate-400">Tracks MR/ABM salary, daily allowances (DA), travel allowances (TA), hotel boarding, and local expenses. Use <em>Auto-Sync</em> to compute automatically from approved DCR expenses.</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">2. Doctor Cost Center</span>
                  <span className="text-[11px] text-slate-400">Promotional gifts, CME sponsorships, scientific materials, and high-value brand inputs allocated per medical practitioner.</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">3. Stockist & Chemist Cost Center</span>
                  <span className="text-[11px] text-slate-400">Trade schemes, damage/breakage credit notes, delivery freight, and chemist retail incentives.</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">4. Total Expenses Consolidation</span>
                  <span className="text-[11px] text-slate-400">Merges all 5 cost categories to compute Total Territory Operating Expenditure for profit analysis.</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-1.5 rounded-lg text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
