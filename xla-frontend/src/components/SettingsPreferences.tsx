import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Target & Sales Management',
    toggles: [
      { id: 'allot_hq_targets', label: '1. ALLOT HEADQUARTER WISE TARGETS', desc: 'This will allow admins to allot targets to headquarters, therefore the total target on the dashboard will depend on headquarters.' },
      { id: 'add_return_sales', label: '2. ALLOW EMPLOYEES TO ADD RETURN SALES', desc: 'This will allow admins and other employees to add return sales.' },
      { id: 'add_secondary_sales_mid_month', label: '3. ALLOW EMPLOYEES TO ADD SECONDARY SALES IN THE MIDDLE OF MONTH', desc: 'This will allow admins and other employees to add secondary sales in the middle of month.' },
      { id: 'mandatory_primary_sales_invoice', label: '4. ENABLE MANDATORY PRIMARY SALES INVOICE NUMBER & INVOICE DATE', desc: 'Enable this toggle to make the invoice number and invoice date mandatory for all primary sales.' },
      { id: 'mandatory_secondary_sales_invoice', label: '5. ENABLE MANDATORY SECONDARY SALES INVOICE NUMBER & INVOICE DATE', desc: 'Enable this toggle to make the invoice number and invoice date mandatory for all secondary sales.' }
    ]
  },
  {
    title: 'Inventory & Stock Management',
    toggles: [
      { id: 'notify_stock_minimum', label: '6. GET NOTIFIED WHEN STOCKS REACH MINIMUM THRESHOLD', desc: 'This will allow users to get notified when the products are below minimum quantity.' },
      { id: 'disable_custom_pricing', label: '7. DISABLE CUSTOM PRICING', desc: 'This feature allows the company to restrict their users from entering custom prices.' }
    ]
  },
  {
    title: 'Call Reporting & Management',
    toggles: [
      { id: 'filter_available_doctor_dcr', label: '8. FILTER OUT THE AVAILABLE DOCTOR FOR DCR', desc: 'This will allow admins to filter out the doctor\'s available for the call report according to their category.' },
      { id: 'call_rating', label: '9. CALL RATING', desc: 'This feature allows the user to rate their call at the end of every call report.' },
      { id: 'limit_visits', label: '10. LIMIT THE NUMBER OF VISITS FOR A USER', desc: 'This will allow admins to set the maximum number of visits for any ex-station or out station for an employee.' },
      { id: 'restrict_min_call_reports', label: '11. RESTRICT MINIMUM CALL REPORTS', desc: 'This will allow admins to set the minimum number of call reports to be submitted daily.' }
    ]
  },
  {
    title: 'Tour Program & Expense Management',
    toggles: [
      { id: 'deadline_add_tour_programs', label: '12. DEADLINE TO ADD TOUR PROGRAMS FOR APPROVAL', desc: 'For the companies that want their users to send the "Tour Program" of the upcoming month before the desired date.' },
      { id: 'set_working_days', label: '13. SET WORKING DAYS FOR TOUR PROGRAM AND CALL PLANNING', desc: 'Set working days for the system.' },
      { id: 'fixed_travel_allowance', label: '14. FIXED TRAVEL ALLOWANCE FOR EX-STATION', desc: 'This feature will allow users to add the fixed travel allowance for ex-station irrespective of the distance.' },
      { id: 'restrict_edit_tour_program', label: '15. RESTRICT EMPLOYEES FROM EDITING THEIR TOUR PROGRAM', desc: 'This will restrict employees from editing their tour program.' }
    ]
  },
  {
    title: 'User Access & Role-Based Restrictions',
    toggles: [
      { id: 'restrict_user_seeing_hqs', label: '16. RESTRICT THE USER FROM SEEING THE HQS AND CITIES BASED ON THEIR DESIGNATION', desc: 'This feature allows the company to restrict their users to see HQs and Cities based on their designation.' },
      { id: 'lock_users_inactivity', label: '17. LOCK USERS BASED ON PROLONGED INACTIVITY', desc: 'This will allow admins to set the number of days of inactivity.' }
    ]
  },
  {
    title: 'Organization Settings',
    toggles: [
      { id: 'set_organization_name', label: '18. SET ORGANIZATION NAME', desc: 'This will allow medium admin to change organization name on header.' }
    ]
  },
  {
    title: 'Notifications & Announcement',
    toggles: [
      { id: 'announcement', label: '19. ANNOUNCEMENT', desc: 'Announcement feature can be used to deliver a message to your entire working force.' },
      { id: 'notification_recipients', label: '20. NOTIFICATION RECIPIENTS', desc: 'This setting defines who should receive notifications related to a user\'s activity.' }
    ]
  },
  {
    title: 'Performance & Analytics',
    toggles: [
      { id: 'user_performance_analysis', label: '21. USER PERFORMANCE ANALYSIS', desc: 'This feature allows users to submit various types of user performance analysis reports.' }
    ]
  },
  {
    title: 'Geo Tagging Management',
    toggles: [
      { id: 'multi_location_tagging', label: '22. MULTI-LOCATION TAGGING FOR DOCTORS', desc: 'This feature enables users to tag a doctor in up to three different geo-locations.' }
    ]
  },
  {
    title: 'Checkin & Checkout',
    toggles: [
      { id: 'checkin_checkout_time', label: '23. CHECKIN & CHECKOUT TIME', desc: 'This feature enables admin to define check-in and check-out timings.' }
    ]
  }
];

export default function SettingsPreferences() {
  const [expanded, setExpanded] = useState<string | null>('Target & Sales Management');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/xl/settings/preferences');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await axios.post('/api/xl/settings/preferences', { settings: newSettings });
    } catch (e) {
      console.error(e);
      alert('Failed to save setting');
      // Revert on failure
      setSettings(settings);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Preferences...</div>;

  return (
    <div className="w-full h-full overflow-y-auto pr-2 pb-12">
       <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-wide">SET PREFERENCES</h2>
       </div>

       <div className="space-y-4">
         {SECTIONS.map((section) => (
           <div key={section.title} className="bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl overflow-hidden shadow-lg">
             <button 
               onClick={() => setExpanded(expanded === section.title ? null : section.title)}
               className="w-full px-6 py-4 flex justify-between items-center bg-[#27273f]/40 hover:bg-[#27273f] transition-colors"
             >
               <span className="text-sm font-bold text-white tracking-wide">{section.title}</span>
               {expanded === section.title ? <ChevronUp size={20} className="text-sky-400" /> : <ChevronDown size={20} className="text-slate-400" />}
             </button>

             {expanded === section.title && (
               <div className="px-6 py-4 space-y-6">
                 {section.toggles.map((toggle) => (
                   <div key={toggle.id} className="flex justify-between items-start gap-8">
                     <div>
                       <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-widest">{toggle.label}</h3>
                       <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{toggle.desc}</p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                       <input 
                         type="checkbox" 
                         className="sr-only peer" 
                         checked={!!settings[toggle.id]} 
                         onChange={(e) => handleToggle(toggle.id, e.target.checked)} 
                       />
                       <div className="w-11 h-6 bg-[#27273f] rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                     </label>
                   </div>
                 ))}
               </div>
             )}
           </div>
         ))}
       </div>
    </div>
  );
}
