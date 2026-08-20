import { useState } from 'react';
import { ArrowLeft, UserPlus, RefreshCcw, ChevronDown, List, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Leave Request');
  const [showMyLeaves, setShowMyLeaves] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative overflow-hidden">
      
      {/* Sticky Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6">
        
        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('Leave Request')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'Leave Request' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}
          >
            Leave Request
          </button>
          <button 
            onClick={() => setActiveTab('Status')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'Status' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}
          >
            Status
          </button>
        </div>

        {/* Action Button */}
        <button className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 flex items-center justify-center gap-2 active:bg-emerald-500/20 transition-colors">
          <UserPlus size={20} />
          <span className="font-bold text-sm">Add Leave for another user</span>
        </button>

        {/* Form Fields */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-lg space-y-5">
          
          {/* Date Range */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select Date Range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-slate-300 block">From Date</span>
                <span className="text-white font-bold block mt-1">20-08-2026</span>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-slate-300 block">To Date</span>
                <span className="text-white font-bold block mt-1">20-08-2026</span>
              </div>
              <button className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-sky-400 active:bg-slate-600 transition-colors">
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          {/* Select Leave Type */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select Leave Type</label>
            <button className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5">
              <span className="text-white font-semibold text-sm">Casual Leave</span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Reason For Leave</label>
            <textarea 
              rows={3}
              placeholder="Enter your reason here..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Submit Button */}
          <button className="w-full border-2 border-emerald-500 text-emerald-400 font-black rounded-xl py-3.5 active:bg-emerald-500/10 transition-colors">
            ASK FOR LEAVE APPROVAL
          </button>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-20">
        <button 
          onClick={() => setShowMyLeaves(true)}
          className="bg-sky-500 text-white font-black text-sm px-6 py-4 rounded-full shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <List size={20} />
          My Leaves
        </button>
      </div>

      {/* My Leaves Side Sheet (Overlay) */}
      <div className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${showMyLeaves ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowMyLeaves(false)} />
      
      <div className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-slate-900 z-[101] shadow-2xl transition-transform duration-300 flex flex-col ${showMyLeaves ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-6 border-b border-slate-800">
          <h2 className="text-lg font-black text-white">My Leaves Balance</h2>
          <button onClick={() => setShowMyLeaves(false)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* Casual Leave */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Casual Leave</span>
              <span className="text-xs font-bold text-sky-400">3/9 used</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: '33%' }} />
            </div>
          </div>

          {/* Sick Leave */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Sick Leave</span>
              <span className="text-xs font-bold text-emerald-400">0/9 used</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>

          {/* Earned Leave */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Earned Leave</span>
              <span className="text-xs font-bold text-amber-400">0/8 used</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
