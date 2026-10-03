const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const lines = c.split(/\r?\n/);
let chemistStart = lines.findIndex(l => l.includes("row.businessName = d['Business Name']"));

if (chemistStart !== -1) {
    let emailIdx = lines.findIndex((l, i) => i > chemistStart && l.includes("row.email = d.Email"));
    let certIdx = lines.findIndex((l, i) => i > chemistStart && l.includes("row.certifications = d.Certifications"));
    
    if (emailIdx !== -1 && certIdx !== -1) {
        // Add city after email
        lines.splice(emailIdx + 1, 0, "          row.city = d.City || d.city || '';");
        
        // Update certifications
        lines[certIdx + 1] = "          row.certifications = d.Certifications || d.certifications || d.Certification || d.certification || '';";
        
        fs.writeFileSync('routes/admin.js', lines.join('\n'));
        console.log("Successfully updated Chemist mapping in routes/admin.js");
    }
} else {
    console.log("Could not find chemist logic");
}
