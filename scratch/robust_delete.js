const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  /<td className="border-r border-slate-700 p-4 text-center">[\s\S]*?<button onClick=\{\(\) => setEditUser\(p\)\}[\s\S]*?<Edit size=\{14\} \/> Edit[\s\S]*?<\/button>[\s\S]*?<\/td>/g,
  `<td className="border-r border-slate-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p._id, p.isAdmin)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2" title="Delete User">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>`
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Regex replace succeeded!');
