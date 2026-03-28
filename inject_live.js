const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

const applicantSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'draft' },
    canLogin: { type: Boolean, default: true },
    formData: { type: Object, default: {} },
    registeredAt: { type: Date, default: Date.now },
    submittedAt: Date,
    approvedAt: Date,
    documents: [Object],
    division: String,
    reportingTo: String,
    refNo: String,
    tasks: {
        offerLetter: { type: Boolean, default: false },
        appointmentLetter: { type: Boolean, default: false },
        appLinkSent: { type: Boolean, default: false },
        loginDetailsSent: { type: Boolean, default: false }
    }
});

const companySchema = new mongoose.Schema({
    letterCounter: { type: Number, default: 1001 }
});

const Applicant = mongoose.model('Applicant', applicantSchema);
const Company = mongoose.model('Company', companySchema);

async function inject() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to Production MongoDB');

        // Delete existing if any
        await Applicant.deleteMany({ email: 'test@dummy.com' });

        const company = await Company.findOne();
        const counter = company ? company.letterCounter : 1001;
        const fyShort = `${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}`;

        const dummy = {
            fullName: "SMRUTI RANJAN DASH",
            email: "test@dummy.com",
            phone: "9876543210",
            password: "test_dummy_pass",
            status: "approved",
            approvedAt: new Date(),
            canLogin: true,
            division: "CRITIZA",
            reportingTo: "MR. ASHOK KUMAR (VP SALES)",
            refNo: `REF/${counter}/${fyShort}`,
            formData: {
                firstName: "SMRUTI",
                lastName: "DASH",
                gender: "male",
                address: "PLOT NO-42, CHANDRASEKHARPUR",
                city: "BHUBANESWAR",
                state: "ODISHA",
                pin: "751024",
                designation: "PRODUCT MANAGER",
                hq: "BHUBANESWAR",
                salary: "70833", // Approx 8.5L CTC
                joiningDate: new Date().toISOString().split('T')[0]
            }
        };

        await Applicant.create(dummy);
        console.log('🚀 High-Fidelity Dummy Record Injected: SMRUTI RANJAN DASH');
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('❌ Injection failed:', err);
    }
}

inject();
