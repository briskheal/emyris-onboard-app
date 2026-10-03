const fs = require('fs');

// Fix Admin JS (Yearly Rollup)
let adminC = fs.readFileSync('routes/admin.js', 'utf8');

const yearlyStart = adminC.indexOf("router.get('/targets/yearly',");
const yearlyEnd = adminC.indexOf("const result = Object.values(userMap).filter(u => u.total > 0);", yearlyStart) > -1 
  ? adminC.indexOf("const result = Object.values(userMap).filter(u => u.total > 0);", yearlyStart)
  : adminC.indexOf("res.json({ success: true, data: Object.values(userMap)", yearlyStart);

const newYearly = `router.get('/targets/yearly', async (req, res) => {
    try {
        const { year } = req.query;
        let where = {};
        if (year) where.year = year;

        const allTargets = await XlTarget.findAll({ where });
        const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName', 'hq', 'division', 'designation', 'reportingManager'] });
        
        const userMap = {};
        allUsers.forEach(u => {
            userMap[u.uid] = {
                uid: u.uid,
                userName: u.firstName + ' ' + (u.lastName || ''),
                hq: u.hq,
                division: u.division,
                designation: u.designation,
                reportingManager: u.reportingManager,
                children: [],
                directMonths: { April: 0, May: 0, June: 0, July: 0, August: 0, September: 0, October: 0, November: 0, December: 0, January: 0, February: 0, March: 0 },
                directTotal: 0,
                teamMonths: { April: 0, May: 0, June: 0, July: 0, August: 0, September: 0, October: 0, November: 0, December: 0, January: 0, February: 0, March: 0 },
                teamTotal: 0,
                months: { April: 0, May: 0, June: 0, July: 0, August: 0, September: 0, October: 0, November: 0, December: 0, January: 0, February: 0, March: 0 },
                total: 0
            };
        });

        allTargets.forEach(t => {
            if (userMap[t.employeeId] && userMap[t.employeeId].directMonths[t.month] !== undefined) {
                const amount = t.allocationType === 'Lump-Sum' ? (t.lumpSumAmount || 0) : (t.totalProductAmount || 0);
                userMap[t.employeeId].directMonths[t.month] += amount;
                userMap[t.employeeId].directTotal += amount;
                
                userMap[t.employeeId].months[t.month] += amount;
                userMap[t.employeeId].total += amount;
            }
        });

        allUsers.forEach(u => {
            if (u.reportingManager && userMap[u.reportingManager]) {
                userMap[u.reportingManager].children.push(u.uid);
            }
        });

        function calculateTeamYearlyTarget(uid) {
            const user = userMap[uid];
            if (!user) return { months: {}, total: 0 };
            if (user.calculated) return { months: user.teamMonths, total: user.teamTotal };
            
            let teamSum = { April: 0, May: 0, June: 0, July: 0, August: 0, September: 0, October: 0, November: 0, December: 0, January: 0, February: 0, March: 0, total: 0 };
            
            user.children.forEach(childUid => {
                const child = userMap[childUid];
                const childTeam = calculateTeamYearlyTarget(childUid);
                
                Object.keys(teamSum).forEach(m => {
                    if (m !== 'total') {
                        teamSum[m] += child.directMonths[m] + childTeam.months[m];
                    }
                });
                teamSum.total += child.directTotal + childTeam.total;
            });
            
            user.teamMonths = { ...teamSum };
            delete user.teamMonths.total;
            user.teamTotal = teamSum.total;
            
            Object.keys(user.months).forEach(m => {
                 user.months[m] += user.teamMonths[m];
            });
            user.total += user.teamTotal;
            
            user.calculated = true;
            return { months: user.teamMonths, total: user.teamTotal };
        }
        
        Object.keys(userMap).forEach(uid => calculateTeamYearlyTarget(uid));

        `;

adminC = adminC.substring(0, yearlyStart) + newYearly + adminC.substring(yearlyEnd);
fs.writeFileSync('routes/admin.js', adminC);


// Fix ManageUsers.tsx
let uiC = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const tHeadStart = uiC.indexOf('<th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Lump Sum Amt</th>');
const tHeadEnd = uiC.indexOf('<th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800">Product Amt</th>') + 116;

if (tHeadStart > -1) {
  const newHeaders = `<th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Direct Budget</th>
                      <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Team Budget</th>
                      <th className="border-r border-slate-700 p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-right">Total Budget</th>`;
  uiC = uiC.substring(0, tHeadStart) + newHeaders + uiC.substring(tHeadEnd);
}

const tBodyStart = uiC.indexOf('{targets.map((t, i) => (');
const tBodyEnd = uiC.indexOf('<td className="p-4 text-center">', tBodyStart);

if (tBodyStart > -1) {
  const newRows = `{targets.filter(t => t.totalTarget > 0).map((t, i) => (
                  <tr key={t.employeeId} className="hover:bg-slate-700/30">
                    <td className="p-4 text-slate-300 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 text-white font-bold border-r border-slate-700">{t.userName || t.userEmail}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700 text-right">{t.directTarget || 0}</td>
                    <td className="p-4 text-slate-300 border-r border-slate-700 text-right">{t.teamTarget || 0}</td>
                    <td className="p-4 text-emerald-400 font-bold border-r border-slate-700 text-right">{t.totalTarget || 0}</td>
                    `;
  uiC = uiC.substring(0, tBodyStart) + newRows + uiC.substring(tBodyEnd);
}

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', uiC);
console.log('Fixed everything properly');
