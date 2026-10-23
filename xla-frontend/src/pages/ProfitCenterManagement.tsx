import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  Download, 
  RefreshCw, 
  Package, 
  TrendingUp, 
  Edit3,
  X,
  BarChart3,
  Activity,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CustomSelect from '../components/CustomSelect';

type ProfitTab = 'PRODUCTS' | 'ROI' | 'ANALYTICS';

interface ProfitProductRecord {
  _id: string;
  productId: string;
  productName: string;
  composition?: string;
  category?: string;
  mrp: number;
  ptr: number;
  pts: number;
  cus: number;
  purchaseCost: number;
  transportCost: number;
  marginPercent: number;
  totalUnitCost: number;
  priceType: string;
  soldPrice: number;
  quantity: number;
  sellingPrice: number;
  costOfProduct: number;
  actualProfit: number;
  hq: string;
}

interface ProfitSummary {
  count: number;
  totalQty: number;
  totalSellingValue: number;
  totalCostOfProduct: number;
  totalHQGrossProfit: number;
  totalCostCenterExpenses: number;
  actualHQNetProfit: number;
  month: string;
  year: string;
  hq: string;
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

  // Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Data & Summary
  const [records, setRecords] = useState<ProfitProductRecord[]>([]);
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'COMPANY' | 'PRODUCTS'>('COMPANY');
  const [focusedMonth, setFocusedMonth] = useState<string>('Sep');
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState<string>('');

  // Modals & Cost Editing
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProfitProductRecord | null>(null);
  const [editPurchaseCost, setEditPurchaseCost] = useState<string>('0');
  const [editTransportCost, setEditTransportCost] = useState<string>('0');
  const [editMarginPercent, setEditMarginPercent] = useState<string>('0');
  const [savingCost, setSavingCost] = useState<boolean>(false);

  // Bulk Profit Margin % to Auto-Populate across All Products
  const [bulkMarginInput, setBulkMarginInput] = useState<string>('');
  const [bulkMarginSaving, setBulkMarginSaving] = useState<boolean>(false);
  const [bulkMarginApplied, setBulkMarginApplied] = useState<boolean>(false);

  // Table Container Ref & Cursor Hover for Arrow Key Scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isMouseInTable, setIsMouseInTable] = useState<boolean>(false);

