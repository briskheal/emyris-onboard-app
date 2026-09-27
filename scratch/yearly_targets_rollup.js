const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const targetStr = `const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName', 'hq', 'division', 'designation'] });
        
        const userMap = {};
        allUsers.forEach(u => {
            userMap[u.uid] = {
                uid: u.uid,
                userName: u.firstName + ' ' + (u.lastName || ''),
                hq: u.hq,
                division: u.division,
                designation: u.designation,
                months: {
                    April: 0, May: 0, June: 0, July: 0, August: 0, September: 0,
                    October: 0, November: 0, December: 0, January: 0, February: 0, March: 0
                },
                total: 0
            };
        });

        allTargets.forEach(t => {
            if (userMap[t.employeeId] && userMap[t.employeeId].months[t.month] !== undefined) {
                const amount = t.allocationType === 'Lump-Sum' ? (t.lumpSumAmount || 0) : (t.totalProductAmount || 0);
                userMap[t.employeeId].months[t.month] += amount;
                userMap[t.employeeId].total += amount;
            }
        });`;

const replacement = `const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName', 'hq', 'division', 'designation', 'reportingManager'] });
        
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
        
        Object.keys(userMap).forEach(uid => calculateTeamYearlyTarget(uid));`;

c = c.replace(targetStr, replacement);
fs.writeFileSync('routes/admin.js', c);
console.log('Fixed yearly targets rollup');
