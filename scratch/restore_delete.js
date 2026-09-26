const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// 1. Add handleDelete back to EditDeleteTab
const handleDeleteFunc = `
  const handleDelete = async (id: string, isAdmin: boolean) => {
    if (!window.confirm('Are you sure you want to completely delete this user?')) return;
    try {
      const url = isAdmin ? \`/api/admin/admins/\${id}\` : \`/api/admin/users/\${id}\`;
      const res = await axios.delete(url);
      if (res.data.success) {
        fetchProfiles();
      } else {
        alert(res.data.message || 'Failed to delete user');
      }
    } catch (e) { alert('Failed to delete user'); }
  };
`;

c = c.replace(
  'const paginated = filteredProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);',
  handleDeleteFunc + '\n  const paginated = filteredProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);'
);

// 2. Add the delete button to the table row
const oldTableCell = `<td className="border-r border-slate-700 p-4 text-center">
                    <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto">
                      <Edit size={14} /> Edit
                    </button>
                  </td>`;

const newTableCell = `<td className="border-r border-slate-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditUser(p)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p._id, p.isAdmin)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2" title="Delete User">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>`;

c = c.replace(oldTableCell, newTableCell);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Delete logic restored!');
