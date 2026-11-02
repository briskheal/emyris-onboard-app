const PDFDocument = require('pdfkit');

function generateAppointmentPdf({ applicant, company = {}, letterType = 'appt', letterData = '' }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 45, right: 45 }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            const isAppt = letterType === 'appt';
            const letterLabel = isAppt ? 'LETTER OF APPOINTMENT' : (letterType === 'offer' ? 'OFFER OF EMPLOYMENT' : 'OFFICIAL APPOINTMENT LETTER');

            // 1. Company Header
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e293b').text(company.name || 'EMYRIS BIOLIFESCIENCES PVT. LTD.', { align: 'center' });
            doc.moveDown(0.2);
            doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(company.address || 'Corporate Office, Vadodara, Gujarat', { align: 'center' });
            doc.moveDown(0.2);
            doc.text(`Phone: ${company.phone || '7993163300'} | Email: ${company.email || 'hradmin@emyrishr.in'} | Website: ${company.website || 'www.emyrisbio.com'}`, { align: 'center' });
            doc.moveDown(0.5);

            // Divider Line
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.8);

            // 2. Ref No and Date
            const curY = doc.y;
            const prefix = isAppt ? 'APNT/EMY' : 'OFR/EMY';
            const counter = isAppt ? (company.apptCounter || 1016) : (company.offerCounter || 1001);
            const refNo = `Ref: ${prefix}/${counter}`;
            const dateStr = `Date: ${new Date().toLocaleDateString('en-GB')}`;
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(refNo, 45, curY);
            doc.text(dateStr, 400, curY, { align: 'right', width: 150 });
            doc.moveDown(1.2);

            // 3. Recipient
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('To,');
            doc.text(`${applicant.title || 'Mr.'} ${applicant.fullName || ''}`);
            doc.font('Helvetica').fillColor('#334155');
            if (applicant.address) doc.text(applicant.address);
            if (applicant.state || applicant.pin || applicant.pincode) {
                doc.text(`${applicant.state || ''} - ${applicant.pincode || applicant.pin || ''}`);
            }
            if (applicant.phone) doc.text(`Contact: ${applicant.phone}`);
            doc.moveDown(0.8);

            // 4. Subject
            doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#1e293b').text(`SUBJECT: ${letterLabel}`, { align: 'center', underline: true });
            doc.moveDown(0.8);

            // 5. Body Text
            doc.fontSize(9.5).font('Helvetica').fillColor('#334155');
            doc.text(`Dear ${applicant.fullName},`);
            doc.moveDown(0.5);
            doc.text(`With reference to your application and subsequent interview with us, we are pleased to appoint you as `, { continued: true });
            doc.font('Helvetica-Bold').text(`${(applicant.designation || 'Staff').toUpperCase()}`, { continued: true });
            doc.font('Helvetica').text(` in our `, { continued: true });
            doc.font('Helvetica-Bold').text(`${(applicant.division || 'CRITIZA').toUpperCase()}`, { continued: true });
            doc.font('Helvetica').text(` Division, based at `, { continued: true });
            doc.font('Helvetica-Bold').text(`${(applicant.hq || 'Vadodara').toUpperCase()}`, { continued: true });
            doc.font('Helvetica').text(`, effective from your confirmed date of joining `, { continued: true });
            doc.font('Helvetica-Bold').text(`${applicant.actualJoiningDate || '01-10-2026'}.`);
            doc.moveDown(0.8);

            doc.font('Helvetica').text(`You will be reporting directly to `, { continued: true });
            doc.font('Helvetica-Bold').text(`${(applicant.reportingTo || 'Management').toUpperCase()}.`);
            doc.moveDown(0.8);

            // 6. Compensation Section
            const sal = applicant.salaryBreakup || {};
            const annualCtc = Number(applicant.salary || 1080000);
            doc.font('Helvetica').text('1. Compensation & Benefits Structure:', { underline: true });
            doc.text(`Your Annual Gross Cost to Company (CTC) will be Rs. ${annualCtc.toLocaleString('en-IN')}/- as per the earnings structure enclosed below:`);
            doc.moveDown(0.5);

            // Salary Breakup Table
            const tableTop = doc.y;
            const col1 = 45, col2 = 270, col3 = 410, tableW = 505;

            // Table Header
            doc.rect(col1, tableTop, tableW, 18).fillAndStroke('#f1f5f9', '#94a3b8');
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a');
            doc.text('Earnings Components', col1 + 8, tableTop + 5);
            doc.text('Monthly (Rs.)', col2, tableTop + 5, { width: 130, align: 'right' });
            doc.text('Annual (Rs.)', col3, tableTop + 5, { width: 130, align: 'right' });

            const items = [
                ['Basic Salary', sal.basic || Math.round(annualCtc * 0.5 / 12)],
                ['House Rent Allowance (HRA)', sal.hra || Math.round(annualCtc * 0.2 / 12)],
                ['Leave Travel Allowance (LTA)', sal.lta || 0],
                ['Conveyance Allowance', sal.conveyance || 0],
                ['Medical Allowance', sal.medical || 0],
                ['Special Allowance', sal.special || 0],
                ['Education Allowance', sal.edu || 0],
                ['Fixed Allowance', sal.fixed || 0]
            ];

            let rowY = tableTop + 18;
            doc.font('Helvetica').fillColor('#334155');
            let totalMonthly = 0;

            for (const [label, val] of items) {
                const mVal = Number(val) || 0;
                if (mVal === 0 && !['Basic Salary', 'House Rent Allowance (HRA)'].includes(label)) continue;
                totalMonthly += mVal;
                doc.rect(col1, rowY, tableW, 16).stroke('#cbd5e1');
                doc.text(label, col1 + 8, rowY + 4);
                doc.text(mVal.toLocaleString('en-IN'), col2, rowY + 4, { width: 130, align: 'right' });
                doc.text((mVal * 12).toLocaleString('en-IN'), col3, rowY + 4, { width: 130, align: 'right' });
                rowY += 16;
            }

            // Total row
            const totalAnnual = totalMonthly * 12;
            doc.rect(col1, rowY, tableW, 18).fillAndStroke('#e2e8f0', '#94a3b8');
            doc.font('Helvetica-Bold').fillColor('#0f172a');
            doc.text('Gross Total CTC', col1 + 8, rowY + 5);
            doc.text(totalMonthly.toLocaleString('en-IN'), col2, rowY + 5, { width: 130, align: 'right' });
            doc.text(totalAnnual.toLocaleString('en-IN'), col3, rowY + 5, { width: 130, align: 'right' });

            doc.y = rowY + 28;

            // 7. Terms & Conditions
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text('2. Probation & Confirmation:');
            doc.font('Helvetica').fillColor('#334155').text('You will be on probation for an initial period of six months from your date of joining. Subject to satisfactory performance and successful completion of probation, your appointment will be confirmed in writing.');
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').fillColor('#1e293b').text('3. Code of Conduct & Operational Guidelines:');
            doc.font('Helvetica').fillColor('#334155').text('You shall devote your whole time and attention to the business of the Company and maintain strict confidentiality regarding all official information, client records, and proprietary operational procedures.');
            doc.moveDown(1.2);

            // 8. Signatures
            doc.font('Helvetica-Bold').fillColor('#0f172a').text(`For ${company.name || 'EMYRIS BIOLIFESCIENCES PVT. LTD.'}`);
            doc.moveDown(1.8);
            doc.text(company.signatoryName || 'HR DEPT');
            doc.font('Helvetica').fillColor('#64748b').text(company.signatoryDesignation || 'HR BUSINESS PARTNER');

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateAppointmentPdf };
