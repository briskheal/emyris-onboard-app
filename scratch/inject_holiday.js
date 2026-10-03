const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const target1 = "if (!employeeId || !dates || !Array.isArray(dates)) return res.status(400).json({ error: 'Invalid payload' });";
const inject1 = `
        // --- HOLIDAY CHECK ---
        const user = await XlUser.findOne({ where: { employeeId } });
        if (user && user.state) {
            const holidays = await XlHoliday.findAll({
                where: {
                    [Op.or]: [
                        { state: user.state },
                        { state: null },
                        { state: 'All' },
                        { state: 'N/A' },
                        { state: '' }
                    ]
                }
            });
            const holidayDates = new Set(holidays.map(h => h.date));
            const invalidDates = dates.filter(d => holidayDates.has(d));
            if (invalidDates.length > 0) {
                return res.json({ success: false, message: 'Cannot submit Call Plan on a Holiday: ' + invalidDates.join(', ') });
            }
        }
        // -----------------------`;

if (c.includes(target1)) {
    c = c.replace(target1, target1 + inject1);
    console.log("Injected Call Plan");
} else {
    console.log("Could not find target1");
}

fs.writeFileSync('routes/xl.js', c);
