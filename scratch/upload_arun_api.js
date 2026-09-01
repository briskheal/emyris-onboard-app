const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_URL = 'https://emyrishr.in';
const EMAIL = 'aruns_yadav@yahoo.com';
const FOLDER_PATH = path.join(__dirname, '../BULK_DOCUMENTS', EMAIL);

async function run() {
    console.log(`Starting processing for ${EMAIL}...`);

    // 1. Fetch existing applicants to get current documents for Arun
    const appsRes = await fetch(`${BASE_URL}/api/admin/applicants`);
    const appsData = await appsRes.json();
    
    if (!appsData || !Array.isArray(appsData)) {
        console.error('Failed to fetch applicants:', appsData);
        return;
    }
    
    const arun = appsData.find(a => a.email === EMAIL);
    if (!arun) {
        console.error('Applicant Arun not found on live server!');
        return;
    }

    // 2. Delete existing documents
    const existingDocs = arun.documents || [];
    console.log(`Found ${existingDocs.length} existing documents. Deleting them...`);
    for (const doc of existingDocs) {
        const delRes = await fetch(`${BASE_URL}/api/admin/delete-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, assetId: doc.assetId })
        });
        const d = await delRes.json();
        console.log(`Deleted ${doc.category}:`, d);
    }

    // 3. Read and Upload new documents
    if (!fs.existsSync(FOLDER_PATH)) {
        console.error(`Folder not found: ${FOLDER_PATH}`);
        return;
    }

    const files = fs.readdirSync(FOLDER_PATH).filter(f => !f.startsWith('.'));
    console.log(`Found ${files.length} files to upload from folder.`);

    for (const file of files) {
        const filePath = path.join(FOLDER_PATH, file);
        const ext = path.extname(file).toLowerCase();
        let fileName = file;
        let fileDataStr = '';

        if (ext === '.pdf') {
            const rawData = fs.readFileSync(filePath);
            const b64 = rawData.toString('base64');
            fileDataStr = `data:application/pdf;base64,${b64}`;
        } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
            console.log(`Compressing ${file} to WEBP...`);
            const webpBuffer = await sharp(filePath)
                .resize({ width: 1500, withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();
            
            const b64 = webpBuffer.toString('base64');
            fileDataStr = `data:image/webp;base64,${b64}`;
            fileName = file.replace(ext, '.webp');
        } else {
            console.log(`Skipping unsupported file: ${file}`);
            continue;
        }

        let category = 'Other';
        const lowerName = file.toLowerCase();
        if (lowerName.includes('pan')) category = 'Pan Card';
        else if (lowerName.includes('aadhar') || lowerName.includes('adhar')) category = 'Aadhar Card';
        else if (lowerName.includes('photo')) category = 'Passport Photo';
        else if (lowerName.includes('passbook') || lowerName.includes('bank')) category = 'Bank Passbook';
        else if (lowerName.includes('10th')) category = '10th Marksheet';
        else if (lowerName.includes('12th')) category = '12th Marksheet';
        else if (lowerName.includes('graduation')) category = 'Graduation Certificate';
        else if (lowerName.includes('resume') || lowerName.includes('cv')) category = 'Resume';
        else if (lowerName.includes('appointment')) category = 'Appointment Letter';
        else if (lowerName.includes('relieving')) category = 'Relieving Letter';
        else if (lowerName.includes('salary') || lowerName.includes('payslip')) category = 'Salary Slips';

        console.log(`Uploading ${fileName} as [${category}]...`);
        const upRes = await fetch(`${BASE_URL}/api/applicant/upload-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, category, fileName, fileData: fileDataStr })
        });
        const u = await upRes.json();
        console.log(`Upload result:`, u);
    }

    console.log(`\n🎉 FINISHED! Arun's files have been completely wiped and re-uploaded directly to the live server!`);
}

run();
