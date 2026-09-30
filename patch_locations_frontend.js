const fs = require('fs');
let src = fs.readFileSync('xla-frontend/src/pages/ManageLocations.tsx', 'utf8');

// The new component to inject
const uploadTabCode = `
function UploadLocationTab() {
  const [uploadType, setUploadType] = React.useState('State');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleDownloadFormat = async () => {
    const { utils, writeFile } = await import('xlsx');
    let headers: string[] = [];
    let filename = '';

    if (uploadType === 'State') {
      headers = ['State Name'];
      filename = 'state_upload_format.xlsx';
    } else if (uploadType === 'Headquarter') {
      headers = ['HQ Name', 'State'];
      filename = 'hq_upload_format.xlsx';
    } else if (uploadType === 'CityOrArea') {
      headers = ['City Name', 'HQ', 'State', 'Area Type'];
      filename = 'city_upload_format.xlsx';
    } else if (uploadType === 'Route') {
      headers = ['From City', 'To City', 'HQ', 'State', 'Distance', 'Area Type'];
      filename = 'route_upload_format.xlsx';
    }

    const ws = utils.aoa_to_sheet([headers]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, filename);
  };

  const handleUpload = async () => {
    if (!uploadFile) return alert('Please select an Excel file.');
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', uploadType);
    
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/locations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert('Upload successful! Saved ' + res.data.count + ' records.');
      } else {
        alert('Upload failed: ' + res.data.message);
      }
    } catch (e: any) {
      alert('Error uploading file: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">
      <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">UPLOAD LOCATIONS</h2>
      
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl p-8 mb-8">
        <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-4xl bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          The UID is a system-generated unique identifier assigned to each entity (e.g. STE1, HQS1, CTY1, RTE1). These UIDs are automatically created by the system.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end max-w-4xl">
          <div>
            <label className="text-xs text-slate-400 font-bold mb-2 block">SELECT TYPE *</label>
            <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="State">State</option>
              <option value="Headquarter">Headquarter</option>
              <option value="CityOrArea">City / Area</option>
              <option value="Route">Route</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold mb-2 block">UPLOAD EXCEL *</label>
            <input type="file" accept=".xlsx,.csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30" />
          </div>
        </div>
        
        <div className="mt-8 flex justify-between items-center">
          <button onClick={handleUpload} disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2">Upload Data</button>
          <button onClick={handleDownloadFormat} className="text-emerald-400 font-semibold text-sm hover:underline border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/10 transition-colors">Download Format</button>
        </div>
      </div>
    </div>
  );
}

`;

// 1. Inject UploadLocationTab component right before ManageLocations export
src = src.replace('export default function ManageLocations() {', uploadTabCode + 'export default function ManageLocations() {');

// 2. Add 'upload' to the activeTab state union
src = src.replace("const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route'>('city');", "const [activeTab, setActiveTab] = useState<'state' | 'hq' | 'city' | 'route' | 'upload'>('city');");
// Handle potential React.useState
src = src.replace("const [activeTab, setActiveTab] = React.useState<'state' | 'hq' | 'city' | 'route'>('city');", "const [activeTab, setActiveTab] = React.useState<'state' | 'hq' | 'city' | 'route' | 'upload'>('city');");

// 3. Add the sidebar button
const sidebarBtnTarget = `            <button 
              onClick={() => setActiveTab('route')} 
              className={\`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all \${activeTab === 'route' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}\`}
            >
              CREATE ROUTE
            </button>`;
const sidebarBtnReplacement = sidebarBtnTarget + `\n            <button 
              onClick={() => setActiveTab('upload')} 
              className={\`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all \${activeTab === 'upload' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}\`}
            >
              UPLOAD LOCATIONS
            </button>`;
src = src.replace(sidebarBtnTarget, sidebarBtnReplacement);

// 4. Add the component rendering
const renderTarget = `{activeTab === 'route' && <RouteTab />}`;
const renderReplacement = `{activeTab === 'route' && <RouteTab />}\n          {activeTab === 'upload' && <UploadLocationTab />}`;
src = src.replace(renderTarget, renderReplacement);

fs.writeFileSync('xla-frontend/src/pages/ManageLocations.tsx', src);
console.log('Patched ManageLocations.tsx with UploadLocationTab');
