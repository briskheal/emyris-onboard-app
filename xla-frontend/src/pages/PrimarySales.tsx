import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Folder, Search } from 'lucide-react';
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
    productId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  const [rows, setRows] = useState([
    { id: 1, productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '' }
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

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '' }]);
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
      <div className="flex items-center justify-between px-6 py-4 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/xla')} className="text-slate-300 hover:text-white transition-colors bg-[#27273f] p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">PRIMARY SALES</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Return Sale</span>
            <div className="w-10 h-5 bg-[#3b3b5a] rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div>
            </div>
          </div>
          <button className="bg-transparent border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 px-4 py-1.5 rounded text-sm font-semibold transition-colors">
            Upload Primary Sales
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-auto p-4 md:p-6 bg-[#161625]">
        
        {/* FORM CONTAINER */}
        <div className="bg-[#212136] rounded-xl p-6 mb-6 shadow-lg border border-[#3b3b5a]/50">
          
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Date <span className="text-rose-500">*</span></label>
              <div className="bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 py-2 flex items-center">
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-transparent outline-none text-sm text-white"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Select Headquarter <span className="text-rose-500">*</span></label>
              <CustomSelect 
                options={[{value: 'Surat', label: 'Surat'}]}
                value={formData.headquarter || 'Surat'}
                onChange={(val) => setFormData({...formData, headquarter: val})}
                placeholder="Select Headquarter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Select Stockist <span className="text-rose-500">*</span></label>
              <CustomSelect 
                options={[{value: 'Silver Medicare', label: 'Silver Medicare'}]}
                value={formData.stockist || 'Silver Medicare'}
                onChange={(val) => setFormData({...formData, stockist: val})}
                placeholder="Select Stockist"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button className="h-[42px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-semibold flex items-center justify-center gap-2 transition-colors">
                <Folder size={18} className="text-emerald-900 fill-current" /> All Primary Sales
              </button>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Upload File</label>
              <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 py-2 h-[42px]">
                <button className="bg-[#2e2e48] text-xs px-2 py-1 rounded text-white whitespace-nowrap hover:bg-[#3b3b5a]">Choose file</button>
                <span className="text-xs text-slate-500 truncate">No ...sen</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Select Division <span className="text-rose-500">*</span></label>
              <CustomSelect 
                options={[{value: 'CRITIZA', label: 'CRITIZA'}]}
                value={formData.division || 'CRITIZA'}
                onChange={(val) => setFormData({...formData, division: val})}
                placeholder="Select Division"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Select Product <span className="text-rose-500">*</span></label>
              <CustomSelect 
                options={products.map((p: any) => ({
                  value: p.uid || p._id,
                  label: p.productName
                }))}
                value={formData.productId}
                onChange={(val) => setFormData({...formData, productId: val})}
                placeholder="Select Product"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Invoice Number <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                value={formData.invoiceNumber}
                onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                placeholder="1"
                className="w-full h-[42px] bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* ROW 3 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8b8baf]">Invoice Date <span className="text-rose-500">*</span></label>
              <div className="bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-3 py-2 flex items-center h-[42px]">
                <input 
                  type="date" 
                  value={formData.invoiceDate}
                  onChange={e => setFormData({...formData, invoiceDate: e.target.value})}
                  className="w-full bg-transparent outline-none text-sm text-white"
                />
              </div>
            </div>
            
            <div className="md:col-start-4 flex flex-col justify-end">
              <button className="h-[42px] bg-transparent border border-sky-500/50 hover:bg-sky-500/10 text-sky-400 rounded-md font-semibold transition-colors">
                Add Product
              </button>
            </div>
          </div>

        </div>

        {/* DATA TABLE */}
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#1a1a2e] text-[#8b8baf] text-xs border-b border-[#3b3b5a]">
                <tr>
                  <th className="p-4 font-semibold text-center w-16 border-r border-[#3b3b5a]">Sr no.</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a]">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-slate-500" />
                      Product (₹)
                    </div>
                  </th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Price</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Quantity</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Purc. Rtn</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Free Stocks</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Total Quantity</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Discount %</th>
                  <th className="p-4 font-semibold border-r border-[#3b3b5a] text-center">Final Price (₹)</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
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
                  
                  const gross = qty * ptr;
                  const finalAmt = gross - (gross * (discount / 100));

                  return (
                    <tr key={row.id} className="border-b border-[#3b3b5a]/50 hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="p-3 text-center text-sm font-semibold border-r border-[#3b3b5a]/50">{index + 1}</td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 min-w-[200px]">
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
                      <td className="p-3 border-r border-[#3b3b5a]/50 w-32">
                        <div className="flex flex-col gap-1 text-[11px] font-bold bg-[#1a1a2e] p-2 rounded-md border border-[#3b3b5a]">
                          <div className="flex justify-between"><span className="text-slate-400">MRP:</span> <span className="text-white">{mrp.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">PTR:</span> <span className="text-emerald-400">{ptr.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">PTS:</span> <span className="text-sky-400">{pts.toFixed(2)}</span></div>
                        </div>
                      </td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 w-24">
                        <input type="number" min="0" value={row.quantity} onChange={e => handleRowChange(index, 'quantity', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-2 py-2 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 w-24">
                        <input type="number" min="0" value={row.purcRtn} onChange={e => handleRowChange(index, 'purcRtn', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-2 py-2 text-sm text-rose-400 outline-none focus:border-rose-500 text-center" />
                      </td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 w-24">
                        <input type="number" min="0" value={row.freeStocks} onChange={e => handleRowChange(index, 'freeStocks', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-2 py-2 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 text-center w-28 text-white font-semibold">{totalQty}</td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 w-24">
                        <input type="number" min="0" max="100" value={row.discount} onChange={e => handleRowChange(index, 'discount', e.target.value)} className="w-full bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-2 py-2 text-sm text-white outline-none focus:border-sky-500 text-center" />
                      </td>
                      <td className="p-3 border-r border-[#3b3b5a]/50 text-center w-32 font-bold text-sky-400">{finalAmt.toFixed(2)}</td>
                      <td className="p-3 text-center w-20">
                        <button onClick={() => removeRow(index)} className="text-[#8b8baf] hover:text-rose-400 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {rows.length === 0 && (
              <div className="py-12 text-center text-[#8b8baf] font-semibold">No data found</div>
            )}
            
          </div>
          
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1a1a2e]">
             <button onClick={addRow} className="text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"><Plus size={16}/> Add Row</button>
          </div>
        </div>

      </div>
    </div>
  );
}
