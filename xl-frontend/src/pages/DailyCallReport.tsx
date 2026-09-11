import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, UserRound, Search, Navigation, 
  ChevronDown, ChevronLeft, Plus, CheckCircle2, Star, Image as ImageIcon, Trash2
} from 'lucide-react';
import axios from 'axios';

const today = new Date().toLocaleDateString('en-CA'); // Gets local YYYY-MM-DD

interface Product { _id: string; name: string; }
interface Gift { _id: string; name: string; }
interface CoWorker { employeeId: string; firstName: string; lastName: string; }

const haversineMetres = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if(!lat1||!lon1||!lat2||!lon2) return Infinity;
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function DailyCallReport() {
  const locationState = useLocation().state as { overrideDate?: string } | null;
  const overrideDate = locationState?.overrideDate;
  
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('xl_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const USER_EMAIL = user ? user.employeeId : '';
  const USER_NAME = user ? `${user.firstName} ${user.lastName}` : '';
  const dcrDate = overrideDate || today;

  // Global UI State
  const [step, setStep] = useState<'menu' | 'form' | 'rating' | 'success'>('menu');
  const [entityType, setEntityType] = useState<'Doctor' | 'Chemist' | 'Stockist' | null>(null);
  
  // Validation / Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data Lists
  const [entities, setEntities] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [coworkers, setCoworkers] = useState<CoWorker[]>([]);
  
  // Working Area (from TP/CallPlan)
  const [hasApprovedTP, setHasApprovedTP] = useState(false);
  const [workingAreaType, setWorkingAreaType] = useState('Out-Station');
  const [workingAreas, setWorkingAreas] = useState('N/A');
  const [isLockedDay, setIsLockedDay] = useState(false);
  const [daySubmitted, setDaySubmitted] = useState(false);
  const [dayRemarks, setDayRemarks] = useState('');
  const [viewListType, setViewListType] = useState<string | null>(null);

  // Form State
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  // GPS
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [isAtLocation, setIsAtLocation] = useState(false);

  // Products
  const [productsDetailed, setProductsDetailed] = useState<string[]>([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // POB / Samples
  const [showPob, setShowPob] = useState(false);
  const [pobType, setPobType] = useState('PTS');
  const [pobProduct, setPobProduct] = useState('');
  const [pobRate, setPobRate] = useState('');
  const [pobSampleQty, setPobSampleQty] = useState('');
  const [pobQty, setPobQty] = useState('');
  const [pobItems, setPobItems] = useState<any[]>([]);

  // Remarks
  const [remarks, setRemarks] = useState('');

  // Rating
  const [rating, setRating] = useState(0);

  const [todaysDcrs, setTodaysDcrs] = useState<any[]>([]);

  useEffect(() => {
    if (step === 'form' && dcrDate === today && entityType !== 'Reminder') {
      captureLocation();
    }
  }, [step, dcrDate, entityType]);

  const sortedEntities = React.useMemo(() => {
    let filtered = entities.filter(e => (e.name||e.businessName||'').toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (dcrDate === today) {
      if (myLat && myLng) {
        filtered = filtered.map(e => {
          const dist1 = haversineMetres(myLat, myLng, e.lat1, e.lng1);
          const dist2 = haversineMetres(myLat, myLng, e.lat2, e.lng2);
          const minDist = Math.min(dist1, dist2);
          return { ...e, _dist: minDist };
        }).filter(e => e._dist <= 300).sort((a, b) => a._dist - b._dist);
      } else {
        // If GPS is not yet acquired for today's report, show empty list
        filtered = [];
      }
    }
    return filtered;
  }, [entities, searchQuery, myLat, myLng, dcrDate]);

  useEffect(() => {
    let dObj;
    try { dObj = new Date(dcrDate); if(isNaN(dObj.getTime())) throw new Error(); } 
    catch(e) { dObj = new Date(); }
    const m = dObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const y = dObj.getFullYear();
    
    // First, check if today is Sunday
    let locked = dObj.getDay() === 0;

    axios.get('/api/xl/settings/holidays').then(hRes => {
       const hMap: Record<string, boolean> = {};
       (hRes.data.data || []).forEach((h: any) => {
           const hd = new Date(h.date);
           hMap[`${hd.getFullYear()}-${String(hd.getMonth()+1).padStart(2,'0')}-${String(hd.getDate()).padStart(2,'0')}`] = true;
       });
       if (hMap[dcrDate]) locked = true;
       setIsLockedDay(locked);
    }).catch(() => setIsLockedDay(locked));
    
          axios.get(`/api/xl/attendance/my?email=${USER_EMAIL}&date=${dcrDate}`)
        .then(res => {
           if (res.data.success && res.data.data) {
               if (res.data.data.daySubmitted) {
                   setDaySubmitted(true);
                   setIsLockedDay(true);
               }
           }
        }).catch(()=>{});

      axios.get(`/api/xl/tour-program/my?email=${USER_EMAIL}&month=${m}&year=${y}`)
      .then(res => {
         if (res.data.success && res.data.data && res.data.data.status === 'Approved') {
             const entries = JSON.parse(res.data.data.entries || '[]');
             const targetDateIso = new Date(dcrDate).toISOString().split('T')[0];
             const todayEntry = entries.find((e:any) => {
                 try { return new Date(e.date).toISOString().split('T')[0] === targetDateIso; }
                 catch(err) { return e.date === dcrDate; }
             });
             
             if (todayEntry) {
                 const tType = (todayEntry.type || '').toLowerCase();
                 if (tType === 'sunday' || tType === 'holiday') {
                     setIsLockedDay(true);
                     setWorkingAreaType(todayEntry.type);
                     setWorkingAreas(todayEntry.type);
                 } else {
                     setWorkingAreaType(todayEntry.type || 'Out-Station');
                     setWorkingAreas(todayEntry.toMarket || todayEntry.areaType || todayEntry.type || todayEntry.category || 'HQ');
                 }
                 setHasApprovedTP(true);
             } else {
                 // No entry found for this date
                 setHasApprovedTP(false);
                 setIsLockedDay(true);
             }
         } else {
             setHasApprovedTP(false);
             setIsLockedDay(true);
         }
      }).catch(() => { setHasApprovedTP(false); setIsLockedDay(true); });

    axios.get('/api/xl/reports/products').then(r => setProducts(r.data.data || [])).catch(()=>{});
    
    axios.get(`/api/xl/dcr/my?email=${USER_EMAIL}&date=${dcrDate}`)
      .then(r => setTodaysDcrs(r.data.data || []))
      .catch(()=>{});
  }, [dcrDate, USER_EMAIL]);

  const loadEntities = (type: string) => {
    setLoading(true);
    let hq = '';
    let desig = '';
    if (user) { hq = user.hq || ''; desig = user.designation || ''; }
    
    // Ignore entities fetch for Reminder as it doesn't have an entity list usually, or just return empty
    if (type === 'Reminder') {
      setEntities([]);
      setLoading(false);
      return;
    }

    axios.get(`/api/xl/${type.toLowerCase()}s?hq=${hq}&designation=${desig}`)
      .then(res => setEntities(res.data.data || []))
      .catch(() => setError('Failed to load entities'))
      .finally(() => setLoading(false));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) { setError('GPS not supported'); return; }
    setGeoLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
        setGeoAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGeoLoading(false);
      },
      () => { setError('Failed to get precise location.'); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddPob = () => {
    if (!pobProduct) { setError('Select a product for POB'); return; }
    if (pobType === 'Custom' && !pobRate) { setError('Enter rate for Custom POB'); return; }
    
    const prodName = products.find(p => p._id === pobProduct)?.productName || 'Unknown';
    setPobItems([...pobItems, { 
      productId: pobProduct, 
      productName: prodName, 
      type: pobType, 
      rate: pobType === 'Custom' ? pobRate : pobType,
      sampleQty: pobSampleQty || '0',
      pobQty: pobQty || '0'
    }]);
    
    setPobProduct(''); setPobRate(''); setPobSampleQty(''); setPobQty('');
    setError('');
  };

  const handleSubmitInitial = () => {
    if (!selectedEntityId && entityType !== 'Reminder') { setError(`Please select a ${entityType}`); return; }
    setStep('rating');
  };

  
  const submitFinalDay = async () => {
    setLoading(true);
    try {
      await axios.post('/api/xl/attendance/submit-day', {
        employeeId: user?.employeeId,
        date: dcrDate,
        dayRemarks
      });
      setDaySubmitted(true);
      setIsLockedDay(true);
      setStep('menu');
      setSuccess('Day submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit day');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDcr = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this call report?')) return;
    try {
      await axios.delete(`/api/xl/dcr/${id}`);
      setTodaysDcrs(prev => prev.filter(d => d._id !== id));
    } catch (err: any) {
      alert('Failed to delete report');
    }
  };

  const submitFinal = async () => {
    setLoading(true);
    try {
      const eMatch = entities.find(e => e._id === selectedEntityId);
      
      const payload = {
        employeeId: USER_EMAIL,
        employeeName: USER_NAME,
        date: dcrDate,
        entityType: entityType,
        entityId: selectedEntityId,
        entityName: eMatch?.name || eMatch?.businessName || '',
        workingAreaType,
        workingAreas,
        latitude: myLat,
        longitude: myLng,
        geoAddress,
        checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        checkOutTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        productsDetailed,
        pobItems,
        discussion: remarks,
        rating
      };
      await axios.post('/api/xl/dcr', payload);
      axios.get(`/api/xl/dcr/my?email=${USER_EMAIL}&date=${dcrDate}`)
        .then(r => setTodaysDcrs(r.data.data || []))
        .catch(()=>{});
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-800 flex flex-col font-sans pb-4 text-white">
      {/* Header */}
      <div className="px-4 py-4 mt-2 flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-sky-400">{entityType ? `${entityType} DCR` : 'Daily Call Report'}</h2>
          <p className="text-[10px] font-bold text-sky-400 tracking-widest uppercase mt-0.5">{dcrDate.split('-').reverse().join('/')}</p>
        </div>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide pb-24">
          {error && <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm font-medium">{error}</div>}

          {/* STEP: MENU */}
          {step === 'menu' && (
            <div>
              {success && <div className="p-4 mb-4 mx-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold">{success}</div>}
              {/* Mobile-like Welcome Header */}
              <div className="flex items-center gap-3 mb-6">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={USER_NAME} className="w-12 h-12 rounded-full border-2 border-[#3b3b5a] object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-[#3b3b5a] flex items-center justify-center text-white font-bold text-lg">
                    {USER_NAME.charAt(0)}
                  </div>
                )}
                <h2 className="text-xl font-bold text-sky-400 leading-tight">
                  <span className="text-slate-300 text-sm block font-medium">Welcome,</span>
                  {USER_NAME}
                </h2>
              </div>

              <div className="bg-[#27273f] border border-[#3b3b5a] rounded-3xl p-5 shadow-lg mb-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-300">Today's Working Area:</h3>
                    {hasApprovedTP ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">Working</span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase px-3 py-1 rounded-full">Not Planned</span>
                    )}
                  </div>
                  
                  {hasApprovedTP && (
                    <p className="text-white font-black text-lg">{workingAreas}</p>
                  )}

                  <div className="mt-2 border-t border-[#3b3b5a] pt-3">
                    {hasApprovedTP ? (
                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} /> Tour Program Approved</div>
                    ) : (
                      <button onClick={() => { onClose(); navigate("/extras/tour-program"); }} className="text-sm font-medium text-slate-300 flex items-center gap-2 active:text-sky-300">
                        <Navigation size={16} className="text-rose-400" /> Tour Program not found. <span className="text-sky-400 font-bold ml-1 hover:underline">Click to create!</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an option to start report</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['Doctor', 'Chemist', 'Stockist', 'Reminder'].map(type => (
                  <button 
                    key={type}
                    disabled={isLockedDay}
                    onClick={() => { setEntityType(type as any); loadEntities(type); setStep('form'); }}
                    className={`bg-[#27273f] border border-[#3b3b5a] rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg transition-transform ${isLockedDay ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    {isLockedDay && (
                      <div className="absolute top-4 right-4 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                    )}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${type==='Doctor' ? 'bg-rose-400/10 text-rose-400' : type==='Chemist' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-sky-400/10 text-sky-400'}`}>
                      <UserRound size={32} />
                    </div>
                    <span className="font-bold text-slate-300 text-sm">{type} Call</span>
                  </button>
                ))}
              </div>

              {/* Final Call Report List Summary */}
              {daySubmitted ? (
                <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg">
                  <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                  <h3 className="font-bold text-emerald-400 text-base mb-1">Day's Report Submitted</h3>
                  <p className="text-xs text-emerald-400/80 font-medium text-center">Your final report for {dcrDate.split('-').reverse().join('-')} is securely locked.</p>
                </div>
              ) : (
                <div 
                  onClick={() => setStep('final')} 
                  className="mt-8 bg-[#27273f] border border-[#3b3b5a] rounded-3xl overflow-hidden shadow-lg flex cursor-pointer active:scale-95 transition-transform hover:border-sky-500/50"
                >
                  <div className="flex-1 p-5">
                    <h3 className="font-bold text-slate-200 text-sm mb-2">Final Call Report List</h3>
                    <div className="flex gap-3 text-xs font-bold">
                      <span className="text-orange-400">Doctor: {todaysDcrs.filter(d => d.entityType === 'Doctor').length}</span>
                      <span className="text-sky-400">Chemist: {todaysDcrs.filter(d => d.entityType === 'Chemist').length}</span>
                      <span className="text-emerald-400">Stockist: {todaysDcrs.filter(d => d.entityType === 'Stockist').length}</span>
                    </div>
                  </div>
                  <div className="bg-[#93c54b] w-20 flex items-center justify-center border-l border-[#3b3b5a]">
                    <span className="text-white text-3xl font-black">{todaysDcrs.length}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: FORM */}
          
          {/* STEP: FINAL SUBMIT */}
          {step === 'final' && (
            <div className="space-y-6 pb-6">
              <div className="flex items-center gap-3 text-sky-400 mb-6">
                <button onClick={() => setStep('menu')} className="w-10 h-10 rounded-full bg-[#27273f] flex items-center justify-center hover:bg-[#3b3b5a] transition-colors"><ChevronLeft size={20} /></button>
                <h3 className="font-bold text-lg">Submit Final Report</h3>
              </div>

              <div className="bg-[#27273f] rounded-3xl p-5 space-y-4 border border-[#3b3b5a]">
                <p className="text-sm text-slate-300">You are about to submit the final report for the day. This will lock your DCRs for {dcrDate}.</p>
                
                {!viewListType ? (
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div 
                      onClick={() => setViewListType('Doctor')} 
                      className="bg-[#1c1c2e] rounded-xl p-3 border border-[#3b3b5a] flex flex-col justify-center items-center cursor-pointer hover:border-orange-500/50 transition-colors"
                    >
                      <span className="text-orange-400 font-black text-2xl">{todaysDcrs.filter(d => d.entityType === 'Doctor').length}</span>
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Doctors</span>
                    </div>
                    <div 
                      onClick={() => setViewListType('Chemist')}
                      className="bg-[#1c1c2e] rounded-xl p-3 border border-[#3b3b5a] flex flex-col justify-center items-center cursor-pointer hover:border-sky-500/50 transition-colors"
                    >
                      <span className="text-sky-400 font-black text-2xl">{todaysDcrs.filter(d => d.entityType === 'Chemist').length}</span>
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Chemists</span>
                    </div>
                    <div 
                      onClick={() => setViewListType('Stockist')}
                      className="bg-[#1c1c2e] rounded-xl p-3 border border-[#3b3b5a] flex flex-col justify-center items-center cursor-pointer hover:border-emerald-500/50 transition-colors"
                    >
                      <span className="text-emerald-400 font-black text-2xl">{todaysDcrs.filter(d => d.entityType === 'Stockist').length}</span>
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Stockists</span>
                    </div>
                    <div 
                      onClick={() => setViewListType('All')}
                      className="bg-sky-500/10 rounded-xl p-3 border border-sky-500/30 flex flex-col justify-center items-center cursor-pointer hover:bg-sky-500/20 transition-colors"
                    >
                      <span className="text-sky-400 font-black text-2xl">{todaysDcrs.length}</span>
                      <span className="text-sky-400/80 font-bold text-[10px] uppercase tracking-wider">Total Calls</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-sky-400">{viewListType === 'All' ? 'All Calls' : `${viewListType}s`}</span>
                      <button onClick={() => setViewListType(null)} className="text-xs bg-[#3b3b5a] text-white px-3 py-1 rounded-full font-semibold">Back</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {todaysDcrs.filter(d => viewListType === 'All' || d.entityType === viewListType).map(d => (
                        <div key={d._id} className="bg-[#1c1c2e] p-3 rounded-xl border border-[#3b3b5a]">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-slate-200">{d.entityName || 'N/A'}</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3b3b5a] text-sky-300 font-semibold">{d.entityType}</span>
                              <button onClick={() => handleDeleteDcr(d._id)} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 p-1 rounded-md transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">{d.discussion || 'No remarks'}</div>
                        </div>
                      ))}
                      {todaysDcrs.filter(d => viewListType === 'All' || d.entityType === viewListType).length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-4">No records found.</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Remarks for the Day</span>
                  <textarea 
                    value={dayRemarks}
                    onChange={(e) => setDayRemarks(e.target.value)}
                    placeholder="Enter overall remarks..."
                    className="w-full bg-[#1c1c2e] text-white rounded-xl p-4 border border-[#3b3b5a] focus:border-sky-500 outline-none h-32 resize-none"
                  />
                </div>
              </div>

              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">{error}</div>}

              <button 
                onClick={submitFinalDay} 
                disabled={loading} 
                className="w-full h-14 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl shadow-lg shadow-sky-900/20 active:scale-95 transition-all disabled:opacity-50 mt-8"
              >
                {loading ? 'Submitting...' : 'Submit Day Final Report'}
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-6 pb-6">
              
              <div className="bg-[#27273f] rounded-2xl p-4 border border-[#3b3b5a]">
                <div className="mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Working Area Type:</p>
                  <p className="text-white font-medium">{workingAreaType}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Working Areas:</p>
                  <p className="text-white font-medium">{workingAreas}</p>
                </div>
              </div>

              {entityType !== 'Reminder' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select {entityType} <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div onClick={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)} className="w-full h-[50px] px-4 border border-[#3b3b5a] rounded-xl text-white font-semibold bg-[#27273f] flex items-center justify-between cursor-pointer">
                    <span className="truncate">{selectedEntityId ? (entities.find(e => e._id === selectedEntityId)?.name || entities.find(e => e._id === selectedEntityId)?.businessName) : `Select ${entityType}`}</span>
                    <ChevronDown size={18} className="text-slate-400" />
                  </div>
                  
                  {isEntityDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-[55px] bg-[#27273f] border border-[#3b3b5a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[250px]">
                      <div className="p-2 border-b border-[#3b3b5a] relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-[#1c1c2e] text-white text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none" />
                      </div>
                      <div className="overflow-y-auto max-h-60">
                        {sortedEntities.length > 0 ? sortedEntities.map(e => (
                          <div key={e._id} onClick={() => { setSelectedEntityId(e._id); setIsEntityDropdownOpen(false); }} className="px-4 py-3 border-b border-[#3b3b5a]/50 hover:bg-[#3b3b5a] cursor-pointer text-slate-200 text-sm flex justify-between items-center">
                            <span>{e.name || e.businessName}</span>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-sm text-slate-400">
                            {dcrDate === today 
                              ? (geoLoading ? "Acquiring GPS..." : "No tagged doctors found within 300m of your location. You must be at the clinic to report.")
                              : "No results found."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              
                {geoLoading && <p className="text-xs text-sky-400 animate-pulse ml-4">Acquiring GPS...</p>}
                {!geoLoading && geoAddress && <p className="text-xs text-emerald-400 ml-4 flex items-center gap-1"><CheckCircle2 size={12} /> Verified Location</p>}
    

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Products Detailed</label>
                <div className="relative">
                  <div onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)} className="w-full min-h-[50px] px-4 border border-[#3b3b5a] rounded-xl text-white font-semibold bg-[#27273f] flex items-center justify-between cursor-pointer">
                    <span className="truncate text-sm">{productsDetailed.length > 0 ? `${productsDetailed.length} Products Selected` : 'Select Products'}</span>
                    <ChevronDown size={18} className="text-slate-400" />
                  </div>
                  {isProductDropdownOpen && (
                    <div className="absolute z-40 left-0 right-0 top-[55px] bg-[#27273f] border border-[#3b3b5a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[250px]">
                      <div className="p-2 border-b border-[#3b3b5a]"><input type="text" placeholder="Search..." value={productSearch} onChange={e => setProductSearch(e.target.value)} onClick={e=>e.stopPropagation()} className="w-full bg-[#1c1c2e] text-white text-sm rounded-lg px-3 py-2" /></div>
                      <div className="overflow-y-auto">
                        {products.filter(p => (p.productName || '').toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                          <label key={p._id} className="flex items-center gap-3 px-4 py-3 border-b border-[#3b3b5a]/50 hover:bg-[#3b3b5a] cursor-pointer">
                            <input type="checkbox" checked={productsDetailed.includes(p._id)} onChange={(e) => {
                              if (e.target.checked) setProductsDetailed([...productsDetailed, p._id]);
                              else setProductsDetailed(productsDetailed.filter(id => id !== p._id));
                            }} className="w-4 h-4 rounded border-gray-600 text-emerald-500 bg-gray-700" />
                            <span className="text-sm text-slate-200">{p.productName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#27273f] p-4 rounded-xl border border-[#3b3b5a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">POB/Sample Details</span>
                  <button onClick={() => setShowPob(!showPob)} className={`w-10 h-5 rounded-full transition-colors relative ${showPob ? 'bg-emerald-500' : 'bg-[#1c1c2e] border border-[#3b3b5a]'}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-all ${showPob ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {showPob && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-[#3b3b5a]">
                    <div className="flex gap-4">
                      {['PTS', 'MRP', 'PTR', 'Custom'].map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="pobType" checked={pobType === t} onChange={() => setPobType(t)} className="text-emerald-500" />
                          <span className="text-xs text-slate-300">{t}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <select value={pobProduct} onChange={e => setPobProduct(e.target.value)} className="flex-1 bg-[#1c1c2e] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-white">
                        <option value="">Select Product *</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                      </select>
                      {pobType === 'Custom' && <input type="number" placeholder="Rate" value={pobRate} onChange={e => setPobRate(e.target.value)} className="w-20 bg-[#1c1c2e] border border-[#3b3b5a] rounded-lg px-2 py-2 text-sm text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />}
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input type="number" placeholder="Sample Qty" value={pobSampleQty} onChange={e => setPobSampleQty(e.target.value)} className="w-full bg-[#1c1c2e] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <input type="number" placeholder="POB Qty" value={pobQty} onChange={e => setPobQty(e.target.value)} className="w-full bg-[#1c1c2e] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button onClick={handleAddPob} className="w-10 h-10 shrink-0 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/50"><Plus size={20} /></button>
                    </div>

                    {pobItems.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {pobItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#1c1c2e] p-2 rounded-lg border border-[#3b3b5a]">
                            <div>
                              <p className="text-xs text-white font-semibold">{item.productName} <span className="text-slate-400 font-normal">({item.type}{item.rate !== item.type && item.type === 'Custom' ? ` - ${item.rate}` : ''})</span></p>
                              <p className="text-[10px] text-emerald-400">Sample: {item.sampleQty} | POB: {item.pobQty}</p>
                            </div>
                            <button onClick={() => setPobItems(pobItems.filter((_, i) => i !== idx))} className="text-rose-400"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Remarks</label>
                <input type="text" placeholder="Enter Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white" />
              </div>

              <button onClick={handleSubmitInitial} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                Add Call Report
              </button>
            </div>
          )}

          {/* STEP: RATING */}
          {step === 'rating' && (
            <div className="flex flex-col items-center justify-center py-10">
              <h2 className="text-2xl font-black text-white mb-2">Rate Your Experience</h2>
              <p className="text-sm text-slate-400 mb-8 text-center">Please tell us how your call was!</p>
              
              <div className="flex gap-2 mb-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform active:scale-75">
                    <Star size={40} className={rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
                  </button>
                ))}
              </div>

              <button onClick={submitFinal} disabled={loading} className="w-full h-14 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl shadow-lg shadow-sky-900/20 active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Success!</h2>
              <p className="text-sm text-slate-400 mb-8">Call Report successfully added</p>
              
              <button onClick={() => { setStep('menu'); setSelectedEntityId(''); setRemarks(''); setRating(0); setPobItems([]); setProductsDetailed([]); setIsAtLocation(false); }} className="px-8 h-12 bg-[#27273f] border border-[#3b3b5a] text-white font-bold rounded-xl hover:bg-[#3b3b5a] transition-colors">
                Close
              </button>
            </div>
          )}

        </div>
      </div>
  );
}
