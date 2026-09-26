const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/CallReport.tsx', 'utf8');
content = content.replace(
  "for (const [metaKey, meta] of monthsToFetch.entries()) {",
  "for (const [, meta] of monthsToFetch.entries()) {"
);
fs.writeFileSync('xla-frontend/src/pages/CallReport.tsx', content);