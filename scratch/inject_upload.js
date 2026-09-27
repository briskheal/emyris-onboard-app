const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// Ensure xlsx is imported
if (!c.includes("import * as XLSX from 'xlsx';")) {
  c = c.replace("import axios from 'axios';", "import axios from 'axios';\nimport * as XLSX from 'xlsx';");
}

const uploadTargetComponent = `
function UploadTargetTab() {
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [selectedState, setSelectedState] = useState('');
  const [selectedHq, setSelectedHq] = useState('');
  const [targetType, setTargetType] = useState('Select...');

  useEffect(() => {
    fetchLocations();
    fetchProducts();
    fetchUsers();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get('/api/admin/locations');
      if (res.data.success) {
        setStates(res.data.states || []);
        setHqs(res.data.hqs || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products');
      if (res.data.success) {
        setProducts(res.data.products.filter((p: any) => !(p.productName || '').toLowerCase().includes('sample')));
      }
    } catch (e) { console.error(e); }
  };

  const handleDownloadFormat = () => {
    if (targetType === 'Select...') {
      alert('Please select a Target Type first.');
      return;
    }
    if (!selectedHq) {
      alert('Please select an HQ first to download the HQ-wise format.');
      return;
    }

    const hqUsers = users.filter(u => {
      const hqObj = hqs.find(h => h.hqName === selectedHq);
      return u.hq === selectedHq || (hqObj && u.hq === hqObj.uid);
    });

    if (hqUsers.length === 0) {
      alert('No users found in this HQ.');
      return;
    }

    let wsData = [];
    if (targetType === 'Lump-Sum') {
      wsData.push(['Employee UID', 'Employee Name', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']);
      hqUsers.forEach(u => {
        wsData.push([u.uid, u.firstName + ' ' + (u.lastName || ''), '', '', '', '', '', '', '', '', '', '', '', '']);
      });
    } else {
      wsData.push([
        'Employee UID', 'Employee Name', 'productName', 'ptr', 'pts', 'mrp', 'cus', 'uid',
        'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
      ]);
      
      hqUsers.forEach(u => {
        products.forEach(p => {
          wsData.push([
            u.uid, u.firstName + ' ' + (u.lastName || ''), p.productName, p.ptr, p.pts, p.mrp, 0, p.productId,
            '', '', '', '', '', '', '', '', '', '', '', ''
          ]);
        });
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Target Format');
    XLSX.writeFile(wb, \`Target_Upload_Format_\${selectedHq.replace(/\\s+/g, '_')}.xlsx\`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft size={20} /> UPLOAD TARGET
        </h2>
        <button onClick={handleDownloadFormat} className="text-sky-500 hover:text-sky-400 font-bold underline cursor-pointer">
          Download Format
        </button>
      </div>

      <div className="bg-emerald-600/20 border border-emerald-500/50 p-4 rounded-xl mb-8">
        <p className="text-emerald-400 font-bold text-sm">
          If for a particular user the target already exist for that month, then by uploading the targets for same user for the same month, the targets will get overridden.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select State</label>
          <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedHq(''); }} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select State</option>
            {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select HQ</label>
          <select value={selectedHq} onChange={e => setSelectedHq(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500">
            <option value="">Select HQ</option>
            {hqs.filter(h => h.state === selectedState || h.stateName === selectedState).map(h => (
              <option key={h._id} value={h.hqName}>{h.hqName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Target Type</label>
          <select value={targetType} onChange={e => setTargetType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500">
            <option value="Select...">Select...</option>
            <option value="Qty * Amount">Qty * Amount</option>
            <option value="Lump-Sum">Lump-Sum</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-rose-400 uppercase tracking-wider">Upload Excel *</label>
          <div className="bg-slate-900 border border-slate-700 rounded-lg flex items-center overflow-hidden">
            <input type="file" accept=".xlsx, .xls" className="text-sm text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer w-full" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-colors">
          Upload Targets
        </button>
      </div>
    </div>
  );
}

`;

c = c.replace('export default function ManageUsers() {', uploadTargetComponent + '\nexport default function ManageUsers() {');
c = c.replace('{activeTab === \'upload_target\' && <PlaceholderTab title="Upload Target" />}', '{activeTab === \'upload_target\' && <UploadTargetTab />}');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Upload Target Tab injected!');
