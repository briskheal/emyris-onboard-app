const fs = require('fs');

const files = [
    'xla-frontend/src/components/CallPlanApproval.tsx',
    'xla-frontend/src/components/TourProgramApproval.tsx'
];

files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/className="flex-1 /g, 'className="flex-1 min-w-0 ');
    code = code.replace(/className="flex-1"/g, 'className="flex-1 min-w-0"');
    code = code.replace(/flex-1 min-w-0 min-w-0/g, 'flex-1 min-w-0');
    fs.writeFileSync(file, code);
    console.log(`Applied min-w-0 to ${file}`);
});
