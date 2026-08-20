import { ArrowLeft, ChevronDown, Upload, FileText, PenSquare, Trash2, Tag, DollarSign, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SecondarySales() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-4 md:p-8 overflow-y-auto">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Secondary Sales</h2>
          
          <div className="flex items-center gap-6">
            <button className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Upload size={16} /> Upload Secondary Sales
            </button>
          </div>
        </div>

        {/* SECONDARY SALES FORM */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative">
          
          <button className="absolute top-6 right-6 hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-colors">
            All Secondary Sales
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Year *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Year</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Month *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Month</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Headquarter *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Headquarter</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Stockist *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Stockist</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-1">Select Division *</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Division</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Select Product</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">Select Product</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Upload File</label>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <button className="bg-slate-700 text-slate-300 font-semibold text-sm px-4 py-3 hover:bg-slate-600 transition-colors border-r border-slate-600">Choose file</button>
                <span className="font-semibold text-sm text-slate-500 px-4">No file chosen</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Invoice Number</label>
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <span className="font-semibold text-sm text-slate-500">Create Invoice Number</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Invoice Date</label>
              <button className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 active:bg-slate-700 transition-colors">
                <span className="font-semibold text-sm text-slate-400">dd-mm-yyyy</span>
                <CalendarDays size={18} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex flex-col justify-end">
              <button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-3 font-bold shadow-lg shadow-sky-500/20 transition-colors flex items-center justify-center gap-2">
                Add Product
              </button>
            </div>

          </div>
        </div>

        {/* DATA TABLE */}
        <div className="hidden md:flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          
          <div className="flex-1 overflow-auto pb-16">
            <table className="w-[1200px] xl:w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">Sr no.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><div className="flex items-center gap-1.5"><FileText size={14}/> Product Name</div></th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">Pack</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Price (₹)</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Opening Balance Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Received Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Total Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Total Value (₹)</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Sales Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Free Stocks</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Sales Value (₹)</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Closing Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {/* No Data State */}
                <tr className="bg-slate-900/10">
                  <td colSpan={12} className="p-8 text-center text-sm font-semibold text-slate-500 italic">No data found</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Desktop Table Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700/50 backdrop-blur flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                <ChevronDown size={14} className="rotate-90" /> Prev
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">Page 1 of 1</span>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                Next <ChevronDown size={14} className="-rotate-90" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                <FileText size={16} /> Export
              </button>
              <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                Show 10 <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
