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

function generateAppointmentPdf({ applicant, company = {}, letterType = 'appt', letterData = '' }) {
    // If pdfkit fallback is used:
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fontSize(16).font('Helvetica-Bold').text(company.name || 'EMYRIS BIOLIFESCIENCES PVT LTD', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`Official Appointment Letter for ${applicant.fullName}`, { align: 'center' });
        doc.end();
    });
}

module.exports = {
    buildOfficialLetterHtml,
    generateAppointmentPdf
};
