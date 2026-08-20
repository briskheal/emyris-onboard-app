import { ArrowLeft, Paperclip, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  const settingsOptions = [
    { label: 'Doctor Wise Product List', icon: Paperclip, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'User Controls', icon: SettingsIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Access Control', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Sticky Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Settings</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="space-y-4">
          {settingsOptions.map((item, idx) => (
            <button 
              key={idx}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${item.bg}`}>
                <item.icon size={22} className={item.color} />
              </div>
              <span className="text-[15px] font-bold text-white tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
