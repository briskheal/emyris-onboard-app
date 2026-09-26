// SET TARGET TAB
function SetTargetTab() {
  const [activeSubTab, setActiveSubTab] = useState<'main' | 'monthly' | 'yearly'>('main');
  const [targetUser, setTargetUser] = useState<any>(null); // the user we are assigning a target to
  
  // Data
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]); // for monthly/yearly views
  
  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedHq, setSelectedHq] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Add Target Form State
  const [targetType, setTargetType] = useState('Select...');
  const [lumpSumAmount, setLumpSumAmount] = useState('');
  const [productTargets, setProductTargets] = useState<any[]>([]);

  // Fetch Base Data
  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, []);

  const fetchLocations = async () => {
    try {
      const [stRes, hqRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/hqs')
      ]);
      if (stRes.data.success) setStates(stRes.data.states);
      if (hqRes.data.success) setHqs(hqRes.data.hqs);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (e) { console.error(e); }
  };

  const handleFilterUsers = async () => {
    try {
      const [adminsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/admins'),
        axios.get('/api/admin/users')
      ]);
      let all: any[] = [];
      if (adminsRes.data.success) all = [...all, ...adminsRes.data.admins.map((x:any)=>({...x, isAdmin: true}))];
      if (usersRes.data.success) all = [...all, ...usersRes.data.users.map((x:any)=>({...x, isAdmin: false}))];
      
      // filter by HQ
      if (selectedHq) {
        all = all.filter(u => u.hq === selectedHq);
      }
      setUsers(all);
    } catch (e) { console.error(e); }
  };

  const handleOpenTargetForm = (user: any) => {
    setTargetUser(user);
    setTargetType('Select...');
    setLumpSumAmount('');
    const initialProducts = products.map(p => ({
      productId: p._id,
      productName: p.productName,
      ptr: p.ptr || 0,
      mrp: p.mrp || 0,
      pts: p.pts || 0,
      priceType: 'PTR',
      customPrice: 0,
      qty: '',
      amount: 0
    }));
    setProductTargets(initialProducts);
  };

  const handleProductTargetChange = (idx: number, field: string, value: any) => {
    const updated = [...productTargets];
    updated[idx][field] = value;
    
    // Recalculate amount
    let priceUsed = 0;
    if (updated[idx].priceType === 'MRP') priceUsed = updated[idx].mrp;
    else if (updated[idx].priceType === 'PTS') priceUsed = updated[idx].pts;
    else if (updated[idx].priceType === 'PTR') priceUsed = updated[idx].ptr;
    else priceUsed = updated[idx].customPrice || 0;

    updated[idx].amount = (parseFloat(updated[idx].qty) || 0) * priceUsed;
    setProductTargets(updated);
  };

  const calculateTotalProductAmount = () => {
    return productTargets.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const handleSaveTarget = async () => {
    if (!selectedMonth || !selectedYear) return alert('Select Month and Year');
    if (targetType === 'Select...') return alert('Select Target Type');
    
    const payload = {
      employeeId: targetUser.uid,
      userName: \`\${targetUser.firstName || ''} \${targetUser.lastName || ''}\`.trim(),
      month: selectedMonth,
      year: selectedYear,
      allocationType: targetType,
      lumpSumAmount: targetType === 'Lump-Sum' ? parseFloat(lumpSumAmount) || 0 : 0,
      productTargets: targetType === 'Qty * Amount' ? productTargets.filter(p => p.qty > 0) : [],
      totalProductAmount: targetType === 'Qty * Amount' ? calculateTotalProductAmount() : 0
    };

    try {
      const res = await axios.post('/api/admin/targets', payload);
      if (res.data.success) {
        alert('Target Saved Successfully');
        setTargetUser(null);
      } else {
        alert(res.data.message);
      }
    } catch (e) { alert('Error saving target'); }
  };

  const fetchTargets = async () => {
    if (!selectedMonth || !selectedYear) return;
    try {
      const res = await axios.get(\`/api/admin/targets/rollup?month=\${selectedMonth}&year=\${selectedYear}\`);
      if (res.data.success) {
        setTargets(res.data.targets);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!window.confirm('Delete this target?')) return;
    try {
      await axios.delete(\`/api/admin/targets/\${id}\`);
      fetchTargets();
    } catch(e) {}
  };

  // --- RENDERS ---

  if (targetUser) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl p-8 max-w-5xl mx-auto">
        <button onClick={() => setTargetUser(null)} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
          <ArrowLeft size={16} /> SET TARGET FOR {targetUser.firstName} {targetUser.lastName}
        </button>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
              <option value="">Select Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select Target Type</label>
            <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
              <option value="Select...">Select...</option>
              <option value="Qty * Amount">Qty * Amount</option>
              <option value="Lump-Sum">Lump-Sum</option>
            </select>
          </div>
        </div>

        {targetType === 'Lump-Sum' && (
          <div className="mb-8 w-1/3">
            <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Lump-Sum Amount</label>
            <input type="number" value={lumpSumAmount} onChange={e => setLumpSumAmount(e.target.value)} placeholder="Enter Amount" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
          </div>
        )}

        {targetType === 'Qty * Amount' && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Product Details</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="p-4 border-r border-slate-700">Sr no.</th>
                    <th className="p-4 border-r border-slate-700">Product Name</th>
                    <th className="p-4 border-r border-slate-700">PTR</th>
                    <th className="p-4 border-r border-slate-700">Price Used</th>
                    <th className="p-4 border-r border-slate-700">Quantity</th>
                    <th className="p-4 text-center">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {productTargets.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-slate-800/50">
                      <td className="p-4 border-r border-slate-700">{idx + 1}</td>
                      <td className="p-4 border-r border-slate-700">{p.productName}</td>
                      <td className="p-4 border-r border-slate-700">{p.ptr}</td>
                      <td className="p-4 border-r border-slate-700 flex items-center gap-2">
                        <select value={p.priceType} onChange={e => handleProductTargetChange(idx, 'priceType', e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-1 text-xs text-white">
                          <option value="MRP">MRP ({p.mrp})</option>
                          <option value="PTS">PTS ({p.pts})</option>
                          <option value="PTR">PTR ({p.ptr})</option>
                          <option value="CUSTOM">CUSTOM</option>
                        </select>
                        {p.priceType === 'CUSTOM' && (
                           <input type="number" placeholder="0" value={p.customPrice} onChange={e => handleProductTargetChange(idx, 'customPrice', e.target.value)} className="w-16 bg-slate-900 border border-slate-600 p-1 text-xs text-white rounded" />
                        )}
                      </td>
                      <td className="p-4 border-r border-slate-700">
                        <input type="number" min="0" placeholder="0" value={p.qty} onChange={e => handleProductTargetChange(idx, 'qty', e.target.value)} className="w-20 bg-slate-900 border border-slate-700 p-2 text-white rounded" />
                      </td>
                      <td className="p-4 text-center text-emerald-400 font-bold">
                        {p.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4 font-bold text-lg text-emerald-400">
              Total Amount: {calculateTotalProductAmount().toFixed(2)}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSaveTarget} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-colors">
            <Check size={18} /> Allot Target
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">
      
      {activeSubTab === 'main' && (
        <>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select State</label>
              <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedHq(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                <option value="">Select State</option>
                {states.map(s => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select HQ</label>
                <select value={selectedHq} onChange={e => setSelectedHq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white disabled:opacity-50" disabled={!selectedState}>
                  <option value="">Select Headquarter</option>
                  {hqs.filter(h => h.stateName === selectedState).map(h => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
                </select>
              </div>
              <button onClick={handleFilterUsers} className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                Filter
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveSubTab('monthly')} className="bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 border border-indigo-500/50 px-6 py-2 rounded-full font-bold transition-colors">Monthly Targets</button>
            <button onClick={() => setActiveSubTab('yearly')} className="bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 border border-indigo-500/50 px-6 py-2 rounded-full font-bold transition-colors">Yearly Targets</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-4 border-r border-slate-700">Sr no.</th>
                  <th className="p-4 border-r border-slate-700">Name</th>
                  <th className="p-4 border-r border-slate-700">Designation</th>
                  <th className="p-4 border-r border-slate-700">Headquarter</th>
                  <th className="p-4 border-r border-slate-700">Division</th>
                  <th className="p-4 text-center">Add Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u, i) => (
                  <tr key={u._id} className="hover:bg-slate-800/50">
                    <td className="p-4 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 border-r border-slate-700">{u.firstName} {u.lastName}</td>
                    <td className="p-4 border-r border-slate-700">{u.designation || u.designationName}</td>
                    <td className="p-4 border-r border-slate-700">{u.hq}</td>
                    <td className="p-4 border-r border-slate-700">{u.division}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleOpenTargetForm(u)} className="text-emerald-500 hover:bg-emerald-500/20 p-2 rounded-full transition-colors" title="Add Target">
                        <Check size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No users found. Click Filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSubTab === 'monthly' && (
        <div>
           <button onClick={() => setActiveSubTab('main')} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
            <ArrowLeft size={16} /> MONTHLY TARGETS
          </button>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select Month</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                <option value="">Select Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block uppercase">Select Year</label>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button onClick={fetchTargets} className="mb-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold">
            Load Data
          </button>

          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-4 border-r border-slate-700">Sr no.</th>
                  <th className="p-4 border-r border-slate-700">Employee</th>
                  <th className="p-4 border-r border-slate-700">Direct Target</th>
                  <th className="p-4 border-r border-slate-700">Team Target</th>
                  <th className="p-4 border-r border-slate-700">Total Assigned Target</th>
                  <th className="p-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {targets.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="p-4 border-r border-slate-700">{i + 1}</td>
                    <td className="p-4 border-r border-slate-700">{t.userName}</td>
                    <td className="p-4 border-r border-slate-700 text-slate-300 font-mono">{t.directTarget.toFixed(2)}</td>
                    <td className="p-4 border-r border-slate-700 text-slate-300 font-mono">{t.teamTarget.toFixed(2)}</td>
                    <td className="p-4 border-r border-slate-700 text-emerald-400 font-bold font-mono">{t.totalTarget.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {t.rawTarget && (
                        <button onClick={() => handleDeleteTarget(t.rawTarget._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={16}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'yearly' && (
        <div>
          <button onClick={() => setActiveSubTab('main')} className="text-sky-400 hover:text-white mb-6 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
            <ArrowLeft size={16} /> YEARLY TARGETS (Coming Soon)
          </button>
          <p className="text-slate-400">Yearly aggregation logic can be built based on the monthly data.</p>
        </div>
      )}

    </div>
  );
}
