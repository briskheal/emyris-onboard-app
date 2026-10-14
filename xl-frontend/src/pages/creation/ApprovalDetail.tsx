import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, MapPin, Navigation, UserRound, ShoppingBag, Building2, Banknote, FileSignature, Calendar, CalendarDays, Target, ShieldCheck, Truck, Gift } from 'lucide-react';

function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0') + '-' + parts[0];
  }
  try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
      }
  } catch (e) {}
  return dateStr;
}

function getDayName(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    }
  } catch(e) {}
  return '';
}

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { type } = useParams(); // e.g. "Tour Program", "City", "Routes"
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [expandedTps, setExpandedTps] = useState<Record<string, boolean>>({});
  const [selectedDatesMap, setSelectedDatesMap] = useState<Record<string, string[]>>({});

  const storedUser = localStorage.getItem('xl_user') || localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.isAdmin || (user?.designation && user.designation.toUpperCase() === 'ADMIN');
  const managerDesignation = isAdmin ? 'ADMIN' : (user?.designation || '');

  const toggleExpand = (tpId: string) => {
    setExpandedTps(prev => ({ ...prev, [tpId]: !prev[tpId] }));
  };

  const toggleDate = (tpId: string, dateStr: string) => {
    setSelectedDatesMap(prev => {
      const current = prev[tpId] || [];
      if (current.includes(dateStr)) {
        return { ...prev, [tpId]: current.filter(d => d !== dateStr) };
      } else {
        return { ...prev, [tpId]: [...current, dateStr] };
      }
    });
  };

  const toggleSelectAll = (tpId: string, allDates: string[]) => {
    setSelectedDatesMap(prev => {
      const current = prev[tpId] || [];
      if (current.length === allDates.length) {
        return { ...prev, [tpId]: [] };
      } else {
        return { ...prev, [tpId]: [...allDates] };
      }
    });
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        type: type || '',
        designation: managerDesignation,
        hq: user?.hq || '',
        division: user?.division || '',
        employeeId: user?.employeeId || user?.email || '',
        status: 'Pending'
      });
      const res = await axios.get(`/api/xl/approvals/pending?` + queryParams.toString());
      if (res.data.success) {
        setItems(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch pending approvals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [type]);

  const handleAction = async (recordId: string, action: string, dates?: string[]) => {
    const isPartial = dates && dates.length > 0;
    const confirmMsg = isPartial 
      ? `Are you sure you want to ${action} the ${dates.length} selected day(s)?` 
      : `Are you sure you want to ${action} this entire request?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      let remarks = '';
      if (action === 'Rejected') {
         const reason = window.prompt('Please provide a reason for rejection:');
         if (reason === null) return; // Cancelled
         remarks = reason;
      }
      const approverName = ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim() || user?.name || user?.employeeId || (isAdmin ? 'Admin' : 'Line Manager');
      const payload: any = {
        recordId,
        type,
        action,
        remarks,
        approvedBy: approverName
      };
      if (isPartial) {
        payload.dates = dates;
      }
      const res = await axios.post('/api/xl/approvals/action', payload);
      if (res.data.success) {
        if (!isPartial) {
          setItems(prev => prev.filter(item => item._id !== recordId));
        } else {
          // Refresh list to update statuses of days
          fetchPending();
        }
      } else {
        alert(res.data.message || 'Action failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
  };

  const renderDetails = (item: any) => {
    switch (type) {
      case 'City':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <MapPin size={15} className="text-rose-400" /> {item.cityName || item.name}
            </p>
            <div className="flex gap-4 text-slate-400">
              <span>State: <strong className="text-slate-200">{item.state || '-'}</strong></span>
              <span>Type: <strong className="text-slate-200">{item.areaType || 'City'}</strong></span>
            </div>
          </div>
        );

      case 'Routes':
      case 'Route':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Navigation size={15} className="text-violet-400" /> {item.fromCity} → {item.toCity}
            </p>
            <div className="flex gap-4 text-slate-400">
              <span>Area Type: <strong className="text-slate-200">{item.areaType || '-'}</strong></span>
              <span>Distance: <strong className="text-sky-400">{item.distance ?? 0} KM</strong></span>
            </div>
          </div>
        );

      case 'Doctors':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <UserRound size={15} className="text-sky-400" /> Dr. {item.name}
            </p>
            <p className="text-slate-400">
              {item.qualification || ''} {item.speciality || item.specialization ? `• ${item.speciality || item.specialization}` : ''}
            </p>
            {(item.hospitalName || item.city) && (
              <p className="text-[11px] text-slate-400">{item.hospitalName ? `${item.hospitalName}, ` : ''}{item.city || ''}</p>
            )}
          </div>
        );

      case 'Chemists':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <ShoppingBag size={15} className="text-emerald-400" /> {item.businessName || item.name}
            </p>
            <div className="flex gap-4 text-slate-400">
              <span>Contact: <strong className="text-slate-200">{item.contactPerson || '-'}</strong></span>
              <span>Phone: <strong className="text-slate-200">{item.mobile || '-'}</strong></span>
            </div>
            {item.city && <p className="text-[11px] text-slate-400">{item.city}</p>}
          </div>
        );

      case 'Stockists':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Building2 size={15} className="text-amber-400" /> {item.businessName || item.name}
            </p>
            <div className="flex gap-4 text-slate-400">
              <span>DL No: <strong className="text-slate-200">{item.dlNumber || '-'}</strong></span>
              <span>Phone: <strong className="text-slate-200">{item.phone || '-'}</strong></span>
            </div>
            {item.city && <p className="text-[11px] text-slate-400">{item.city}</p>}
          </div>
        );

      case 'Expense':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
                <Banknote size={15} /> ₹{item.amount || 0}
              </span>
              <span className="text-[11px] text-slate-400">{item.date}</span>
            </div>
            <p className="text-slate-400">Category: <strong className="text-slate-200">{item.category || 'General'}</strong></p>
            {item.remarks && <p className="text-[11px] text-slate-400 italic">"{item.remarks}"</p>}
          </div>
        );

      case 'Leave Request':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <FileSignature size={15} className="text-cyan-400" /> {item.leaveType || 'Leave Request'}
            </p>
            <p className="text-slate-400">
              Dates: <strong className="text-slate-200">{item.startDate} {item.endDate && item.endDate !== item.startDate ? `to ${item.endDate}` : ''}</strong>
            </p>
            {item.reason && <p className="text-[11px] text-slate-400 italic">Reason: {item.reason}</p>}
          </div>
        );

      case 'Tour Program': {
        let entries: any[] = [];
        try {
          entries = typeof item.entries === 'string' ? JSON.parse(item.entries || '[]') : (item.entries || []);
        } catch (e) {}
        if (!Array.isArray(entries)) entries = Object.values(entries || {});

        const sortedEntries = [...entries].sort((a: any, b: any) => {
          const tA = new Date(a.date).getTime();
          const tB = new Date(b.date).getTime();
          if (isNaN(tA) || isNaN(tB)) return (a.date || '').localeCompare(b.date || '');
          return tA - tB;
        });

        const isExpanded = expandedTps[item._id] !== false; // expanded by default
        const selectedDates = selectedDatesMap[item._id] || [];
        const allDates = sortedEntries.map((e: any) => e.date).filter(Boolean);

        const approvedCount = sortedEntries.filter((e: any) => e.status === 'Approved').length;
        const rejectedCount = sortedEntries.filter((e: any) => e.status === 'Rejected').length;
        const pendingCount = sortedEntries.filter((e: any) => !e.status || e.status === 'Pending' || e.status === 'Submitted').length;

        return (
          <div className="space-y-3">
            {/* Header summary bar */}
            <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-600/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm capitalize">{item.month} {item.year}</h4>
                  <p className="text-[11px] text-slate-400">{sortedEntries.length} Days Planned</p>
                </div>
              </div>

              {/* Status counters and expand toggle */}
              <div className="flex items-center gap-1.5">
                {approvedCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {approvedCount} Appr
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {rejectedCount} Rej
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {pendingCount} Pend
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(item._id)}
                  className="ml-1 p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={isExpanded ? 'Collapse Day-wise Plan' : 'Expand Day-wise Plan'}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Day-wise schedule */}
            {isExpanded && (
              <div className="space-y-2 pt-1">
                {/* Select All Bar */}
                <div className="flex items-center justify-between px-1 py-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={allDates.length > 0 && selectedDates.length === allDates.length}
                      onChange={() => toggleSelectAll(item._id, allDates)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Select All ({allDates.length} days)</span>
                  </label>
                  {selectedDates.length > 0 && (
                    <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      {selectedDates.length} selected
                    </span>
                  )}
                </div>

                {/* Scrollable list of days */}
                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-0.5">
                  {sortedEntries.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-500 italic">No tour program entries found</p>
                  ) : (
                    sortedEntries.map((entry: any, idx: number) => {
                      const isSelected = selectedDates.includes(entry.date);
                      const dayStatus = entry.status || item.status || 'Pending';
                      const areaType = entry.type || entry.areaType || 'HQ';
                      
                      let areaBadgeClass = 'bg-slate-700/60 text-slate-300 border-slate-600';
                      if (areaType === 'HQ') areaBadgeClass = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
                      else if (areaType === 'EX-HQ' || areaType === 'Ex-Mkt') areaBadgeClass = 'bg-violet-500/15 text-violet-300 border-violet-500/30';
                      else if (areaType === 'Out-Station') areaBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                      else if (areaType === 'Transit') areaBadgeClass = 'bg-teal-500/15 text-teal-300 border-teal-500/30';

                      return (
                        <div
                          key={entry.date || idx}
                          onClick={() => toggleDate(item._id, entry.date)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected 
                              ? 'bg-sky-950/40 border-sky-500/50 shadow-sm' 
                              : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDate(item._id, entry.date);
                            }}
                            className="w-4 h-4 rounded bg-slate-700 border-slate-500 text-sky-500 focus:ring-sky-500 shrink-0"
                          />

                          {/* Date & Day */}
                          <div className="w-24 shrink-0">
                            <div className="font-bold text-white text-xs">
                              {formatDDMMYYYY(entry.date)}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                              {getDayName(entry.date)}
                            </div>
                          </div>

                          {/* Location & Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${areaBadgeClass}`}>
                                {areaType}
                              </span>
                              {entry.isEdited && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                                  Edited
                                </span>
                              )}
                              {entry.activityType && entry.activityType !== 'Working' && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  entry.activityType === 'Leave' 
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                  {entry.activityType}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-sky-300 font-semibold truncate mt-0.5" title={entry.toMarket || '-'}>
                              {entry.toMarket || '-'}
                            </div>
                            {entry.remarks && (
                              <div className="text-[10px] text-slate-400 italic truncate">
                                {entry.remarks}
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              dayStatus === 'Approved'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : dayStatus === 'Rejected'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}>
                              {dayStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'Call Report':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Calendar size={15} className="text-sky-400" /> DCR - {item.date}
            </p>
            {item.workArea && <p className="text-slate-400">Work Area: <strong className="text-slate-200">{item.workArea}</strong></p>}
          </div>
        );

      case 'Primary Sales':
      case 'Secondary Sales':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Target size={15} className="text-cyan-400" /> {item.stockist || 'Stockist'}
              </span>
              <span className="font-bold text-emerald-400">₹{item.amount || item.totalAmount || item.netAmount || 0}</span>
            </div>
            <p className="text-slate-400">Period: <strong className="text-slate-200">{item.month || ''} {item.year || ''}</strong></p>
          </div>
        );

      case 'Samples':
      case 'Gifts':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              {type === 'Samples' ? <Truck size={15} className="text-violet-400" /> : <Gift size={15} className="text-pink-400" />} 
              {item.productName || item.giftName || item.name || 'Item'}
            </p>
            <p className="text-slate-400">Quantity: <strong className="text-slate-200">{item.quantity || 0}</strong></p>
          </div>
        );

      case 'Geo Fencing':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Navigation size={15} className="text-teal-400" /> {item.entityName || item.name || 'Entity'} ({item.entityType || 'Doctor'})
            </p>
            <p className="text-slate-400">Location: <strong className="text-slate-200">{item.location || '-'}</strong></p>
          </div>
        );

      default:
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm">{item.name || item.details || 'Pending Request'}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center gap-3">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="w-9 h-9 bg-slate-700/60 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 transition-colors shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Approve {type}</h1>
          <p className="text-xs text-slate-400">
            {items.length} pending request{items.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="px-5 mt-2">
        {loading ? (
          <p className="text-slate-300 text-center py-10">Loading...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-80">
            <h2 className="text-7xl font-black text-white drop-shadow-2xl mb-4 tracking-tighter">404</h2>
            <div className="bg-sky-500 rounded-full w-24 h-1 mb-4"></div>
            <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">NO PENDING APPROVALS FOUND!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="bg-slate-700/90 border border-slate-600 rounded-2xl p-4 shadow-lg">
                {/* Rep Header */}
                <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-slate-600/50">
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {item.employeeName || item.userAllotted || item.employeeId || 'MR'}
                    </h3>
                    <p className="text-[11px] text-sky-400 font-semibold">{item.hq || item.headquarter || 'HQ'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    {item.status || 'Pending'}
                  </span>
                </div>
                
                {/* Module Details */}
                <div className="py-1">
                  {renderDetails(item)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-600/50">
                  {type === 'Tour Program' ? (
                    <>
                      <button 
                        onClick={() => {
                          const selected = selectedDatesMap[item._id] || [];
                          handleAction(item._id, 'Rejected', selected.length > 0 ? selected : undefined);
                        }} 
                        className="flex-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                      >
                        <XCircle size={15} /> 
                        {(selectedDatesMap[item._id] || []).length > 0 
                          ? `Reject Selected (${selectedDatesMap[item._id].length})` 
                          : 'Reject Entire Plan'}
                      </button>
                      <button 
                        onClick={() => {
                          const selected = selectedDatesMap[item._id] || [];
                          handleAction(item._id, 'Approved', selected.length > 0 ? selected : undefined);
                        }} 
                        className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                      >
                        <CheckCircle size={15} /> 
                        {(selectedDatesMap[item._id] || []).length > 0 
                          ? `Approve Selected (${selectedDatesMap[item._id].length})` 
                          : 'Approve Entire Plan'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleAction(item._id, 'Rejected')} 
                        className="flex-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-bold active:bg-rose-500/20 transition-colors"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button 
                        onClick={() => handleAction(item._id, 'Approved')} 
                        className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-bold active:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
