import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Moon, Sun, MessageCircle, Users, Activity, ListTodo, Key, LogOut, 
  Mail, Phone, MapPin, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Send, ShieldCheck, ChevronRight, UserCheck, Headphones
} from 'lucide-react';
import axios from 'axios';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function NavigationDrawer({ isOpen, onClose, user }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('xl_theme') !== 'light';
  });
  const [logoUrl, setLogoUrl] = useState('');

  const handleToggleTheme = () => {
    const nextTheme = !isDarkTheme;
    setIsDarkTheme(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.remove('theme-light');
      localStorage.setItem('xl_theme', 'dark');
    } else {
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('xl_theme', 'light');
    }
  };

  // Modals state
  const [activeModal, setActiveModal] = useState<'PASSWORD' | 'CONTACT' | 'HIERARCHY' | 'CONSOLIDATED' | 'TODAY' | 'LOGOUT' | null>(null);

  // Change Password State
  const [pwStep, setPwStep] = useState<'INIT' | 'REQUESTING' | 'ENTER_PIN' | 'SUCCESS'>('INIT');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Contact Support State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  // Hierarchy State
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Consolidated Activity State
  const [consolidatedData, setConsolidatedData] = useState<any>(null);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);

  // Today's Activity State
  const [todaysData, setTodaysData] = useState<any>(null);
  const [todaysLoading, setTodaysLoading] = useState(false);

  const [corporateAddress, setCorporateAddress] = useState('Ahmedabad, Gujarat, India');
  const [supportEmail, setSupportEmail] = useState('adminhr@emyrishr.in');
  const [helpdeskPhone, setHelpdeskPhone] = useState('7993163300');
  const [tollFree, setTollFree] = useState('');

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/company-profile')
        .then(res => {
          if (res.data) {
            if (res.data.logoUrl) {
              setLogoUrl(res.data.logoUrl);
            }
            if (res.data.address) {
              setCorporateAddress(res.data.address);
            }
            if (res.data.email) {
              setSupportEmail(res.data.email);
            }
            if (res.data.phone) {
              setHelpdeskPhone(res.data.phone);
            }
            if (res.data.tollFree) {
              setTollFree(res.data.tollFree);
            }
          }
        })
        .catch(err => console.error("Failed to load company profile", err));
    }
  }, [isOpen]);

  // Resend Countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('xl_user');
    localStorage.removeItem('xl_token');
    onClose();
    navigate('/login');
  };

  // --- PASSWORD ACTIONS ---
  const handleOpenChangePassword = () => {
    setActiveModal('PASSWORD');
    setPwStep('REQUESTING');
    setPin('');
    setNewPassword('');
    setConfirmPassword('');
    setPwError('');
    setPwSuccessMsg('');
    setPwLoading(true);

    // Automatically trigger PIN to user's registered email without asking email ID
    axios.post('/api/xl/user/change-password/request-pin', {
      employeeId: user?.employeeId,
      email: user?.email,
      userId: user?._id
    })
    .then(res => {
      setPwLoading(false);
      if (res.data.success) {
        setMaskedEmail(res.data.maskedEmail || user?.email || 'registered email');
        setPwStep('ENTER_PIN');
        setResendTimer(30);
      } else {
        setPwError(res.data.message || 'Failed to send verification PIN');
      }
    })
    .catch(err => {
      setPwLoading(false);
      setPwError(err.response?.data?.message || 'Server error while sending verification PIN');
    });
  };

  const handleResendPin = () => {
    if (resendTimer > 0) return;
    setPwLoading(true);
    setPwError('');
    axios.post('/api/xl/user/change-password/request-pin', {
      employeeId: user?.employeeId,
      email: user?.email,
      userId: user?._id
    })
    .then(res => {
      setPwLoading(false);
      if (res.data.success) {
        setResendTimer(30);
      } else {
        setPwError(res.data.message || 'Failed to resend PIN');
      }
    })
    .catch(err => {
      setPwLoading(false);
      setPwError(err.response?.data?.message || 'Failed to resend PIN');
    });
  };

  const handleVerifyAndSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.trim().length !== 6) {
      setPwError('Please enter the 6-digit verification PIN received in your email.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPwError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match. Please re-enter.');
      return;
    }

    setPwLoading(true);
    setPwError('');
    axios.post('/api/xl/user/change-password/verify-pin', {
      employeeId: user?.employeeId,
      email: user?.email,
      userId: user?._id,
      pin: pin.trim(),
      newPassword: newPassword.trim()
    })
    .then(res => {
      setPwLoading(false);
      if (res.data.success) {
        setPwSuccessMsg(res.data.message || 'Password changed successfully!');
        setPwStep('SUCCESS');
      } else {
        setPwError(res.data.message || 'Verification failed. Please check your PIN.');
      }
    })
    .catch(err => {
      setPwLoading(false);
      setPwError(err.response?.data?.message || 'Server error updating password.');
    });
  };

  // --- HIERARCHY ACTION ---
  const handleOpenHierarchy = () => {
    setActiveModal('HIERARCHY');
    setHierarchyLoading(true);
    axios.get(`/api/xl/user/hierarchy?employeeId=${encodeURIComponent(user?.employeeId || '')}`)
      .then(res => {
        setHierarchyLoading(false);
        if (res.data.success) {
          setHierarchyData(res.data);
        }
      })
      .catch(() => setHierarchyLoading(false));
  };

  // --- CONSOLIDATED ACTIVITY ACTION ---
  const handleOpenConsolidated = () => {
    setActiveModal('CONSOLIDATED');
    setConsolidatedLoading(true);
    axios.get(`/api/xl/user/consolidated-activity?employeeId=${encodeURIComponent(user?.employeeId || '')}`)
      .then(res => {
        setConsolidatedLoading(false);
        if (res.data.success) {
          setConsolidatedData(res.data.data);
        }
      })
      .catch(() => setConsolidatedLoading(false));
  };

  // --- TODAY'S ACTIVITY ACTION ---
  const handleOpenToday = () => {
    setActiveModal('TODAY');
    setTodaysLoading(true);
    axios.get(`/api/xl/user/todays-activity?employeeId=${encodeURIComponent(user?.employeeId || '')}`)
      .then(res => {
        setTodaysLoading(false);
        if (res.data.success) {
          setTodaysData(res.data.data);
        }
      })
      .catch(() => setTodaysLoading(false));
  };

  // --- CONTACT SUPPORT ACTION ---
  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSending(true);
    axios.post('/api/xl/user/contact-support', {
      employeeId: user?.employeeId,
      subject: contactSubject || 'Support Query',
      message: contactMessage
    })
    .then(() => {
      setContactSending(false);
      setContactSent(true);
      setTimeout(() => {
        setContactSent(false);
        setContactSubject('');
        setContactMessage('');
        setActiveModal(null);
      }, 2000);
    })
    .catch(() => setContactSending(false));
  };

  const menuItems = [
    { label: 'Contact Us', icon: MessageCircle, onClick: () => setActiveModal('CONTACT') },
    { label: 'My Hierarchy', icon: Users, onClick: handleOpenHierarchy },
    { label: 'Consolidated Activity', icon: Activity, onClick: handleOpenConsolidated },
    { label: "Today's Activity", icon: ListTodo, onClick: handleOpenToday },
    { label: 'Change Password', icon: Key, onClick: handleOpenChangePassword },
    { label: 'Logout', icon: LogOut, onClick: () => setActiveModal('LOGOUT'), isDestructive: true },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!activeModal) onClose();
        }}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-slate-800 z-[101] shadow-2xl flex flex-col font-sans overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-700 px-6 pt-12 pb-6 border-b border-slate-700/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-600 text-slate-300 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-4 mb-4 mt-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-2xl">
                EM
              </div>
            )}
            <div>
              <h1 className="text-[17px] font-black text-white tracking-tight leading-none mb-1">EMYRIS BIOLIFESCIENCES</h1>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-3 mt-6 bg-slate-600/30 p-3 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
                <Users size={20} className="text-sky-400" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate leading-tight">{user.firstName} {user.lastName}</p>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block truncate max-w-full">
                  {user.designation || 'TERRITORY BUSINESS MANAGER'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 pb-24">
          
          {/* Dark Theme Toggle */}
          <button 
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-700/50 border border-slate-700/30 mb-2 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                {isDarkTheme ? <Moon size={16} className="text-sky-400" /> : <Sun size={16} className="text-amber-500" />}
              </div>
              <span className="text-sm font-bold text-slate-300">
                {isDarkTheme ? 'Dark Theme' : 'Light Theme'}
              </span>
            </div>
            
            <div className={`w-12 h-6 rounded-full p-1 flex transition-colors ${isDarkTheme ? 'bg-sky-500' : 'bg-slate-400'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkTheme ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
          
          <div className="h-px bg-slate-700 my-2" />

          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors active:bg-slate-700/80 hover:bg-slate-700/40"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-700 text-sky-400'}`}>
                <item.icon size={16} />
              </div>
              <span className={`text-sm font-bold ${item.isDestructive ? 'text-rose-500' : 'text-slate-300'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 1. CHANGE PASSWORD MODAL (PIN sent directly to user's captured email) */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'PASSWORD' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Password</h3>
                <p className="text-xs text-slate-400">Security Verification via Registered Email</p>
              </div>
            </div>

            {pwStep === 'REQUESTING' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <RefreshCw size={36} className="text-sky-400 animate-spin" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Sending Verification PIN...</p>
                  <p className="text-xs text-slate-400">
                    Dispatching 6-digit PIN to registered email address without asking for credentials.
                  </p>
                </div>
                {pwError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}
              </div>
            )}

            {pwStep === 'ENTER_PIN' && (
              <form onSubmit={handleVerifyAndSubmitPassword} className="space-y-4">
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <Mail size={18} className="text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-sky-300 mb-0.5">PIN Sent to Registered Email</p>
                    <p className="text-slate-300">
                      Enter the 6-digit code sent to <strong className="text-white">{maskedEmail}</strong>.
                    </p>
                  </div>
                </div>

                {pwError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    6-Digit Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono font-black text-sky-400 tracking-[8px] focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={handleResendPin}
                      disabled={resendTimer > 0 || pwLoading}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold disabled:text-slate-500"
                    >
                      {resendTimer > 0 ? `Resend PIN in ${resendTimer}s` : 'Resend PIN'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading || pin.length !== 6 || !newPassword}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 text-sm mt-2 flex items-center justify-center gap-2"
                >
                  {pwLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving in Database...</span>
                    </>
                  ) : (
                    <span>Save Password in Database</span>
                  )}
                </button>
              </form>
            )}

            {pwStep === 'SUCCESS' && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-in zoom-in-50">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Password Changed!</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-[260px]">
                    {pwSuccessMsg || 'Your new password has been saved in the database. Confirmation has been communicated to your registered email.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 2. CONTACT US MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'CONTACT' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Contact Support</h3>
                <p className="text-xs text-slate-400">Emyris Biolifesciences Help Desk</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-slate-400 font-semibold">Official Support Email</p>
                  <a href={`mailto:${supportEmail}`} className="text-white font-bold hover:underline">
                    {supportEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-slate-400 font-semibold">Helpdesk Contact</p>
                  <a href={`tel:${helpdeskPhone}`} className="text-white font-bold hover:underline">
                    {helpdeskPhone}
                  </a>
                </div>
              </div>
              {tollFree && (
                <div className="flex items-start gap-3">
                  <Headphones size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-semibold">Toll-Free Helpline</p>
                    <a href={`tel:${tollFree}`} className="text-white font-bold hover:underline">
                      {tollFree}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-slate-400 font-semibold">Corporate Office</p>
                  <p className="text-white font-bold">{corporateAddress}</p>
                </div>
              </div>
            </div>

            {contactSent ? (
              <div className="py-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Query Submitted!</p>
                <p className="text-xs text-slate-300">Your query has been forwarded to the HR & Support team.</p>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Subject / Concern
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g. DCR issue, Expense query, General"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your issue or feedback..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSending || !contactMessage.trim()}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  <span>{contactSending ? 'Submitting...' : 'Send Message to Team'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 3. MY HIERARCHY MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'HIERARCHY' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">My Hierarchy</h3>
                <p className="text-xs text-slate-400">Reporting Structure & Team</p>
              </div>
            </div>

            {hierarchyLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw size={30} className="text-sky-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading organizational structure...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Reporting Manager Card */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    Direct Reporting Manager
                  </span>
                  {hierarchyData?.manager ? (
                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <UserCheck size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white truncate">
                          {hierarchyData.manager.firstName} {hierarchyData.manager.lastName}
                        </h4>
                        <p className="text-[11px] font-bold text-sky-400 uppercase">
                          {hierarchyData.manager.designation || 'MANAGER'}
                        </p>
                        <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                          HQ: {hierarchyData.manager.hq || 'Corporate'} • {hierarchyData.manager.phone || hierarchyData.manager.email || ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-400">
                      Reports to: <strong className="text-white">{user?.reportingManager || 'Management / Corporate'}</strong>
                    </div>
                  )}
                </div>

                {/* My Profile */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1.5">
                    My Account (Current User)
                  </span>
                  <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</h4>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Designation</span>
                        <span className="text-slate-200 font-bold">{user?.designation || 'TBM'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Headquarter</span>
                        <span className="text-slate-200 font-bold">{user?.hq || 'Allotted HQ'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Employee ID</span>
                        <span className="text-slate-200 font-mono font-bold">{user?.employeeId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Division</span>
                        <span className="text-slate-200 font-bold">{user?.division || 'General'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Reportees / Subordinates */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Team Reportees
                    </span>
                    <span className="text-[10px] text-sky-400 font-bold">
                      {hierarchyData?.reportees?.length || 0} Members
                    </span>
                  </div>
                  {hierarchyData?.reportees && hierarchyData.reportees.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {hierarchyData.reportees.map((rep: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{rep.firstName} {rep.lastName}</p>
                            <p className="text-[10px] text-slate-400">{rep.designation} • {rep.hq}</p>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Reportee
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3 text-xs text-slate-400 text-center">
                      No direct subordinate reportees allotted to this account.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 4. CONSOLIDATED ACTIVITY MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'CONSOLIDATED' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Consolidated Activity</h3>
                <p className="text-xs text-slate-400">Month-to-Date Performance</p>
              </div>
            </div>

            {consolidatedLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw size={30} className="text-sky-400 animate-spin" />
                <p className="text-xs text-slate-400">Aggregating activity data...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-sky-600/30 to-emerald-600/30 border border-sky-500/30 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-black uppercase text-sky-300 tracking-wider">
                    Total Field Calls (MTD)
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    {consolidatedData?.totalCalls || 0}
                  </p>
                  <p className="text-xs text-emerald-400 font-bold mt-1">
                    Avg: {consolidatedData?.callAvg || 0} calls/day ({consolidatedData?.daysWorked || 0} days worked)
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Doctors</span>
                    <p className="text-lg font-black text-sky-400 mt-1">{consolidatedData?.doctorCalls || 0}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Chemists</span>
                    <p className="text-lg font-black text-emerald-400 mt-1">{consolidatedData?.chemistCalls || 0}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Stockists</span>
                    <p className="text-lg font-black text-purple-400 mt-1">{consolidatedData?.stockistCalls || 0}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total POB Booked</span>
                    <p className="text-xl font-black text-amber-400 mt-0.5">
                      ₹{Number(consolidatedData?.totalPob || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
                    MTD POB
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 5. TODAY'S ACTIVITY MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'TODAY' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <ListTodo size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Today's Activity</h3>
                <p className="text-xs text-slate-400">{todaysData?.todayDate || 'Daily Log'}</p>
              </div>
            </div>

            {todaysLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw size={30} className="text-sky-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading today's logs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Attendance Summary */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">Attendance Status</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      todaysData?.attendance?.isPunchedIn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {todaysData?.attendance?.status || 'Not Punched In'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Punch In</span>
                      <span className="font-bold text-white">{todaysData?.attendance?.punchInTime || '--:--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Punch Out</span>
                      <span className="font-bold text-white">{todaysData?.attendance?.punchOutTime || 'Active In Field'}</span>
                    </div>
                  </div>
                </div>

                {/* Calls Today */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Doctors</span>
                    <span className="text-base font-black text-sky-400">{todaysData?.doctorCalls || 0}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Chemists</span>
                    <span className="text-base font-black text-emerald-400">{todaysData?.chemistCalls || 0}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Stockists</span>
                    <span className="text-base font-black text-purple-400">{todaysData?.stockistCalls || 0}</span>
                  </div>
                </div>

                {/* Visits List */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                    Visits Logged Today ({todaysData?.visits?.length || 0})
                  </span>
                  {todaysData?.visits && todaysData.visits.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {todaysData.visits.map((v: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{v.name}</p>
                            <span className="text-[10px] text-slate-400">{v.entityType} • {v.time}</span>
                          </div>
                          {v.pob > 0 && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              ₹{v.pob}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-900/30 border border-slate-700/40 rounded-xl p-4 text-center text-xs text-slate-400">
                      No visits recorded yet today.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* 6. LOGOUT CONFIRMATION MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'LOGOUT' && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Confirm Logout</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to log out from Emyris XL Field CRM?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-rose-500/30"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
