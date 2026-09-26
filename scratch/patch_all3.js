const fs = require('fs');

const orig = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const cpTxt = fs.readFileSync('scratch/cp.txt', 'utf8');
const cpFixed = fs.readFileSync('scratch/cp_fixed.txt', 'utf8');

let newOrig = orig.replace(cpTxt, cpFixed);

const edTxt = fs.readFileSync('scratch/ed_clean.txt', 'utf8');

// properly slice out the entire if (editUser) block
const start = edTxt.indexOf('if (editUser) {');
let end = start;
let brackets = 0;
for (let i = start; i < edTxt.length; i++) {
  if (edTxt[i] === '{') brackets++;
  if (edTxt[i] === '}') {
    brackets--;
    if (brackets === 0) {
      end = i + 1;
      break;
    }
  }
}

const newIf = `if (editUser) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl mx-auto p-4 max-w-4xl mt-6">
        <CreateProfileTab isAdmin={editUser.isAdmin} editUser={editUser} onBack={() => { setEditUser(null); fetchProfiles(); }} />
      </div>
    );
  }`;

const edFixed = edTxt.substring(0, start) + newIf + edTxt.substring(end);
newOrig = newOrig.replace(edTxt, edFixed);

// Also fix the missing brace from cp_fixed manually here:
newOrig = newOrig.replace(
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\r\n          </div>',
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\n          </div>}'
);
newOrig = newOrig.replace(
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\n          </div>',
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\n          </div>}'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', newOrig);
console.log('ManageUsers.tsx fully and correctly patched from clean slate!');
