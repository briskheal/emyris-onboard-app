import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, LogIn, ArrowRight, Building, Eye, EyeOff, 
  X, Key, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck 
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('xl_saved_company') || 'EMYRIS');
  const [email, setEmail] = useState(() => localStorage.getItem('xl_saved_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('xl_saved_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('xl_remember_me') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'INPUT' | 'PIN_ENTRY' | 'SUCCESS'>('INPUT');
  const [forgotInputEmail, setForgotInputEmail] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOpenForgotPassword = () => {
    setIsForgotModalOpen(true);
    setForgotError('');
    setForgotSuccess('');
    setForgotPin('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    const prefillEmail = email.trim();
    if (prefillEmail) {
      setForgotInputEmail(prefillEmail);
      triggerRequestPin(prefillEmail);
    } else {
      setForgotStep('INPUT');
    }
  };

  const triggerRequestPin = async (targetEmail: string) => {
    if (!targetEmail.trim()) {
      setForgotError('Please enter your registered email address or Employee ID.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await axios.post('/api/xl/user/change-password/request-pin', {
        email: targetEmail.trim(),
        employeeId: targetEmail.trim()
      });
      setForgotLoading(false);
      if (res.data.success) {
        setMaskedEmail(res.data.maskedEmail || targetEmail);
        setForgotStep('PIN_ENTRY');
        setResendTimer(30);
      } else {
        setForgotError(res.data.message || 'Failed to dispatch verification PIN.');
      }
    } catch (err: any) {
      setForgotLoading(false);
      setForgotError(err.response?.data?.message || 'Server error sending verification PIN.');
    }
  };

  const handleVerifyAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotPin.trim()) {
      setForgotError('Please enter the 6-digit PIN sent to your email.');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post('/api/xl/user/change-password/verify-pin', {
        email: forgotInputEmail.trim(),
        employeeId: forgotInputEmail.trim(),
        pin: forgotPin.trim(),
        newPassword: forgotNewPass
      });
      setForgotLoading(false);
      if (res.data.success) {
        setForgotSuccess(res.data.message || 'Password updated successfully in database!');
        setForgotStep('SUCCESS');
        setPassword(forgotNewPass);
        setEmail(forgotInputEmail.trim());
      } else {
        setForgotError(res.data.message || 'PIN verification failed. Please check the code.');
      }
    } catch (err: any) {
      setForgotLoading(false);
      setForgotError(err.response?.data?.message || 'Server error updating password.');
    }
  };

  useEffect(() => {
    // If remember me is set, ensure the saved credentials are prefilled
    const isRemembered = localStorage.getItem('xl_remember_me') === 'true';
    if (isRemembered) {
      setRememberMe(true);
      const savedCompany = localStorage.getItem('xl_saved_company');
      const savedEmail = localStorage.getItem('xl_saved_email');
      const savedPass = localStorage.getItem('xl_saved_password');
      if (savedCompany) setCompanyName(savedCompany);
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
    }
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await axios.get('/api/company-profile');
        if (res.data) {
          if (res.data.logo && res.data.logo.length > 0 && res.data.logo[0].data) {
            setLogoUrl(res.data.logo[0].data);
          } else if (res.data.logoUrl) {
            setLogoUrl(res.data.logoUrl);
          }
        }
      } catch (e) {
        console.error("Failed to load company profile", e);
      }
    };
    fetchCompanyInfo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !email || !password) {
        alert("Please enter Company Name, Email and Password");
        return;
    }
    
    if (companyName.trim().toUpperCase() !== 'EMYRIS') {
        alert("Invalid Company Name.");
        return;
    }
    
    setLoading(true);
    try {
        const res = await axios.post('/api/xl/login', { email, password });
        if (res.data.success) {
            // Save user data to localStorage
            localStorage.setItem('xl_user', JSON.stringify(res.data.user));
            if (res.data.token) localStorage.setItem('xl_token', res.data.token);

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem('xl_remember_me', 'true');
                localStorage.setItem('xl_saved_company', companyName.trim());
                localStorage.setItem('xl_saved_email', email.trim());
                localStorage.setItem('xl_saved_password', password);
            } else {
                localStorage.removeItem('xl_remember_me');
                localStorage.removeItem('xl_saved_company');
                localStorage.removeItem('xl_saved_email');
                localStorage.removeItem('xl_saved_password');
            }

            navigate('/dashboard');
        } else {
            alert(res.data.message || "Login failed");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred during login. Please check your connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-sky-500/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Logo Area */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-20 mx-auto object-contain mb-6 drop-shadow-2xl" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-6">
              <h1 className="text-3xl font-black text-white tracking-tighter">EM</h1>
            </div>
          )}
          <h1 className="text-xl font-black text-white tracking-tight leading-tight mb-2">EMYRIS BIOLIFESCIENCES PVT LTD.</h1>
          <p className="text-[11px] font-bold text-emerald-400 tracking-wider">Enhancing Life, Excelling in Care.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-700/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Welcome back,</h2>
          
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" />
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800 cursor-pointer" 
              />
              <span className="text-xs font-medium text-slate-200">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={handleOpenForgotPassword}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer active:scale-95"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 active:scale-95 transition-transform ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <LogIn size={20} />
            {loading ? 'AUTHENTICATING...' : 'LOGIN TO PORTAL'}
          </button>
        </form>
        
        {/* Switch Portal Link */}
        <div className="mt-6 flex items-center justify-center">
          <a href="/xla/login" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
            Switch to Admin Portal
            <ArrowRight size={14} />
          </a>
        </div>
        
        {/* Footer Text */}
        <div className="mt-8 text-center pb-4">
          <p className="text-[10px] text-slate-500/70 font-semibold uppercase tracking-widest leading-relaxed">
            Prepared and Secured by Emyris IT Dept.<br />
            Report to Excel.
          </p>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Security Verification via Registered Email</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Enter email if not prefilled */}
            {forgotStep === 'INPUT' && (
              <form onSubmit={(e) => { e.preventDefault(); triggerRequestPin(forgotInputEmail); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Registered Email / Employee ID
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={forgotInputEmail}
                      onChange={(e) => setForgotInputEmail(e.target.value)}
                      placeholder="e.g. alfez.kachhi@emyrisbio.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">A 6-digit verification PIN will be dispatched to your registered address.</p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-sm cursor-pointer"
                >
                  {forgotLoading ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  <span>{forgotLoading ? 'Sending PIN...' : 'Send Verification PIN'}</span>
                </button>
              </form>
            )}

            {/* STEP 2: Enter PIN & Set New Password */}
            {forgotStep === 'PIN_ENTRY' && (
              <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4">
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-300">
                  <p className="font-semibold">Verification PIN Dispatched</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Enter the 6-digit PIN sent to <strong>{maskedEmail}</strong></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    6-Digit Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotPin}
                    onChange={(e) => setForgotPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 text-center text-xl font-mono font-black tracking-[8px] text-white focus:outline-none focus:border-sky-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showForgotPass ? "text" : "password"}
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(!showForgotPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showForgotPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showForgotPass ? "text" : "password"}
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Didn't receive code?</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || forgotLoading}
                    onClick={() => triggerRequestPin(forgotInputEmail)}
                    className="font-bold text-sky-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend PIN'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-sm mt-2 cursor-pointer"
                >
                  {forgotLoading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  <span>{forgotLoading ? 'Updating...' : 'Save New Password'}</span>
                </button>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {forgotStep === 'SUCCESS' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Password Updated!</h4>
                  <p className="text-xs text-slate-300 mt-1">{forgotSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Proceed to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
