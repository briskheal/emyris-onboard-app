import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Search, X, ChevronDown } from 'lucide-react';

export default function SecondarySalesForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');
  const hq = user.hq || '';
  const desig = user.designation || '';
  
  const [header, setHeader] = useState({
    month: new Date().toLocaleString('en-US', { month: 'short' }),
    year: new Date().getFullYear().toString(),
    stockist: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: ''
  });

  const [productsMaster, setProductsMaster] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadedStatus, setLoadedStatus] = useState('');
  
  // Modals - MATCHING PRIMARY FLOW EXACTLY
  const [selectingStockist, setSelectingStockist] = useState(false);
  const [stockistSearch, setStockistSearch] = useState('');
  const [selectingProductFor, setSelectingProductFor] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Fetch Masters
  useEffect(() => {
    axios.get('/api/xl/reports/products').then(res => setProductsMaster(res.data.data || []));
    axios.get(editId ? '/api/xl/reports/stockists' : `/api/xl/stockists?hq=${hq}&designation=${desig}`).then(res => {
      setStockists(res.data.data || []);
    });
  }, [hq, desig, editId]);

  // Load Edit Data
  useEffect(() => {
    if (editId) {
      axios.get('/api/xl/secondary-sales/' + editId).then(res => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setHeader({
            month: d.month || '',
            year: d.year || '',
            stockist: d.stockist || '',
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || ''
          });
          setLoadedStatus(d.status || '');
          
          if (d.productsData) {
            try {
              let pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
              const mapped = pData.map((p: any) => ({
                id: Date.now() + Math.random(),
                product: p.product || p.productId || '',
                basePrice: p.basePrice || p.customPrice || '',
                priceType: p.priceType || p.selectedPriceType || 'PTR',
                openingQty: p.openingQty || 0,
                receivedQty: p.receivedQty || 0,
                salesQty: p.salesQty || p.qty || '',
                free: p.freeStocks || p.free || '',
                closingQty: p.closingQty || 0
              }));
              setProductsData(mapped);
            } catch(e) {}
          }
        }
      });
    }
  }, [editId]);

  // Handle Autopopulate when month/year/stockist change (only if NEW)
  useEffect(() => {
    if (!editId && header.stockist && header.month && header.year) {
      axios.get(`/api/xl/secondary-sales-data/auto-populate?stockist=${header.stockist}&month=${header.month}&year=${header.year}`)
        .then(res => {
          if (res.data.success && res.data.data.length > 0) {
            const mapped = res.data.data.map((item: any) => ({
              id: Date.now() + Math.random(),
              product: item.productId,
              basePrice: '',
              priceType: 'PTR',
              openingQty: item.openingQty || 0,
              receivedQty: item.receivedQty || 0,
              salesQty: '',
              free: '',
              closingQty: (item.openingQty || 0) + (item.receivedQty || 0)
            }));
            setProductsData(mapped);
          } else {
            setProductsData([]);
          }
        });
    }
  }, [header.stockist, header.month, header.year, editId]);

  const fetchRowStock = async (productName: string, index: number) => {
    if (!productName || !header.stockist || !header.month || !header.year) return;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = months.indexOf(header.month);
    let prevMonth = '', prevYear = header.year;
    if (mIdx === 0) { prevMonth = "Dec"; prevYear = (parseInt(header.year) - 1).toString(); }
    else if (mIdx > 0) { prevMonth = months[mIdx - 1]; }
    
    try {
      const [obRes, prRes] = await Promise.all([
        axios.get(`/api/xl/secondary-sales-data/opening-balance?stockist=${header.stockist}&prevMonth=${prevMonth}&prevYear=${prevYear}&productId=${productName}`),
        axios.get(`/api/xl/secondary-sales-data/primary-received?stockist=${header.stockist}&month=${header.month}&year=${header.year}&productId=${productName}`)
      ]);
      
      const opQty = obRes.data.openingQty || 0;
      const recQty = prRes.data.receivedQty || 0;
      
      const newRows = [...productsData];
      if (newRows[index]) {
        newRows[index].openingQty = opQty;
        newRows[index].receivedQty = recQty;
        const total = opQty + recQty;
        newRows[index].closingQty = total - (Number(newRows[index].salesQty) || 0) - (Number(newRows[index].free) || 0);
        setProductsData(newRows);
      }
    } catch(e) {}
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...productsData];
    newRows[index][field] = value;
    
    if (['openingQty', 'receivedQty', 'salesQty', 'free'].includes(field)) {
      const op = Number(newRows[index].openingQty) || 0;
      const rec = Number(newRows[index].receivedQty) || 0;
      const sales = Number(newRows[index].salesQty) || 0;
      const free = Number(newRows[index].free) || 0;
      newRows[index].closingQty = (op + rec) - (sales + free);
    }
    setProductsData(newRows);
  };

  const selectProductForRow = (index: number, prodName: string) => {
    handleRowChange(index, 'product', prodName);
    
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    if (pData) {
      const type = productsData[index].priceType;
      if (type === 'PTR') handleRowChange(index, 'basePrice', pData.ptr || 0);
      else if (type === 'PTS') handleRowChange(index, 'basePrice', pData.pts || 0);
      else if (type === 'MRP') handleRowChange(index, 'basePrice', pData.mrp || 0);
    }
    
    fetchRowStock(prodName, index);
  };

  const handlePriceTypeChange = (index: number, type: string) => {
    handleRowChange(index, 'priceType', type);
    const prodName = productsData[index].product;
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    if (pData) {
      if (type === 'PTR') handleRowChange(index, 'basePrice', pData.ptr || 0);
      else if (type === 'PTS') handleRowChange(index, 'basePrice', pData.pts || 0);
      else if (type === 'MRP') handleRowChange(index, 'basePrice', pData.mrp || 0);
      else if (type === 'CUS') handleRowChange(index, 'basePrice', '');
    }
  };

  const addRow = () => {
    setProductsData([...productsData, {
      id: Date.now(), product: '', basePrice: '', priceType: 'PTR', openingQty: 0, receivedQty: 0, salesQty: '', free: '', closingQty: 0
    }]);
  };
  
  const removeRow = (index: number) => {
    const newRows = [...productsData];
    newRows.splice(index, 1);
    setProductsData(newRows);
  };

  const grandTotal = useMemo(() => {
    return productsData.reduce((sum, row) => {
      return sum + ((Number(row.basePrice) || 0) * (Number(row.salesQty) || 0));
    }, 0);
  }, [productsData]);

  const handleSave = async (isDraft: boolean) => {
    if (!header.stockist || productsData.length === 0) return alert('Please select stockist and add at least one product.');
    
    const validRows = productsData.filter(r => r.product && (Number(r.salesQty) > 0 || Number(r.free) > 0 || r.openingQty > 0 || r.receivedQty > 0));
    if (validRows.length === 0) return alert('No valid products to save.');

    const mappedRows = validRows.map(r => ({
      product: r.product,
      productId: r.product,
      qty: r.salesQty,
      salesQty: r.salesQty,
      basePrice: r.basePrice,
      customPrice: r.basePrice,
      priceType: r.priceType,
      selectedPriceType: r.priceType,
      openingQty: r.openingQty,
      receivedQty: r.receivedQty,
      free: r.free,
      freeStocks: r.free,
      closingQty: r.closingQty
    }));

    const payload = {
      employeeId: user.employeeId || user.email,
      ...header,
      amount: grandTotal,
      status: isDraft ? 'Draft' : 'Pending',
      productsData: mappedRows
    };

    try {
      let res;
      if (editId) {
        res = await axios.put('/api/xl/secondary-sales/update/' + editId, payload);
      } else {
        res = await axios.post('/api/xl/secondary-sales/save', payload);
      }
      if (res.data.success) {
        alert('Secondary Sales Saved!');
        navigate(-1);
      } else {
        alert(res.data.message || 'Save failed');
      }
    } catch(e: any) {
      alert('Error: ' + e.message);
    }
  };

  const getStockistName = (val: string) => {
    if (!val) return '';
    const s = stockists.find(x => x.uid === val || x._id === val || x.businessName === val);
    return s ? (s.businessName || s.name || val) : val;
  };
  const getProductName = (val: string) => {
    if (!val) return '';
    const p = productsMaster.find(x => x.uid === val || x._id === val || x.productName === val);
    return p ? (p.productName || val) : val;
  };

  const filteredStockists = stockists.filter(s => (s.businessName || '').toLowerCase().includes(stockistSearch.toLowerCase()));
  const filteredProducts = productsMaster.filter(p => (p.productName || '').toLowerCase().includes(productSearch.toLowerCase()));

  const isLocked = loadedStatus === 'Approved';

  return (
    <div className="min-h-screen bg-[#131422] flex flex-col text-slate-300 pb-56 relative">
      <style>
        {`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
        `}
      </style>

      {/* HEADER */}
      <div className="bg-[#1e2032] p-4 flex items-center justify-between sticky top-0 z-40 border-b border-[#3b3b5a]/50 shadow-lg">
        <div className="flex items-center gap-3">
          <ArrowLeft className="w-6 h-6 text-slate-300" onClick={() => navigate(-1)} />
          <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Secondary Sales</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLocked && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm font-bold text-center">
            This invoice is Approved and locked.
          </div>
        )}

        {/* DETAILS BLOCK (Matching Primary Structure) */}
        <div className="bg-[#27273f] rounded-xl border border-[#3b3b5a] p-4 space-y-4 shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Month</label>
              <select disabled={isLocked} value={header.month} onChange={e => setHeader({...header, month: e.target.value})} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none">
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => ( <option key={m} value={m}>{m}</option> ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Year</label>
              <select disabled={isLocked} value={header.year} onChange={e => setHeader({...header, year: e.target.value})} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none">
                {[2024,2025,2026,2027].map(y => ( <option key={y} value={y}>{y}</option> ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Invoice Date</label>
              <input disabled={isLocked} type="date" value={header.invoiceDate} onChange={e => setHeader({...header, invoiceDate: e.target.value})} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Invoice No</label>
              <input disabled={isLocked} type="text" placeholder="Optional" value={header.invoiceNumber} onChange={e => setHeader({...header, invoiceNumber: e.target.value})} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white placeholder-slate-600 focus:border-cyan-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Select Stockist *</label>
            <div onClick={() => !isLocked && setSelectingStockist(true)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-lg p-2 text-sm text-white flex justify-between items-center cursor-pointer">
              <span className={header.stockist ? 'text-white' : 'text-slate-500'}>
                {getStockistName(header.stockist) || '-- Search & Select Stockist --'}
              </span>
              <Search size={16} className="text-slate-500" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#3b3b5a]"></div>

        {/* PRODUCTS LIST (Matching Primary Design) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            Products ({productsData.length})
          </h2>

          {productsData.map((row, index) => {
            const rowValue = (Number(row.basePrice) || 0) * (Number(row.salesQty) || 0);
            return (
              <div key={row.id} className="bg-[#27273f] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Card Header (Product Select) */}
                <div className="bg-[#1e2032] p-3 border-b border-[#3b3b5a] flex justify-between items-center gap-2">
                  <div onClick={() => !isLocked && setSelectingProductFor(index)} className="flex-1 flex justify-between items-center cursor-pointer py-1">
                    <span className={`text-sm font-bold truncate ${row.product ? 'text-white' : 'text-slate-500'}`}>
                      {getProductName(row.product) || '-- Search & Select Product --'}
                    </span>
                    {!row.product && <Search size={14} className="text-slate-500 ml-2 shrink-0" />}
                  </div>
                  {!isLocked && ( <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-300 p-1.5 transition-colors bg-red-400/10 rounded ml-2 shrink-0"><Trash2 size={16} /></button> )}
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Price Type</label>
                      <div className="relative">
                        <select disabled={isLocked} value={row.priceType} onChange={e => handlePriceTypeChange(index, e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 pr-6 text-xs text-cyan-400 font-bold focus:outline-none appearance-none cursor-pointer">
                          <option value="PTS" className="bg-[#1e2032] text-white">PTS</option>
                          <option value="PTR" className="bg-[#1e2032] text-white">PTR</option>
                          <option value="MRP" className="bg-[#1e2032] text-white">MRP</option>
                          <option value="CUS" className="bg-[#1e2032] text-white">CUS</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="w-2/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Base Price (₹)</label>
                      <input disabled={isLocked || row.priceType !== 'CUS'} type="number" min="0" value={row.basePrice} onChange={e => handleRowChange(index, 'basePrice', e.target.value)} placeholder="0.00" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Opening</label>
                      <input disabled={isLocked} type="number" min="0" value={row.openingQty} onChange={e => handleRowChange(index, 'openingQty', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Received</label>
                      <input disabled={isLocked} type="number" min="0" value={row.receivedQty} onChange={e => handleRowChange(index, 'receivedQty', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Total Stock</label>
                      <div className="w-full bg-black/20 border border-[#3b3b5a]/50 rounded p-1.5 text-xs text-slate-400 text-center">
                        {(Number(row.openingQty) || 0) + (Number(row.receivedQty) || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Sales Qty</label>
                      <input disabled={isLocked} type="number" min="0" value={row.salesQty} onChange={e => handleRowChange(index, 'salesQty', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-emerald-400 font-bold text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Free</label>
                      <input disabled={isLocked} type="number" min="0" value={row.free} onChange={e => handleRowChange(index, 'free', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-purple-400 font-bold text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Closing Qty</label>
                      <div className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-yellow-400 font-bold text-center">
                        {row.closingQty}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#3b3b5a]">
                    <span className="text-[10px] text-slate-400">Tot Stock: <span className="text-white font-bold">{(Number(row.openingQty) || 0) + (Number(row.receivedQty) || 0)}</span></span>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Sales Value</span>
                        <span className="text-sm font-bold text-indigo-400 leading-none">₹ {rowValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!isLocked && ( <button onClick={addRow} className="w-full py-3 rounded-lg border-2 border-dashed border-[#3b3b5a] text-cyan-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#27273f] transition-colors">
            <Plus size={16} /> Add Product
          </button> )}
        </div>
      </div>

      {/* STICKY FOOTER (Matching Primary) */}
      <div className="fixed bottom-14 w-full max-w-md mx-auto bg-[#1c1c2e]/90 backdrop-blur-md border-t border-[#3b3b5a] p-4 flex justify-between items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Grand Total</span>
          <span className="text-xl font-black text-white">₹ {grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        {!isLocked && (
          <div className="flex gap-2">
            <button onClick={() => handleSave(true)} className="px-4 py-2 rounded-lg bg-[#27273f] text-slate-300 text-sm font-bold hover:bg-[#3b3b5a] transition-colors border border-[#3b3b5a]">
              Draft
            </button>
            <button onClick={() => handleSave(false)} className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-black transition-colors shadow-lg shadow-cyan-500/20">
              SUBMIT
            </button>
          </div>
        )}
      </div>

      {/* Stockist Selection Modal */}
      {selectingStockist && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c2e] w-full sm:max-w-md h-[75vh] sm:h-[60vh] sm:rounded-xl rounded-t-2xl flex flex-col shadow-2xl border-t sm:border border-[#3b3b5a]">
            <div className="p-4 border-b border-[#3b3b5a] flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search stockist..." 
                  value={stockistSearch}
                  onChange={e => setStockistSearch(e.target.value)}
                  className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button onClick={() => { setSelectingStockist(false); setStockistSearch(''); }} className="p-2 text-slate-400 hover:text-white bg-[#27273f] rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-6">
              {filteredStockists.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No stockists found.</div>
              ) : (
                filteredStockists.map(s => (
                  <div 
                    key={s._id || s.uid}
                    onClick={() => {
                      setHeader({...header, stockist: s.uid || s._id});
                      setSelectingStockist(false);
                      setStockistSearch('');
                    }}
                    className="p-4 border-b border-[#3b3b5a]/40 text-sm text-slate-300 hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                  >
                    <div className="font-bold text-white">{s.businessName || s.name}</div>
                    {s.headquarter && <div className="text-[10px] text-slate-500 mt-1 uppercase">{s.headquarter}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {selectingProductFor !== null && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c2e] w-full sm:max-w-md h-[75vh] sm:h-[60vh] sm:rounded-xl rounded-t-2xl flex flex-col shadow-2xl border-t sm:border border-[#3b3b5a]">
            <div className="p-4 border-b border-[#3b3b5a] flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search product..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button onClick={() => { setSelectingProductFor(null); setProductSearch(''); }} className="p-2 text-slate-400 hover:text-white bg-[#27273f] rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-6">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No products found.</div>
              ) : (
                filteredProducts.map(p => (
                  <div 
                    key={p.productName || p.name}
                    onClick={() => {
                      selectProductForRow(selectingProductFor, p.productName || p.name);
                      setSelectingProductFor(null);
                      setProductSearch('');
                    }}
                    className="p-4 border-b border-[#3b3b5a]/40 flex justify-between items-center hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{p.productName || p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">₹ {p.ptr}</div>
                    </div>
                    <Plus size={16} className="text-cyan-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
