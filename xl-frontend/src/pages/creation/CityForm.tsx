import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, Check, AlertCircle, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

// Searchable Scrollable Custom Dropdown Component
function CustomSelect({
  label,
  value,
  options,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
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
      <label className="block text-[13px] font-semibold text-slate-200 mb-1.5 ml-1">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      <div className="flex gap-2 items-center relative z-20">
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setIsOpen(!isOpen);
          }}
          className="flex-1 h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl px-4 flex items-center justify-between text-sm text-left focus:border-sky-500 transition-all hover:border-[#4d5588]"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 min-w-[32px] h-[26px] bg-[#2c3258] rounded text-sky-400 text-xs font-bold flex items-center justify-center px-1.5">
              {options.length}
            </div>
            <span className={`truncate ${!value ? 'text-[#626a99]' : 'text-slate-100 font-medium'}`}>
              {value || placeholder || `Select ${label}`}
            </span>
          </div>
          <ChevronDown
            size={18}
            className={`text-[#626a99] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          <div className="absolute top-[75px] left-0 right-0 z-40 bg-[#1a1c2e] border border-[#3b4168] rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[300px]">
            <div className="p-2 border-b border-[#2a2f4c]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder={`Search ${label}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#111322] border border-[#2a2f4c] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-[#3b4168] scrollbar-track-transparent max-h-[220px]">
              {filtered.length === 0 ? (
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

export default function CityForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');

  const [form, setForm] = useState({
    state: '',
    hq: user.hq || '',
    areaType: 'City',
    cityName: '',
  });

  const [states, setStates] = useState<string[]>([]);
  const [hqs, setHqs] = useState<string[]>([]);
  const [existingCities, setExistingCities] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [duplicateMessage, setDuplicateMessage] = useState('');

  // Fetch states, HQs, and existing cities from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch states from database
        const stateRes = await axios.get('/api/xl/states').catch(() => null);
        if (stateRes?.data?.success && Array.isArray(stateRes.data.states)) {
          setStates(stateRes.data.states);
        } else {
          // Fallback to admin locations states
          const adminStateRes = await axios.get('/api/admin/locations/states').catch(() => null);
          if (adminStateRes?.data?.success && Array.isArray(adminStateRes.data.states)) {
            setStates(adminStateRes.data.states.map((s: any) => s.stateName).filter(Boolean));
          }
        }

        // Fetch HQs
        const hqRes = await axios.get('/api/xl/hq').catch(() => null);
        if (hqRes?.data?.success && Array.isArray(hqRes.data.data)) {
          const names = hqRes.data.data.map((h: any) => h.hqName || h.name).filter(Boolean);
          if (user.hq && !names.some((n: string) => n.toLowerCase() === user.hq.toLowerCase())) {
            names.unshift(user.hq);
          }
          const unique = Array.from(new Set(names)) as string[];
          unique.sort();
          setHqs(unique);
          if (!form.hq && unique.length > 0) {
            setForm(prev => ({ ...prev, hq: user.hq || unique[0] }));
          }
        } else if (user.hq) {
          setHqs([user.hq]);
        }

        // Fetch existing cities from database for real-time duplicate checking
        const cityRes = await axios.get('/api/xl/cities').catch(() => null);
        if (cityRes?.data?.success && Array.isArray(cityRes.data.cities)) {
          setExistingCities(cityRes.data.cities);
        }
      } catch (err) {
        console.error('Failed to load initial data for CityForm', err);
      }
    };

    fetchData();
  }, []);

  // Real-time case-insensitive duplicate check on cityName input
  useEffect(() => {
    const trimmed = form.cityName.trim();
    if (!trimmed) {
      setDuplicateMessage('');
      return;
    }

    const lower = trimmed.toLowerCase();
    const isDup = existingCities.some(c => (c || '').trim().toLowerCase() === lower);

    if (isDup) {
      setDuplicateMessage('City/Area Exists');
    } else {
      setDuplicateMessage('');
    }
  }, [form.cityName, existingCities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const cleanName = form.cityName.trim();
    if (!cleanName) {
      setServerError('City / Area Name is required');
      return;
    }

    if (!form.state) {
      setServerError('Please select a State');
      return;
    }

    if (!form.hq) {
      setServerError('Please select a Headquarter (HQ)');
      return;
    }

    // Double check duplicate before dispatching
    const lower = cleanName.toLowerCase();
    const isDup = existingCities.some(c => (c || '').trim().toLowerCase() === lower);
    if (isDup) {
      setDuplicateMessage('City/Area Exists');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/xl/city', {
        cityName: cleanName,
        state: form.state,
        hq: form.hq,
        areaType: form.areaType,
        employeeId: user.employeeId || '',
        userAllotted: user.employeeId || '',
      });

      if (res.data.success) {
        setSuccess(true);
        // Add new city to existing cities list
        setExistingCities(prev => [...prev, cleanName]);
        // Reset city name input
        setForm(prev => ({ ...prev, cityName: '' }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errMsg = res.data.message || res.data.error || 'Failed to create city';
        if (errMsg.toLowerCase().includes('exist')) {
          setDuplicateMessage('City/Area Exists');
        } else {
          setServerError(errMsg);
        }
      }
    } catch (err: any) {
      console.error('Error submitting city:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Error creating city';
      if (errMsg.toLowerCase().includes('exist')) {
        setDuplicateMessage('City/Area Exists');
      } else {
        setServerError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111322] text-slate-100 flex flex-col pb-12 font-sans">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-[#161828]/95 backdrop-blur border-b border-[#2a2f4c] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-[#21243b] hover:bg-[#2c304e] rounded-xl flex items-center justify-center text-slate-300 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">ADD CITY / AREA</h1>
            <p className="text-[11px] text-slate-400">Register new city or operational area</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20 px-2.5 py-1 rounded-full">
            {existingCities.length} Registered
          </span>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full flex-1">
        {/* Success Alert Banner */}
        {success && (
          <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400 text-sm animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span className="font-medium">City / Area registered successfully!</span>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mb-4 bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3 text-rose-400 text-sm animate-in fade-in duration-200">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#1a1c2e] border border-[#2a2f4c] rounded-2xl p-5 shadow-xl">
          {/* Area Type Segmented Switch */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-slate-200 mb-2 ml-1">
              TYPE <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#111322] p-1 rounded-xl border border-[#2a2f4c]">
              {(['City', 'Local Area'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, areaType: type }))}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    form.areaType === type
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Searchable Scrollable State Dropdown */}
          <CustomSelect
            label="State"
            required
            value={form.state}
            options={states}
            placeholder="Select State"
            onChange={val => setForm(prev => ({ ...prev, state: val }))}
          />

          {/* Searchable Scrollable HQ Dropdown */}
          <CustomSelect
            label="Headquarter (HQ)"
            required
            value={form.hq}
            options={hqs}
            placeholder="Select Headquarter"
            onChange={val => setForm(prev => ({ ...prev, hq: val }))}
          />

          {/* City / Area Name Input with Real-time Duplicate Check */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-slate-200 mb-1.5 ml-1">
              City / Area Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter city or area name..."
                value={form.cityName}
                onChange={e => {
                  setServerError('');
                  setForm(prev => ({ ...prev, cityName: e.target.value }));
                }}
                className={`w-full h-[46px] bg-[#111322] border rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                  duplicateMessage
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : form.cityName.trim().length > 1
                    ? 'border-emerald-500/60 focus:border-emerald-400'
                    : 'border-[#3b4168] focus:border-sky-500'
                }`}
              />
              {duplicateMessage ? (
                <AlertCircle
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none"
                />
              ) : form.cityName.trim().length > 1 ? (
                <Check
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none"
                />
              ) : null}
            </div>

            {/* Prominent Duplicate Warning Message */}
            {duplicateMessage ? (
              <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-xs font-semibold px-1">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{duplicateMessage}</span>
              </div>
            ) : form.cityName.trim().length > 1 ? (
              <p className="mt-1.5 text-emerald-400 text-[11px] font-medium px-1">
                City / Area name is available ✓
              </p>
            ) : (
              <p className="mt-1.5 text-slate-400 text-[11px] px-1">
                Checked automatically against existing database cities (case-insensitive)
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!duplicateMessage || !form.cityName.trim() || !form.state}
            className={`w-full h-12 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading || !!duplicateMessage || !form.cityName.trim() || !form.state
                ? 'bg-[#282c44] text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white shadow-sky-500/25'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Building2 size={18} />
                <span>SAVE CITY / AREA</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
