import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, PackageSearch, RefreshCw, Download, Eye, Plus, X, ChevronDown, Package, Maximize2
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportUserFilter, { SelectedReportUser } from '../../components/ReportUserFilter';

export default function PrimarySalesReportView() {
  const navigate = useNavigate();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [selectedUser, setSelectedUser] = useState<SelectedReportUser | null>(null);
  const [startDate, setStartDate] = useState<string>(firstDay);
  const [endDate, setEndDate] = useState<string>(lastDay);
  const [reportType, setReportType] = useState<string>('Stockist');
  const [dateWise, setDateWise] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<any[]>([]);

  // Inline expansion state & cache
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [rowCache, setRowCache] = useState<Record<string, { loading: boolean; items: any[] }>>({});

  // Full-view modal state (optional popout)
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
    setExpandedRowKey(null);
    setRowCache({});
    try {
      const res = await axios.get('/api/xl/reports/primary-sales', {
        params: {
          startDate,
          endDate,
          type: reportType,
          dateWise: String(dateWise),
          employeeId: selectedUser.employeeId
        }
      });
      if (res.data?.success) {
        setRows(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.employeeId) {
      fetchReport();
    }
  }, [selectedUser?.employeeId, startDate, endDate, reportType, dateWise]);

  const getRowKey = (r: any, i: number) => 
    `${r.stockist || ''}_${r.headquarter || ''}_${r.date || ''}_${r.invoiceNumber || ''}_${i}`;

  const fetchDetailItems = async (row: any): Promise<any[]> => {
    const res = await axios.get('/api/xl/reports/primary-sales/detail', {
      params: {
        startDate,
        endDate,
        type: reportType,
        dateWise: String(dateWise),
        stockist: row.stockist || row.stockistName,
        headquarter: row.headquarter,
        user: row.employeeId || selectedUser?.employeeId,
        employeeId: selectedUser?.employeeId,
        date: row.date
      }
    });
    return res.data?.success ? (res.data.data || []) : [];
  };

  // Toggle inline accordion
  const handleToggleInline = async (row: any, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (expandedRowKey === key) {
      setExpandedRowKey(null);
      return;
    }

    setExpandedRowKey(key);

    if (!rowCache[key] || !rowCache[key].items.length) {
      setRowCache(prev => ({ ...prev, [key]: { loading: true, items: [] } }));
      try {
        const items = await fetchDetailItems(row);
        setRowCache(prev => ({ ...prev, [key]: { loading: false, items } }));
      } catch (err) {
        console.error(err);
        setRowCache(prev => ({ ...prev, [key]: { loading: false, items: [] } }));
      }
    }
  };

  // Popout into structured dialog (with soft background)
  const handleOpenModal = async (row: any, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetailRow(row);

    if (rowCache[key]?.items?.length) {
      setDetailItems(rowCache[key].items);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    try {
      const items = await fetchDetailItems(row);
      setDetailItems(items);
      setRowCache(prev => ({ ...prev, [key]: { loading: false, items } }));
    } catch (err) {
      console.error(err);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalNet = rows.reduce((acc, r) => acc + Number(r.totalSales || r.totalValue || 0), 0);

  const handleExport = () => {
    if (!rows.length) return;
    const sheetData = rows.map((r, i) => ({
      'Sr No': i + 1,
      'Date': r.displayDate || r.date || '-',
      'Stockist': r.stockistName || r.stockist || '-',
      'Headquarter': r.headquarter || '-',
      'Gross Sales': Math.round(Number(r.grossSales || 0)),
      'Salable Returns': Math.round(Number(r.salableReturns || 0)),
      'Expiry Returns': Math.round(Number(r.expiryReturns || 0)),
      'Net Primary Sales (INR)': Math.round(Number(r.totalSales || r.totalValue || 0))
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Primary Sales');
    XLSX.writeFile(wb, `Primary_Sales_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="min-h-full bg-slate-800 pb-24 text-white font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/utilities')}
            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-wide flex items-center gap-1.5">
              <PackageSearch size={16} className="text-cyan-400" />
              PRIMARY <span className="text-cyan-400">SALES</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">Stockist billing, returns & net primary value</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/creation/primary-sales')}
            className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 active:scale-95"
            title="Add Primary Invoice"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95"
            title="Download Excel"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-slate-700/60 text-sky-400 active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ReportUserFilter
          selectedEmployeeId={selectedUser?.employeeId}
          onSelectUser={(u) => setSelectedUser(u)}
        />

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Group By & Date-wise Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Group By</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Stockist">Stockist Wise</option>
              <option value="Headquarter">Headquarter Wise</option>
              <option value="Date">Date Wise</option>
              <option value="User">Invoice / User Wise</option>
              <option value="Purchase Returns">Purchase Returns</option>
              <option value="Expiry Returns">Expiry Returns</option>
            </select>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setDateWise(!dateWise)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                dateWise
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              Date Wise: {dateWise ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Net Primary Sales</span>
            <div className="text-xl font-black text-cyan-400 mt-0.5">
              ₹{Math.round(totalNet).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Records</span>
            <div className="text-xs font-black text-slate-300">{rows.length} Entries</div>
          </div>
        </div>

        {/* Report Rows */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-cyan-400" />
            <span className="text-xs font-semibold">Loading primary sales...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No primary sales found for the selected period.
          </div>
        ) : (
          <div className="space-y-2.5">
            {rows.map((r, i) => {
              const key = getRowKey(r, i);
              const isExpanded = expandedRowKey === key;
              const cached = rowCache[key];

              return (
                <div
                  key={key}
                  className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all shadow-md ${
                    isExpanded ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : 'border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  {/* Row Summary Header (Clickable Accordion Trigger) */}
                  <div
                    onClick={(e) => handleToggleInline(r, key, e)}
                    className="p-3.5 flex items-center justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white truncate">
                          {r.stockistName || r.stockist || r.headquarter || r.displayDate || r.productName || 'Record'}
                        </h4>
                        {isExpanded && (
                          <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            Expanded
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
                        {r.headquarter && <span>HQ: <strong className="text-slate-300">{r.headquarter}</strong></span>}
                        {(r.displayDate || r.date) && <span>• {r.displayDate || r.date}</span>}
                        {r.invoiceNumber && <span>• Inv #{r.invoiceNumber}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          ₹{Math.round(Number(r.totalSales || r.totalValue || 0)).toLocaleString('en-IN')}
                        </div>
                        {Number(r.salableReturns || 0) > 0 && (
                          <div className="text-[9px] text-rose-400">
                            Rtn: ₹{Math.round(Number(r.salableReturns)).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      {/* Expand / Collapse Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleInline(r, key, e)}
                        className={`p-2 rounded-xl border transition-all ${
                          isExpanded
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 rotate-180'
                            : 'bg-slate-800 text-slate-400 hover:text-cyan-400 border-slate-700'
                        }`}
                        title={isExpanded ? 'Collapse Product Details' : 'Expand Product Details'}
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Product Breakdown Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs pb-1">
                        <div className="flex items-center gap-1.5 font-black text-cyan-400 uppercase text-[11px] tracking-wide">
                          <Package size={14} /> Product Wise Breakdown
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            {cached?.loading ? 'Loading...' : `${cached?.items?.length || 0} Products`}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenModal(r, key, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition"
                            title="Open in focused dialog"
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>
                      </div>

                      {cached?.loading ? (
                        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                          <RefreshCw size={14} className="animate-spin text-cyan-400" />
                          <span>Fetching products...</span>
                        </div>
                      ) : (cached?.items || []).length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500 italic">
                          No product line items found for this record.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {cached!.items.map((it: any, idx: number) => {
                            const qty = Number(it.quantity || 0);
                            const avgPrice = Math.round(Number(it.averagePrice || 0));
                            const lineTotal = Math.round(Number(it.totalSales || 0));

                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-white truncate">
                                    {it.productName || it.product}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>Qty: <strong className="text-cyan-300">{qty.toLocaleString('en-IN')}</strong></span>
                                    <span>•</span>
                                    <span>Avg: <strong className="text-slate-200">₹{avgPrice.toLocaleString('en-IN')}</strong></span>
                                  </div>
                                </div>
                                <div className="font-black text-cyan-400 shrink-0 text-right">
                                  ₹{lineTotal.toLocaleString('en-IN')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Focused Dialog (Soft Non-Dimming Backdrop) */}
      {detailRow && (
        <div 
          onClick={() => setDetailRow(null)}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Dialog Header */}
            <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Product Wise Breakdown
                </span>
                <h3 className="text-sm font-black text-white mt-0.5">
                  {detailRow.stockistName || detailRow.stockist || detailRow.headquarter || detailRow.displayDate}
                </h3>
              </div>
              <button 
                onClick={() => setDetailRow(null)} 
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Product Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {detailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw size={20} className="animate-spin text-cyan-400" />
                  <span>Loading product breakdown...</span>
                </div>
              ) : detailItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No product line items found.
                </div>
              ) : (
                detailItems.map((it: any, idx: number) => {
                  const qty = Number(it.quantity || 0);
                  const avgPrice = Math.round(Number(it.averagePrice || 0));
                  const lineTotal = Math.round(Number(it.totalSales || 0));

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{it.productName || it.product}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700 text-slate-300">
                            Qty: <strong className="text-cyan-300">{qty.toLocaleString('en-IN')}</strong>
                          </span>
                          <span>Avg Rate: <strong className="text-slate-200">₹{avgPrice.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                      <div className="font-black text-cyan-400 text-sm">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dialog Footer Summary */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                Total Products: <strong className="text-white">{detailItems.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}