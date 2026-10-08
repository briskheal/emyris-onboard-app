import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, UserRound, Phone, Mail, MapPin, Calendar, Building2, Stethoscope, Hash, FileText } from 'lucide-react';
import axios from 'axios';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const storedUser = localStorage.getItem('xl_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      let url = '/api/xl/reports/doctors';
      if (user?.employeeId) {
        url += `?employeeId=${encodeURIComponent(user.employeeId)}`;
      }
      
      const res = await axios.get(url);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch doctors', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    !searchQuery || 
    (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.hospital && d.hospital.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.headquarter && d.headquarter.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col text-slate-100">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => selectedDoctor ? setSelectedDoctor(null) : navigate('/creation')}
            className="w-10 h-10 flex items-center justify-center bg-slate-700/50 text-sky-400 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide uppercase">
              {selectedDoctor ? 'DOCTOR PROFILE' : 'DOCTOR PROFILES'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {selectedDoctor ? selectedDoctor.name : 'View Database Details'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {selectedDoctor ? (
          /* Profile Detail View */
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center border border-slate-700 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl" />
               <div className="w-20 h-20 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mb-4 border-2 border-sky-500/30">
                 <UserRound size={36} strokeWidth={2} />
               </div>
               <h2 className="text-xl font-black text-white text-center uppercase mb-1 tracking-wide">{selectedDoctor.name}</h2>
               <div className="flex items-center justify-center gap-2 flex-wrap">
                 {selectedDoctor.degree && <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">{selectedDoctor.degree}</span>}
                 {selectedDoctor.specialization && <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold">{selectedDoctor.specialization}</span>}
                 {selectedDoctor.category && <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black">CAT: {selectedDoctor.category}</span>}
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic / Hospital</h3>
                    <p className="text-sm text-white font-bold">{selectedDoctor.hospital || 'N/A'}</p>
                 </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-rose-400" />
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location Details</h3>
                    <p className="text-sm text-slate-200 mb-1"><span className="text-slate-400">HQ:</span> {selectedDoctor.headquarter || 'N/A'}</p>
                    <p className="text-sm text-slate-200 mb-1"><span className="text-slate-400">Area:</span> {selectedDoctor.workingArea || 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-2">{selectedDoctor.address}</p>
                    {(selectedDoctor.lat1 || selectedDoctor.lat2) && (
                      <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded inline-block">Geo-Tagged Location Available</div>
                    )}
                 </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md flex flex-col gap-3">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Contact & Dates</h3>
                 <div className="flex items-center gap-3">
                   <Phone size={16} className="text-slate-400 shrink-0" />
                   <p className="text-sm text-slate-200">{selectedDoctor.mobile || selectedDoctor.contact || 'No Contact Provided'}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <Mail size={16} className="text-slate-400 shrink-0" />
                   <p className="text-sm text-slate-200">{selectedDoctor.email || 'No Email Provided'}</p>
                 </div>
                 {selectedDoctor.birthday && (
                   <div className="flex items-center gap-3">
                     <Calendar size={16} className="text-sky-400 shrink-0" />
                     <p className="text-sm text-sky-400 font-medium">Birthday: {selectedDoctor.birthday}</p>
                   </div>
                 )}
                 {selectedDoctor.anniversary && (
                   <div className="flex items-center gap-3">
                     <Calendar size={16} className="text-pink-400 shrink-0" />
                     <p className="text-sm text-pink-400 font-medium">Anniversary: {selectedDoctor.anniversary}</p>
                   </div>
                 )}
              </div>

              {selectedDoctor.extraInformation && (
                 <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-teal-400" />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extra Information</h3>
                      <p className="text-xs text-slate-200">{selectedDoctor.extraInformation}</p>
                   </div>
                 </div>
              )}
              
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md flex items-center justify-between">
                 <div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System ID</h3>
                   <p className="text-xs font-mono text-slate-500">{selectedDoctor._id}</p>
                 </div>
                 <Hash size={24} className="text-slate-600" />
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <>
            <div className="mb-4 relative">
              <input 
                type="text" 
                placeholder="Search by Name, HQ, or Hospital..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors shadow-lg"
              />
              <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <UserRound size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">No Doctors Found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDoctors.map(doctor => (
                  <button
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className="bg-slate-800 rounded-2xl p-4 flex items-center gap-4 text-left border border-slate-700 hover:border-sky-500/50 transition-all active:scale-[0.98] shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0 border border-sky-500/20">
                      <Stethoscope size={20} className="text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide truncate">{doctor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{doctor.headquarter || 'No HQ'}</span>
                        {doctor.category && <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">CAT: {doctor.category}</span>}
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-slate-500 shrink-0 rotate-180" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
