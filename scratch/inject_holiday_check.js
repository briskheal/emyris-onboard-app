const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

// 1. Add holiday check to /call-plan/bulk
const callPlanOld = `router.post('/call-plan/bulk', async (req, res) => {
    try {
        const { employeeId, dates, doctors, chemists, stockists } = req.body;
        if (!employeeId || !dates || !Array.isArray(dates)) return res.status(400).json({ error: 'Invalid payload' });`;

const callPlanNew = `router.post('/call-plan/bulk', async (req, res) => {
    try {
        const { employeeId, dates, doctors, chemists, stockists } = req.body;
        if (!employeeId || !dates || !Array.isArray(dates)) return res.status(400).json({ error: 'Invalid payload' });
        
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
                return res.json({ success: false, message: \`Cannot submit Call Plan on a Holiday: \${invalidDates.join(', ')}\` });
            }
        }
        // -----------------------`;

// 2. Add holiday check to /tour-program
const tpOld = `router.post('/tour-program', async (req, res) => {
    try {
        const { employeeId, employeeName, hq, year, entries, resubmitRemark } = req.body;
        let { month } = req.body;
        if (!employeeId || !month || !year) return res.status(400).json({ error: 'Missing required fields' });
        
        month = month.toLowerCase(); // Enforce lowercase month for DB consistency`;

const tpNew = `router.post('/tour-program', async (req, res) => {
    try {
        const { employeeId, employeeName, hq, year, entries, resubmitRemark } = req.body;
        let { month } = req.body;
        if (!employeeId || !month || !year) return res.status(400).json({ error: 'Missing required fields' });
        
        month = month.toLowerCase(); // Enforce lowercase month for DB consistency
        
        // --- HOLIDAY CHECK ---
        if (entries && Array.isArray(entries) && entries.length > 0) {
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
                const submittedDates = entries.map(e => e.date);
                const invalidDates = submittedDates.filter(d => holidayDates.has(d));
                if (invalidDates.length > 0) {
                    return res.json({ success: false, message: \`Cannot submit Tour Program on a Holiday: \${invalidDates.join(', ')}\` });
                }
            }
        }
        // -----------------------`;

c = c.replace(callPlanOld, callPlanNew);
c = c.replace(tpOld, tpNew);

fs.writeFileSync('routes/xl.js', c);
console.log('Successfully injected backend holiday checks for Call Plans and Tour Programs.');
