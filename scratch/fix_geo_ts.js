const fs = require('fs');
let doc = fs.readFileSync('xla-frontend/src/pages/GeoFencingListReport.tsx', 'utf8');
doc = doc.replace("const [loading, setLoading] = useState(false);", "");
fs.writeFileSync('xla-frontend/src/pages/GeoFencingListReport.tsx', doc);
