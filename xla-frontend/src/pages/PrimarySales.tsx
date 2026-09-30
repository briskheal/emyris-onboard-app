import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Folder, Upload , Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';

export default function PrimarySales() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [products, setProducts] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    headquarter: '',
    stockist: '',
    division: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  const [rows, setRows] = useState([
    { id: 1, productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTS', customRtnPrice: '', selectedRtnPriceType: 'PTS', isExpiry: false, lockedPrice: '', lockedRtnPrice: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, hRes, dRes] = await Promise.all([
          axios.get('/api/xl/reports/products').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/hq').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/division').catch(() => ({ data: { data: [] } }))
        ]);
        
        const fetchedProducts = pRes.data.data || [];
        setProducts(fetchedProducts);
        
        const fetchedStockists = sRes.data.data || [];
        setStockists(fetchedStockists);

        // Fetch master list of HQs and Divisions
        const fetchedHQs = hRes.data.data || [];
        setHqs(fetchedHQs.map((h: any) => ({ value: h.hqName || h.uid, label: h.hqName || h.uid })).filter(Boolean));

        const fetchedDivs = dRes.data.data || [];
        setDivisions(fetchedDivs.map((d: any) => ({ value: d.divisionName || d.uid, label: d.divisionName || d.uid })).filter(Boolean));

      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    const updatedRow = { ...newRows[index], [field]: value };
    newRows[index] = updatedRow;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTS', customRtnPrice: '', selectedRtnPriceType: 'PTS', isExpiry: false, lockedPrice: '', lockedRtnPrice: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
  };

  // Filter stockists based on selected HQ
  const filteredStockists = stockists.filter(s => !formData.headquarter || s.headquarter === formData.headquarter);

  
  
  useEffect(() => {
    if (id && products.length > 0 && stockists.length > 0) {
      axios.get(`/api/xl/primary-sales/${id}`).then(res => {
        if (res.data.success) {
          const d = res.data.data;

          // FIX 1: Stockist — search full stockists list by name OR uid
          let st = d.stockist || '';
          const matchingStockist = stockists.find(
            (s: any) => s.uid === st || s._id === st || s.businessName === st || s.name === st
          );
          if (matchingStockist) st = matchingStockist.uid || matchingStockist._id;

          let hq = d.headquarter || '';
          if (hq) {
            const matchingHq = hqs.find(
              (h: any) => h.value.toLowerCase() === hq.toLowerCase() || h.label.toLowerCase() === hq.toLowerCase()
            );
            if (matchingHq) hq = matchingHq.value;
          }

          setFormData({
            date: d.date || '',
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || '',
            headquarter: hq,
            stockist: st
          });

          if (d.productsData) {
            try {
              const pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
              if (Array.isArray(pData) && pData.length > 0) {
                const adaptedRows = pData.map((row: any, i: number) => {
                  // FIX 2 + 3: Always normalize. NEVER short-circuit with "return row".
                  // Mobile saves: product(name), productId(uid), qty, basePrice, priceType
                  // XLA form reads: productId(uid), quantity, customPrice, selectedPriceType
                  // Resolve productId: prefer existing uid, else look up by name
                  // Resolve productId: try every matching strategy in priority order.
                  // Mobile stores product=productName OR uid, productId=uid or _id.
                  // XLA option value = p.uid || p._id. We need resolvedProductId to match an option.
                  let resolvedProductId = '';
                  const tryFind = (val: string) => val ? products.find((p: any) =>
                    p.uid === val || p._id === val
                  ) : null;
                  const tryFindByName = (val: string) => val ? products.find((p: any) =>
                    p.productName === val || p.productName?.toLowerCase() === val?.toLowerCase()
                  ) : null;

                  // Strategy 1: row.productId as uid/id
                  let hit = tryFind(row.productId);
                  // Strategy 2: row.product as uid/id (mobile sometimes stores uid in 'product' field)
                  if (!hit) hit = tryFind(row.product);
                  // Strategy 3: row.productId as productName
                  if (!hit) hit = tryFindByName(row.productId);
                  // Strategy 4: row.product as productName
                  if (!hit) hit = tryFindByName(row.product);

                  if (hit) {
                    resolvedProductId = hit.uid || hit._id;
                  } else {
                    // Fallback: use as-is (dropdown will add a "not in master" hint option)
                    resolvedProductId = row.productId || row.product || '';
                  }

                  // Load adapter: restore exact saved type and price.
                  // lockedPrice = saved price for PTR/PTS/MRP (shown instead of master).
                  // customPrice = saved price for CUS (editable input).
                  // Admin can click a type button to clear lockedPrice and get fresh master price.
                  const savedPrice = String(row.basePrice || row.customPrice || '');
                  const savedPriceType = (row.priceType || row.selectedPriceType || 'PTS').toUpperCase();
                  const savedRtnPrice = String(row.rtnPrice || row.customRtnPrice || '');
                  const savedRtnPriceType = (row.rtnPriceType || row.selectedRtnPriceType || savedPriceType).toUpperCase();
                  const isCus = savedPriceType === 'CUS';
                  const isRtnCus = savedRtnPriceType === 'CUS';

                  return {
                    id: row.id || Date.now() + i,
                    productId: resolvedProductId,
                    selectedPriceType: savedPriceType,
                    customPrice: isCus ? savedPrice : '',      // CUS: saved price in input
                    lockedPrice: isCus ? '' : savedPrice,      // PTR/PTS/MRP: locked saved price
                    quantity: row.quantity || row.qty || '',
                    freeStocks: row.freeStocks || row.free || '',
                    discount: row.discount || '',
                    isExpiry: !!(row.isExpiry || row.exp),
                    purcRtn: row.purcRtn || '',
                    selectedRtnPriceType: savedRtnPriceType,
                    customRtnPrice: isRtnCus ? savedRtnPrice : '',
                    lockedRtnPrice: isRtnCus ? '' : savedRtnPrice
                  };
                });
                setRows(adaptedRows);
              }
            } catch(e) { console.error('Error parsing products data:', e); }
          }
        }
      });
    }
  }, [id, products.length, stockists.length]);

  const totals = rows.reduce((acc, row) => {
    const qty = Number(row.quantity) || 0;
    const rtn = Number(row.purcRtn) || 0;
    const discount = Number(row.discount) || 0;
    
    const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
    const masterPtr = prod ? (prod.ptr || 0) : 0;
    const masterMrp = prod ? (prod.mrp || 0) : 0;
    const masterPts = prod ? (prod.pts || 0) : 0;
    // lockedPrice = saved price from DB (edit load). Falls back to master if empty.
    let activePrice = 0;
    if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
    else if (row.lockedPrice) activePrice = Number(row.lockedPrice);
    else if (row.selectedPriceType === 'MRP') activePrice = masterMrp;
    else if (row.selectedPriceType === 'PTS') activePrice = masterPts;
    else activePrice = masterPtr; // PTR default
    let rtnPrice = 0;
    if (row.selectedRtnPriceType === 'CUS') rtnPrice = Number(row.customRtnPrice) || 0;
    else if (row.lockedRtnPrice) rtnPrice = Number(row.lockedRtnPrice);
    else if (row.selectedRtnPriceType === 'MRP') rtnPrice = masterMrp;
    else if (row.selectedRtnPriceType === 'PTS') rtnPrice = masterPts;
    else rtnPrice = masterPtr;
    
    const grossSale = qty * activePrice;
    const finalPrice = grossSale - (grossSale * (discount / 100));
    const returnValue = rtn * rtnPrice;
    const finalValue = finalPrice - returnValue;

    acc.grossInvValue += finalPrice;
    acc.netInvValue += finalValue;
    
    

    if (rtn > 0) {
      if (row.isExpiry) {
        acc.expiryRtnValue += returnValue;
      } else {
        acc.salableRtnValue += returnValue;
      }
    }

    return acc;
  }, { grossInvValue: 0, netInvValue: 0, salableRtnValue: 0, expiryRtnValue: 0 });

  const handleSave = async () => {
    if (!formData.headquarter || !formData.stockist || !formData.date || !formData.invoiceNumber) {
      alert('Please fill all mandatory fields (Date, Invoice No, HQ, Stockist)');
      return;
    }
    
    const validRows = rows.filter(r => r.productId && (Number(r.quantity) > 0 || Number(r.freeStocks) > 0 || Number(r.purcRtn) > 0));
    if (validRows.length === 0) {
      alert('Please add at least one valid product with quantity or return quantity.');
      return;
    }

    try {
      const userStr = localStorage.getItem('xla_user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const payload = {
        ...formData,
        employeeId: user.employeeId || user._id || 'ADMIN',
        grossInvValue: totals.grossInvValue,
          netInvValue: totals.netInvValue,
          salableRtnValue: totals.salableRtnValue,
          expiryRtnValue: totals.expiryRtnValue,
        productsData: validRows.map((r: any) => {
          // For CUS: save the manually entered customPrice
          // For PTR/PTS/MRP: save lockedPrice (original saved price) if present,
          //   otherwise save master price for the selected type
          const prod = products.find((p: any) => p.uid === r.productId || p._id === r.productId);
          const masterPtr = prod ? (prod.ptr || 0) : 0;
          const masterMrp = prod ? (prod.mrp || 0) : 0;
          const masterPts = prod ? (prod.pts || 0) : 0;
          let finalPrice = 0;
          if (r.selectedPriceType === 'CUS') finalPrice = Number(r.customPrice) || 0;
          else if (r.lockedPrice) finalPrice = Number(r.lockedPrice);
          else if (r.selectedPriceType === 'MRP') finalPrice = masterMrp;
          else if (r.selectedPriceType === 'PTS') finalPrice = masterPts;
          else finalPrice = masterPtr;
          let finalRtnPrice = 0;
          if (r.selectedRtnPriceType === 'CUS') finalRtnPrice = Number(r.customRtnPrice) || 0;
          else if (r.lockedRtnPrice) finalRtnPrice = Number(r.lockedRtnPrice);
          else if (r.selectedRtnPriceType === 'MRP') finalRtnPrice = masterMrp;
          else if (r.selectedRtnPriceType === 'PTS') finalRtnPrice = masterPts;
          else finalRtnPrice = masterPtr;
          return {
            id: r.id,
            product: r.productId,
            productId: r.productId,
            priceType: r.selectedPriceType || 'PTS',
            basePrice: finalPrice,
            qty: r.quantity || 0,
            free: r.freeStocks || 0,
            discount: r.discount || 0,
            exp: !!r.isExpiry,
            purcRtn: r.purcRtn || 0,
            rtnPriceType: r.selectedRtnPriceType || 'PTS',
            rtnPrice: finalRtnPrice
          };
        })
      };

      let res;
        if (id) {
            res = await axios.put('/api/xl/primary-sales/update/' + id, payload);
        } else {
            res = await axios.post('/api/xl/primary-sales/save', payload);
        }
      if (res.data.success) {
        alert(id ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
        if (id) {
            navigate('/extras/primary-sales/all');
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                invoiceDate: new Date().toISOString().split('T')[0],
                invoiceNumber: '',
                division: '',
                headquarter: '',
                stockist: ''
            });
            setRows([{ id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTS', customRtnPrice: '', selectedRtnPriceType: 'PTS', isExpiry: false, lockedPrice: '', lockedRtnPrice: '' }]);
        }
      } else {
        alert('Failed to save invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to DELETE this entire primary sales record? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('xla_token') || '';
      const res = await axios.delete(`/api/xl/primary-sales/delete/${id}?fromAdmin=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        alert('Record deleted successfully.');
        navigate('/extras/primary-sales/all');
      } else {
        alert(res.data.message || 'Failed to delete record.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting record.');
    }
  };

  return (
    <div className="min-h-screen bg-[#161625] flex flex-col text-[#d1d5db] font-sans">
      {/* STICKY TOP BLOCK */}
      <div className="sticky top-0 z-40 bg-[#161625] shadow-lg border-b border-[#3b3b5a]/80 pb-2">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-300 hover:text-emerald-400 transition-colors bg-[#27273f] p-2 rounded-lg" title="Go to Dashboard">
              <Home size={18} />
            </button>
          <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">PRIMARY SALES</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {id && (
            <button onClick={handleDelete} className="bg-transparent border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2">
              <Trash2 size={14} /> Delete Record
            </button>
          )}
          <button className="bg-transparent border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2">
              <Upload size={14} /> Upload Primary Sales
            </button>
        </div>
      </div>

      <div className="px-3 md:px-4 pt-3 md:pt-4 pb-1">
        
        {/* COMPACT FORM CONTAINER */}
        <div className="bg-[#212136] rounded-xl p-4 mb-4 shadow-lg border border-[#3b3b5a]/50 shrink-0">
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            
            {/* Row 1/Col 1: Date */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Date <span className="text-rose-500">*</span></label>
              <div className="bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 py-1 flex items-center h-[36px]">
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-transparent outline-none text-sm text-white"
                />
              </div>
            </div>
            
            {/* Row 1/Col 2: Invoice Date */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Invoice Date <span className="text-rose-500">*</span></label>
              <div className="bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 py-1 flex items-center h-[36px]">
                <input 
                  type="date" 
                  value={formData.invoiceDate}
                  onChange={e => setFormData({...formData, invoiceDate: e.target.value})}
                  className="w-full bg-transparent outline-none text-sm text-white"
                />
              </div>
            </div>

            {/* Row 1/Col 3: Invoice Number */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Invoice Number <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                value={formData.invoiceNumber}
                onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                placeholder="Invoice No"
                className="w-full h-[36px] bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>

            {/* Row 1/Col 4: All Primary Sales Button */}
            <div className="flex flex-col justify-end md:col-span-1">
              <button onClick={() => navigate('/extras/primary-sales/all')} className="h-[36px] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Folder size={14} /> All Pri Sales
              </button>
            </div>

            {/* Row 2/Col 1: Division */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Select Division <span className="text-rose-500">*</span></label>
              <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5">
                <CustomSelect 
                  options={divisions}
                  value={formData.division}
                  onChange={(val) => setFormData({...formData, division: val})}
                  placeholder="Select Division"
                />
              </div>
            </div>

            {/* Row 2/Col 2: Headquarter */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Select Headquarter <span className="text-rose-500">*</span></label>
              <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5">
                <CustomSelect 
                  options={hqs}
                  value={formData.headquarter}
                  onChange={(val) => setFormData({...formData, headquarter: val, stockist: ''})}
                  placeholder="Select Headquarter"
                />
              </div>
            </div>

            {/* Row 2/Col 3: Stockist */}
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Select Stockist <span className="text-rose-500">*</span></label>
              <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5">
                <CustomSelect 
                  options={filteredStockists.map((s: any) => ({ value: s.uid || s._id, label: s.businessName || s.name }))}
                  value={formData.stockist}
                  onChange={(val) => setFormData({...formData, stockist: val})}
                  placeholder="Select Stockist"
                />
              </div>
            </div>

          </div>
        </div>
        </div>
      </div>

      {/* SCROLLING TABLE BLOCK */}
      <div className="flex-1 px-3 md:px-4 pb-3">
        {/* DATA TABLE */}
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 mb-96">
          <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-[10px] uppercase tracking-wider border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-2 font-bold text-center border-r border-[#3b3b5a] w-12 max-w-[48px]">Sr</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] min-w-[250px] w-auto">Product</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center w-[140px]">Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Free Stocks</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Total Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Discnt %</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-400">Final Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-rose-400">Purc. Rtn</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-rose-400 w-[140px]">Rtn Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-rose-400">Rtn Value</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-emerald-400">Final Value</th>
                  <th className="p-2 font-bold text-center">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const qty = Number(row.quantity) || 0;
                  const free = Number(row.freeStocks) || 0;
                  const rtn = Number(row.purcRtn) || 0;
                  const discount = Number(row.discount) || 0;
                  
                  const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
                  const masterPtr = prod ? (prod.ptr || 0) : 0;
                  const masterMrp = prod ? (prod.mrp || 0) : 0;
                  const masterPts = prod ? (prod.pts || 0) : 0;
                  // lockedPrice = saved price from DB (edit). Falls back to master if empty.
                  let activePrice = 0;
                  if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
                  else if (row.lockedPrice) activePrice = Number(row.lockedPrice);
                  else if (row.selectedPriceType === 'MRP') activePrice = masterMrp;
                  else if (row.selectedPriceType === 'PTS') activePrice = masterPts;
                  else activePrice = masterPtr;
                  let rtnPrice = 0;
                  if (row.selectedRtnPriceType === 'CUS') rtnPrice = Number(row.customRtnPrice) || 0;
                  else if (row.lockedRtnPrice) rtnPrice = Number(row.lockedRtnPrice);
                  else if (row.selectedRtnPriceType === 'MRP') rtnPrice = masterMrp;
                  else if (row.selectedRtnPriceType === 'PTS') rtnPrice = masterPts;
                  else rtnPrice = masterPtr;
                  
                  const totalQty = qty + free;
                  const grossSale = qty * activePrice;
                  const finalPrice = grossSale - (grossSale * (discount / 100));
                  const returnValue = rtn * rtnPrice;
                  const finalValue = finalPrice - returnValue;

                  return (
                    <tr key={row.id} className="border-b border-[#3b3b5a]/50 hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="p-1.5 text-center text-xs font-semibold border-r border-[#3b3b5a]/50 w-12 max-w-[48px]">{index + 1}</td>
                      
                      {/* Product - Reduced Width */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 min-w-[250px] w-auto"><div className="h-[34px] [&>div>div]:min-h-[34px] [&>div>div]:py-1"><CustomSelect 
                          options={(() => {
                            const opts = products.map((p: any) => ({ value: p.uid || p._id, label: p.productName }));
                            // If this row's productId doesn't match any option, add a fallback so it's visible
                            if (row.productId && !opts.find(o => o.value === row.productId)) {
                              opts.unshift({ value: row.productId, label: `${row.productId} ⚠ (re-select)` });
                            }
                            return opts;
                          })()}
                          value={row.productId}
                          onChange={(val) => handleRowChange(index, 'productId', val)}
                          placeholder="Select"
                        /></div></td>

                      {/* Price Block: PTR/PTS/MRP = auto from master (or locked saved price); CUS = editable input */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-[140px]">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="flex flex-col gap-[2px] w-10">
                            {/* Clicking a type button clears lockedPrice → uses fresh master price */}
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedPriceType:'PTR',lockedPrice:'',customPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTR' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTR</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedPriceType:'PTS',lockedPrice:'',customPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTS</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedPriceType:'MRP',lockedPrice:'',customPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'MRP' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>MRP</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedPriceType:'CUS',lockedPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'CUS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>CUS</button>
                          </div>
                          <div className="w-16 shrink-0">
                            {row.selectedPriceType === 'CUS' ? (
                              <input type="number" min="0" value={row.customPrice} onChange={e => handleRowChange(index, 'customPrice', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-sky-400 outline-none focus:border-sky-500 text-center font-bold" placeholder="0.00" />
                            ) : (
                              <div className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 flex items-center justify-center text-xs text-sky-300 font-bold">{activePrice.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16">
                        <input type="number" min="0" value={row.quantity} onChange={e => handleRowChange(index, 'quantity', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-white outline-none focus:border-sky-500 text-center" />
                      </td>

                      {/* Free Stocks */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16">
                        <input type="number" min="0" value={row.freeStocks} onChange={e => handleRowChange(index, 'freeStocks', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-white outline-none focus:border-sky-500 text-center" />
                      </td>

                      {/* Total Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center text-white text-xs font-semibold w-16">{totalQty}</td>

                      {/* Discnt % */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16">
                        <input type="number" min="0" max="100" value={row.discount} onChange={e => handleRowChange(index, 'discount', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-white outline-none focus:border-sky-500 text-center" />
                      </td>

                      {/* Final Price */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center text-xs font-bold text-sky-400 w-20">{finalPrice.toFixed(2)}</td>

                      {/* Purc. Rtn */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16 bg-rose-950/10">
                        <div className="flex flex-col items-center gap-1">
                          <input type="number" min="0" value={row.purcRtn} onChange={e => handleRowChange(index, 'purcRtn', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 text-xs text-rose-400 outline-none focus:border-rose-500 text-center" />
                          <label className="flex items-center gap-1 text-[9px] text-rose-300 font-bold cursor-pointer hover:text-rose-200">
                            <input type="checkbox" checked={row.isExpiry || false} onChange={e => handleRowChange(index, 'isExpiry', e.target.checked)} className="accent-rose-500 w-3 h-3" />
                            EXP
                          </label>
                        </div>
                      </td>

                      {/* Rtn Price Block: CUS=editable input; PTR/PTS/MRP=static (saved or master) */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 bg-rose-950/10 w-[140px]">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="flex flex-col gap-[2px] w-10">
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedRtnPriceType:'PTR',lockedRtnPrice:'',customRtnPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'PTR' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>PTR</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedRtnPriceType:'PTS',lockedRtnPrice:'',customRtnPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'PTS' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>PTS</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedRtnPriceType:'MRP',lockedRtnPrice:'',customRtnPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'MRP' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>MRP</button>
                            <button onClick={() => { const nr=[...rows]; nr[index]={...nr[index],selectedRtnPriceType:'CUS',lockedRtnPrice:''}; setRows(nr); }} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'CUS' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>CUS</button>
                          </div>
                          <div className="w-16 shrink-0">
                            {row.selectedRtnPriceType === 'CUS' ? (
                              <input type="number" min="0" value={row.customRtnPrice} onChange={e => handleRowChange(index, 'customRtnPrice', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 text-xs text-rose-400 outline-none focus:border-rose-500 text-center font-bold" placeholder="0.00" />
                            ) : (
                              <div className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 flex items-center justify-center text-xs text-rose-400/70 font-bold">{rtnPrice.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Final Value */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center text-xs font-bold text-rose-400 w-20 bg-rose-950/10">{returnValue.toFixed(2)}</td>
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center text-xs font-black text-emerald-400 w-24 bg-emerald-950/10">{finalValue.toFixed(2)}</td>
                      
                      <td className="p-1.5 text-center w-10">
                        <button onClick={() => removeRow(index)} className="text-[#8b8baf] hover:text-rose-400 transition-colors p-1"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {rows.length === 0 && (
              <div className="py-8 text-center text-[#8b8baf] font-semibold text-sm">No data found</div>
            )}
            
          </div>
          
          <div className="p-3 border-t border-[#3b3b5a] bg-[#1a1a2e]">
             <button onClick={addRow} className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"><Plus size={14}/> Add Row</button>
          </div>
        </div>
      </div>

      {/* FLOATING TOTALS FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e1e30] border-t border-[#3b3b5a] p-4 flex flex-col md:flex-row justify-between items-center z-[90] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4 md:gap-8 mb-3 md:mb-0 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Gross Inv Value</span>
              <span className="text-xl font-black text-sky-400">₹ {totals.grossInvValue.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Salable Rtn</span>
              <span className="text-xl font-black text-rose-400">₹ {totals.salableRtnValue.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Expiry Rtn</span>
              <span className="text-xl font-black text-rose-500">₹ {totals.expiryRtnValue.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Net Inv Value</span>
              <span className="text-xl font-black text-emerald-400">₹ {totals.netInvValue.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2">
          {id ? 'Update Invoice' : 'Save Invoice'}
        </button>
      </div>
    </div>
  );
}
