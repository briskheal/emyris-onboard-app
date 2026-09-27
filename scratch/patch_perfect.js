const fs = require('fs');

const orig = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// 1. Find boundaries
function findFuncBounds(code, funcName) {
  const lines = code.split('\n');
  const startLine = lines.findIndex(l => l.includes('function ' + funcName));
  const braceStartLine = lines.findIndex((l, i) => i >= startLine && l.includes('{'));
  
  let endLine = braceStartLine;
  let brackets = 0;
  for (let i = braceStartLine; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
      if (lines[i][j] === '{') brackets++;
      if (lines[i][j] === '}') brackets--;
    }
    if (brackets === 0) {
      endLine = i;
      break;
    }
  }
  return { startLine, endLine };
}

let cpBounds = findFuncBounds(orig, 'CreateProfileTab');
let edBounds = findFuncBounds(orig, 'EditDeleteTab');

// Write the original CreateProfileTab to a temporary file
const origLines = orig.split('\n');
const cpLines = origLines.slice(cpBounds.startLine, cpBounds.endLine + 1);

// Modify CreateProfileTab line by line
let newCpLines = [];
let insideHRBlock = false;
for (let i = 0; i < cpLines.length; i++) {
  let line = cpLines[i];
  
  if (line.includes('function CreateProfileTab({ isAdmin }: { isAdmin: boolean }) {')) {
    line = 'function CreateProfileTab({ isAdmin, editUser, onBack }: { isAdmin: boolean, editUser?: any, onBack?: () => void }) {';
  }
  if (line.includes("const [formData, setFormData] = useState<any>({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });")) {
    line = "const [formData, setFormData] = useState<any>(editUser || { gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });\n    useEffect(() => { if (editUser) setFormData(editUser); }, [editUser]);";
  }
  
  if (line.includes('<div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">')) {
    line = '{!editUser && <div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">';
    insideHRBlock = true;
  }
  
  if (insideHRBlock && line.includes('ADOJ from the HR database.</p>')) {
    // next line is </div>, we append } to it
    newCpLines.push(line);
    newCpLines.push(cpLines[i+1].replace('</div>', '</div>}'));
    insideHRBlock = false;
    i++; // skip next line since we handled it
    continue;
  }
  
  if (line.includes('<h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; CREATE USER PROFILE</h2>')) {
    line = `<div className="flex items-center gap-4 mb-8">
          {editUser && onBack && (
            <button type="button" onClick={onBack} className="text-sky-400 hover:text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm transition-colors">
              <ArrowLeft size={16} /> Back to List
            </button>
          )}
          <h2 className="text-lg font-bold text-white tracking-wide uppercase">
            {editUser ? 'EDIT' : 'CREATE'} {isAdmin ? 'ADMIN' : 'USER'} PROFILE
          </h2>
        </div>`;
  }
  
  if (line.includes(`{loading ? 'Submitting...' : 'Submit'}</button>`)) {
    line = line.replace(`{loading ? 'Submitting...' : 'Submit'}`, `{loading ? (editUser ? 'Saving...' : 'Submitting...') : (editUser ? 'Save Changes' : 'Submit')}`);
  }
  
  if (line.includes("const handleSubmit = async (e: React.FormEvent) => {")) {
    // skip until closing brace of handleSubmit
    let j = i;
    let submitBrackets = 0;
    while (j < cpLines.length) {
      for (let char of cpLines[j]) {
        if (char === '{') submitBrackets++;
        if (char === '}') submitBrackets--;
      }
      if (submitBrackets === 0) break;
      j++;
    }
    
    // Replace with new handleSubmit
    newCpLines.push(`const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const payload = { ...formData, isAdmin };
        let res;
        if (editUser) {
            const url = isAdmin ? \`/api/admin/admins/\${editUser._id}\` : \`/api/admin/users/\${editUser._id}\`;
            res = await axios.put(url, payload);
        } else {
            const url = isAdmin ? '/api/admin/admins' : '/api/admin/users';
            res = await axios.post(url, payload);
        }
        
        if (res.data.success) {
            if (sendEmail && !editUser) {
                try {
                    await axios.post('/api/admin/send-credentials', {
                        email: formData.email,
                        password: formData.password,
                        name: formData.firstName
                    });
                    alert('Created successfully! Credentials sent to email.');
                } catch(e) {
                    alert('Created successfully, but failed to send email.');
                }
            } else {
                alert(editUser ? 'Updated successfully!' : 'Created successfully!');
            }
            if (editUser && onBack) {
                onBack();
            } else {
                setFormData({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });
            }
        } else alert(res.data.message);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };`);
    
    i = j;
    continue;
  }
  
  newCpLines.push(line);
}

// Modify EditDeleteTab line by line
let edLines = origLines.slice(edBounds.startLine, edBounds.endLine + 1);
let newEdLines = [];
let skipEdOldEditBlock = false;

for (let i = 0; i < edLines.length; i++) {
  let line = edLines[i];
  
  if (line.includes('if (editUser) {')) {
    // Add our new block
    newEdLines.push(`  if (editUser) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl mx-auto p-4 max-w-4xl mt-6">
        <CreateProfileTab isAdmin={editUser.isAdmin} editUser={editUser} onBack={() => { setEditUser(null); fetchProfiles(); }} />
      </div>
    );
  }`);
    
    // Skip everything until the return ( of the table layout!
    // The table layout return is: `return (` then `<div className="max-w-full">`
    let j = i;
    while (j < edLines.length) {
      if (edLines[j].includes('return (') && edLines[j+1] && edLines[j+1].includes('<div className="max-w-full">')) {
        break;
      }
      j++;
    }
    i = j - 1;
    continue;
  }
  
  newEdLines.push(line);
}

// Assemble final file
const finalLines = [
  ...origLines.slice(0, cpBounds.startLine),
  ...newCpLines,
  ...origLines.slice(cpBounds.endLine + 1, edBounds.startLine),
  ...newEdLines,
  ...origLines.slice(edBounds.endLine + 1)
];

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', finalLines.join('\n'));
console.log('Patch complete!');
