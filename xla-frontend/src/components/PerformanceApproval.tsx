import { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, RefreshCcw, CheckCircle, Eye, X, Search, 
  Calendar, Layers, UserCheck, AlertCircle, FileText
} from 'lucide-react';

interface PerformanceApprovalProps {
  items: any[];
  fetchPending: () => void;
  fetchCounts: () => void;
  viewMode?: 'Pending' | 'History';
  setViewMode?: (mode: 'Pending' | 'History') => void;
}

function parseJsonArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      let parsed = JSON.parse(data);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function formatDateTime(dateStr: any): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return String(dateStr);
  }
}

export default function PerformanceApproval({
  items,
  fetchPending,
  fetchCounts,
  viewMode = 'Pending',
  setViewMode
}: PerformanceApprovalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'brand' | 'keyCustomer' | 'account' | 'roi' | 'outstanding'>('brand');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((item: any) => 
      (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
      (item.employeeId && item.employeeId.toLowerCase().includes(q)) ||
      (item.hq && item.hq.toLowerCase().includes(q)) ||
      (item.month && item.month.toLowerCase().includes(q)) ||
      (item.year && String(item.year).includes(q))
    );
  }, [items, searchTerm]);

  const handleApprove = async (plan: any) => {
    if (!window.confirm(`Approve monthly performance KPI plan for ${plan.employeeName || plan.employeeId} (${plan.month} ${plan.year})?`)) return;
    setIsActionLoading(plan._id);
    try {
      const res = await axios.post('/api/xl/performance/approve', {
        id: plan._id,
        remarks: adminRemarks
      });
      if (res.data.success) {
        alert('Performance KPI plan approved successfully!');
        if (selectedPlan?._id === plan._id) setSelectedPlan(null);
        setAdminRemarks('');
        fetchPending();
        fetchCounts();
      } else {
        alert(res.data.error || 'Failed to approve plan');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to approve plan');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRelease = async (plan: any) => {
    if (!window.confirm(`Unlock and release this plan for ${plan.employeeName || plan.employeeId}? The employee will be able to modify and resubmit their targets.`)) return;
    setIsActionLoading(plan._id);
    try {
      const res = await axios.post('/api/xl/performance/release', {
        id: plan._id,
        remarks: adminRemarks
      });
      if (res.data.success) {
        alert('Plan successfully released and unlocked for the employee.');
        if (selectedPlan?._id === plan._id) setSelectedPlan(null);
        setAdminRemarks('');
        fetchPending();
        fetchCounts();
      } else {
        alert(res.data.error || 'Failed to release plan');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to release plan');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Inspect Modal calculations
  const brandList = useMemo(() => parseJsonArray(selectedPlan?.brandData), [selectedPlan]);
  const keyCustomerList = useMemo(() => parseJsonArray(selectedPlan?.keyCustomerData), [selectedPlan]);
  const accountList = useMemo(() => parseJsonArray(selectedPlan?.accountData), [selectedPlan]);
  const roiList = useMemo(() => parseJsonArray(selectedPlan?.roiData), [selectedPlan]);
  const outstandingList = useMemo(() => parseJsonArray(selectedPlan?.outstandingData), [selectedPlan]);

  const totalBrandTarget = useMemo(() => {
    return brandList.reduce((acc, row) => acc + (Number(row.monthlyTarget) || 0), 0);
  }, [brandList]);

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#151c2c] text-white">
      {/* Top Header */}
      <div className="p-4 md:p-6 pb-4 border-b border-slate-800 bg-slate-900/90 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
              Performance KPI Approvals
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {filteredItems.length} {viewMode.toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review monthly targets submitted by field team members, inspect breakdowns, and approve or release plans.
          </p>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-3">
          {setViewMode && (
            <div className="inline-flex rounded-lg bg-slate-800/90 p-1 border border-slate-700/80">
              <button
                onClick={() => setViewMode('Pending')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'Pending'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setViewMode('History')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'History'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                History / Approved
              </button>
            </div>
          )}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, ID, HQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 w-44 md:w-56"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar p-3 md:p-6">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <th className="p-3.5 pl-4 font-bold text-sky-400">Employee</th>
                <th className="p-3.5 font-bold">Month / Year</th>
                <th className="p-3.5 font-bold">Submitted Date</th>
                <th className="p-3.5 font-bold">Plan Summary</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-bold uppercase tracking-wider">
                    {viewMode === 'Pending' 
                      ? 'No pending performance KPI submissions found.' 
                      : 'No approved or past performance KPI records found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const brands = parseJsonArray(item.brandData);
                  const keyCusts = parseJsonArray(item.keyCustomerData);
                  const accounts = parseJsonArray(item.accountData);
                  const isApproved = item.status === 'Approved';
                  const isUnlockReq = !!item.unlockRequested;

                  return (
                    <tr 
                      key={item._id} 
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => { setSelectedPlan(item); setAdminRemarks(item.adminRemarks || ''); }}
                    >
                      <td className="p-3.5 pl-4">
                        <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                          {item.employeeName || item.employeeId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-sky-400 font-mono">{item.employeeId}</span>
                          <span>&bull;</span>
                          <span>{item.hq || 'HQ'}</span>
                          {item.designation && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-500">{item.designation}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-sky-400" />
                          <span className="capitalize">{item.month}</span> {item.year}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {formatDateTime(item.planningSubmittedAt || item.updatedAt)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                            {brands.length} Brands
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                            {keyCusts.length} Key Cust
                          </span>
                          {accounts.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                              {accounts.length} Accounts
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle size={12} />
                            Approved
                          </span>
                        ) : isUnlockReq ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            <ShieldAlert size={12} />
                            Unlock Requested
                          </span>
                        ) : item.planningSubmittedAt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            <FileText size={12} />
                            Final Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700/60 text-slate-400 border border-slate-600/50">
                            Unlocked
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => { setSelectedPlan(item); setAdminRemarks(item.adminRemarks || ''); }}
                            title="Inspect submitted targets"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 hover:text-sky-300 border border-sky-500/30 text-xs font-bold rounded-lg transition-colors"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* Approve Button */}
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => handleApprove(item)}
                              disabled={isActionLoading === item._id}
                              title="Approve this KPI plan"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                              <CheckCircle size={13} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Release Button */}
                          <button
                            type="button"
                            onClick={() => handleRelease(item)}
                            disabled={isActionLoading === item._id}
                            title="Unlock / release plan back to employee"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCcw size={13} className={isActionLoading === item._id ? 'animate-spin' : ''} />
                            <span>Release</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Details & Inspection Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#182032] border border-slate-700 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-4 md:p-6 pb-4 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-base shrink-0">
                  {(selectedPlan.employeeName || selectedPlan.employeeId || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base md:text-lg font-black text-white">
                      {selectedPlan.employeeName || selectedPlan.employeeId}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                      {selectedPlan.employeeId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedPlan.hq}
                    </span>
                    {selectedPlan.designation && (
                      <span className="text-xs text-slate-400">
                        &bull; {selectedPlan.designation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="capitalize font-semibold text-slate-200">
                      {selectedPlan.month} {selectedPlan.year} Plan
                    </span>
                    <span>&bull;</span>
                    <span>Submitted: {formatDateTime(selectedPlan.planningSubmittedAt || selectedPlan.updatedAt)}</span>
                    {selectedPlan.status && (
                      <>
                        <span>&bull;</span>
                        <span className={`font-bold ${selectedPlan.status === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          Status: {selectedPlan.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Stat Cards */}
            <div className="px-4 md:px-6 py-3 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Brands</span>
                <span className="text-lg font-black text-sky-400 mt-0.5 block">{brandList.length}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Key Customers</span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block">{keyCustomerList.length}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Volume/Value</span>
                <span className="text-lg font-black text-amber-400 mt-0.5 block">
                  {totalBrandTarget.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Account &amp; ROI</span>
                <span className="text-lg font-black text-indigo-400 mt-0.5 block">
                  {accountList.length + roiList.length} Entries
                </span>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-1 px-4 md:px-6 pt-3 pb-0 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setModalTab('brand')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'brand'
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Brand Analysis ({brandList.length})</span>
              </button>

              <button
                onClick={() => setModalTab('keyCustomer')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'keyCustomer'
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck size={13} />
                <span>Key Customers ({keyCustomerList.length})</span>
              </button>

              <button
                onClick={() => setModalTab('account')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'account'
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Accounts ({accountList.length})</span>
              </button>

              <button
                onClick={() => setModalTab('roi')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'roi'
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>ROI Analysis ({roiList.length})</span>
              </button>

              <button
                onClick={() => setModalTab('outstanding')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'outstanding'
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Outstanding ({outstandingList.length})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-auto custom-scrollbar p-4 md:p-6">
              {/* BRAND ANALYSIS TABLE */}
              {modalTab === 'brand' && (
                <div>
                  {brandList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-500" />
                      <p className="font-semibold text-xs uppercase tracking-wider">No Brand Targets Submitted</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <tr className="border-b border-slate-700">
                            <th className="p-3 pl-4">Sr.</th>
                            <th className="p-3">Product / Brand</th>
                            <th className="p-3 text-right">Monthly Target</th>
                            <th className="p-2.5 text-center text-slate-400">W1 Plan</th>
                            <th className="p-2.5 text-center text-slate-400">W2 Plan</th>
                            <th className="p-2.5 text-center text-slate-400">W3 Plan</th>
                            <th className="p-2.5 text-center text-slate-400">W4 Plan</th>
                            <th className="p-2.5 text-center text-slate-400">W5 Plan</th>
                            <th className="p-3 pr-4 text-right text-sky-400">Total Planned</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {brandList.map((row: any, i: number) => {
                            const name = row.productName || row.entityName || row.name || `Brand #${i + 1}`;
                            const w1 = Number(row.week1?.planned) || 0;
                            const w2 = Number(row.week2?.planned) || 0;
                            const w3 = Number(row.week3?.planned) || 0;
                            const w4 = Number(row.week4?.planned) || 0;
                            const w5 = Number(row.week5?.planned) || 0;
                            const total = w1 + w2 + w3 + w4 + w5;
                            return (
                              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 pl-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="p-3 font-bold text-white">{name}</td>
                                <td className="p-3 text-right font-bold text-sky-400">{row.monthlyTarget || 0}</td>
                                <td className="p-2.5 text-center text-slate-300">{w1}</td>
                                <td className="p-2.5 text-center text-slate-300">{w2}</td>
                                <td className="p-2.5 text-center text-slate-300">{w3}</td>
                                <td className="p-2.5 text-center text-slate-300">{w4}</td>
                                <td className="p-2.5 text-center text-slate-300">{w5}</td>
                                <td className="p-3 pr-4 text-right font-black text-emerald-400">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* KEY CUSTOMERS TABLE */}
              {modalTab === 'keyCustomer' && (
                <div>
                  {keyCustomerList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-500" />
                      <p className="font-semibold text-xs uppercase tracking-wider">No Key Customer Targets Submitted</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <tr className="border-b border-slate-700">
                            <th className="p-3 pl-4">Sr.</th>
                            <th className="p-3">Customer Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Target</th>
                            <th className="p-2.5 text-center text-slate-400">W1</th>
                            <th className="p-2.5 text-center text-slate-400">W2</th>
                            <th className="p-2.5 text-center text-slate-400">W3</th>
                            <th className="p-2.5 text-center text-slate-400">W4</th>
                            <th className="p-2.5 text-center text-slate-400">W5</th>
                            <th className="p-3 pr-4 text-right text-sky-400">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {keyCustomerList.map((row: any, i: number) => {
                            const name = row.entityName || row.name || `Customer #${i + 1}`;
                            const w1 = Number(row.week1?.planned) || 0;
                            const w2 = Number(row.week2?.planned) || 0;
                            const w3 = Number(row.week3?.planned) || 0;
                            const w4 = Number(row.week4?.planned) || 0;
                            const w5 = Number(row.week5?.planned) || 0;
                            const total = w1 + w2 + w3 + w4 + w5;
                            return (
                              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 pl-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="p-3 font-bold text-white">{name}</td>
                                <td className="p-3 text-slate-400">{row.entityType || 'Doctor'}</td>
                                <td className="p-3 text-right font-bold text-sky-400">{row.monthlyTarget || 0}</td>
                                <td className="p-2.5 text-center text-slate-300">{w1}</td>
                                <td className="p-2.5 text-center text-slate-300">{w2}</td>
                                <td className="p-2.5 text-center text-slate-300">{w3}</td>
                                <td className="p-2.5 text-center text-slate-300">{w4}</td>
                                <td className="p-2.5 text-center text-slate-300">{w5}</td>
                                <td className="p-3 pr-4 text-right font-black text-emerald-400">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ACCOUNTS TABLE */}
              {modalTab === 'account' && (
                <div>
                  {accountList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-500" />
                      <p className="font-semibold text-xs uppercase tracking-wider">No Account Targets Submitted</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <tr className="border-b border-slate-700">
                            <th className="p-3 pl-4">Sr.</th>
                            <th className="p-3">Account Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Target</th>
                            <th className="p-2.5 text-center text-slate-400">W1</th>
                            <th className="p-2.5 text-center text-slate-400">W2</th>
                            <th className="p-2.5 text-center text-slate-400">W3</th>
                            <th className="p-2.5 text-center text-slate-400">W4</th>
                            <th className="p-2.5 text-center text-slate-400">W5</th>
                            <th className="p-3 pr-4 text-right text-sky-400">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {accountList.map((row: any, i: number) => {
                            const name = row.entityName || row.name || `Account #${i + 1}`;
                            const w1 = Number(row.week1?.planned) || 0;
                            const w2 = Number(row.week2?.planned) || 0;
                            const w3 = Number(row.week3?.planned) || 0;
                            const w4 = Number(row.week4?.planned) || 0;
                            const w5 = Number(row.week5?.planned) || 0;
                            const total = w1 + w2 + w3 + w4 + w5;
                            return (
                              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 pl-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="p-3 font-bold text-white">{name}</td>
                                <td className="p-3 text-slate-400">{row.entityType || 'Hospital'}</td>
                                <td className="p-3 text-right font-bold text-sky-400">{row.monthlyTarget || 0}</td>
                                <td className="p-2.5 text-center text-slate-300">{w1}</td>
                                <td className="p-2.5 text-center text-slate-300">{w2}</td>
                                <td className="p-2.5 text-center text-slate-300">{w3}</td>
                                <td className="p-2.5 text-center text-slate-300">{w4}</td>
                                <td className="p-2.5 text-center text-slate-300">{w5}</td>
                                <td className="p-3 pr-4 text-right font-black text-emerald-400">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ROI TABLE */}
              {modalTab === 'roi' && (
                <div>
                  {roiList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-500" />
                      <p className="font-semibold text-xs uppercase tracking-wider">No Customer ROI Targets Submitted</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <tr className="border-b border-slate-700">
                            <th className="p-3 pl-4">Sr.</th>
                            <th className="p-3">Customer Name</th>
                            <th className="p-3 text-right">Target</th>
                            <th className="p-2.5 text-center text-slate-400">W1</th>
                            <th className="p-2.5 text-center text-slate-400">W2</th>
                            <th className="p-2.5 text-center text-slate-400">W3</th>
                            <th className="p-2.5 text-center text-slate-400">W4</th>
                            <th className="p-2.5 text-center text-slate-400">W5</th>
                            <th className="p-3 pr-4 text-right text-sky-400">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {roiList.map((row: any, i: number) => {
                            const name = row.entityName || row.name || `Customer #${i + 1}`;
                            const w1 = Number(row.week1?.planned) || 0;
                            const w2 = Number(row.week2?.planned) || 0;
                            const w3 = Number(row.week3?.planned) || 0;
                            const w4 = Number(row.week4?.planned) || 0;
                            const w5 = Number(row.week5?.planned) || 0;
                            const total = w1 + w2 + w3 + w4 + w5;
                            return (
                              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 pl-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="p-3 font-bold text-white">{name}</td>
                                <td className="p-3 text-right font-bold text-sky-400">{row.monthlyTarget || 0}</td>
                                <td className="p-2.5 text-center text-slate-300">{w1}</td>
                                <td className="p-2.5 text-center text-slate-300">{w2}</td>
                                <td className="p-2.5 text-center text-slate-300">{w3}</td>
                                <td className="p-2.5 text-center text-slate-300">{w4}</td>
                                <td className="p-2.5 text-center text-slate-300">{w5}</td>
                                <td className="p-3 pr-4 text-right font-black text-emerald-400">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* OUTSTANDING TABLE */}
              {modalTab === 'outstanding' && (
                <div>
                  {outstandingList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-500" />
                      <p className="font-semibold text-xs uppercase tracking-wider">No Outstanding Targets Submitted</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          <tr className="border-b border-slate-700">
                            <th className="p-3 pl-4">Sr.</th>
                            <th className="p-3">Party Name</th>
                            <th className="p-3 text-right">Target Recovery</th>
                            <th className="p-2.5 text-center text-slate-400">W1</th>
                            <th className="p-2.5 text-center text-slate-400">W2</th>
                            <th className="p-2.5 text-center text-slate-400">W3</th>
                            <th className="p-2.5 text-center text-slate-400">W4</th>
                            <th className="p-2.5 text-center text-slate-400">W5</th>
                            <th className="p-3 pr-4 text-right text-sky-400">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {outstandingList.map((row: any, i: number) => {
                            const name = row.entityName || row.name || `Party #${i + 1}`;
                            const w1 = Number(row.week1?.planned) || 0;
                            const w2 = Number(row.week2?.planned) || 0;
                            const w3 = Number(row.week3?.planned) || 0;
                            const w4 = Number(row.week4?.planned) || 0;
                            const w5 = Number(row.week5?.planned) || 0;
                            const total = w1 + w2 + w3 + w4 + w5;
                            return (
                              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 pl-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="p-3 font-bold text-white">{name}</td>
                                <td className="p-3 text-right font-bold text-sky-400">{row.monthlyTarget || 0}</td>
                                <td className="p-2.5 text-center text-slate-300">{w1}</td>
                                <td className="p-2.5 text-center text-slate-300">{w2}</td>
                                <td className="p-2.5 text-center text-slate-300">{w3}</td>
                                <td className="p-2.5 text-center text-slate-300">{w4}</td>
                                <td className="p-2.5 text-center text-slate-300">{w5}</td>
                                <td className="p-3 pr-4 text-right font-black text-emerald-400">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 md:p-6 pt-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Optional admin remarks / feedback for user..."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleRelease(selectedPlan)}
                  disabled={isActionLoading === selectedPlan._id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCcw size={14} className={isActionLoading === selectedPlan._id ? 'animate-spin' : ''} />
                  <span>Unlock / Release</span>
                </button>

                {selectedPlan.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedPlan)}
                    disabled={isActionLoading === selectedPlan._id}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-600/30 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    <span>Approve Plan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
