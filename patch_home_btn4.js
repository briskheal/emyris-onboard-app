const fs = require('fs');

function patch(filePath) {
    let f = fs.readFileSync(filePath, 'utf8');
    
    // Add Home to import
    if (!f.includes(', Home')) {
        f = f.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+'lucide-react';/, (match, p1) => {
            if (!p1.includes('Home')) {
                return "import { " + p1 + ", Home } from 'lucide-react';";
            }
            return match;
        });
    }

    // Insert button after <div className="flex items-center gap-4">
    const searchStr = '<div className="flex items-center gap-4">';
    const replacementStr = '<div className="flex items-center gap-4">\n            <button onClick={() => navigate(\'/\')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Dashboard">\n              <Home size={18} />\n            </button>';
            
    if (f.includes(searchStr) && !f.includes('<Home size={18} />')) {
        f = f.replace(searchStr, replacementStr);
        fs.writeFileSync(filePath, f);
        console.log("Patched " + filePath);
    } else {
        console.log("Could not patch " + filePath);
    }
}

patch('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx');
patch('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx');
