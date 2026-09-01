
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
    const conn = await mongoose.createConnection(MONGODB_URI, { family: 4 }).asPromise();
    const Applicant = conn.model('Applicant', new mongoose.Schema({}, { strict: false }));

    const email = 'jrdash.ctc@gmail.com';
    const applicant = await Applicant.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });

    if (applicant) {
        console.log('✅ Found Applicant:', JSON.stringify(applicant, null, 2));
    } else {
        console.log('❌ Not found');
    }
    process.exit(0);
}

check();
