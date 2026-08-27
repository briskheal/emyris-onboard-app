const fs = require('fs');

const files = ['xla-frontend/src/pages/ManageAllowances.tsx', 'xla-frontend/src/pages/ManageDCS.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the specific text block
    content = content.replace(/font-bold text-sm uppercase tracking-wider\">\s*<ArrowLeft size={18} \/> Back to Admin Panel/g, 'font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors\">\n              <ArrowLeft size={24} /> BACK TO ADMIN MENU');

    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed sidebars properly!');
