const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  "{activeTab === 'edit_delete' && !editingRecord && <EditDeleteTabComponent onEdit={(record: any, type: string) => { setEditingRecord(record); setEditingType(type); }} doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />}",
  "<div className=\"flex-1 w-full\" style={{ display: (activeTab === 'edit_delete' && !editingRecord) ? 'flex' : 'none' }}>\n        <EditDeleteTabComponent onEdit={(record: any, type: string) => { setEditingRecord(record); setEditingType(type); }} doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />\n      </div>"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Wrapped EditDeleteTabComponent to preserve state');
