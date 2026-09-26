const fs = require('fs');
let content = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', 'utf8');

// Fix dates
content = content.replace("const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));", "const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 30));");

// Fix areas and areaType mapping
content = content.replace(
  "areaType: e.areaType || '-',",
  "areaType: e.type || e.workAreaType || e.areaType || '-',"
);
content = content.replace(
  "areas: e.workAreas || '-',",
  "areas: e.toMarket || e.workingArea || e.workArea || '-',"
);
content = content.replace(
  "activity: e.activity || 'Working',",
  "activity: e.activityType || e.activity || 'Working',"
);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx', content);

let callReportContent = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', 'utf8');
callReportContent = callReportContent.replace("const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 21));", "const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 30));");
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', callReportContent);