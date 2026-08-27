const fs = require('fs');
const path = require('path');

const dir = 'xla-frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Manage') && f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix navigate(-1) to go to /admin
    content = content.replace(/navigate\(-1\)/g, "navigate('/admin')");
    
    // Remove the fake &lt; arrow from headers
    content = content.replace(/&lt;\s+/g, "");
    content = content.replace(/&lt;/g, "");

    // Upgrade the top bar back button size to make it bold and beautiful
    content = content.replace(/font-bold text-lg tracking-wide uppercase">Back to Admin Menu/g, 'font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU');

    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed headers in ' + files.length + ' files!');
