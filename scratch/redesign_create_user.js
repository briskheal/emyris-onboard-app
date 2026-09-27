const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// 1. Remove max-w-4xl from CreateProfileTab root
c = c.replace(
  'function CreateProfileTab({ isAdmin, editUser, onBack }: { isAdmin: boolean, editUser?: any, onBack?: () => void }) {\n  const [formData',
  'function CreateProfileTab({ isAdmin, editUser, onBack }: { isAdmin: boolean, editUser?: any, onBack?: () => void }) {\n  const [formData'
); // Just checking match

c = c.replace(
  '  return (\n    <div className="max-w-4xl">',
  '  return (\n    <div className="w-full px-4 pb-12">'
);

// 2. Remove the card wrapper around the form
c = c.replace(
  '<form onSubmit={handleSubmit} className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl">',
  '<form onSubmit={handleSubmit} className="w-full mt-4">'
);

// 3. Make the grid wider to utilize space (md:grid-cols-4 instead of md:grid-cols-3)
// Since there are multiple grid-cols-3, let's replace all of them in CreateProfileTab
// Actually, it's safer to use regex.
// Wait, we need to be careful not to replace grid-cols-3 in other tabs (like SetTargetTab where we have 3 columns for Select Month/Year/Target Type)
// Let's replace specifically in CreateProfileTab.
let createProfileStart = c.indexOf('function CreateProfileTab');
let nextFunc = c.indexOf('function ProfileInfoTab');
if (nextFunc === -1) nextFunc = c.length;

let tabContent = c.substring(createProfileStart, nextFunc);
tabContent = tabContent.replace(/md:grid-cols-3/g, 'md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6');
c = c.substring(0, createProfileStart) + tabContent + c.substring(nextFunc);

// 4. Flatten the HR Import Box
c = c.replace(
  '<div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">',
  '<div className="mb-10 bg-slate-900 border border-slate-700 border-l-4 border-l-emerald-500 p-6 shadow-sm">'
);
c = c.replace(
  '<select onChange={handleImport} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors">',
  '<select onChange={handleImport} className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors">'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Redesigned CreateProfileTab layout');
