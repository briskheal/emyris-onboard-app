import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Navigation, MapPin, X, MoreVertical, Search, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';

const CATEGORIES = [
  'Non-Core (1 Visit/Month)',
  'Core (2 Visits/Month)',
  'SuperCore (3 Visits/Month)'
];

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
}: {
  label: string;
  point: GeoPoint | null;
  onCapture: () => void;
  onClear: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = () => {
    if (!navigator.geolocation) { setError('GPS not supported on this device.'); return; }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      () => {
        onCapture();
        setLoading(false);
      },
      err => {
        setLoading(false);
        setError(err.code === 1
          ? 'Access denied. Settings > Safari > Location > Allow.'
          : 'Could not get location. Try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (point) {
    return (
      <div className="bg-[#2c2f48] rounded-xl border border-emerald-500/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <MapPin size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">{label} Tagged ✓</p>
              <p className="text-xs text-slate-200 mt-0.5">{point.address}</p>
            </div>
          </div>
          <button onClick={onClear} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
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
        className="w-full h-[46px] rounded-xl border border-[#485382] bg-transparent flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 active:border-sky-500 active:text-sky-400 transition-colors disabled:opacity-50"
      >
        <Navigation size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Getting location...' : `Tap to Tag ${label}`}
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
  required
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  onAddClick?: (type: string) => void;
  addType?: string;
  required?: boolean;
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
          className="flex-1 h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl px-4 flex items-center justify-between text-sm text-left focus:border-sky-500 transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 min-w-[32px] h-[26px] bg-[#2c3258] rounded text-[#4ade80] text-xs font-bold flex items-center justify-center px-1.5">
              {options.length}
            </div>
            <span className={`truncate ${!value ? 'text-[#626a99]' : 'text-slate-100'}`}>
              {value || `Select ${label}`}
            </span>
          </div>
          <ChevronDown size={18} className={`text-[#626a99] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {addType && onAddClick && (
          <button
            type="button"
            onClick={() => onAddClick(addType)}
            className="w-[46px] h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl flex items-center justify-center text-slate-300 hover:bg-[#25283f] active:bg-[#2c304a]"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>

      {/* Select Floating Dropdown */}
      {isOpen && (
        <>
          {/* Invisible overlay to close dropdown when clicking outside */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute top-[75px] left-0 right-[54px] z-40 bg-[#1a1c2e] border border-[#3b4168] rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 border-b border-[#2a2f4c]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#111322] border border-[#2a2f4c] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            
            <div className="max-h-[220px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-[#3b4168] scrollbar-track-transparent">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-sm">No options found.</p>
              ) : (
                filtered.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-200 rounded-lg hover:bg-[#25283f] flex items-center justify-between transition-colors"
                  >
                    {opt}
                    {value === opt && <Check size={16} className="text-[#4ade80]" />}
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

export default function DoctorForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');
  
  const [form, setForm] = useState<Record<string, string>>({
    hq: user.hq || ''
  });
  const [geo1, setGeo1] = useState<GeoPoint | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [controls, setControls] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Add Control State
  const [addControl, setAddControl] = useState<{type: string, hq: string} | null>(null);
  const [newControlName, setNewControlName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchControls = async () => {
      try {
        const res = await axios.get('/api/xl/controls');
        if (res.data.success) {
          setControls(res.data.controls || []);
          setCities(res.data.cities || []);
        }
      } catch (e) {
        console.error('Failed to fetch controls', e);
      }
    };
    fetchControls();
  }, []);

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const checkHQMatch = (itemHq?: string) => {
    const hq = form.hq;
    if (!hq || !itemHq) return true;
    const chq = itemHq.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uhq = hq.toLowerCase().replace(/[^a-z0-9]/g, '');
    return chq.includes(uhq) || uhq.includes(chq);
  };

  const getControlNames = (type: string) => {
    return Array.from(new Set(
      controls
        .filter(c => c.type === type && c.isActive !== false && (type !== 'Hospital' || checkHQMatch(c.hq)))
        .map(c => c.name)
    )).sort();
  };

  const getCityNames = () => {
    return Array.from(new Set(
      cities
        .filter(c => checkHQMatch(c.hq))
        .map(c => c.cityName)
    )).sort();
  };

  const handleAddControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newControlName.trim()) return;
    setIsAdding(true);
    try {
      if (addControl?.type === 'Working Area') {
        const res = await axios.post('/api/xl/city', {
          cityName: newControlName.trim(),
          hq: addControl.hq,
          state: 'Unknown',
          areaType: 'Working Area'
        });
        if(res.data.success) {
          setCities(prev => [...prev, res.data.data]);
          handleChange('workingArea', res.data.data.cityName);
        }
      } else {
        const res = await axios.post('/api/xl/controls', {
          type: addControl?.type,
          name: newControlName.trim(),
          hq: addControl?.hq,
          isActive: true
        });
        if(res.data.success) {
          setControls(prev => [...prev, res.data.control]);
          handleChange('hospital', res.data.control.name);
        }
      }
      setAddControl(null);
      setNewControlName('');
    } catch(err: any) {
      alert('Error adding new ' + addControl?.type);
    } finally {
      setIsAdding(false);
    }
  };

  const captureGeo = (): Promise<GeoPoint> => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geo1) { setError('Please tag the Primary Location before saving.'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/xl/doctor', {
        ...form,
        employeeId: user.employeeId,
        lat1: geo1.lat, lng1: geo1.lng, geoAddress1: geo1.address
      });
      setSuccess(true);
      setForm({ hq: user.hq || '' });
      setGeo1(null);
      setTimeout(() => setSuccess(false), 3000);
      navigate(-1);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-[46px] bg-[#1a1c2e] border border-[#3b4168] rounded-xl px-4 text-white placeholder-[#626a99] text-sm focus:outline-none focus:border-sky-500 transition-colors [color-scheme:dark]";

  const renderInput = (name: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean; readOnly?: boolean }) => (
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
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111322] flex flex-col font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#1a1c2e] border-b border-[#2a2f4c] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-slate-300">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-bold text-white tracking-wide">Create Doctor</h1>
        </div>
        <div className="text-[#4ade80] font-semibold text-sm">Status</div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 flex-1 max-w-lg mx-auto w-full">
        {renderInput('name', 'Name', { required: true, placeholder: "Enter Doctor's Name" })}
        
        <CustomSelect 
          label="Degree" 
          value={form.degree || ''} 
          options={getControlNames('Degree')} 
          onChange={v => handleChange('degree', v)} 
          required 
          addType="Degree"
          onAddClick={(t) => setAddControl({type: t, hq: form.hq})}
        />
        
        <CustomSelect 
          label="Specialization" 
          value={form.specialization || ''} 
          options={getControlNames('Specialization')} 
          onChange={v => handleChange('specialization', v)} 
          required 
          addType="Specialization"
          onAddClick={(t) => setAddControl({type: t, hq: form.hq})}
        />
        
        <CustomSelect 
          label="Hospital" 
          value={form.hospital || ''} 
          options={getControlNames('Hospital')} 
          onChange={v => handleChange('hospital', v)}
          addType="Hospital"
          onAddClick={(t) => setAddControl({type: t, hq: form.hq})}
        />

        {renderInput('birthday', 'Birthday', { type: 'date' })}
        {renderInput('anniversary', 'Marriage Anniversary', { type: 'date' })}
        
        {renderInput('mobileNumber', 'Mobile Number', { type: 'tel', required: true, placeholder: "Enter Doctor's Mobile Number" })}
        {renderInput('contactNumber', "Clinic's Contact Number", { type: 'tel', placeholder: "Enter Clinic's Contact Number" })}
        {renderInput('emailAddress', 'Email Address', { type: 'email', placeholder: "Enter Email Address" })}

        <CustomSelect 
          label="Category" 
          value={form.category || ''} 
          options={CATEGORIES} 
          onChange={v => handleChange('category', v)} 
          required 
        />

        {renderInput('address', "Clinic's Address", { placeholder: "Enter Clinic's Address" })}
        
        {renderInput('hq', 'HQ', { required: true, readOnly: true, placeholder: 'Select HQ' })}
        
        <CustomSelect 
          label="Working Area" 
          value={form.workingArea || ''} 
          options={getCityNames()} 
          onChange={v => handleChange('workingArea', v)} 
          required 
          addType="Working Area"
          onAddClick={(t) => setAddControl({type: t, hq: form.hq})}
        />

        {renderInput('extraInfo', 'Extra Information', { placeholder: 'Enter Extra Information' })}

        {/* Geo-Tagging */}
        <div className="pt-2 mb-8">
          <p className="text-[13px] font-bold text-slate-200 mb-4 ml-1">
            Geo-Tag Location <span className="text-rose-400">*</span>
          </p>
          <div className="space-y-3">
            <GeoTagButton
              label="Primary Location"
              point={geo1}
              onCapture={() => captureGeo().then(setGeo1).catch(() => {})}
              onClear={() => setGeo1(null)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl h-[46px] transition-colors flex items-center justify-center">
            {loading ? 'Saving...' : 'Add Doctor'}
          </button>
        </div>
      </form>

      {/* Add Control Modal */}
      {addControl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#1a1c2e] rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#3b4168] p-6 text-center">
            <h3 className="text-white font-semibold text-[17px] mb-6">Add {addControl.type}</h3>
            
            <form onSubmit={handleAddControl}>
              <input 
                autoFocus
                type="text" 
                value={newControlName} 
                onChange={e => setNewControlName(e.target.value)} 
                placeholder={`Enter ${addControl.type} here`} 
                className="w-full bg-[#111322] border border-[#2a2f4c] rounded-xl px-4 py-3.5 text-white placeholder-[#626a99] text-sm focus:outline-none focus:border-emerald-500 transition-colors mb-6 text-center"
              />
              <button 
                type="submit" 
                disabled={isAdding || !newControlName.trim()} 
                className="w-[200px] mx-auto block py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-sm hover:bg-emerald-500/30 active:bg-emerald-500/40 transition-colors disabled:opacity-50"
              >
                {isAdding ? 'Submitting...' : 'Submit'}
              </button>
            </form>
            
            {/* Close button for modal */}
            <button onClick={() => setAddControl(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
               <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
