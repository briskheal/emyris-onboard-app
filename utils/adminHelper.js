const { Company, XlAdmin } = require('../db');

/**
 * Resolves the official administrator email dynamically from:
 * 1. Company Profile `adminEmail` in DB
 * 2. Company Profile `email` in DB (configured via Admin Portal -> Company Profile)
 * 3. Active Administrator account (`xl_admins`) in DB
 * 4. Environment variable `ADMIN_EMAIL`, `EMAIL_USER`, or `REGISTRATION_SUPPORT_EMAIL`
 */
async function getSystemAdminEmail() {
    try {
        if (Company) {
            const company = await Company.findOne();
            if (company) {
                if (company.adminEmail && String(company.adminEmail).trim()) {
                    return String(company.adminEmail).trim().toLowerCase();
                }
                if (company.email && String(company.email).trim()) {
                    return String(company.email).trim().toLowerCase();
                }
            }
        }
    } catch (e) {
        console.warn('[getSystemAdminEmail] Company DB lookup warning:', e.message);
    }

    try {
        if (XlAdmin) {
            const activeAdmin = await XlAdmin.findOne({ where: { status: 'Active' } });
            if (activeAdmin && activeAdmin.email && String(activeAdmin.email).trim()) {
                return String(activeAdmin.email).trim().toLowerCase();
            }
        }
    } catch (e) {
        console.warn('[getSystemAdminEmail] XlAdmin DB lookup warning:', e.message);
    }

    return (
        process.env.ADMIN_EMAIL ||
        process.env.EMAIL_USER ||
        process.env.REGISTRATION_SUPPORT_EMAIL ||
        'hradmin@emyrishr.in'
    ).trim().toLowerCase();
}

module.exports = {
    getSystemAdminEmail
};
