const fs = require('fs');
let content = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', 'utf8');

// 1. Add state for reportData
content = content.replace(
  "const [selectedUser, setSelectedUser] = useState<string>('');",
  "const [selectedUser, setSelectedUser] = useState<string>('');\n  const [reportData, setReportData] = useState<any[]>([]);"
);

// 2. Remove hardcoded dummy data
const dummyDataMatch = content.match(/\\/\\/ Dummy data based on standard report columns[\\s\\S]*?\\= \[[\\s\\S];*?\\];/);
if (dummyDataMatch) {
  content = content.replace(dummyDataMatch[0], '');
}

// 3. Add useEffect for fetching Tour Program Data
const fetchEffect = `
  useEffect(() => {
    if (!selectedUser || !startDate || !endDate) {
      setReportData([]);
      return;
    }
    
    const fetchTP = async () => {
      const monthsToFetch = new Set<string>();
      let current = new Date(startDate);
      while (current <= endDate) {
         const m = current.toLocaleString('default', { month: 'long' }).toLowerCase();
         const y = current.getFullYear().toString();
         monthsToFetch.add(`${m}-${y}`);
         current.setDate(current.getDate() + 1);
      }
      
      let allEntries: any[] = [];
      for (const my of monthsToFetch) {
         const [m, y] = my.split('-');
         try {
           const res = await axios.get(`/api/xl/tour-program/my?email=${encodeURIComponent(selectedUser)}&month=${m}&year=${y}`);
           if (res.data && res.data.success && res.data.data) {
              let entries = [];
              try {
                 entries = typeof res.data.data.entries === 'string' ? JSON.parse(res.data.data.entries) : res.data.data.entries;
              } catch(e) {}
              
              if (Array.isArray(entries)) {
                entries = entries.map(e => ({
                   ...e, 
                   employeeName: res.data.data.employeeName,
                   tpStatus: e.status || res.data.data.status
                }));
                allEntries = [...allEntries, ...entries];
              }
           }
         } catch (e) {
           console.error(e);
         }
      }
      
      // format local YYYY-MM-DD
      const formatDateStr = (d: Date) => {
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().split('T')[0];
      };
      
      const startStr = formatDateStr(startDate);
      const endStr = formatDateStr(endDate);
      
      const filtered = allEntries.filter(e => e.date >= startStr && e.date <= endStr);
      
      // Sort by date
      filtered.sort((a, b) => a.date.localeCompare(b.date));
      
      const formatted = filtered.map((e, idx) => ({
         id: idx,
         date: new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
         name: e.employeeName || selectedUser,
         areaType: e.areaType || '-',
         areas: e.workAreas || '-',
         oldAreas: '-',
         edited: e.isEdited ? 'Yes' : 'No',
         remarks: e.remarks || '-',
         activity: e.activity || 'Working',
         workedWith: e.workedWith || '-',
         status: e.tpStatus
      }));
      
      setReportData(formatted);
    };

    fetchTP();
  }, [startDate, endDate, selectedUser]);
`;

content = content.replace(
  "  return (",
  fetchEffect + "\n  return ("
);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', content);
