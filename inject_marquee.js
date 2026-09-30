const fs = require('fs');
let c = fs.readFileSync('xl-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('const [announcement')) {
  // Add useEffect and axios
  c = c.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';\nimport axios from 'axios';"
  );

  // Add state and effect
  const stateHooks = `  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    axios.get('/api/xl/admin/announcement')
      .then(res => {
        if (res.data.success && res.data.data) {
          setAnnouncement(res.data.data.message);
        }
      })
      .catch(e => console.error('Failed to fetch announcement:', e));
  }, []);`;

  c = c.replace(/const \[selectedMonth.*const \[selectedYear.*2026'\);/s, stateHooks);

  // Add marquee
  const marquee = `
      {/* Global Scrolling Announcement */}
      {announcement && (
        <div className="bg-sky-600/20 border-b border-sky-500/30 overflow-hidden py-2 px-4 flex items-center shadow-md">
           <div className="text-sky-400 font-bold whitespace-nowrap mr-4 shrink-0 text-sm">ANNOUNCEMENT</div>
           <marquee className="text-white text-sm font-medium" scrollamount="5">{announcement}</marquee>
        </div>
      )}
  `;

  c = c.replace(/\{\/\* Placeholder for future Backlog Reporting & Messages \*\/\}\s*<div id="dashboard-message-placeholder" className="hidden"><\/div>/, marquee);

  fs.writeFileSync('xl-frontend/src/pages/Dashboard.tsx', c);
  console.log('Added marquee announcement to Mobile Dashboard');
}
