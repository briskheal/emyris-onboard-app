import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Eye, ArrowLeft, Search, X, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import EmyrisDateRangePicker from '../components/EmyrisDateRangePicker';
import CustomUserSelect from '../components/CustomUserSelect';

export default function PrimarySalesReports() {
  const navigate = useNavigate();

  const today = new Date();
  const [startDate, setStartDate] = useState<Date | null>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  
  const [selectType, setSelectType] = useState('Stockist'); // Stockist, Headquarter, Date, User, Purchase Returns, Expiry Returns
  const [viewDateWise, setViewDateWise] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [adminsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/admins'),
          axios.get('/api/admin/users')
        ]);
        let allUsers: any[] = [];
        if (adminsRes.data?.success) allUsers = [...allUsers, ...adminsRes.data.admins.map((x: any) => ({ ...x, isAdmin: true }))];
        if (usersRes.data?.success) allUsers = [...allUsers, ...usersRes.data.users.map((x: any) => ({ ...x, isAdmin: false }))];
        setUsers(allUsers);
      } catch (err) {}
    };
    fetchUsers();
  }, []);

  const getUserDisplayName = (empId: string) => {
    if (!empId) return '-';
    const u = users.find(x => x.employeeId === empId || x._id === empId || x.uid === empId);
    return u ? (u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || empId) : empId;
  };
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail view state
  const [detailRow, setDetailRow] = useState<any>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailViewDateWise, setDetailViewDateWise] = useState(false);

  const formatYYYYMMDD = (d: Date | null) => {
    if (!d) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const fetchReports = async () => {
    setLoading(true);
    setDetailRow(null);
    try {
      const res = await axios.get('/api/xl/reports/primary-sales', {
        params: {
          startDate: formatYYYYMMDD(startDate),
          endDate: formatYYYYMMDD(endDate),
          type: selectType,
          dateWise: viewDateWise,
          employeeId: selectType === 'User' ? selectedUser : undefined
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setData(res.data.data || []);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectType, viewDateWise]);

  const fetchDetailReport = async (row: any, isDateWise = false) => {
    setDetailLoading(true);
    try {
      const params: any = {
        startDate: formatYYYYMMDD(startDate),
        endDate: formatYYYYMMDD(endDate),
        type: selectType,
        dateWise: isDateWise
      };

      if (row?.date) params.date = row.date;
      if (selectType === 'Stockist') params.stockist = row?.stockist;
      if (selectType === 'Headquarter') params.headquarter = row?.headquarter;
      if (selectType === 'User') params.employeeId = row?.employeeId;

      const res = await axios.get('/api/xl/reports/primary-sales/detail', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setDetailData(res.data.data || []);
      }
    } catch(err) {
      console.error(err);
    }
    setDetailLoading(false);
  };

  const openDetail = (row: any) => {
    setDetailRow(row);
    setDetailViewDateWise(false);
    fetchDetailReport(row, false);
  };

  const handleDetailToggle = (checked: boolean) => {
    setDetailViewDateWise(checked);
    fetchDetailReport(detailRow, checked);
  };

  const getEntityName = (row: any) => {
    if (selectType === 'Stockist') return row.stockistName || row.stockist;
    if (selectType === 'Headquarter') return row.headquarter;
    if (selectType === 'User') return row.userName || getUserDisplayName(row.employeeId);
    if (selectType === 'Date') return row.displayDate || row.date;
    return '';
  };

  const processedData = useMemo(() => {
    let result = [...data];
    if (globalSearch.trim() !== '') {
      const search = globalSearch.toLowerCase();
      result = result.filter(item => {
        const uName = (item.userName || getUserDisplayName(item.employeeId) || item.employeeId || '').toString().toLowerCase();
        const invoiceNumber = (item.invoiceNumber || item.invNumber || '').toString().toLowerCase();
        const stockist = (item.stockistName || item.stockist || '').toString().toLowerCase();
        const headquarter = (item.headquarter || '').toString().toLowerCase();
        const date = (item.displayDate || item.date || '').toString().toLowerCase();
        const product = (item.productName || item.product || '').toString().toLowerCase();
        return uName.includes(search) || invoiceNumber.includes(search) || stockist.includes(search) || headquarter.includes(search) || date.includes(search) || product.includes(search);
      });
    }
    if (sortConfig) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (['totalSales', 'grossSales', 'salableReturns', 'expiryReturns', 'returnQty', 'totalValue'].includes(sortConfig.key)) {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (sortConfig.key === 'userName') {
          valA = (a.userName || getUserDisplayName(a.employeeId) || a.employeeId || '').toString().toLowerCase();
          valB = (b.userName || getUserDisplayName(b.employeeId) || b.employeeId || '').toString().toLowerCase();
        } else if (sortConfig.key === 'invoiceNumber') {
          valA = (a.invoiceNumber || a.invNumber || '').toString().toLowerCase();
          valB = (b.invoiceNumber || b.invNumber || '').toString().toLowerCase();
        } else {
          valA = (valA || '').toString().toLowerCase();
          valB = (valB || '').toString().toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, globalSearch, sortConfig, users]);

  const totals = useMemo(() => {
    let grossSales = 0;
    let salableReturns = 0;
    let expiryReturns = 0;
    let totalSales = 0;
    let returnQty = 0;
    let returnTotalValue = 0;

    processedData.forEach(d => {
      grossSales += Number(d.grossSales || 0);
      salableReturns += Number(d.salableReturns || 0);
      expiryReturns += Number(d.expiryReturns || 0);
      totalSales += Number(d.totalSales || 0);
      returnQty += Number(d.returnQty || 0);
      returnTotalValue += Number(d.totalValue || 0);
    });

    return {
      grossSales,
      salableReturns,
      expiryReturns,
      totalSales,
      returnQty,
      returnTotalValue
    };
  }, [processedData]);

  const detailTotals = useMemo(() => {
    let quantity = 0;
    let totalSales = 0;
    detailData.forEach(d => {
      quantity += Number(d.quantity || 0);
      totalSales += Number(d.totalSales || 0);
    });
    return { quantity, totalSales };
  }, [detailData]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (
    label: React.ReactNode, 
    sortKey: string, 
    align: 'left' | 'center' | 'right' = 'left',
    widthClass: string = ''
  ) => {
    return (
      <th 
        className={`px-3 py-3 border-r border-[#3b3b5a] cursor-pointer hover:bg-[#252538] transition-colors text-${align} ${widthClass}`} 
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span className="whitespace-normal leading-tight">{label}</span>
          {sortConfig?.key === sortKey ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-emerald-400 shrink-0" /> : <ArrowDown size={12} className="text-emerald-400 shrink-0" />
          ) : (
            <ArrowUp size={12} className="opacity-25 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-[#151521] text-slate-300 p-4 md:p-5 pb-48 font-sans">
      <style>{`
        .report-table-scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .report-table-scroll::-webkit-scrollbar-track {
          background: #151521;
          border-radius: 6px;
        }
        .report-table-scroll::-webkit-scrollbar-thumb {
          background: #3b3b5a;
          border-radius: 6px;
          border: 2px solid #151521;
        }
        .report-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #52527a;
        }
      `}</style>

      <div className="max-w-[1440px] mx-auto space-y-3.5">
        
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => detailRow ? setDetailRow(null) : navigate(-1)} 
            className="p-1.5 hover:bg-[#1e1e2d] text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Back"
          >
            {detailRow ? <ArrowLeft size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h1 className="text-sm md:text-base font-bold text-white tracking-wider uppercase">
            {detailRow ? 'PRODUCT WISE SALES REPORTS' : 'PRIMARY SALES REPORTS'}
          </h1>
        </div>

        {!detailRow ? (
          <>
            {/* Filters */}
            <EmyrisDateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
            />

            {/* Filter Bar with proper spacing & placement */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] p-3.5 shadow-sm rounded-xl">
              <div className="flex flex-wrap items-end gap-4 justify-between">
                <div className="flex flex-wrap items-end gap-4">
                  {/* Select Type */}
                  <div className="flex flex-col gap-1.5 w-48 shrink-0">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Type <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={selectType} 
                      onChange={e => { setSelectType(e.target.value); setSelectedUser(''); }} 
                      className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 hover:border-sky-500 focus:outline-none w-full transition-colors h-[42px] cursor-pointer"
                    >
                      <option>Stockist</option>
                      <option>Headquarter</option>
                      <option>Date</option>
                      <option>User</option>
                      <option>Purchase Returns</option>
                      <option>Expiry Returns</option>
                    </select>
                  </div>

                  {/* Select User */}
                  {selectType === 'User' && (
                    <div className="flex flex-col gap-1.5 w-72 sm:w-80 shrink-0">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Select User
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <CustomUserSelect 
                            users={users}
                            selectedUser={selectedUser}
                            onChange={(id) => setSelectedUser(id)}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={fetchReports} 
                          title="Refresh user data"
                          className="p-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-[#3b3b5a] bg-[#151521] transition-colors shrink-0 h-[42px] flex items-center justify-center cursor-pointer"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* See Reports Button */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button 
                      id="fetch-btn" 
                      onClick={fetchReports} 
                      disabled={loading}
                      className="bg-[#1f84b6] hover:bg-sky-600 active:scale-95 text-white font-bold px-6 h-[42px] rounded-lg transition-all shadow-md shadow-sky-900/30 shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>See Reports</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-slate-500 text-xs text-right leading-relaxed hidden lg:block self-center">
                  We use caching on this page. Click <span className="text-slate-400 font-medium">See Reports</span><br />
                  in case you don't see updated data.
                </div>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
              <div className="p-3 px-4 border-b border-[#2d2d44] flex flex-wrap gap-4 items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  SHOWING ({processedData.length}) ENTRIES
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-[#151521] border border-[#3b3b5a] rounded-lg px-3 py-1.5 focus-within:border-sky-500 transition-colors">
                    <Search size={16} className="text-slate-500" />
                    <input 
                      type="text" 
                      value={globalSearch}
                      onChange={e => setGlobalSearch(e.target.value)}
                      placeholder="Search reports..." 
                      className="bg-transparent text-sm text-slate-300 w-48 outline-none placeholder-slate-500"
                    />
                    {globalSearch && (
                      <button onClick={() => setGlobalSearch('')} className="text-slate-500 hover:text-slate-300">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-300">VIEW DATE WISE</span>
                    <button 
                      onClick={() => { setViewDateWise(!viewDateWise); setTimeout(() => document.getElementById('fetch-btn')?.click(), 0); }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${viewDateWise ? 'bg-sky-500' : 'bg-[#3b3b5a]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${viewDateWise ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto report-table-scroll max-h-[68vh] border-b border-[#3b3b5a]">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-sky-400" />
                    <span>Loading report data...</span>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a] sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="px-3 py-3 border-r border-[#3b3b5a] w-14 text-center">Sr no.</th>
                        
                        {selectType === 'Purchase Returns' || selectType === 'Expiry Returns' ? (
                          <>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] w-28 text-center">Inv. Date</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] w-28">Inv. No</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] min-w-[140px]">Stockist</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] w-40">Headquarter</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] min-w-[160px]">Product</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right w-24">Rtn Qty</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right w-28">Rtn Rate (₹)</th>
                            <th className="px-3 py-3 text-right w-32">Total Value (₹)</th>
                          </>
                        ) : selectType === 'User' ? (
                          <>
                            {renderSortableHeader('Inv. Date', 'date', 'center', 'w-28')}
                            {renderSortableHeader('Inv. No', 'invoiceNumber', 'left', 'w-28')}
                            {renderSortableHeader('Submitted By', 'userName', 'left', 'w-52')}
                            {renderSortableHeader('Stockist', 'stockist', 'left', 'min-w-[150px]')}
                            {renderSortableHeader('Headquarter', 'headquarter', 'left', 'w-40')}
                            {renderSortableHeader(<>Gross Sales<br/>(₹)</>, 'grossSales', 'right', 'w-32')}
                            {renderSortableHeader(<>Salable Rtn<br/>(₹)</>, 'salableReturns', 'right', 'w-28')}
                            {renderSortableHeader(<>Expiry Rtn<br/>(₹)</>, 'expiryReturns', 'right', 'w-28')}
                            {renderSortableHeader(<>Net Sales<br/>(₹)</>, 'totalSales', 'right', 'w-32')}
                          </>
                        ) : (
                          <>
                            {viewDateWise && <th className="px-3 py-3 border-r border-[#3b3b5a] w-28 text-center">Date</th>}
                            {selectType === 'Stockist' && (
                              <>
                                <th className="px-3 py-3 border-r border-[#3b3b5a] min-w-[160px]">Stockist</th>
                                <th className="px-3 py-3 border-r border-[#3b3b5a] w-44">Headquarter</th>
                              </>
                            )}
                            {selectType === 'Headquarter' && <th className="px-3 py-3 border-r border-[#3b3b5a] min-w-[180px]">Headquarter</th>}
                            {selectType === 'Date' && !viewDateWise && <th className="px-3 py-3 border-r border-[#3b3b5a] w-32 text-center">Date</th>}
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right w-32">Gross Sales (₹)</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right text-orange-400 w-28">Salable Rtn (₹)</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right text-rose-400 w-28">Expiry Rtn (₹)</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right text-emerald-400 w-32">Net Sales (₹)</th>
                            <th className="px-3 py-3 text-center w-16">View</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                          <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center text-slate-400">{i + 1}</td>
                          
                          {selectType === 'Purchase Returns' || selectType === 'Expiry Returns' ? (
                            <>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center font-medium text-slate-300">{d.displayDate || d.date}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-300 font-medium">{d.invoiceNumber || '-'}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-300">{d.stockistName || d.stockist}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] font-bold text-sky-400">{d.productName || d.product}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right text-slate-300">{d.returnQty}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right text-slate-400">{Number(d.returnRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-rose-400">{Number(d.totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </>
                          ) : selectType === 'User' ? (
                            <>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center font-medium text-slate-300">{d.displayDate || d.date}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-300 font-medium">{d.invoiceNumber || d.invNumber || '-'}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-200">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-100">
                                    {d.userName && d.userName !== d.employeeId ? d.userName : getUserDisplayName(d.employeeId)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {d.employeeId}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-300 font-medium">{d.stockistName || d.stockist}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-slate-200">{Number(d.grossSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-orange-400">{Number(d.salableReturns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-rose-400">{Number(d.expiryReturns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </>
                          ) : (
                            <>
                              {viewDateWise && <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center font-medium text-slate-300">{d.displayDate || d.date}</td>}
                              
                              {selectType === 'Stockist' && (
                                <>
                                  <td className="px-3 py-2.5 border-r border-[#3b3b5a] font-medium text-slate-200">{d.stockistName || d.stockist}</td>
                                  <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                                </>
                              )}
                              {selectType === 'Headquarter' && <td className="px-3 py-2.5 border-r border-[#3b3b5a] font-medium text-slate-200">{d.headquarter}</td>}
                              {selectType === 'Date' && !viewDateWise && <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center font-medium text-slate-300">{d.displayDate || d.date}</td>}
                              
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-slate-200">{Number(d.grossSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-orange-400">{Number(d.salableReturns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-medium text-rose-400">{Number(d.expiryReturns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2.5 text-center">
                                <button onClick={() => openDetail(d)} className="text-sky-400 hover:text-sky-300 p-1.5 bg-sky-500/10 hover:bg-sky-500/20 rounded transition-colors cursor-pointer">
                                  <Eye size={16} />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {processedData.length === 0 && !loading && (
                        <tr>
                          <td colSpan={12} className="px-4 py-12 text-center text-slate-500 font-medium">No records found.</td>
                        </tr>
                      )}
                    </tbody>

                    {/* Table Footer with Total Line */}
                    {processedData.length > 0 && !loading && (
                      <tfoot className="bg-[#12131f] text-slate-200 font-bold border-t-2 border-[#3b3b5a] text-xs uppercase tracking-wider sticky bottom-0 z-20 shadow-lg">
                        {selectType === 'Purchase Returns' || selectType === 'Expiry Returns' ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 text-right border-r border-[#3b3b5a] text-slate-300 font-black">
                              TOTAL ({processedData.length} ITEMS):
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-slate-200">
                              {totals.returnQty}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-slate-500">
                              -
                            </td>
                            <td className="px-3 py-3 text-right font-black text-rose-400">
                              ₹ {totals.returnTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ) : selectType === 'User' ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 text-right border-r border-[#3b3b5a] text-slate-300 font-black">
                              TOTAL ({processedData.length} INVOICES):
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-white">
                              ₹ {totals.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-orange-400">
                              ₹ {totals.salableReturns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-rose-400">
                              ₹ {totals.expiryReturns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-emerald-400">
                              ₹ {totals.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td 
                              colSpan={
                                (viewDateWise ? 1 : 0) + 
                                (selectType === 'Stockist' ? 3 : selectType === 'Headquarter' ? 2 : 2)
                              } 
                              className="px-4 py-3 text-right border-r border-[#3b3b5a] text-slate-300 font-black"
                            >
                              TOTAL:
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-white">
                              ₹ {totals.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-orange-400">
                              ₹ {totals.salableReturns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-rose-400">
                              ₹ {totals.expiryReturns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-emerald-400">
                              ₹ {totals.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-500">-</td>
                          </tr>
                        )}
                      </tfoot>
                    )}
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#1e1e2d] border border-[#2d2d44] p-3.5 flex flex-wrap gap-4 items-center justify-between shadow-sm rounded-xl">
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-0.5">SHOWING RESULTS FOR {selectType.toUpperCase()}</p>
                <h3 className="text-base md:text-lg font-bold text-white">{getEntityName(detailRow)}</h3>
              </div>
              
              <div className="flex items-center gap-2 h-[42px]">
                <span className="text-sm font-semibold text-slate-300">VIEW DATE WISE</span>
                <button 
                  onClick={() => handleDetailToggle(!detailViewDateWise)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${detailViewDateWise ? 'bg-indigo-500' : 'bg-[#3b3b5a]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${detailViewDateWise ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Detail Data Table */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
              <div className="p-3 px-4 border-b border-[#2d2d44] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  SHOWING ({detailData.length}) ENTRIES
                </h2>
              </div>
              
              <div className="overflow-x-auto report-table-scroll max-h-[68vh] border-b border-[#3b3b5a]">
                {detailLoading ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-sky-400" />
                    <span>Loading details...</span>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a] sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="px-3 py-3 border-r border-[#3b3b5a] w-14 text-center">Sr no.</th>
                        {detailViewDateWise && <th className="px-3 py-3 border-r border-[#3b3b5a] w-28 text-center">Date</th>}
                        <th className="px-3 py-3 border-r border-[#3b3b5a] min-w-[200px]">Product</th>
                        {detailViewDateWise && (
                          <>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right w-24">Quantity</th>
                            <th className="px-3 py-3 border-r border-[#3b3b5a] text-right w-28">Average Price</th>
                          </>
                        )}
                        <th className="px-3 py-3 text-right w-36">Total {detailViewDateWise ? 'Sales' : 'Primary Sales'} (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                          <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center text-slate-400">{i + 1}</td>
                          {detailViewDateWise && <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-center font-medium text-slate-300">{d.displayDate || d.date}</td>}
                          <td className="px-3 py-2.5 border-r border-[#3b3b5a] font-medium text-slate-200">{d.productName || d.product}</td>
                          {detailViewDateWise && (
                            <>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right text-slate-300 font-semibold">{d.quantity}</td>
                              <td className="px-3 py-2.5 border-r border-[#3b3b5a] text-right text-slate-400">{Number(d.averagePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </>
                          )}
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {detailData.length === 0 && !detailLoading && (
                        <tr>
                          <td colSpan={10} className="px-4 py-12 text-center text-slate-500 font-medium">No products found.</td>
                        </tr>
                      )}
                    </tbody>

                    {/* Detail Footer with Total Line */}
                    {detailData.length > 0 && !detailLoading && (
                      <tfoot className="bg-[#12131f] text-slate-200 font-bold border-t-2 border-[#3b3b5a] text-xs uppercase tracking-wider sticky bottom-0 z-20 shadow-lg">
                        <tr>
                          <td 
                            colSpan={detailViewDateWise ? 3 : 2} 
                            className="px-4 py-3 text-right border-r border-[#3b3b5a] text-slate-300 font-black"
                          >
                            TOTAL:
                          </td>
                          {detailViewDateWise && (
                            <>
                              <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-slate-200">
                                {detailTotals.quantity}
                              </td>
                              <td className="px-3 py-3 border-r border-[#3b3b5a] text-right font-black text-slate-500">
                                -
                              </td>
                            </>
                          )}
                          <td className="px-3 py-3 text-right font-black text-emerald-400">
                            ₹ {detailTotals.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
