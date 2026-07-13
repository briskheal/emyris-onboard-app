const { Company, Applicant, ExamResult } = require('../db');

async function syncActiveExamForApplicant(applicant) {
    if (!applicant || !applicant.email) return applicant;
    try {
        const company = await Company.findOne();
        if (company && company.activeExamDate && company.activeExamProduct) {
            let pending = [];
            try {
                pending = typeof applicant.pendingExams === 'string' ? JSON.parse(applicant.pendingExams) : (applicant.pendingExams || []);
            } catch(e) { pending = []; }
            
            const productName = company.activeExamProduct;
            const examDate = company.activeExamDate;
            const alreadyQueued = pending.find(e => (e.targetProduct && e.targetProduct.toLowerCase() === productName.toLowerCase()));
            const existingResult = await ExamResult.findOne({ email: applicant.email, testedProduct: productName });
            
            if (!alreadyQueued && !existingResult && applicant.status !== 'rejected') {
                const newExam = {
                    id: Date.now().toString(),
                    examDate: examDate,
                    targetProduct: productName,
                    mcqTime: company.examMcqTime || 15,
                    descTime: company.examDescriptiveTime || 15,
                    mcqCount: company.examMcqCount || 5,
                    rapidTime: company.rapidTestTime || 25,
                    assignedAt: new Date().toISOString()
                };
                pending.push(newExam);
                await Applicant.updateOne({ _id: applicant._id }, { $set: { pendingExams: pending } });
                applicant.pendingExams = pending;
            }
        }
    } catch(err) {
        console.error("syncActiveExamForApplicant error:", err);
    }
    return applicant;
}

async function syncAllNonRejectedApplicants() {
    try {
        const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
        let updatedCount = 0;
        for (let i = 0; i < applicants.length; i++) {
            let app = applicants[i];
            let beforeLen = 0;
            try {
                const pBefore = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
                beforeLen = pBefore.length;
            } catch(e) {}

            app = await syncActiveExamForApplicant(app);
            let afterLen = 0;
            try {
                const pAfter = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
                afterLen = pAfter.length;
            } catch(e) {}

            if (afterLen > beforeLen) {
                updatedCount++;
            }
        }
        console.log(`✅ syncAllNonRejectedApplicants checked ${applicants.length} applicants, synced ${updatedCount} new exams.`);
        return { totalChecked: applicants.length, updatedCount };
    } catch(err) {
        console.error("syncAllNonRejectedApplicants error:", err);
        return { totalChecked: 0, updatedCount: 0, error: err.message };
    }
}

module.exports = {
    syncActiveExamForApplicant,
    syncAllNonRejectedApplicants
};
