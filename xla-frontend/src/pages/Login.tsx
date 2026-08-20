import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    if (email && password) {
      // In a real app, you would set a token here
      navigate('/dashboard');
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
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30 mb-6">
            <h1 className="text-3xl font-black text-white tracking-tighter">EM</h1>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">EMYRIS</h1>
          <p className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">Admin Portal</p>
        </div>

        {/* Login Form */}
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
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-800" />
              <span className="text-xs font-medium text-slate-400">Remember me</span>
            </label>
            <button type="button" className="text-xs font-bold text-rose-400">Forgot Password?</button>
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
    </div>
  );
}
