import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, PackageSearch } from 'lucide-react';

export default function PrimarySalesForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('xl_user') || '{}');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Invoice Header State
  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    division: user.division || '',
    headquarter: user.headquarter || '',
    stockist: ''
  });

  // Master Data
  const [stockists, setStockists] = useState<any[]>([]);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Stockists for this HQ
    axios.get('/api/xl/dcs/stockists').then(res => {
      if (res.data.success) {
        // Filter by user HQ if needed, or show all
        const myStockists = res.data.stockists.filter((s:any) => s.headquarter === user.headquarter);
        setStockists(myStockists.length > 0 ? myStockists : res.data.stockists);
      }
    }).catch(e => console.error(e));

    // Fetch Products Master for dropdown (Mocked or real)
    // If you have a products API, call it here. For now, assuming a generic list or user types it.
    // To be perfectly aligned with your system, we allow text input if master is empty.
  }, [user.headquarter]);

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
        productsData: items // The backend does JSON.stringify() automatically
      };

      const res = await axios.post('/api/xl/primary-sales/save', payload);
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

  return (
    <div className="min-h-screen bg-[#131422] flex flex-col text-slate-300 pb-32">
      {/* App Header */}
      <div className="bg-[#1e2032] p-4 flex items-center border-b border-slate-700 sticky top-0 z-10 shrink-0">
        <button onClick={() => navigate('/creation')} className="mr-3 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <PackageSearch size={20} className="mr-2 text-cyan-400" />
        <h1 className="text-white font-bold tracking-wide uppercase">Primary Sales</h1>
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
            {stockists.length > 0 ? (
              <select value={header.stockist} onChange={e => setHeader({...header, stockist: e.target.value})} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="">-- Select Stockist --</option>
                {stockists.map(s => <option key={s._id} value={s.businessName}>{s.businessName}</option>)}
              </select>
            ) : (
              <input type="text" value={header.stockist} onChange={e => setHeader({...header, stockist: e.target.value})} placeholder="Type Stockist Name" className="w-full bg-[#27273f] border border-[#3b3b5a] rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            )}
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
                {/* Card Header */}
                <div className="bg-[#1e2032] p-3 border-b border-[#3b3b5a] flex justify-between items-center gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Product Name *" 
                      value={item.product}
                      onChange={e => updateItem(item.id, 'product', e.target.value)}
                      className="w-full bg-transparent text-sm text-white font-bold focus:outline-none placeholder-slate-500"
                    />
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors bg-red-400/10 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Price Type</label>
                      <select value={item.priceType} onChange={e => updateItem(item.id, 'priceType', e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-cyan-400 font-bold focus:outline-none">
                        <option value="PTS">PTS</option>
                        <option value="PTR">PTR</option>
                        <option value="MRP">MRP</option>
                        <option value="Cus">Cus</option>
                      </select>
                    </div>
                    <div className="w-2/3">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Base Price (₹)</label>
                      <input type="number" min="0" value={item.basePrice || ''} onChange={e => updateItem(item.id, 'basePrice', e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Qty</label>
                      <input type="number" min="0" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Free</label>
                      <input type="number" min="0" value={item.free || ''} onChange={e => updateItem(item.id, 'free', e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 uppercase mb-1 block">Disc %</label>
                      <input type="number" min="0" value={item.discount || ''} onChange={e => updateItem(item.id, 'discount', e.target.value)} className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500" />
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1b2d] border-t border-slate-700 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-20 md:ml-64 xl:ml-0">
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
    </div>
  );
}
