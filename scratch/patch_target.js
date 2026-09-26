const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(/h\.stateName === selectedState/g, 'h.state === selectedState');

const headerHtml = `      <button onClick={() => window.location.href='/xla/admin'} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
        <ArrowLeft size={16} /> SET USER TARGET
      </button>`;

c = c.replace(
  /{activeSubTab === 'main' && \([\s\S]*?<div className="grid grid-cols-2 gap-8 mb-8">/,
  `{activeSubTab === 'main' && (
        <>
${headerHtml}
          <div className="grid grid-cols-2 gap-8 mb-8">`
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed ManageUsers.tsx');
