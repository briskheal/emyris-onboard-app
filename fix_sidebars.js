const fs = require('fs');

const files = ['xla-frontend/src/pages/ManageAllowances.tsx', 'xla-frontend/src/pages/ManageDCS.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the small back button in the sidebar with a matching bold version
    content = content.replace(/font-bold text-sm uppercase tracking-wider">[\s\S]*?<ArrowLeft size={18} \/> Back to Admin Panel/g, 'font-black text-xl uppercase tracking-widest text-sky-400 hover:text-white">\n              <ArrowLeft size={24} /> BACK TO ADMIN MENU');

    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed sidebars in Allowances and DCS!');
