const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const lines = c.split(/\r?\n/);
// Find the exact block for Stockist data mapping
// row.gst = String(d.GST || d.gst || '');
// row.drugLicense = String(d['Drug License'] || d.drugLicense || '');
let gstIdx = lines.findIndex(l => l.includes("row.gst = String(d.GST || d.gst || '');"));

if (gstIdx !== -1) {
    // We will replace this section entirely to cleanly handle everything
    const replacement = `          row.certifications = d.Certifications || d.certifications || d.Certification || d.certification || '';
          row.gst = String(d['GST Number'] || d.GST || d.gst || '');
          row.drugLicense = String(d['Drug License Number'] || d['Drug License'] || d.drugLicense || '');
          row.drugExpiryDate = String(d['Drug Expiry Number'] || d['Drug Expiry Date'] || d.drugExpiryDate || '');
          row.establishmentDate = String(d['Establishment Date'] || d.establishmentDate || '');
          row.city = d.City || d.city || '';`;

    // find where certifications is and remove it
    let certIdx = lines.findIndex(l => l.includes("row.certifications = d.Certifications || d.certifications || '';"));
    if (certIdx !== -1) lines[certIdx] = ""; // wipe it out

    // Replace the gst line with the entire replacement block
    lines[gstIdx] = replacement;
    
    // Also we need to replace the old drugLicense line
    let dlIdx = lines.findIndex(l => l.includes("row.drugLicense = String(d['Drug License'] || d.drugLicense || '');"));
    if (dlIdx !== -1) lines[dlIdx] = ""; // wipe it out

    fs.writeFileSync('routes/admin.js', lines.join('\n'));
    console.log("Successfully updated Stockist mapping in routes/admin.js");
} else {
    console.log("Could not find Stockist gst line");
}
