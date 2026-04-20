require('dotenv').config();
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    category: String,
    name: String,
    data: String,
    active: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now }
});

const companySchema = new mongoose.Schema({
    name: { type: String, default: "EMYRIS BIOLIFESCIENCES PVT LTD." },
    activeLetterheadId: mongoose.Schema.Types.ObjectId
});

const Asset = mongoose.model('Asset', assetSchema);
const Company = mongoose.model('Company', companySchema);

async function checkAssets() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const assets = await Asset.find({}, 'name category active').lean();
        console.log('--- ALL ASSETS ---');
        console.log(JSON.stringify(assets, null, 2));

        const profile = await Company.findOne().lean();
        console.log('--- COMPANY PROFILE ---');
        console.log(JSON.stringify(profile, null, 2));

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAssets();
