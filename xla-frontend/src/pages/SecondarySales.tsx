import { Folder, ArrowLeft, Trash2, Save, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';
import { useState, useEffect } from 'react';

export default function SecondarySales() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' }) + ' ' + new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    month: currentMonth.split(' ')[0],
    year: currentMonth.split(' ')[1],
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    division: '',
    headquarter: '',
    stockist: ''
  });

  const [rows, setRows] = useState([
    { id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: 0, receivedQty: 0, salesQty: '', freeStocks: '' }
  ]);

  const monthOptions = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const yearOptions = ['2023', '2024', '2025', '2026', '2027', '2028'];

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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id && products.length > 0) {
      axios.get(`/api/xl/secondary-sales/${id}`).then(res => {
        if (res.data.success) {
          const d = res.data.data;
          setFormData({
            date: d.date || '',
            month: d.month || currentMonth.split(' ')[0],
            year: d.year || currentMonth.split(' ')[1],
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || '',
            headquarter: d.headquarter || '',
            stockist: d.stockist || ''
          });
          if (d.productsData) {
            try {
               const pData = JSON.parse(d.productsData);
               if (pData.length > 0) setRows(pData);
            } catch(e){}
          }
        }
      });
    }
  }, [id, products.length]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: 0, receivedQty: 0, salesQty: '', freeStocks: '' }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const fetchBalances = async (stockist: string, month: string, year: string, productId: string, index: number) => {
      if (!stockist || !month || !year || !productId) return;
      
      const mIndex = monthOptions.indexOf(month);
      let prevMonth = month;
      let prevYear = year;
      if (mIndex === 0) {
          prevMonth = 'Dec';
          prevYear = (parseInt(year) - 1).toString();
      } else if (mIndex > 0) {
          prevMonth = monthOptions[mIndex - 1];
      }

      try {
          const [obRes, prRes] = await Promise.all([
              axios.get(`/api/xl/secondary-sales-data/opening-balance?stockist=${stockist}&prevMonth=${prevMonth}&prevYear=${prevYear}&productId=${productId}`),
              axios.get(`/api/xl/secondary-sales-data/primary-received?stockist=${stockist}&month=${month}&year=${year}&productId=${productId}`)
          ]);
          
          setRows(prev => {
              const newRows = [...prev];
              if (newRows[index]) {
                  newRows[index].openingQty = obRes.data.openingQty || 0;
                  newRows[index].receivedQty = prRes.data.receivedQty || 0;
              }
              return newRows;
          });
      } catch (e) {
          console.error('Failed to fetch balances', e);
      }
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);

    if (field === 'productId') {
        fetchBalances(formData.stockist, formData.month, formData.year, value, index);
    }
  };

  useEffect(() => {
      // Re-fetch all balances if month, year, or stockist changes
      rows.forEach((row, idx) => {
          if (row.productId) {
              fetchBalances(formData.stockist, formData.month, formData.year, row.productId, idx);
          }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.stockist, formData.month, formData.year]);


  const filteredProducts = formData.division ? products.filter(p => p.division === formData.division) : products;
  const filteredStockists = formData.headquarter ? stockists.filter(s => s.headquarter === formData.headquarter) : stockists;
  // fallback if hq has no division

  const totals = rows.reduce((acc, row) => {
    const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
    const ptr = prod ? (prod.ptr || 0) : 0;
    const mrp = prod ? (prod.mrp || 0) : 0;
    const pts = prod ? (prod.pts || 0) : 0;
    
    let activePrice = ptr;
    if (row.selectedPriceType === 'MRP') activePrice = mrp;
    else if (row.selectedPriceType === 'PTS') activePrice = pts;
    else if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
    
    const sQty = Number(row.salesQty) || 0;
    const salesValue = sQty * activePrice;

    acc.amount += salesValue;
    return acc;
  }, { amount: 0 });

  const handleSave = async (isDraft = false) => {
    if (!formData.headquarter || !formData.stockist || !formData.month || !formData.year) {
      alert('Please fill all mandatory fields (Month, Year, HQ, Stockist)');
      return;
    }
    
    // Map closingQty into validRows for saving
    const validRows = rows.filter(r => r.productId && (Number(r.salesQty) > 0 || Number(r.freeStocks) > 0 || r.openingQty > 0 || r.receivedQty > 0)).map(r => {
        const totalQty = (Number(r.openingQty) || 0) + (Number(r.receivedQty) || 0);
        const closingQty = totalQty - (Number(r.salesQty) || 0) - (Number(r.freeStocks) || 0);
        return { ...r, closingQty };
    });
    
    if (validRows.length === 0) {
      alert('Please add at least one valid product.');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      const payload = {
        ...formData,
        employeeId: user.employeeId || user._id || 'ADMIN',
        amount: totals.amount,
        status: isDraft ? 'Draft' : 'Pending',
        productsData: validRows
      };

      let res;
      if (id) {
          res = await axios.put('/api/xl/secondary-sales/update/' + id, payload);
      } else {
          res = await axios.post('/api/xl/secondary-sales/save', payload);
      }
      
      if (res.data.success) {
        alert(id ? 'Secondary Sales updated successfully!' : 'Secondary Sales saved successfully!');
        if (id) {
            navigate('/extras/secondary/all');
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                year: currentMonth.split(' ')[1],
                month: currentMonth.split(' ')[0],
                invoiceDate: new Date().toISOString().split('T')[0],
                invoiceNumber: '',
                division: '',
                headquarter: '',
                stockist: ''
            });
            setRows([{ id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: 0, receivedQty: 0, salesQty: '', freeStocks: '' }]);
        }
      } else {
        alert('Failed to save.');
      }
    } catch (error) {
      alert('Error saving data.');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col font-sans relative">
      <div className="sticky top-0 z-[80] bg-[#1a1a2e] pb-4 shadow-xl border-b border-[#3b3b5a]/80">
      {/* HEADER */}
      <div className="bg-[#1e1e30] border-b border-[#3b3b5a] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => id ? navigate(-1) : navigate('/')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">SECONDARY SALES</h1>
        </div>
        
        <div className="flex items-center gap-4">
            {/* We will add All Sec Sales navigation later when the page is built */}
        </div>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 md:px-6 mt-4">
        
          
          {/* Form Header */}
          <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] p-6 shadow-xl relative z-[70] shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Select Year <span className="text-rose-500">*</span></label>
                <div className="h-[42px] [&>div>div]:min-h-[42px]"><CustomSelect 
                  options={yearOptions.map(y => ({ value: y, label: y }))} 
                  value={formData.year} 
                  onChange={(val) => setFormData({...formData, year: val})} 
                  placeholder="Select"
                /></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Select Month <span className="text-rose-500">*</span></label>
                <div className="h-[42px] [&>div>div]:min-h-[42px]"><CustomSelect 
                  options={monthOptions.map(m => ({ value: m, label: m }))} 
                  value={formData.month} 
                  onChange={(val) => setFormData({...formData, month: val})} 
                  placeholder="Select"
                /></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Select Division</label>
                <div className="h-[42px] [&>div>div]:min-h-[42px]"><CustomSelect 
                  options={divisions} 
                  value={formData.division} 
                  onChange={(val) => setFormData({...formData, division: val})} 
                  placeholder="Select Division"
                /></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Select Headquarter <span className="text-rose-500">*</span></label>
                <div className="h-[42px] [&>div>div]:min-h-[42px]"><CustomSelect 
                  options={hqs} 
                  value={formData.headquarter} 
                  onChange={(val) => setFormData({...formData, headquarter: val})} 
                  placeholder="Select HQ"
                /></div>
              </div>
              
              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Select Stockist <span className="text-rose-500">*</span></label>
                <div className="h-[42px] [&>div>div]:min-h-[42px]"><CustomSelect 
                  options={filteredStockists.map(s => ({ value: s.uid || s._id, label: s.businessName || s.name || s.uid }))} 
                  value={formData.stockist} 
                  onChange={(val) => setFormData({...formData, stockist: val})} 
                  placeholder="Select Stockist"
                /></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Invoice Date</label>
                <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="w-full h-[42px] bg-[#1a1a2e] border border-[#3b3b5a] rounded-lg px-3 text-sm text-white focus:border-sky-500 outline-none" />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#8b8baf] uppercase tracking-wider">Invoice Number</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full h-[42px] bg-[#1a1a2e] border border-[#3b3b5a] rounded-lg px-3 text-sm text-white focus:border-sky-500 outline-none" placeholder="Enter invoice number" />
                  <button onClick={() => navigate('/extras/secondary/all')} className="h-[42px] px-4 shrink-0 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors" title="All Secondary Sales">
                    <Folder size={14} /> All Sec Sales
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          </div>
      </div>
      <div className="flex-1 px-4 md:px-6 pb-3">
        <div className="max-w-[1400px] w-full mx-auto">
          <div className="bg-[#1e1e30] rounded-xl border border-[#3b3b5a] shadow-xl relative z-[60] mb-96 overflow-x-auto custom-scrollbar">
            <div className="min-w-[1200px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#27273f] text-[#8b8baf] text-[10px] uppercase tracking-wider">
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center w-12">Sr</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a]">Product Name</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center w-[140px]">Price (₹)</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-orange-300">Opening<br/>Balance Qty</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-300">Received<br/>Qty</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-white">Total<br/>Quantity</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-emerald-400">Sales<br/>Qty</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-purple-400">Free<br/>Stocks</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-400">Sales<br/>Value</th>
                    <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-amber-300">Closing<br/>Quantity</th>
                    <th className="p-2 font-bold text-center w-12">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const prod = products.find((p: any) => p.uid === row.productId || p._id === row.productId);
                    const ptr = prod ? (prod.ptr || 0) : 0;
                    const mrp = prod ? (prod.mrp || 0) : 0;
                    const pts = prod ? (prod.pts || 0) : 0;
                    
                    let activePrice = ptr;
                    if (row.selectedPriceType === 'MRP') activePrice = mrp;
                    else if (row.selectedPriceType === 'PTS') activePrice = pts;
    else if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
                    
                    const opening = Number(row.openingQty) || 0;
                    const received = Number(row.receivedQty) || 0;
                    const totalQty = opening + received;
                    const salesQty = Number(row.salesQty) || 0;
                    const freeStocks = Number(row.freeStocks) || 0;
                    
                    const closingQty = totalQty - salesQty - freeStocks;
                    const salesValue = salesQty * activePrice;

                    return (
                      <tr key={row.id} className="border-b border-[#3b3b5a]/50 hover:bg-[#1a1a2e]/50 transition-colors">
                        <td className="p-1.5 text-center text-xs font-semibold border-r border-[#3b3b5a]/50">{index + 1}</td>
                        
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 min-w-[250px]"><div className="h-[34px] [&>div>div]:min-h-[34px] [&>div>div]:py-1 z-[100]"><CustomSelect 
                            options={filteredProducts.map((p: any) => ({ value: p.uid || p._id, label: p.productName }))}
                            value={row.productId}
                            onChange={(val) => handleRowChange(index, 'productId', val)}
                            placeholder="Select"
                          /></div></td>
                          
                        {/* Price Type Selector */}
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 w-[140px]">
                          <div className="flex items-center gap-1 justify-center">
                            <div className="flex flex-col gap-[2px] w-10">
                              <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTR')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTR' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTR</button>
                              <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTS</button>
                              <button onClick={() => handleRowChange(index, 'selectedPriceType', 'MRP')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'MRP' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>MRP</button>
                              <button onClick={() => handleRowChange(index, 'selectedPriceType', 'CUS')} className={`text-[10px] font-bold py-[3px] px-1 rounded tracking-wide ${row.selectedPriceType === 'CUS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>Cus</button>
                            </div>
                            <div className="w-16 shrink-0">
                              {row.selectedPriceType === 'CUS' ? (
                                <input type="number" min="0" value={row.customPrice} onChange={e => handleRowChange(index, 'customPrice', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-sky-400 outline-none focus:border-sky-500 text-center font-bold" placeholder="0.00" />
                              ) : (
                                <div className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 flex items-center justify-center text-xs text-[#8b8baf] font-bold">{activePrice.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-1.5 border-r border-[#3b3b5a]/50 bg-orange-950/10 w-[88px]">
                          <input type="number" min="0" value={row.openingQty} onChange={e => handleRowChange(index, 'openingQty', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-orange-900/50 rounded px-1 text-xs text-orange-400 font-bold outline-none focus:border-orange-500 text-center" />
                        </td>
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center font-bold text-sky-300 bg-sky-950/10">{received}</td>
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center font-black text-white bg-white/5">{totalQty}</td>
                        
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16">
                          <input type="number" min="0" value={row.salesQty} onChange={e => handleRowChange(index, 'salesQty', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-white outline-none focus:border-sky-500 text-center" />
                        </td>
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 w-16">
                          <input type="number" min="0" value={row.freeStocks} onChange={e => handleRowChange(index, 'freeStocks', e.target.value)} className="w-full h-[34px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-white outline-none focus:border-sky-500 text-center" />
                        </td>
                        
                        <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center font-bold text-sky-400">{salesValue.toFixed(2)}</td>
                        <td className={`p-1.5 border-r border-[#3b3b5a]/50 text-center font-black ${closingQty < 0 ? 'text-rose-500 bg-rose-950/20' : 'text-amber-300 bg-amber-950/10'}`}>{closingQty}</td>

                        <td className="p-1.5 text-center">
                          <button onClick={() => removeRow(index)} className="text-[#8b8baf] hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-rose-500/10 mx-auto">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-3 border-t border-[#3b3b5a]/50 bg-[#1e1e30]">
                <button onClick={addRow} className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-sky-500/10">
                  + Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e1e30] border-t border-[#3b3b5a] p-4 flex flex-col md:flex-row justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4 md:gap-8 mb-3 md:mb-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Total Sales Value</span>
            <span className="text-xl font-black text-sky-400">₹ {totals.amount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => handleSave(true)} className="flex-1 md:flex-none bg-[#27273f] hover:bg-[#3b3b5a] text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
            <Save size={16} /> Save as Draft
          </button>
          <button onClick={() => handleSave(false)} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
            <CheckCircle size={16} /> {id ? 'Update Data' : 'Submit Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
