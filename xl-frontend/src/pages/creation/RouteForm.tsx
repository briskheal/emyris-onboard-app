import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, ChevronDown, Check, AlertCircle, 
  MapPin, Navigation, Edit2, CheckCircle2, Loader2, Info, Building2
} from 'lucide-react';
import axios from 'axios';

interface HqItem {
  hqName: string;
  state: string;
}

// Searchable Scrollable Custom Dropdown Component
function SearchableSelect({
  label,
  value,
  options,
  onChange,
  required,
  placeholder,
  disabled,
  allowCustom = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div className="relative mb-4">
      <label className="block text-[13px] font-semibold text-slate-200 mb-1.5 ml-1 uppercase tracking-wide">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      <div className="flex gap-2 items-center relative z-20">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setSearch('');
            setIsOpen(!isOpen);
          }}
          className={`flex-1 h-[48px] bg-[#1a1c2e] border rounded-xl px-4 flex items-center justify-between text-sm text-left transition-all ${
            disabled
              ? 'opacity-60 cursor-not-allowed border-[#2a2f4c]'
              : 'border-[#3b4168] hover:border-[#4d5588] focus:border-sky-500'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 min-w-[32px] h-[26px] bg-[#2c3258] rounded text-sky-400 text-xs font-bold flex items-center justify-center px-1.5">
              {options.length}
            </div>
            <span className={`truncate ${!value ? 'text-[#626a99]' : 'text-slate-100 font-semibold'}`}>
              {value || placeholder || `Select ${label}`}
            </span>
          </div>
          <ChevronDown
            size={18}
            className={`text-[#626a99] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          <div className="absolute top-[75px] left-0 right-0 z-40 bg-[#1a1c2e] border border-[#3b4168] rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[300px]">
            <div className="p-2 border-b border-[#2a2f4c]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder={`Search or type ${label.toLowerCase()}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#111322] border border-[#2a2f4c] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-[#3b4168] scrollbar-track-transparent max-h-[220px]">
              {allowCustom && search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(search.trim());
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-sky-500/10 text-sky-400 font-semibold hover:bg-sky-500/20 mb-1 border border-sky-500/30 flex items-center justify-between"
                >
                  <span>Use custom: "{search.trim()}"</span>
                  <Check size={14} />
                </button>
              )}

              {filtered.length === 0 && (!allowCustom || !search.trim()) ? (
                <p className="text-center text-slate-500 py-6 text-sm">No {label.toLowerCase()} found.</p>
              ) : (
                filtered.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      value === opt
                        ? 'bg-sky-500/20 text-sky-400 font-medium'
                        : 'text-slate-200 hover:bg-[#252a48]'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {value === opt && <Check size={16} className="text-sky-400 flex-shrink-0 ml-2" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RouteForm() {
  const navigate = useNavigate();

  // User Profile from LocalStorage
  const user = useMemo(() => {
    try {
      const uStr = localStorage.getItem('xl_user') || localStorage.getItem('user');
      return uStr ? JSON.parse(uStr) : {};
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    state: '',
    hq: '',
    fromCity: '',
    toCity: '',
    areaType: '', // 'Local' | 'Ex-Station' | 'Out-Station'
    distance: 0,
  });

  const [states, setStates] = useState<string[]>([]);
  const [allHqs, setAllHqs] = useState<HqItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [existingRoutes, setExistingRoutes] = useState<any[]>([]);

  const [isDistanceEditable, setIsDistanceEditable] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // 1. Load initial states, HQs, and prefill user's default state and HQ
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userHq = (user.hq || '').trim();
        const designation = (user.designation || '').trim();

        // Fetch States
        const stateRes = await axios.get('/api/xl/states').catch(() => null);
        let loadedStates: string[] = [];
        if (stateRes?.data?.success && Array.isArray(stateRes.data.states)) {
          loadedStates = stateRes.data.states;
        } else {
          const adminStateRes = await axios.get('/api/admin/locations/states').catch(() => null);
          if (adminStateRes?.data?.success && Array.isArray(adminStateRes.data.states)) {
            loadedStates = adminStateRes.data.states.map((s: any) => s.stateName).filter(Boolean);
          }
        }
        setStates(loadedStates);

        // Fetch HQs
        const division = (user.division || '').trim();
        const hqUrl = userHq
          ? `/api/xl/hq?designation=${encodeURIComponent(designation)}&hq=${encodeURIComponent(userHq)}&division=${encodeURIComponent(division)}`
          : '/api/xl/hq';
        const hqRes = await axios.get(hqUrl).catch(() => null);
        let loadedHqs: HqItem[] = [];

        if (hqRes?.data?.success && Array.isArray(hqRes.data.data)) {
          loadedHqs = hqRes.data.data
            .map((h: any) => ({
              hqName: h.hqName || h.name || '',
              state: h.state || '',
            }))
            .filter((h: HqItem) => h.hqName);
        }

        // Cross-reference HQ states if missing
        const allHqsStateLookup = await axios.get('/api/admin/locations/hqs').catch(() => null);
        if (allHqsStateLookup?.data?.success && Array.isArray(allHqsStateLookup.data.hqs)) {
          const map = new Map<string, string>();
          allHqsStateLookup.data.hqs.forEach((h: any) => {
            if (h.hqName && h.state) map.set(h.hqName.toLowerCase(), h.state);
          });
          loadedHqs = loadedHqs.map(h => ({
            ...h,
            state: h.state || map.get(h.hqName.toLowerCase()) || '',
          }));
        }
        setAllHqs(loadedHqs);

        // Resolve default State & HQ:
        // By default show logged in user's state and HQ
        const matchedHq = loadedHqs.find(h => h.hqName.toLowerCase() === userHq.toLowerCase());
        const defaultState = user.state || matchedHq?.state || (loadedHqs[0]?.state) || '';
        const defaultHq = userHq || (loadedHqs[0]?.hqName) || '';

        setForm(prev => ({
          ...prev,
          state: prev.state || defaultState,
          hq: prev.hq || defaultHq,
        }));
      } catch (err) {
        console.error('Failed to load initial route data', err);
      }
    };

    fetchInitialData();
  }, [user]);

  // 2. When State or HQ changes, fetch corresponding cities and existing routes for duplicate checks
  useEffect(() => {
    if (!form.hq && !form.state) return;

    const fetchHqData = async () => {
      try {
        // Fetch existing cities in this state/HQ
        const cityRes = await axios.get(`/api/xl/cities?state=${encodeURIComponent(form.state)}&hq=${encodeURIComponent(form.hq)}`).catch(() => null);
        if (cityRes?.data?.success && Array.isArray(cityRes.data.cities)) {
          setCities(cityRes.data.cities);
        } else {
          const adminCities = await axios.get('/api/admin/locations/cities').catch(() => null);
          if (adminCities?.data?.success && Array.isArray(adminCities.data.cities)) {
            const list = adminCities.data.cities
              .filter((c: any) => !form.state || c.state?.toLowerCase() === form.state.toLowerCase())
              .map((c: any) => c.cityName);
            setCities([...new Set(list)]);
          }
        }

        // Fetch existing routes for this HQ to check duplicates
        const routeRes = await axios.get(`/api/xl/routes?hq=${encodeURIComponent(form.hq)}`).catch(() => null);
        if (routeRes?.data?.success && Array.isArray(routeRes.data.data)) {
          setExistingRoutes(routeRes.data.data);
        } else {
          const adminRoutes = await axios.get('/api/admin/locations/routes').catch(() => null);
          if (adminRoutes?.data?.success && Array.isArray(adminRoutes.data.routes)) {
            setExistingRoutes(adminRoutes.data.routes.filter((r: any) => !form.hq || r.hq?.toLowerCase() === form.hq.toLowerCase()));
          }
        }
      } catch (err) {
        console.error('Error fetching HQ cities and routes:', err);
      }
    };

    fetchHqData();
  }, [form.state, form.hq]);

  // Available HQs filtered by selected state
  const availableHqs = useMemo(() => {
    if (!form.state) return allHqs.map(h => h.hqName);
    const filtered = allHqs.filter(h => !h.state || h.state.toLowerCase() === form.state.toLowerCase());
    return [...new Set(filtered.map(h => h.hqName))];
  }, [allHqs, form.state]);

  // 3. Real-time Duplicate Route Check
  // "if from city to to city exists then it is not going to be allowed"
  const duplicateConflict = useMemo(() => {
    const fCity = form.fromCity.trim().toLowerCase();
    const tCity = form.toCity.trim().toLowerCase();
    const currentHq = form.hq.trim().toLowerCase();

    if (!fCity || !tCity) return null;

    if (fCity === tCity) {
      return 'From City and To City cannot be the same market!';
    }

    const match = existingRoutes.find(r => {
      const rHq = (r.hq || '').trim().toLowerCase();
      const rFrom = (r.fromCity || '').trim().toLowerCase();
      const rTo = (r.toCity || '').trim().toLowerCase();
      
      const sameHq = !currentHq || !rHq || rHq === currentHq;
      return sameHq && rFrom === fCity && rTo === tCity;
    });

    if (match) {
      return `Route from "${form.fromCity}" to "${form.toCity}" already exists for ${form.hq}!`;
    }

    return null;
  }, [existingRoutes, form.hq, form.fromCity, form.toCity]);

  // 4. Area Type and Distance Calculation
  // - Local: 0 KM (no distance captured)
  // - Ex-Station: Auto-calculated Google Map road distance + editable option
  // - Out-Station: 0 KM (actual ticket fare reimbursed)
  useEffect(() => {
    if (form.areaType === 'Local') {
      setForm(prev => ({ ...prev, distance: 0 }));
      setIsDistanceEditable(false);
    } else if (form.areaType === 'Out-Station') {
      setForm(prev => ({ ...prev, distance: 0 }));
      setIsDistanceEditable(false);
    } else if (form.areaType === 'Ex-Station') {
      // Auto-calculate distance if fromCity and toCity are selected
      if (form.fromCity && form.toCity && form.fromCity !== form.toCity) {
        const fetchDistance = async () => {
          setCalcLoading(true);
          try {
            const res = await axios.get(
              `/api/xl/route/distance?fromCity=${encodeURIComponent(form.fromCity)}&toCity=${encodeURIComponent(form.toCity)}&state=${encodeURIComponent(form.state)}`
            );
            if (res.data?.success && typeof res.data.distance === 'number') {
              setForm(prev => ({ ...prev, distance: res.data.distance }));
            }
          } catch (e) {
            console.error('Failed to auto-calculate distance:', e);
          } finally {
            setCalcLoading(false);
          }
        };
        fetchDistance();
      }
    }
  }, [form.areaType, form.fromCity, form.toCity, form.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (duplicateConflict) {
      return;
    }

    if (!form.state || !form.hq || !form.fromCity || !form.toCity || !form.areaType) {
      setServerError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        state: form.state.trim(),
        hq: form.hq.toUpperCase().trim(),
        fromCity: form.fromCity.trim(),
        toCity: form.toCity.trim(),
        areaType: form.areaType,
        distance: form.areaType === 'Ex-Station' ? Number(form.distance) || 0 : 0,
        employeeId: user?.employeeId || '',
        employeeName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      };

      const res = await axios.post('/api/xl/route', payload);
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        setServerError(res.data.message || 'Failed to create route');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create route';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121324] text-slate-100 flex flex-col font-sans pb-12">
      {/* Top Header */}
      <div className="bg-[#1a1c2e] border-b border-[#2a2f4c] px-4 py-4 sticky top-0 z-30 flex items-center justify-between shadow-lg">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ChevronLeft size={22} className="text-sky-400" />
          <div className="text-left">
            <h1 className="text-base font-bold tracking-wide text-white uppercase">Add Route</h1>
            <p className="text-[11px] text-slate-400">Define a travel route & distance</p>
          </div>
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        {/* Success Banner */}
        {success && (
          <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 animate-in fade-in">
            <CheckCircle2 size={22} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Route Added Successfully!</p>
              <p className="text-xs text-emerald-300/80">Syncing with master route list...</p>
            </div>
          </div>
        )}

        {/* Server Error Banner */}
        {serverError && (
          <div className="mb-4 bg-rose-500/15 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 animate-in fade-in">
            <AlertCircle size={22} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Unable to Save Route</p>
              <p className="text-xs text-rose-300/80">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: State & HQ (Auto-populated by default) */}
          <div className="bg-[#17192c] border border-[#2a2f4c] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-[#2a2f4c] pb-2">
              <Building2 size={16} className="text-emerald-400" />
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Territory Details</h2>
            </div>

            {/* State Select */}
            <SearchableSelect
              label="State"
              value={form.state}
              options={states}
              required
              placeholder="Select State"
              onChange={val => {
                setForm(prev => ({ ...prev, state: val, hq: '' }));
              }}
            />

            {/* HQ City Select */}
            <SearchableSelect
              label="HQ City"
              value={form.hq}
              options={availableHqs}
              required
              placeholder="Select Headquarter"
              onChange={val => {
                setForm(prev => ({ ...prev, hq: val }));
              }}
            />
          </div>

          {/* Card 2: Market From & To */}
          <div className="bg-[#17192c] border border-[#2a2f4c] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-[#2a2f4c] pb-2">
              <Navigation size={16} className="text-sky-400" />
              <h2 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Market Route</h2>
            </div>

            {/* From City */}
            <SearchableSelect
              label="From City / Market"
              value={form.fromCity}
              options={cities}
              required
              placeholder="Starting Market"
              allowCustom={true}
              onChange={val => setForm(prev => ({ ...prev, fromCity: val }))}
            />

            {/* To City */}
            <SearchableSelect
              label="To City / Market"
              value={form.toCity}
              options={cities.filter(c => c.toLowerCase() !== form.fromCity.toLowerCase())}
              required
              placeholder="Destination Market"
              allowCustom={true}
              onChange={val => setForm(prev => ({ ...prev, toCity: val }))}
            />

            {/* Duplicate Conflict Warning */}
            {duplicateConflict && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs font-semibold animate-in fade-in">
                <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200 uppercase tracking-wide">Duplicate Route Blocked</p>
                  <p className="mt-0.5 text-rose-300/90">{duplicateConflict}</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Area Type & Dynamic Distance */}
          <div className="bg-[#17192c] border border-[#2a2f4c] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-[#2a2f4c] pb-2">
              <MapPin size={16} className="text-amber-400" />
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Area Type & Distance</h2>
            </div>

            <label className="block text-[13px] font-semibold text-slate-200 mb-2 uppercase tracking-wide">
              Area Type <span className="text-rose-400">*</span>
            </label>

            {/* Area Type Segmented Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['Local', 'Ex-Station', 'Out-Station'] as const).map(type => {
                const isSelected = form.areaType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, areaType: type }))}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? type === 'Local'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                          : type === 'Ex-Station'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md'
                          : 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-[#1a1c2e] border-[#2a2f4c] text-slate-400 hover:text-slate-200 hover:border-[#3b4168]'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* DYNAMIC DISTANCE VIEW BASED ON AREA TYPE */}
            {form.areaType === 'Local' && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 text-emerald-300 animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Local Market Area</p>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    No travel distance is required for local market visits. Distance is set to <span className="font-bold text-emerald-300">0 KM</span>.
                  </p>
                </div>
              </div>
            )}

            {form.areaType === 'Out-Station' && (
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3.5 flex items-start gap-3 text-purple-300 animate-in fade-in">
                <Info size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">Out-Station Route</p>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    Distance recorded as <span className="font-bold text-purple-200">0 KM</span> because reimbursement is provided against <span className="underline font-bold text-purple-200">actual ticket fare</span> (bus/train/flight) for this route.
                  </p>
                </div>
              </div>
            )}

            {form.areaType === 'Ex-Station' && (
              <div className="bg-[#1f233d] border border-sky-500/30 rounded-xl p-4 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-sky-400" />
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Google Map Road Distance</span>
                  </div>
                  {calcLoading && (
                    <div className="flex items-center gap-1.5 text-xs text-sky-400">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Calculating...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="1000"
                      value={form.distance || ''}
                      onChange={e => setForm(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                      disabled={!isDistanceEditable}
                      className="w-full bg-[#141527] border border-[#3b4168] rounded-xl px-4 py-3 text-white font-bold text-base focus:border-sky-500 focus:outline-none disabled:opacity-80"
                      placeholder="Enter distance in KM"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">
                      KM
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDistanceEditable(!isDistanceEditable)}
                    className="h-[48px] px-3.5 bg-[#2c3258] hover:bg-[#384070] text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#3b4168] transition-colors"
                    title="Edit Distance if wrong KM was picked up"
                  >
                    <Edit2 size={14} />
                    <span>{isDistanceEditable ? 'Done' : 'Edit KM'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info size={13} className="text-slate-500 flex-shrink-0" />
                  <span>Auto-calculated from market to market. You can edit this value if needed.</span>
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || Boolean(duplicateConflict) || !form.areaType || !form.fromCity || !form.toCity}
            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
              duplicateConflict || !form.areaType || !form.fromCity || !form.toCity
                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving Route...</span>
              </>
            ) : (
              <span>Add Route</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
