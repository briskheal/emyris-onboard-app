const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('isBroadcastModalOpen')) {
  // Imports
  c = c.replace(
      "import { useState } from 'react';", 
      "import { useState, useEffect } from 'react';\nimport axios from 'axios';"
  );
  
  // States
  const stateHooks = `  const [selectedMonth] = useState('Sep');
  const [selectedYear] = useState('2026');
  
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/xl/admin/notifications').then(res => {
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    }).catch(e => console.error(e));
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return alert('Message cannot be empty');
    try {
      const res = await axios.post('/api/xl/admin/announcement', { message: broadcastMessage });
      if (res.data.success) {
        alert('Broadcast message updated successfully!');
        setIsBroadcastModalOpen(false);
        setBroadcastMessage('');
      } else {
        alert('Failed to broadcast');
      }
    } catch(e) {
      alert('Error broadcasting message');
    }
  };`;
  
  c = c.replace(/const \[selectedMonth\].*const \[selectedYear\].*2026'\);/s, stateHooks);

  // Fix the Buttons
  c = c.replace(
      /onClick=\{\(\) => alert\('Admin Notifications dropdown opening\.\.\. \(WIP\)'\)\}/g,
      "onClick={() => setIsNotifOpen(!isNotifOpen)}"
  );
  
  c = c.replace(
      /onClick=\{\(\) => alert\('Broadcast Message modal opening\.\.\. \(WIP\)'\)\}/g,
      "onClick={() => setIsBroadcastModalOpen(true)}"
  );

  // Notification badge dynamic number
  c = c.replace(
      /<span className="absolute -top-1 -right-1\.5 bg-rose-500 text-white text-\[9px\] font-bold w-4 h-4 rounded-full flex items-center justify-center">\s*1\s*<\/span>/,
      `{notifications.length > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
          {isNotifOpen && (
            <div className="absolute top-12 right-0 w-80 bg-[#212136] border border-[#3b3b5a] rounded-xl shadow-2xl p-2 z-50">
              <h4 className="text-white font-bold px-3 py-2 border-b border-[#3b3b5a]">Recent Activity</h4>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                   <div className="p-4 text-center text-slate-400 text-sm">No recent activity</div>
                ) : (
                   notifications.map(n => (
                     <div key={n.id} className="p-3 hover:bg-slate-800/50 rounded-lg border-b border-[#3b3b5a]/50 last:border-0 cursor-pointer">
                        <div className="text-xs font-bold text-sky-400">{n.type}</div>
                        <div className="text-sm text-slate-200 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{new Date(n.date).toLocaleString()}</div>
                     </div>
                   ))
                )}
              </div>
            </div>
          )}`
  );

  // Broadcast Modal UI
  const modalUI = `
      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e30] border border-[#3b3b5a] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Broadcast Message to XL Users</h3>
            <textarea 
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Enter your scrolling announcement here..."
              className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 min-h-[120px] resize-none mb-4"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsBroadcastModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleBroadcast} className="px-5 py-2 rounded-lg text-sm font-bold bg-sky-500 text-white hover:bg-sky-600 transition-colors">Broadcast</button>
            </div>
          </div>
        </div>
      )}
  `;

  // Inject modal before the final closing div
  const lastDivIndex = c.lastIndexOf('</div>');
  c = c.substring(0, lastDivIndex) + modalUI + c.substring(lastDivIndex);

  fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
  console.log('Added modals and dropdowns to Dashboard.tsx');
}
