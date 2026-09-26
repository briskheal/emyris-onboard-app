const fs = require('fs');
const lines = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8').split('\n');

const replacement = `<td className="border-r border-slate-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p._id, p.isAdmin)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2" title="Delete User">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>`;

lines.splice(1062, 5, replacement);
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', lines.join('\n'));
console.log('Spliced exactly 5 lines!');
