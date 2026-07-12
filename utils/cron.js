const cron = require('node-cron');
const { sendEmail } = require('./mailer');
const { Company, Applicant, ExamResult } = require('../db');

function startCronJobs() {
    // Run every 8 hours (0 0,8,16 * * *)
    cron.schedule('0 0,8,16 * * *', async () => {
        try {
            console.log('⏰ Running 8-hourly exam reminder and report cron job...');
            console.log('⏰ Running 8-hourly exam reminder and report cron job...');

            const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
            
            let reportRows = '';

            for (const app of applicants) {
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
                    // Send reminder
                    try {
                        const productNames = pending.map(p => p.targetProduct).join(', ');
                        const emailHtml = `
                            <h2>Reminder: Exams Pending</h2>
                            <p>Hi ${app.fullName},</p>
                            <p>This is a reminder that you have <strong>${pending.length}</strong> mandatory exam(s) waiting on your dashboard for the following products: <strong>${productNames}</strong>.</p>
                            <p>Please log in and complete them as soon as possible.</p>
                            <p><a href="${process.env.BASE_URL || 'https://emyrishr.in'}/" style="padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
                        `;
                        await sendEmail({
                            to: app.email,
                            subject: `Reminder: Action Required for Pending Exams`,
                            html: emailHtml
                        });
                    } catch (err) {
                        console.error('Failed to send reminder to:', app.email, err.message);
                    }
                }

                reportRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc; color: #000;">${app.fullName}</td>
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
                    <h2 style="color: #6366f1;">8-Hourly Exam Status Report</h2>
                    <p><strong>Total Applicants:</strong> ${applicants.length}</p>
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
                subject: `Exam Status Report (Multi-Exam Queue)`,
                html: reportHtml
            });

            console.log('✅ 8-hourly exam reminder and report completed.');

        } catch (error) {
            console.error('Error in exam reminder cron:', error);
        }
    });
}

module.exports = { startCronJobs };
