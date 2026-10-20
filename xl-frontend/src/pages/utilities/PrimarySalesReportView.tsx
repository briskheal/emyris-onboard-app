import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, PackageSearch, RefreshCw, Download, Eye, Plus, X
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

  // Drill-down detail state
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!selectedUser?.employeeId) return;
    setLoading(true);
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

  const handleOpenDetail = async (row: any) => {
    setDetailRow(row);
    setDetailLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/primary-sales/detail', {
        params: {
          startDate,
          endDate,
          type: reportType,
          dateWise: String(dateWise),
          stockist: row.stockist,
          headquarter: row.headquarter,
          user: row.employeeId || selectedUser?.employeeId,
          date: row.date
        }
      });
      if (res.data?.success) {
        setDetailItems(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
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
      'Gross Sales': Number(r.grossSales || 0),
      'Salable Returns': Number(r.salableReturns || 0),
      'Expiry Returns': Number(r.expiryReturns || 0),
      'Net Primary Sales (INR)': Number(r.totalSales || r.totalValue || 0)
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
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
            <span className="text-xl font-black text-cyan-400">₹{totalNet.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => navigate('/creation/primary-sales/history')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 border border-slate-700"
          >
            All Invoices
          </button>
        </div>

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
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white truncate">
                    {r.stockistName || r.stockist || r.headquarter || r.displayDate || r.productName || 'Record'}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
                    {r.headquarter && <span>HQ: {r.headquarter}</span>}
                    {(r.displayDate || r.date) && <span>• {r.displayDate || r.date}</span>}
                    {r.invoiceNumber && <span>• Inv #{r.invoiceNumber}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-400">
                      ₹{Number(r.totalSales || r.totalValue || 0).toLocaleString('en-IN')}
                    </div>
                    {Number(r.salableReturns || 0) > 0 && (
                      <div className="text-[9px] text-rose-400">Rtn: ₹{Number(r.salableReturns).toLocaleString('en-IN')}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenDetail(r)}
                    className="p-2 rounded-xl bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 border border-slate-700"
                    title="View Product Breakdown"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Breakdown Modal */}
      {detailRow && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase block">Product Wise Breakdown</span>
                <h3 className="text-sm font-black text-white">
                  {detailRow.stockistName || detailRow.stockist || detailRow.headquarter || detailRow.displayDate}
                </h3>
              </div>
              <button onClick={() => setDetailRow(null)} className="p-1.5 rounded-full bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {detailLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading product items...</div>
              ) : detailItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No product line items found.</div>
              ) : (
                detailItems.map((it: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{it.productName || it.product}</div>
                      {it.quantity !== undefined && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Qty: <strong className="text-slate-200">{it.quantity}</strong> • Avg: ₹{Number(it.averagePrice || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="font-black text-cyan-400">
                      ₹{Number(it.totalSales || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
