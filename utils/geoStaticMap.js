const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const { Op } = require('sequelize');

// Mercator projection helpers
function latLonToPixel(lat, lon, zoom) {
    const x = ((lon + 180) / 360) * Math.pow(2, zoom) * 256;
    const y = ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * Math.pow(2, zoom) * 256;
    return { x, y };
}

function fetchOsmTile(x, y, z) {
    return new Promise((resolve, reject) => {
        const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        const req = https.get(url, {
            headers: {
                'User-Agent': 'EmyrisFieldCRM/1.0 (contact@emyrishr.in)'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Tile status ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req.on('error', reject);
        req.setTimeout(6000, () => {
            req.destroy();
            reject(new Error('Tile timeout'));
        });
    });
}

function calculateIdealZoom(minLat, maxLat, minLng, maxLng, width, height) {
    for (let z = 16; z >= 11; z--) {
        const p1 = latLonToPixel(maxLat, minLng, z);
        const p2 = latLonToPixel(minLat, maxLng, z);
        const spanX = Math.abs(p2.x - p1.x);
        const spanY = Math.abs(p2.y - p1.y);
        if (spanX <= (width - 120) && spanY <= (height - 120)) {
            return z;
        }
    }
    return 11;
}

/**
 * Generate a high-resolution WebP route map snapshot directly on the server without any browser.
 */
async function generateWebpMapSnapshot(employeeId, date) {
    const { XlAttendance, XlDCR, XlUser, sequelize } = require('../db');

    // 1. Fetch attendance and DCRs for this user on this date
    const [att, dcrs, user] = await Promise.all([
        XlAttendance.findOne({
            where: {
                date,
                employeeId
            }
        }),
        XlDCR.findAll({
            where: {
                date,
                employeeId
            },
            order: [['checkInTime', 'ASC'], ['createdAt', 'ASC']]
        }),
        XlUser.findOne({
            where: {
                [Op.or]: [{ employeeId }, { email: employeeId }]
            }
        })
    ]);

    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || employeeId : employeeId;
    const userHq = user?.hq || att?.hq || '--';

    // 2. Build list of sequential route points
    const points = [];
    if (att && att.punchInLat && att.punchInLng && !isNaN(Number(att.punchInLat))) {
        points.push({
            lat: Number(att.punchInLat),
            lng: Number(att.punchInLng),
            type: 'punch-in',
            label: 'Punch-In',
            time: att.punchInTime || ''
        });
    }

    let callIndex = 1;
    (dcrs || []).forEach(d => {
        if (d.latitude && d.longitude && !isNaN(Number(d.latitude))) {
            points.push({
                lat: Number(d.latitude),
                lng: Number(d.longitude),
                type: 'call',
                seq: callIndex++,
                label: d.entityName || 'Doctor Visit',
                time: d.checkInTime || ''
            });
        }
    });

    if (att && att.punchOutLat && att.punchOutLng && !isNaN(Number(att.punchOutLat))) {
        points.push({
            lat: Number(att.punchOutLat),
            lng: Number(att.punchOutLng),
            type: 'punch-out',
            label: 'Punch-Out',
            time: att.punchOutTime || ''
        });
    }

    // Filter out invalid/0,0 points
    const validPoints = points.filter(p => p.lat !== 0 || p.lng !== 0);
    if (validPoints.length === 0) {
        return null; // No GPS coordinates logged for this day
    }

    // 3. Compute Map bounds and dimensions
    const width = 800;
    const height = 500;
    const lats = validPoints.map(p => p.lat);
    const lngs = validPoints.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const zoom = (maxLat - minLat < 0.0005 && maxLng - minLng < 0.0005)
        ? 15
        : calculateIdealZoom(minLat, maxLat, minLng, maxLng, width, height);

    const centerPx = latLonToPixel(centerLat, centerLng, zoom);
    const startX = centerPx.x - width / 2;
    const startY = centerPx.y - height / 2;

    const startTileX = Math.floor(startX / 256);
    const endTileX = Math.floor((startX + width) / 256);
    const startTileY = Math.floor(startY / 256);
    const endTileY = Math.floor((startY + height) / 256);

    const tilePromises = [];
    const tileCoords = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
        for (let ty = startTileY; ty <= endTileY; ty++) {
            tileCoords.push({ tx, ty });
            tilePromises.push(fetchOsmTile(tx, ty, zoom).catch(() => null));
        }
    }

    const tileBuffers = await Promise.all(tilePromises);

    const compositeList = [];
    for (let i = 0; i < tileCoords.length; i++) {
        const buf = tileBuffers[i];
        if (!buf) continue;
        const { tx, ty } = tileCoords[i];
        const left = Math.round(tx * 256 - startX);
        const top = Math.round(ty * 256 - startY);
        compositeList.push({ input: buf, left, top });
    }

    // 4. Cluster co-located points with radial dispersion (same location doctor calls)
    const clusters = [];
    validPoints.forEach(p => {
        let matched = false;
        for (const cl of clusters) {
            if (Math.hypot(cl.centerLat - p.lat, cl.centerLng - p.lng) < 0.00025) {
                cl.items.push(p);
                matched = true;
                break;
            }
        }
        if (!matched) {
            clusters.push({ centerLat: p.lat, centerLng: p.lng, items: [p] });
        }
    });

    const dispersedPoints = [];
    clusters.forEach(cl => {
        const total = cl.items.length;
        cl.items.forEach((p, idx) => {
            let rLat = p.lat;
            let rLng = p.lng;
            if (total > 1) {
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const radius = 0.00028;
                rLat = cl.centerLat + radius * Math.cos(angle);
                rLng = cl.centerLng + (radius / Math.cos(cl.centerLat * Math.PI / 180)) * Math.sin(angle);
            }
            const px = latLonToPixel(rLat, rLng, zoom);
            dispersedPoints.push({
                ...p,
                x: Math.round(px.x - startX),
                y: Math.round(px.y - startY)
            });
        });
    });

    // 5. Build High-Contrast Solid Black Route Polyline
    const rawPolyPoints = validPoints.map(p => {
        const px = latLonToPixel(p.lat, p.lng, zoom);
        return `${Math.round(px.x - startX)},${Math.round(px.y - startY)}`;
    });
    const polylineStr = rawPolyPoints.join(' ');

    // 6. Build SVG Marker Elements
    let pinsSvg = '';
    dispersedPoints.forEach(p => {
        if (p.type === 'punch-in') {
            pinsSvg += `
                <circle cx="${p.x}" cy="${p.y}" r="15" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
                <text x="${p.x}" y="${p.y + 4}" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">IN</text>
            `;
        } else if (p.type === 'punch-out') {
            pinsSvg += `
                <circle cx="${p.x}" cy="${p.y}" r="15" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" />
                <text x="${p.x}" y="${p.y + 4}" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">OUT</text>
            `;
        } else {
            pinsSvg += `
                <circle cx="${p.x}" cy="${p.y}" r="14" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" />
                <text x="${p.x}" y="${p.y + 4}" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">${p.seq}</text>
            `;
        }
    });

    // Header HUD Card
    const totalCalls = (dcrs || []).length;
    const headerSvg = `
        <rect x="15" y="15" width="370" height="62" rx="10" fill="#0c101c" fill-opacity="0.90" stroke="#334155" stroke-width="1.5" />
        <text x="30" y="38" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">${userName} (${employeeId})</text>
        <text x="30" y="58" font-family="Arial, sans-serif" font-size="11" font-weight="600" fill="#38bdf8">Date: ${date} | HQ: ${userHq} | ${totalCalls} Doctor Calls</text>
    `;

    const svgOverlay = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <polyline points="${polylineStr}" fill="none" stroke="#000000" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" />
            ${pinsSvg}
            ${headerSvg}
        </svg>
    `;

    compositeList.push({
        input: Buffer.from(svgOverlay),
        left: 0,
        top: 0
    });

    // 7. Render final WebP using sharp
    const webpBuffer = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 12, g: 16, b: 28, alpha: 1 }
        }
    })
    .composite(compositeList)
    .webp({ quality: 85 })
    .toBuffer();

    // 8. Save file to server disk
    const monthDir = date.substring(0, 7); // YYYY-MM
    const targetDir = path.join(__dirname, '../uploads/geo-archives', monthDir);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const filename = `${employeeId}_${date}.webp`;
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, webpBuffer);

    const relativeUrl = `/uploads/geo-archives/${monthDir}/${filename}`;

    // 9. Update Database record
    try {
        await sequelize.query(`
            UPDATE xl_attendances 
            SET "mapSnapshotUrl" = :url 
            WHERE "employeeId" = :employeeId AND "date" = :date
        `, {
            replacements: { url: relativeUrl, employeeId, date }
        });
    } catch (dbErr) {
        console.warn('Could not update mapSnapshotUrl in db:', dbErr.message);
    }

    return relativeUrl;
}

/**
 * Run automatic batch generation for all users who had activity on a specific date (e.g. today).
 */
async function runDailyArchiveForDate(targetDate) {
    const { XlAttendance, XlDCR } = require('../db');
    const date = targetDate || new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().split('T')[0];

    console.log(`🗺️ [Geo-Archive Cron] Starting daily WebP route map generation for: ${date}`);

    const [attendances, dcrs] = await Promise.all([
        XlAttendance.findAll({
            attributes: ['employeeId', 'date', 'punchInLat', 'punchOutLat'],
            where: {
                date,
                [Op.or]: [
                    { punchInLat: { [Op.ne]: null } },
                    { punchOutLat: { [Op.ne]: null } }
                ]
            }
        }),
        XlDCR.findAll({
            attributes: ['employeeId', 'date'],
            where: {
                date,
                latitude: { [Op.ne]: null }
            }
        })
    ]);

    const empSet = new Set();
    attendances.forEach(a => { if (a.employeeId) empSet.add(a.employeeId); });
    dcrs.forEach(d => { if (d.employeeId) empSet.add(d.employeeId); });

    const empList = Array.from(empSet);
    console.log(`🗺️ [Geo-Archive Cron] Found ${empList.length} field users with GPS activity on ${date}.`);

    let successCount = 0;
    for (const emp of empList) {
        try {
            const savedPath = await generateWebpMapSnapshot(emp, date);
            if (savedPath) {
                successCount++;
                console.log(`   ✅ Saved WebP map for ${emp} (${date}) -> ${savedPath}`);
            }
        } catch (err) {
            console.error(`   ❌ Failed to generate map for ${emp} on ${date}:`, err.message);
        }
    }

    console.log(`🗺️ [Geo-Archive Cron] Finished for ${date}: ${successCount}/${empList.length} WebP maps archived successfully.`);
    return { date, totalUsers: empList.length, successCount };
}

module.exports = {
    generateWebpMapSnapshot,
    runDailyArchiveForDate
};
