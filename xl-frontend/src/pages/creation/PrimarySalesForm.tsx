import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, PackageSearch, Search, X, ChevronDown } from 'lucide-react';

export default function PrimarySalesForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  
  useEffect(() => {
    if (editId) {
      axios.get('/api/xl/primary-sales/' + editId).then(res => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setHeader({
            date: d.date ? d.date.split('T')[0] : new Date().toISOString().split('T')[0],
            invoiceDate: d.invoiceDate ? d.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || user.division || '',
            headquarter: d.headquarter || user.hq || '',
            stockist: d.stockist || ''
          });
          
          try {
            const pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
            if (Array.isArray(pData) && pData.length > 0) {
              setItems(pData);
            }
          } catch(e) {}
        }
      }).catch(e => console.error(e));
    }
  }, [editId]);

  // Invoice Header State
  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    division: user.division || '',
    headquarter: user.hq || '',
    stockist: ''
  });

  // Master Data
  const [stockists, setStockists] = useState<any[]>([]);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);

  // Searchable Modal States
  const [selectingStockist, setSelectingStockist] = useState(false);
  const [stockistSearch, setStockistSearch] = useState('');
  
  const [selectingProductFor, setSelectingProductFor] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const hq = user.hq || '';
    const desig = user.designation || '';
    
    // Fetch Stockists mapped to User
    axios.get(`/api/xl/stockists?hq=${hq}&designation=${desig}`).then(res => {
      if (res.data.success) {
        setStockists(res.data.data || []);
      }
    }).catch(e => console.error(e));

    // Fetch Products Table
    axios.get('/api/xl/reports/products').then(res => {
      setProductsMaster(res.data.data || []);
    }).catch(e => console.error(e));
  }, [user.hq, user.designation]);

  // Line Items State
  const [items, setItems] = useState<any[]>([{
    id: Date.now().toString(),
    product: '',
    priceType: 'PTS',
    basePrice: 0,
    qty: 0,
    free: 0,
    discount: 0,
    exp: false,
    purcRtn: 0,
      rtnPriceType: 'PTS',
      rtnPrice: 0
  }]);

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      product: '',
      priceType: 'PTS',
      basePrice: 0,
      qty: 0,
      free: 0,
      discount: 0,
      exp: false,
      purcRtn: 0,
      rtnPriceType: 'PTS',
      rtnPrice: 0
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // --- Auto-Pricing Logic ---
  const handleProductSelect = (id: string, selectedProduct: any) => {
    // Find the item to see its current priceType
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    let newPrice = 0;
    if (item.priceType === 'PTS') newPrice = selectedProduct.pts || 0;
    else if (item.priceType === 'PTR') newPrice = selectedProduct.ptr || 0;
    else if (item.priceType === 'MRP') newPrice = selectedProduct.mrp || 0;

    let newRtnPrice = 0;
    const rtnType = item.rtnPriceType || 'PTS';
    if (rtnType === 'PTS') newRtnPrice = selectedProduct.pts || 0;
    else if (rtnType === 'PTR') newRtnPrice = selectedProduct.ptr || 0;
    else if (rtnType === 'MRP') newRtnPrice = selectedProduct.mrp || 0;

    setItems(items.map(i => i.id === id ? { 
      ...i, 
      product: selectedProduct.productName, 
      basePrice: newPrice,
      rtnPrice: newRtnPrice
    } : i));
  };

  const handleRtnPriceTypeChange = (id: string, newType: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    let newPrice = item.rtnPrice;
    if (item.product) {
      const prodMaster = productsMaster.find(p => p.productName === item.product);
      if (prodMaster) {
        if (newType === 'PTS') newPrice = prodMaster.pts || 0;
        else if (newType === 'PTR') newPrice = prodMaster.ptr || 0;
        else if (newType === 'MRP') newPrice = prodMaster.mrp || 0;
      }
    }
    setItems(items.map(i => i.id === id ? { ...i, rtnPriceType: newType, rtnPrice: newPrice } : i));
  };

  const handlePriceTypeChange = (id: string, newType: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    let newPrice = item.basePrice;
    
    // Attempt to auto-fetch price if a product is selected
    if (item.product) {
      const prodMaster = productsMaster.find(p => p.productName === item.product);
      if (prodMaster) {
        if (newType === 'PTS') newPrice = prodMaster.pts || 0;
        else if (newType === 'PTR') newPrice = prodMaster.ptr || 0;
        else if (newType === 'MRP') newPrice = prodMaster.mrp || 0;
        else if (newType === 'CUS') newPrice = 0; // Custom resets to 0 or keeps current
      }
    }

    setItems(items.map(i => i.id === id ? { 
      ...i, 
      priceType: newType, 
      basePrice: newPrice 
    } : i));
  };

  // Calculations
  const calculateItemTotals = (item: any) => {
    const totalQty = (parseFloat(item.qty) || 0) + (parseFloat(item.free) || 0);
    const baseVal = (parseFloat(item.qty) || 0) * (parseFloat(item.basePrice) || 0);
    const discountVal = baseVal * ((parseFloat(item.discount) || 0) / 100);
    const finalPrice = baseVal - discountVal;
    
    const rtnValue = (parseFloat(item.purcRtn) || 0) * (parseFloat(item.rtnPrice) || 0);
    const finalValue = finalPrice - rtnValue;
    
    return { totalQty, finalPrice, rtnValue, finalValue };
  };

  const totals = items.reduce((acc, item) => {
    const calc = calculateItemTotals(item);
    acc.gross += calc.finalPrice;
    acc.rtn += calc.rtnValue;
    if (item.exp) {
      acc.expiryRtn += calc.rtnValue;
    } else {
      acc.salableRtn += calc.rtnValue;
    }
    acc.net += calc.finalValue;
    return acc;
  }, { gross: 0, rtn: 0, salableRtn: 0, expiryRtn: 0, net: 0 });

  const handleSave = async () => {
    if (!header.invoiceNumber || !header.stockist || items.some(i => !i.product)) {
      setError('Please fill all mandatory fields (Invoice No, Stockist, Product Names).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        employeeId: user.employeeId || user.email,
        date: header.date,
        invoiceDate: header.invoiceDate,
        invoiceNumber: header.invoiceNumber,
        division: header.division,
        headquarter: header.headquarter,
        stockist: header.stockist,
        grossInvValue: totals.gross,
        netInvValue: totals.net,
        salableRtnValue: totals.salableRtn,
        expiryRtnValue: totals.expiryRtn,
        productsData: items
      };

      
        let res;
        if (editId) {
          res = await axios.put('/api/xl/primary-sales/update/' + editId, payload);
        } else {
          res = await axios.post('/api/xl/primary-sales/save', payload);
        }
    
      if (res.data.success) {
        alert('Primary Sales invoice saved as Pending successfully!');
        navigate('/creation');
      } else {
        setError(res.data.message || 'Failed to save invoice.');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists for modals
  const filteredStockists = stockists.filter(s => (s.businessName || '').toLowerCase().includes(stockistSearch.toLowerCase()));
  const filteredProducts = productsMaster.filter(p => (p.productName || '').toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#131422] flex flex-col text-slate-300 pb-56 relative">
      {/* Global CSS to hide number input spinners */}
      <style>
        {`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      {/* App Header */}
      <div className="bg-[#1e2032] p-4 flex items-center border-b border-slate-700 sticky top-0 z-10 shrink-0">
        <button onClick={() => navigate('/creation')} className="mr-3 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <PackageSearch size={20} className="mr-2 text-cyan-400" />
        <h1 className="text-white font-bold tracking-wide uppercase flex-1">{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}</h1>
        <button onClick={() => navigate('/creation/primary-sales/history')} className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg active:scale-95 border border-cyan-500/20">
          HISTORY
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Invoice Header Form */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Date *</label>
              <input type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Inv Date *</label>
              <input type="date" value={header.invoiceDate} onChange={e => setHeader({...header, invoiceDate: e.target.value})} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Invoice Number *</label>
            <input type="text" value={header.invoiceNumber} onChange={e => setHeader({...header, invoiceNumber: e.target.value})} placeholder="Enter Invoice No" className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Select Stockist *</label>
            <div 
              onClick={() => setSelectingStockist(true)}
              className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white flex justify-between items-center cursor-pointer"
            >
              <span className={header.stockist ? 'text-white' : 'text-slate-500'}>
                {header.stockist || '-- Search & Select Stockist --'}
              </span>
              <Search size={16} className="text-slate-500" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#3b3b5a]"></div>

        {/* Product Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            Products ({items.length})
          </h2>
          
          {items.map((item, index) => {
            const calcs = calculateItemTotals(item);
            return (
              <div key={item.id} className="bg-[#27273f] rounded-xl border border-[#3b3b5a] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Card Header (Product Select) */}
                <div className="bg-[#1e2032] p-3 border-b border-[#3b3b5a] flex justify-between items-center gap-2">
                  <div 
                    onClick={() => setSelectingProductFor(item.id)}
                    className="flex-1 flex justify-between items-center cursor-pointer py-1"
                  >
                    <span className={`text-sm font-bold truncate ${item.product ? 'text-white' : 'text-slate-500'}`}>
                      {item.product || '-- Search & Select Product --'}
                    </span>
                    {!item.product && <Search size={14} className="text-slate-500 ml-2 shrink-0" />}
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 p-1.5 transition-colors bg-red-400/10 rounded ml-2 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Price Type</label>
                      <div className="relative">
                        <select 
                          value={item.priceType} 
                          onChange={e => handlePriceTypeChange(item.id, e.target.value)} 
                          className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 pr-6 text-xs text-cyan-400 font-bold focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="PTS">PTS</option>
                          <option value="PTR">PTR</option>
                          <option value="MRP">MRP</option>
                          <option value="CUS">CUS</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="w-2/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Base Price (₹)</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={item.basePrice === 0 ? '' : item.basePrice} 
                        onChange={e => updateItem(item.id, 'basePrice', e.target.value)} 
                        placeholder="0.00"
                        className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Qty</label>
                      <input type="number" min="0" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Free</label>
                      <input type="number" min="0" value={item.free || ''} onChange={e => updateItem(item.id, 'free', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Disc %</label>
                      <input type="number" min="0" value={item.discount || ''} onChange={e => updateItem(item.id, 'discount', e.target.value)} placeholder="0" className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                  </div>

                  {/* Returns Block */}
                  <div className="bg-[#1e2032] rounded p-2 border border-red-900/30 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Returns</span>
                      <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={item.exp} onChange={e => updateItem(item.id, 'exp', e.target.checked)} className="accent-red-500" /> EXP
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Purc. Rtn Qty</label>
                        <input type="number" min="0" value={item.purcRtn || ''} onChange={e => updateItem(item.id, 'purcRtn', e.target.value)} placeholder="0" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                      <div className="w-[75px]">
                        <label className="text-[9px] text-slate-500 uppercase block">Type</label>
                        <div className="relative">
                          <select 
                            value={item.rtnPriceType || 'PTS'} 
                            onChange={e => handleRtnPriceTypeChange(item.id, e.target.value)} 
                            className="w-full bg-transparent border-b border-[#3b3b5a] p-1 text-xs text-red-400 font-bold focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="PTS">PTS</option>
                            <option value="PTR">PTR</option>
                            <option value="MRP">MRP</option>
                            <option value="CUS">CUS</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500 uppercase block">Rtn Price (₹)</label>
                        <input type="number" min="0" value={item.rtnPrice || ''} onChange={e => updateItem(item.id, 'rtnPrice', e.target.value)} placeholder="0.00" className="w-full bg-transparent border-b border-[#3b3b5a] text-xs text-white p-1 focus:outline-none focus:border-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#3b3b5a]">
                    <span className="text-[10px] text-slate-400">Tot Qty: <span className="text-white font-bold">{calcs.totalQty}</span></span>
                    <div className="text-right flex items-center gap-3">
                      {calcs.rtnValue > 0 && <span className="text-[10px] text-red-400 leading-none">-{calcs.rtnValue.toFixed(2)}</span>}
                      <div>
                        <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Final Value</span>
                        <span className="text-sm font-bold text-emerald-400 leading-none">₹ {calcs.finalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={handleAddItem} className="w-full py-3 rounded-lg border-2 border-dashed border-[#3b3b5a] text-cyan-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#27273f] transition-colors">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-16 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 bg-[#1a1b2d] border-t border-slate-700 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between mb-2 text-[11px]">
            <div className="text-slate-400">Gross: <span className="text-white">₹ {totals.gross.toFixed(2)}</span></div>
            <div className="text-slate-400">Salable Rtn: <span className="text-red-400">₹ {totals.salableRtn.toFixed(2)}</span></div>
            <div className="text-slate-400">Exp Rtn: <span className="text-red-400">₹ {totals.expiryRtn.toFixed(2)}</span></div>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Inv Value</span>
            <span className="text-xl font-bold text-emerald-400">₹ {totals.net.toFixed(2)}</span>
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <Save size={18} /> {loading ? 'Saving...' : 'Submit to Admin'}
          </button>
        </div>
      </div>

      {/* MODALS */}
      
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
                    key={s._id}
                    onClick={() => {
                      setHeader({...header, stockist: s.businessName});
                      setSelectingStockist(false);
                      setStockistSearch('');
                    }}
                    className="p-4 border-b border-[#3b3b5a]/40 text-sm text-slate-300 hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                  >
                    <div className="font-bold text-white">{s.businessName}</div>
                    {s.headquarter && <div className="text-[10px] text-slate-500 mt-1 uppercase">{s.headquarter}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {selectingProductFor && (
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
                    key={p._id}
                    onClick={() => {
                      handleProductSelect(selectingProductFor, p);
                      setSelectingProductFor(null);
                      setProductSearch('');
                    }}
                    className="p-4 border-b border-[#3b3b5a]/40 text-sm text-slate-300 hover:bg-[#27273f] active:bg-[#27273f] cursor-pointer"
                  >
                    <div className="font-bold text-cyan-400 flex justify-between">
                      {p.productName}
                      <span className="text-[10px] text-slate-500 ml-2">PTS: ₹{p.pts || 0}</span>
                    </div>
                    {p.category && <div className="text-[10px] text-slate-500 mt-1 uppercase">{p.category}</div>}
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
