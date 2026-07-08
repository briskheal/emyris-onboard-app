const fs = require('fs');

let code = fs.readFileSync('routes/admin.js', 'utf8');

// 1. Add upload-applicant-doc POST route
const uploadRoute = `
router.post('/upload-applicant-doc', async (req, res) => {
    try {
        const { email, category, base64Data, fileName } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

        // Reuse the server.js saveBase64ToFile helper logic or implement locally
        const matches = base64Data.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return res.status(400).json({ success: false, message: 'Invalid file data' });
        
        let ext = 'png';
        if (matches[1].includes('pdf')) ext = 'pdf';
        else if (matches[1].includes('webp')) ext = 'webp';
        else if (matches[1].includes('jpeg') || matches[1].includes('jpg') || matches[1].includes('jfif')) ext = 'jpg';
        else if (fileName && fileName.includes('.')) ext = fileName.split('.').pop();

        const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
        const safeCategory = category.replace(/[^a-z0-9]/gi, '_');
        const savedFilename = \`\${safeEmail}_\${safeCategory}_\${Date.now()}.\${ext}\`;
        
        const uploadsDir = require('path').join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(require('path').join(uploadsDir, savedFilename), buffer);

        // Update applicant DB
        const newDoc = { docType: category, category, filename: \`/api/admin/uploads/\${savedFilename}\`, uploadedAt: new Date() };
        await Applicant.updateOne(
            { email },
            { $push: { documents: newDoc } }
        );

        res.json({ success: true, message: 'Uploaded successfully', doc: newDoc });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});
`;

if (!code.includes('/upload-applicant-doc')) {
    code = code.replace("router.post('/add-existing-staff',", uploadRoute + "\n\nrouter.post('/add-existing-staff',");
}

// 2. Add actualJoiningDate to verify-and-activate
// We also have /applicant/:email/approve in React but in backend it might be /applicant/:email/approve? Let's check!
// Actually, React code calls /admin/applicant/:email/approve.
// Let's replace the extraction of variables for approve route.
const oldApprove = "const { empCode, designation, division, reportingTo, hq, salary } = req.body;";
const newApprove = "const { empCode, designation, division, reportingTo, hq, salary, actualJoiningDate } = req.body;";
if (code.includes(oldApprove)) {
    code = code.replace(oldApprove, newApprove);
    
    // Add it to the $set
    const oldSet = "status: 'approved', approvedAt: new Date(), empCode, division, reportingTo, hq,";
    const newSet = "status: 'approved', approvedAt: new Date(), actualJoiningDate: actualJoiningDate ? new Date(actualJoiningDate) : new Date(), empCode, division, reportingTo, hq,";
    code = code.replace(oldSet, newSet);
}

fs.writeFileSync('routes/admin.js', code);
console.log('Patched routes/admin.js successfully.');
