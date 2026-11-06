const PDFDocument = require('pdfkit');
const { fillLetterPlaceholders } = require('./letterUtils');

/**
 * Builds the exact 5-page official Appointment Letter HTML conforming to Setup & Letters,
 * complete with official letterhead, embedded digital signature, and circular digital stamp.
 */
function buildOfficialLetterHtml({ applicant, company, letterType, letterData, lhData, stampData, sigData }) {
    let rawHtml = letterData || company.apptLetterBody || '';
    rawHtml = rawHtml.replace(/<img[^>]+class="a4-branding-layer"[^>]*>/gi, '');
    rawHtml = rawHtml.replace(/\{\{COMPANY_NAME\}\}\s*Pvt\.\s*Ltd\./gi, '{{COMPANY_NAME}}');
    rawHtml = rawHtml.replace(/Dear\s*\{\{TITLE\}\}\.\./gi, 'Dear {{TITLE}}.');
    rawHtml = rawHtml.replace(/Dear\s*\{\{TITLE\}\}\./gi, 'Dear {{TITLE}}');

    const p1EndIdx = rawHtml.indexOf('{{SIGNATORY_DESG}}') + '{{SIGNATORY_DESG}}'.length;
    const p1CloseIdx = rawHtml.indexOf('</p>', p1EndIdx) + 4;

    const p2StartSearch = rawHtml.indexOf('Place of Work', p1CloseIdx);
    const p2StartIdx = p2StartSearch !== -1 ? rawHtml.lastIndexOf('<p', p2StartSearch) : p1CloseIdx;

    const p3StartSearch = rawHtml.indexOf('11. General', p2StartIdx);
    const p3StartIdx = p3StartSearch !== -1 ? rawHtml.lastIndexOf('<p', p3StartSearch) : rawHtml.indexOf('<p', rawHtml.indexOf('11.1', p2StartIdx));

    const p4StartSearch = rawHtml.indexOf('Employee Non-Disclosure Agreement', p3StartIdx);
    const p4StartIdx = p4StartSearch !== -1 ? rawHtml.lastIndexOf('<p', p4StartSearch) : p3StartIdx;

    const p5StartSearch = rawHtml.indexOf('Annexure-', p4StartIdx);
    const p5StartIdx = p5StartSearch !== -1 ? rawHtml.lastIndexOf('<p', p5StartSearch) : p4StartIdx;

    let sec1 = rawHtml.substring(0, p1CloseIdx);
    let sec2 = rawHtml.substring(p2StartIdx, p3StartIdx);
    let sec3 = rawHtml.substring(p3StartIdx, p4StartIdx);
    let sec4 = rawHtml.substring(p4StartIdx, p5StartIdx);
    let sec5 = rawHtml.substring(p5StartIdx);

    function cleanSection(html) {
        html = html.replace(/<v:shapetype[\s\S]*?<\/v:shape>/gi, '');
        html = html.replace(/<v:shape[\s\S]*?<\/v:shape>/gi, '');
        html = html.replace(/<o:p><\/o:p>/gi, '');
        html = html.replace(/(<p[^>]*>(\s*<[^>]+>)*\s*(<br\/?>|&nbsp;|\s)*\s*(<\/[^>]+>)*<\/p>\s*){2,}/gi, '');
        return html.trim();
    }

    sec1 = cleanSection(sec1).replace(/^(<div[^>]*><b><span[^>]*><br><\/span><\/b><\/div>\s*)+/i, '');
    sec2 = cleanSection(sec2);
    sec3 = cleanSection(sec3);
    sec4 = cleanSection(sec4);
    sec5 = cleanSection(sec5);

    if (sigData && stampData) {
        const sigStampHtml = `
<div style="position: relative; height: 75px; margin: 6px 0 2px 0;">
  <img src="${sigData}" style="position: absolute; left: 0px; top: 10px; height: 46px; z-index: 2; mix-blend-mode: multiply;" alt="Signature" />
  <img src="${stampData}" style="position: absolute; left: 65px; top: 0px; height: 70px; opacity: 0.95; z-index: 1;" alt="Digital Stamp" />
</div>
`;
        sec1 = sec1.replace(/(<p[^>]*>\s*<b[^>]*>{{SIGNATORY_NAME}}<\/b>)/i, `${sigStampHtml}$1`);
    }

    sec1 = fillLetterPlaceholders(sec1, applicant, company);
    sec2 = fillLetterPlaceholders(sec2, applicant, company);
    sec3 = fillLetterPlaceholders(sec3, applicant, company);
    sec4 = fillLetterPlaceholders(sec4, applicant, company);
    sec5 = fillLetterPlaceholders(sec5, applicant, company);

    const pages = [sec1, sec2, sec3, sec4, sec5].map(s => s.replace(/MR\.\./g, 'MR.').replace(/MS\.\./g, 'MS.'));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Appointment Letter - ${applicant.fullName}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: white;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    }
    .a4-page {
      position: relative; width: 210mm; height: 297mm;
      page-break-after: always; break-after: page;
      overflow: hidden; background: white;
    }
    .a4-letterhead-bg {
      position: absolute; top: 0; left: 0; width: 210mm; height: 297mm;
      z-index: 0; pointer-events: none;
    }
    .a4-content {
      position: relative; z-index: 1; padding: 35mm 18mm 22mm 18mm;
      font-size: 9.7pt; line-height: 1.30; color: #111;
    }
    p { margin-top: 0; margin-bottom: 2px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { font-size: 9pt; padding: 4px 6px; }
  </style>
</head>
<body>
  ${pages.map(p => `
  <div class="a4-page">
    ${lhData ? `<img src="${lhData}" class="a4-letterhead-bg" alt="Letterhead" />` : ''}
    <div class="a4-content">${p}</div>
  </div>
  `).join('\n')}
</body>
</html>`;
}

function generateAppointmentPdf({ applicant, company = {}, letterType = 'appt', letterData = '', lhAsset = null, stampAsset = null, sigAsset = null }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 110, bottom: 65, left: 50, right: 50 },
                autoFirstPage: true
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            let lhBuf = null;
            if (lhAsset && lhAsset.data) {
                const b64 = lhAsset.data.includes('base64,') ? lhAsset.data.split('base64,')[1] : lhAsset.data;
                try { lhBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let stampBuf = null;
            if (stampAsset && stampAsset.data) {
                const b64 = stampAsset.data.includes('base64,') ? stampAsset.data.split('base64,')[1] : stampAsset.data;
                try { stampBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let sigBuf = null;
            if (sigAsset && sigAsset.data) {
                const b64 = sigAsset.data.includes('base64,') ? sigAsset.data.split('base64,')[1] : sigAsset.data;
                try { sigBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }

            const drawBackground = () => {
                if (lhBuf) {
                    try {
                        doc.image(lhBuf, 0, 0, { width: 595.28, height: 841.89 });
                    } catch (e) {}
                }
            };

            // PAGE 1
            drawBackground();
            doc.y = 115;
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text(`Ref: APNT/EMY/${company.apptCounter || '1027'}`, { align: 'right' });
            doc.text(`Date : ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`, { align: 'right' });
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').fontSize(10);
            doc.text('Employee Name: ', 50, doc.y, { continued: true }).text(`MR. ${(applicant.fullName || '').toUpperCase()}`);
            doc.text('Emp Code: ', 50, doc.y, { continued: true }).text(`${applicant.empCode || 'N/A'}`);
            doc.text('Division: ', 50, doc.y, { continued: true }).text(`${applicant.division || 'CRITIZA'}`);
            doc.text('HQ: ', 50, doc.y, { continued: true }).text(`${applicant.hq || 'N/A'}`);
            doc.moveDown(0.8);

            doc.text(`Dear ${(applicant.fullName || '').toUpperCase()},`);
            doc.moveDown(0.6);

            doc.font('Helvetica-Bold').text('Sub: Letter of Appointment');
            doc.moveDown(0.6);

            doc.font('Helvetica').fontSize(9.5).text(
                `With reference to your application and subsequent interview you had with us, the Management is pleased to appoint you as ${applicant.designation || 'Staff'} in our Organization with effect from ${applicant.actualJoiningDate || applicant.adoj || 'the date of joining'}.`,
                { align: 'justify', lineGap: 3 }
            );
            doc.moveDown(0.6);
            doc.text(
                `We welcome you to ${company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD'} and look forward to a long and mutually beneficial association.`,
                { align: 'justify', lineGap: 3 }
            );
            doc.moveDown(0.8);

            doc.font('Helvetica-Bold').text('1. Terms of Appointment:');
            doc.font('Helvetica').text(
                `Your appointment will be governed by the standard terms and conditions of employment of the Company as detailed in this letter, Section 11, Section 12 (Non-Disclosure Agreement), and Annexure-I (Salary Structure Breakdown).`,
                { align: 'justify', lineGap: 3 }
            );
            doc.moveDown(1.5);

            const sigY = doc.y;
            if (sigBuf) {
                try { doc.image(sigBuf, 50, sigY, { height: 42 }); } catch(e){}
            }
            if (stampBuf) {
                try { doc.image(stampBuf, 115, sigY - 8, { height: 58 }); } catch(e){}
            }

            doc.y = sigY + 48;
            doc.font('Helvetica-Bold').fontSize(10).text(company.signatoryName || 'HR DEPT');
            doc.font('Helvetica').fontSize(9).text(company.signatoryDesignation || 'HR BUSINESS PARTNER');
            doc.font('Helvetica-Bold').fontSize(9).text(company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD');

            // PAGE 2
            doc.addPage({ size: 'A4', margins: { top: 110, bottom: 65, left: 50, right: 50 } });
            drawBackground();
            doc.y = 110;
            doc.font('Helvetica-Bold').fontSize(10.5).text('TERMS & CONDITIONS OF EMPLOYMENT', { align: 'center' });
            doc.moveDown(0.8);

            const clausesP2 = [
                { title: '2. Place of Work & Transferability:', text: `You will be initially posted at ${applicant.hq || 'HQ'}. However, the Company reserves the right to transfer you to any other location, branch, department, subsidiary, or affiliate of the Company anywhere in India.` },
                { title: '3. Emoluments & Compensation:', text: `Your remuneration package will be as detailed in Annexure-I attached hereto. The compensation will be subject to deduction of applicable statutory taxes and provident fund as per prevailing laws.` },
                { title: '4. Probation & Confirmation:', text: `You will be on probation for an initial period of 6 (six) months from your date of joining. Upon satisfactory performance, your services will be confirmed in writing. Unless confirmed in writing, the probationary period shall be deemed extended.` },
                { title: '5. Working Hours & Duties:', text: `You will devote your whole time and attention exclusively to the business of the Company and will perform your duties diligently and faithfully according to instructions.` },
                { title: '6. Termination of Employment:', text: `During probation, either party may terminate this agreement by giving 30 days written notice or salary in lieu thereof. Upon confirmation, the notice period shall be 60 days.` },
                { title: '7. Retirement Age:', text: `The normal age of superannuation/retirement from the services of the Company is 58 years.` },
                { title: '8. Governing Law & Jurisdiction:', text: `This appointment letter shall be governed by and construed in accordance with the laws of India, and courts at Hyderabad/Secunderabad shall have exclusive jurisdiction.` }
            ];

            clausesP2.forEach(c => {
                doc.font('Helvetica-Bold').fontSize(9).text(c.title);
                doc.font('Helvetica').fontSize(8.5).text(c.text, { align: 'justify', lineGap: 2 });
                doc.moveDown(0.5);
            });

            // PAGE 3
            doc.addPage({ size: 'A4', margins: { top: 110, bottom: 65, left: 50, right: 50 } });
            drawBackground();
            doc.y = 110;
            doc.font('Helvetica-Bold').fontSize(10.5).text('11. GENERAL WORKING GUIDELINES & CODE OF CONDUCT', { align: 'center' });
            doc.moveDown(0.8);

            const clausesP3 = [
                { title: '11.1 Work Ethics & Professional Standards:', text: `Employees are expected to maintain the highest standards of integrity, professional honesty, and ethical conduct in all dealings with clients, doctors, retailers, and company stakeholders.` },
                { title: '11.2 Attendance & Reporting Discipline:', text: `Daily field reporting and attendance must be logged through the designated company mobile portal / CRM before the specified daily cut-off time. Unexcused absence will result in loss of pay.` },
                { title: '11.3 Leave Policy:', text: `Leave entitlements are governed by Company Leave Rules. Prior written approval from the Reporting Manager is mandatory before proceeding on leave.` },
                { title: '11.4 Company Assets & Inventory Security:', text: `Any company equipment, detailing aids, promotional samples, or IT devices provided for duty must be handled with utmost care and returned immediately upon cessation of employment.` },
                { title: '11.5 Conflict of Interest:', text: `You will not engage directly or indirectly in any other business, trade, employment, or commercial activity while in the employment of the Company without prior written permission.` }
            ];

            clausesP3.forEach(c => {
                doc.font('Helvetica-Bold').fontSize(9).text(c.title);
                doc.font('Helvetica').fontSize(8.5).text(c.text, { align: 'justify', lineGap: 2 });
                doc.moveDown(0.6);
            });

            // PAGE 4
            doc.addPage({ size: 'A4', margins: { top: 110, bottom: 65, left: 50, right: 50 } });
            drawBackground();
            doc.y = 110;
            doc.font('Helvetica-Bold').fontSize(10.5).text('12. EMPLOYEE NON-DISCLOSURE AGREEMENT (NDA)', { align: 'center' });
            doc.moveDown(0.8);

            const clausesP4 = [
                { title: '12.1 Definition of Proprietary Information:', text: `Confidential Information includes all proprietary formulas, customer lists, distributor contacts, commercial strategies, pricing, product formulations, financial data, and technical processes of EMYRIS BIOLIFESCIENCES.` },
                { title: '12.2 Duty of Confidentiality:', text: `During your employment and indefinitely after termination, you agree not to divulge, publish, disclose, or use for personal gain any Confidential Information belonging to the Company.` },
                { title: '12.3 Intellectual Property Rights:', text: `All intellectual property, innovations, designs, marketing strategies, and materials created during the course of employment shall be the sole and exclusive property of the Company.` },
                { title: '12.4 Non-Solicitation Obligation:', text: `For a period of 12 months following termination, you agree not to solicit or recruit any employee, representative, or client of the Company.` },
                { title: '12.5 Remedies for Breach:', text: `Breach of this confidentiality undertaking will entitle the Company to seek injunctive relief as well as damages and initiate disciplinary/legal proceedings.` }
            ];

            clausesP4.forEach(c => {
                doc.font('Helvetica-Bold').fontSize(9).text(c.title);
                doc.font('Helvetica').fontSize(8.5).text(c.text, { align: 'justify', lineGap: 2 });
                doc.moveDown(0.6);
            });

            doc.moveDown(1.5);
            doc.font('Helvetica-Bold').fontSize(9).text('ACCEPTED AND AGREED:');
            doc.moveDown(1.8);
            doc.font('Helvetica').fontSize(8.5).text('Candidate Signature: _______________________      Date: ____________');
            doc.text(`Name: ${applicant.fullName || ''}`);

            // PAGE 5
            doc.addPage({ size: 'A4', margins: { top: 110, bottom: 65, left: 50, right: 50 } });
            drawBackground();
            doc.y = 110;
            doc.font('Helvetica-Bold').fontSize(11).text('ANNEXURE - I : SALARY STRUCTURE BREAKDOWN', { align: 'center' });
            doc.moveDown(0.5);

            const sb = applicant.salaryBreakup || {};
            const basic = Number(sb.basic || 0);
            const hra = Number(sb.hra || 0);
            const lta = Number(sb.lta || 0);
            const conv = Number(sb.conveyance || 0);
            const med = Number(sb.medical || 0);
            const special = Number(sb.special || 0);
            const edu = Number(sb.edu || 0);
            const grossMonthly = basic + hra + lta + conv + med + special + edu;
            const grossAnnual = grossMonthly * 12;

            doc.font('Helvetica-Bold').fontSize(9);
            doc.text(`Employee Name : ${applicant.fullName}`, 50, doc.y);
            doc.text(`Designation   : ${applicant.designation || 'Staff'}`, 50, doc.y);
            doc.text(`Headquarters  : ${applicant.hq || 'N/A'}`, 50, doc.y);
            doc.moveDown(0.8);

            const startX = 50;
            const colWidths = [220, 130, 140];
            let curY = doc.y;

            doc.rect(startX, curY, 490, 20).fill('#f1f5f9');
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
            doc.text('Salary Component', startX + 10, curY + 5);
            doc.text('Monthly (Rs.)', startX + colWidths[0] + 10, curY + 5);
            doc.text('Annual (Rs.)', startX + colWidths[0] + colWidths[1] + 10, curY + 5);
            curY += 20;

            const items = [
                ['Basic Salary', basic, basic * 12],
                ['House Rent Allowance (HRA)', hra, hra * 12],
                ['Leave Travel Allowance (LTA)', lta, lta * 12],
                ['Conveyance Allowance', conv, conv * 12],
                ['Medical Reimbursement', med, med * 12],
                ['Special Allowance', special, special * 12],
                ['Education Allowance', edu, edu * 12]
            ];

            doc.font('Helvetica').fontSize(8.5);
            items.forEach((item, idx) => {
                if (idx % 2 === 1) {
                    doc.rect(startX, curY, 490, 18).fill('#fafafa');
                }
                doc.fillColor('#1e293b');
                doc.text(item[0], startX + 10, curY + 4);
                doc.text(item[1].toLocaleString('en-IN'), startX + colWidths[0] + 10, curY + 4);
                doc.text(item[2].toLocaleString('en-IN'), startX + colWidths[0] + colWidths[1] + 10, curY + 4);
                curY += 18;
            });

            doc.rect(startX, curY, 490, 22).fill('#e2e8f0');
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5);
            doc.text('Total Cost to Company (Gross CTC)', startX + 10, curY + 5);
            doc.text('Rs. ' + grossMonthly.toLocaleString('en-IN'), startX + colWidths[0] + 10, curY + 5);
            doc.text('Rs. ' + grossAnnual.toLocaleString('en-IN'), startX + colWidths[0] + colWidths[1] + 10, curY + 5);
            curY += 30;

            doc.fillColor('#1e293b').font('Helvetica').fontSize(8);
            doc.text('* Note: Statutory deductions including Professional Tax (PT), Provident Fund (PF), and TDS will be deducted as applicable per government statutory norms.', startX, curY, { width: 490, lineGap: 2 });
            curY += 35;

            doc.font('Helvetica-Bold').fontSize(8.5);
            doc.text(`For ${company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD'}`, startX, curY);
            doc.text('Employee Signature: __________________', startX + 260, curY);
            curY += 35;
            doc.text(company.signatoryName || 'HR DEPT', startX, curY);
            doc.font('Helvetica').fontSize(8).text(company.signatoryDesignation || 'HR BUSINESS PARTNER', startX, curY + 12);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

function generateConfirmationPdf({ applicant, company = {}, docDate = null, lhAsset = null, stampAsset = null, sigAsset = null, letterData = '' }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 125, bottom: 65, left: 50, right: 50 },
                autoFirstPage: true
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            let lhBuf = null;
            if (lhAsset && lhAsset.data) {
                const b64 = lhAsset.data.includes('base64,') ? lhAsset.data.split('base64,')[1] : lhAsset.data;
                try { lhBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let stampBuf = null;
            if (stampAsset && stampAsset.data) {
                const b64 = stampAsset.data.includes('base64,') ? stampAsset.data.split('base64,')[1] : stampAsset.data;
                try { stampBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let sigBuf = null;
            if (sigAsset && sigAsset.data) {
                const b64 = sigAsset.data.includes('base64,') ? sigAsset.data.split('base64,')[1] : sigAsset.data;
                try { sigBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }

            // Draw full-bleed Letterhead Background
            if (lhBuf) {
                try {
                    doc.image(lhBuf, 0, 0, { width: 595.28, height: 841.89 });
                } catch (e) {}
            }

            const appObj = applicant.toJSON ? applicant.toJSON() : applicant;
            const finalDoc = docDate || appObj.doc || appObj.confirmationDate || appObj.confirmationData?.doc || new Date();
            const applicantWithDoc = {
                ...appObj,
                doc: finalDoc,
                confirmationDate: finalDoc
            };

            const miscCounter = company.miscCounter || 1010;
            const todayFormatted = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            const { formatDateDMY } = require('./letterUtils');
            const docFormatted = formatDateDMY(finalDoc);

            let rawHtml = letterData || company.confirmLetterBody || '';
            rawHtml = rawHtml.replace(/<img[^>]*class="a4-branding-layer"[^>]*>/gi, '');
            rawHtml = fillLetterPlaceholders(rawHtml, applicantWithDoc, company);

            // Cleanly extract text paragraphs from the HTML template
            let cleanText = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
            cleanText = cleanText.replace(/<\/(p|div|h[1-6])>/gi, '\n\n');
            cleanText = cleanText.replace(/<[^>]+>/g, '');
            cleanText = cleanText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            cleanText = cleanText.replace(/MR\.\./gi, 'Mr.').replace(/MS\.\./gi, 'Ms.');
            
            const rawParas = cleanText.split(/\n{2,}/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

            // Leave comfortable lines from letterhead top banner (~125pt) so content is vertically balanced between header and footer
            doc.y = 195;

            // Separate header metadata, body paragraphs, and closings
            let hasDrawnRef = false;
            let hasDrawnDate = false;
            let hasDrawnSub = false;
            let hasDrawnSalutation = false;
            const bodyParas = [];
            let closingStarted = false;

            for (const p of rawParas) {
                if (/^Ref\s*No/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(p, 55, doc.y);
                    hasDrawnRef = true;
                } else if (/^Date\s*:/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnDate = true;
                } else if (/^SUB\s*:/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnSub = true;
                } else if (/^Dear\s+/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnSalutation = true;
                } else if (/^(With best regards|Sincerely|Regards|Yours sincerely|HR DEPT|HR BUSINESS)/i.test(p)) {
                    closingStarted = true;
                } else if (!closingStarted) {
                    bodyParas.push(p);
                }
            }

            // Fallback for header items if template format varied
            if (!hasDrawnRef) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(`Ref No : Conf/${miscCounter}`, 55, doc.y);
            }
            if (!hasDrawnDate) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(`Date   : ${todayFormatted}`, 55, doc.y);
                doc.moveDown(0.85);
            }
            if (!hasDrawnSub) {
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a').text('SUB : "Confirmation Notification"', 55, doc.y);
                doc.moveDown(0.85);
            }
            if (!hasDrawnSalutation) {
                const titleStr = (applicantWithDoc.title || 'Mr.').toUpperCase();
                const nameStr = (applicantWithDoc.fullName || '').toUpperCase();
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(`Dear ${titleStr} ${nameStr}`, 55, doc.y);
                doc.moveDown(0.85);
            }

            // Render body paragraphs with uniform typography and elegant line spacing
            doc.font('Helvetica').fontSize(10).fillColor('#1e293b').lineGap(4.2);
            for (const para of bodyParas) {
                doc.text(para, 55, doc.y, { width: 485, align: 'justify' });
                doc.moveDown(0.85);
            }

            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b');
            doc.text('With best regards,', 55, doc.y);
            doc.moveDown(0.3);
            doc.text('Sincerely,', 55, doc.y);
            doc.moveDown(0.5);

            // Embed Digital Signature & Stamp
            const sigY = doc.y;
            if (sigBuf) {
                try {
                    doc.image(sigBuf, 55, sigY, { height: 44 });
                } catch (e) {}
            }
            if (stampBuf) {
                try {
                    doc.image(stampBuf, 120, sigY - 8, { height: 62 });
                } catch (e) {}
            }

            doc.y = sigY + 48;
            doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(company.signatoryName || 'HR DEPT', 55, doc.y);
            doc.font('Helvetica').fontSize(9).fillColor('#475569').text(company.signatoryDesignation || 'HR BUSINESS PARTNER', 55, doc.y);
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD', 55, doc.y);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

function generateConfirmationDelayedPdf({ applicant, company = {}, cdDate = null, lhAsset = null, stampAsset = null, sigAsset = null, letterData = '' }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 125, bottom: 65, left: 50, right: 50 },
                autoFirstPage: true
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            let lhBuf = null;
            if (lhAsset && lhAsset.data) {
                const b64 = lhAsset.data.includes('base64,') ? lhAsset.data.split('base64,')[1] : lhAsset.data;
                try { lhBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let stampBuf = null;
            if (stampAsset && stampAsset.data) {
                const b64 = stampAsset.data.includes('base64,') ? stampAsset.data.split('base64,')[1] : stampAsset.data;
                try { stampBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }
            let sigBuf = null;
            if (sigAsset && sigAsset.data) {
                const b64 = sigAsset.data.includes('base64,') ? sigAsset.data.split('base64,')[1] : sigAsset.data;
                try { sigBuf = Buffer.from(b64, 'base64'); } catch (e) {}
            }

            // Draw full-bleed Letterhead Background
            if (lhBuf) {
                try {
                    doc.image(lhBuf, 0, 0, { width: 595.28, height: 841.89 });
                } catch (e) {}
            }

            const appObj = applicant.toJSON ? applicant.toJSON() : applicant;
            const finalCdDate = cdDate || appObj.extendedAt || appObj.cdDate || appObj.confirmationData?.extendedAt || new Date();
            const applicantWithCd = {
                ...appObj,
                cdDate: finalCdDate,
                extendedAt: finalCdDate
            };

            const miscCounter = company.miscCounter || 1010;
            const todayFormatted = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            let rawHtml = letterData || company.confirmDelayedLetterBody || '';
            rawHtml = rawHtml.replace(/<img[^>]*class="a4-branding-layer"[^>]*>/gi, '');
            rawHtml = fillLetterPlaceholders(rawHtml, applicantWithCd, company);

            // Cleanly extract text paragraphs from the HTML template
            let cleanText = rawHtml.replace(/<br\s*[\/]?>/gi, '\n');
            cleanText = cleanText.replace(/<\/(p|div|h[1-6])>/gi, '\n\n');
            cleanText = cleanText.replace(/<[^>]+>/g, '');
            cleanText = cleanText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            cleanText = cleanText.replace(/MR\.\./gi, 'Mr.').replace(/MS\.\./gi, 'Ms.');
            
            const rawParas = cleanText.split(/\n{2,}/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

            // Leave comfortable lines from letterhead top banner (~125pt) so content is vertically balanced between header and footer
            doc.y = 195;

            // Separate header metadata, body paragraphs, and closings
            let hasDrawnRef = false;
            let hasDrawnDate = false;
            let hasDrawnSub = false;
            let hasDrawnSalutation = false;
            const bodyParas = [];
            let closingStarted = false;

            for (const p of rawParas) {
                if (/^Ref\s*No/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(p, 55, doc.y);
                    hasDrawnRef = true;
                } else if (/^Date\s*:/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnDate = true;
                } else if (/^SUB\s*:/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnSub = true;
                } else if (/^Dear\s+/i.test(p)) {
                    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(p, 55, doc.y);
                    doc.moveDown(0.85);
                    hasDrawnSalutation = true;
                } else if (/^(With best regards|Sincerely|Regards|Yours sincerely|HR DEPT|HR BUSINESS)/i.test(p)) {
                    closingStarted = true;
                } else if (!closingStarted) {
                    bodyParas.push(p);
                }
            }

            // Fallback for header items if template format varied
            if (!hasDrawnRef) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(`Ref No : Prob/${miscCounter}`, 55, doc.y);
            }
            if (!hasDrawnDate) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text(`Date   : ${todayFormatted}`, 55, doc.y);
                doc.moveDown(0.85);
            }
            if (!hasDrawnSub) {
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a').text('SUB : "Delayed Confirmation Notification"', 55, doc.y);
                doc.moveDown(0.85);
            }
            if (!hasDrawnSalutation) {
                const titleStr = (applicantWithCd.title || 'Mr.').toUpperCase();
                const nameStr = (applicantWithCd.fullName || '').toUpperCase();
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(`Dear ${titleStr} ${nameStr}`, 55, doc.y);
                doc.moveDown(0.85);
            }

            // Render body paragraphs with uniform typography and elegant line spacing
            doc.font('Helvetica').fontSize(10).fillColor('#1e293b').lineGap(4.2);
            for (const para of bodyParas) {
                doc.text(para, 55, doc.y, { width: 485, align: 'justify' });
                doc.moveDown(0.85);
            }

            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b');
            doc.text('With best regards,', 55, doc.y);
            doc.moveDown(0.3);
            doc.text('Sincerely,', 55, doc.y);
            doc.moveDown(0.5);

            // Embed Digital Signature & Stamp
            const sigY = doc.y;
            if (sigBuf) {
                try {
                    doc.image(sigBuf, 55, sigY, { height: 44 });
                } catch (e) {}
            }
            if (stampBuf) {
                try {
                    doc.image(stampBuf, 120, sigY - 8, { height: 62 });
                } catch (e) {}
            }

            doc.y = sigY + 48;
            doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1e293b').text(company.signatoryName || 'HR DEPT', 55, doc.y);
            doc.font('Helvetica').fontSize(9).fillColor('#475569').text(company.signatoryDesignation || 'HR BUSINESS PARTNER', 55, doc.y);
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD', 55, doc.y);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    buildOfficialLetterHtml,
    generateAppointmentPdf,
    generateConfirmationPdf,
    generateConfirmationDelayedPdf
};
