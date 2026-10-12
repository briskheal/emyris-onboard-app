import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Navigation, MapPin, X, MoreVertical, Search, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';

interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

function GeoTagButton({
  label,
  point,
  onCapture,
  onClear,
  isOptional = false,
}: {
  label: string;
  point: GeoPoint | null;
  onCapture: () => void;
  onClear: () => void;
  isOptional?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = () => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      () => {
        onCapture();
        setLoading(false);
      },
      err => {
        setLoading(false);
        setError(
          err.code === 1
            ? 'Access denied. Settings > Safari/Chrome > Location > Allow.'
            : 'Could not get location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (point) {
    return (
      <div className="bg-[#1a1c2e] rounded-xl border border-emerald-500/40 px-4 py-3 shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <MapPin size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-400 tracking-wide">{label} Tagged ✓</p>
              <p className="text-xs text-slate-200 mt-0.5 truncate font-mono">{point.address}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
            title="Clear Tag"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        className="w-full h-[46px] rounded-xl border border-[#485382] bg-transparent flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 active:border-emerald-500 active:text-emerald-400 transition-colors disabled:opacity-50"
      >
        <Navigation size={16} className={loading ? 'animate-spin text-emerald-400' : 'text-slate-400'} />
        {loading ? 'Getting location...' : `Tap to Tag ${label} ${isOptional ? '(Optional)' : '*'}`}
      </button>
      {error && <p className="text-xs text-rose-400 mt-1.5 leading-relaxed">{error}</p>}
    </div>
  );
}

// Reusable Select Modal Component
function CustomSelect({
  label,
  value,
  options,
  onChange,
  onAddClick,
  addType,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  onAddClick?: (type: string) => void;
  addType?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative mb-4">
      <label className="block text-[13px] font-semibold text-slate-200 mb-1.5 ml-1">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      <div className="flex gap-2 items-center relative z-20">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl px-4 flex items-center justify-between text-sm text-left focus:border-emerald-500 transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 min-w-[32px] h-[26px] bg-[#2c3258] rounded text-[#4ade80] text-xs font-bold flex items-center justify-center px-1.5">
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

        {addType && onAddClick && (
          <button
            type="button"
            onClick={() => onAddClick(addType)}
            className="w-[46px] h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500 active:bg-[#2c304a] transition-colors"
            title={`Add new ${addType}`}
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>

      {/* Select Floating Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>

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
                  className="w-full bg-[#111322] border border-[#2a2f4c] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-[#3b4168] scrollbar-track-transparent">
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
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-200 rounded-lg hover:bg-[#25283f] flex items-center justify-between transition-colors"
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {value === opt && <Check size={16} className="text-[#4ade80] flex-shrink-0" />}
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

export default function ChemistForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');

  const [form, setForm] = useState<Record<string, string>>({
    businessName: '',
    proprietorName: '',
    mobileNumber: '',
    address: '',
    hq: user.hq || '',
    route: '',
    certifications: '',
    birthday: '',
    emailAddress: '',
    extraInfo: '',
  });

  const [geo1, setGeo1] = useState<GeoPoint | null>(null);
  const [geo2, setGeo2] = useState<GeoPoint | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [hqList, setHqList] = useState<string[]>([]);
  const [routeList, setRouteList] = useState<string[]>([]);
  const [routesRaw, setRoutesRaw] = useState<any[]>([]);

  // Add Route/Working Area modal state
  const [addControl, setAddControl] = useState<{ type: string; hq: string } | null>(null);
  const [newControlName, setNewControlName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch HQs on mount
  useEffect(() => {
    const fetchHQs = async () => {
      try {
        const res = await axios.get('/api/xl/hq');
        if (res.data.success && Array.isArray(res.data.data)) {
          const names = res.data.data.map((h: any) => h.hqName || h.name).filter(Boolean);
          const uniqueHqs = Array.from(new Set(names)) as string[];
          uniqueHqs.sort();
          setHqList(uniqueHqs);

          // If user has a default HQ and it's not set in form yet
          if (!form.hq && user.hq) {
            setForm(prev => ({ ...prev, hq: user.hq }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch HQs', e);
      }
    };
    fetchHQs();
  }, []);

  // Fetch routes linked to selected HQ
  useEffect(() => {
    const fetchRoutesForHq = async () => {
      if (!form.hq) {
        setRouteList([]);
        return;
      }
      try {
        const res = await axios.get(
          `/api/xl/routes?designation=${user?.designation || ''}&hq=${encodeURIComponent(form.hq)}`
        );
        if (res.data.success && Array.isArray(res.data.data)) {
          setRoutesRaw(res.data.data);
          const mapped = res.data.data
            .map((r: any) => {
              if (r.fromCity && r.toCity) {
                return r.fromCity === r.toCity ? r.toCity : `${r.fromCity} - ${r.toCity}`;
              }
              return r.toCity || r.fromCity || r.name || r.cityName || '';
            })
            .filter(Boolean);
          const uniqueRoutes = Array.from(new Set(mapped)) as string[];
          uniqueRoutes.sort();
          setRouteList(uniqueRoutes);
        }
      } catch (e) {
        console.error('Failed to fetch routes for HQ', e);
      }
    };
    fetchRoutesForHq();
  }, [form.hq]);

  const handleChange = (name: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // If HQ changes, reset selected route
      if (name === 'hq' && prev.hq !== value) {
        updated.route = '';
      }
      return updated;
    });
  };

  const captureGeo = (): Promise<GeoPoint> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newControlName.trim()) return;
    setIsAdding(true);
    try {
      const name = newControlName.trim();
      // Create Route in backend linked to current HQ
      const res = await axios.post('/api/xl/route', {
        fromCity: form.hq || name,
        toCity: name,
        hq: form.hq || user.hq || '',
        state: user.state || 'Unknown',
        areaType: 'Local',
      });
      if (res.data.success) {
        const routeLabel = form.hq && form.hq !== name ? `${form.hq} - ${name}` : name;
        setRouteList(prev => Array.from(new Set([...prev, routeLabel])).sort());
        handleChange('route', routeLabel);
      }
      setAddControl(null);
      setNewControlName('');
    } catch (err: any) {
      alert('Error adding new route: ' + (err?.response?.data?.error || err.message));
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory field validations
    if (!form.businessName.trim()) {
      setError('Business Name is required.');
      return;
    }
    if (!form.proprietorName.trim()) {
      setError('Proprietor Name is required.');
      return;
    }
    if (!form.mobileNumber.trim()) {
      setError('Mobile Number is required.');
      return;
    }
    const cleanMobile = form.mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!form.address.trim()) {
      setError('Chemist Address is required.');
      return;
    }
    if (!form.hq.trim()) {
      setError('HQ is required. Please select a Headquarter.');
      return;
    }
    if (!form.route.trim()) {
      setError('Route is required. Please select a Route / Working Area.');
      return;
    }
    if (!geo1) {
      setError('Please tag the Primary Location before saving.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: Record<string, any> = {
        businessName: form.businessName.trim(),
        name: form.businessName.trim(), // Dual support for components expecting name
        proprietorName: form.proprietorName.trim(),
        mobile: form.mobileNumber.trim(),
        mobileNumber: form.mobileNumber.trim(),
        address: form.address.trim(),
        headquarter: form.hq.trim(),
        hq: form.hq.trim(),
        workingArea: form.route.trim(),
        route: form.route.trim(),
        certifications: form.certifications ? form.certifications.trim() : '',
        birthday: form.birthday || '',
        email: form.emailAddress ? form.emailAddress.trim() : '',
        extraInformation: form.extraInfo ? form.extraInfo.trim() : '',
        employeeId: user.employeeId || '',
        userAllotted: user.employeeId || '',
        employeeName: user.name || user.fullName || '',
        status: 'Pending',
        lat1: geo1.lat,
        lng1: geo1.lng,
        geoAddress1: geo1.address,
      };

      // 2nd Geo-tag is optional / can be added if captured
      if (geo2) {
        payload.lat2 = geo2.lat;
        payload.lng2 = geo2.lng;
        payload.geoAddress2 = geo2.address;
      }

      const res = await axios.post('/api/xl/chemist', payload);
      if (res.data.success) {
        setSuccess(true);
        setForm({
          businessName: '',
          proprietorName: '',
          mobileNumber: '',
          address: '',
          hq: user.hq || '',
          route: '',
          certifications: '',
          birthday: '',
          emailAddress: '',
          extraInfo: '',
        });
        setGeo1(null);
        setGeo2(null);
        setTimeout(() => {
          navigate(-1);
        }, 1200);
      } else {
        setError(res.data.error || 'Failed to save Chemist.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl px-4 text-white placeholder-[#626a99] text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]';

  const renderInput = (
    name: string,
    label: string,
    opts?: { type?: string; placeholder?: string; required?: boolean; readOnly?: boolean; maxLength?: number }
  ) => (
    <div key={name} className="mb-4">
      <label className="block text-[13px] font-semibold text-slate-200 mb-1.5 ml-1">
        {label} {opts?.required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        className={`${inputClass} ${opts?.readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
        placeholder={opts?.placeholder || `Enter ${label}`}
        value={form[name] || ''}
        onChange={e => handleChange(name, e.target.value)}
        required={opts?.required}
        readOnly={opts?.readOnly}
        maxLength={opts?.maxLength}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111322] flex flex-col font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#1a1c2e] border-b border-[#2a2f4c] sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-bold text-white tracking-wide">Create Chemist</h1>
        </div>
        <div className="text-[#4ade80] font-semibold text-sm">Status</div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 flex-1 max-w-lg mx-auto w-full">
        {/* Business Name (Mandatory) */}
        {renderInput('businessName', 'Business Name', {
          required: true,
          placeholder: "Enter Chemist's Business Name",
        })}

        {/* Proprietor Name (Mandatory) */}
        {renderInput('proprietorName', 'Proprietor Name', {
          required: true,
          placeholder: "Enter Proprietor's Full Name",
        })}

        {/* Mobile Number (Mandatory) */}
        {renderInput('mobileNumber', 'Mobile Number', {
          type: 'tel',
          required: true,
          placeholder: 'Enter 10-digit Mobile Number',
          maxLength: 10,
        })}

        {/* Chemist Address (Mandatory) */}
        {renderInput('address', 'Address', {
          required: true,
          placeholder: "Enter Chemist's Shop Address",
        })}

        {/* Linked HQ Dropdown (Mandatory) */}
        <CustomSelect
          label="Headquarter (HQ)"
          value={form.hq || ''}
          options={hqList}
          onChange={v => handleChange('hq', v)}
          required
          placeholder="Select Headquarter"
        />

        {/* Linked Route Dropdown (Mandatory, filtered by HQ) */}
        <CustomSelect
          label="Route / Working Area"
          value={form.route || ''}
          options={routeList}
          onChange={v => handleChange('route', v)}
          required
          placeholder={form.hq ? 'Select Route' : 'Select HQ first to view Routes'}
          addType="Route"
          onAddClick={t => setAddControl({ type: t, hq: form.hq })}
        />

        {/* Optional Fields */}
        {renderInput('certifications', 'Drug License / Certification', {
          placeholder: 'Enter Drug License or Certification number',
        })}

        {renderInput('birthday', 'Proprietor Birthday', {
          type: 'date',
        })}

        {renderInput('emailAddress', 'Email Address', {
          type: 'email',
          placeholder: 'Enter Email Address',
        })}

        {renderInput('extraInfo', 'Extra Information', {
          placeholder: 'Enter any additional details or notes',
        })}

        {/* Geo-Tagging Section */}
        <div className="pt-2 mb-8">
          <p className="text-[13px] font-bold text-slate-200 mb-2 ml-1">
            Geo-Tag Location <span className="text-rose-400">*</span>
          </p>
          <p className="text-xs text-slate-400 mb-4 ml-1">
            Primary Location is mandatory. Secondary Location can be tagged now or later.
          </p>

          <div className="space-y-3">
            {/* 1st Geo-tag: Mandatory */}
            <GeoTagButton
              label="Primary Location"
              point={geo1}
              onCapture={() => captureGeo().then(setGeo1).catch(() => {})}
              onClear={() => setGeo1(null)}
            />

            {/* 2nd Geo-tag: Optional / can be done later */}
            <GeoTagButton
              label="Secondary Location"
              point={geo2}
              onCapture={() => captureGeo().then(setGeo2).catch(() => {})}
              onClear={() => setGeo2(null)}
              isOptional={true}
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400 mb-4">
            {error}
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 mb-4 text-center font-semibold">
            ✓ Chemist profile submitted successfully!
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl h-[46px] transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Saving Chemist...' : success ? 'Saved!' : 'Add Chemist'}
          </button>
        </div>
      </form>

      {/* Add Route / Area Modal */}
      {addControl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#1a1c2e] rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#3b4168] p-6 text-center relative">
            <h3 className="text-white font-semibold text-[17px] mb-2">Add New Route</h3>
            <p className="text-xs text-slate-400 mb-5">
              For Headquarter: <span className="text-emerald-400 font-bold">{addControl.hq || 'General'}</span>
            </p>

            <form onSubmit={handleAddRoute}>
              <input
                autoFocus
                type="text"
                value={newControlName}
                onChange={e => setNewControlName(e.target.value)}
                placeholder="Enter Route or Area Name"
                className="w-full bg-[#111322] border border-[#2a2f4c] rounded-xl px-4 py-3.5 text-white placeholder-[#626a99] text-sm focus:outline-none focus:border-emerald-500 transition-colors mb-6 text-center"
              />
              <button
                type="submit"
                disabled={isAdding || !newControlName.trim()}
                className="w-[200px] mx-auto block py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-sm hover:bg-emerald-500/30 active:bg-emerald-500/40 transition-colors disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Submit'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setAddControl(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
