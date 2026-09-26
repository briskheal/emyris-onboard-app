const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

f = f.replace(
  /\{ label: 'Units', key: 'units' \},\s*\{ label: 'Quantity', key: 'quantity' \},\s*\{ label: 'Free Stock', key: 'freeStock' \},\s*\{ label: 'Total Quantity', key: 'totalQty' \},\s*\{ label: 'Final Price', key: 'finalPrice' \},\s*\{ label: 'Return Value', key: 'returnValue' \}/g,
  ""
);

f = f.replace(
  /\{ label: 'Month .*', key: 'month' \},\s*\{ label: 'Stockist', key: 'stockistName' \},\s*\{ label: 'Headquarter', key: 'hq' \},\s*\{ label: 'Total Quantity', key: 'totalQty' \},\s*\{ label: 'Sales Quantity', key: 'salesQty' \}/g,
  "{ label: 'Month', key: 'month' },\n    { label: 'Stockist', key: 'stockistName' },\n    { label: 'Headquarter', key: 'hq' }"
);

// We also need to remove the View column button since they can click the row directly,
// but wait, the view icon is a nice UX hint that it's clickable.
// If the user said "view is not needed", they mean the columns OR the View button?
// "units qty fee stock total qty final price return value view is not needed as we are opening everything in primary modal."
// They explicitly mentioned "view"! So remove 'hasView' for Primary and Secondary sales.

f = f.replace(
  /const hasView = \['Doctors', 'Chemists', 'Stockists', 'Secondary Sales', 'Primary Sales', 'Deletion Request'\]\.includes\(selectedModule\);/,
  "const hasView = ['Doctors', 'Chemists', 'Stockists', 'Deletion Request'].includes(selectedModule);"
);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('Patched columns and View button');
