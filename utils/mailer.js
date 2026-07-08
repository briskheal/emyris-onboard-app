const nodemailer = require('nodemailer');
const axios = require('axios');

async function sendEmail({ to, subject, html, attachments = [] }) {
    const resend = process.env.RESEND_API_KEY ? new (require('resend').Resend)(process.env.RESEND_API_KEY) : null;
    const bridgeUrl = process.env.EMAIL_BRIDGE_URL;
    const emailUser = process.env.EMAIL_USER || "hradmin@emyrishr.in";
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
    const isZoho = emailUser.includes('zoho') || emailUser.includes('emyrishr.in') || process.env.EMAIL_HOST;

    const host = process.env.EMAIL_HOST || (isZoho ? 'smtppro.zoho.in' : 'smtp.gmail.com');
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : (isZoho ? 465 : 587);
    const secure = process.env.EMAIL_SECURE !== undefined ? (process.env.EMAIL_SECURE === 'true') : (port === 465);
    const fromAddr = process.env.EMAIL_FROM || `"Emyris HR" <${emailUser}>`;

    console.log(`📡 [OUTGOING] To: ${to} | Subject: ${subject} | Via: ${host}`);

    // STRATEGY 1: SMTP Delivery (Zoho / Gmail / Custom Host)
    if (isZoho || !bridgeUrl) {
        const transporter = nodemailer.createTransport(isZoho || process.env.EMAIL_HOST ? {
            host,
            port,
            secure,
            auth: { user: emailUser, pass: emailPass }
        } : {
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass }
        });

        try {
            console.log(`📧 [INFO] Attempting SMTP delivery via ${host}...`);
            const info = await transporter.sendMail({
                from: fromAddr,
                to, subject, html,
                attachments: attachments.map(a => ({
                    filename: a.filename,
                    content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content, 'base64'),
                    contentType: a.contentType
                }))
            });
            console.log(`✅ [SUCCESS] SMTP delivery confirmed: ${info.messageId}`);
            return info;
        } catch (smtpErr) {
            console.warn(`⚠️ [WARN] SMTP failed: ${smtpErr.message}. Falling back...`);
            if (!bridgeUrl) throw smtpErr;
        }
    }

    // STRATEGY 2: Google Apps Script Bridge (HTTPS fallback for restricted network environments)
    if (bridgeUrl) {
        try {
            console.log('🌐 [INFO] Sending via Google Apps Script Bridge...');
            const bridgeAttachments = attachments.map(att => ({
                filename: att.filename,
                content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
                contentType: att.contentType
            }));

            const response = await axios.post(bridgeUrl, {
                to, subject, html,
                attachments: bridgeAttachments
            }, { timeout: 25000 });

            console.log(`✅ [SUCCESS] Bridge delivery confirmed: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (bridgeErr) {
            console.error(`❌ [FAILURE] Bridge failed: ${bridgeErr.message}`);
            throw bridgeErr;
        }
    }
}

module.exports = { sendEmail };
