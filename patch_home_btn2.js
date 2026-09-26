const fs = require('fs');

function patch(filePath, targetPattern, replacement) {
    let f = fs.readFileSync(filePath, 'utf8');
    f = f.replace(targetPattern, replacement);
    fs.writeFileSync(filePath, f);
}

patch(
    'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx',
    /<button onClick=\{\(\) => navigate\(-1\)\} className="text-slate-300 hover:text-white transition-colors\\s+bg-\[\#27273f\] p-2 rounded-lg">\s*<ArrowLeft size=\{18\} \/>\s*<\/button>/g,
    `<div className="flex gap-2">
            <button onClick={() => navigate('/')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Home Dashboard">
              <Home size={18} />
            </button>
            <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg" title="Go Back">
              <ArrowLeft size={18} />
            </button>
          </div>`
);

patch(
    'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx',
    /<button onClick=\{\(\) => id \? navigate\(-1\) : navigate\('\/'\)\} className="text-slate-300 hover:text-white\\s+transition-colors bg-\[\#27273f\] p-2 rounded-lg">\s*<ArrowLeft size=\{18\} \/>\s*<\/button>/g,
    `<div className="flex gap-2">
            <button onClick={() => navigate('/')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Home Dashboard">
              <Home size={18} />
            </button>
            <button onClick={() => id ? navigate(-1) : navigate('/')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg" title="Go Back">
              <ArrowLeft size={18} />
            </button>
          </div>`
);
