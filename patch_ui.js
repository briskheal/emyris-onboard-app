const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix address properties in ViewUserOverlay and EditDeleteTab
code = code.replace(/viewUser\.address1/g, 'viewUser.streetAddress1');
code = code.replace(/viewUser\.address2/g, 'viewUser.streetAddress2');
code = code.replace(/editUser\.address1/g, 'editUser.streetAddress1');
code = code.replace(/editUser\.address2/g, 'editUser.streetAddress2');

// 2. Add Password to ViewUserOverlay
const viewEmailHtml = \<div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">EMAIL ADDRESS</p>
                <p className="text-sky-400 font-bold break-all">{viewUser.email || '-'}</p>
              </div>\;
const viewPassHtml = viewEmailHtml + \
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">PASSWORD</p>
                <p className="text-amber-400 font-mono font-bold break-all">{viewUser.password || '-'}</p>
              </div>\;
code = code.replace(viewEmailHtml, viewPassHtml);

// 3. Add Password to EditDeleteTab (Read Only Form)
const editEmailHtml = \<div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Email *</label>
                <input type="email" value={editUser.email || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none" />
              </div>\;
const editPassHtml = editEmailHtml + \
              <div>
                <label className="text-sm text-slate-400 font-bold mb-2 block uppercase">Password</label>
                <input type="text" value={editUser.password || ''} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-amber-400 font-mono focus:outline-none" />
              </div>\;
code = code.replace(editEmailHtml, editPassHtml);

// 4. Update CreateProfileTab with Checkbox and alert
const stateInsert = "const [loading, setLoading] = useState(false);";
const newState = stateInsert + "\n  const [sendEmail, setSendEmail] = useState(true);";
code = code.replace(stateInsert, newState);

const submitStart = "if (res.data.success) {\n        alert('Created successfully!');";
const newSubmit = \if (res.data.success) {
        if (sendEmail && formData.email && formData.password) {
            alert(\LOGIN CREDENTIALS SHARED TO EMPLOYEE!\\n\\nCOMPANY NAME: EMYRIS\\nEMAIL ID: \\\nPW: \\\n\\nThese 3 are required to login to emyrishr.in/xl mobile portal.\);
        } else {
            alert('Created successfully!');
        }\;
code = code.replace(submitStart, newSubmit);

const buttonInsert = '<button type="submit" disabled={loading} className="w-full bg-emerald-500';
const newButton = \<div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <input type="checkbox" id="sendEmail" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-5 h-5 accent-sky-500 cursor-pointer" />
          <label htmlFor="sendEmail" className="text-sm font-bold text-sky-400 cursor-pointer select-none tracking-wide">
            Send Login Details to Employee's Email ?
          </label>
        </div>
        \ + buttonInsert;
code = code.replace(buttonInsert, newButton);

fs.writeFileSync(file, code);
console.log('UI updated successfully!');
