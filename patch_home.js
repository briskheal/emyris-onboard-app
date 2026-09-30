const fs = require('fs');

const filesToPatch = [
  'xla-frontend/src/pages/PrimarySales.tsx',
  'xla-frontend/src/pages/SecondarySales.tsx'
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let src = fs.readFileSync(file, 'utf8');
    src = src.replace(/<button onClick=\{\(\) => navigate\('\/'\)\} className="text-slate-300 hover:text-emerald-400 transition-colors bg-\[\#27273f\] p-2 rounded-lg" title="Go to Dashboard">/,
                      '<button onClick={() => navigate(\'/admin\')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Admin Menu">');
    fs.writeFileSync(file, src);
    console.log('Patched', file);
  }
}
