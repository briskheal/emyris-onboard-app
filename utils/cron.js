const cron = require('node-cron');
const { sendEmail } = require('./mailer');
const { Company, Applicant, ExamResult, XlNotification, Asset } = require('../db');
const { syncActiveExamForApplicant } = require('./examSync');
const { getSystemAdminEmail } = require('./adminHelper');
const { buildOfficialLetterHtml, generateAppointmentPdf } = require('./pdfGenerator');

function parseDateRobust(dateStr) {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (!str || str === 'undefined' || str === 'null') return null;
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const parts = str.substring(0, 10).split('-');
        const y = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        const m = p1 > 12 ? p2 : p1;
        const d = p1 > 12 ? p1 : p2;
        return new Date(y, m - 1, d);
    }
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
        const parts = str.split('-');
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const m = p1 > 12 ? p2 : p1;
        const d = p1 > 12 ? p1 : p2;
        return new Date(y, m - 1, d);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

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
        const adminEmail = await getSystemAdminEmail();
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

        const adminEmail = await getSystemAdminEmail();
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

async function runLifecycleCron() {
    try {
        console.log('⏰ Running daily lifecycle compliance cron job (Appointment & Confirmation alerts)...');
        const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
        // Dynamically resolve admin email from DB / Company Profile
        const adminEmail = await getSystemAdminEmail();

        const applicants = await Applicant.find({
            offerAccepted: true,
            actualJoiningDate: { $exists: true }
        });

        const now = new Date();
        const apptAlerts = [];
        const confirmAlerts = [];

        for (const app of applicants) {
            // STRICT ACCESS BUTTON CHECK:
            // Only process employees whose access button is ACTIVE (canLogin !== false).
            // If canLogin === false, the user access button is closed in Applicant Manager page,
            // which signifies the employee is not in system (resigned or terminated within 6 months of ADOJ).
            if (app.canLogin === false) {
                console.log(`[LIFECYCLE CRON] Skipping ${app.fullName} (${app.email}) - Access button is closed (resigned/terminated within 6 months).`);
                continue;
            }

            const adoj = parseDateRobust(app.actualJoiningDate);
            if (!adoj || isNaN(adoj.getTime())) continue;

            const diffTime = now.getTime() - adoj.getTime();
            if (diffTime < 0) continue; // Future joining date, skip
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Strict completed calendar months from ADOJ
            let completedMonths = (now.getFullYear() - adoj.getFullYear()) * 12 + (now.getMonth() - adoj.getMonth());
            if (now.getDate() < adoj.getDate()) {
                completedMonths--;
            }

            // 1. Appointment Letter Logic (Strictly 30+ days from ADOJ)
            // Automatically generates 5-page letter, sets tasks.appointmentLetter = true, saves to DB, increments counter, and emails Admin
            if (diffDays >= 30 && !app.apptLetterData) {
                try {
                    console.log(`[LIFECYCLE CRON] Auto-generating Appointment Letter for ${app.fullName} (${app.empCode || 'N/A'}) - Strictly completed ${diffDays} days.`);

                    const lhAsset = company.activeLetterheadId ? await Asset.findById(company.activeLetterheadId).lean() : null;
                    const stampAsset = company.activeStampId ? await Asset.findById(company.activeStampId).lean() : null;
                    const sigAsset = company.activeSignatureId ? await Asset.findById(company.activeSignatureId).lean() : null;

                    const lhData = lhAsset ? (lhAsset.data || `https://emyrishr.in/api/public/asset/${lhAsset._id || lhAsset.id}`) : null;
                    const stampData = stampAsset ? (stampAsset.data || `https://emyrishr.in/api/public/asset/${stampAsset._id || stampAsset.id}`) : null;
                    const sigData = sigAsset ? (sigAsset.data || `https://emyrishr.in/api/public/asset/${sigAsset._id || sigAsset.id}`) : null;

                    const officialHtml = buildOfficialLetterHtml({
                        applicant: app,
                        company,
                        letterType: 'appt',
                        lhData,
                        stampData,
                        sigData
                    });

                    const pdfBuffer = await generateAppointmentPdf({
                        applicant: app,
                        company,
                        letterType: 'appt',
                        letterData: officialHtml,
                        lhAsset,
                        stampAsset,
                        sigAsset
                    });

                    // Update Applicant record and toggle Pipeline Tracking switch
                    await Applicant.findOneAndUpdate(
                        { email: app.email },
                        {
                            $set: {
                                apptLetterData: officialHtml,
                                canLogin: true,
                                'tasks.appointmentLetter': true
                            },
                            $push: {
                                issuedLetters: {
                                    type: 'appt',
                                    data: officialHtml,
                                    issuedAt: new Date()
                                }
                            }
                        }
                    );

                    // Increment Company apptCounter
                    await Company.findOneAndUpdate({}, { $inc: { apptCounter: 1 } });
                    if (company.apptCounter) company.apptCounter++;

                    // Send candidate-addressed check-and-forward email to admin
                    const emailSubject = `Appointment Letter - ${app.fullName} (${app.empCode || 'N/A'}) - ${app.designation || 'Staff'} | ${company.name}`;
                    const emailBodyHtml = `
<div style="font-family: Arial, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #0284c7, #1e3a8a); padding: 22px 28px; text-align: left;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">${company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD'}</h2>
        <p style="color: #e0e7ff; margin: 4px 0 0 0; font-size: 13px;">Official Appointment Letter</p>
    </div>
    
    <div style="padding: 26px 28px;">
        <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${app.fullName}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
            Congratulations on your appointment with <strong>${company.name || 'Emyris Biolifesciences Pvt Ltd'}</strong>! We are pleased to formally issue your <strong>Appointment Letter</strong> for the position of <strong>${app.designation || 'Staff'}</strong>.
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 18px 0; border-radius: 4px; font-size: 13.5px; line-height: 1.6;">
            <strong>Employee Name:</strong> ${app.fullName}<br>
            <strong>Employee Code:</strong> ${app.empCode || 'N/A'}<br>
            <strong>Designation:</strong> ${app.designation || 'Staff'}<br>
            <strong>Division:</strong> ${app.division || 'CRITIZA'}<br>
            <strong>Headquarters:</strong> ${app.hq || 'N/A'}<br>
            <strong>Effective Date of Appointment:</strong> ${app.actualJoiningDate || app.adoj || app.joiningDate || 'As per letter'}
        </div>

        <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">
            Please find attached your official 5-page <strong>Appointment Letter</strong>, which includes:
        </p>
        <ul style="font-size: 13.5px; color: #475569; padding-left: 20px; margin-bottom: 16px; line-height: 1.6;">
            <li><b>Section 1 - 10:</b> Terms &amp; Conditions of Employment, Scale, and Probationary Period</li>
            <li><b>Section 11:</b> General Working Guidelines and Company Governance</li>
            <li><b>Section 12:</b> Employee Non-Disclosure Agreement (NDA)</li>
            <li><b>Annexure-I:</b> Detailed Monthly &amp; Annual Salary Structure Breakdown</li>
        </ul>

        <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
            Kindly review the document thoroughly, sign the duplicate copy along with the Non-Disclosure Agreement and Annexure-I, and return the signed scanned copies to HR Operations at <a href="mailto:hradmin@emyrishr.in" style="color: #0284c7; text-decoration: none; font-weight: bold;">hradmin@emyrishr.in</a> for our official records.
        </p>

        <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
            We welcome you to the Emyris family and wish you a successful and rewarding journey with us!
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">${company.signatoryName || 'HR Operations'}</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${company.signatoryDesignation || 'HR BUSINESS PARTNER'}</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: bold; color: #334155;">${company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD'}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
                Sumadhura Pragati Chambers, Park Ln, Kalasiguda, Secunderabad, Telangana - 500003<br>
                Email: hradmin@emyrishr.in | Web: www.emyrisbio.com | Toll Free: 1800 889 1217
            </p>
        </div>
    </div>
    
    <div style="background: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11.5px; color: #64748b; border-top: 1px solid #e2e8f0;">
        This is an official document from ${company.name || 'Emyris Biolifesciences Pvt Ltd'}. Confidentiality applies.
    </div>
</div>
`;

                    await sendEmail({
                        to: adminEmail,
                        subject: emailSubject,
                        html: emailBodyHtml,
                        attachments: [
                            {
                                filename: `Appointment_Letter_${app.empCode || 'EMP'}_${(app.fullName || 'Employee').replace(/\s+/g, '_')}.pdf`,
                                content: pdfBuffer,
                                contentType: 'application/pdf'
                            }
                        ]
                    });

                    if (XlNotification) {
                        await XlNotification.create({
                            employeeId: 'ADMIN',
                            title: `Appointment Letter Auto-Generated: ${app.fullName}`,
                            message: `Appointment Letter for ${app.fullName} (${app.empCode || 'N/A'}) was automatically generated (completed ${diffDays} days) and emailed to ${adminEmail} for check-and-forward. Pipeline tracking activated.`
                        }).catch(e => console.error('Lifecycle notif error:', e.message));
                    }

                    apptAlerts.push({
                        name: app.fullName,
                        email: app.email,
                        designation: app.designation || 'Staff',
                        hq: app.hq || 'N/A',
                        adoj: app.actualJoiningDate,
                        days: diffDays,
                        autoIssued: true
                    });
                } catch (genErr) {
                    console.error(`[LIFECYCLE CRON] Auto-generation error for ${app.email}:`, genErr);
                    apptAlerts.push({
                        name: app.fullName,
                        email: app.email,
                        designation: app.designation || 'Staff',
                        hq: app.hq || 'N/A',
                        adoj: app.actualJoiningDate,
                        days: diffDays,
                        error: genErr.message
                    });
                }
            }

            // 2. Probation to Confirmation (Review strictly at completed 5th month from ADOJ)
            if (completedMonths >= 5 && (!app.status || app.status.toLowerCase().includes('probation'))) {
                confirmAlerts.push({
                    name: app.fullName,
                    email: app.email,
                    designation: app.designation || 'Staff',
                    hq: app.hq || 'N/A',
                    adoj: app.actualJoiningDate,
                    months: completedMonths
                });

                if (XlNotification) {
                    await XlNotification.create({
                        employeeId: 'ADMIN',
                        title: `Confirmation Review Due (Strictly 5 Months): ${app.fullName}`,
                        message: `${app.fullName} (${app.designation || 'Staff'} - ${app.hq || 'N/A'}) has completed strictly ${completedMonths} months since joining on ${app.actualJoiningDate}. Please initiate confirmation or extension review.`
                    }).catch(e => console.error('Lifecycle notif error:', e.message));
                }
            }
        }

        if (apptAlerts.length > 0 || confirmAlerts.length > 0) {
            let emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 750px; margin: auto; padding: 20px; color: #334155;">
                    <div style="background: linear-gradient(135deg, #0ea5e9, #4f46e5); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                        <h2 style="margin: 0;">Employee Lifecycle Compliance Alert</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">${company.name}</p>
                    </div>
            `;

            if (apptAlerts.length > 0) {
                emailHtml += `
                    <h3 style="color: #0f172a; margin-top: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                        ⚠️ Appointment Letters Due (30+ Days Since Joining) - ${apptAlerts.length}
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f1f5f9; text-align: left;">
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Employee</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Designation / HQ</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">ADOJ</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Days Active</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${apptAlerts.map(a => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${a.name}</strong><br><span style="color:#64748b;font-size:11px;">${a.email}</span></td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.designation}<br><span style="color:#64748b;font-size:11px;">${a.hq}</span></td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${a.adoj}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">${a.days} days</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;"><a href="https://emyrishr.in/admin" style="color: #4f46e5; font-weight: 600;">Issue Letter</a></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            if (confirmAlerts.length > 0) {
                emailHtml += `
                    <h3 style="color: #0f172a; margin-top: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                        🔔 Confirmation / Probation Reviews Due (5+ Months) - ${confirmAlerts.length}
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f1f5f9; text-align: left;">
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Employee</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Designation / HQ</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">ADOJ</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Tenure</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${confirmAlerts.map(c => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${c.name}</strong><br><span style="color:#64748b;font-size:11px;">${c.email}</span></td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${c.designation}<br><span style="color:#64748b;font-size:11px;">${c.hq}</span></td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${c.adoj}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #7c3aed;">${c.months} months</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;"><a href="https://emyrishr.in/admin" style="color: #4f46e5; font-weight: 600;">Review Status</a></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            emailHtml += `
                    <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                        Automated Daily Lifecycle Compliance Notice · Emyris HRMS
                    </div>
                </div>
            `;

            await sendEmail({
                to: adminEmail,
                subject: `⚠️ Daily HR Action Required: ${apptAlerts.length} Appt Letter(s), ${confirmAlerts.length} Confirmation(s) Due`,
                html: emailHtml
            });
            console.log(`✅ Lifecycle alerts sent to admin: ${adminEmail}`);
        } else {
            console.log('ℹ️ No lifecycle alerts due today.');
        }

        return { success: true, apptCount: apptAlerts.length, confirmCount: confirmAlerts.length, apptAlerts, confirmAlerts };
    } catch (e) {
        console.error('Lifecycle cron error:', e);
        return { success: false, error: e.message };
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

    // Run daily at 8:15 AM IST for employee lifecycle compliance (30-day Appointment & 5-month Confirmation)
    cron.schedule('15 8 * * *', async () => {
        await runLifecycleCron();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Run every night at 11:55 PM IST for automated WebP map generation
    cron.schedule('55 23 * * *', async () => {
        try {
            const { runDailyArchiveForDate } = require('./geoStaticMap');
            await runDailyArchiveForDate();
        } catch (err) {
            console.error('Error in nightly geo-archive cron:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}

module.exports = { startCronJobs, runExamReminderCron, runBirthdayCron, runLifecycleCron };
