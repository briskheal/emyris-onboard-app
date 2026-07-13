const cron = require('node-cron');
const { sendEmail } = require('./mailer');
const { Company, Applicant, ExamResult } = require('../db');
const { syncActiveExamForApplicant } = require('./examSync');

async function runExamReminderCron() {
    try {
        console.log('⏰ Running 8-hourly exam reminder and report cron job...');
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
                // Send reminder
                try {
                    const productNames = pending.map(p => p.targetProduct).join(', ');
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #4f46e5; margin: 0; font-size: 22px;">⏰ Action Required: Mandatory Assessment Pending</h2>
                            </div>
                            <p style="color: #334155; font-size: 16px;">Dear ${app.fullName || app.name || 'Applicant'},</p>
                            <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                                Whether your offer letter is pending, issued, or already accepted, completing your scheduled <strong>${productNames} Assessment</strong> is a mandatory requirement to confirm and finalize your onboarding workflow with Emyris Biolifesciences.
                            </p>
                            <div style="background-color: #f8fafc; padding: 18px; border-left: 4px solid #4f46e5; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px; color: #1e293b;"><strong>Pending Exam(s):</strong> ${productNames}</p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">Please log in to your dashboard and complete your assessment right away.</p>
                            </div>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.BASE_URL || 'https://emyrishr.in'}/" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5, #3b82f6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                                    🚀 Launch Assessment Now
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                                Emyris Biolifesciences HR Compliance Team • Automated 8-Hourly Reminder
                            </p>
                        </div>
                    `;
                    await sendEmail({
                        to: app.email,
                        subject: `Reminder: Mandatory Assessment Pending (${productNames})`,
                        html: emailHtml
                    });
                    remindersSent++;
                    console.log(`📧 Sent 8-hourly exam reminder to: ${app.email}`);
                } catch (err) {
                    console.error('Failed to send reminder to:', app.email, err.message);
                }
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
                <h2 style="color: #6366f1;">8-Hourly Exam Status Report</h2>
                <p><strong>Total Applicants Checked:</strong> ${applicants.length} | <strong>Reminders Sent:</strong> ${remindersSent}</p>
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
            subject: `Exam Status Report (Multi-Exam Queue) - ${remindersSent} Reminders Sent`,
            html: reportHtml
        });

        console.log(`✅ 8-hourly exam reminder and report completed. Total Checked: ${applicants.length}, Reminders Sent: ${remindersSent}`);
        return { success: true, totalChecked: applicants.length, remindersSent };
    } catch (error) {
        console.error('Error in exam reminder cron:', error);
        return { success: false, error: error.message };
    }
}

function startCronJobs() {
    // Run every 8 hours (0 0,8,16 * * *)
    cron.schedule('0 0,8,16 * * *', async () => {
        await runExamReminderCron();
    });
}

module.exports = { startCronJobs, runExamReminderCron };
