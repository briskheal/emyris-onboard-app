import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarDays, Sparkles, Save, Download, CheckCircle2, 
  Clock, AlertTriangle, Building2, User, ChevronDown, ChevronUp,
  Table, Calendar as CalendarIcon, Stethoscope, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getDynamicYears } from '../utils/dateUtils';

interface DoctorItem {
  _id: string;
  name: string;
  category: string;
  hospital?: string;
  degree?: string;
  specialization?: string;
  visitDays?: string;
  workingArea?: string;
  isPlaceholder?: boolean;
}

interface DayPlan {
  date: string;
  day: number;
  token: string;
  dayName: string;
  type: 'Working' | 'Sunday' | 'Holiday' | 'Leave';
  title: string;
  isExMarket?: boolean;
  marketName?: string | null;
  tpRoute?: string | null;
  tpActivity?: string;
  doctors: DoctorItem[];
}

interface DoctorSummaryItem {
  _id: string;
  name: string;
  category: string;
  hospital?: string;
  workingArea?: string;
  visitDays?: string;
  minTarget: number;
  plannedCalls: number;
  visitDaysList?: number[];
  isMissed?: boolean;
  status: string;
}

export default function MonthlyCallPlanTab({ 
  hqs, 
  users: propUsers 
}: { 
  hqs: any[]; 
  users?: any[]; 
}) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedHq, setSelectedHq] = useState<string>('VADODARA-PST-1');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [callsPerDay, setCallsPerDay] = useState<number>(8);
  const [usersList, setUsersList] = useState<any[]>(propUsers || []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'roster' | 'doctor_matrix' | 'missed_doctors'>('roster');

  // Generated / Loaded Plan Data
  const [planDays, setPlanDays] = useState<DayPlan[]>([]);
  const [planSummary, setPlanSummary] = useState<any>(null);
  const [doctorSummary, setDoctorSummary] = useState<DoctorSummaryItem[]>([]);
  const [missedDoctors, setMissedDoctors] = useState<any[]>([]);
  const [tourProgramInfo, setTourProgramInfo] = useState<any>(null);
  const [isSavedInDb, setIsSavedInDb] = useState(false);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Fetch users if not passed
  useEffect(() => {
    if (!propUsers || propUsers.length === 0) {
      axios.get('/api/admin/users').then(res => {
        if (res.data?.users) setUsersList(res.data.users);
      }).catch(() => {});
    }
  }, [propUsers]);

  // Filter exclusively for Level 1 employees (Frontline Territory Business Managers / TBMs)
  // Per requirement: Level 2 or managers follow the plan of the field force and are excluded
  const isLevel1Employee = (u: any) => {
    const desig = (u.designation || '').toLowerCase().trim();
    // Frontline field force designations (Level 1)
    if (desig.includes('territory') || desig.includes('tbm') || desig.includes('medical representative') || desig.includes('field officer')) {
      return true;
    }
    // Exclude all Level 2+ managers and higher leadership
    if (
      desig.includes('area') ||
      desig.includes('regional') ||
      desig.includes('zonal') ||
      desig.includes('national') ||
      desig.includes('product manager') ||
      desig.includes('sales manager') ||
      desig.includes('president') || 
      desig.includes('director') || 
      desig.includes('gm') || 
      desig.includes('head') || 
      desig.includes('vp') ||
      desig.includes('admin')
    ) {
      return false;
    }
    return !desig.includes('manager');
  };

  const level1Users = usersList.filter(isLevel1Employee);

  // When HQ changes, auto-select corresponding Level 1 user
  useEffect(() => {
    if (!selectedHq || level1Users.length === 0) return;
    const cleanHq = selectedHq.toUpperCase().trim();
    // Prioritize user whose HQ matches
    const matchingUser = level1Users.find((u: any) => 
      (u.hq || '').toUpperCase().trim() === cleanHq ||
      cleanHq.includes((u.hq || '').toUpperCase().trim())
    );
    if (matchingUser) {
      setSelectedEmployeeId(matchingUser.employeeId);
    } else {
      // Default to first Level 1 user
      if (!selectedEmployeeId && level1Users[0]) {
        setSelectedEmployeeId(level1Users[0].employeeId);
      }
    }
  }, [selectedHq, level1Users]);

  const [existingPlanInfo, setExistingPlanInfo] = useState<{
    hasSavedPlan: boolean;
    count: number;
    totalPlannedCalls: number;
    status: string;
  } | null>(null);

  // Automatically check if a saved plan exists for this user/month/year
  useEffect(() => {
    if (selectedEmployeeId && selectedMonth && selectedYear) {
      checkSavedPlan();
    }
  }, [selectedEmployeeId, selectedMonth, selectedYear]);

  const checkSavedPlan = async () => {
    try {
      const res = await axios.get('/api/admin/dcs/call-plan/saved', {
        params: { employeeId: selectedEmployeeId, month: selectedMonth, year: selectedYear }
      });
      if (res.data?.tourProgram) {
        setTourProgramInfo(res.data.tourProgram);
      }
      if (res.data?.success && res.data.hasSavedPlan) {
        setIsSavedInDb(true);
        setExistingPlanInfo({
          hasSavedPlan: true,
          count: res.data.count || 0,
          totalPlannedCalls: res.data.totalPlannedCalls || 0,
          status: res.data.status || 'Approved'
        });
      } else {
        setIsSavedInDb(false);
        setExistingPlanInfo(null);
      }
    } catch (e) {
      setIsSavedInDb(false);
      setExistingPlanInfo(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedHq) return alert('Please select a Headquarters');

    if (existingPlanInfo?.hasSavedPlan) {
      const proceed = window.confirm(
        `⚠️ CAUTION: An active Call Plan (${existingPlanInfo.count} days, ${existingPlanInfo.totalPlannedCalls} calls) already exists in the XL Portal for this employee.\n\nRegenerating will replace the preview. If you subsequently save & approve, it will OVERWRITE the employee's custom plan.\n\nDo you want to proceed with regenerating?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/admin/dcs/call-plan/generate', {
        hq: selectedHq,
        employeeId: selectedEmployeeId,
        month: selectedMonth,
        year: selectedYear,
        callsPerDay
      });

      if (res.data?.success) {
        setPlanDays(res.data.data.days);
        setPlanSummary(res.data.data.summary);
        setDoctorSummary(res.data.data.doctorSummary);
        setMissedDoctors(res.data.data.missedDoctors || []);
        setTourProgramInfo(res.data.data.tourProgramInfo || null);
        setIsSavedInDb(false);

        // Expand first 3 working days by default
        const initExpand: { [key: string]: boolean } = {};
        let count = 0;
        res.data.data.days.forEach((d: DayPlan) => {
          if (d.type === 'Working' && count < 5) {
            initExpand[d.date] = true;
            count++;
          }
        });
        setExpandedDays(initExpand);
      } else {
        alert(res.data?.message || 'Failed to generate call plan');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error generating call plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndApprove = async () => {
    if (planDays.length === 0) return alert('Please generate a call plan first');
    if (!selectedEmployeeId) return alert('Please select an XL user to assign this plan to');

    const empObj = usersList.find(u => u.employeeId === selectedEmployeeId);
    const empName = empObj ? `${empObj.firstName || ''} ${empObj.lastName || ''}`.trim() : selectedEmployeeId;

    // Strict Tour Program check: XLA can only submit/save Call Plan if TP is submitted by XL user or approved
    const isTpValid = tourProgramInfo?.linked && ['Submitted', 'Approved'].includes(tourProgramInfo.status);
    if (tourProgramInfo && !isTpValid) {
      alert(`❌ Cannot Submit Call Plan:\n\nNo Tour Program has been submitted by ${empName} (or approved by Admin) for ${selectedMonth}/${selectedYear}.\n\nA Tour Program must be submitted by the XL user first before any Call Plan can be submitted.`);
      return;
    }

    if (existingPlanInfo?.hasSavedPlan) {
      const proceed = window.confirm(
        `🚨 OVERWRITE WARNING 🚨\n\nA Call Plan is already ACTIVE in the XL User Portal for ${empName} (${selectedMonth}/${selectedYear}) with ${existingPlanInfo.count} days planned (${existingPlanInfo.totalPlannedCalls} calls).\n\nIf the field representative has already made customizations or added doctor calls in their mobile app, saving now will PERMANENTLY OVERWRITE their customizations with this automated schedule.\n\nAre you sure you want to proceed and overwrite?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Save and approve this ${planSummary?.totalPlannedCalls || 0}-call plan for ${empName} (${selectedEmployeeId})? This will immediately sync to their XL Field CRM.`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const res = await axios.post('/api/admin/dcs/call-plan/save', {
        employeeId: selectedEmployeeId,
        days: planDays,
        month: selectedMonth,
        year: selectedYear
      });

      if (res.data?.success) {
        setIsSavedInDb(true);
        checkSavedPlan();
        alert(`Success! ${res.data.message || 'Call plan saved and approved.'}`);
      } else {
        alert(res.data?.message || 'Failed to save call plan');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving call plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleExportToExcel = () => {
    if (planDays.length === 0) return alert('No plan data to export');

    const flatRows: any[] = [];
    planDays.forEach(d => {
      if (d.type !== 'Working' || d.doctors.length === 0) {
        flatRows.push({
          Date: d.date,
          'Day of Week': d.dayName,
          'Day Type': d.type === 'Sunday' ? 'Sunday Off' : `Holiday (${d.title})`,
          'Doctor Call #': '-',
          'Doctor Name': '-',
          Category: '-',
          Hospital: '-',
          Specialization: '-',
          'Visit Days': '-'
        });
      } else {
        d.doctors.forEach((doc, idx) => {
          flatRows.push({
            Date: d.date,
            'Day of Week': d.dayName,
            'Day Type': 'Working Day',
            'Doctor Call #': idx + 1,
            'Doctor Name': doc.name,
            Category: doc.category || '-',
            Hospital: doc.hospital || '-',
            Specialization: doc.specialization || '-',
            'Visit Days': doc.visitDays || '-'
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Call Plan');
    XLSX.writeFile(wb, `Call_Plan_${selectedHq}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const toggleDayExpand = (dateStr: string) => {
    setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const toggleAllExpand = (expand: boolean) => {
    const next: { [key: string]: boolean } = {};
    planDays.forEach(d => {
      if (d.type === 'Working') next[d.date] = expand;
    });
    setExpandedDays(next);
  };

  const getCategoryBadge = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('supercore') || cat.includes('3 visit')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">SuperCore (3/mo)</span>;
    }
    if (cat.includes('ultra') || cat.includes('4 visit')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Ultra-Core (4/mo)</span>;
    }
    if (cat.includes('core') && !cat.includes('non-core')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Core (2/mo)</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Non-Core (1/mo)</span>;
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#1e1e2d] relative z-10 text-slate-100 pb-16">
      
      {/* TOP CONFIGURATION TOOLBAR */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#3b3b5a] bg-[#1e1e2d] shadow-sm relative z-20 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="text-sky-400" size={20} />
              Automated Monthly Call Planner
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exclusively for Level 1 field force (TBMs), integrating Tour Program Ex-Market destinations, weekday availability & category frequencies.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {planDays.length > 0 && (
              <>
                <button
                  onClick={handleGeneratePlan}
                  disabled={loading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>Regenerate Plan</span>
                </button>

                <button
                  onClick={handleSaveAndApprove}
                  disabled={saving}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                    isSavedInDb 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                      : 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  <Save size={15} />
                  <span>{isSavedInDb ? 'Plan Saved & Approved' : 'Save & Approve to CRM'}</span>
                </button>

                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252538] hover:bg-[#3b3b5a] text-slate-300 hover:text-white border border-[#3b3b5a] font-bold text-xs transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  <span>Export</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Select HQ */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} className="text-sky-400" /> SELECT HEADQUARTER
            </label>
            <select
              value={selectedHq}
              onChange={e => setSelectedHq(e.target.value)}
              className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[34px]"
            >
              {hqs.map((h: any) => (
                <option key={h._id} value={h.hqName}>{h.hqName}</option>
              ))}
            </select>
          </div>

          {/* Select User - Filtered Exclusively for Level 1 Employees */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <User size={12} className="text-emerald-400" /> LEVEL 1 FIELD FORCE (TBM)
            </label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[34px]"
            >
              {level1Users.map((u: any) => (
                <option key={u.employeeId} value={u.employeeId}>
                  {u.firstName} {u.lastName} ({u.employeeId}) - {u.designation || 'TBM'} [{u.hq || 'HQ'}]
                </option>
              ))}
            </select>
          </div>

          {/* Select Month & Year */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon size={12} className="text-amber-400" /> SELECT MONTH & YEAR
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[34px]"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[34px]"
              >
                {getDynamicYears(2, 2).map(y => (
                  <option key={y} value={Number(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Calls Per Day */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} className="text-purple-400" /> CALLS / WORKING DAY
            </label>
            <select
              value={callsPerDay}
              onChange={e => setCallsPerDay(Number(e.target.value))}
              className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[34px]"
            >
              {[6, 8, 10, 12].map(n => (
                <option key={n} value={n}>{n} Doctor Calls / Day {n === 8 ? '(Standard)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing Plan Caution Notice */}
        {existingPlanInfo?.hasSavedPlan && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Active Call Plan in XL User Portal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {existingPlanInfo.count} Days Planned ({existingPlanInfo.totalPlannedCalls} Calls) &bull; Status: {existingPlanInfo.status}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                <strong>Caution:</strong> A monthly Call Plan is already active for this employee in the XL User Portal. The field representative may have already customized their visits, added local doctors, or adjusted schedules. Generating and pushing a new plan will <strong>overwrite</strong> their customizations.
              </p>
            </div>
          </div>
        )}

        {/* Rule Summary Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Scheduling Rules:</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
            SuperCore ≥ 3 visits/mo
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Core ≥ 2 visits/mo
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Non-Core ≥ 1 visit/mo
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Sundays & State Holidays Auto-Excluded
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Repeat day rotation once minimums covered
          </span>
        </div>

        {/* Tour Program Linkage Indicator */}
        {tourProgramInfo && (
          <div className="pt-1">
            {tourProgramInfo.linked && ['Submitted', 'Approved'].includes(tourProgramInfo.status) ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-xs flex-wrap">
                <span className="text-sm">✈️</span>
                <span className="font-semibold">Tour Program Linked:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                  tourProgramInfo.status === 'Approved' ? 'bg-emerald-600/50 text-emerald-300' : 'bg-sky-600/50 text-sky-300'
                }`}>
                  {tourProgramInfo.status}
                </span>
                <span className="text-purple-300">({tourProgramInfo.month || `${selectedMonth}/${selectedYear}`})</span>
                <span className="text-purple-400">•</span>
                <span className="font-semibold text-emerald-400">
                  {tourProgramInfo.exMarketDaysCount || 0} Ex-Market Tour Day(s) Scheduled with All Market Doctors
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                <span className="text-base">⚠️</span>
                <span>
                  <strong className="text-white">Tour Program Required:</strong> No Tour Program has been submitted by the XL user (or approved by Admin) for {selectedMonth}/{selectedYear}. <strong>Call Plan cannot be submitted or saved to CRM</strong> until a Tour Program is submitted by the field representative.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI METRIC CARDS */}
      {planSummary && (
        <div className="px-4 sm:px-6 py-3 border-b border-[#3b3b5a] bg-[#1a1a29]">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            <div className="bg-[#252538] border border-[#3b3b5a] p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Days</span>
              <span className="text-lg font-black text-white">{planSummary.totalDays}</span>
            </div>
            <div className="bg-[#252538] border border-emerald-500/30 p-2.5 rounded-lg">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Working Days</span>
              <span className="text-lg font-black text-emerald-400">{planSummary.workingDays}</span>
            </div>
            <div className="bg-[#252538] border border-amber-500/30 p-2.5 rounded-lg">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Off / Holidays</span>
              <span className="text-lg font-black text-amber-400">
                {planSummary.offDays || (planSummary.sundays + planSummary.holidays + (planSummary.leaves || 0))}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({planSummary.sundays} Sun, {planSummary.holidays} Hol{planSummary.leaves ? `, ${planSummary.leaves} Leave` : ''})
                </span>
              </span>
            </div>
            <div className="bg-[#252538] border border-sky-500/30 p-2.5 rounded-lg">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">Total Calls</span>
              <span className="text-lg font-black text-sky-400">{planSummary.totalPlannedCalls} <span className="text-xs font-normal text-slate-400">({planSummary.workingDays} × {callsPerDay})</span></span>
            </div>
            <div className="bg-[#252538] border border-purple-500/30 p-2.5 rounded-lg">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Doctors In HQ</span>
              <span className="text-lg font-black text-purple-400">{planSummary.totalDoctors} <span className="text-[10px] font-normal text-slate-400 block">{planSummary.localDoctorsCount || 88} Local</span></span>
            </div>
            <div className="bg-[#252538] border border-rose-500/40 p-2.5 rounded-lg">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block flex items-center justify-between">
                <span>Missed Dr's (Nos)</span>
                {missedDoctors.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
              </span>
              <span className="text-lg font-black text-rose-400">{missedDoctors.length}</span>
              <span className="text-[10px] font-semibold text-rose-300 block truncate" title="Remarks: TP not planned for month">
                Remarks: TP not planned
              </span>
            </div>
            <div className="bg-[#252538] border border-emerald-500/40 p-2.5 rounded-lg">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Target Coverage</span>
              <span className="text-lg font-black text-emerald-300">{planSummary.coveragePercent}% <span className="text-xs font-normal text-slate-400">({planSummary.doctorsMetMinimum}/{planSummary.totalDoctors})</span></span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SWITCHER & CONTROLS */}
      {planDays.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-[#252538] border-b border-[#3b3b5a] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubView('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSubView === 'roster'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarIcon size={14} />
              <span>Day-by-Day Roster ({planDays.length} Days)</span>
            </button>
            <button
              onClick={() => setActiveSubView('doctor_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSubView === 'doctor_matrix'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Table size={14} />
              <span>Doctor-Wise Coverage Matrix ({doctorSummary.length} Drs)</span>
            </button>
            <button
              onClick={() => setActiveSubView('missed_doctors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSubView === 'missed_doctors'
                  ? 'bg-rose-500 text-white shadow'
                  : missedDoctors.length > 0
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle size={14} className={missedDoctors.length > 0 ? "text-rose-400 animate-pulse" : ""} />
              <span>Missed Dr's ({missedDoctors.length} Nos) • Remarks: TP not planned</span>
            </button>
          </div>

          {activeSubView === 'roster' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => toggleAllExpand(true)}
                className="text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => toggleAllExpand(false)}
                className="text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="px-4 sm:px-6 py-4">
        {planDays.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-[#252538]/40 border border-[#3b3b5a]/60 rounded-xl my-4">
            <CalendarDays size={48} className="text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Call Plan Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-5">
              Select your Headquarters and Month, then click <strong>"Generate Automated Plan"</strong> to automatically create an 8-call daily schedule for all working days.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Generate Plan for {selectedHq}</span>
            </button>
          </div>
        ) : activeSubView === 'roster' ? (
          /* SUBVIEW 1: DAY-BY-DAY ROSTER */
          <div className="space-y-3">
            {planDays.map((day) => {
              const isWorking = day.type === 'Working';
              const isSunday = day.type === 'Sunday';
              const isExpanded = expandedDays[day.date];

              return (
                <div
                  key={day.date}
                  className={`rounded-xl border transition-all ${
                    isWorking
                      ? 'bg-[#252538]/70 border-[#3b3b5a]'
                      : isSunday
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-amber-950/20 border-amber-800/40'
                  }`}
                >
                  {/* Day Header Row */}
                  <div
                    onClick={() => isWorking && toggleDayExpand(day.date)}
                    className={`px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 ${
                      isWorking ? 'cursor-pointer hover:bg-[#2c2c42]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-bold text-xs ${
                        isWorking ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <span className="text-[9px] uppercase leading-none">{day.token}</span>
                        <span className="text-sm leading-none mt-0.5">{day.day}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{day.date}</span>
                          <span className="text-xs text-slate-400">({day.dayName})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isWorking ? (
                        <div className="flex items-center gap-2">
                          {day.isExMarket ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
                              <span>🚆 Ex-Market Tour: {day.marketName?.toUpperCase()}</span>
                              <span className="bg-purple-600/40 px-1.5 py-0.5 rounded text-[10px] font-mono">({day.doctors.length} Market Drs Planned)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                              <CheckCircle2 size={13} />
                              {day.doctors.length} Doctor Calls Planned (HQ Local)
                            </span>
                          )}
                          <button className="text-slate-400 hover:text-white p-1">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      ) : isSunday ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Sunday (Weekly Off)
                        </span>
                      ) : day.type === 'Leave' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                          {day.title}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <AlertTriangle size={13} />
                          Holiday: {day.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded 8-Doctor Table for Working Day */}
                  {isWorking && isExpanded && (
                    <div className="border-t border-[#3b3b5a] p-3 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#3b3b5a]/60 text-slate-400 font-semibold bg-slate-900/60">
                            <th className="py-2 px-2 text-center w-10">#</th>
                            <th className="py-2 px-3">Doctor Name</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Hospital / Clinic</th>
                            <th className="py-2 px-3">Specialization & Degree</th>
                            <th className="py-2 px-3">Available Days</th>
                            <th className="py-2 px-3">Working Area</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.doctors.map((doc, idx) => {
                            if (doc.isPlaceholder) {
                              return (
                                <tr key={doc._id} className="border-b border-[#3b3b5a]/30 bg-amber-500/5 border-dashed">
                                  <td className="py-2 px-2 text-center font-bold text-amber-400/80">{idx + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-amber-300 italic flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                                    <span>{doc.name}</span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/40">Open Slot</span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 italic">{doc.hospital || '-'}</td>
                                  <td className="py-2 px-3 text-slate-500 italic">{doc.specialization || 'Open for planning'}</td>
                                  <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">-</td>
                                  <td className="py-2 px-3 text-amber-400 font-bold">{doc.workingArea || '-'}</td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={doc._id} className="border-b border-[#3b3b5a]/30 hover:bg-[#32324d] transition-colors">
                                <td className="py-2 px-2 text-center font-bold text-sky-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                                  <Stethoscope size={13} className="text-sky-400 shrink-0" />
                                  <span>{doc.name}</span>
                                </td>
                                <td className="py-2 px-3">{getCategoryBadge(doc.category)}</td>
                                <td className="py-2 px-3 text-slate-300">{doc.hospital || '-'}</td>
                                <td className="py-2 px-3 text-slate-400">
                                  {doc.degree && doc.degree !== '-' ? doc.degree : ''} 
                                  {doc.degree && doc.specialization && doc.degree !== '-' && doc.specialization !== '-' ? ' • ' : ''}
                                  {doc.specialization && doc.specialization !== '-' ? doc.specialization : ''}
                                  {(!doc.degree || doc.degree === '-') && (!doc.specialization || doc.specialization === '-') ? '-' : ''}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {doc.visitDays || '-'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-400">{doc.workingArea || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* SUBVIEW 2: DOCTOR-WISE COVERAGE MATRIX */
          <div className="bg-[#252538] border border-[#3b3b5a] rounded-xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-900/60 border-b border-[#3b3b5a] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Doctor Call Frequency Audit ({doctorSummary.length} Doctors in {selectedHq})
              </span>
              <span className="text-xs text-slate-400">
                Minimum Targets: SuperCore ≥ 3, Core ≥ 2, Non-Core ≥ 1
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#3b3b5a] text-slate-300 font-bold bg-[#1e1e2d]">
                    <th className="py-2.5 px-3 text-center w-12">Sr #</th>
                    <th className="py-2.5 px-3">Doctor Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Hospital</th>
                    <th className="py-2.5 px-3">Available Days</th>
                    <th className="py-2.5 px-3 text-center">Min Target</th>
                    <th className="py-2.5 px-3 text-center">Planned Calls</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorSummary.map((d, i) => {
                    const met = d.plannedCalls >= d.minTarget;
                    const exceeded = d.plannedCalls > d.minTarget;

                    return (
                      <tr key={d._id} className="border-b border-[#3b3b5a]/40 hover:bg-[#32324d] transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-white">{d.name}</td>
                        <td className="py-2 px-3">{getCategoryBadge(d.category)}</td>
                        <td className="py-2 px-3 text-slate-300">{d.hospital || '-'}</td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {d.visitDays || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-300">{d.minTarget}</td>
                        <td className="py-2 px-3 text-center font-black text-sky-400 text-sm">{d.plannedCalls}</td>
                        <td className="py-2 px-3 text-center">
                          {d.isMissed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Missed: TP Not Planned
                            </span>
                          ) : exceeded ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              +{d.plannedCalls - d.minTarget} Extra Visit
                            </span>
                          ) : met ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Target Met (100%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Below Target
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubView === 'missed_doctors' && (
          /* SUBVIEW 3: MISSED DOCTORS REPORT (EX-MARKET) */
          <div className="bg-[#252538] border border-rose-500/40 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded shadow uppercase">
                  Missed Doctors Summary
                </span>
                <span className="text-xs text-rose-200 font-bold">
                  Missed Dr's: {missedDoctors.length} (Nos)
                </span>
              </div>
              <span className="text-xs font-medium text-rose-300/90 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
                ⚠️ Remarks: TP not planned for month
              </span>
            </div>

            {missedDoctors.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <span className="text-sm font-bold text-white">All Ex-Market Doctors Planned</span>
                <p className="text-xs text-slate-400">All doctor markets are fully covered in this month's Tour Program!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#3b3b5a] text-slate-300 font-bold bg-[#1e1e2d]">
                      <th className="py-2.5 px-3 text-center w-12">Sr #</th>
                      <th className="py-2.5 px-3">Doctor Name</th>
                      <th className="py-2.5 px-3">Ex-Market / City</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Hospital / Clinic</th>
                      <th className="py-2.5 px-3">Degree & Specialization</th>
                      <th className="py-2.5 px-3">Remarks / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missedDoctors.map((doc, i) => (
                      <tr key={doc._id} className="border-b border-[#3b3b5a]/40 hover:bg-[#32324d] transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{doc.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 text-[11px]">
                            {doc.workingArea || 'Ex-Market'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{getCategoryBadge(doc.category)}</td>
                        <td className="py-2.5 px-3 text-slate-300">{doc.hospital || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {doc.degree && doc.degree !== '-' ? doc.degree : ''} 
                          {doc.degree && doc.specialization && doc.degree !== '-' && doc.specialization !== '-' ? ' • ' : ''}
                          {doc.specialization && doc.specialization !== '-' ? doc.specialization : ''}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                            TP not planned for month
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
