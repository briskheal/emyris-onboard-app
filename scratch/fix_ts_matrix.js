const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', 'utf8');

c = c.replace(
`  useEffect(() => {
    fetchData();
    
    // Quick hack to fetch HQs and Cities from users/raw endpoints if standard ones fail
    const fetchAux = async () => {
       try {
           const { data } = await axios.get('/api/admin/users');
           // Just as a fallback, we don't have explicit HQ/City endpoints built earlier in this script context.
           // Actually, ManageDCS uses a consolidated fetch.
       } catch(e) {}
    }
  }, []);`,
`  useEffect(() => {
    fetchData();
  }, []);`
);

fs.writeFileSync('xla-frontend/src/components/SettingsDoctorControls.tsx', c);
console.log('Fixed TS errors');
