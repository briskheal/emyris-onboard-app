const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/TourProgram.tsx', utf8');

// 1. Add imports for MapPin, X and E�_\"const [selectedView, setSelectedView] = useState<any|null>(null);\"
content = content.replace(
  |import { ChevronLeft, RefreshCw } from 'lucide-react';|,
  |import { ChevronLeft, RefreshCw, MapPin, X } from 'lucide-react';|
);


const stateIf = |const [reportData, setReportData] = useState<any[]>([]);
const [selectedView, setSelectedView] = useState<any | null>(null);|;
content = content.replace(
  |const [reportData, setReportData] = useState<any[]>([]);|,
  stateIf
);

// 2. Update table row View Details to open modal
content = content.replace(
  |<td className="px-4 py-3 text-xs text-slate-300 text-center"><span className="cursor-pointer hover:text-white text-slate-400 text-lg">👞</span></td>|,
  |<td className="px-4 py-3 text-xs text-slate-300 text-center"><span onClick={()=>setSelectedView(row)} className="cursor-pointer hover:text-white text-slate-400 text-lg">👞</span></td>|
);

// 3. Add modal before closing div
const modalHtml = |
      {selectedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a27] w-full max-w-4xl rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b3b5a]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h1 className="text-[12px] font-black text-white tracking-widest uppercase">TOUR PROGRAM DETAILS</h1>
              </div>
              <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-emerald-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Date</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.date}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-emerald-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Area Type</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.areaType}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-emerald-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Approved By</p>
                  <p className="text-xs font-medium text-slate-400">{selectedUser || 'Admin'}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-emerald-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Added By</p>
                  <p className="text-xs font-medium text-slate-400">Self</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-4">
                {(selectedView.areas || '').split(',').map((area: string, i: number) => area.trim() && (
                  <div key={i } className="bg-[#1a1a27] border border-sky-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                    <MapPin size={16} className="text-sky-400" />
                    <span className="text-xs font-medium text-slate-300">{area.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}|;
content = content.replace("</div>\n  );\n}", `${modalHtml}\n    </div>\n  );\n}`);

fs.writeFileSync('xla-frontend/src/pages/TourProgram.tsx', content);
