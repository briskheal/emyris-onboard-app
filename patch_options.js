const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/<option value="PTS">PTS<\/option>/g, '<option value="PTS" className="bg-[#1e2032] text-white">PTS</option>');
c = c.replace(/<option value="PTR">PTR<\/option>/g, '<option value="PTR" className="bg-[#1e2032] text-white">PTR</option>');
c = c.replace(/<option value="MRP">MRP<\/option>/g, '<option value="MRP" className="bg-[#1e2032] text-white">MRP</option>');
c = c.replace(/<option value="CUS">CUS<\/option>/g, '<option value="CUS" className="bg-[#1e2032] text-white">CUS</option>');

fs.writeFileSync(path, c);
console.log('Fixed options');
