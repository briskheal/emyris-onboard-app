import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';

export default function PrimarySales() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    employeeId: '',
    invoiceNumber: '',
  });

  const [rows, setRows] = useState([
    { id: 1, productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '' }
  ]);

  useEffect(() => {
    // Fetch users and products on load
    const fetchData = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          axios.get('/api/xl/users'),
          axios.get('/api/xl/products')
        ]);
        setUsers(uRes.data.data || []);
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
    <div className="min-h-screen md:h-dvh bg-[#1a1a2e] flex flex-col text-slate-100 font-sans overflow-hidden">
      
      {/* UNIFIED HEADER - As requested: just a back button and entire page used */}
      <div className="flex items-center gap-4 px-5 py-4 bg-[#1e1e30] border-b border-[#3b3b5a] shrink-0">
        <button onClick={() => navigate(-1)} className="text-white active:scale-95 transition-transform flex items-center gap-2 hover:bg-slate-800 p-2 rounded-lg">
          <ArrowLeft size={22} />
          <span className="font-bold hidden sm:inline">Back</span>
        </button>
        <h1 className="text-lg font-black text-white tracking-widest uppercase">Primary Sales</h1>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP CONFIG BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#161625] shrink-0 border-b border-[#3b3b5a]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Date</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full bg-[#1e1e30] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select User</label>
            <CustomSelect 
              options={users.map((u: any) => ({
                value: u.uid || u.employeeId,
                label: `${u.firstName} ${u.lastName || ''}`,
                subLabel: u.designation || u.employeeId,
                avatarUrl: u.profilePic,
                showDefaultAvatar: true
              }))}
              value={formData.employeeId}
              onChange={(val) => setFormData({...formData, employeeId: val})}
              placeholder="Select User"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Invoice Number</label>
            <input 
              type="text" 
              value={formData.invoiceNumber}
              onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
              placeholder="Enter Invoice No"
              className="w-full bg-[#1e1e30] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* EXCEL LIKE GRID */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#1a1a2e]">
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[#1e1e30] shadow-md">
              <tr>
                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-12 text-center">#</th>
                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-64">Product</th>
                <th className="p-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-32 bg-emerald-900/10">Prices (MRP/PTR/PTS)</th>
                <th className="p-3 text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-28 bg-rose-900/10">Purc. Rtn</th>
                <th className="p-3 text-[10px] font-black text-sky-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-28">Quantity</th>
                <th className="p-3 text-[10px] font-black text-sky-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-28">Free Stocks</th>
                <th className="p-3 text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-28">Total Qty</th>
                <th className="p-3 text-[10px] font-black text-sky-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-28">Discount %</th>
                <th className="p-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-r border-[#3b3b5a] w-32">Final Amt</th>
                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#3b3b5a] w-16 text-center">Del</th>
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
                  <tr key={row.id} className="hover:bg-[#1e1e30] transition-colors border-b border-[#3b3b5a]/50">
                    <td className="p-2 border-r border-[#3b3b5a]/50 text-center text-xs font-bold text-slate-500">{index + 1}</td>
                    <td className="p-2 border-r border-[#3b3b5a]/50 relative z-10">
                      <CustomSelect 
                        options={products.map((p: any) => ({
                          value: p.uid || p._id,
                          label: p.productName,
                          subLabel: p.category || p.division
                        }))}
                        value={row.productId}
                        onChange={(val) => handleRowChange(index, 'productId', val)}
                        placeholder="Select Product"
                      />
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50 bg-emerald-900/5">
                      <div className="flex flex-col gap-1 text-[11px] font-bold">
                        <div className="flex justify-between"><span className="text-slate-400">MRP:</span> <span className="text-white">₹{mrp.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">PTR:</span> <span className="text-emerald-400">₹{ptr.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">PTS:</span> <span className="text-sky-400">₹{pts.toFixed(2)}</span></div>
                      </div>
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50 bg-rose-900/5">
                      <input 
                        type="number"
                        min="0"
                        value={row.purcRtn}
                        onChange={e => handleRowChange(index, 'purcRtn', e.target.value)}
                        className="w-full bg-[#161625] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-rose-400 font-bold outline-none focus:border-rose-500 text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50">
                      <input 
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={e => handleRowChange(index, 'quantity', e.target.value)}
                        className="w-full bg-[#161625] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:border-sky-500 text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50">
                      <input 
                        type="number"
                        min="0"
                        value={row.freeStocks}
                        onChange={e => handleRowChange(index, 'freeStocks', e.target.value)}
                        className="w-full bg-[#161625] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:border-sky-500 text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50 text-center">
                      <span className="text-amber-400 font-black text-sm">{totalQty}</span>
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={row.discount}
                        onChange={e => handleRowChange(index, 'discount', e.target.value)}
                        className="w-full bg-[#161625] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-sky-400 font-bold outline-none focus:border-sky-500 text-center"
                        placeholder="0%"
                      />
                    </td>
                    <td className="p-2 border-r border-[#3b3b5a]/50 text-center">
                      <span className="text-emerald-400 font-black text-sm">₹{finalAmt.toFixed(2)}</span>
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => removeRow(index)}
                        className="text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-4">
            <button 
              onClick={addRow}
              className="flex items-center gap-2 bg-[#3b3b5a] hover:bg-[#4b4b6a] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-[#1e1e30] border-t border-[#3b3b5a] p-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-bold">
            Total Rows: <span className="text-white">{rows.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-300 bg-[#3b3b5a] hover:bg-[#4b4b6a] transition-colors">
              <Save size={18} /> Draft
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-colors">
              <Send size={18} /> Submit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
