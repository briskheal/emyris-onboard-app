import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, PackageSearch, Search, X } from 'lucide-react';

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

  const [productsMaster, setProductsMaster] = useState([]);
  const [stockists, setStockists] = useState([]);
  
  const [productsData, setProductsData] = useState([]);
  const [loadedStatus, setLoadedStatus] = useState('');
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Masters
  useEffect(() => {
    axios.get('/api/xl/reports/products').then(res => setProductsMaster(res.data.data || []));
    
    // For stockists, if editing we fetch all, otherwise fetch mapped
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
              // Map DB keys to UI state
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
      axios.get(\`/api/xl/secondary-sales-data/auto-populate?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}\`)
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
        axios.get(\`/api/xl/secondary-sales-data/opening-balance?stockist=\${header.stockist}&prevMonth=\${prevMonth}&prevYear=\${prevYear}&productId=\${productName}\`),
        axios.get(\`/api/xl/secondary-sales-data/primary-received?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}&productId=\${productName}\`)
      ]);
      
      const opQty = obRes.data.openingQty || 0;
      const recQty = prRes.data.receivedQty || 0;
      
      const newRows = [...productsData];
      if (newRows[index]) {
        newRows[index].openingQty = opQty;
        newRows[index].receivedQty = recQty;
        // recalculate closing
        const total = opQty + recQty;
        newRows[index].closingQty = total - (Number(newRows[index].salesQty) || 0) - (Number(newRows[index].free) || 0);
        setProductsData(newRows);
      }
    } catch(e) {}
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...productsData];
    newRows[index][field] = value;
    
    // Auto-calculate closing qty
    if (['openingQty', 'receivedQty', 'salesQty', 'free'].includes(field)) {
      const op = Number(newRows[index].openingQty) || 0;
      const rec = Number(newRows[index].receivedQty) || 0;
      const sales = Number(newRows[index].salesQty) || 0;
      const free = Number(newRows[index].free) || 0;
      newRows[index].closingQty = (op + rec) - (sales + free);
    }
    
    setProductsData(newRows);
  };

  const selectProductForRow = (prodName: string) => {
    if (activeRowIndex !== null) {
      handleRowChange(activeRowIndex, 'product', prodName);
      
      // Auto-set prices based on type
      const pData = productsMaster.find((p:any) => p.name === prodName);
      if (pData) {
        const type = productsData[activeRowIndex].priceType;
        if (type === 'PTR') handleRowChange(activeRowIndex, 'basePrice', pData.ptr || 0);
        else if (type === 'PTS') handleRowChange(activeRowIndex, 'basePrice', pData.pts || 0);
        else if (type === 'MRP') handleRowChange(activeRowIndex, 'basePrice', pData.mrp || 0);
      }
      
      fetchRowStock(prodName, activeRowIndex);
    }
    setShowProductModal(false);
  };

  const handlePriceTypeChange = (index: number, type: string) => {
    handleRowChange(index, 'priceType', type);
    const prodName = productsData[index].product;
    const pData = productsMaster.find((p:any) => p.name === prodName);
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

  // Calculations
  const grandTotal = useMemo(() => {
    return productsData.reduce((sum, row) => {
      return sum + ((Number(row.basePrice) || 0) * (Number(row.salesQty) || 0));
    }, 0);
  }, [productsData]);

  const handleSave = async (isDraft: boolean) => {
    if (productsData.length === 0) return alert('Add at least one product.');
    
    // Filter out empties
    const validRows = productsData.filter(r => r.product && (Number(r.salesQty) > 0 || Number(r.free) > 0 || r.openingQty > 0 || r.receivedQty > 0));
    
    if (validRows.length === 0) return alert('No valid products to save.');

    // Convert Mobile keys to DB schema standard (XLA uses productId, openingQty, receivedQty, salesQty, freeStocks, closingQty, selectedPriceType, customPrice)
    // To ensure DB Normalization Phase 2 compatibility, we will map them properly.
    const mappedRows = validRows.map(r => ({
      product: r.product, // our normalized schema uses product
      productId: r.product, // backward compat
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

  const isLocked = loadedStatus === 'Approved';

  return (
    <div className="pb-24 bg-[#0f1015] min-h-screen text-white font-sans">
      {/* HEADER */}
      <div className="bg-[#1e2032] p-4 flex items-center justify-between sticky top-0 z-40 border-b border-[#3b3b5a]/50 shadow-lg">
        <div className="flex items-center gap-3">
          <ArrowLeft className="w-6 h-6 text-slate-300" onClick={() => navigate(-1)} />
          <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Secondary Sales</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLocked && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-bold text-center">
            This invoice is Approved and locked.
          </div>
        )}

        {/* DETAILS BLOCK */}
        <div className="grid grid-cols-2 gap-3">
          <select 
            disabled={isLocked}
            value={header.month} 
            onChange={e => setHeader({...header, month: e.target.value})}
            className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500"
          >
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
              <option key={m} value={m} className="bg-[#1e2032]">{m}</option>
            ))}
          </select>
          <select 
            disabled={isLocked}
            value={header.year} 
            onChange={e => setHeader({...header, year: e.target.value})}
            className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500"
          >
            {[2024,2025,2026,2027].map(y => (
              <option key={y} value={y} className="bg-[#1e2032]">{y}</option>
            ))}
          </select>
        </div>

        <select 
          disabled={isLocked}
          value={header.stockist} 
          onChange={e => setHeader({...header, stockist: e.target.value})}
          className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500"
        >
          <option value="" className="bg-[#1e2032]">-- Select Stockist --</option>
          {stockists.map((s:any) => (
            <option key={s.stockistName} value={s.stockistName} className="bg-[#1e2032]">{s.stockistName}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 ml-1 block font-medium">Invoice Date</label>
            <input 
              disabled={isLocked}
              type="date" 
              value={header.invoiceDate}
              onChange={e => setHeader({...header, invoiceDate: e.target.value})}
              className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-xl px-3 py-3 text-sm outline-none focus:border-sky-500" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 ml-1 block font-medium">Invoice Number</label>
            <input 
              disabled={isLocked}
              type="text" 
              placeholder="Optional"
              value={header.invoiceNumber}
              onChange={e => setHeader({...header, invoiceNumber: e.target.value})}
              className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded-xl px-3 py-3 text-sm outline-none focus:border-sky-500 placeholder-slate-600" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-[#3b3b5a] flex-1"></div>
          <span className="text-xs font-bold text-sky-400 tracking-wider">PRODUCT LINE ITEMS</span>
          <div className="h-px bg-[#3b3b5a] flex-1"></div>
        </div>

        {/* PRODUCTS LIST */}
        {productsData.map((row, index) => {
          const rowValue = (Number(row.basePrice) || 0) * (Number(row.salesQty) || 0);
          
          return (
            <div key={row.id} className="bg-[#1e2032] border border-[#3b3b5a] rounded-2xl p-4 relative overflow-hidden shadow-sm">
              {!isLocked && (
                <button onClick={() => removeRow(index)} className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {/* Product Selector */}
              <div 
                onClick={() => { if(!isLocked) { setActiveRowIndex(index); setShowProductModal(true); } }}
                className={\`flex items-center justify-between bg-[#0f1015] border \${row.product ? 'border-sky-900/50' : 'border-[#3b3b5a]'} rounded-xl px-4 py-3 mb-3 w-[85%] \${!isLocked ? 'cursor-pointer' : ''}\`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <PackageSearch className={\`w-4 h-4 shrink-0 \${row.product ? 'text-sky-400' : 'text-slate-500'}\`} />
                  <span className={\`text-sm font-semibold truncate \${row.product ? 'text-sky-300' : 'text-slate-500'}\`}>
                    {row.product || '-- Search Product --'}
                  </span>
                </div>
              </div>

              {/* Price Toggle & Input */}
              <div className="flex gap-2 mb-4 h-[38px]">
                <div className="flex bg-[#0f1015] rounded-xl border border-[#3b3b5a] overflow-hidden flex-1 p-1">
                  {['PTR', 'PTS', 'MRP', 'CUS'].map(type => (
                    <button
                      key={type}
                      disabled={isLocked}
                      onClick={() => handlePriceTypeChange(index, type)}
                      className={\`flex-1 text-[10px] font-bold rounded-lg transition-all \${row.priceType === type ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}\`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center bg-[#0f1015] border border-[#3b3b5a] rounded-xl px-3 h-full focus-within:border-sky-500 transition-colors">
                    <span className="text-slate-500 text-xs mr-2">₹</span>
                    <input 
                      disabled={isLocked || row.priceType !== 'CUS'}
                      type="number"
                      value={row.basePrice}
                      onChange={e => handleRowChange(index, 'basePrice', e.target.value)}
                      className="bg-transparent w-full outline-none text-white font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-orange-950/20 border border-orange-900/50 rounded-xl p-2 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wide mb-1">Opening</span>
                  <input type="number" disabled={isLocked} value={row.openingQty} onChange={e => handleRowChange(index, 'openingQty', e.target.value)} className="w-full bg-transparent text-center text-orange-400 font-bold outline-none" />
                </div>
                <div className="bg-sky-950/20 border border-sky-900/50 rounded-xl p-2 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-sky-400/80 uppercase tracking-wide mb-1">Received</span>
                  <input type="number" disabled={isLocked} value={row.receivedQty} onChange={e => handleRowChange(index, 'receivedQty', e.target.value)} className="w-full bg-transparent text-center text-sky-400 font-bold outline-none" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Total</span>
                  <div className="font-bold text-white">{(Number(row.openingQty) || 0) + (Number(row.receivedQty) || 0)}</div>
                </div>
              </div>

              {/* Sales Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-2 flex flex-col justify-center items-center focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wide mb-1">Sales Qty</span>
                  <input type="number" placeholder="0" disabled={isLocked} value={row.salesQty} onChange={e => handleRowChange(index, 'salesQty', e.target.value)} className="w-full bg-transparent text-center text-emerald-400 font-black text-lg outline-none placeholder-emerald-900/50" />
                </div>
                <div className="bg-purple-950/20 border border-purple-900/50 rounded-xl p-2 flex flex-col justify-center items-center focus-within:ring-1 focus-within:ring-purple-500">
                  <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wide mb-1">Free</span>
                  <input type="number" placeholder="0" disabled={isLocked} value={row.free} onChange={e => handleRowChange(index, 'free', e.target.value)} className="w-full bg-transparent text-center text-purple-400 font-bold outline-none placeholder-purple-900/50" />
                </div>
                <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-xl p-2 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-wide mb-1">Closing</span>
                  <div className="font-black text-yellow-400 text-lg">{row.closingQty}</div>
                </div>
              </div>

              {/* Sales Value */}
              <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-lg p-2.5 flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider">Sales Value</span>
                <span className="text-sm font-black text-indigo-400">
                  ₹ {rowValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          );
        })}

        {!isLocked && (
          <div className="flex gap-3">
            <button onClick={addRow} className="flex-1 py-4 border border-dashed border-[#3b3b5a] hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl flex items-center justify-center gap-2 text-sky-400 font-bold transition-all">
              <Plus className="w-5 h-5" />
              <span>ADD PRODUCT</span>
            </button>
            <button onClick={() => handleSave(false)} className="w-[120px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
              SUBMIT
            </button>
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e2032]/90 backdrop-blur-md border-t border-[#3b3b5a] p-4 pb-safe flex justify-between items-center z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total</span>
          <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            ₹ {grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
        </div>
        {!isLocked && (
          <button onClick={() => handleSave(true)} className="bg-[#0f1015] border border-[#3b3b5a] hover:bg-[#3b3b5a] text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            SAVE DRAFT
          </button>
        )}
      </div>

      {/* PRODUCT SEARCH MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200">
          <div className="bg-[#1e2032] p-4 border-b border-[#3b3b5a] flex items-center gap-3 pt-safe">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f1015] border border-[#3b3b5a] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>
            <button onClick={() => setShowProductModal(false)} className="p-2 bg-[#0f1015] border border-[#3b3b5a] rounded-xl text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {productsMaster.filter((p:any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((p:any) => (
              <div 
                key={p.name} 
                onClick={() => selectProductForRow(p.name)}
                className="bg-[#0f1015] border border-[#3b3b5a] rounded-xl p-3 flex justify-between items-center active:scale-95 transition-transform"
              >
                <div className="font-semibold text-sm text-sky-100">{p.name}</div>
                <div className="text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-1 rounded-md border border-sky-400/20">
                  ₹{p.ptr}
                </div>
              </div>
            ))}
            {productsMaster.filter((p:any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="text-center text-slate-500 mt-10">No products found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
