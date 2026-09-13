import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Folder, Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';

export default function PrimarySales() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    headquarter: '',
    stockist: '',
    division: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  const [rows, setRows] = useState([
    { id: 1, productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTR' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await axios.get('/api/xl/products');
        setProducts(pRes.data.data || []);
      } catch (err) {
        console.error(err);
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
    setRows([...rows, { id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTR' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
  };

  return (
    <div className="h-dvh bg-[#1a1a2e] flex flex-col text-[#d1d5db] font-sans overflow-hidden">
      
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

      <div className="flex-1 flex flex-col overflow-auto p-3 md:p-4 bg-[#161625]">
        
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
                  options={[{value: 'CRITIZA', label: 'CRITIZA'}]}
                  value={formData.division || 'CRITIZA'}
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
                  options={[{value: 'Surat', label: 'Surat'}]}
                  value={formData.headquarter || 'Surat'}
                  onChange={(val) => setFormData({...formData, headquarter: val})}
                  placeholder="Select Headquarter"
                />
              </div>
            </div>

            {/* Row 2/Col 3: Stockist */}
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-[11px] font-semibold text-[#8b8baf]">Select Stockist <span className="text-rose-500">*</span></label>
              <div className="h-[36px] [&>div>div]:min-h-[36px] [&>div>div]:py-1.5">
                <CustomSelect 
                  options={[{value: 'Silver Medicare', label: 'Silver Medicare'}]}
                  value={formData.stockist || 'Silver Medicare'}
                  onChange={(val) => setFormData({...formData, stockist: val})}
                  placeholder="Select Stockist"
                />
              </div>
            </div>

          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-xs border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-3 font-semibold text-center w-12 border-r border-[#3b3b5a]">Sr no.</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a]">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-slate-500" />
                      Product (₹)
                    </div>
                  </th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-28">Price</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-24">Quantity</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-24">Purc. Rtn</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-24">Free Stocks</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-24">Total Qty</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-24">Discount %</th>
                  <th className="p-3 font-semibold border-r border-[#3b3b5a] text-center w-28">Final Price (₹)</th>
                  <th className="p-3 font-semibold text-center w-16">Actions</th>
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
                  
                  const totalQty = (qty + free) - rtn;
                  const discount = Number(row.discount) || 0;
                  
                  let activePrice = ptr;
                  if (row.selectedPriceType === 'MRP') activePrice = mrp;
                  else if (row.selectedPriceType === 'PTS') activePrice = pts;
                  else if (row.selectedPriceType === 'CUS') activePrice = Number(row.customPrice) || 0;
                  
                  const gross = qty * activePrice;
                  const finalAmt = gross - (gross * (discount / 100));

                  return (
                    <tr key={row.id} className="border-b border-[#3b3b5a]/50 hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="p-2 text-center text-xs font-semibold border-r border-[#3b3b5a]/50">{index + 1}</td>
                      <td className="p-2 border-r border-[#3b3b5a]/50 min-w-[200px]">
                        <CustomSelect 
                          options={products.map((p: any) => ({
                            value: p.uid || p._id,
                            label: p.productName
                          }))}
                          value={row.productId}
                          onChange={(val) => handleRowChange(index, 'productId', val)}
                          placeholder="Select Product"
                        />
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50">
                        <div className="flex flex-col gap-1 text-[10px] font-bold bg-[#1a1a2e] p-1.5 rounded border border-[#3b3b5a]">
                          
                          <div className="flex justify-between items-center h-4">
                            <button 
                              onClick={() => handleRowChange(index, 'selectedPriceType', 'MRP')}
                              className={`px-1.5 py-0.5 rounded transition-colors ${row.selectedPriceType === 'MRP' ? 'bg-sky-500 text-white' : 'bg-[#27273f] text-slate-400 hover:bg-[#3b3b5a] hover:text-white'}`}
                            >MRP</button> 
                            <span className="text-white">{mrp.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center h-4">
                            <button 
                              onClick={() => handleRowChange(index, 'selectedPriceType', 'PTR')}
                              className={`px-1.5 py-0.5 rounded transition-colors ${row.selectedPriceType === 'PTR' ? 'bg-sky-500 text-white' : 'bg-[#27273f] text-slate-400 hover:bg-[#3b3b5a] hover:text-white'}`}
                            >PTR</button> 
                            <span className="text-emerald-400">{ptr.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center h-4">
                            <button 
                              onClick={() => handleRowChange(index, 'selectedPriceType', 'PTS')}
                              className={`px-1.5 py-0.5 rounded transition-colors ${row.selectedPriceType === 'PTS' ? 'bg-sky-500 text-white' : 'bg-[#27273f] text-slate-400 hover:bg-[#3b3b5a] hover:text-white'}`}
                            >PTS</button> 
                            <span className="text-sky-400">{pts.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center h-5 mt-1 border-t border-[#3b3b5a]/50 pt-1">
                            <button 
                              onClick={() => handleRowChange(index, 'selectedPriceType', 'CUS')}
                              className={`px-1.5 py-0.5 rounded transition-colors ${row.selectedPriceType === 'CUS' ? 'bg-sky-500 text-white' : 'bg-[#27273f] text-slate-400 hover:bg-[#3b3b5a] hover:text-white'}`}
                            >CUS</button> 
                            <input 
                              type="number" 
                              min="0"
                              value={row.customPrice}
                              onChange={e => handleRowChange(index, 'customPrice', e.target.value)}
                              onClick={() => handleRowChange(index, 'selectedPriceType', 'CUS')}
                              className="w-14 bg-[#212136] text-emerald-400 border border-[#3b3b5a] rounded outline-none text-right px-1 py-0.5"
                              placeholder="0.00"
                            />
                          </div>

                        </div>
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50">
                        <input type="number" min="0" value={row.quantity} onChange={e => handleRowChange(index, 'quantity', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50">
                        <input type="number" min="0" value={row.purcRtn} onChange={e => handleRowChange(index, 'purcRtn', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded px-2 py-1.5 text-sm text-rose-400 outline-none focus:border-rose-500 text-center" />
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50">
                        <input type="number" min="0" value={row.freeStocks} onChange={e => handleRowChange(index, 'freeStocks', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50 text-center text-white font-semibold">{totalQty}</td>
                      <td className="p-2 border-r border-[#3b3b5a]/50">
                        <input type="number" min="0" max="100" value={row.discount} onChange={e => handleRowChange(index, 'discount', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-2 border-r border-[#3b3b5a]/50 text-center font-bold text-sky-400">{finalAmt.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeRow(index)} className="text-[#8b8baf] hover:text-rose-400 transition-colors p-1"><Trash2 size={16} /></button>
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
    </div>
  );
}
