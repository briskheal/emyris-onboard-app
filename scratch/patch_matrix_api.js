const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', 'utf8');

// Fix API Endpoints
c = c.replace(
  "axios.get('/api/admin/hqs'), // Assuming this exists or similar\n        axios.get('/api/admin/cities') // Assuming this exists",
  "axios.get('/api/admin/locations/hqs'),\n        axios.get('/api/admin/locations/cities')"
);

// Remove the hacky fetchAux since we have the real routes now
c = c.replace(
  `  // Real fetchAux for HQ/Cities
  useEffect(() => {
    const fetchLists = async () => {
        try {
            const hqRes = await axios.get('/api/admin/hqs');
            setHqs(hqRes.data.hqs || hqRes.data || []);
        } catch(e) {}
        try {
            const cityRes = await axios.get('/api/admin/cities');
            setCities(cityRes.data.cities || cityRes.data || []);
        } catch(e) {}
    };
    fetchLists();
  }, []);`,
  ``
);

// Fix "Optional" labels
c = c.replace("HQ (Optional)", "HQ *");
c = c.replace("City/Area (Optional)", "City/Area *");

// Make Adding required
c = c.replace(
  "disabled={adding || !inputValue.trim()}",
  "disabled={adding || !inputValue.trim() || (type === 'Hospital' && (!hospitalHq || !hospitalArea.trim()))}"
);

// Fix the Bulk Area inputs (Datalist)
c = c.replace(
  `<select value={bulkArea} onChange={e=>setBulkArea(e.target.value)} className="bg-slate-900 border border-sky-500/50 rounded-lg p-2 text-sm text-white outline-none">
                      <option value="">Select Bulk Area</option>
                      {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>`,
  `<div className="relative">
                      <input list="bulk-city-list" value={bulkArea} onChange={e=>setBulkArea(e.target.value)} placeholder="Type or Select Area" className="bg-slate-900 border border-sky-500/50 rounded-lg p-2 text-sm text-white outline-none w-40" />
                      <datalist id="bulk-city-list">
                          {cities.filter(city => !bulkHq || city.hq === bulkHq).map(city => <option key={city._id} value={city.cityName} />)}
                      </datalist>
                  </div>`
);

fs.writeFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', c);
console.log('Fixed API, required fields, and bulk datalist');
