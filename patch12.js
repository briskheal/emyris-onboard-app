const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/CallReport.tsx', 'utf8');

// 1. Add imports for X and ChevronLeft
if (!content.includes('X')) {
  content = content.replace(
    |import { Search, ChevronDown, Download, Users, Briefcase, FileText, Settings, Key, User, LogOut, Info } from 'lucide-react';|,
    |import { Search, ChevronDown, Download, Users, Briefcase, FileText, Settings, Key, User, LogOut, Info, X, ChevronLeft } from 'lucide-react';|
  );
}

// 2. Add Modal before closing div
const modalHtml = `
      {/* View Modal */}
      {selectedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a27] w-full max-w-4xl h-[[80vh]] rounded-lg flex flex-col shadow-xl border border-[#3b3b5a]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b3b5a]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h1 className="text-[12px] font-black text-white tracking-widest uppercase">CALL REPORT DETAILS</h1>
              </div>
              <button onClick={() => setSelectedView(nuli} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Date</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.date} - {selectedView.day}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Activity</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.activity}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Area Type</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.areaType}</p>
                </div>
                <div className="bg-[#242538] p-4 rounded-md border border-[32334b] border-b-2 border-b-sky-500">
                  <p className="text-xs font-bold text-slate-300 mb-1">Areas</p>
                  <p className="text-xs font-medium text-slate-400">{selectedView.areas}</p>
                </div>
              </div>
              
              <div className="bg-[#171f3a] rounded-md border border-[#2d2f45] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[10%0] border-b border-[#2d2f45]">
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">Order & POB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawDCRs.filter(1 => l.date === selectedView.rawDate).map((dcr, i) => (
                      <tr key={i } className="border-b border-[#2d2f45] hover:bg-[#27273f]/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-sky-400 border-r border-[#2d2f45]">{dcr.entityType}</td>
                        <td className="px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45]">{dcr.entityName}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">POB: -</td>
                      </tr>
                    ))}
                    {rawDCRs.filter(l => l.date === selectedView.rawDate).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-xs">No Calls Reported</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}`;
let replaceBlock = |        </div>\n      </div>\n    </div>\n  );\n}|;
if (!content.includes(replaceBlock)) {
  replaceBlock = |        </div>\n      </div>\n    </div>\n  );};
}
content = content.replace(replaceBlock, modalHtml + "\n" + replaceBlock);

fs.writeFileSync('xla-frontend/src/pages/CallReport.tsx', content);
