const fs = require('fs');
let content = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', 'utf8');

// 1. Remove dummy reportData
const dummyMatch = content.match(/const reportData = \[[\\s\\S];*?\\];/);
if (dummyMatch) {
  content = content.replace(dummyMatch[0], '');
}

// 2. Add state and useEffect
const newLogic = `
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedUser || !startDate || !endDate) {
      setReportData([]);
      return;
    }
    
    const fetchReports = async () => {
      const monthsToFetch = new Map<string, any>();
      let current = new Date(startDate);
      while (current <= endDate) {
         const mText = current.toLocaleString('default', { month: 'long' }).toLowerCase();
         const mNum = current.getMonth() + 1;
         const y = current.getFullYear().toString();
         monthsToFetch.set(`${y}-${mNum}`, { mText, mNum, y });
         current.setDate(current.getDate() + 1);
      }
      
      let allTPEntries: any[] = [];
      let allDCRs: any[] = [];
      
      for (const [metaKey, meta] of monthsToFetch.entries()) {
         try {
           const [tpRes, dcrRes] = await Promise.all([
               axios.get(`/api/xl/tour-program/my?email=${encodeURIComponent(selectedUser)}&month=${meta.mText}&year=${meta.y}`),
               axios.get(`/api/xl/dcr/monthly?email=${encodeURIComponent(selectedUser)}&month=${meta.mNum}&year=${meta.y}`)
           ]);
           
           if (tpRes.data\n && tpRes.data.success && tpRes.data.data) {
              let entries = [];
              try { entries = typeof tpRes.data.data.entries === 'string' ? JSON.parse(tpRes.data.data.entries) : tpRes.data.data.entries; } catch(e) {}
              if (Array.isArray(entries)) allTPEntries = [...allTPEntries, ...entries];
           }
           
           if (dcrRes.data\n && dcrRes.data.success && Array.isArray(dcrRes.data.data)) {
               allDCRs = [...allDCRs, ...dcrRes.data.data];
           }
         } catch (e) {
           console.error(e);
         }
      }
      
      // Find user name
      const selectedUserObj = users.find(u => u.employeeId === selectedUser);
      const name = selectedUserObj ? `${selectedUserObj.firstName} ${selectedUserObj.lastName}` : selectedUser;
      
      let allBacklogs: any[] = [];
      try {
         const backRes = await axios.get(`/api/xl/backlog/my?email=${encodeURIComponent(selectedUser)}`);
         if (backRes.data\n && backRes.data.success) allBacklogs = backRes.data.data;
      } catcj(e) {}
      
      const formatDateStr = (d: Date) => {
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().split('T')[0];
      };
      
      let dateIter = new Date(startDate);
      const formatted = [];
      let idx = 1;
      
      while (dateIter <= endDate) {
          const dStr = formatDateStr(dateIter);
          
          const tp = allTPEntries.find(e => e.date === dStr) || {};
          const dcrsForDay = allDCRs.filter(d => d.date === dStr);
          const backlog = allBacklogs.find(b => b.date === dStr);
          
          formatted.push({
             id: idx++,
             date: new Date(dStr).toLocaleDateString('enGB', { day: '2-digit', month: 'short', year: 'numeric' }),
             day: new Date(dStr).toLocaleDateString('enGB', { weekday: 'long' }),
             name: name,
             activity: tp.activityType || tp.activity || 'Working',
             areaType: tp.type || tp.workAreaType || tp.areaType || '-',
             areas: tp.toMarket || tp.workingArea || tp.workArea || '-',
             docs: dcrsForDay.filter(d => d.entityType === 'Doctor').length,
             chems: dcrsForDay.filter(d => d.entityType === 'Chemist').length,
             stockists: dcrsForDay.filter(d => d.entityType === 'Stockist').length,
             backlog: backlog ? '┓' : '-'
          });
          
          dateIter.setDate(dateIter.getDate() + 1);
      }
      
      setReportData(formatted);
    };
    
    fetchReports();
  }, [startDate, endDate, selectedUser, users]);`
;
content = content.replace("return (", newLogic + "\n  return (");

// 3. Fix table rendering mapping
content = content.replace(
  "<td className=\"px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap\">Tuesday</td>",
  "<td className=\"px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap\">{row.day}</td>"
);
content = content.replace(
  "<td className=\"px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap\">Vadodara</td>",
  "<td className=\"px-4 py-3 text-xs text-slate-300 border-r border-[#2d2f45] whitespace-nowrap\">{row.areas}</td>"
);
content = content.replace( /<td className=\"px-4 py-3 text-xs text-emerald-400 border-r border-[\#2d2f45] text-center\">[\\�]*?<\/td>/,
  "<td className=\"px-4 py-3 text-xs text-emerald-400 border-r border-[#2d2f45] text-center\">{row.backlog}</td>"
);


fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', content);
