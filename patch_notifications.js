const fs = require('fs');
const path = require('path');

// 1. Patch routes/xl.js to add /notifications/clear
const routesFile = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let routes = fs.readFileSync(routesFile, 'utf8');

if (!routes.includes('/notifications/clear')) {
    const hook = "router.post('/notifications/read', async (req, res) => {";
    const clearRoute = `router.post('/notifications/clear', async (req, res) => {
    try {
        const { email } = req.body;
        await XlNotification.destroy({ where: { employeeId: email } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

`;
    routes = routes.replace(hook, clearRoute + hook);
    fs.writeFileSync(routesFile, routes);
    console.log('Added /notifications/clear to routes/xl.js');
}

// 2. Patch Layout.tsx
const layoutFile = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/components/Layout.tsx';
let layout = fs.readFileSync(layoutFile, 'utf8');

// Import Trash2
if (!layout.includes('Trash2')) {
    layout = layout.replace('ChevronLeft } from', 'ChevronLeft, Trash2 } from');
}

// Add formatNotifDate and clearNotifications
if (!layout.includes('const clearNotifications')) {
    const funcs = `
  const clearNotifications = async () => {
      await axios.post('/api/xl/notifications/clear', { email: user?.employeeId });
      setNotifications([]);
  };

  const formatNotifDate = (dateString: string) => {
      const d = new Date(dateString);
      const today = new Date();
      const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      const datePart = isToday ? 'Today' : d.toLocaleDateString();
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
      return { datePart, timePart };
  };

  const handleBack = () => {
      if (showNotifMenu) {
          setShowNotifMenu(false);
      } else {
          navigate(-1);
      }
  };
`;
    layout = layout.replace('const unreadCount', funcs + '\n  const unreadCount');
}

// Update Header Back button
layout = layout.replace(
    /\{\s*location\.pathname \!\=\= \'\/dashboard\' && \(\s*<button onClick=\{\(\) => navigate\(\-1\)\}.*?>\s*<ChevronLeft size=\{20\} \/>\s*<\/button>\s*\)\}/,
    `{(location.pathname !== '/dashboard' || showNotifMenu) && (
              <button onClick={handleBack} className="text-slate-300 active:scale-95 p-1 bg-slate-700/50 rounded-md mr-1">
                <ChevronLeft size={20} />
              </button>
            )}`
);

// Remove old dropdown
const oldDropdown = /\{showNotifMenu && \([\s\S]*?<\/div>\s*\)\}/;
layout = layout.replace(oldDropdown, '');

// Replace main content with Overlay toggle
const oldMain = /<main className="flex-1 overflow-y-auto pb-24">[\s\S]*?<\/main>/;
const newMain = `{showNotifMenu ? (
        <div className="absolute top-14 left-0 right-0 bottom-0 bg-[#212236] z-50 overflow-y-auto flex flex-col pb-16">
          <h2 className="text-center text-sky-400 font-bold text-2xl py-3 shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-[#212236] z-10 border-b border-sky-400/50">
            Notifications
          </h2>
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700">
            <span className="text-emerald-400 font-bold text-[13px]">Notifications: {notifications.length}</span>
            <button onClick={clearNotifications} className="text-slate-300 font-semibold text-[13px] flex items-center gap-1 active:scale-95">
              Clear notifications <Trash2 size={16} />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-3 pb-24">
            {notifications.length === 0 ? (
              <div className="text-center text-slate-500 mt-10 text-sm">No new notifications</div>
            ) : (
              notifications.map((n:any) => {
                const { datePart, timePart } = formatNotifDate(n.createdAt);
                return (
                  <div key={n._id} className="bg-[#292a40] rounded-xl p-3 flex gap-3 shadow-md border border-slate-700/50">
                    <Bell className="text-emerald-400 mt-1 shrink-0" size={24} fill="currentColor" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-[13px] leading-tight">{n.title}</h3>
                      <p className="text-slate-300 text-xs mt-1 leading-tight">{n.message}</p>
                    </div>
                    <div className="flex flex-col items-end justify-start shrink-0 gap-1">
                      <span className="text-sky-400 text-xs font-semibold">{datePart}</span>
                      <span className="text-sky-400 text-[11px] font-medium">{timePart}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>
      )}`;
layout = layout.replace(oldMain, newMain);

fs.writeFileSync(layoutFile, layout);
console.log('Layout updated with full-page Notifications overlay.');
