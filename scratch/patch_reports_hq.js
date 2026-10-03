const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');

function patchRoute(code, routeName, modelName, hqField) {
  const regex = new RegExp(`router\\.get\\('/reports/${routeName}', async \\(req, res\\) => \\{\\s*try \\{\\s*const \\{ employeeId \\} = req\\.query;\\s*let where = \\{\\};\\s*if \\(employeeId\\) where\\.employeeId = employeeId;`);
  
  const replacement = `router.get('/reports/${routeName}', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) {
            const user = await XlUser.findOne({ where: { employeeId } });
            if (user && user.hq) {
                where.${hqField} = user.hq;
            } else {
                where.employeeId = employeeId;
            }
        }`;
        
  if (code.match(regex)) {
    return code.replace(regex, replacement);
  } else {
    console.log('Could not match regex for ' + routeName);
    return code;
  }
}

code = patchRoute(code, 'doctors', 'XlDoctor', 'headquarter');
code = patchRoute(code, 'chemists', 'XlChemist', 'headquarter');
code = patchRoute(code, 'stockists', 'XlStockist', 'headquarter');
code = patchRoute(code, 'routes', 'XlRoute', 'hq');

fs.writeFileSync('routes/xl.js', code);
console.log('Patched routes for HQ-based filtering');
