const fs = require('fs');

const orig = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const cpTxt = fs.readFileSync('scratch/cp.txt', 'utf8');
const cpFixed = fs.readFileSync('scratch/cp_fixed.txt', 'utf8');

let newOrig = orig.replace(cpTxt, cpFixed);

const edTxt = fs.readFileSync('scratch/ed.txt', 'utf8');

const start = edTxt.indexOf('if (editUser) {');
const end = edTxt.indexOf('return (', start + 1);

const newIf = `if (editUser) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl mx-auto p-4">
        <CreateProfileTab isAdmin={editUser.isAdmin} editUser={editUser} onBack={() => { setEditUser(null); fetchProfiles(); }} />
      </div>
    );
  }

  `;

const edFixed = edTxt.substring(0, start) + newIf + edTxt.substring(end);
newOrig = newOrig.replace(edTxt, edFixed);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', newOrig);
console.log('ManageUsers.tsx fully patched!');
