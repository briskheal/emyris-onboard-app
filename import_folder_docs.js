const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { syncDatabase, Applicant, Asset } = require('./db');

const BULK_DIR = path.join(__dirname, 'BULK_DOCUMENTS');

const VALID_CATEGORIES = [
    'PAN Card',
    'Passport Photo',
    'Degree/Provisional Certificate',
    'Aadhar Card',
    'Resume',
    'Cancel Cheque/Passbook',
    'Digital Signature',
    'Last Month Salary Slip',
    'Previous Company Appointment Letter'
];

function matchCategory(filename) {
    // Remove extension
    let name = path.basename(filename, path.extname(filename));
    // Remove trailing "(2)", "(1)", etc.
    name = name.replace(/\s*\(\d+\)$/, '');
    // Replace underscores with spaces
    name = name.replace(/_/g, ' ').toLowerCase();

    for (let cat of VALID_CATEGORIES) {
        let normalizedCat = cat.replace(/\//g, ' ').toLowerCase();
        if (normalizedCat === name || name.includes(normalizedCat)) {
            return cat;
        }
    }
    return null;
}

function getMimeType(ext) {
    ext = ext.toLowerCase().replace('.', '');
    const map = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'jfif': 'image/jpeg'
    };
    return map[ext] || 'application/octet-stream';
}

async function run() {
    console.log("Syncing database...");
    await syncDatabase();

    if (!fs.existsSync(BULK_DIR)) {
        console.log("BULK_DOCUMENTS directory not found!");
        return;
    }

    const emailDirs = fs.readdirSync(BULK_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (let email of emailDirs) {
        console.log(`\nProcessing candidate: ${email}`);
        const applicants = await Applicant.find({ email: email });
        
        if (!applicants || applicants.length === 0) {
            console.log(`? Candidate ${email} not found in database. Skipping...`);
            continue;
        }
        
        const applicant = applicants[0];
        if (!applicant.documents) applicant.documents = [];

        const docsDir = path.join(BULK_DIR, email);
        const files = fs.readdirSync(docsDir);

        for (let file of files) {
            const ext = path.extname(file);
            let mimeType = getMimeType(ext);
            const category = matchCategory(file);

            if (!category) {
                console.log(`? Could not match category for file: ${file}`);
                continue;
            }

            console.log(`? Matched ${file} -> ${category}`);

            // Find existing document with the EXACT SAME FILE NAME in this category
            // This allows multiple files per category (e.g. Degree (1), Degree (2))
            const existing = applicant.documents.find(d => d.category === category && d.name === file);
            if (existing && existing.assetId) {
                // Delete the old overwritten asset from PostgreSQL database
                await Asset.deleteMany({ _id: existing.assetId });
            }

            // Remove only the exact matching file from array so we don't duplicate it
            applicant.documents = applicant.documents.filter(d => !(d.category === category && d.name === file));

            // Read file
            const filePath = path.join(docsDir, file);
            let fileBuffer = fs.readFileSync(filePath);
            
            // Compress images to WebP
            if (mimeType.startsWith('image/')) {
                console.log(`   ? Compressing image to WebP...`);
                fileBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
                mimeType = 'image/webp';
                // Adjust file name extension for UI logic
                file = file.replace(/\.[^/.]+$/, "") + ".webp";
            }

            const base64String = fileBuffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64String}`;
            const assetId = uuidv4();

            // Create Asset
            const asset = new Asset({
                _id: assetId,
                category: category,
                mimeType: mimeType,
                data: dataUrl,
                name: file,
                uploadedAt: new Date()
            });

            await asset.save();

            // Push to applicant documents
            applicant.documents.push({
                assetId: assetId,
                name: file,
                category: category,
                mimeType: mimeType,
                uploadedAt: new Date()
            });
        }

        // Save applicant
        await applicant.save();
        console.log(`? Successfully updated documents for ${email}`);
    }

    console.log("\n? Bulk upload completed successfully!");
    process.exit(0);
}

run().catch(console.error);
