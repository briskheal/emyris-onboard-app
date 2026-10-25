import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Mail, Phone, MapPin, Globe, Award, Save, RefreshCw, 
  CheckCircle2, ArrowLeft, ShieldCheck, Sparkles, MessageCircle, KeyRound, Headphones 
} from 'lucide-react';
import axios from 'axios';

export default function ManageCompanyProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState('EMYRIS');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tollFree, setTollFree] = useState('');
  const [website, setWebsite] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/company-profile');
      if (res.data) {
        setName(res.data.name || 'EMYRIS BIOLIFESCIENCES PVT LTD.');
        setCompanyCode((res.data.companyCode || 'EMYRIS').toUpperCase().trim());
        setTagline(res.data.marqueeText || 'Enhancing Life, Excelling in Care.');
        setAddress(res.data.address || 'Ahmedabad, Gujarat, India');
        setPhone(res.data.phone || '7993163300');
        setEmail(res.data.email || 'adminhr@emyrishr.in');
        setTollFree(res.data.tollFree || '');
        setWebsite(res.data.website || 'https://emyrishr.in');
      }
    } catch (err) {
      console.error('Failed to load company profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const payload = {
        name: name.trim(),
        companyCode: (companyCode || 'EMYRIS').trim().toUpperCase(),
        marqueeText: tagline.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        tollFree: tollFree.trim(),
        website: website.trim(),
      };

      const res = await axios.post('/api/company-profile', payload);
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMsg(res.data.error || 'Failed to update company profile');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 font-sans pb-24 p-5 md:p-8 space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin')}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Building2 size={24} className="text-sky-400" />
              Company Profile & Contact Information
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage corporate office address, support email, phone numbers, and official details.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-sm"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 size={22} className="shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Company details updated successfully!</p>
            <p className="text-xs text-emerald-300/80">Corporate address and support contact details are now active across all portals and Field CRM drawers.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 text-sm text-rose-400">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={36} className="text-sky-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading company profile details...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Identity & Branding */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="font-bold text-white text-base">Company Identity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Company Registered Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. EMYRIS BIOLIFESCIENCES PVT LTD."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Company Code
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase().trim())}
                      placeholder="e.g. EMYRIS"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-sky-400 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors tracking-widest uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tagline / Motto
                  </label>
                  <div className="relative">
                    <Award size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Enhancing Life, Excelling in Care."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Website URL
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. https://emyrishr.in"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Official Contact & Support */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Support & Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Support Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. adminhr@emyrishr.in"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Queries from Field CRM Contact Support arrive directly at this inbox.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Helpdesk Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 7993163300"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Displayed as the primary helpdesk contact in user app.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Toll-Free Helpline (Optional)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={tollFree}
                      onChange={(e) => setTollFree(e.target.value)}
                      placeholder="e.g. 1800-XXX-XXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Corporate Office Address */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                <MapPin size={18} className="text-rose-400" />
                <h3 className="font-bold text-white text-base">Corporate Office Address</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Complete Address (Street, Building, City, State, PIN)
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Office No. 101, Business Park, S.G. Highway, Ahmedabad, Gujarat - 380054"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-medium leading-relaxed"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">This address will be presented in employee drawers, letters, payslips, and support headers.</p>
              </div>
            </div>
          </div>

          {/* Right Preview Card: Live Mobile & Drawer Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Field CRM Live Preview
            </h3>

            {/* Contact Card Preview */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">Contact Support</h4>
                  <p className="text-[11px] text-slate-400">{name || 'Emyris Biolifesciences'}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Support Email</span>
                    <span className="text-white font-bold break-all">{email || 'adminhr@emyrishr.in'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Helpdesk Contact</span>
                    <span className="text-white font-bold">{phone || '7993163300'}</span>
                  </div>
                </div>

                {tollFree && (
                  <div className="flex items-start gap-2.5">
                    <Headphones size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Toll-Free Helpline</span>
                      <span className="text-white font-bold">{tollFree}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Corporate Office</span>
                    <span className="text-white font-bold leading-tight block">{address || 'Ahmedabad, Gujarat, India'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <Save size={15} />
                  <span>Update Details</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
