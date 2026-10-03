const fs = require('fs');

// 1. DoctorsListReport.tsx
let f3 = "xla-frontend/src/pages/DoctorsListReport.tsx";
let c3 = fs.readFileSync(f3, "utf8");
c3 = c3.replace(/'Doctor Code': d\.doctorCode,/g, "'UID': d.uid || String(d._id),");
fs.writeFileSync(f3, c3);

// 2. CallPlanApproval.tsx
let f1 = "xla-frontend/src/components/CallPlanApproval.tsx";
let c1 = fs.readFileSync(f1, "utf8");
c1 = c1.replace(/d\.doctorCode/g, "d.uid");
c1 = c1.replace(/c\.chemistCode/g, "c.uid");
c1 = c1.replace(/s\.stockistCode/g, "s.uid");
fs.writeFileSync(f1, c1);

// 3. DoctorDetails.tsx
let f2 = "xla-frontend/src/components/DoctorDetails.tsx";
let c2 = fs.readFileSync(f2, "utf8");
c2 = c2.replace(/doctor\.doctorCode \|\| doctor\.uid/g, "doctor.uid");
c2 = c2.replace(/DOCTOR'S CODE/g, "UID");
fs.writeFileSync(f2, c2);

// 4. ManageDCS.tsx
let f4 = "xla-frontend/src/pages/ManageDCS.tsx";
let c4 = fs.readFileSync(f4, "utf8");
c4 = c4.replace(/doctorCode:\s*'([^']*)',\s*/g, ""); // Catch doctorCode: '', 
const inputRegex = /<div[^>]*><label[^>]*>DOCTORS CODE<\/label>[\s\S]*?<\/div>/g;
c4 = c4.replace(inputRegex, "");
fs.writeFileSync(f4, c4);

console.log("Done updating TSX files.");
