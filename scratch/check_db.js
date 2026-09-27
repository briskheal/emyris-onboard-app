const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDB() {
    console.log('Connecting to', MONGODB_URI);
    const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
    const divisionSchema = new mongoose.Schema({ name: String, active: Boolean });
    const Division = conn.model('Division', divisionSchema);
    const hqSchema = new mongoose.Schema({ name: String, active: Boolean });
    const HQ = conn.model('HQ', hqSchema);
    
    const divs = await Division.find();
    console.log('Divisions found:', divs);
    
    const hqs = await HQ.find();
    console.log('HQs found:', hqs);
    
    await conn.close();
}

checkDB();
