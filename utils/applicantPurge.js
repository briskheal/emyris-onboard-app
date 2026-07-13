const fs = require('fs');
const path = require('path');
const { Applicant, Asset, ExamResult } = require('../db');

/**
 * Cascading Wipedown Utility
 * Completely removes an applicant, all their test attempts / scores (ExamResult),
 * all document assets metadata (Asset), and all physical disk files from uploads folder.
 */
async function purgeApplicantAndAllAssociatedRecords(rawEmailOrId) {
    if (!rawEmailOrId) return { success: false, error: 'Email or ID required' };
    
    const emailStr = rawEmailOrId.toString().toLowerCase().trim();
    
    // 1. Locate applicant (try exact email, regex, or ID)
    let applicant = await Applicant.findOne({ email: emailStr });
    if (!applicant) {
        let list = await Applicant.find({ email: { $regex: `^${emailStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        if (list && list.length > 0) applicant = list[0];
    }
    if (!applicant && emailStr.length > 5 && !emailStr.includes('@')) {
        applicant = await Applicant.findByPk(emailStr);
    }

    const targetEmail = applicant ? (applicant.email || emailStr).toLowerCase().trim() : emailStr;

    // 2. Harvest all linked asset IDs / filenames
    const filenamesSet = new Set();
    if (applicant && Array.isArray(applicant.documents)) {
        applicant.documents.forEach(d => {
            if (d && d.assetId) {
                const fname = String(d.assetId).split('/').pop().trim();
                if (fname) filenamesSet.add(fname);
            }
        });
    }

    // Also check Asset table directly by email or candidateEmail if available
    try {
        const assetsByEmail = await Asset.find({ email: targetEmail });
        if (Array.isArray(assetsByEmail)) {
            assetsByEmail.forEach(a => {
                const fname = (typeof a.get === 'function' ? a.get('_id') : a._id || a.id);
                if (fname) filenamesSet.add(String(fname).split('/').pop().trim());
            });
        }
        const assetsByCand = await Asset.find({ candidateEmail: targetEmail });
        if (Array.isArray(assetsByCand)) {
            assetsByCand.forEach(a => {
                const fname = (typeof a.get === 'function' ? a.get('_id') : a._id || a.id);
                if (fname) filenamesSet.add(String(fname).split('/').pop().trim());
            });
        }
    } catch(e) {}

    const filenames = Array.from(filenamesSet);

    // 3. Delete physical disk files from uploads folder
    let deletedFilesCount = 0;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    filenames.forEach(fname => {
        const filePath = path.join(uploadsDir, fname);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                deletedFilesCount++;
            } catch(e) {
                console.warn(`Could not unlink disk file ${filePath}:`, e.message);
            }
        }
    });

    // 4. Wipe rows from Asset DB table
    if (filenames.length > 0) {
        try { await Asset.deleteMany({ _id: { $in: filenames } }); } catch(e) {}
    }
    try { await Asset.deleteMany({ email: targetEmail }); } catch(e) {}
    try { await Asset.deleteMany({ candidateEmail: targetEmail }); } catch(e) {}

    // 5. Wipe rows from ExamResult DB table (All MCQ tests, rapid attempts, and descriptive answers)
    let deletedExamResultsCount = 0;
    try {
        const res1 = await ExamResult.deleteMany({ email: targetEmail });
        deletedExamResultsCount += (res1 && res1.deletedCount) ? res1.deletedCount : 0;
    } catch(e) {}
    // Double check with case-insensitive regex for ExamResult email
    try {
        const res2 = await ExamResult.deleteMany({ email: { $regex: `^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        deletedExamResultsCount += (res2 && res2.deletedCount) ? res2.deletedCount : 0;
    } catch(e) {}

    // 6. Wipe applicant row from Applicant DB table
    try { await Applicant.deleteOne({ email: targetEmail }); } catch(e) {}
    try { await Applicant.destroy({ where: { email: targetEmail } }); } catch(e) {}
    if (applicant && applicant._id) {
        try { await Applicant.deleteOne({ _id: applicant._id }); } catch(e) {}
        try { await Applicant.destroy({ where: { _id: applicant._id } }); } catch(e) {}
    }

    console.log(`🧹 [CASCADING PURGE COMPLETE] Applicant: ${targetEmail} | ExamResults Wiped: ${deletedExamResultsCount} | Assets DB Wiped: ${filenames.length} | Disk Files Wiped: ${deletedFilesCount}`);

    return {
        success: true,
        email: targetEmail,
        deletedExamResultsCount,
        deletedAssetsCount: filenames.length,
        deletedDiskFilesCount: deletedFilesCount,
        applicantFoundAndDeleted: !!applicant
    };
}

module.exports = { purgeApplicantAndAllAssociatedRecords };
