const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const regexRow = /<div className="text-slate-200 font-bold text-sm">\{t.userName\}<\/div>[\s\S]*?<\/td>/;

const replacementRow = `<div className="text-slate-200 text-sm">{t.userName}</div>
                        {t.designation && <div className="text-xs text-slate-400 font-light mt-1">{t.designation}</div>}
                      </td>`;

c = c.replace(regexRow, replacementRow);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed Yearly Row Render');
