import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Folder, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';

export default function PrimarySales() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [hqs, setHqs] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    headquarter: '',
    stockist: '',
    division: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  const [rows, setRows] = useState([
    { id: 1, productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTR', customRtnPrice: '', selectedRtnPriceType: 'PTR' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          axios.get('/api/xl/reports/products').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } }))
        ]);
        
        const fetchedProducts = pRes.data.data || [];
        setProducts(fetchedProducts);
        
        const fetchedStockists = sRes.data.data || [];
        setStockists(fetchedStockists);

        // Extract unique HQs from stockists
        const uniqueHqs = [...new Set(fetchedStockists.map((s: any) => s.headquarter).filter(Boolean))].sort();
        setHqs(uniqueHqs as string[]);

        // Extract unique divisions from products
        const uniqueDivs = [...new Set(fetchedProducts.map((p: any) => p.division).filter(Boolean))].sort();
        setDivisions(uniqueDivs as string[]);

      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTR', customRtnPrice: '', selectedRtnPriceType: 'PTR' }]);
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

  
  const totals = rows.reduce((acc, row) => {
    const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
    const ptr = prod ? (prod.ptr || 0) : 0;
    const mrp = prod ? (prod.mrp || 0) : 0;
    const pts = prod ? (prod.pts || 0) : 0;
    
    const qty = Number(row.quantity) || 0;
    const rtn = Number(row.purcRtn) || 0;
    const discount = Number(row.discount) || 0;
    
    let activePrice = ptr;
    if (row.selectedPriceType === 'MRP') activePrice = mrp;
    else if (row.selectedPriceType === 'PTS') activePrice = pts;
    else if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
    
    let rtnPrice = ptr;
    if (row.selectedRtnPriceType === 'MRP') rtnPrice = mrp;
    else if (row.selectedRtnPriceType === 'PTS') rtnPrice = pts;
    else if (row.selectedRtnPriceType === 'CUS') rtnPrice = Number(row.customRtnPrice) || 0;
    
    const grossSale = qty * activePrice;
    const finalPrice = grossSale - (grossSale * (discount / 100));
    const returnValue = rtn * rtnPrice;
    const finalValue = finalPrice - returnValue;

    acc.grossInvValue += finalPrice;
    acc.netInvValue += finalValue;
    return acc;
  }, { grossInvValue: 0, netInvValue: 0 });

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
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const payload = {
        ...formData,
        employeeId: user.employeeId || user._id || 'ADMIN',
        grossInvValue: totals.grossInvValue,
        netInvValue: totals.netInvValue,
        productsData: validRows
      };

      const res = await axios.post('/api/xl/primary-sales/save', payload);
      if (res.data.success) {
        alert('Invoice saved successfully!');
        setFormData({
          ...formData,
          invoiceNumber: ''
        });
        setRows([{ id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTR', customRtnPrice: '', selectedRtnPriceType: 'PTR' }]);
      } else {
        alert('Failed to save invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  return (
    <div className="min-h-screen bg-[#161625] flex flex-col text-[#d1d5db] font-sans">
      {/* STICKY TOP BLOCK */}
      <div className="sticky top-0 z-40 bg-[#161625] shadow-lg border-b border-[#3b3b5a]/80 pb-2">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">PRIMARY SALES</h1>
        </div>
        
        <div className="flex items-center gap-6">
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
              <button className="h-[36px] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Folder size={14} /> All Pri Sales
              </button>
            </div>

            {/* Row 2/Col 1: Division */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Select Division <span className="text-rose-500">*</span></label>
              <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5">
                <CustomSelect 
                  options={divisions.map(d => ({ value: d, label: d }))}
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
                  options={hqs.map(hq => ({ value: hq, label: hq }))}
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
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 mb-20">
          <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-[10px] uppercase tracking-wider border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-2 font-bold text-center border-r border-[#3b3b5a]">Sr</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a]">Product</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Free Stocks</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Total Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center">Discnt %</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-400">Final Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-rose-400">Purc. Rtn</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-rose-400">Rtn Price</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-emerald-400">Final Value</th>
                  <th className="p-2 font-bold text-center">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
                  const ptr = prod ? (prod.ptr || 0) : 0;
                  const mrp = prod ? (prod.mrp || 0) : 0;
                  const pts = prod ? (prod.pts || 0) : 0;
                  
                  const qty = Number(row.quantity) || 0;
                  const free = Number(row.freeStocks) || 0;
                  const rtn = Number(row.purcRtn) || 0;
                  const discount = Number(row.discount) || 0;
                  
                  // Sale Price
                  let activePrice = ptr;
                  if (row.selectedPriceType === 'MRP') activePrice = mrp;
                  else if (row.selectedPriceType === 'PTS') activePrice = pts;
                  else if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
                  
                  // Return Price
                  let rtnPrice = ptr;
                  if (row.selectedRtnPriceType === 'MRP') rtnPrice = mrp;
                  else if (row.selectedRtnPriceType === 'PTS') rtnPrice = pts;
                  else if (row.selectedRtnPriceType === 'CUS') rtnPrice = Number(row.customRtnPrice) || 0;
                  
                  const totalQty = qty + free;
                  const grossSale = qty * activePrice;
                  const finalPrice = grossSale - (grossSale * (discount / 100));
                  const returnValue = rtn * rtnPrice;
                  const finalValue = finalPrice - returnValue;

                  return (
                    <tr key={row.id} className="border-b border-[#3b3b5a]/50 hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="p-1.5 text-center text-xs font-semibold border-r border-[#3b3b5a]/50">{index + 1}</td>
                      
                      {/* Product - Reduced Width */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 min-w-[140px] max-w-[200px]"><div className="h-[34px] [&>div>div]:min-h-[34px] [&>div>div]:py-1"><CustomSelect 
                          options={products.map((p: any) => ({
                            value: p.uid || p._id,
                            label: p.productName
                          }))}
                          value={row.productId}
                          onChange={(val) => handleRowChange(index, 'productId', val)}
                          placeholder="Select"
                        /></div></td>

                      {/* Price Block */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="flex flex-col gap-[2px] w-10">
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTR')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTR' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTR</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTS</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'MRP')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'MRP' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>MRP</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'CUS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'CUS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>Cus</button>
                          </div>
                          <div className="w-12 shrink-0">
                            {row.selectedPriceType === 'CUS' ? (
                              <input type="number" min="0" value={row.customPrice} onChange={e => handleRowChange(index, 'customPrice', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-sky-400 outline-none focus:border-sky-500 text-center font-bold" placeholder="0.00" />
                            ) : (
                              <div className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 flex items-center justify-center text-xs text-[#8b8baf] font-bold">{activePrice.toFixed(2)}</div>
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
                        <input type="number" min="0" value={row.purcRtn} onChange={e => handleRowChange(index, 'purcRtn', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 text-xs text-rose-400 outline-none focus:border-rose-500 text-center" />
                      </td>

                      {/* Rtn Price Block */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 bg-rose-950/10">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="flex flex-col gap-[2px] w-10">
                            <button onClick={() => handleRowChange(index, 'selectedRtnPriceType', 'PTR')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'PTR' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>PTR</button>
                            <button onClick={() => handleRowChange(index, 'selectedRtnPriceType', 'PTS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'PTS' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>PTS</button>
                            <button onClick={() => handleRowChange(index, 'selectedRtnPriceType', 'MRP')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'MRP' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>MRP</button>
                            <button onClick={() => handleRowChange(index, 'selectedRtnPriceType', 'CUS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedRtnPriceType === 'CUS' ? 'bg-rose-500 text-white' : 'bg-[#1a1a2e] text-rose-400/50 hover:bg-rose-900/30'}`}>Cus</button>
                          </div>
                          <div className="w-12 shrink-0">
                            {row.selectedRtnPriceType === 'CUS' ? (
                              <input type="number" min="0" value={row.customRtnPrice} onChange={e => handleRowChange(index, 'customRtnPrice', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 text-xs text-rose-400 outline-none focus:border-rose-500 text-center font-bold" placeholder="0.00" />
                            ) : (
                              <div className="w-full h-[34px] bg-[#1a1a2e] border border-rose-900/50 rounded px-1 flex items-center justify-center text-xs text-rose-400/70 font-bold">{rtnPrice.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Final Value */}
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e1e30] border-t border-[#3b3b5a] p-4 flex flex-col md:flex-row justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex gap-8 mb-3 md:mb-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Gross Inv Value</span>
            <span className="text-xl font-black text-sky-400">₹ {totals.grossInvValue.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Net Inv Value</span>
            <span className="text-xl font-black text-emerald-400">₹ {totals.netInvValue.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2">
          Save Invoice
        </button>
      </div>
    </div>
  );
}
