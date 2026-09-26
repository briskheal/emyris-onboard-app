const fs = require('fs');

const files = [
    'xla-frontend/src/pages/ManageAllowances.tsx',
    'xla-frontend/src/pages/ManageLocations.tsx',
    'xla-frontend/src/pages/ManageProducts.tsx',
    'xla-frontend/src/pages/ManageDCS.tsx'
];

files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    
    // Convert 'flex-1 ' to 'flex-1 min-w-0 ' in all these files to prevent flexbox overflow squeezing
    code = code.replace(/className="flex-1 /g, 'className="flex-1 min-w-0 ');
    
    // Some might be 'className="flex-1"'
    code = code.replace(/className="flex-1"/g, 'className="flex-1 min-w-0"');

    // Remove duplicates if already applied
    code = code.replace(/flex-1 min-w-0 min-w-0/g, 'flex-1 min-w-0');
    
    // Specific fix for the top grid row in ManageDCS
    // <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
    // Sometimes grid gap + padding causes overflow if container isn't min-w-0
    
    fs.writeFileSync(file, code);
    console.log(`Applied min-w-0 to ${file}`);
});
