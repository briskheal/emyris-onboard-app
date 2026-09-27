
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testLogin() {
    const conn = await mongoose.createConnection(MONGODB_URI, { family: 4 }).asPromise();
    const Applicant = conn.model('Applicant', new mongoose.Schema({
        email: String,
        password: String
    }));

    const email = 'jrdash.ctc@gmail.com';
    const password = '421241';

    // SERVER LOGIC:
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const applicant = await Applicant.findOne({ 
        email: { $regex: new RegExp("^" + escapedEmail + "$", "i") }
    });

    if (!applicant) {
        console.log('❌ Email not found in DB');
    } else if (applicant.password !== password) {
        console.log(`❌ Password mismatch! DB: "${applicant.password}", Sent: "${password}"`);
    } else {
        console.log('✅ Login simulation SUCCESSful');
    }
    process.exit(0);
}

testLogin();
