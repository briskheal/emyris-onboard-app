import { Folder, ArrowLeft, Trash2, Save, CheckCircle, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { formatStorageDate, toInputDateValue, getDynamicYears } from '../utils/dateUtils';

const todayFormatted = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const cleanNumberInput = (val: string) => {
  if (!val) return '';
  return val.replace(/^0+(?=\d)/, '');
};

export default function SecondarySales() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [fieldUsers, setFieldUsers] = useState<any[]>([]);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' }) + ' ' + new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    date: todayFormatted(),
    month: currentMonth.split(' ')[0],
    year: currentMonth.split(' ')[1],
    invoiceDate: todayFormatted(),
    invoiceNumber: '',
    division: '',
    headquarter: '',
    stockist: ''
  });

  const [rows, setRows] = useState([
    { id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: '', receivedQty: '', salesQty: '', freeStocks: '' }
  ]);

  const monthOptions = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const yearOptions = getDynamicYears(3, 2).map(String);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, hRes, dRes, uRes] = await Promise.all([
          axios.get('/api/xl/reports/products').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/reports/stockists').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/hq').catch(() => ({ data: { data: [] } })),
          axios.get('/api/xl/division').catch(() => ({ data: { data: [] } })),
          axios.get('/api/admin/users').catch(() => ({ data: { users: [] } }))
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

        setFieldUsers(uRes.data?.users || []);
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
          setExistingRecord(d);
          setFormData({
            date: d.date || (d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : ''),
            month: d.month || currentMonth.split(' ')[0],
            year: d.year || currentMonth.split(' ')[1],
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || '',
            headquarter: d.headquarter || (stockists.find(s => s._id === d.stockist || s.uid === d.stockist)?.headquarter || ''),
            stockist: d.stockist || ''
          });
          if (d.productsData) {
            try {
               const pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
               if (Array.isArray(pData) && pData.length > 0) {
                 const adaptedRows = pData.map((row: any, i: number) => {
                   let productId = row.productId || row.product || '';
                   if (productId) {
                     const match = products.find((p: any) =>
                       p.uid === productId || p._id === productId ||
                       p.productName === productId || p.name === productId ||
                       p.productName === row.product || p.uid === row.product || p._id === row.product
                     );
                     if (match) productId = match.uid || match._id || productId;
                   }
                   return {
                     id: row.id || Date.now() + i,
                     productId,
                     price: '',
                     selectedPriceType: (row.priceType || row.selectedPriceType || 'PTR').toUpperCase(),
                     customPrice: row.customPrice || row.basePrice || '',
                     salesQty: row.salesQty || row.qty || '',
                     freeStocks: row.freeStocks || row.free || '',
                     openingQty: row.openingQty || 0,
                     receivedQty: row.receivedQty || 0,
                     closingQty: row.closingQty || 0
                   };
                 });
                 setRows(adaptedRows);
                 const stockist = d.stockist || '';
                 const month = d.month || currentMonth.split(' ')[0];
                 const year = d.year || currentMonth.split(' ')[1];
                 adaptedRows.forEach((row, idx) => {
                   if (row.productId) {
                     fetchBalances(stockist, month, year, row.productId, idx);
                   }
                 });
               }
            } catch(e){}
          }
        }
      });
    }
  }, [id, products.length]);

  useEffect(() => {
    if (id) return; // Don't auto-populate if editing an existing record
    if (!formData.stockist || !formData.month || !formData.year) return;

    const autoPopulate = async () => {
      try {
        const res = await axios.get(`/api/xl/secondary-sales-data/auto-populate?stockist=${formData.stockist}&month=${formData.month}&year=${formData.year}`);
        if (res.data.success && res.data.data.length > 0) {
          const newRows = res.data.data.map((item: any) => ({
            id: Date.now() + Math.random(),
            productId: item.productId,
            price: '',
            openingQty: item.openingQty,
            receivedQty: item.receivedQty,
            salesQty: '',
            freeStocks: '',
            selectedPriceType: 'PTR',
            customPrice: ''
          }));
          setRows(newRows);
        } else {
          setRows([{ id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: '', receivedQty: '', salesQty: '', freeStocks: '' }]);
        }
      } catch(e) {
        console.error(e);
      }
    };
    autoPopulate();
  }, [formData.stockist, formData.month, formData.year, id]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: '', receivedQty: '', salesQty: '', freeStocks: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
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

  const filteredProducts = formData.division 
    ? products.filter(p => p.division && p.division.trim().toLowerCase() === formData.division.trim().toLowerCase()) 
    : products;
  const filteredStockists = formData.headquarter 
    ? stockists.filter(s => s.headquarter && s.headquarter.trim().toLowerCase() === formData.headquarter.trim().toLowerCase()) 
    : stockists;

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

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to DELETE this entire secondary sales record? This cannot be undone.')) return;
    try {
      const token = sessionStorage.getItem('xla_token') || '';
      const res = await axios.delete(`/api/xl/secondary-sales/delete/${id}?fromAdmin=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        alert('Record deleted successfully.');
        navigate('/extras/secondary/all');
      } else {
        alert(res.data.message || 'Failed to delete record.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting record.');
    }
  };

  const getAllottedRep = () => {
    const st = stockists.find((s: any) => s.uid === formData.stockist || s._id === formData.stockist);
    const repEmpId = st?.userAllotted || st?.employeeId;
    if (repEmpId) {
      const u = fieldUsers.find((user: any) => user.employeeId === repEmpId || user._id === repEmpId || user.uid === repEmpId);
      if (u) return { empId: repEmpId, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name, isVacant: false };
      return { empId: repEmpId, name: repEmpId, isVacant: false };
    }
    if (formData.headquarter) {
      const u = fieldUsers.find((user: any) => user.hq === formData.headquarter && user.status === 'Active');
      if (u) return { empId: u.employeeId, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name, isVacant: false };
      return { empId: `VACANT_${formData.headquarter}`, name: 'Vacant Territory', isVacant: true };
    }
    return null;
  };

  const handleSave = async (isDraft = false) => {
    if (!formData.headquarter || !formData.stockist || !formData.month || !formData.year) {
      alert('Please fill all mandatory fields (Month, Year, HQ, Stockist)');
      return;
    }
    
    // Map closingQty into validRows for saving
    const validRows = rows.filter(r => r.productId && (Number(r.salesQty) > 0 || Number(r.freeStocks) > 0 || Number(r.openingQty) > 0 || Number(r.receivedQty) > 0)).map(r => {
        const totalQty = (Number(r.openingQty) || 0) + (Number(r.receivedQty) || 0);
        const closingQty = totalQty - (Number(r.salesQty) || 0) - (Number(r.freeStocks) || 0);
        return { 
          ...r, 
          openingQty: Number(r.openingQty) || 0,
          receivedQty: Number(r.receivedQty) || 0,
          salesQty: Number(r.salesQty) || 0,
          freeStocks: Number(r.freeStocks) || 0,
          closingQty 
        };
    });
    
    if (validRows.length === 0) {
      alert('Please add at least one valid product.');
      return;
    }

    try {
      const rep = getAllottedRep();
      const targetEmpId = (id && existingRecord?.employeeId) ? existingRecord.employeeId : (rep?.empId || 'ADMIN');

      const payload = {
        ...formData,
        date: formatStorageDate(formData.date),
        invoiceDate: formatStorageDate(formData.invoiceDate || formData.date),
        employeeId: targetEmpId,
        amount: totals.amount,
        status: isDraft ? 'Draft' : 'Approved', // Auto-approved for Admin entries
        fromAdmin: true,
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
                date: todayFormatted(),
                year: currentMonth.split(' ')[1],
                month: currentMonth.split(' ')[0],
                invoiceDate: todayFormatted(),
                invoiceNumber: '',
                division: '',
                headquarter: '',
                stockist: ''
            });
            setRows([{ id: Date.now(), productId: '', price: '', customPrice: '', selectedPriceType: 'PTR', openingQty: '', receivedQty: '', salesQty: '', freeStocks: '' }]);
        }
      } else {
        alert('Failed to save.');
      }
    } catch (error) {
      alert('Error saving data.');
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#161625] text-white text-xs">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-[#161625] text-[#d1d5db] font-sans overflow-hidden">
      {/* FROZEN TOP HEADER & COMPACT CONTROLS STRIP */}
      <div className="shrink-0 bg-[#161625] border-b border-[#3b3b5a]/70 z-30">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-3 md:px-4 py-1.5 bg-[#1a1a2e] border-b border-[#3b3b5a]/60 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-emerald-400 transition-colors bg-[#232338] p-1.5 rounded" title="Go to Admin Menu">
              <Home size={15} />
            </button>
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors bg-[#232338] p-1.5 rounded" title="Back">
              <ArrowLeft size={15} />
            </button>
            <h1 className="text-xs md:text-sm font-bold text-white tracking-wider uppercase ml-1">SECONDARY SALES</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {id && (
              <button onClick={handleDelete} className="bg-transparent border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5">
                <Trash2 size={13} /> Delete Record
              </button>
            )}
          </div>
        </div>

        {/* COMPACT BORDERLESS CONTROLS STRIP */}
        <div className="px-3 md:px-4 py-2 bg-[#161625]">
          <div className="flex flex-wrap items-end gap-2 md:gap-2.5">
            
            {/* Year */}
            <div className="flex flex-col w-[85px] shrink-0">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Year <span className="text-rose-500">*</span>
              </label>
              <CustomSelect 
                compact={true}
                options={yearOptions.map(y => ({ value: y, label: y }))} 
                value={formData.year} 
                onChange={(val) => setFormData({...formData, year: val})} 
                placeholder="Year"
              />
            </div>

            {/* Month */}
            <div className="flex flex-col w-[85px] shrink-0">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Month <span className="text-rose-500">*</span>
              </label>
              <CustomSelect 
                compact={true}
                options={monthOptions.map(m => ({ value: m, label: m }))} 
                value={formData.month} 
                onChange={(val) => setFormData({...formData, month: val})} 
                placeholder="Month"
              />
            </div>

            {/* Submission Date */}
            <div className="flex flex-col w-[130px] shrink-0">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Submission Date
              </label>
              <div className="bg-[#1a1a2e] border border-[#3b3b5a] rounded-md px-2 flex items-center h-[30px]">
                <input 
                  type="date" 
                  value={toInputDateValue(formData.date)} 
                  onChange={e => setFormData({...formData, date: e.target.value, invoiceDate: e.target.value})} 
                  className="w-full bg-transparent outline-none text-xs text-white" 
                />
              </div>
            </div>

            {/* Division */}
            <div className="flex flex-col w-[130px] shrink-0">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Division
              </label>
              <CustomSelect 
                compact={true}
                options={divisions} 
                value={formData.division} 
                onChange={(val) => setFormData({...formData, division: val})} 
                placeholder="Select Division"
              />
            </div>

            {/* Headquarter */}
            <div className="flex flex-col w-[145px] shrink-0">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Headquarter <span className="text-rose-500">*</span>
              </label>
              <CustomSelect 
                compact={true}
                options={hqs} 
                value={formData.headquarter} 
                onChange={(val) => setFormData({...formData, headquarter: val, stockist: ''})} 
                placeholder="Select HQ"
              />
            </div>

            {/* Stockist */}
            <div className="flex flex-col flex-1 min-w-[200px] max-w-[340px]">
              <label className="text-[10px] font-semibold text-[#8b8baf] mb-1">
                Stockist <span className="text-rose-500">*</span>
              </label>
              <CustomSelect 
                compact={true}
                options={filteredStockists.map(s => ({ value: s._id || s.uid, label: s.businessName || s.name || s.uid }))} 
                value={stockists.find(s => s.uid === formData.stockist || s._id === formData.stockist)?._id || formData.stockist} 
                onChange={(val) => setFormData({...formData, stockist: val})} 
                placeholder="Select Stockist"
              />
            </div>

            {/* Allotted Representative Indicator */}
            {(() => {
              const rep = getAllottedRep();
              if (!rep) return null;
              return (
                <div className="flex flex-col justify-end shrink-0 pb-0.5">
                  <div className={`px-2.5 py-1 rounded text-[11px] font-bold border flex items-center gap-1.5 ${rep.isVacant ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-sky-500/10 border-sky-500/30 text-sky-300'}`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">Territory Rep:</span>
                    <span>{rep.name}</span>
                    {!rep.isVacant && <span className="text-[10px] opacity-75">({rep.empId})</span>}
                  </div>
                </div>
              );
            })()}

            {/* All Sec Sales Button */}
            <div className="flex flex-col justify-end w-[110px] shrink-0 ml-auto">
              <button 
                onClick={() => navigate('/extras/secondary/all')} 
                className="h-[30px] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-md font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Folder size={13} /> All Sec Sales
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* SCROLLING TABLE BLOCK WITH FROZEN THEAD */}
      <div className="flex-1 min-h-0 overflow-auto px-3 md:px-4 py-2">
        <div className="bg-[#212136] rounded-xl shadow-lg border border-[#3b3b5a]/50">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="sticky top-0 z-20 bg-[#1a1a2e] text-[#8b8baf] text-[10px] uppercase tracking-wider border-b border-[#3b3b5a] shadow-sm">
                <tr>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center w-10 bg-[#1a1a2e]">Sr</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] min-w-[220px] bg-[#1a1a2e]">Product Name</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center w-[130px] bg-[#1a1a2e]">Price (₹)</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-orange-400 w-[85px] bg-[#1a1a2e]">Open. Bal. Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-400 w-[75px] bg-[#1a1a2e]">Rcvd. Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-white w-[75px] bg-[#1a1a2e]">Tot. Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-emerald-400 w-[80px] bg-[#1a1a2e]">Sales Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-purple-400 w-[75px] bg-[#1a1a2e]">Free Qty</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-sky-400 w-[95px] bg-[#1a1a2e]">Sales Value</th>
                  <th className="p-2 font-bold border-r border-[#3b3b5a] text-center text-amber-300 w-[80px] bg-[#1a1a2e]">Clos. Qty</th>
                  <th className="p-2 font-bold text-center w-10 bg-[#1a1a2e]">Del</th>
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
                      <td className="p-1.5 text-center text-xs font-semibold border-r border-[#3b3b5a]/50 text-[#8b8baf]">{index + 1}</td>
                      
                      {/* Product Dropdown */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 min-w-[220px]">
                        <CustomSelect 
                          compact={true}
                          options={(() => {
                            const opts = filteredProducts.map((p: any) => ({ value: p.uid || p._id, label: p.productName || p.name || p.uid }));
                            if (row.productId && !opts.find(o => o.value === row.productId)) {
                              const globalProd = products.find(p => p.uid === row.productId || p._id === row.productId || p.productName === row.productId);
                              const label = globalProd ? (globalProd.productName || globalProd.name || globalProd.uid) : row.productId;
                              opts.unshift({ value: row.productId, label });
                            }
                            return opts;
                          })()}
                          value={row.productId}
                          onChange={(val) => handleRowChange(index, 'productId', val)}
                          placeholder="Select Product"
                        />
                      </td>
                        
                      {/* Price Type Selector */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-[130px]">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="flex flex-col gap-[1px] w-9">
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTR')} className={`text-[9px] font-bold py-[2px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTR' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTR</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'PTS')} className={`text-[9px] font-bold py-[2px] px-1 rounded tracking-wide ${row.selectedPriceType === 'PTS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>PTS</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'MRP')} className={`text-[9px] font-bold py-[2px] px-1 rounded tracking-wide ${row.selectedPriceType === 'MRP' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>MRP</button>
                            <button onClick={() => handleRowChange(index, 'selectedPriceType', 'CUS')} className={`text-[9px] font-bold py-[2px] px-1 rounded tracking-wide ${row.selectedPriceType === 'CUS' ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#8b8baf] hover:bg-[#3b3b5a]'}`}>CUS</button>
                          </div>
                          <div className="w-14 shrink-0">
                            {row.selectedPriceType === 'CUS' ? (
                              <input 
                                type="number" 
                                min="0" 
                                value={row.customPrice} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => handleRowChange(index, 'customPrice', e.target.value)} 
                                className="w-full h-[28px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 text-xs text-sky-400 outline-none focus:border-sky-500 text-center font-bold" 
                                placeholder="0.00" 
                              />
                            ) : (
                              <div className="w-full h-[28px] bg-[#1a1a2e] border border-[#3b3b5a] rounded px-1 flex items-center justify-center text-xs text-[#8b8baf] font-bold">
                                {activePrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Open. Bal. Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 bg-orange-950/10 w-[85px]">
                        <input 
                          type="number" 
                          min="0" 
                          value={row.openingQty ?? ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleRowChange(index, 'openingQty', cleanNumberInput(e.target.value))} 
                          placeholder="0"
                          className="w-full h-[28px] bg-[#1a1a2e] border border-orange-900/50 rounded px-1 text-xs text-orange-400 font-bold outline-none focus:border-orange-500 text-center" 
                        />
                      </td>

                      {/* Rcvd. Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 bg-sky-950/10 w-[75px]">
                        <input 
                          type="number" 
                          min="0" 
                          value={row.receivedQty ?? ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleRowChange(index, 'receivedQty', cleanNumberInput(e.target.value))} 
                          placeholder="0"
                          className="w-full h-[28px] bg-[#1a1a2e] border border-sky-900/50 rounded px-1 text-xs text-sky-300 font-bold outline-none focus:border-sky-500 text-center" 
                        />
                      </td>

                      {/* Tot. Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center font-black text-white bg-white/5 text-xs w-[75px]">
                        {totalQty}
                      </td>
                      
                      {/* Sales Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-[80px]">
                        <input 
                          type="number" 
                          min="0" 
                          value={row.salesQty ?? ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleRowChange(index, 'salesQty', cleanNumberInput(e.target.value))} 
                          placeholder="0"
                          className="w-full h-[28px] bg-[#1a1a2e] border border-emerald-900/50 rounded px-1 text-xs text-emerald-300 font-bold outline-none focus:border-emerald-500 text-center" 
                        />
                      </td>

                      {/* Free Qty */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 w-[75px]">
                        <input 
                          type="number" 
                          min="0" 
                          value={row.freeStocks ?? ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleRowChange(index, 'freeStocks', cleanNumberInput(e.target.value))} 
                          placeholder="0"
                          className="w-full h-[28px] bg-[#1a1a2e] border border-purple-900/50 rounded px-1 text-xs text-purple-300 font-bold outline-none focus:border-purple-500 text-center" 
                        />
                      </td>
                      
                      {/* Sales Value */}
                      <td className="p-1.5 border-r border-[#3b3b5a]/50 text-center font-bold text-sky-400 text-xs w-[95px]">
                        {salesValue.toFixed(2)}
                      </td>

                      {/* Clos. Qty */}
                      <td className={`p-1.5 border-r border-[#3b3b5a]/50 text-center font-black text-xs w-[80px] ${closingQty < 0 ? 'text-rose-400 bg-rose-950/20' : 'text-amber-300 bg-amber-950/10'}`}>
                        {closingQty}
                      </td>

                      {/* Delete Row */}
                      <td className="p-1.5 text-center w-10">
                        <button onClick={() => removeRow(index)} className="text-[#8b8baf] hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10 mx-auto" title="Delete Row">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Add Product Button */}
            <div className="p-2 border-t border-[#3b3b5a]/50 bg-[#1a1a2e]">
              <button onClick={addRow} className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded hover:bg-sky-500/10">
                + Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="shrink-0 bg-[#161625] border-t border-[#3b3b5a]/70 px-4 py-2 flex flex-col sm:flex-row justify-between items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <span className="text-[10px] text-[#8b8baf] font-bold uppercase tracking-wider">Total Sales Value:</span>
          <span className="text-base md:text-lg font-black text-sky-400">₹ {totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button onClick={() => handleSave(true)} className="flex-1 sm:flex-none bg-[#232338] hover:bg-[#2c2c46] border border-[#3b3b5a] text-white px-4 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs">
            <Save size={14} /> Save as Draft
          </button>
          <button onClick={() => handleSave(false)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 rounded-md font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 text-xs">
            <CheckCircle size={14} /> {id ? 'Update Data' : 'Submit Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
