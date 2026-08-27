const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const editDeleteBtn = "\n              <button onClick={() => setActiveTab('edit_delete')} className={	ext-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all " + "}>EDIT / DELETE</button>";

const otherBtns = "\n              <button onClick={() => setActiveTab('set_target')} className={	ext-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all " + "}>SET USER TARGET</button>" +
"\n              <button onClick={() => setActiveTab('upload_target')} className={	ext-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all " + "}>UPLOAD TARGET</button>" +
"\n              <button onClick={() => setActiveTab('access_control')} className={	ext-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all " + "}>ACCESS CONTROL</button>" +
"\n              <button onClick={() => setActiveTab('user_devices')} className={	ext-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all " + "}>USER DEVICES</button>";

content = content.replace("USER INFO</button>", "USER INFO</button>" + editDeleteBtn);
content = content.replace("MANAGE DESIGNATIONS</button>", "MANAGE DESIGNATIONS</button>" + otherBtns);

// Also add placeholders for rendering
const placeholderDef = "\n// Placeholder for missing tabs\nfunction PlaceholderTab({ title }: { title: string }) {\n  return (\n    <div className=\"flex flex-col items-center justify-center h-full opacity-50\">\n      <h2 className=\"text-2xl font-black text-slate-500 uppercase tracking-widest mb-2\">{title}</h2>\n      <p className=\"text-slate-400 uppercase tracking-wider text-sm\">Module in Development</p>\n    </div>\n  );\n}\n\n";

content = content.replace("function ManageUsers() {", placeholderDef + "function ManageUsers() {");

const placeholderRenders = "\n          {activeTab === 'edit_delete' && <PlaceholderTab title=\"Edit / Delete\" />}\n          {activeTab === 'set_target' && <PlaceholderTab title=\"Set User Target\" />}\n          {activeTab === 'upload_target' && <PlaceholderTab title=\"Upload Target\" />}\n          {activeTab === 'access_control' && <PlaceholderTab title=\"Access Control\" />}\n          {activeTab === 'user_devices' && <PlaceholderTab title=\"User Devices\" />}";

content = content.replace("{activeTab === 'ta_da' && <TADAManageTab />}", "{activeTab === 'ta_da' && <TADAManageTab />}" + placeholderRenders);

// Also the user said: "in xla page headers font need to be so big. it has to be equal with other font sizes used in entire page."
// Replace text-2xl with text-lg in h2 tags
content = content.replace(/text-2xl font-black/g, "text-lg font-bold");
content = content.replace(/text-xl font-black/g, "text-lg font-bold"); // Also tone down text-xl
content = content.replace(/text-lg font-black/g, "text-lg font-bold");

fs.writeFileSync('scratch/ManageUsers2.tsx', content, 'utf8');
console.log('Modified ManageUsers');
