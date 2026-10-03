const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Fix TypeScript implicitly has 'any' type errors
c = c.replace(/states\.map\(s =>/g, "states.map((s: any) =>");
c = c.replace(/hqs\.filter\(h =>/g, "hqs.filter((h: any) =>");
c = c.replace(/\.map\(h =>/g, ".map((h: any) =>");

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Fixed TS any types');
