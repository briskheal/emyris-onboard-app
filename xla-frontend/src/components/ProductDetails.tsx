import { useState } from 'react';
import { ChevronLeft, Info, X } from 'lucide-react';

export default function ProductDetails({ product, onBack }: { product: any, onBack: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 border-b border-[#3b3b5a] flex justify-between items-center bg-[#1c1c2e]">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-sm hover:text-sky-300">
          <ChevronLeft size={18} /> PRODUCT DETAILS
        </button>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-16 right-4 w-80 bg-[#1c1c2e] border border-[#3b3b5a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-slate-800/50 border-b border-[#3b3b5a]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">ADDITIONAL DETAILS</h3>
            <button onClick={() => setShowInfo(false)} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-xs font-bold text-white">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-xs font-bold text-white">{product.status || 'Active'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">NAME</p>
              <p className="text-sm font-bold text-white">{product.productName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PTR</p>
              <p className="text-sm font-bold text-white">{product.ptr || '0'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PTS</p>
              <p className="text-sm font-bold text-white">{product.pts || '0'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MRP</p>
              <p className="text-sm font-bold text-white">{product.mrp || '0'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#3b3b5a]">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">CATEGORY</p>
              <p className="text-sm font-bold text-white">{product.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">GST</p>
              <p className="text-sm font-bold text-white">{product.gst || '0'}%</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">MANUFACTURER</p>
              <p className="text-sm font-bold text-white">{product.supplierName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">TYPE</p>
              <p className="text-sm font-bold text-white">{product.type || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">PACKAGING</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{product.packaging || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1.5">COMPOSITION</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">{product.composition || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}