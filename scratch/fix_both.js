const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const badStr = '{Array.from(new Set(yearlyTargets.map(t => t.division).filter(Boolean))).map(div => <option key={div} value={div}>{div}</option>)}';
const correctDivisionsMap = '{divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}';

// 1. Replace the first occurrence of badStr with correctDivisionsMap (this fixes CreateProfileTab)
c = c.replace(badStr, correctDivisionsMap);

// 2. Replace the occurrence of correctDivisionsMap that appears much later in SetTargetTab with badStr
// Instead of simple replace which hits the first occurrence again, let's find the last occurrence!
const lastIdx = c.lastIndexOf(correctDivisionsMap);
c = c.substring(0, lastIdx) + badStr + c.substring(lastIdx + correctDivisionsMap.length);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed both perfectly');
