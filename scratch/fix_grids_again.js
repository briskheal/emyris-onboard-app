const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// Replace Personal Details block entirely to fix the grid mess
const regexPersonal = /<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Personal Details<\/h3>[\s\S]*?<\/div>\s*<\/div>/;

const replacementPersonal = `<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-4 border-b border-slate-700 pb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">FIRST NAME *</label><input required name="firstName" value={formData.firstName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MIDDLE NAME</label><input name="middleName" value={formData.middleName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">LAST NAME</label><input name="lastName" value={formData.lastName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">GENDER</label><select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">PHONE NUMBER *</label><input required name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" /></div>
          </div>
        </div>`;

c = c.replace(regexPersonal, replacementPersonal);

// Also reduce bottom margin of sections from mb-10 to mb-6 to tighten spacing
c = c.replace(/mb-10/g, 'mb-6');
c = c.replace(/mb-6 border-b/g, 'mb-4 border-b'); // tighten header gap too

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed grids layout');
