const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  "className=\"bg-[#27273f] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-2xl flex flex-col p-6 flex-1\"",
  "className=\"bg-[#27273f] rounded-xl border border-[#3b3b5a] shadow-2xl flex flex-col p-6 min-h-fit mb-8\""
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Removed flex-1 and overflow-hidden from the inner card to allow the main page to scroll naturally.');
