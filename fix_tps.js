const { XlTourProgram, XlUser, sequelize } = require('./db');

async function fixDuplicates() {
    const tps = await XlTourProgram.findAll({ 
        where: { month: 'september', year: '2026' },
        raw: true 
    });

    const userMap = {};
    for (const tp of tps) {
        if (!userMap[tp.employeeId]) userMap[tp.employeeId] = [];
        userMap[tp.employeeId].push(tp);
    }
    
    // Group by real user
    const users = await XlUser.findAll({ raw: true });
    
    for (const u of users) {
        const theirTps = tps.filter(t => t.employeeId === u.employeeId || t.employeeId === u.email || t.employeeId === u.uid);
        if (theirTps.length > 1) {
            console.log("Found duplicate for user", u.employeeId, ":");
            // Find the most populated one or the Approved one
            const approved = theirTps.find(t => t.status === 'Approved' || t.status === 'Submitted');
            let keepId = approved ? approved._id : theirTps[0]._id;
            
            // If they are both draft, keep the one with the most entries string length
            if (!approved) {
                const sorted = theirTps.sort((a,b) => (b.entries || '').length - (a.entries || '').length);
                keepId = sorted[0]._id;
            }
            
            for (const t of theirTps) {
                if (t._id !== keepId) {
                    console.log("Deleting duplicate TP:", t._id, "Length:", (t.entries || '').length, "Status:", t.status);
                    await XlTourProgram.destroy({ where: { _id: t._id } });
                } else {
                    console.log("Keeping TP:", t._id, "Length:", (t.entries || '').length, "Status:", t.status);
                }
            }
        }
    }
}
fixDuplicates();