  // Arrow Key Navigation exclusively within the table when mouse/cursor is inside table
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMouseInTable || !tableContainerRef.current) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

        // If editing numbers inside an input, allow Left/Right arrows for text navigation
        if (isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          return;
        }

        // Prevent the outer browser window from scrolling!
        e.preventDefault();
        e.stopPropagation();

        const container = tableContainerRef.current;
        const rowStep = 44; // scroll by one row
        const colStep = 120; // scroll by one column

        if (e.key === 'ArrowDown') {
          container.scrollTop += rowStep;
        } else if (e.key === 'ArrowUp') {
          container.scrollTop -= rowStep;
        } else if (e.key === 'ArrowRight') {
          container.scrollLeft += colStep;
        } else if (e.key === 'ArrowLeft') {
          container.scrollLeft -= colStep;
        } else if (e.key === 'PageDown') {
          container.scrollTop += container.clientHeight * 0.75;
        } else if (e.key === 'PageUp') {
          container.scrollTop -= container.clientHeight * 0.75;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMouseInTable]);

  // Inline Editable Costs: Map of productId -> { purchaseCost, transportCost, marginPercent, saving, saved }
  const [inlineCosts, setInlineCosts] = useState<Record<string, { purchaseCost: number | string; transportCost: number | string; marginPercent: number | string; saving?: boolean; saved?: boolean }>>({});

  // Sync inlineCosts when records load
  useEffect(() => {
    if (records.length > 0) {
      setInlineCosts(prev => {
        const next = { ...prev };
        records.forEach(r => {
          const id = r.productId || r._id;
          if (!next[id]) {
            next[id] = {
              purchaseCost: r.purchaseCost || 0,
              transportCost: r.transportCost || 0,
              marginPercent: r.marginPercent || 0
            };
          }
        });
        return next;
      });
    }
  }, [records]);

  const handleInlineCostChange = (productId: string, field: 'purchaseCost' | 'transportCost' | 'marginPercent', value: string) => {
    setInlineCosts(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { purchaseCost: 0, transportCost: 0, marginPercent: 0 }),
        [field]: value,
        saved: false
      }
    }));
  };

  const handleSaveInlineCost = async (productId: string) => {
    const costData = inlineCosts[productId];
    if (!costData) return;

    setInlineCosts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], saving: true }
    }));

    try {
      const purc = Number(costData.purchaseCost) || 0;
      const trans = Number(costData.transportCost) || 0;
      const margin = Number(costData.marginPercent) || 0;
      const base = purc + trans;
      const totalUnitCost = Number((base * (1 + margin / 100)).toFixed(2));

      const res = await axios.put('/api/xl/profit-center/product-costs', {
        productId,
        purchaseCost: purc,
        transportCost: trans,
        marginPercent: margin
      });

      if (res.data?.success) {
        setInlineCosts(prev => ({
          ...prev,
          [productId]: { ...prev[productId], saving: false, saved: true }
        }));

        setRecords(prev => prev.map(r => {
          if ((r.productId || r._id) === productId) {
            const costOfProduct = r.quantity * totalUnitCost;
            const actualProfit = r.sellingPrice - costOfProduct;
            return {
              ...r,
              purchaseCost: purc,
              transportCost: trans,
              marginPercent: margin,
              totalUnitCost,
              costOfProduct,
              actualProfit
            };
          }
          return r;
        }));

        setTimeout(() => {
          setInlineCosts(prev => ({
            ...prev,
            [productId]: { ...prev[productId], saved: false }
          }));
        }, 2500);
      }
    } catch (e) {
      console.error('Error saving inline product cost:', e);
      setInlineCosts(prev => ({
        ...prev,
        [productId]: { ...prev[productId], saving: false }
      }));
    }
  };

  // Bulk Apply Margin % to All Products
  const handleApplyBulkMargin = async () => {
    const marginNum = parseFloat(bulkMarginInput);
    if (isNaN(marginNum) || marginNum < 0) {
      alert('Please enter a valid margin percentage (e.g. 30).');
      return;
    }

    setBulkMarginSaving(true);
    try {
      const res = await axios.put('/api/xl/profit-center/bulk-margin', {
        marginPercent: marginNum
      });

      if (res.data?.success) {
        // 1. Auto-populate all product margin boxes in inlineCosts state
        setInlineCosts(prev => {
          const next = { ...prev };
          records.forEach(r => {
            const id = r.productId || r._id;
            next[id] = {
              ...(next[id] || { purchaseCost: r.purchaseCost || 0, transportCost: r.transportCost || 0 }),
              marginPercent: marginNum,
              saved: true
            };
          });
          return next;
        });

        // 2. Immediately recalculate all records with the new margin
        setRecords(prev => prev.map(r => {
          const id = r.productId || r._id;
          const purc = inlineCosts[id]?.purchaseCost !== undefined 
            ? Number(inlineCosts[id].purchaseCost) 
            : Number(r.purchaseCost || 0);
          const trans = inlineCosts[id]?.transportCost !== undefined 
            ? Number(inlineCosts[id].transportCost) 
            : Number(r.transportCost || 0);
          const baseCost = purc + trans;
          const totalUnitCost = Number((baseCost * (1 + marginNum / 100)).toFixed(2));
          const costOfProduct = r.quantity * totalUnitCost;
          const actualProfit = r.sellingPrice - costOfProduct;
          return {
            ...r,
            marginPercent: marginNum,
            totalUnitCost,
            costOfProduct,
            actualProfit
          };
        }));

        setBulkMarginApplied(true);
        setTimeout(() => setBulkMarginApplied(false), 3000);
      }
    } catch (err: any) {
      console.error('Error applying bulk margin:', err);
      alert(err.response?.data?.message || 'Failed to apply profit margin to all products');
    } finally {
      setBulkMarginSaving(false);
    }
  };

  // Parse Month & Year
  const [monthName, yearVal] = useMemo(() => {
    if (selectedMonth.includes(',')) {
      const parts = selectedMonth.split(',');
      return [parts[0].trim(), parts[1].trim()];
    }
    return [currentMonthStr, currentYearStr];
  }, [selectedMonth, currentMonthStr, currentYearStr]);

  // Load HQs
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const hRes = await axios.get('/api/xl/locations/hqs')
          .catch(() => axios.get('/api/xl/hqs'))
          .catch(() => axios.get('/api/admin/locations/hqs'));
        if (hRes.data) {
          const raw = hRes.data;
          const hList = Array.isArray(raw) ? raw : (raw.hqs || raw.data || []);
          const names = hList.map((h: any) => typeof h === 'string' ? h : (h.hqName || h.name || h.headquarter || '')).filter(Boolean);
          setHqs(Array.from(new Set(names)) as string[]);
        }
      } catch (e) {
        console.error('Error fetching profit masters:', e);
      }
    };
    fetchMasters();
  }, []);

  // Augment HQs from ROI or Analytics if any found
  useEffect(() => {
    if (roiData?.breakdown?.length > 0) {
      const extraHqs = roiData.breakdown.map((b: any) => b.hq).filter(Boolean);
      setHqs(prev => Array.from(new Set([...prev, ...extraHqs])));
    }
    if (analyticsData?.territoryComparison?.length > 0) {
      const extraHqs = analyticsData.territoryComparison.map((t: any) => t.hq).filter(Boolean);
      setHqs(prev => Array.from(new Set([...prev, ...extraHqs])));
    }
  }, [roiData, analyticsData]);

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
          setSummary(res.data.summary || null);
        }
      } else if (activeTab === 'ROI') {
        const res = await axios.get('/api/xl/profit-center/roi', {
          params: { month: selectedMonth, year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setRoiData(res.data);
        }
      } else if (activeTab === 'ANALYTICS') {
        const res = await axios.get('/api/xl/profit-center/analytics', {
          params: { year: yearVal, hq: selectedHq }
        });
        if (res.data?.success) {
          setAnalyticsData(res.data);
          if (!selectedAnalyticsProduct && res.data.productTrends?.length > 0) {
            setSelectedAnalyticsProduct(res.data.productTrends[0].productId);
          }
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

  // Open Cost Edit Modal
  const handleOpenCostEdit = (prod: ProfitProductRecord) => {
    setEditingProduct(prod);
    setEditPurchaseCost(String(prod.purchaseCost || 0));
    setEditTransportCost(String(prod.transportCost || 0));
    setEditMarginPercent(String(prod.marginPercent || 0));
  };

  // Save Cost Edit
  const handleSaveCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingCost(true);
    try {
      const res = await axios.put('/api/xl/profit-center/product-costs', {
        productId: editingProduct.productId || editingProduct._id,
        purchaseCost: Number(editPurchaseCost) || 0,
        transportCost: Number(editTransportCost) || 0,
        marginPercent: Number(editMarginPercent) || 0
      });
      if (res.data?.success) {
        setEditingProduct(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update product costs:', err);
      alert('Failed to save product costs');
    } finally {
      setSavingCost(false);
    }
  };

  // Filtered Records by Search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(r => 
      r.productName.toLowerCase().includes(q) ||
      (r.composition && r.composition.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  // Dynamic live totals reflecting inline edits immediately
  const liveTotals = useMemo(() => {
    let totalQty = 0;
    let totalSellingValue = 0;
    let totalCostOfProduct = 0;

    filteredRecords.forEach(r => {
      const id = r.productId || r._id;
      const inline = inlineCosts[id];
      const purc = inline?.purchaseCost !== undefined ? (Number(inline.purchaseCost) || 0) : (r.purchaseCost || 0);
      const trans = inline?.transportCost !== undefined ? (Number(inline.transportCost) || 0) : (r.transportCost || 0);
      const margin = inline?.marginPercent !== undefined ? (Number(inline.marginPercent) || 0) : (r.marginPercent || 0);
      const base = purc + trans;
      const unitCost = Number((base * (1 + margin / 100)).toFixed(2));

      totalQty += Number(r.quantity || 0);
      totalSellingValue += Number(r.sellingPrice || 0);
      totalCostOfProduct += Number(r.quantity || 0) * unitCost;
    });

    const totalGrossProfit = totalSellingValue - totalCostOfProduct;
    const costCenterExp = summary?.totalCostCenterExpenses || 0;
    const actualHQNetProfit = totalGrossProfit - costCenterExp;

    return {
      totalQty,
      totalSellingValue,
      totalCostOfProduct,
      totalGrossProfit,
      actualHQNetProfit
    };
  }, [filteredRecords, inlineCosts, summary]);

  // Export to Excel
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    if (activeTab === 'PRODUCTS') {
      const exportData = filteredRecords.map((r, i) => ({
        'Sr no.': i + 1,
        'Product Name': r.productName,
        'MRP (₹)': r.mrp,
        'PTR (₹)': r.ptr,
        'PTS (₹)': r.pts,
        'CUS (₹)': r.cus || '-',
        'Purc. Cost (₹)': r.purchaseCost,
        'Transport Cost (₹)': r.transportCost,
        'Total Unit Cost (₹)': r.totalUnitCost,
        'Sold Price Type': r.priceType,
        'Actual Sold Price (₹)': r.soldPrice,
        'Qty Sold (Secondary)': r.quantity,
        'Total Selling Value (₹)': r.sellingPrice,
        'Total Product Cost (₹)': r.costOfProduct,
        'Actual Profit (₹)': r.actualProfit,
        'Headquarter': r.hq || 'All HQs',
        'Period': `${selectedMonth}`
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Products_Profit');
      XLSX.writeFile(wb, `Products_Profit_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    } else if (roiData?.breakdown) {
      const exportData = roiData.breakdown.map((b: any, i: number) => ({
        'Sr no.': i + 1,
        'Headquarter': b.hq,
        'Secondary Selling Value (₹)': b.sellingValue || 0,
        'Total Product Cost (₹)': b.productCost || 0,
        'HQ Gross Product Profit (₹)': b.revenue || 0,
        'Cost Center Expenses (₹)': b.expense || 0,
        'Actual HQ Net Profit (₹)': b.netMargin || 0,
        'ROI Achievement (%)': `${b.roiPct}%`,
        'Status': b.status
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Territory_ROI');
      XLSX.writeFile(wb, `Territory_ROI_${selectedMonth.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    } else if (activeTab === 'ANALYTICS' && analyticsData?.monthlyTrend) {
      const exportData = analyticsData.monthlyTrend.map((m: any) => ({
        'Month': m.month,
        'Sold Qty': m.soldQty,
        'Secondary Selling Value (₹)': m.sellingValue,
        'Product Cost (₹)': m.productCost,
        'Gross Product Profit (₹)': m.grossProfit,
        'Cost Center Expenses (₹)': m.costCenterExpenses,
        'Actual Net Profit (₹)': m.actualNetProfit,
        'Status': m.status,
        'ROI Achievement (%)': `${m.roiPct}%`
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Monthly_Trend');
      XLSX.writeFile(wb, `Profit_Analytics_${yearVal}_${selectedHq}.xlsx`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 relative">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center justify-between px-4 pt-8 pb-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/extras/profit')} className="text-white active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold">
          <ArrowLeft size={18} /> Profit Center
        </button>
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{activeTab}</span>
      </div>

      {/* Main Full-Width Content Area (Free flow page layout, no double scrollbars) */}
      <main className="flex-1 flex flex-col px-3 py-3 md:px-6 md:py-4 w-full">
        
        {/* TOP HEADER: BREADCRUMB, SIDE-BY-SIDE TABS & HELP */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-3">
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <button 
              onClick={() => navigate('/extras/profit')}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="uppercase text-sm font-black text-white tracking-wide">Manage Profit Center</span>
            </button>

            {/* TWO MENUS SIDE-BY-SIDE IN ONE PAGE */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('PRODUCTS')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'PRODUCTS'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Package size={15} />
                <span>PRODUCTS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ROI')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ROI'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp size={15} />
                <span>ROI</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ANALYTICS')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 size={15} />
                <span>ANALYTICS</span>
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowHelpModal(true)}
            className="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto md:ml-0"
          >
            <HelpCircle size={14} /> How does it work?
          </button>
        </div>

        {/* MAIN VIEW: ANALYTICS OR SINGLE-MONTH PRODUCTS / ROI */}
        {activeTab === 'ANALYTICS' ? (
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* VARIANCE STATUS BAR FOR ANALYTICS */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 border border-slate-700/70 px-4 py-2.5 rounded-xl text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Profit Center Analytics: 12-Month Trend Graphs &amp; Territory Profitability
              </span>
              <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  Green = Profitable (Net Margin &ge; 0)
                </span>
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                  Red = Deficit (Expenses Exceed Revenue)
                </span>
              </div>
            </div>

            {/* TOP ANALYTICS CONTROLS & SUB-TABS */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Year Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-inner">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mr-1">Year:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newYear = String(Number(yearVal) - 1);
                      setSelectedMonth(`${monthName}, ${newYear}`);
                    }}
                    className="text-slate-400 hover:text-white px-1 text-xs font-black transition-colors"
                    title="Previous Year"
                  >
                    &lt;
                  </button>
                  <span className="text-xs font-bold text-white px-1.5 font-mono tracking-wider">{yearVal}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newYear = String(Number(yearVal) + 1);
                      setSelectedMonth(`${monthName}, ${newYear}`);
                    }}
                    className="text-slate-400 hover:text-white px-1 text-xs font-black transition-colors"
                    title="Next Year"
                  >
                    &gt;
                  </button>
                </div>

                {/* Territory Selector */}
                <div className="min-w-[220px]">
                  <CustomSelect
                    options={[
                      { value: 'ALL', label: 'Whole Company (All Territories)' },
                      ...hqs.map(hq => ({ value: hq, label: `Territory: ${hq}` }))
                    ]}
                    value={selectedHq}
                    onChange={(val) => setSelectedHq(val)}
                    placeholder="Whole Company"
                    compact={true}
                  />
                </div>

                {/* Sub-Tabs: Company vs Products */}
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setAnalyticsSubTab('COMPANY')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                      analyticsSubTab === 'COMPANY'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building size={13} />
                    <span>Company &amp; Territory Trend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsSubTab('PRODUCTS')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                      analyticsSubTab === 'PRODUCTS'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package size={13} />
                    <span>Product-wise Trends</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="text-xs text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="text-xs text-white bg-sky-600 hover:bg-sky-500 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow shadow-sky-600/20 transition-colors"
                >
                  <Download size={13} /> Export Excel
                </button>
              </div>
            </div>

            {/* ANNUAL KPI SUMMARY ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Annual Secondary Sales
                </span>
                <span className="text-lg font-black text-sky-400 font-mono mt-0.5 block">
                  ₹ {(analyticsData?.summary?.annualSellingValue || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400">Total Territory Sales</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Annual Product Costs
                </span>
                <span className="text-lg font-black text-slate-300 font-mono mt-0.5 block">
                  ₹ {(analyticsData?.summary?.annualProductCost || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400">Purc. + Logistics Cost</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Gross Product Profit
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  ₹ {(analyticsData?.summary?.annualGrossProfit || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400">Sales Value minus Costs</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cost Center Expenses
                </span>
                <span className="text-lg font-black text-rose-400 font-mono mt-0.5 block">
                  ₹ {(analyticsData?.summary?.annualCostCenter || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400">Salaries, PF, Field Exp.</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Annual Actual Net Profit
                </span>
                <span className={`text-lg font-black font-mono mt-0.5 block ${
                  (analyticsData?.summary?.annualNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ₹ {(analyticsData?.summary?.annualNetProfit || 0).toLocaleString('en-IN')}
                </span>
                <span className={`text-[9px] font-bold uppercase ${
                  (analyticsData?.summary?.annualNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {(analyticsData?.summary?.annualNetProfit || 0) >= 0 ? '● Company Profitable' : '● Operating Deficit'}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl shadow col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Month-wise Score
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {analyticsData?.summary?.profitableMonths || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ 12 Months Green</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1.5 overflow-hidden flex">
                  <div 
                    className="bg-emerald-400 h-full transition-all"
                    style={{ width: `${((analyticsData?.summary?.profitableMonths || 0) / 12) * 100}%` }}
                  />
                  <div 
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${((analyticsData?.summary?.deficitMonths || 0) / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* MONTH-WISE GREEN & RED BUTTON GRAPH (TERRITORY & WHOLE COMPANY) */}
            {/* ============================================================== */}
            <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-2xl shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" />
                    Month-Wise Green &amp; Red Trend Buttons ({selectedHq === 'ALL' ? 'Whole Company' : selectedHq} • {yearVal})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any month button below to spotlight details and inspect trend variations.
                  </p>
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 font-bold">
                  {selectedHq === 'ALL' ? 'Company Consolidated' : `Territory: ${selectedHq}`}
                </span>
              </div>

              {/* 12 MONTH-WISE GREEN & RED BUTTONS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {(analyticsData?.monthlyTrend || []).map((m: any) => {
                  const isSelected = focusedMonth.toLowerCase().startsWith(m.month.toLowerCase());
                  const isProfitable = m.isProfitable;
                  const profitVal = m.actualNetProfit || 0;
                  const formattedVal = Math.abs(profitVal) >= 100000 
                    ? `${(profitVal / 100000).toFixed(1)}L` 
                    : Math.abs(profitVal) >= 1000 
                      ? `${(profitVal / 1000).toFixed(0)}K` 
                      : `${Math.round(profitVal)}`;

                  return (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => setFocusedMonth(m.month)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all text-left relative overflow-hidden group cursor-pointer ${
                        isProfitable
                          ? isSelected
                            ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/80 scale-102 z-10'
                            : 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/60'
                          : isSelected
                            ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 shadow-lg shadow-rose-950/80 scale-102 z-10'
                            : 'bg-rose-950/40 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/60'
                      }`}
                    >
                      {/* Month & Status Dot */}
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-xs font-black tracking-wider ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {m.month}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          isProfitable 
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80' 
                            : 'bg-rose-500 shadow-sm shadow-rose-500/80'
                        }`} />
                      </div>

                      {/* Profit Value & Badge */}
                      <div className="mt-0.5">
                        <span className={`text-[11px] font-black font-mono block ${
                          isProfitable ? 'text-emerald-300' : 'text-rose-300'
                        }`}>
                          {profitVal >= 0 ? '+' : '-'}₹{formattedVal}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider block mt-0.5 ${
                          isProfitable ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfitable ? 'PROFIT' : 'LOSS'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* FOCUSED MONTH SPOTLIGHT CARD */}
              {(() => {
                const fData = (analyticsData?.monthlyTrend || []).find((m: any) => 
                  m.month.toLowerCase().startsWith(focusedMonth.toLowerCase())
                ) || analyticsData?.monthlyTrend?.[0];

                if (!fData) return null;
                const isProf = fData.isProfitable;

                return (
                  <div className={`mt-3 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                    isProf 
                      ? 'bg-emerald-950/30 border-emerald-500/30' 
                      : 'bg-rose-950/30 border-rose-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border font-mono ${
                        isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {fData.month} {yearVal} • {isProf ? '🟢 PROFITABLE' : '🔴 NET DEFICIT'}
                      </span>
                      <span className="text-slate-300">
                        Sold Qty: <strong className="text-white font-mono">{fData.soldQty?.toLocaleString('en-IN') || 0} units</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Selling Revenue:</span>
                        <span className="font-bold text-sky-400">₹ {(fData.sellingValue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Gross Profit:</span>
                        <span className="font-bold text-emerald-400">₹ {(fData.grossProfit || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Cost Center Expenses:</span>
                        <span className="font-bold text-rose-400">- ₹ {(fData.costCenterExpenses || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-l border-slate-700/80 pl-3">
                        <span className="text-slate-300 block text-[9px] font-black uppercase">Actual Net Profit:</span>
                        <span className={`text-sm font-black ${isProf ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fData.actualNetProfit >= 0 ? '+' : ''}₹ {(fData.actualNetProfit || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* VISUAL 12-MONTH SVG TREND GRAPH */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={14} className="text-sky-400" />
                    Month-by-Month Net Profit &amp; Revenue Trend Curve
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span> Green Bars = Net Profit
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span> Red Bars = Net Loss
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-sky-400 inline-block"></span> Sky Line = Secondary Sales
                    </span>
                  </div>
                </div>

                {/* SVG Graph Component */}
                {(() => {
                  const data = analyticsData?.monthlyTrend || [];
                  if (data.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        No trend data available for {yearVal}.
                      </div>
                    );
                  }

                  const svgW = 840;
                  const svgH = 250;
                  const padL = 70;
                  const padR = 25;
                  const padT = 30;
                  const padB = 40;
                  const plotW = svgW - padL - padR;
                  const plotH = svgH - padT - padB;

                  const netProfits = data.map((d: any) => Number(d.actualNetProfit || 0));
                  const revs = data.map((d: any) => Number(d.sellingValue || 0));

                  const minProfit = Math.min(...netProfits, 0);
                  const maxProfit = Math.max(...netProfits, 1000);
                  const maxRevenue = Math.max(...revs, 1000);

                  const profitRange = (maxProfit - minProfit) || 1;
                  const yZero = padT + ((maxProfit - 0) / profitRange) * plotH;

                  const colW = plotW / 12;
                  const barW = Math.min(colW * 0.45, 24);

                  // Revenue polyline points
                  const revPoints = data.map((d: any, idx: number) => {
                    const cx = padL + idx * colW + colW / 2;
                    const cy = padT + plotH - (Number(d.sellingValue || 0) / maxRevenue) * (plotH * 0.9);
                    return `${cx},${cy}`;
                  }).join(' ');

                  return (
                    <div className="w-full overflow-x-auto">
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[700px] h-[250px] overflow-visible">
                        {/* Horizontal Gridlines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                          const y = padT + pct * plotH;
                          return (
                            <line
                              key={idx}
                              x1={padL}
                              y1={y}
                              x2={svgW - padR}
                              y2={y}
                              stroke="#334155"
                              strokeDasharray="3 3"
                              strokeWidth="0.8"
                              opacity="0.4"
                            />
                          );
                        })}

                        {/* Break-Even Level (₹0 Zero Line) */}
                        <line
                          x1={padL}
                          y1={yZero}
                          x2={svgW - padR}
                          y2={yZero}
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        <text
                          x={padL - 8}
                          y={yZero + 4}
                          fill="#94a3b8"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          ₹ 0
                        </text>

                        {/* Top Max Profit Label */}
                        <text
                          x={padL - 8}
                          y={padT + 4}
                          fill="#34d399"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          +₹{Math.round(maxProfit).toLocaleString('en-IN')}
                        </text>

                        {/* Bottom Min Profit Label if negative */}
                        {minProfit < 0 && (
                          <text
                            x={padL - 8}
                            y={padT + plotH}
                            fill="#fb7185"
                            fontSize="9"
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            -₹{Math.abs(Math.round(minProfit)).toLocaleString('en-IN')}
                          </text>
                        )}

                        {/* 12 Month Bars (Green & Red) */}
                        {data.map((d: any, idx: number) => {
                          const net = Number(d.actualNetProfit || 0);
                          const isProf = net >= 0;
                          const cx = padL + idx * colW + colW / 2;
                          const bx = cx - barW / 2;
                          const isFocused = focusedMonth.toLowerCase().startsWith(d.month.toLowerCase());

                          let barY = yZero;
                          let barH = 0;

                          if (isProf) {
                            barH = Math.max(((net - 0) / profitRange) * plotH, 3);
                            barY = yZero - barH;
                          } else {
                            barH = Math.max(((0 - net) / profitRange) * plotH, 3);
                            barY = yZero;
                          }

                          return (
                            <g key={d.month} className="cursor-pointer" onClick={() => setFocusedMonth(d.month)}>
                              {/* Focused Highlight Column */}
                              {isFocused && (
                                <rect
                                  x={cx - colW / 2 + 2}
                                  y={padT}
                                  width={colW - 4}
                                  height={plotH}
                                  fill="#38bdf8"
                                  opacity="0.08"
                                  rx="6"
                                />
                              )}

                              {/* Profit / Loss Bar */}
                              <rect
                                x={bx}
                                y={barY}
                                width={barW}
                                height={barH}
                                fill={isProf ? '#10b981' : '#f43f5e'}
                                rx="3"
                                className="transition-all hover:opacity-85"
                              />

                              {/* Value Label */}
                              <text
                                x={cx}
                                y={isProf ? barY - 5 : barY + barH + 11}
                                fill={isProf ? '#34d399' : '#fb7185'}
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                {net !== 0 ? (Math.abs(net) >= 1000 ? `${Math.round(net / 1000)}k` : `${Math.round(net)}`) : '0'}
                              </text>

                              {/* Month Label */}
                              <text
                                x={cx}
                                y={svgH - 12}
                                fill={isFocused ? '#38bdf8' : '#94a3b8'}
                                fontSize="11"
                                fontWeight={isFocused ? 'bold' : '600'}
                                textAnchor="middle"
                              >
                                {d.month}
                              </text>
                            </g>
                          );
                        })}

                        {/* Revenue Curve Line */}
                        <polyline
                          points={revPoints}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          opacity="0.85"
                        />

                        {/* Revenue Points */}
                        {data.map((d: any, idx: number) => {
                          const cx = padL + idx * colW + colW / 2;
                          const cy = padT + plotH - (Number(d.sellingValue || 0) / maxRevenue) * (plotH * 0.9);
                          return (
                            <circle
                              key={`dot-${idx}`}
                              cx={cx}
                              cy={cy}
                              r="3.5"
                              fill="#0284c7"
                              stroke="#38bdf8"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={() => setFocusedMonth(d.month)}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ============================================================== */}
            {/* SUB-VIEW 1: WHOLE COMPANY & TERRITORY REGISTER */}
            {/* ============================================================== */}
            {analyticsSubTab === 'COMPANY' && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-sky-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Territory-Wise Annual Performance &amp; Month-by-Month Trend Dots ({yearVal})
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    🟢 Green Dot = Month in Profit • 🔴 Red Dot = Month in Deficit
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-700 text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                        <th className="border border-slate-700 px-3 py-2 w-12">#</th>
                        <th className="border border-slate-700 px-3 py-2 text-left">Territory / Headquarter</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Annual Sales (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Product Costs (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right text-sky-400">Gross Profit (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right text-rose-400">Expenses (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right font-black">Net Profit (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-center">12-Month Trend Dots (Jan - Dec)</th>
                        <th className="border border-slate-700 px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!analyticsData?.territoryComparison || analyticsData.territoryComparison.length === 0) ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            No territory comparison data found for {yearVal}.
                          </td>
                        </tr>
                      ) : (
                        analyticsData.territoryComparison.map((t: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                            <td className="border border-slate-700 px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                            <td className="border border-slate-700 px-3 py-2 text-left font-bold text-white flex items-center justify-between gap-2">
                              <span>{t.hq}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedHq(t.hq)}
                                className="text-[10px] text-sky-400 hover:text-sky-300 underline font-normal"
                              >
                                View Trend
                              </button>
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono text-slate-300">
                              ₹ {Number(t.sellingValue || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono text-slate-400">
                              ₹ {Number(t.productCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-sky-400">
                              ₹ {Number(t.grossProfit || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-rose-400">
                              ₹ {Number(t.costCenterExpenses || 0).toLocaleString('en-IN')}
                            </td>
                            <td className={`border border-slate-700 px-3 py-2 text-right font-mono font-black ${
                              t.actualNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ₹ {Number(t.actualNetProfit || 0).toLocaleString('en-IN')}
                            </td>
                            {/* 12-Month Sparkline Trend Dots */}
                            <td className="border border-slate-700 px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {(t.monthlyNet || []).map((np: number, idx: number) => (
                                  <span
                                    key={idx}
                                    title={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx]}: ₹${Math.round(np)}`}
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      np >= 0 ? 'bg-emerald-400' : 'bg-rose-500'
                                    }`}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="border border-slate-700 px-3 py-2">
                              {t.actualNetProfit >= 0 ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                  🟢 Profitable
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                                  🔴 Net Loss
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SUB-VIEW 2: PRODUCT-WISE TREND GRAPHS */}
            {/* ============================================================== */}
            {analyticsSubTab === 'PRODUCTS' && (
              <div className="space-y-4">
                
                {/* Product Selector Bar */}
                <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-xl shadow flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={15} /> Select Product to View Trend:
                    </span>
                    <div className="min-w-[280px]">
                      <CustomSelect
                        options={(analyticsData?.productTrends || []).map((p: any) => ({
                          value: p.productId,
                          label: `${p.productName} (MRP: ₹${p.mrp || 0})`
                        }))}
                        value={selectedAnalyticsProduct}
                        onChange={(val) => setSelectedAnalyticsProduct(val)}
                        placeholder="Choose Product..."
                        compact={true}
                      />
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Total {analyticsData?.productTrends?.length || 0} Products Analyzed
                  </span>
                </div>

                {/* Selected Product Spotlight & Monthly Trend Graph */}
                {(() => {
                  const selProd = (analyticsData?.productTrends || []).find((p: any) => 
                    p.productId === selectedAnalyticsProduct
                  ) || analyticsData?.productTrends?.[0];

                  if (!selProd) {
                    return (
                      <div className="bg-slate-800/40 p-8 text-center text-slate-500 rounded-xl">
                        No product selected.
                      </div>
                    );
                  }

                  const isProdProfitable = (selProd.totalProfit || 0) >= 0;

                  return (
                    <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-2xl shadow-xl space-y-4">
                      
                      {/* Product Overview Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                              {selProd.productName}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isProdProfitable 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            }`}>
                              {isProdProfitable ? 'PROFITABLE PRODUCT' : 'LOSS / LOW MARGIN'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {selProd.composition || 'Standard Form'} • MRP: ₹{selProd.mrp} • PTR: ₹{selProd.ptr} • Total Unit Cost: ₹{selProd.totalUnitCost}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-right">
                          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="text-[9px] text-slate-400 uppercase block">Annual Qty Sold</span>
                            <span className="text-sm font-black font-mono text-sky-400">
                              {(selProd.totalQty || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="text-[9px] text-slate-400 uppercase block">Annual Revenue</span>
                            <span className="text-sm font-black font-mono text-white">
                              ₹ {(selProd.totalRevenue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="text-[9px] text-slate-400 uppercase block">Total Unit Cost</span>
                            <span className="text-sm font-black font-mono text-slate-300">
                              ₹ {(selProd.totalCost || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                            <span className="text-[9px] text-slate-400 uppercase block">Total Product Profit</span>
                            <span className={`text-sm font-black font-mono ${isProdProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ₹ {(selProd.totalProfit || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 12-Month Buttons for this product */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Monthly Product Performance Buttons:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                          {(selProd.monthly || []).map((pm: any) => {
                            const isProf = pm.isProfitable && (pm.profit > 0);
                            return (
                              <div
                                key={pm.month}
                                className={`p-2 rounded-xl border flex flex-col justify-between text-left ${
                                  pm.qty > 0
                                    ? isProf
                                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black">{pm.month}</span>
                                  <span className={`w-2 h-2 rounded-full ${
                                    pm.qty > 0 
                                      ? isProf ? 'bg-emerald-400' : 'bg-rose-500'
                                      : 'bg-slate-700'
                                  }`} />
                                </div>
                                <div className="mt-1 font-mono">
                                  <span className="text-[10px] font-bold block text-white">
                                    {pm.qty || 0} units
                                  </span>
                                  <span className="text-[9px] block">
                                    ₹ {Math.round(pm.profit || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Product Monthly SVG Graph */}
                      <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                          <BarChart3 size={14} className="text-sky-400" />
                          12-Month Sales Quantity vs Profit Trend: {selProd.productName}
                        </span>

                        {(() => {
                          const mData = selProd.monthly || [];
                          const svgW = 800;
                          const svgH = 200;
                          const padL = 60;
                          const padR = 20;
                          const padT = 20;
                          const padB = 35;
                          const plotW = svgW - padL - padR;
                          const plotH = svgH - padT - padB;

                          const maxQ = Math.max(...mData.map((m: any) => Number(m.qty || 0)), 10);
                          const colW = plotW / 12;
                          const barW = Math.min(colW * 0.45, 20);

                          return (
                            <div className="w-full overflow-x-auto">
                              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[650px] h-[200px]">
                                {[0, 0.5, 1].map((pct, idx) => {
                                  const y = padT + pct * plotH;
                                  return (
                                    <line
                                      key={idx}
                                      x1={padL}
                                      y1={y}
                                      x2={svgW - padR}
                                      y2={y}
                                      stroke="#334155"
                                      strokeDasharray="2 2"
                                      strokeWidth="0.8"
                                    />
                                  );
                                })}

                                <text x={padL - 6} y={padT + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                                  {maxQ} u
                                </text>
                                <text x={padL - 6} y={padT + plotH} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                                  0 u
                                </text>

                                {mData.map((m: any, idx: number) => {
                                  const cx = padL + idx * colW + colW / 2;
                                  const bx = cx - barW / 2;
                                  const q = Number(m.qty || 0);
                                  const barH = (q / maxQ) * plotH;
                                  const barY = padT + plotH - barH;
                                  const isProf = (m.profit || 0) > 0;

                                  return (
                                    <g key={idx}>
                                      <rect
                                        x={bx}
                                        y={barY}
                                        width={barW}
                                        height={Math.max(barH, 2)}
                                        fill={isProf ? '#10b981' : (q > 0 ? '#f43f5e' : '#334155')}
                                        rx="3"
                                      />
                                      <text
                                        x={cx}
                                        y={barY - 4}
                                        fill={isProf ? '#34d399' : '#94a3b8'}
                                        fontSize="9"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        fontFamily="monospace"
                                      >
                                        {q > 0 ? q : ''}
                                      </text>
                                      <text
                                        x={cx}
                                        y={svgH - 12}
                                        fill="#94a3b8"
                                        fontSize="10"
                                        fontWeight="600"
                                        textAnchor="middle"
                                      >
                                        {m.month}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Product Performance Table with Sparkline Dots */}
                      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl overflow-hidden mt-3">
                        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            All Master Products Profit Ranking
                          </h4>
                          <span className="text-[10px] text-slate-400">Click any product to inspect trend graph</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          <table className="w-full text-center border-collapse border border-slate-800 text-xs whitespace-nowrap">
                            <thead className="sticky top-0 bg-slate-950 z-10 text-slate-300 font-bold text-[10px] uppercase">
                              <tr>
                                <th className="border border-slate-800 px-3 py-2 w-10">#</th>
                                <th className="border border-slate-800 px-3 py-2 text-left">Product Name</th>
                                <th className="border border-slate-800 px-3 py-2 text-right">MRP (₹)</th>
                                <th className="border border-slate-800 px-3 py-2 text-right">Unit Cost (₹)</th>
                                <th className="border border-slate-800 px-3 py-2 text-right">Annual Qty</th>
                                <th className="border border-slate-800 px-3 py-2 text-right">Revenue (₹)</th>
                                <th className="border border-slate-800 px-3 py-2 text-right">Product Profit (₹)</th>
                                <th className="border border-slate-800 px-3 py-2 text-center">12-Mo Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(analyticsData?.productTrends || []).map((pt: any, i: number) => {
                                const isSel = pt.productId === selectedAnalyticsProduct;
                                return (
                                  <tr
                                    key={i}
                                    onClick={() => setSelectedAnalyticsProduct(pt.productId)}
                                    className={`cursor-pointer transition-colors ${
                                      isSel 
                                        ? 'bg-sky-500/20 font-bold' 
                                        : 'hover:bg-slate-800/60'
                                    }`}
                                  >
                                    <td className="border border-slate-800 px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                                    <td className="border border-slate-800 px-3 py-2 text-left font-bold text-white">
                                      {pt.productName}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-right font-mono text-slate-300">
                                      ₹ {pt.mrp}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-right font-mono text-slate-400">
                                      ₹ {pt.totalUnitCost}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-right font-mono text-white">
                                      {(pt.totalQty || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-right font-mono text-slate-300">
                                      ₹ {(pt.totalRevenue || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className={`border border-slate-800 px-3 py-2 text-right font-mono font-black ${
                                      pt.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      ₹ {(pt.totalProfit || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        {(pt.monthly || []).map((pm: any, idx: number) => (
                                          <span
                                            key={idx}
                                            title={`${pm.month}: ${pm.qty} units, ₹${Math.round(pm.profit)}`}
                                            className={`w-2 h-2 rounded-full ${
                                              pm.qty > 0 
                                                ? (pm.profit > 0 ? 'bg-emerald-400' : 'bg-rose-500') 
                                                : 'bg-slate-700'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}

          </div>
        ) : (
          /* ============================================================== */
          /* SINGLE-MONTH PRODUCTS & ROI VIEW (EXISTING)                    */
          /* ============================================================== */
          <>
            {/* VARIANCE STATUS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 border border-slate-700/70 px-4 py-2 rounded-xl mb-3 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Territory Net Profit Formula:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-300 font-mono">
                  Actual HQ Profit = Secondary Gross Profit (Revenue - Unit Costs) - Cost Center Expenses
                </span>
              </div>
            </div>

          {/* CONTROLS BAR & KPI SUMMARY CARD ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 items-stretch">
            
            {/* Filter Controls (Cols 8) */}
            <div className="lg:col-span-8 bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-xl shadow-lg flex flex-col justify-between gap-3">
              {/* Year & Month Selection with Square Month Buttons */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    Select Month (Square Box) *
                  </label>
                  {/* Year Switcher */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        const newYear = String(Number(yearVal) - 1);
                        setSelectedMonth(`${monthName}, ${newYear}`);
                      }}
                      className="text-slate-400 hover:text-white px-1 text-xs font-black transition-colors"
                      title="Previous Year"
                    >
                      &lt;
                    </button>
                    <span className="text-xs font-bold text-white px-1 font-mono tracking-wider">{yearVal}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newYear = String(Number(yearVal) + 1);
                        setSelectedMonth(`${monthName}, ${newYear}`);
                      }}
                      className="text-slate-400 hover:text-white px-1 text-xs font-black transition-colors"
                      title="Next Year"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                {/* 12 Square Month Buttons */}
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => {
                    const isSelected = monthName.toLowerCase().startsWith(m.toLowerCase());
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonth(`${m}, ${yearVal}`)}
                        className={`h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-sky-500 text-white font-black shadow-md shadow-sky-500/30 border-sky-400 scale-105 z-10'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Headquarter Filter & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-700/50">
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Filter by Headquarter
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'ALL', label: 'All Headquarters' },
                      ...hqs.map(hq => ({ value: hq, label: hq }))
                    ]}
                    value={selectedHq}
                    onChange={(val) => setSelectedHq(val)}
                    placeholder="All Headquarters"
                    compact={true}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Search Product
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by product name..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY CARD (Top Right - Shows Product Gross Profit vs Cost Center Expenses) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-2xl p-4 shadow-xl flex flex-col justify-between text-white relative overflow-hidden border border-slate-700/80">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                      HQ Profit Analysis ({selectedHq === 'ALL' ? 'All HQs' : selectedHq})
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Period: {monthName} {yearVal} • {records.length} Master Products
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    (summary?.actualHQNetProfit || 0) >= 0 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}>
                    {(summary?.actualHQNetProfit || 0) >= 0 ? 'PROFITABLE' : 'NET LOSS'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-700/60 font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Secondary Selling Value:</span>
                    <span className="font-bold text-white">₹ {liveTotals.totalSellingValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Total Product Costs (COGS):</span>
                    <span>- ₹ {liveTotals.totalCostOfProduct.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sky-400 font-bold border-t border-slate-800 pt-1">
                    <span>HQ Gross Product Profit:</span>
                    <span>₹ {liveTotals.totalGrossProfit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span>Cost Center Expenses:</span>
                    <span>- ₹ {(summary?.totalCostCenterExpenses || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-300">
                    ACTUAL HQ NET PROFIT
                  </span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm font-bold text-slate-400">Rs</span>
                    <span className={`text-xl font-black ${
                      liveTotals.actualHQNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {liveTotals.actualHQNetProfit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* MAIN VIEW: PRODUCTS TABLE OR ROI VIEW (Free flow layout, frozen header & product names) */}
          {activeTab === 'PRODUCTS' ? (
            <div className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col mb-8">
              <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Product Master Profit Center ({filteredRecords.length} Products Linked)
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full font-bold">
                    Qty from Secondary Sales
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                    Purc. &amp; Transport Editable by Admin
                  </span>

                  {/* PROFIT MARGIN % BUTTON & INPUT TO AUTO-POPULATE ALL PRODUCTS */}
                  <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/50 rounded-lg px-2.5 py-1 shadow-sm">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Profit Margin:
                    </span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="any"
                        value={bulkMarginInput}
                        onChange={(e) => setBulkMarginInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyBulkMargin();
                        }}
                        placeholder="30"
                        className="w-14 bg-slate-900 border border-amber-500/60 rounded px-1.5 py-0.5 text-right font-mono font-bold text-amber-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                        title="Enter profit margin % to auto-populate all product margin boxes"
                      />
                      <span className="text-xs font-bold text-amber-400 ml-1">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyBulkMargin}
                      disabled={bulkMarginSaving || bulkMarginInput === ''}
                      className="ml-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 uppercase tracking-wide cursor-pointer"
                      title="Click to auto-populate this margin % into all product margin boxes and recalculate profits"
                    >
                      {bulkMarginSaving ? (
                        <>
                          <RefreshCw size={11} className="animate-spin text-slate-950" />
                          <span>Applying...</span>
                        </>
                      ) : bulkMarginApplied ? (
                        <span className="text-emerald-950 font-black">✓ Applied to All</span>
                      ) : (
                        <span>Apply to All Products</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchData}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
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

              {/* Table Container: Frozen Table Header (top) and Frozen Product Names (left), rest scrolls smoothly in 2D */}
              <div 
                ref={tableContainerRef}
                tabIndex={0}
                onMouseEnter={() => setIsMouseInTable(true)}
                onMouseLeave={() => setIsMouseInTable(false)}
                className="overflow-auto w-full max-h-[calc(100vh-270px)] min-h-[480px] border border-slate-700/80 rounded-b-none relative focus:outline-none"
              >
                <table className="w-full text-center border-separate border-spacing-0 text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                      {/* Frozen Column 1: Sr No. (#) */}
                      <th className="sticky top-0 left-0 z-30 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 w-12 min-w-[48px] max-w-[48px] text-center shadow-sm">
                        #
                      </th>

                      {/* Frozen Column 2: Product Name */}
                      <th className="sticky top-0 left-[48px] z-30 bg-slate-950 border-b-2 border-r-2 border-slate-700 border-r-slate-500 px-3 py-2.5 text-left min-w-[240px] max-w-[280px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.6)]">
                        Product Name
                      </th>

                      {/* Scrollable Columns with Frozen Sticky Top Header */}
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right">MRP (₹)</th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right">PTR (₹)</th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right">PTS (₹)</th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right">CUS (₹)</th>
                      <th className="sticky top-0 z-20 bg-amber-950/90 border-b-2 border-r border-slate-700 px-2 py-2.5 text-center text-amber-300 min-w-[95px]">
                        Purc. Cost (₹) ✎
                      </th>
                      <th className="sticky top-0 z-20 bg-amber-950/90 border-b-2 border-r border-slate-700 px-2 py-2.5 text-center text-amber-300 min-w-[95px]">
                        Transport (₹) ✎
                      </th>
                      <th className="sticky top-0 z-20 bg-amber-950/90 border-b-2 border-r border-slate-700 px-2 py-2.5 text-center text-amber-300 min-w-[85px]">
                        Margin (%) ✎
                      </th>
                      <th className="sticky top-0 z-20 bg-purple-950/90 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right text-purple-300 font-bold">
                        Total Unit Cost (₹)
                      </th>
                      <th className="sticky top-0 z-20 bg-sky-950/80 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right text-sky-300">Sold Price</th>
                      <th className="sticky top-0 z-20 bg-sky-950/80 border-b-2 border-r border-slate-700 px-2 py-2.5 text-center text-sky-300">Qty Sold</th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right text-white">Selling Value (₹)</th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-r border-slate-700 px-2.5 py-2.5 text-right text-slate-400">Total Cost (₹)</th>
                      <th className="sticky top-0 z-20 bg-emerald-950/90 border-b-2 border-r border-slate-700 px-3 py-2.5 text-right font-black text-emerald-400">
                        Actual Profit (₹)
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-950 border-b-2 border-slate-700 px-2 py-2.5 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={16} className="py-16 text-center text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-400" />
                          Loading all master products &amp; secondary sales...
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-12 text-center text-slate-500 font-medium">
                          No products found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, i) => {
                        const id = r.productId || r._id;
                        const inline = inlineCosts[id];
                        const purc = inline?.purchaseCost !== undefined ? inline.purchaseCost : (r.purchaseCost || 0);
                        const trans = inline?.transportCost !== undefined ? inline.transportCost : (r.transportCost || 0);
                        const margin = inline?.marginPercent !== undefined ? inline.marginPercent : (r.marginPercent || 0);
                        const baseCost = (Number(purc) || 0) + (Number(trans) || 0);
                        const unitCost = Number((baseCost * (1 + (Number(margin) || 0) / 100)).toFixed(2));
                        const costOfProd = r.quantity * unitCost;
                        const profit = r.sellingPrice - costOfProd;

                        return (
                          <tr key={id || i} className="group hover:bg-slate-800/80 transition-colors">
                            {/* Frozen Column 1: Sr No. (#) */}
                            <td className="sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800 border-b border-r border-slate-700/80 px-2 py-2 text-slate-400 font-mono text-[11px] w-12 min-w-[48px] max-w-[48px] text-center shadow-sm">
                              {i + 1}
                            </td>

                            {/* Frozen Column 2: Product Name */}
                            <td className="sticky left-[48px] z-10 bg-slate-900 group-hover:bg-slate-800 border-b border-r-2 border-slate-700/80 border-r-slate-500 px-3 py-2 text-left font-bold text-white min-w-[240px] max-w-[280px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.6)]">
                              <div className="truncate max-w-[260px]" title={r.productName}>{r.productName}</div>
                              {r.composition && (
                                <div className="text-[10px] text-slate-400 font-normal truncate max-w-[260px]" title={r.composition}>{r.composition}</div>
                              )}
                            </td>

                            {/* Scrollable Data Columns */}
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono text-slate-300">{r.mrp || 0}</td>
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono text-slate-300">{r.ptr || 0}</td>
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono text-slate-300">{r.pts || 0}</td>
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono text-slate-400">{r.cus > 0 ? r.cus : '-'}</td>
                            
                            {/* Editable Purchase Cost Field */}
                            <td className="border-b border-r border-slate-700/80 px-1 py-1 text-center bg-amber-950/20 group-hover:bg-amber-950/30">
                              <div className="flex items-center justify-center gap-0.5">
                                <span className="text-[10px] text-amber-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={purc}
                                  onChange={(e) => handleInlineCostChange(id, 'purchaseCost', e.target.value)}
                                  onBlur={() => handleSaveInlineCost(id)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineCost(id)}
                                  placeholder="0"
                                  className="w-16 bg-slate-900 border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded px-1.5 py-1 text-right font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs shadow-inner"
                                  title="Admin: Click to edit Purchase Cost"
                                />
                              </div>
                            </td>

                            {/* Editable Transport Cost Field */}
                            <td className="border-b border-r border-slate-700/80 px-1 py-1 text-center bg-amber-950/20 group-hover:bg-amber-950/30">
                              <div className="flex items-center justify-center gap-0.5">
                                <span className="text-[10px] text-amber-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={trans}
                                  onChange={(e) => handleInlineCostChange(id, 'transportCost', e.target.value)}
                                  onBlur={() => handleSaveInlineCost(id)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineCost(id)}
                                  placeholder="0"
                                  className="w-16 bg-slate-900 border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded px-1.5 py-1 text-right font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs shadow-inner"
                                  title="Admin: Click to edit Transport Cost"
                                />
                              </div>
                            </td>

                            {/* Editable Margin % Field (Amber colored) */}
                            <td className="border-b border-r border-slate-700/80 px-1 py-1 text-center bg-amber-950/20 group-hover:bg-amber-950/30">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={margin}
                                  onChange={(e) => handleInlineCostChange(id, 'marginPercent', e.target.value)}
                                  onBlur={() => handleSaveInlineCost(id)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineCost(id)}
                                  placeholder="0"
                                  className="w-14 bg-slate-900 border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded px-1.5 py-1 text-right font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs shadow-inner"
                                  title="Admin: Click to edit Margin % (e.g. 30 for 30%)"
                                />
                                <span className="text-[10px] text-amber-400 font-bold">%</span>
                              </div>
                            </td>

                            {/* Derived Total Unit Cost = (Purc + Transport) + Margin% */}
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono font-black text-purple-300 bg-purple-950/20 group-hover:bg-purple-950/30">
                              ₹ {unitCost.toLocaleString('en-IN')}
                            </td>

                            {/* Sold Price (with Avg indicator if multi-HQ) */}
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono font-semibold text-sky-300 bg-sky-950/10 group-hover:bg-sky-950/20">
                              ₹ {Number(r.soldPrice || 0).toLocaleString('en-IN')}
                              <span className={`text-[9px] ml-1.5 px-1 py-0.2 rounded font-bold ${
                                r.priceType === 'AVG'
                                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                                  : 'text-slate-400'
                              }`}>
                                ({r.priceType === 'AVG' ? 'Avg' : r.priceType})
                              </span>
                            </td>

                            {/* Qty Sold */}
                            <td className="border-b border-r border-slate-700/80 px-2 py-2 text-center font-mono font-bold text-white bg-sky-950/10 group-hover:bg-sky-950/20">
                              {r.quantity > 0 ? (
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  {r.quantity}
                                </span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>

                            {/* Selling Value, Total Cost, Actual Profit */}
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono font-bold text-white">
                              ₹ {r.sellingPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="border-b border-r border-slate-700/80 px-2.5 py-2 text-right font-mono text-slate-400">
                              ₹ {costOfProd.toLocaleString('en-IN')}
                            </td>
                            <td className={`border-b border-r border-slate-700/80 px-3 py-2 text-right font-mono font-black bg-emerald-950/15 group-hover:bg-emerald-950/25 ${
                              profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ₹ {profit.toLocaleString('en-IN')}
                            </td>

                            {/* Save Status Indicator */}
                            <td className="border-b border-slate-700/80 px-2 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {inline?.saving ? (
                                  <span className="text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1 animate-pulse">
                                    <RefreshCw size={11} className="animate-spin" /> Saving
                                  </span>
                                ) : inline?.saved ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                                    ✓ Saved
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineCost(id)}
                                    className="text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold transition-colors"
                                  >
                                    Save
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCostEdit(r)}
                                  className="text-slate-400 hover:text-amber-400 p-1 hover:bg-slate-700/60 rounded transition-colors"
                                  title="Open cost edit modal"
                                >
                                  <Edit3 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* STICKY TABLE FOOTER WITH AGGREGATE TOTALS */}
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t-2 border-slate-700 py-3 px-4 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xl z-20">
                <div className="flex items-center gap-3 text-slate-400">
                  <span>Total Products: <strong className="text-white">{filteredRecords.length}</strong></span>
                  <span>•</span>
                  <span>Total Qty Sold: <strong className="text-sky-400 font-mono">{liveTotals.totalQty}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-400">Selling Value: </span>
                    <strong className="text-white">₹ {liveTotals.totalSellingValue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">COGS (Total Cost): </span>
                    <strong className="text-slate-300">₹ {liveTotals.totalCostOfProduct.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg shadow-sm">
                    <span className="text-emerald-300 font-bold">Gross Product Profit: </span>
                    <strong className="text-emerald-400 font-black">₹ {liveTotals.totalGrossProfit.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TERRITORY ROI VIEW */
            <div className="flex-1 flex flex-col gap-4">
              {/* ROI KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Secondary Selling Revenue
                  </span>
                  <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                    ₹ {(roiData?.summary?.totalSellingValue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Total Territory Secondary Sales</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HQ Gross Product Profit
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                    ₹ {(roiData?.summary?.totalRevenue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Selling Value minus Unit Costs</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cost Center Expenses
                  </span>
                  <span className="text-xl font-black text-rose-400 font-mono mt-1 block">
                    ₹ {(roiData?.summary?.totalExpense || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Salaries, PF, TA/DA, Field Expenses</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-xl shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Actual HQ Net Profit
                  </span>
                  <span className={`text-xl font-black font-mono mt-1 block ${
                    (roiData?.summary?.totalNetMargin || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ₹ {(roiData?.summary?.totalNetMargin || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Product Profit minus Cost Center</span>
                </div>
              </div>

              {/* Territory ROI Register Table */}
              <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[300px]">
                <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Territory-Wise Actual Profit &amp; ROI Register
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
                        <th className="border border-slate-700 px-3 py-2 text-right">Selling Value (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right">Product Cost (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right text-sky-400">Gross Product Profit (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right text-rose-400">Cost Center Expenses (₹)</th>
                        <th className="border border-slate-700 px-3 py-2 text-right font-black">Actual Net Profit (₹)</th>
                        <th className="border border-slate-700 px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!roiData?.breakdown || roiData.breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                            No ROI data found for selected period.
                          </td>
                        </tr>
                      ) : (
                        roiData.breakdown.map((b: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                            <td className="border border-slate-700 px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                            <td className="border border-slate-700 px-3 py-2 text-left font-bold text-white">
                              {b.hq}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono text-slate-300">
                              ₹ {Number(b.sellingValue || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono text-slate-400">
                              ₹ {Number(b.productCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-sky-400">
                              ₹ {Number(b.revenue || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2 text-right font-mono font-bold text-rose-400">
                              ₹ {Number(b.expense || 0).toLocaleString('en-IN')}
                            </td>
                            <td className={`border border-slate-700 px-3 py-2 text-right font-mono font-black ${
                              b.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ₹ {Number(b.netMargin || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-700 px-3 py-2">
                              {b.netMargin >= 0 ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  🟢 Profitable
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                                  🔴 Net Loss
                                </span>
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
        </>
      )}

        </main>

      {/* EDIT PRODUCT PURCHASE & TRANSPORT COSTS MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-900">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Edit3 size={16} className="text-amber-400" />
                Set Unit Costs: {editingProduct.productName}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCosts} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">MRP</span>
                  <span className="font-bold text-white">₹ {editingProduct.mrp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">PTR</span>
                  <span className="font-bold text-sky-400">₹ {editingProduct.ptr}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">PTS</span>
                  <span className="font-bold text-purple-400">₹ {editingProduct.pts}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                  Purchase Cost of Product (Purc. Cost ₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editPurchaseCost}
                  onChange={e => setEditPurchaseCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Manufacturing or acquisition rate per unit</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                  Transport Cost (₹ per unit) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editTransportCost}
                  onChange={e => setEditTransportCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Freight, logistics, and handling charges</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                  Margin (%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editMarginPercent}
                    onChange={e => setEditMarginPercent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                  <span className="text-sm font-bold text-amber-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Profitability buffer added to (Purc. + Transport)</span>
              </div>

              {/* Total Unit Cost Preview */}
              {(() => {
                const base = (Number(editPurchaseCost) || 0) + (Number(editTransportCost) || 0);
                const margin = Number(editMarginPercent) || 0;
                const total = Number((base * (1 + margin / 100)).toFixed(2));
                return (
                  <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block">
                        Derived Total Unit Cost
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Base ₹{base} + {margin}% Margin
                      </span>
                    </div>
                    <span className="text-lg font-mono font-black text-purple-300">
                      ₹ {total.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCost}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-lg text-xs font-black shadow shadow-amber-500/20"
                >
                  {savingCost ? 'Saving...' : 'Save Unit Costs'}
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
                A <strong>Profit Center</strong> assesses the real financial performance of your product catalog and field territories by comparing revenue against costs.
              </p>
              <div className="space-y-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-0.5">1. Total Unit Cost</span>
                  <span className="text-[11px] text-slate-400">Total Unit Cost = Purchase Cost (Manufacturing) + Transport Cost (Logistics).</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-purple-400 block mb-0.5">2. Secondary Sales &amp; Actual Sold Price</span>
                  <span className="text-[11px] text-slate-400">Quantity is dynamically fetched from secondary sales. The system detects if the product was sold at PTR, PTS, or custom price (CUS).</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-amber-400 block mb-0.5">3. Product Actual Profit</span>
                  <span className="text-[11px] text-slate-400">Actual Profit = (Quantity × Actual Price Sold) - (Quantity × Total Unit Cost).</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="font-bold text-emerald-400 block mb-0.5">4. Actual HQ Net Profit</span>
                  <span className="text-[11px] text-slate-400">Actual HQ Net Profit = Total HQ Gross Product Profit minus Total Cost Center Expenses (salaries, PF, field allowances).</span>
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
