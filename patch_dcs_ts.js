const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

const lines = c.split(/\r?\n/);
const idx = lines.findIndex(l => l.includes("activeTab === 'edit_delete' && !editingRecord") && l.includes("display:"));

if (idx !== -1) {
    const replacement = `      {activeTab === 'edit_delete' && !editingRecord && (
        <div className="flex-1 min-w-0" style={{ display: 'flex' }}>
          <EditDeleteTabComponent onEdit={(record: any, type: string) => { setEditingRecord(record); setEditingType(type); }} doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />
        </div>
      )}`;
    
    // Replace the 3 lines starting at idx
    lines.splice(idx, 5, replacement); // Need to check how many lines I injected last time
    // Wait, last time I injected 5 lines into the file, replacing 3. Let's just use string replace.
}
