import { useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';

export default function DoctorDetails({ doctor, onBack }: { doctor: any, onBack: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e]">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm hover:text-sky-300">
          <ChevronLeft size={18} /> DOCTOR DETAILS
        </button>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute top-16 right-4 w-80 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 border-b border-[#3b3b5a]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">ADDITIONAL DETAILS</h3>
            <button onClick={() => setShowInfo(false)} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-xs font-bold text-white">{doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
              <p className="text-xs font-bold text-white">super admin</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approved By</p>
              <p className="text-xs font-bold text-white">NA</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">VISIBLE TO</p>
            <div className="bg-[#151521] rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-sky-400 font-semibold">{doctor.employeeId || 'No Employee Assigned'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">NAME</p>
              <p className="text-sm font-bold text-white">{doctor.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">DEGREE</p>
              <p className="text-sm font-bold text-white">{doctor.degree || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">SPECIALIZATION</p>
              <p className="text-sm font-bold text-white">{doctor.specialization || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MOBILE NUMBER</p>
              <p className="text-sm font-bold text-white">{doctor.mobile || doctor.contact || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">BIRTHDAY</p>
              <p className="text-sm font-bold text-white">{doctor.birthday || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MARRIAGE ANNIVERSARY</p>
              <p className="text-sm font-bold text-white">{doctor.anniversary || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">HEADQUARTER</p>
              <p className="text-sm font-bold text-white">{doctor.headquarter || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">WORKING AREA</p>
              <p className="text-sm font-bold text-white">{doctor.workingArea || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CLINIC CONTACT NUMBER</p>
              <p className="text-sm font-bold text-white">{doctor.clinicContact || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">DOCTOR'S CODE</p>
              <p className="text-sm font-bold text-white">{doctor.doctorCode || doctor.uid || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">EMAIL</p>
              <p className="text-sm font-bold text-white">{doctor.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CATEGORY</p>
              <p className="text-sm font-bold text-white">{doctor.category || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CLINICS ADDRESS</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{doctor.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">EXTRA INFO</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{doctor.extraInformation || 'N/A'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
