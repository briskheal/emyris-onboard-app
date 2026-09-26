const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

f = f.replace(
    'className="border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors ${[\'Primary Sales\', \'Secondary Sales\'].includes(selectedModule) ? \'cursor-pointer\' : \'\'}"',
    'className={`border-b border-[#3b3b5a] hover:bg-[#27273f]/30 transition-colors ${[\'Primary Sales\', \'Secondary Sales\'].includes(selectedModule) ? \'cursor-pointer\' : \'\'}`}'
);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('Fixed');
