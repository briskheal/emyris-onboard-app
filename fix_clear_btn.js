const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

const replacement = `  useEffect(() => {
    axios.get('/api/xl/admin/notifications').then(res => {
      if (res.data.success) {
        const clearedAtStr = localStorage.getItem('xla_notifs_cleared');
        const clearedAt = clearedAtStr ? parseInt(clearedAtStr) : 0;
        const validNotifs = res.data.data.filter((n: any) => new Date(n.date).getTime() > clearedAt);
        setNotifications(validNotifs);
      }
    }).catch(e => console.error(e));
  }, []);

  const handleClearNotifications = () => {
    localStorage.setItem('xla_notifs_cleared', Date.now().toString());
    setNotifications([]);
  };`;

c = c.replace(/useEffect\(\(\) => \{[\s\S]*?catch\(e => console\.error\(e\)\);\s*\}, \[\]\);/g, replacement);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed Clear Button logic');
