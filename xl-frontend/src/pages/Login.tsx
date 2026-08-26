import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Building } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await axios.get('/api/company-profile');
        if (res.data && res.data.logoUrl) {
          setLogoUrl(res.data.logoUrl);
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
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
        <form onSubmit={handleLogin} className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Welcome back,</h2>
          
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800" />
              <span className="text-xs font-medium text-slate-400">Remember me</span>
            </label>
            <button type="button" className="text-xs font-bold text-sky-400">Forgot Password?</button>
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
          <a href="/xla" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
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
    </div>
  );
}
