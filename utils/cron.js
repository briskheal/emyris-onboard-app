const cron = require('node-cron');
const { sendEmail } = require('./mailer');
const { Company, Applicant, ExamResult } = require('../db');

function startCronJobs() {
    // Run every 8 hours (0 0,8,16 * * *)
    cron.schedule('0 0,8,16 * * *', async () => {
        try {
            console.log('⏰ Running 8-hourly exam reminder and report cron job...');
            const company = await Company.findOne();
            if (!company || !company.activeExamDate) return;

            const examDate = company.activeExamDate.substring(0, 10);
            const productName = company.activeExamProduct || 'General Assessment';

            const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
            
            let reportRows = '';

            for (const app of applicants) {
                const existingResult = await ExamResult.findOne({ email: app.email, examDate: examDate });
                
                let attemptStatus = 'Not Attempted';
                let mcqMarks = '-';
                let manualStatus = 'Pending';
                let totalMarks = '-';

                if (!existingResult) {
                    // Send reminder
                    try {
                        const emailHtml = `
                            <h2>Reminder: Exam Pending for ${productName}</h2>
                            <p>Hi ${app.fullName},</p>
                            <p>This is a reminder that your MCQ Questionnaire for <strong>${productName}</strong> is waiting on your dashboard.</p>
                            <p>Please log in and complete it as soon as possible.</p>
                            <p><a href="${process.env.BASE_URL || 'https://emyrishr.in'}/" style="padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
                        `;
                        await sendEmail({
                            to: app.email,
                            subject: `Reminder: Action Required for ${productName} Exam`,
                            html: emailHtml
                        });
                    } catch (err) {
                        console.error('Failed to send reminder to:', app.email, err.message);
                    }
                } else {
                    attemptStatus = 'Attempted';
                    mcqMarks = existingResult.autoScore || 0;
                    if (existingResult.status === 'graded') {
                        manualStatus = 'Done';
                        totalMarks = existingResult.totalScore || 0;
                    } else {
                        manualStatus = 'Pending';
                        totalMarks = 'Pending';
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
                    <p><strong>Product:</strong> ${productName}</p>
                    <p><strong>Scheduled Date:</strong> ${examDate}</p>
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
                subject: `Exam Status Report - ${productName}`,
                html: reportHtml
            });

            console.log('✅ 8-hourly exam reminder and report completed.');

        } catch (error) {
            console.error('Error in exam reminder cron:', error);
        }
    });
}

module.exports = { startCronJobs };
