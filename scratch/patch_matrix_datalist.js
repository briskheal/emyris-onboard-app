const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', 'utf8');

// Fix ADD Form City Dropdown
c = c.replace(
  `<select value={hospitalArea} onChange={e => setHospitalArea(e.target.value)} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500">
                  <option value="">Select Area</option>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>`,
  `<input list="add-city-list" value={hospitalArea} onChange={e => setHospitalArea(e.target.value)} placeholder="Type or Select Area" className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500" />
              <datalist id="add-city-list">
                  {cities.filter(city => !hospitalHq || city.hq === hospitalHq).map(city => <option key={city._id} value={city.cityName} />)}
              </datalist>`
);

// Fix EDIT Form City Dropdown
c = c.replace(
  `<select value={editArea} onChange={e => setEditArea(e.target.value)} className="w-full bg-slate-900 border border-sky-500 rounded p-2 text-sm text-white focus:outline-none">
                            <option value="">Select Area</option>
                            {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>`,
  `<input list={\`edit-city-list-\${c._id}\`} value={editArea} onChange={e => setEditArea(e.target.value)} placeholder="Type or Select Area" className="w-full bg-slate-900 border border-sky-500 rounded p-2 text-sm text-white focus:outline-none" />
                        <datalist id={\`edit-city-list-\${c._id}\`}>
                            {cities.filter(city => !editHq || city.hq === editHq).map(city => <option key={city._id} value={city.cityName} />)}
                        </datalist>`
);

// Fix hqOptions to use hqName properly
c = c.replace(
  "const hqOptions = Array.from(new Set([...hqs.map(h => h.hqName), ...controls.filter(c => c.hq).map(c => c.hq)])).filter(Boolean).sort();",
  "const hqOptions = Array.from(new Set(hqs.map(h => h.hqName))).filter(Boolean).sort();"
);


fs.writeFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', c);
console.log('Fixed ADD/EDIT forms to use smart filtered datalists');
