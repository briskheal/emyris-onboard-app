const fs = require('fs');
let c = fs.readFileSync('scratch/cp.txt', 'utf8');

c = c.replace(
  'function CreateProfileTab({ isAdmin }: { isAdmin: boolean }) {',
  'function CreateProfileTab({ isAdmin, editUser, onBack }: { isAdmin: boolean, editUser?: any, onBack?: () => void }) {'
);

c = c.replace(
  "const [formData, setFormData] = useState<any>({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });",
  "const [formData, setFormData] = useState<any>(editUser || { gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });\n    useEffect(() => { if(editUser) setFormData(editUser); }, [editUser]);"
);

const oldSubmit = `const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const url = isAdmin ? '/api/admin/admins' : '/api/admin/users';
        const res = await axios.post(url, { ...formData, isAdmin });
        if (res.data.success) {
          if (sendEmail) {
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
              alert('Created successfully!');
          }
          setFormData({ gender: 'Male', hq: '', designation: '', division: '', reportingManager: '' });
        } else alert(res.data.message);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };`;

const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
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
    };`;

c = c.replace(oldSubmit, newSubmit);

c = c.replace(
  '<div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">',
  '{!editUser && <div className="mb-10 bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-xl">'
);
c = c.replace(
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\n          </div>',
  'Address, Aadhar, PAN, Employee Code, and ADOJ from the HR database.</p>\n          </div>}'
);

c = c.replace(
  '<h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">&lt; CREATE USER PROFILE</h2>',
  `<div className="flex items-center gap-4 mb-8">
          {editUser && onBack && (
            <button type="button" onClick={onBack} className="text-sky-400 hover:text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm transition-colors">
              <ArrowLeft size={16} /> Back to List
            </button>
          )}
          <h2 className="text-lg font-bold text-white tracking-wide uppercase">
            {editUser ? 'EDIT' : 'CREATE'} {isAdmin ? 'ADMIN' : 'USER'} PROFILE
          </h2>
        </div>`
);

c = c.replace(
  `<button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">{loading ? 'Submitting...' : 'Submit'}</button>`,
  `<button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">{loading ? (editUser ? 'Saving...' : 'Submitting...') : (editUser ? 'Save Changes' : 'Submit')}</button>`
);

fs.writeFileSync('scratch/cp_fixed.txt', c);
console.log('CreateProfileTab Patched!');
