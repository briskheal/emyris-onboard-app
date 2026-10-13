import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, CheckCircle, XCircle, MapPin, Navigation, UserRound, ShoppingBag, Building2, Banknote, FileSignature, Calendar, Target, ShieldCheck, Truck, Gift } from 'lucide-react';

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { type } = useParams(); // e.g. "Tour Program", "City", "Routes"
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const storedUser = localStorage.getItem('xl_user') || localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.isAdmin || (user?.designation && user.designation.toUpperCase() === 'ADMIN');
  const managerDesignation = isAdmin ? 'ADMIN' : (user?.designation || '');

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

  const handleAction = async (recordId: string, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      let remarks = '';
      if (action === 'Rejected') {
         const reason = window.prompt('Please provide a reason for rejection:');
         if (reason === null) return; // Cancelled
         remarks = reason;
      }
      const approverName = ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim() || user?.name || user?.employeeId || (isAdmin ? 'Admin' : 'Line Manager');
      const res = await axios.post('/api/xl/approvals/action', {
        recordId,
        type,
        action,
        remarks,
        approvedBy: approverName
      });
      if (res.data.success) {
        setItems(prev => prev.filter(item => item._id !== recordId));
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

      case 'Tour Program':
        return (
          <div className="space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <Calendar size={15} className="text-sky-400" /> {item.month} {item.year}
            </p>
            <p className="text-slate-400">
              Days Planned: <strong className="text-slate-200">
                {Array.isArray(item.entries) ? item.entries.length : (typeof item.entries === 'string' ? (() => { try { return JSON.parse(item.entries).length; } catch(e){ return '-'; } })() : '-')} days
              </strong>
            </p>
          </div>
        );

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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
