const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

const editDeleteStart = content.indexOf('const EditDeleteTab = () => {');
const editDeleteEnd = content.indexOf('  // --- UPLOAD DCS TAB ---');

if (editDeleteStart === -1 || editDeleteEnd === -1) {
  console.error("Could not find EditDeleteTab boundaries.");
  process.exit(1);
}

// Extract the string
let editDeleteTabContent = content.substring(editDeleteStart, editDeleteEnd);

// Rename it and add props
editDeleteTabContent = editDeleteTabContent.replace(
  'const EditDeleteTab = () => {',
  'const EditDeleteTabComponent = ({ doctors, chemists, stockists, hqs, states, users, fetchData }: any) => {'
);

// Remove it from inside ManageDCS
content = content.substring(0, editDeleteStart) + "\n" + content.substring(editDeleteEnd);

// Insert it above ManageDCS
const manageDcsStart = content.indexOf('export default function ManageDCS() {');
content = content.substring(0, manageDcsStart) + editDeleteTabContent + "\n\n" + content.substring(manageDcsStart);

// Update the render call
content = content.replace(
  "{activeTab === 'edit_delete' && <EditDeleteTab />}",
  "{activeTab === 'edit_delete' && <EditDeleteTabComponent doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />}"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', content);
console.log('Successfully extracted EditDeleteTab to prevent state reset on re-render');
