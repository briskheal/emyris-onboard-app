const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const apiAdditions = `
// --- EXAM SUBMISSIONS & GRADING ---

app.get('/api/admin/pending-exams', async (req, res) => {
    try {
        const exams = await ExamResult.find().sort({ submittedAt: -1 });
        const questions = await Question.find();
        res.json({ success: true, exams, questions });
    } catch (e) {
        console.error('Fetch Pending Exams Error:', e);
        res.status(500).json({ error: 'Failed to fetch pending exams' });
    }
});

app.post('/api/admin/grade-exam', async (req, res) => {
    try {
        const { examId, manualScore } = req.body;
        const exam = await ExamResult.findOne({ _id: examId });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        
        const total = exam.autoScore + parseInt(manualScore);
        
        await ExamResult.updateOne({ _id: examId }, {
            $set: {
                manualScore: parseInt(manualScore),
                totalScore: total,
                status: 'graded'
            }
        });
        
        const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
        
        await sendEmail({
            to: exam.email,
            subject: \`Your Exam Results are In! - \${company.name}\`,
            html: \`
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #6366f1;">Exam Graded</h2>
                    <p>Dear \${exam.name},</p>
                    <p>Your recent assessment for <strong>\${exam.testedProduct}</strong> has been manually reviewed and graded by our Admin team.</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0;">Your Score</h3>
                        <p style="margin: 0;"><strong>MCQ Auto-Score:</strong> \${exam.autoScore}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Descriptive Manual Score:</strong> \${manualScore}</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.2em; color: #6366f1;"><strong>Total Final Score: \${total} / \${exam.totalQuestions}</strong></p>
                    </div>
                    <p>You can review your detailed answers and performance by logging into the Applicant Portal and visiting the <strong>My Exam Scores</strong> tab.</p>
                    <br>
                    <p>Best regards,<br>The \${company.name} Team</p>
                </div>
            \`
        });
        
        res.json({ success: true, totalScore: total });
    } catch (e) {
        console.error('Grade Exam Error:', e);
        res.status(500).json({ error: 'Failed to grade exam' });
    }
});

app.get('/api/applicant/my-scores/:email', async (req, res) => {
    try {
        const exams = await ExamResult.find({ email: req.params.email }).sort({ submittedAt: -1 });
        const questions = await Question.find();
        res.json({ success: true, exams, questions });
    } catch (e) {
        console.error('Fetch My Scores Error:', e);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});
`;

// Insert just before app.listen
if (serverJs.includes('app.listen(PORT')) {
    serverJs = serverJs.replace(/app\.listen\(PORT/g, apiAdditions + '\napp.listen(PORT');
    fs.writeFileSync('server.js', serverJs);
    console.log("Successfully patched server.js with grading APIs");
} else {
    console.log("Failed to find app.listen in server.js");
}
