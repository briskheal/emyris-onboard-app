const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Update getControls to handle Hospital filtering
c = c.replace(
  "const getControls = (type: string) => controls.filter(c => c.type === type && c.isActive !== false);",
  "const getControls = (type: string, hq?: string) => controls.filter(c => c.type === type && c.isActive !== false && (type !== 'Hospital' || !hq || !c.location || c.location.toLowerCase() === hq.toLowerCase()));"
);

// Update CreateDoctorTab getControls calls
c = c.replace(
  "{getControls('Degree').map",
  "{getControls('Degree', formData.headquarter).map"
);
c = c.replace(
  "{getControls('Specialization').map",
  "{getControls('Specialization', formData.headquarter).map"
);
c = c.replace(
  "{getControls('Hospital').map",
  "{getControls('Hospital', formData.headquarter).map"
);
c = c.replace(
  "{getControls('Category').map",
  "{getControls('Category', formData.headquarter).map"
);

// Update the link
c = c.replace(
  "<button className=\"text-sky-400 text-sm font-bold hover:underline\">Do you want to add more Degrees and Specializations?</button>",
  "<button type=\"button\" onClick={() => navigate('/extras/settings?tab=doctor_controls')} className=\"text-sky-400 text-sm font-bold hover:underline\">Do you want to add more Degrees and Specializations?</button>"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Updated ManageDCS routing and smart hospital filtering');
