const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', 'utf8');

c = c.replace(
  "// If we don't have actual City API, we'll try to extract them from controls or cities array\n  const cityOptions = Array.from(new Set([...cities.map(c => c.cityName), ...controls.filter(c => c.area).map(c => c.area)])).filter(Boolean).sort();",
  ""
);

fs.writeFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', c);
console.log('Fixed TS error');
