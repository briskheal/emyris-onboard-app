import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit, Eye, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Reusable Table Footer Component
function TableFooter({ data, fileName, currentPage, setCurrentPage, pageSize, setPageSize }: any) {
  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const handleExport = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k));
    const csvContent = [
      keys.join(','),
      ...data.map((row: any) => keys.map(k => `"${row[k] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  return (
    <div className="flex flex-wrap items-center justify-between bg-slate-800 p-4 border-t border-slate-700">
      <div className="flex items-center gap-4">
        <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">Export to CSV</button>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <span>Show</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 focus:outline-none">
            {[10, 25, 50, 100, 1000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>records</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">Next &gt;</button>
      </div>
    </div>
  );
}

export default function ManageProducts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'category' | 'type' | 'product' | 'upload' | 'supplier' | 'inventory'>('category');
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">
      <div className="flex items-center gap-4 px-8 py-5 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
          <ArrowLeft size={24} /> <span className="font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-slate-800/50 border-r border-slate-800 flex flex-col py-6 overflow-y-auto">
          <h2 className="px-6 text-emerald-400 font-black text-xl tracking-wider mb-6 uppercase">Manage Products</h2>
          <div className="flex flex-col space-y-2 px-4">
            <button onClick={() => setActiveTab('category')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'category' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>PRODUCT CATEGORY</button>
            <button onClick={() => setActiveTab('type')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'type' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>PRODUCT TYPE</button>
            <button onClick={() => setActiveTab('product')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'product' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>PRODUCT</button>
            <button onClick={() => setActiveTab('upload')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'upload' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>UPLOAD PRODUCT</button>
            <button onClick={() => setActiveTab('supplier')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'supplier' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>PRODUCT SUPPLIER</button>
            <button onClick={() => setActiveTab('inventory')} className={`text-left px-6 py-4 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === 'inventory' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>INVENTORY</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto">
          {activeTab === 'category' && <CategoryTab />}
          {activeTab === 'type' && <TypeTab />}
          {activeTab === 'product' && <ProductTab />}
          {activeTab === 'upload' && <UploadTab />}
          {activeTab === 'supplier' && <SupplierTab />}
          {activeTab === 'inventory' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
}

function CategoryTab() {
  const [data, setData] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/admin/products/categories');
      if (res.data.success) setData(res.data.categories);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/products/categories', { categoryName });
      if (res.data.success) { setCategoryName(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit Category Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/products/categories/${id}`, { categoryName: newName.trim() });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/products/categories/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE PRODUCT CATEGORY</h2>
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER PRODUCT CATEGORY *</label>
          <input required value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Enter Product Category" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">Add Category</button>
      </form>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Product Category</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-5 text-white font-bold">{d.categoryName}</td>
                  <td className="p-5 text-emerald-400 font-bold">{d.uid || '-'}</td>
                  <td className="p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(d._id, d.categoryName)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={data} fileName="Categories" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function TypeTab() {
  const [data, setData] = useState<any[]>([]);
  const [typeName, setTypeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/admin/products/types');
      if (res.data.success) setData(res.data.types);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/products/types', { typeName });
      if (res.data.success) { setTypeName(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit Product Type:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/products/types/${id}`, { typeName: newName.trim() });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/products/types/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE PRODUCT TYPE</h2>
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">PRODUCT TYPE *</label>
          <input required value={typeName} onChange={e => setTypeName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Enter Product Type" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">Add Product Type</button>
      </form>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">PRESENT TYPES</h3>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Product Type</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">UID</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-5 text-white font-bold">{d.typeName}</td>
                  <td className="p-5 text-emerald-400 font-bold">{d.uid || '-'}</td>
                  <td className="p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(d._id, d.typeName)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={data} fileName="Types" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function ProductTab() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewProduct, setViewProduct] = useState<any>(null); // For Details modal/view
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, typeRes, divRes] = await Promise.all([
        axios.get('/api/admin/products'),
        axios.get('/api/admin/products/categories'),
        axios.get('/api/admin/products/types'),
        axios.get('/api/admin/locations/divisions')
      ]);
      if (prodRes.data.success) setData(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (typeRes.data.success) setTypes(typeRes.data.types);
      if (divRes.data.success) setDivisions(divRes.data.divisions);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/products/${formData._id}` : '/api/admin/products';
      const method = isEditing ? axios.put : axios.post;
      const res = await method(url, formData);
      if (res.data.success) {
        setFormData({});
        setIsEditing(false);
        fetchData();
        alert(isEditing ? 'Updated successfully' : 'Added successfully');
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEditClick = (product: any) => {
    setFormData(product);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete product?')) return;
    try {
      const res = await axios.delete(`/api/admin/products/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  if (viewProduct) {
    return (
      <div className="max-w-4xl bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">PRODUCT DETAILS</h2>
          <button onClick={() => setViewProduct(null)} className="text-slate-400 hover:text-white font-bold px-4 py-2 bg-slate-700 rounded-lg">Close Details</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Name</label><div className="text-white font-bold">{viewProduct.productName}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">PTR</label><div className="text-white font-bold">{viewProduct.ptr}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">PTS</label><div className="text-white font-bold">{viewProduct.pts}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">MRP</label><div className="text-white font-bold">{viewProduct.mrp}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Category</label><div className="text-white font-bold">{viewProduct.category}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">GST</label><div className="text-white font-bold">{viewProduct.gst}%</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Manufacturer</label><div className="text-white font-bold">{viewProduct.manufacturer}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Type</label><div className="text-white font-bold">{viewProduct.type}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Packaging</label><div className="text-white font-bold">{viewProduct.packaging}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Composition</label><div className="text-white font-bold text-sm max-w-[200px] break-words">{viewProduct.composition}</div></div>
          <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1">Division</label><div className="text-white font-bold">{viewProduct.division}</div></div>
        </div>
      </div>
    );
  }

  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-full">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">{isEditing ? 'EDIT PRODUCT' : 'CREATE PRODUCT'}</h2>
      
      <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-12 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">PRODUCT NAME *</label><input required name="productName" value={formData.productName || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Product Name"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">PRODUCT COMPOSITION *</label><input required name="composition" value={formData.composition || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Product Composition"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT PRODUCT CATEGORY</label>
            <select name="category" value={formData.category || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c.categoryName}>{c.categoryName}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT PRODUCT TYPE</label>
            <select name="type" value={formData.type || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="">Select Type</option>
              {types.map(t => <option key={t._id} value={t.typeName}>{t.typeName}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">MANUFACTURER NAME</label><input name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Manufacturer"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">PRODUCT PACKAGING *</label><input required name="packaging" value={formData.packaging || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Packaging Details"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">DIVISION *</label>
            <select required name="division" value={formData.division || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="">Select Division</option>
              {divisions.map(d => <option key={d._id} value={d.divisionName}>{d.divisionName}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">MAX RETAIL PRICE *</label><input required type="number" step="0.01" name="mrp" value={formData.mrp || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter MRP"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">PRICE TO STOCKIST *</label><input required type="number" step="0.01" name="pts" value={formData.pts || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter PTS"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">PRICE TO RETAILERS *</label><input required type="number" step="0.01" name="ptr" value={formData.ptr || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter PTR"/></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">GST % *</label><input required type="number" step="0.1" name="gst" value={formData.gst || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter GST %"/></div>
        </div>
        <div className="flex justify-end gap-4 border-t border-slate-700 pt-4">
          {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({}); }} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Cancel</button>}
          <button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">{isEditing ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </form>

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr no.</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Name</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">UID</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Stock</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Division</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Packaging</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">MRP</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">PTS</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">PTR</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">View</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="hover:bg-slate-700/30 transition-colors text-sm">
                  <td className="p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-4 text-white font-bold">{d.productName}</td>
                  <td className="p-4 text-emerald-400 font-bold">{d.uid || '-'}</td>
                  <td className="p-4 text-center font-black text-white">{d.stock}</td>
                  <td className="p-4 text-slate-300">{d.division || '-'}</td>
                  <td className="p-4 text-slate-300">{d.packaging || '-'}</td>
                  <td className="p-4 text-slate-300">{d.mrp}</td>
                  <td className="p-4 text-slate-300">{d.pts}</td>
                  <td className="p-4 text-slate-300">{d.ptr}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => setViewProduct(d)} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg mx-auto block"><Eye size={20}/></button>
                  </td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => handleEditClick(d)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={11} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={data} fileName="Products" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function UploadTab() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">UPLOAD PRODUCT</h2>
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-lg">
        <label className="text-sm text-slate-400 font-bold mb-4 block uppercase tracking-wider">UPLOAD EXCEL *</label>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 bg-slate-900 border border-slate-600 hover:border-sky-500 transition-colors text-slate-300 px-4 py-3 rounded-lg cursor-pointer">
            <Upload size={18} />
            <span className="font-bold text-sm">Choose file</span>
            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" />
          </label>
          <span className="text-slate-500 text-sm italic">No file chosen</span>
        </div>
        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-700">
          <button className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Upload List</button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Download Format</button>
        </div>
      </div>
    </div>
  );
}

function SupplierTab() {
  const [data, setData] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/admin/products/suppliers');
      if (res.data.success) setData(res.data.suppliers);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/products/suppliers', { supplierName });
      if (res.data.success) { setSupplierName(''); fetchData(); } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEdit = async (id: string, currentName: string) => {
    const newName = window.prompt("Edit Supplier Name:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      const res = await axios.put(`/api/admin/products/suppliers/${id}`, { supplierName: newName.trim() });
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await axios.delete(`/api/admin/products/suppliers/${id}`);
      if (res.data.success) fetchData();
    } catch (e) { console.error(e); }
  };

  const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">CREATE PRODUCT SUPPLIER</h2>
      <form onSubmit={handleAdd} className="flex gap-6 items-end mb-12 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div className="flex-1">
          <label className="text-sm text-slate-400 font-bold mb-2 block">ENTER PRODUCT SUPPLIER *</label>
          <input required value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500" placeholder="Enter Supplier Name" />
        </div>
        <button disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-10 rounded-xl transition-colors h-[58px]">Add Supplier</button>
      </form>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Sr no.</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm bg-slate-800">Product Supplier</th>
                <th className="p-5 font-bold uppercase tracking-wider text-sm text-center bg-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map((d, i) => (
                <tr key={d._id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-5 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="p-5 text-white font-bold">{d.supplierName}</td>
                  <td className="p-5 text-center flex justify-center gap-2">
                    <button onClick={() => handleEdit(d._id, d.supplierName)} className="text-sky-500 hover:text-sky-400 bg-sky-500/10 p-2 rounded-lg"><Edit size={20}/></button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-2 rounded-lg"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
            </tbody>
          </table>
        </div>
        <TableFooter data={data} fileName="Suppliers" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
    </div>
  );
}

function InventoryTab() {
  const [data, setData] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<'add' | 'full' | 'product_wise'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const [invRes, supRes, prodRes] = await Promise.all([
        axios.get('/api/admin/products/inventory'),
        axios.get('/api/admin/products/suppliers'),
        axios.get('/api/admin/products')
      ]);
      if (invRes.data.success) setData(invRes.data.inventory);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/products/inventory', formData);
      if (res.data.success) {
        setFormData({});
        fetchData();
        alert('Inventory added successfully! Stock updated.');
      } else alert(res.data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (viewMode === 'full') {
    const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return (
      <div className="max-w-5xl">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase cursor-pointer hover:text-sky-400 flex items-center gap-2" onClick={() => setViewMode('add')}>
          <ArrowLeft size={24} /> ALL INVENTORY
        </h2>
        <div className="flex justify-between items-center mb-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 inline-block">
            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">SELECT MONTH *</label>
            <select className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white outline-none"><option>August</option></select>
          </div>
          <button onClick={() => setViewMode('product_wise')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Product Wise</button>
        </div>
        
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col mt-4">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">FULL INVENTORY</h3>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse relative whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr no.</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Supplier</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Total</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((d, i) => (
                  <tr key={d._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="p-4 text-white">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-300 font-bold">{d.supplier}</td>
                    <td className="p-4 text-slate-300">₹{d.totalPrice}</td>
                    <td className="p-4 text-center">
                      <button className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg mx-auto block"><Eye size={20}/></button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
              </tbody>
            </table>
          </div>
          <TableFooter data={data} fileName="InventoryLog" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      </div>
    );
  }

  if (viewMode === 'product_wise') {
    const paginated = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return (
      <div className="max-w-6xl">
        <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase cursor-pointer hover:text-sky-400 flex items-center gap-2" onClick={() => setViewMode('full')}>
          <ArrowLeft size={24} /> PRODUCT WISE INVENTORY
        </h2>
        
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 inline-block mb-6">
            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">SELECT VIEW TYPE *</label>
            <select className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white outline-none w-48"><option>Current Stock</option></select>
        </div>

        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">INVENTORY DETAILS</h3>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse relative whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Sr no.</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">Product Name</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800 text-center">Current Stock</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">MRP</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">PTS</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs bg-slate-800">PTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((p, i) => (
                  <tr key={p._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-slate-300">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="p-4 text-white font-bold">{p.productName}</td>
                    <td className="p-4 text-emerald-400 font-black text-center">{p.stock}</td>
                    <td className="p-4 text-slate-300">{p.mrp}</td>
                    <td className="p-4 text-slate-300">{p.pts}</td>
                    <td className="p-4 text-slate-300">{p.ptr}</td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No data found.</td></tr>}
              </tbody>
            </table>
          </div>
          <TableFooter data={products} fileName="ProductWiseInventory" currentPage={currentPage} setCurrentPage={setCurrentPage} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-black text-white mb-8 tracking-wide uppercase">INVENTORY</h2>
      
      <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT DATE *</label><input type="date" required name="date" value={formData.date || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT PRODUCT SUPPLIER *</label>
            <select required name="supplier" value={formData.supplier || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s.supplierName}>{s.supplierName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold mb-1 block">UPLOAD FILE</label>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2">
              <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors">Choose file<input type="file" className="hidden" /></label>
              <span className="text-xs text-slate-500 italic">No file chosen</span>
            </div>
          </div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT PRODUCT *</label>
            <select required name="product" value={formData.product || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
              <option value="">Select Product</option>
              {products.map(p => <option key={p._id} value={p.productName}>{p.productName}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">UNIT PRICE *</label><input type="number" step="0.01" required name="unitPrice" value={formData.unitPrice || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Unit Price" /></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">QUANTITY *</label><input type="number" required name="quantity" value={formData.quantity || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Quantity" /></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">TOTAL PRICE *</label><input type="number" step="0.01" required name="totalPrice" value={formData.totalPrice || (formData.quantity * formData.unitPrice) || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Total Price" /></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">BATCH NUMBER *</label><input type="text" required name="batchNumber" value={formData.batchNumber || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Batch Number" /></div>
          <div><label className="text-xs text-slate-400 font-bold mb-1 block">EXPIRY DATE *</label><input type="date" required name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
        </div>
        <div className="flex justify-end gap-4 border-t border-slate-700 pt-4">
          <button type="button" onClick={() => setViewMode('full')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">See Full Inventory</button>
          <button disabled={loading} type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">Add Product</button>
        </div>
      </form>
    </div>
  );
}
