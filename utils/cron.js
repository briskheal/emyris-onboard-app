const cron = require('node-cron');
const { sendEmail } = require('./mailer');
const { Company, Applicant, ExamResult } = require('../db');
const { syncActiveExamForApplicant } = require('./examSync');

async function runExamReminderCron() {
    try {
        console.log('⏰ Running 48-hourly exam report cron job...');
        const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
        
        let reportRows = '';
        let remindersSent = 0;

        for (let app of applicants) {
            // 1. Auto-sync active exam before checking pending status
            app = await syncActiveExamForApplicant(app);

            let pending = [];
            try { pending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []); } catch(e){}
            
            let attemptStatus = pending.length > 0 ? `${pending.length} Pending` : 'All Completed';
            let mcqMarks = '-';
            let manualStatus = '-';
            let totalMarks = '-';

            // Look up recent results for the admin report
            const recentResults = await ExamResult.find({ email: app.email });
            const latest = recentResults.length > 0 ? recentResults[recentResults.length - 1] : null;
            if (latest) {
                mcqMarks = latest.autoScore || 0;
                if (latest.status === 'graded') {
                    manualStatus = 'Done';
                    totalMarks = latest.totalScore || 0;
                } else {
                    manualStatus = 'Pending';
                    totalMarks = 'Pending';
                }
            }

            if (pending.length > 0) {
                remindersSent++; // Keep count for the admin report of how many are pending
            }

            reportRows += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${app.fullName || app.name || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${app.hq || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${attemptStatus}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${mcqMarks}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${manualStatus}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${totalMarks}</td>
                </tr>
            `;
        }

        // Send admin report
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'hradmin@emyrishr.in';
        const reportHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto;">
                <h2 style="color: #6366f1;">48-Hourly Exam Status Report</h2>
                <p><strong>Total Applicants Checked:</strong> ${applicants.length} | <strong>Total Pending Assessments:</strong> ${remindersSent}</p>
                <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6; color: #000;">
                            <th style="padding: 8px; border: 1px solid #ccc;">Name</th>
                            <th style="padding: 8px; border: 1px solid #ccc;">HQ</th>
                            <th style="padding: 8px; border: 1px solid #ccc;">Status</th>
                            <th style="padding: 8px; border: 1px solid #ccc;">MCQ Marks</th>
                            <th style="padding: 8px; border: 1px solid #ccc;">Manual Verification</th>
                            <th style="padding: 8px; border: 1px solid #ccc;">Total Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportRows}
                    </tbody>
                </table>
            </div>
        `;

        await sendEmail({
            to: adminEmail,
            subject: `Exam Status Report (Multi-Exam Queue) - ${remindersSent} Pending`,
            html: reportHtml
        });

        console.log(`✅ 48-hourly exam report completed. Total Checked: ${applicants.length}, Pending: ${remindersSent}`);
        return { success: true, totalChecked: applicants.length, pendingFound: remindersSent };
    } catch (error) {
        console.error('Error in exam reminder cron:', error);
        return { success: false, error: error.message };
    }
}

async function runBirthdayCron() {
    try {
        console.log('🎉 Running 8 AM Birthday Cron Job...');
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
        let birthdayKids = [];

        for (let app of applicants) {
            if (!app.dob) continue;
            try {
                const dobDate = new Date(app.dob);
                if (!isNaN(dobDate) && dobDate.getMonth() === currentMonth && dobDate.getDate() === currentDay) {
                    birthdayKids.push(app);
                }
            } catch (e) {}
        }

        if (birthdayKids.length === 0) {
            console.log('ℹ️ No birthdays today.');
            return { success: true, birthdaysFound: 0 };
        }

        let adminReportRows = '';

        for (let app of birthdayKids) {
            const firstName = (app.fullName || app.name || 'Applicant').split(' ')[0];
            const emailHtml = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; text-align: center; background-color: #f8fafc; border-radius: 16px;">
                    <div style="background: #ffffff; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎂🎉</div>
                        <h1 style="color: #4f46e5; margin: 0 0 15px 0; font-size: 28px;">Happy Birthday, ${firstName}!</h1>
                        <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
                            Wishing you a fantastic birthday filled with joy, success, and great moments. We hope this year brings you closer to your dreams!
                        </p>
                        <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin: 0;">
                            Warmest wishes from all of us at<br>
                            <strong style="color: #1e293b; font-size: 18px;">Emyris Biolifesciences</strong>
                        </p>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    to: app.email,
                    subject: `🎉 Happy Birthday from Emyris Biolifesciences!`,
                    html: emailHtml
                });
                console.log(`🎂 Sent birthday email to: ${app.email}`);
                adminReportRows += `<li>${app.fullName || app.name} (${app.email})</li>`;
            } catch (err) {
                console.error('Failed to send birthday email to:', app.email, err.message);
                adminReportRows += `<li><span style="color: red;">[FAILED]</span> ${app.fullName || app.name} (${app.email})</li>`;
            }
        }

        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'hradmin@emyrishr.in';
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #4f46e5;">🎂 Daily Birthday Report</h2>
                <p>Birthday greetings were automatically sent to the following <strong>${birthdayKids.length}</strong> applicant(s) today:</p>
                <ul>${adminReportRows}</ul>
            </div>
        `;

        await sendEmail({
            to: adminEmail,
            subject: `🎂 Birthday Report: ${birthdayKids.length} greetings sent`,
            html: adminHtml
        });

        console.log(`✅ Birthday cron completed. Sent ${birthdayKids.length} greetings.`);
        return { success: true, birthdaysFound: birthdayKids.length };
    } catch (error) {
        console.error('Error in birthday cron:', error);
        return { success: false, error: error.message };
    }
}

function startCronJobs() {
    // Run exam reminder every 48 hours (every 2 days at 8:00 AM)
    cron.schedule('0 8 */2 * *', async () => {
        await runExamReminderCron();
    });

    // Run every day at 8:00 AM IST for birthdays
    cron.schedule('0 8 * * *', async () => {
        await runBirthdayCron();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}

module.exports = { startCronJobs, runExamReminderCron, runBirthdayCron };
