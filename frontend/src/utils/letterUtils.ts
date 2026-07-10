export function safeParseDate(dateStr: any) {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

export function formatDateDMY(dateStr: any) {
    const d = safeParseDate(dateStr);
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

export function numberToWords(num: number | string) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    let nStr = num.toString();
    if (nStr.length > 9) return 'Overflow';
    let match = ('000000000' + nStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return ''; 
    let str = '';
    str += (Number(match[1]) != 0) ? (a[Number(match[1])] || b[match[1][0] as any] + ' ' + a[match[1][1] as any]) + 'Crore ' : '';
    str += (Number(match[2]) != 0) ? (a[Number(match[2])] || b[match[2][0] as any] + ' ' + a[match[2][1] as any]) + 'Lakh ' : '';
    str += (Number(match[3]) != 0) ? (a[Number(match[3])] || b[match[3][0] as any] + ' ' + a[match[3][1] as any]) + 'Thousand ' : '';
    str += (Number(match[4]) != 0) ? (a[Number(match[4])] || b[match[4][0] as any] + ' ' + a[match[4][1] as any]) + 'Hundred ' : '';
    str += (Number(match[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0] as any] + ' ' + a[match[5][1] as any]) : '';
    return str.trim();
}

export function fillLetterPlaceholders(text: string, app: any, companyData: any = {}) {
    const fd = app.formData || {};
    const sal = app.salaryBreakup || {};
    const totalMonthly = (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
    const totalAnnual = totalMonthly * 12;
    const fyFrom = companyData.fyFrom ? new Date(companyData.fyFrom) : new Date();
    const fyTo = companyData.fyTo ? new Date(companyData.fyTo) : new Date();
    const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;
    
    let prefix = "EMY/OFR";
    let counter = companyData.offerCounter || 1001;
    const simRef = app.refNo || `${prefix}/${counter}/${fyShort} (SIM)`;

    const placeholders: any = {
        "{{TODAY_DATE}}": new Date().toLocaleDateString('en-GB'),
        "{{REF_NO}}": simRef,
        "{{TITLE}}": (app.title || ((fd.gender||"").toLowerCase() === 'male' ? 'Mr.' : 'Ms.')).toUpperCase(),
        "{{TITLE_SHORT}}": app.title || ((fd.gender||"").toLowerCase() === 'male' ? 'Mr.' : 'Ms.'),
        "{{FULL_NAME}}": (app.fullName || "").toUpperCase(),
        "{{FIRST_NAME}}": (fd.firstName || "").toUpperCase(),
        "{{FATHER_NAME}}": (fd.fatherName || "").toUpperCase(),
        "{{DOB}}": fd.dob || "",
        "{{BLOOD_GROUP}}": (fd.bloodGroup || "").toUpperCase(),
        "{{PAN_NO}}": (fd.panNo || "").toUpperCase(),
        "{{PHONE}}": fd.phone || "",
        "{{ADDRESS}}": (fd.address || ""),
        "{{CITY_STATE}}": `${fd.city || ""}, ${fd.state || ""}`.toUpperCase(),
        "{{PIN}}": fd.pin || "",
        "{{DESIGNATION}}": (app.designation || fd.designation || "").toUpperCase(),
        "{{EMP_CODE}}": (() => {
            if (app.empCode) return app.empCode;
            const counter = companyData.empCodeCounter || 0;
            return `EMY/EMPC/${counter}`;
        })(),
        "{{DIVISION}}": (app.division || "").toUpperCase(),
        "{{HQ}}": (app.hq || fd.hq || "").toUpperCase(),
        "{{REPORTING_TO}}": (app.reportingTo || "").toUpperCase(),
        "{{SALARY_MONTHLY}}": totalMonthly.toLocaleString('en-IN'),
        "{{SALARY_ANNUAL}}": (totalAnnual + (Number(sal.variation) || 0)).toLocaleString('en-IN'),
        "{{SALARY_WORDS}}": (numberToWords(totalAnnual + (Number(sal.variation) || 0)) + " only").toUpperCase(),
        "{{BANK_NAME}}": (fd.bankName || "").toUpperCase(),
        "{{BANK_ACC}}": fd.accNo || "",
        "{{IFSC}}": (fd.ifsc || "").toUpperCase(),
        "{{JOINING_DATE}}": formatDateDMY(app.actualJoiningDate || fd.joiningDate),
        "{{COMPANY_NAME}}": companyData.name || "Emyris Biolifesciences",
        "{{SIGNATORY_NAME}}": companyData.signatoryName || "",
        "{{SIGNATORY_DESG}}": companyData.signatoryDesignation || "",
        
        "{{SAL_BASIC}}": (Number(sal.basic) || 0).toLocaleString('en-IN'),
        "{{SAL_HRA}}": (Number(sal.hra) || 0).toLocaleString('en-IN'),
        "{{SAL_LTA}}": (Number(sal.lta) || 0).toLocaleString('en-IN'),
        "{{SAL_CONV}}": (Number(sal.conveyance) || 0).toLocaleString('en-IN'),
        "{{SAL_MED}}": (Number(sal.medical) || 0).toLocaleString('en-IN'),
        "{{SAL_SPECIAL}}": (Number(sal.special) || 0).toLocaleString('en-IN'),
        "{{SAL_EDU}}": (Number(sal.edu) || 0).toLocaleString('en-IN'),
        "{{SAL_FIXED}}": (Number(sal.fixed) || 0).toLocaleString('en-IN'),
        "{{SAL_GROSS_MONTHLY}}": totalMonthly.toLocaleString('en-IN'),
        "{{SAL_GROSS_ANNUAL}}": (totalAnnual + (Number(sal.variation) || 0)).toLocaleString('en-IN'),
        "{{SALARY_BREAKUP}}": (() => {
            const formatRs = (num: any) => 'Rs. ' + (Number(num) || 0).toLocaleString('en-IN');
            const variation = Number(sal.variation) || 0;
            const totalM = (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + 
                           (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
            const totalA = (totalM * 12) + variation;
            const borderColor = "#888";
            const headerBg = "rgba(128, 128, 128, 0.15)";
            return `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; border: 1px solid ${borderColor}; color: inherit;">
                <thead>
                    <tr style="background: ${headerBg};">
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: left;">Earnings Components</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Amount (Monthly)</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Amount (Annual)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Basic Salary</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.basic)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.basic||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">HRA</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.hra)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.hra||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Leave Travel Allowance (LTA)</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.lta)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.lta||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Conveyance Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.conveyance)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.conveyance||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Medical Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.medical)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.medical||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Special Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.special)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(((sal.special||0)*12) + variation)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Education Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.edu)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.edu||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Fixed Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.fixed)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.fixed||0)*12)}</td></tr>
                    <tr style="font-weight: bold; background: ${headerBg};"><td style="border: 1px solid ${borderColor}; padding: 8px;">Gross Total</td><td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(totalM)}</td><td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(totalA)}</td></tr>
                </tbody>
            </table>
            `;
        })()
    };

    let result = text || "";
    for (const [key, val] of Object.entries(placeholders)) {
        result = result.split(key).join(val as string);
    }
    return result;
}
