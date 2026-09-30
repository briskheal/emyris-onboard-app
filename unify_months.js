const fs = require('fs');
const glob = require('glob');

function replaceMonths(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Replace full month arrays with short month arrays
    const fullMonthsStr = "['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']";
    const shortMonthsStr = "['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']";
    
    c = c.replace(/\[['"]January['"],\s*['"]February['"],\s*['"]March['"],\s*['"]April['"],\s*['"]May['"],\s*['"]June['"],\s*['"]July['"],\s*['"]August['"],\s*['"]September['"],\s*['"]October['"],\s*['"]November['"],\s*['"]December['"]\]/gi, shortMonthsStr);
    
    // Also Dashboard specific array
    c = c.replace(/\["January","February","March","April","May","June","July","August","September","October","November","December"\]/gi, '["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]');
    
    fs.writeFileSync(filePath, c);
}

const files = glob.sync('{xla-frontend/src/**/*.tsx,xl-frontend/src/**/*.tsx,routes/**/*.js}');
files.forEach(f => {
    replaceMonths(f);
});
console.log('Replaced month arrays with short versions');
