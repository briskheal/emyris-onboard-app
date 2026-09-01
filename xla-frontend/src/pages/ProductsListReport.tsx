import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import ProductDetails from '../components/ProductDetails';
import * as XLSX from 'xlsx';

export default function ProductsListReport() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const divisions = useMemo(() => {
    const divs = new Set(products.map(p => p.division).filter(Boolean));
    return Array.from(divs);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedDivision) return products;
    return products.filter(p => p.division === selectedDivision);
  }, [products, selectedDivision]);

  const exportToExcel = () => {
    const dataToExport = filteredProducts.map((p, i) => ({
      'Sr no.': i + 1,
      Name: p.productName,
      Division: p.division,
      Packaging: p.packaging,
      MRP: p.mrp,
      PTS: p.pts,
      PTR: p.ptr,
      Category: p.category,
      Manufacturer: p.manufacturer,
      Composition: p.composition
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product List");
    XLSX.writeFile(wb, "Product List.xlsx");
  };

  if (viewingProduct) {
    return <ProductDetails product={viewingProduct} onBack={() => setViewingProduct(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Select Division</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <select 
            value={selectedDivision} 
            onChange={e => setSelectedDivision(e.target.value)}
            className="w-full max-w-sm bg-[#151521] border border-[#3b3b5a] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-sky-500 appearance-none"
          >
            <option value="">All Divisions</option>
            {divisions.map(d => (
              <option key={d as string} value={d as string}>
                {d as string}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({filteredProducts.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">Name ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Division</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Packaging</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MRP</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PTS</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PTR</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Images</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Products Found</td></tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={p._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{p.productName}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.division || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.packaging || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.mrp || '0'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.pts || '0'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{p.ptr || '0'}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="w-8 h-8 rounded bg-slate-800 mx-auto flex items-center justify-center text-[10px] text-slate-500">Img</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => setViewingProduct(p)} 
                          className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm mx-auto block"
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e] flex justify-end">
            <button onClick={exportToExcel} disabled={filteredProducts.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}