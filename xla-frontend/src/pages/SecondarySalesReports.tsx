import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Eye, ArrowLeft, Search, X, ArrowUp, ArrowDown, Calendar, ChevronDown } from 'lucide-react';
import CustomUserSelect from '../components/CustomUserSelect';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SecondarySalesReports() {
  const navigate = useNavigate();
  
  const today = new Date();
  const [startMonth, setStartMonth] = useState(today.getMonth() + 1);
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [showStartMonthPicker, setShowStartMonthPicker] = useState(false);
  
  const [endMonth, setEndMonth] = useState(today.getMonth() + 1);
  const [endYear, setEndYear] = useState(today.getFullYear());
  const [showEndMonthPicker, setShowEndMonthPicker] = useState(false);
  
  const [selectType, setSelectType] = useState('Stockist'); // Stockist, Headquarter, User, Inventory
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

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail view state
  const [detailRow, setDetailRow] = useState<any>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLevel, setDetailLevel] = useState<'Stockist' | 'Product' | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setDetailRow(null);
    setDetailLevel(null);
    try {
      const res = await axios.get('/api/xl/reports/secondary-sales', {
        params: {
          startMonth: months[startMonth - 1],
          startYear: startYear,
          endMonth: months[endMonth - 1],
          endYear: endYear,
          type: selectType,
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

  const fetchDetailReport = async (row: any, type: string) => {
    setDetailLoading(true);
    try {
      const params: any = {
        startMonth: months[startMonth - 1],
        startYear: startYear,
        endMonth: months[endMonth - 1],
        endYear: endYear,
        type: type,
      };

      if (type === 'Stockist' && selectType === 'Headquarter') {
         params.headquarter = row?.headquarter;
      }
      if (type === 'Product') {
         params.stockist = row?.stockist;
         if (row?.headquarter) params.headquarter = row.headquarter;
      }

      const res = await axios.get('/api/xl/reports/secondary-sales/detail', {
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
    if (selectType === 'Headquarter') {
      setDetailLevel('Stockist');
      fetchDetailReport(row, 'Stockist');
    } else {
      setDetailLevel('Product');
      fetchDetailReport(row, 'Product');
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];
    if (globalSearch.trim() !== '') {
      const search = globalSearch.toLowerCase();
      result = result.filter(item => {
        const userName = (item.userName || item.employeeId || '').toString().toLowerCase();
        const stockist = (item.stockist || '').toString().toLowerCase();
        const headquarter = (item.headquarter || '').toString().toLowerCase();
        return userName.includes(search) || stockist.includes(search) || headquarter.includes(search);
      });
    }
    if (sortConfig) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'totalSales' || sortConfig.key === 'quantity') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
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
  }, [data, globalSearch, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (label: React.ReactNode, sortKey: string, align: 'left' | 'center' | 'right' = 'left') => {
    return (
      <th className={`px-4 py-3 border-r border-[#3b3b5a] cursor-pointer hover:bg-[#252538] transition-colors text-${align}`} onClick={() => handleSort(sortKey)}>
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
          {label}
          {sortConfig?.key === sortKey ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-emerald-400" /> : <ArrowDown size={12} className="text-emerald-400" />
          ) : (
            <ArrowUp size={12} className="opacity-30" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-[#151521] text-slate-300 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => detailRow ? setDetailRow(null) : navigate(-1)} className="p-2 hover:bg-[#1e1e2d] rounded-lg transition-colors">
            {detailRow ? <ArrowLeft size={24} /> : <ChevronLeft size={24} />}
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wide uppercase">
            {detailRow ? (detailLevel === 'Stockist' ? 'STOCKIST WISE SALES REPORTS' : 'PRODUCT WISE SALES REPORTS') : 'SECONDARY SALES REPORTS'}
          </h1>
        </div>

        {!detailRow ? (
          <>
            <div className="bg-[#1e1e2d] border border-[#2d2d44] p-4 flex flex-wrap gap-6 items-center justify-between shadow-sm rounded-xl mb-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-2 relative z-50">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Start Month <span className="text-rose-500">*</span></label>
                    <div 
                      onClick={() => { setShowStartMonthPicker(!showStartMonthPicker); setShowEndMonthPicker(false); }}
                      className="flex items-center justify-between bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 h-[42px] w-[180px] text-slate-300 font-semibold text-sm cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <span>{months[startMonth - 1]}, {startYear}</span>
                      <Calendar size={16} className="text-slate-500" />
                    </div>
                    {showStartMonthPicker && (
                      <div className="absolute top-[68px] left-0 w-[260px] bg-[#1e1e2d] border border-[#3b3b5a] rounded-xl shadow-2xl z-[60] p-4">
                         <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-white">{startYear}</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setStartYear(startYear - 1) }} className="p-1 hover:bg-[#252538] rounded text-slate-400 transition-colors"><ChevronDown className="rotate-90" size={16} /></button>
                               <button onClick={(e) => { e.stopPropagation(); setStartYear(startYear + 1) }} className="p-1 hover:bg-[#252538] rounded text-slate-400 transition-colors"><ChevronDown className="-rotate-90" size={16} /></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => {
                               const isSel = (i + 1) === startMonth;
                               return (
                                 <div 
                                    key={m} 
                                    onClick={() => { setStartMonth(i + 1); setShowStartMonthPicker(false); }}
                                    className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${isSel ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:bg-[#252538]'}`}
                                 >{m}</div>
                               )
                            })}
                         </div>
                      </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 relative z-40">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select End Month <span className="text-rose-500">*</span></label>
                    <div 
                      onClick={() => { setShowEndMonthPicker(!showEndMonthPicker); setShowStartMonthPicker(false); }}
                      className="flex items-center justify-between bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 h-[42px] w-[180px] text-slate-300 font-semibold text-sm cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <span>{months[endMonth - 1]}, {endYear}</span>
                      <Calendar size={16} className="text-slate-500" />
                    </div>
                    {showEndMonthPicker && (
                      <div className="absolute top-[68px] left-0 w-[260px] bg-[#1e1e2d] border border-[#3b3b5a] rounded-xl shadow-2xl z-[60] p-4">
                         <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-white">{endYear}</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setEndYear(endYear - 1) }} className="p-1 hover:bg-[#252538] rounded text-slate-400 transition-colors"><ChevronDown className="rotate-90" size={16} /></button>
                               <button onClick={(e) => { e.stopPropagation(); setEndYear(endYear + 1) }} className="p-1 hover:bg-[#252538] rounded text-slate-400 transition-colors"><ChevronDown className="-rotate-90" size={16} /></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => {
                               const isSel = (i + 1) === endMonth;
                               return (
                                 <div 
                                    key={m} 
                                    onClick={() => { setEndMonth(i + 1); setShowEndMonthPicker(false); }}
                                    className={`text-center py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${isSel ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:bg-[#252538]'}`}
                                 >{m}</div>
                               )
                            })}
                         </div>
                      </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 min-w-[200px] max-w-[300px]">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Type <span className="text-rose-500">*</span></label>
                <select value={selectType} onChange={e => { setSelectType(e.target.value); setSelectedUser(''); }} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:border-sky-500 hover:border-sky-500 focus:outline-none w-full transition-colors h-[42px] cursor-pointer">
                  <option>Stockist</option>
                  <option>Headquarter</option>
                  <option>User</option>
                  <option>Inventory</option>
                </select>
              </div>

              {selectType === 'User' && (
                <div className="flex flex-col gap-2 min-w-[250px] max-w-[350px]">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select User</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-grow">
                      <CustomUserSelect 
                        users={users}
                        selectedUser={selectedUser}
                        onChange={(id) => setSelectedUser(id)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button id="fetch-btn" onClick={fetchReports} className="bg-[#1f84b6] hover:bg-sky-600 text-white font-medium px-6 h-[42px] rounded-lg transition-colors shadow-lg">
                See Reports
              </button>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
              <div className="p-4 border-b border-[#2d2d44] flex flex-wrap gap-4 items-center justify-between">
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
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a]">
                        <tr>
                          <th className="px-4 py-3 border-r border-[#3b3b5a] w-[1%]">Sr no.</th>
                          
                          {selectType === 'User' ? (
                            <>
                              {renderSortableHeader('Submitted By', 'userName')}
                              {renderSortableHeader('Stockist', 'stockist')}
                              {renderSortableHeader('Headquarter', 'headquarter')}
                              {renderSortableHeader(<>Total Secondary Sales<br/>(₹)</>, 'totalSales', 'right')}
                            </>
                          ) : selectType === 'Inventory' ? (
                            <>
                              {renderSortableHeader('Stockist', 'stockist')}
                              {renderSortableHeader('Headquarter', 'headquarter')}
                              {renderSortableHeader('Total Quantity', 'quantity', 'right')}
                            </>
                          ) : (
                            <>
                              {selectType === 'Stockist' && (
                                <>
                                  <th className="px-4 py-3 border-r border-[#3b3b5a]">Stockist</th>
                                  <th className="px-4 py-3 border-r border-[#3b3b5a]">Headquarter</th>
                                </>
                              )}
                              {selectType === 'Headquarter' && <th className="px-4 py-3 border-r border-[#3b3b5a]">Headquarter</th>}
                              
                              <th className="px-4 py-3 border-r border-[#3b3b5a] text-right">Total Secondary Sales (₹)</th>
                              <th className="px-4 py-3 text-center w-[1%]">View</th>
                            </>
                          )}
                        </tr>
                      </thead>
                    <tbody>
                        {processedData.map((d, i) => (
                          <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                            <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                            
                            {selectType === 'User' ? (
                              <>
                                <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-300">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-200">{d.userName || d.employeeId}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-300">{d.stockistName || d.stockist}</td>
                                <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                                <td className="px-4 py-2 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                              </>
                            ) : selectType === 'Inventory' ? (
                                <>
                                  <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.stockistName || d.stockist}</td>
                                  <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                                  <td className="px-4 py-2 border-r border-[#3b3b5a] text-right font-medium text-slate-300">{Number(d.quantity || 0)}</td>
                                </>
                            ) : (
                              <>
                                {selectType === 'Stockist' && (
                                  <>
                                    <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.stockistName || d.stockist}</td>
                                    <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                                  </>
                                )}
                                {selectType === 'Headquarter' && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.headquarter}</td>}
                                
                                <td className="px-4 py-2 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                                <td className="px-4 py-2 text-center">
                                  <button onClick={() => openDetail(d)} className="text-sky-400 hover:text-sky-300 p-1 bg-sky-500/10 rounded">
                                    <Eye size={18} />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                        {processedData.length > 0 && !loading && (
                          <tr className="bg-[#151521] font-bold text-sky-400">
                            <td colSpan={selectType === 'User' ? 4 : selectType === 'Inventory' ? 3 : selectType === 'Stockist' ? 3 : 2} className="px-4 py-3 border-r border-[#3b3b5a] text-center border-t border-[#3b3b5a]">Total</td>
                            <td className="px-4 py-3 border-r border-[#3b3b5a] text-right border-t border-[#3b3b5a]">
                              {selectType === 'Inventory' 
                                ? processedData.reduce((sum, d) => sum + Number(d.quantity || 0), 0)
                                : processedData.reduce((sum, d) => sum + Number(d.totalSales || 0), 0).toFixed(2)}
                            </td>
                            {selectType !== 'Inventory' && selectType !== 'User' && <td className="px-4 py-3 border-t border-[#3b3b5a]"></td>}
                          </tr>
                        )}
                        {processedData.length === 0 && !loading && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">No records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#1e1e2d] border border-[#2d2d44] p-4 flex flex-wrap gap-6 items-center justify-between shadow-sm rounded-xl">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">SHOWING RESULTS FOR {detailLevel?.toUpperCase()}</p>
                <h3 className="text-xl font-black text-white">{detailLevel === 'Stockist' ? detailRow?.headquarter : detailRow?.stockist || detailRow?.stockistName}</h3>
              </div>
            </div>

            {/* Detail Data Table */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
              <div className="p-4 border-b border-[#2d2d44] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  SHOWING ({detailData.length}) ENTRIES
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                {detailLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading details...</div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a]">
                      <tr>
                        <th className="px-4 py-3 border-r border-[#3b3b5a] w-[1%]">Sr no.</th>
                        {detailLevel === 'Stockist' ? (
                          <>
                            <th className="px-4 py-3 border-r border-[#3b3b5a]">Stockist</th>
                            <th className="px-4 py-3 border-r border-[#3b3b5a]">Headquarter</th>
                            <th className="px-4 py-3 text-right">Total Secondary Sales (₹)</th>
                            <th className="px-4 py-3 text-center w-[1%]">View</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 border-r border-[#3b3b5a]">Product</th>
                            <th className="px-4 py-3 text-right">Total Secondary Sales (₹)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                          <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                          
                          {detailLevel === 'Stockist' ? (
                            <>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.stockistName || d.stockist}</td>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 text-center">
                                <button onClick={() => { setDetailLevel('Product'); setDetailRow(d); fetchDetailReport(d, 'Product'); }} className="text-sky-400 hover:text-sky-300 p-1 bg-sky-500/10 rounded">
                                  <Eye size={18} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.productName || d.product}</td>
                              <td className="px-4 py-2 text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                      {detailData.length > 0 && !detailLoading && (
                        <tr className="bg-[#151521] font-bold text-sky-400">
                          <td colSpan={detailLevel === 'Stockist' ? 3 : 2} className="px-4 py-3 border-r border-[#3b3b5a] text-center border-t border-[#3b3b5a]">Total</td>
                          {detailLevel === 'Product' && (
                            <td className="px-4 py-3 border-r border-[#3b3b5a] text-right border-t border-[#3b3b5a]">
                              {detailData.reduce((sum, d) => sum + Number(d.quantity || 0), 0)}
                            </td>
                          )}
                          <td className="px-4 py-3 border-r border-[#3b3b5a] text-right border-t border-[#3b3b5a]">
                            {detailData.reduce((sum, d) => sum + Number(d.totalSales || 0), 0).toFixed(2)}
                          </td>
                          {detailLevel === 'Stockist' && <td className="px-4 py-3 border-t border-[#3b3b5a]"></td>}
                        </tr>
                      )}
                      {detailData.length === 0 && !detailLoading && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">No details found.</td>
                        </tr>
                      )}
                    </tbody>
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
