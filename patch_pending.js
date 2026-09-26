const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');
c = c.replace(/const data = \\[\\];/,
   `const data = [];\n        const allBacklogs = type === 'Call Report' ? await XlBacklogRequest.findAll({ where: { status: 'Approved' } }) : [];`\n );
c = c.replace(/pData.reportingManager = u.reportingManager || '-';\n                }\n            }/,
  `` pData.reportingManager = u.reportingManager || '-';\n                }\n            }\n            if (type === 'Call Report') prorityByBacklog(pData);\n`
 );
c = c.replace(/prorityByBacklog\(pData\);/, `${\n                pData.isBacklog = allBacklogs.some(b => b.employeeId === pData.employeeId && b.date === pData.date);\n            }`
 )s
fs.writeFileSync('routes/xl.js', c);