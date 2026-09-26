const fs = require('fs');

function patchFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Add Home to lucide-react imports if it's not there
    if (!content.includes(', Home')) {
        content = content.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+'lucide-react';/, (match, p1) => {
            if (!p1.includes('Home')) {
                return `import { ${p1}, Home } from 'lucide-react';`;
            }
            return match;
        });
    }

    // Insert the Home button next to the back button
    // It looks like:
    // <button onClick={() => ...navigate...} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
    //   <ArrowLeft size={18} />
    // </button>
    // <h1 ...>
    
    // Primary Sales replacement
    if (filePath.includes('PrimarySales.tsx')) {
        const target = `<button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
              <ArrowLeft size={18} />
            </button>`;
        const replacement = `<div className="flex gap-2">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Dashboard">
                <Home size={18} />
              </button>
              <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg" title="Go Back">
                <ArrowLeft size={18} />
              </button>
            </div>`;
        
        // Remove old buttons first in case of retries
        content = content.replace(target, replacement);
    }

    // Secondary Sales replacement
    if (filePath.includes('SecondarySales.tsx')) {
        const target = `<button onClick={() => id ? navigate(-1) : navigate('/')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
              <ArrowLeft size={18} />
            </button>`;
        const replacement = `<div className="flex gap-2">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Dashboard">
                <Home size={18} />
              </button>
              <button onClick={() => id ? navigate(-1) : navigate('/')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg" title="Go Back">
                <ArrowLeft size={18} />
              </button>
            </div>`;
        content = content.replace(target, replacement);
    }

    fs.writeFileSync(filePath, content);
}

patchFile('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx');
patchFile('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx');

console.log('Patched Home buttons!');
