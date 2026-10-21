import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  Plus, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  Package, 
  TrendingUp, 
  Zap, 
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CustomSelect from '../components/CustomSelect';

type ProfitTab = 'PRODUCTS' | 'ROI';

interface ProfitProductRecord {
  _id: string;
  month: string;
  year: string;
  hq: string;
  productId: string;
  productName: string;
  priceType: 'PTS' | 'PTR' | 'MRP';
  unitPrice: number;
  quantity: number;
  totalValue: number;
  remarks?: string;
}

export default function ProfitCenterManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfitTab>('PRODUCTS');

  // Date Filters
  const currentDate = new Date();
  const currentMonthStr = currentDate.toLocaleString('en-US', { month: 'short' });
  const currentYearStr = String(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(`${currentMonthStr}, ${currentYearStr}`);

  // Headquarter Filter
  const [hqs, setHqs] = useState<string[]>([]);
  const [selectedHq, setSelectedHq] = useState<string>('ALL');

  // Price Type Filter (PTS, PTR, MRP)
  const [selectedPriceType, setSelectedPriceType] = useState<'PTS' | 'PTR' | 'MRP'>('PTS');

  // Product Master
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Table Data
  const [records, setRecords] = useState<ProfitProductRecord[]>([]);
  const [roiData, setRoiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [formProduct, setFormProduct] = useState<any>(null);
  const [formQty, setFormQty] = useState<string>('10');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Parse Month & Year
  const [monthName, yearVal] = useMemo(() => {
    if (selectedMonth.includes(',')) {
      const parts = selectedMonth.split(',');
      return [parts[0].trim(), parts[1].trim()];
    }
    return [currentMonthStr, currentYearStr];
  }, [selectedMonth, currentMonthStr, currentYearStr]);

  const daysInMonth = useMemo(() => {
    const monthsMap: Record<string, number> = {
      jan: 31, feb: 28, mar: 31, apr: 30, may: 31, jun: 30,
      jul: 31, aug: 31, sep: 30, oct: 31, nov: 30, dec: 31
    };
    const key = monthName.toLowerCase().substring(0, 3);
    const yr = Number(yearVal) || 2026;
    if (key === 'feb' && ((yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0)) return 29;
    return monthsMap[key] || 30;
  }, [monthName, yearVal]);

  // Load HQs & Products
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [hRes, pRes] = await Promise.allSettled([
          axios.get('/api/xl/locations/hqs').catch(() => axios.get('/api/xl/hqs')),
          axios.get('/api/xl/products').catch(() => axios.get('/api/xl/reports/products'))
        ]);

        if (hRes.status === 'fulfilled' && hRes.value?.data) {
          const raw = hRes.value.data;
          const hList = Array.isArray(raw) ? raw : (raw.hqs || raw.data || []);
          const names = hList.map((h: any) => typeof h === 'string' ? h : (h.name || h.headquarter || '')).filter(Boolean);
          setHqs(Array.from(new Set(names)) as string[]);
        }
        if (pRes.status === 'fulfilled' && pRes.value?.data) {
          const raw = pRes.value.data;
          setProducts(Array.isArray(raw) ? raw : (raw.products || raw.data || []));
        }
      } catch (e) {
        console.error('Error fetching profit masters:', e);
      }
    };
    fetchMasters();
  }, []);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PRODUCTS') {
        const res = await axios.get('/api/xl/profit-center', {
          params: { month: selectedMonth, year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setRecords(res.data.data || []);
        }
      } else {
        const res = await axios.get('/api/xl/profit-center/roi', {
          params: { month: selectedMonth, year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setRoiData(res.data);
        }
      }
    } catch (e) {
      console.error('Error fetching profit center data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedMonth, selectedHq]);

  // Total value for summary card
  const totalValue = useMemo(() => {
    return records.reduce((s, r) => s + (Number(r.totalValue) || 0), 0);
  }, [records]);

  // Handle Select Product to Add
  const handleSelectProduct = (val: string) => {
    setSelectedProductId(val);
    const p = products.find(x => (x.productName || x.name || x._id) === val);
    if (p) {
      setFormProduct(p);
      let pr = Number(selectedPriceType === 'MRP' ? p.mrp : selectedPriceType === 'PTR' ? p.ptr : p.pts) || 0;
      if (!pr) pr = Number(p.pts || p.ptr || p.mrp || 0);
      setFormPrice(String(pr));
      setShowAddModal(true);
    }
  };

  // Submit Product Add
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct) return;
    setSubmitting(true);
    try {
      const pName = formProduct.productName || formProduct.name;
      const q = Number(formQty) || 0;
      const p = Number(formPrice) || 0;
      await axios.post('/api/xl/profit-center', {
        month: selectedMonth,
        year: yearVal,
        hq: selectedHq,
        productId: formProduct._id || formProduct.uid || pName,
        productName: pName,
        priceType: selectedPriceType,
        unitPrice: p,
        quantity: q,
        totalValue: q * p,
        remarks: formRemarks
      });
      setShowAddModal(false);
      setSelectedProductId('');
      setFormProduct(null);
      setFormRemarks('');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error saving product profit entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product entry
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this product from profit center?')) return;
    try {
      await axios.delete(`/api/xl/profit-center/${id}`);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error deleting entry');
    }
  };

  // Auto-Sync from Sales
  const handleAutoSync = async () => {
    if (!confirm(`Auto-sync all products from catalog and calculate values using ${selectedPriceType} price for ${selectedMonth}?`)) return;
    setSyncing(true);
    try {
      const res = await axios.post('/api/xl/profit-center/auto-sync', {
        month: selectedMonth,
        year: yearVal,
        hq: selectedHq,
        priceType: selectedPriceType
      });
      if (res.data?.success) {
        alert(res.data.message || 'Auto-sync completed!');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      alert('Error syncing products');
    } finally {
      setSyncing(false);
    }
  };

  // Excel Export
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    if (activeTab === 'PRODUCTS') {
      const exportData = records.map((r, i) => ({
        'Sr no.': i + 1,
        'Product Name': r.productName,
        'Quantity': r.quantity,
        'Price Type': r.priceType,
        'Unit Price (Rs)': r.unitPrice,
        'Total Value (Rs)': r.totalValue,
        'Headquarter': r.hq || 'All HQs',
        'Period': `${r.month} ${r.year}`
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Profit_Products');
      XLSX.writeFile(wb, `Profit_Center_Products_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    } else if (roiData?.breakdown) {
      const exportData = roiData.breakdown.map((b: any, i: number) => ({
        'Sr no.': i + 1,
        'Headquarter': b.hq,
        'Total Revenue (Rs)': b.revenue,
        'Cost Center Expenses (Rs)': b.expense,
        'Net Margin (Rs)': b.netMargin,
        'ROI Achievement (%)': `${b.roiPct}%`,
        'Status': b.status
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Territory_ROI');
      XLSX.writeFile(wb, `Territory_ROI_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    }
  };

  const getRoiColorBadge = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    if (pct >= 80) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40';
    return 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
  };

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-16 md:pb-0 relative overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center justify-between px-4 pt-8 pb-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/extras/profit')} className="text-white active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold">
          <ArrowLeft size={18} /> Profit Center
        </button>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{activeTab}</span>
      </div>

      {/* Main Layout: Sub-menu Sidebar + Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">

        {/* LEFT SUB-SIDEBAR: MANAGE PROFIT CENTER (Matches Medom Reference) */}
        <aside className="w-full md:w-60 bg-slate-900 md:bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-300 flex items-center gap-2">
              Manage Profit Center
            </h2>
            <ChevronDown size={14} className="text-sky-400" />
          </div>

          <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-3 gap-1">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-left relative ${
                activeTab === 'PRODUCTS' 
                  ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {activeTab === 'PRODUCTS' && (
                <div className="hidden md:block absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r-full" />
              )}
              <Package size={16} className={activeTab === 'PRODUCTS' ? 'text-sky-400' : 'text-slate-400'} />
              <span>PRODUCTS</span>
            </button>

            <button
              onClick={() => setActiveTab('ROI')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-left relative ${
                activeTab === 'ROI' 
                  ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {activeTab === 'ROI' && (
                <div className="hidden md:block absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r-full" />
              )}
              <TrendingUp size={16} className={activeTab === 'ROI' ? 'text-sky-400' : 'text-slate-400'} />
              <span>ROI</span>
            </button>
          </nav>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col overflow-y-auto px-4 py-3 md:px-6 md:py-4">
          
          {/* TOP BREADCRUMB & HELP HEADER */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/extras/profit')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="uppercase text-sm font-black text-white tracking-wide">&lt; {activeTab}</span>
              </button>
            </div>
            <button 
              onClick={() => setShowHelpModal(true)}
              className="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} /> How does it work?
            </button>
          </div>

          {/* BUDGET VS ACTUAL VARIANCE STATUS BAR (User Requested Rules) */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 border border-slate-700/70 px-4 py-2 rounded-xl mb-3 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Variance Rule:
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                &gt; 100% (Green: Target Exceeded / Profitable)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                80% - 90% (Yellow: Moderate)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                &lt; 80% (Red: Critical Shortfall / Deficit)
              </span>
            </div>
          </div>

          {/* CONTROLS BAR & KPI SUMMARY CARD ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 items-stretch">
            
            {/* Filter Controls (Cols 8) */}
            <div className="lg:col-span-8 bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl shadow-lg flex flex-col justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Select Month */}
                <div>
                  <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                    Select Month *
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                  >
                    {['Oct, 2026', 'Sep, 2026', 'Aug, 2026', 'Jul, 2026', 'Jun, 2026', 'May, 2026', 'Apr, 2026'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Select HQ */}
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Select Headquarter *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'ALL', label: 'All Headquarters' },
                      ...hqs.map(hq => ({ value: hq, label: hq }))
                    ]}
                    value={selectedHq}
                    onChange={(val) => setSelectedHq(val)}
                    placeholder="Select HQ"
                    compact={true}
                  />
                </div>
              </div>

              {activeTab === 'PRODUCTS' && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-700/50 items-end">
                  {/* Select Price Type: PTS, PTR, MRP */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                      Select Price *
                    </label>
                    <select
                      value={selectedPriceType}
                      onChange={e => setSelectedPriceType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="PTS">PTS (Stockist Price)</option>
                      <option value="PTR">PTR (Retailer Price)</option>
                      <option value="MRP">MRP (Max Retail Price)</option>
                    </select>
                  </div>

                  {/* Select Product */}
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Select Product *
                    </label>
                    <CustomSelect
                      options={products.map(p => {
                        const pName = p.productName || p.name;
                        const price = selectedPriceType === 'MRP' ? p.mrp : selectedPriceType === 'PTR' ? p.ptr : p.pts;
                        return {
                          value: pName,
                          label: pName,
                          subLabel: `${selectedPriceType}: ₹${price || 0}`
                        };
                      })}
                      value={selectedProductId}
                      onChange={(val) => handleSelectProduct(val)}
                      placeholder="Choose Product..."
                      compact={true}
                    />
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-4 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (products.length > 0) {
                          handleSelectProduct(products[0].productName || products[0].name);
                        } else {
                          setShowAddModal(true);
                        }
                      }}
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow shadow-sky-500/20 h-[34px] shrink-0 whitespace-nowrap"
                    >
                      <Plus size={13} /> Add Product
                    </button>
                    <button
                      onClick={handleAutoSync}
                      disabled={syncing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow shadow-emerald-600/20 h-[34px] shrink-0"
                      title="Auto-calculate product revenues from sales"
                    >
                      <Zap size={13} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Auto Sync'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SUMMARY CARD (Top Right - Faithful reproduction of Medom card) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 rounded-2xl p-4 shadow-xl flex flex-col justify-between text-white relative overflow-hidden border border-sky-400/20">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-xs font-black tracking-widest uppercase opacity-90">
                  {activeTab === 'PRODUCTS' ? `${records.length} PRODUCTS` : 'TERRITORY ROI SCORE'}
                </span>
                <p className="text-[11px] font-medium text-sky-100 mt-1">
                  Period: {monthName} {yearVal} | {daysInMonth} Days
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/15">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-sky-200">Rs</span>
                  <span className="text-2xl md:text-3xl font-black tracking-tight font-mono">
                    {activeTab === 'PRODUCTS' 
                      ? totalValue.toLocaleString('en-IN') 
                      : (roiData?.summary?.totalRevenue || 0).toLocaleString('en-IN')
                    }
                  </span>
                </div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-sky-200/90">
                  {activeTab === 'PRODUCTS' ? 'TOTAL VALUE' : 'TOTAL REVENUE (SALES)'}
                </span>
              </div>
            </div>

          </div>

          {/* MAIN VIEW: PRODUCTS TABLE OR ROI VIEW */}
          {activeTab === 'PRODUCTS' ? (
            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[300px]">
              <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Showing ({records.length}) Products
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchData}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                  <button
                    onClick={handleExport}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5"
                  >
                    <Download size={13} /> Export Excel
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-center border-collapse border border-slate-700 text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                      <th className="border border-slate-700 px-3 py-2 w-14">Sr no.</th>
                      <th className="border border-slate-700 px-3 py-2 text-left">Product Name</th>
                      <th className="border border-slate-700 px-3 py-2">Price Type</th>
                      <th className="border border-slate-700 px-3 py-2 text-right">Unit Price (₹)</th>
                      <th className="border border-slate-700 px-3 py-2 text-center">Quantity</th>
                      <th className="border border-slate-700 px-3 py-2 text-right">Total Value (₹)</th>
                      <th className="border border-slate-700 px-3 py-2">Headquarter</th>
                      <th className="border border-slate-700 px-3 py-2 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-400" />
                          Loading Product Profit Data...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-semibold">
                          No product profit data found for this period. Use "Add Product" or "Auto Sync" above.
                        </td>
                      </tr>
                    ) : (
                      records.map((r, i) => (
                        <tr key={r._id} className="hover:bg-slate-700/40 transition-colors">
                          <td className="border border-slate-700 px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="border border-slate-700 px-3 py-2 text-left font-bold text-white">
                            {r.productName}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 font-semibold text-purple-400">
                            {r.priceType}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right font-mono text-slate-300">
                            ₹ {Number(r.unitPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-center font-mono font-bold text-sky-400">
                            {r.quantity}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-emerald-400 text-sm">
                            ₹ {Number(r.totalValue).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-slate-300">
                            {r.hq || 'All HQs'}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-1.5 rounded transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  Total Quantity: {records.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} Units
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  Grand Total Value: ₹ {totalValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            /* ROI VIEW: REVENUE VS COST CENTER BY TERRITORY */
            <div className="flex-1 flex flex-col gap-4">
              {/* ROI KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Sales Revenue
                  </span>
                  <span className="text-xl font-black text-white font-mono mt-1 block">
                    ₹ {(roiData?.summary?.totalRevenue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">From Primary / Products Sold</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Cost Center Expenses
                  </span>
                  <span className="text-xl font-black text-rose-400 font-mono mt-1 block">
                    ₹ {(roiData?.summary?.totalExpense || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Salaries, TA/DA, Samples, Gifts</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Net Profit / Margin
                  </span>
                  <span className={`text-xl font-black font-mono mt-1 block ${
                    (roiData?.summary?.totalNetMargin || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ₹ {(roiData?.summary?.totalNetMargin || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Revenue minus Expenses</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Overall ROI %
                  </span>
                  <span className={`text-xl font-black font-mono mt-1 block ${
                    (roiData?.summary?.overallRoi || 0) >= 100 ? 'text-emerald-400' : 
                    (roiData?.summary?.overallRoi || 0) >= 80 ? 'text-yellow-400' : 'text-rose-400'
                  }`}>
                    {(roiData?.summary?.overallRoi || 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">Efficiency Ratio</span>
                </div>
              </div>

              {/* Territory ROI Register Table */}
              <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[300px]">
                <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Territory-Wise Profit &amp; ROI Register
                  </h3>
                  <button
                    onClick={handleExport}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5"
                  >
                    <Download size={13} /> Export Excel
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-center border-collapse border border-slate-700 text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                        <th className="border border-slate-700 px-3 py-2 w-14">Sr no.</th>
                        <th className="border border-slate-700 px-3 py-2 text-left">Headquarter / Territory</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Revenue (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Cost Center (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Net Contribution (₹)</th>
                        <th className="border border-slate-700 px-3 py-2">ROI Achievement (%)</th>
                        <th className="border border-slate-700 px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!roiData?.breakdown || roiData.breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                            No ROI data found. Please add or sync product sales and cost center expenses.
                          </td>
                        </tr>
                      ) : (
                        roiData.breakdown.map((b: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                            <td className="border border-slate-700 px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                            <td className="border border-slate-700 px-3 py-2 text-left font-bold text-white">
                              {b.hq}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-sky-400">
                              ₹ {Number(b.revenue).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-rose-400">
                              ₹ {Number(b.expense).toLocaleString('en-IN')}
                            </td>
                            <td className={`border border-slate-700 px-3 py-2 text-right font-mono font-bold ${
                              b.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ₹ {Number(b.netMargin).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${getRoiColorBadge(b.roiPct)}`}>
                                {b.roiPct}%
                              </span>
                            </td>
                            <td className="border border-slate-700 px-3 py-2">
                              {b.status === 'EXCELLENT' ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">🟢 Profitable</span>
                              ) : b.status === 'MODERATE' ? (
                                <span className="text-[10px] font-bold text-yellow-400 uppercase">🟡 Moderate</span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-400 uppercase">🔴 Deficit Alert</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && formProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-sky-400" />
                Add Product to Profit Center
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  disabled
                  value={formProduct.productName || formProduct.name}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Price Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedPriceType}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Unit Price (Rs) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQty}
                    onChange={e => setFormQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-sky-400 focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Total Value (Rs)
                  </label>
                  <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 font-mono">
                    ₹ {((Number(formQty) || 0) * (Number(formPrice) || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional remarks"
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow shadow-sky-500/20"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOW DOES IT WORK HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <HelpCircle size={16} className="text-sky-400" />
                How Profit Center Works in Pharma ERP
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs text-slate-300">
              <p>
                A <strong>Profit Center</strong> measures revenue generation and returns on operational spending.
              </p>
              <div className="space-y-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">1. Products Center</span>
                  <span className="text-[11px] text-slate-400">Calculates product sales values based on PTS (Stockist price), PTR (Retailer price), or MRP. Use <em>Auto Sync</em> to calculate product volumes directly from Primary Sales.</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">2. Return on Investment (ROI)</span>
                  <span className="text-[11px] text-slate-400">Compares total sales revenue against Cost Center expenses across each Headquarter to give territory profitability and efficiency ratios.</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-1.5 rounded-lg text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
