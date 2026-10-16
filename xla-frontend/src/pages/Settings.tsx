import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsPreferences from '../components/SettingsPreferences';
import SettingsHolidays from '../components/SettingsHolidays';
import SettingsUserControls from '../components/SettingsUserControls';
import SettingsDoctorControls from '../components/SettingsDoctorControls';
import TypographySettingsModal from '../components/TypographySettingsModal';

const SIDEBAR_ITEMS = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'typography', label: 'Display & Typography' },
  { id: 'holidays', label: 'Create Holidays' },
  { id: 'restore', label: 'Restore Deleted' },
  { id: 'user_controls', label: 'User Controls' },
  { id: 'doctor_controls', label: 'Doctor Controls' },
  { id: 'campaigns', label: 'Campaigns' },
];

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'preferences';
  
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    navigate(`/extras/settings?tab=${id}`, { replace: true });
  }

  return (
    <div className="flex h-screen bg-[#151521] text-white font-sans overflow-hidden">
       <div className="w-64 bg-[#1c1c2e] border-r border-[#3b3b5a] flex flex-col shrink-0 relative z-10 shadow-2xl">
          <div className="p-6 border-b border-[#3b3b5a]">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sky-400 font-bold hover:text-sky-300 transition-colors text-base tracking-wide">
              <ArrowLeft size={18} /> Settings
            </button>
          </div>
          <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs tracking-normal transition-all duration-200 ${activeTab === item.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-[#27273f] hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
       </div>

       <div className="flex-1 bg-[#1e1e2d] relative flex flex-col h-full overflow-y-auto">
          {activeTab === 'preferences' ? (
             <div className="p-8"><SettingsPreferences /></div>
          ) : activeTab === 'typography' ? (
             <div className="p-8 max-w-5xl"><TypographySettingsModal isInline={true} /></div>
          ) : activeTab === 'holidays' ? (
             <div className="p-8"><SettingsHolidays /></div>
          ) : activeTab === 'user_controls' ? (
             <SettingsUserControls />
          ) : activeTab === 'doctor_controls' ? (
             <SettingsDoctorControls />
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-8">
               <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                 <CheckCircle size={32} />
               </div>
               <h2 className="text-xl font-bold tracking-wide text-slate-300">Under Construction</h2>
               <p className="text-sm text-slate-500 mt-2">The {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label} module is being built.</p>
             </div>
          )}
       </div>
    </div>
  );
}
