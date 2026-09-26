require('dotenv').config();
const { LeaveRequest, XlAttendance } = require('./db');

async function syncRetroactiveLeaves() {
    try {
        const approvedLeaves = await LeaveRequest.find({ status: 'Approved' });
        console.log(`Found ${approvedLeaves.length} approved leaves to sync.`);

        for (const request of approvedLeaves) {
            const isLWP = request.leaveTypeName.toLowerCase().includes('leave without pay') || request.leaveTypeName.toLowerCase().includes('lwp');
            
            const start = new Date(request.fromDate);
            const end = new Date(request.toDate);
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const dateList = [];
                let curr = new Date(start);
                while (curr <= end) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    dateList.push(`${y}-${m}-${d}`);
                    curr.setDate(curr.getDate() + 1);
                }

                for (const dStr of dateList) {
                    await XlAttendance.upsert({
                        employeeId: request.employeeEmail,
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
        console.log("Retroactive sync complete.");
    } catch (e) {
        console.error("Failed to sync retroactive leaves:", e);
    }
    process.exit(0);
}

syncRetroactiveLeaves();
