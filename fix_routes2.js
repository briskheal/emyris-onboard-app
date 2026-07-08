const fs = require('fs');

// Fix admin.js
let admin = fs.readFileSync('routes/admin.js', 'utf8');

// Fix double-prefixed routes like router.post('/api/admin/...) -> router.post('/...
admin = admin.replace(/router\.(get|post|put|delete|patch)\(['"]\/api\/admin\//g, "router.$1('/");
admin = admin.replace(/router\.(get|post|put|delete|patch)\(['"]\/api\/applicant\//g, "router.$1('/");

// Fix the broken save-template route - missing closing }); before next route
// The issue: line 916 has `}` but it's missing `});` to close the route handler
// Find the pattern: the inner try block ends, then there's a bare } on its own line, then next router.
admin = admin.replace(
    /(\s+}\s*\/\/ Save to History\s+try \{[\s\S]*?}\s*catch[\s\S]*?}\s*)\n(\s*)}\n(\n*router\.)/g,
    '$1\n    } catch(outerErr) { console.error(outerErr); res.status(500).json({success:false}); }\n});\n\n$3'
);

fs.writeFileSync('routes/admin.js', admin);

// Fix applicant.js too
let applicant = fs.readFileSync('routes/applicant.js', 'utf8');
applicant = applicant.replace(/router\.(get|post|put|delete|patch)\(['"]\/api\/applicant\//g, "router.$1('/");
applicant = applicant.replace(/router\.(get|post|put|delete|patch)\(['"]\/api\/admin\//g, "router.$1('/");
fs.writeFileSync('routes/applicant.js', applicant);

console.log('Double-prefix routes fixed!');
