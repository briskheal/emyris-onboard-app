require('dotenv').config();
const { XlLeave, XlAttendance } = require('./db');

async function syncXlLeaves() {
    try {
        const approvedLeaves = await XlLeave.findAll({ where: { status: 'Approved' } });
        console.log(`Found ${approvedLeaves.length} approved XLA leaves to sync.`);

        for (const record of approvedLeaves) {
            const isLWP = record.leaveType === 'Leave Without Pay' || record.leaveType === 'LWP';
            
            const sd = new Date(record.startDate);
            const ed = new Date(record.endDate || record.startDate);
            
            if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                const dateList = [];
                let curr = new Date(sd);
                while (curr <= ed) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    dateList.push(`${y}-${m}-${d}`);
                    curr.setDate(curr.getDate() + 1);
                }

                for (const dStr of dateList) {
                    // Check if already exists to prevent duplicate log spew
                    await XlAttendance.upsert({
                        employeeId: record.employeeId,
                        date: dStr,
                        status: isLWP ? 'LWP' : 'Leave',
                        punchInTime: 'Leave',
                        punchOutTime: 'Leave',
                        dayRemarks: 'Auto-approved Leave',
                        daySubmitted: true
                    });
                }
            }
        }
        console.log("Retroactive XLA leave sync complete.");
    } catch (e) {
        console.error("Failed to sync retroactive leaves:", e);
    }
    process.exit(0);
}

syncXlLeaves();
