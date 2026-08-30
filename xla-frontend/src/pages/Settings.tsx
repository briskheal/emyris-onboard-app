import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingsPreferences from '../components/SettingsPreferences';
import SettingsHolidays from '../components/SettingsHolidays';

const SIDEBAR_ITEMS = [
  { id: 'holidays', label: 'CREATE HOLIDAYS' },
  { id: 'preferences', label: 'PREFERENCES' },
  { id: 'restore', label: 'RESTORE DELETED' },
  { id: 'user_controls', label: 'USER CONTROLS' },
  { id: 'doctor_controls', label: 'DOCTOR CONTROLS' },
  { id: 'campaigns', label: 'CAMPAIGNS' },
  
];

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <div className="flex h-screen bg-[#151521] text-white font-sans overflow-hidden">
       {/* Sidebar */}
       <div className="w-64 bg-[#1c1c2e] border-r border-[#3b3b5a] flex flex-col shrink-0 relative z-10 shadow-2xl">
          <div className="p-6 border-b border-[#3b3b5a]">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider hover:text-sky-300 transition-colors">
              <ArrowLeft size={18} /> SETTINGS
            </button>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 ${activeTab === item.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-[#27273f] hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
       </div>

       {/* Content Pane */}
       <div className="flex-1 bg-[#1e1e2d] relative flex flex-col h-full overflow-hidden p-8">
          {activeTab === 'preferences' ? (
             <SettingsPreferences />
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
               <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                 <CheckCircle size={32} />
               </div>
               <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">Under Construction</h2>
               <p className="text-sm text-slate-500 mt-2">The {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label} module is being built.</p>
             </div>
          )}
       </div>
    </div>
  );
}
