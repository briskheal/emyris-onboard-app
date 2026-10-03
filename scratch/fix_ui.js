const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// Remove arrow from Total
c = c.replace(
  '<th className="p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">Total ↑</th>',
  '<th className="p-4 font-bold uppercase tracking-wider text-sm bg-slate-800 text-center">Total</th>'
);

// Fix API calls in UploadTargetTab
const oldFetchLocations = `  const fetchLocations = async () => {
    try {
      const res = await axios.get('/api/admin/locations');
      if (res.data.success) {
        setStates(res.data.states || []);
        setHqs(res.data.hqs || []);
      }
    } catch (e) { console.error(e); }
  };`;

const newFetchLocations = `  const fetchLocations = async () => {
    try {
      const [stRes, hqRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/hqs')
      ]);
      if (stRes.data.success) setStates(stRes.data.states);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
    } catch (e) { console.error(e); }
  };`;

c = c.replace(oldFetchLocations, newFetchLocations);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed ManageUsers UI and API calls');
