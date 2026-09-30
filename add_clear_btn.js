const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('handleClearNotifications')) {
    // Add logic
    const fetchLogic = `
  useEffect(() => {
    axios.get('/api/xl/admin/notifications').then(res => {
      if (res.data.success) {
        const clearedAtStr = localStorage.getItem('xla_notifs_cleared');
        const clearedAt = clearedAtStr ? parseInt(clearedAtStr) : 0;
        const validNotifs = res.data.data.filter((n: any) => new Date(n.date).getTime() > clearedAt);
        setNotifications(validNotifs);
      }
    }).catch((e: any) => console.error(e));
  }, []);

  const handleClearNotifications = () => {
    localStorage.setItem('xla_notifs_cleared', Date.now().toString());
    setNotifications([]);
  };`;

    c = c.replace(/useEffect\(\(\) => \{[\s\S]*?catch\(\(e: any\) => console\.error\(e\)\);\s*\}, \[\]\);/g, fetchLogic);

    // Add UI Button
    const headerHtml = `<div className="flex items-center justify-between px-3 py-2 border-b border-[#3b3b5a]">
              <h4 className="text-white font-bold">Recent Activity</h4>
              {notifications.length > 0 && (
                 <button onClick={handleClearNotifications} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors">Clear</button>
              )}
              </div>`;

    c = c.replace(/<h4 className="text-white font-bold px-3 py-2 border-b border-\[\#3b3b5a\]">Recent Activity<\/h4>/g, headerHtml);

    fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
    console.log('Added Clear Button to Dashboard');
}
