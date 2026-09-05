import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, UserRound, Search, Navigation, 
  ChevronDown, Plus, CheckCircle2, Star, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const today = new Date().toISOString().split('T')[0];

interface Product { _id: string; name: string; }
interface Gift { _id: string; name: string; }
interface CoWorker { employeeId: string; firstName: string; lastName: string; }

export default function DCRModal({ onClose, overrideDate }: { onClose: () => void; overrideDate?: string }) {
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
  
  // Data Lists
  const [entities, setEntities] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [coworkers, setCoworkers] = useState<CoWorker[]>([]);
  
  // Working Area (from TP/CallPlan)
  const [hasApprovedTP, setHasApprovedTP] = useState(false);
  const [workingAreaType, setWorkingAreaType] = useState('Out-Station');
  const [workingAreas, setWorkingAreas] = useState('N/A');

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

  useEffect(() => {
    const dObj = new Date(dcrDate);
    const m = dObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const y = dObj.getFullYear();
    
    axios.get(`/api/xl/tour-program/my?email=${USER_EMAIL}&month=${m}&year=${y}`)
      .then(res => {
         if (res.data.success && res.data.data && res.data.data.status === 'Approved') {
             setHasApprovedTP(true);
             const entries = JSON.parse(res.data.data.entries || '[]');
             const targetDateIso = new Date(dcrDate).toISOString().split('T')[0];
             const todayEntry = entries.find((e:any) => {
                 try { return new Date(e.date).toISOString().split('T')[0] === targetDateIso; }
                 catch(err) { return e.date === dcrDate; }
             });
             if (todayEntry) {
                 setWorkingAreaType(todayEntry.type || 'Out-Station');
                 setWorkingAreas(todayEntry.toMarket || todayEntry.areaType || todayEntry.type || todayEntry.category || 'HQ');
             }
         }
      }).catch(() => {});

    axios.get('/api/xl/reports/products').then(r => setProducts(r.data.data || [])).catch(()=>{});
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
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-md bg-[#1c1c2e] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#3b3b5a]">
        <div className="flex items-center justify-between p-5 border-b border-[#3b3b5a] shrink-0 bg-[#27273f]">
          <div>
            <h2 className="text-lg font-black text-white">{entityType ? `${entityType} DCR` : 'Daily Call Report'}</h2>
            <p className="text-[10px] font-bold text-sky-400 tracking-widest uppercase mt-0.5">{dcrDate}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1c1c2e] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {error && <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm font-medium">{error}</div>}

          {/* STEP: MENU */}
          {step === 'menu' && (
            <div className="pb-16">
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

              <div className="grid grid-cols-2 gap-4">
                {['Doctor', 'Chemist', 'Stockist', 'Reminder'].map(type => (
                  <button 
                    key={type}
                    onClick={() => { setEntityType(type as any); loadEntities(type); setStep('form'); }}
                    className="bg-[#27273f] border border-[#3b3b5a] rounded-3xl p-6 flex flex-col items-center justify-center gap-3 relative shadow-lg active:scale-95 transition-transform"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${type==='Doctor' ? 'bg-rose-400/10 text-rose-400' : type==='Chemist' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-sky-400/10 text-sky-400'}`}>
                      <UserRound size={32} />
                    </div>
                    <span className="font-bold text-slate-300 text-sm">{type} Call</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: FORM */}
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
                      <div className="overflow-y-auto">
                        {entities.filter(e => (e.name||e.businessName||'').toLowerCase().includes(searchQuery.toLowerCase())).map(e => (
                          <div key={e._id} onClick={() => { setSelectedEntityId(e._id); setIsEntityDropdownOpen(false); }} className="px-4 py-3 border-b border-[#3b3b5a]/50 hover:bg-[#3b3b5a] cursor-pointer text-slate-200 text-sm">
                            {e.name || e.businessName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              <div className="flex items-center justify-between bg-[#27273f] p-4 rounded-xl border border-[#3b3b5a]">
                <span className="text-sm font-semibold text-white">Are you at location?</span>
                <button onClick={() => { setIsAtLocation(!isAtLocation); if (!isAtLocation) captureLocation(); }} className={`w-12 h-6 rounded-full transition-colors relative ${isAtLocation ? 'bg-emerald-500' : 'bg-[#1c1c2e] border border-[#3b3b5a]'}`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all ${isAtLocation ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {isAtLocation && geoLoading && <p className="text-xs text-sky-400 animate-pulse mt-[-10px] ml-4">Acquiring GPS...</p>}
              {isAtLocation && !geoLoading && geoAddress && <p className="text-xs text-emerald-400 mt-[-10px] ml-4 flex items-center gap-1"><CheckCircle2 size={12} /> Verified Location</p>}

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
    </div>
  );
}
