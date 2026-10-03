const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const divisionSchema = new mongoose.Schema({
    name: String,
    active: { type: Boolean, default: true }
});

const hqSchema = new mongoose.Schema({
    name: String,
    active: { type: Boolean, default: true }
});

async function findDuplicates() {
    console.log('🔍 Checking for duplicates in Database...');
    const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
    const Division = conn.model('Division', divisionSchema);
    const HQ = conn.model('HQ', hqSchema);

    const divs = await Division.find({});
    const hqs = await HQ.find({});

    console.log(`Total Divisions: ${divs.length}`);
    const divNames = divs.map(d => d.name);
    const divDupes = divNames.filter((name, index) => divNames.indexOf(name) !== index);
    console.log(`Duplicate Divisions:`, divDupes);

    console.log(`Total HQs: ${hqs.length}`);
    const hqNames = hqs.map(h => h.name);
    const hqDupes = hqNames.filter((name, index) => hqNames.indexOf(name) !== index);
    console.log(`Duplicate HQs:`, hqDupes);

    if (divDupes.length > 0 || hqDupes.length > 0) {
        console.log('⚠️ DUPLICATES FOUND. Consider running a cleanup.');
    } else {
        console.log('✅ NO DUPLICATES FOUND.');
    }

    await conn.close();
}

findDuplicates().catch(console.error);
