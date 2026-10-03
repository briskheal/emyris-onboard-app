const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  /headers = \['Name', 'Degree', 'Specialization', 'Hospital', 'Mobile', 'Clinic Contact', 'Doctor Code', 'Category', 'Address', 'Working Area', 'Birthday', 'Anniversary', 'Email', 'Extra Information'\];/g,
  "headers = ['Sr no.', 'Name', 'Degree', 'Specialization', 'Hospital', 'Birthday', 'Anniversary', 'Email', 'Mobile', 'Clinic Contact', 'Address', 'Category', 'Contact', 'Headquarter', 'Working Area'];"
);

c = c.replace(
  /headers = \['Business Name', 'Proprietor Name', 'Mobile', 'Email', 'Address', 'Working Area', 'Birthday', 'Certifications', 'Extra Information'\];/g,
  "headers = ['Sr no.', 'Name', 'Business Name', 'Certification', 'Birthday', 'Email', 'Chemist Contact', 'Address', 'City', 'Working Area'];"
);

c = c.replace(
  /headers = \['Business Name', 'Proprietor Name', 'Mobile', 'Email', 'GST', 'Drug License', 'Address', 'Working Area', 'Certifications', 'Extra Information'\];/g,
  "headers = ['Sr no.', 'Name', 'Business Name', 'Certification', 'GST Number', 'Drug License Number', 'Drug Expiry Number', 'Establishment Date', 'Stockist Contact', 'Address', 'City'];"
);

// Now update exportToExcel logic
c = c.replace(
  /const ws = XLSX\.utils\.json_to_sheet\(displayList\.map\(\(d, i\) => \{\s*if\(filterType === 'Doctor'\) return \{ 'Sr no\.': i\+1, UID: d\.uid, Name: d\.name, Degree: d\.degree,\s*Specialization: d\.specialization, Hospital: d\.hospital, 'Mobile Number': d\.mobile, HQ: d\.headquarter \};\s*else return \{ 'Sr no\.': i\+1, UID: d\.uid, 'Business Name': d\.businessName, 'Proprietor Name': d\.proprietorName\s*\|\| d\.name, Address: d\.address, 'Mobile Number': d\.mobile \|\| d\.contact, HQ: d\.headquarter \};\s*\}\)\);/g,
  `const ws = XLSX.utils.json_to_sheet(displayList.map((d, i) => {
        if(filterType === 'Doctor') return { 'Sr no.': i+1, Name: d.name, Degree: d.degree, Specialization: d.specialization, Hospital: d.hospital, Birthday: d.birthday, Anniversary: d.anniversary, Email: d.email, Mobile: d.mobile, 'Clinic Contact': d.clinicContact, Address: d.address, Category: d.category, Contact: d.contact, Headquarter: d.headquarter, 'Working Area': d.workingArea };
        if(filterType === 'Chemist') return { 'Sr no.': i+1, Name: d.proprietorName || d.name, 'Business Name': d.businessName, Certification: d.certifications, Birthday: d.birthday, Email: d.email, 'Chemist Contact': d.mobile, Address: d.address, City: d.city || '', 'Working Area': d.workingArea };
        if(filterType === 'Stockist') return { 'Sr no.': i+1, Name: d.name, 'Business Name': d.businessName, Certification: d.certifications, 'GST Number': d.gst, 'Drug License Number': d.drugLicense, 'Drug Expiry Number': d.drugExpiryDate || '', 'Establishment Date': d.establishmentDate || '', 'Stockist Contact': d.mobile, Address: d.address, City: d.city || '' };
      }));`
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Updated exportToExcel and handleDownloadFormat');
