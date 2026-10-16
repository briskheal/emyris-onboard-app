import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff, Key, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  // 2-Step Robust Forgot Password States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [newPassVal, setNewPassVal] = useState('');
  const [confirmPassVal, setConfirmPassVal] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

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

  const [error, setError] = useState('');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      try {
        const res = await axios.post('/api/xl/admin-login', { username: email, email, password });
        if (res.data.success) {
          if (!res.data.token) {
            setError('Server error: no token received');
            return;
          }
          sessionStorage.setItem('xla_token', res.data.token);
          sessionStorage.setItem('xla_user', JSON.stringify(res.data.user || {}));
          sessionStorage.setItem('xla_role', res.data.role || 'admin');
          navigate('/dashboard');
        } else {
          setError(res.data.message || 'Invalid credentials');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid credentials or server error');
      }
    }
  };

  // Step 1: Request 6-Digit OTP to linked admin email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Please enter your registered admin email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await axios.post('/api/xl/forgot-password/request-otp', { email: forgotEmail });
      if (res.data.success) {
        setMaskedEmail(res.data.maskedEmail || forgotEmail);
        setForgotStep('otp');
      } else {
        setForgotError(res.data.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Server error. Please verify your connection.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP and save user's chosen password in database
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!otpVal || otpVal.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!newPassVal || newPassVal.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassVal !== confirmPassVal) {
      setForgotError('Passwords do not match. Please re-type to confirm.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post('/api/xl/forgot-password/verify-otp', {
        email: forgotEmail,
        otp: otpVal.trim(),
        newPassword: newPassVal
      });
      if (res.data.success) {
        setForgotSuccess(res.data.message || 'Your password has been successfully updated in the database!');
        setForgotStep('success');
        setEmail(forgotEmail);
        setPassword(newPassVal);
      } else {
        setForgotError(res.data.message || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Server error updating password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Logo Area */}
        <div className="text-center mb-10">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-20 mx-auto object-contain mb-6 drop-shadow-2xl" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30 mb-6">
              <h1 className="text-3xl font-black text-white tracking-tighter">EM</h1>
            </div>
          )}
          <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">EMYRIS</h1>
          <p className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">Admin Portal</p>
        </div>

        {/* Login Form */}
        {error && <div className="text-rose-500 text-sm font-bold mb-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}
        <form onSubmit={handleLogin} className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Admin Login,</h2>
          
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-800" />
              <span className="text-xs font-medium text-slate-400">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={() => {
                setForgotEmail(email || '');
                setForgotError('');
                setForgotSuccess('');
                setIsForgotModalOpen(true);
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-transform"
          >
            <LogIn size={20} />
            LOGIN TO ADMIN
          </button>
        </form>
        
        {/* Switch Portal Link */}
        <div className="mt-8 flex items-center justify-center">
          <a href="/xl" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
            Switch to User Portal
            <ArrowRight size={14} />
          </a>
        </div>

      </div>

      {/* Robust 2-Step OTP Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Admin Password</h3>
                <p className="text-xs text-slate-400">
                  {forgotStep === 'email' && 'Step 1: Identity Verification'}
                  {forgotStep === 'otp' && 'Step 2: Enter OTP & Set Password'}
                  {forgotStep === 'success' && 'Reset Complete'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2 text-rose-400 text-xs font-medium mb-4">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Step 3 / Success View */}
            {forgotStep === 'success' ? (
              <div className="space-y-4 my-2">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-left">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Password Updated Successfully</p>
                      <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                        {forgotSuccess}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Your new password is now active in the database and pre-filled in your login form.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setError('');
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Return to Login
                </button>
              </div>
            ) : forgotStep === 'email' ? (
              /* Step 1: Email Form */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered Admin Email. The system will strictly verify your account in the database and send a secure 6-digit One-Time Password (OTP) to your private inbox.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Admin Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="e.g. hradmin@emyrishr.in"
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Verifying & Sending...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: OTP Verification & New Password Setting */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <p className="text-xs text-slate-300">
                    Verification code dispatched to <strong className="text-rose-400">{maskedEmail}</strong>. Please enter the code and set your new password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">6-Digit Verification Code (OTP)</label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otpVal}
                    onChange={e => setOtpVal(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-3 px-4 text-center text-lg font-mono tracking-[6px] font-bold text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showNewPass ? "text" : "password"} 
                      required
                      value={newPassVal}
                      onChange={e => setNewPassVal(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showNewPass ? "text" : "password"} 
                      required
                      value={confirmPassVal}
                      onChange={e => setConfirmPassVal(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('email');
                      setForgotError('');
                    }}
                    className="px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Verifying & Saving...
                      </>
                    ) : (
                      'Verify & Set New Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
