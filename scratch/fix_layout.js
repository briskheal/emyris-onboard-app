const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// Remove max-h and overflow-y from table container to allow it to grow naturally and scroll with the page
c = c.replace(
  "className=\"overflow-y-auto overflow-x-auto max-h-[50vh] border border-[#3b3b5a] rounded-t-xl bg-[#1e1e2d] custom-scrollbar\"",
  "className=\"overflow-x-auto border border-[#3b3b5a] border-b-0 rounded-t-xl bg-[#1e1e2d] custom-scrollbar\""
);

// Fix the footer margin to perfectly attach to the table without overlapping
c = c.replace(
  "className=\"flex items-center justify-between p-4 bg-[#252538] border border-[#3b3b5a] border-t-0 rounded-b-xl mt-[-16px]\"",
  "className=\"flex items-center justify-between p-4 bg-[#252538] border border-[#3b3b5a] rounded-b-xl\""
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Fixed table layout to show full height and use full-page scroll');
