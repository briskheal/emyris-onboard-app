import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Eye, ArrowLeft } from 'lucide-react';
import EmyrisDateRangePicker from '../components/EmyrisDateRangePicker';

export default function PrimarySalesReports() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | null>(new Date(2026, 8, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 8, 30));
  
  const [selectType, setSelectType] = useState('Stockist'); // Stockist, Headquarter, Date, User
  const [viewDateWise, setViewDateWise] = useState(false);
  
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
          dateWise: viewDateWise
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
    if (selectType === 'Stockist') return row.stockist;
    if (selectType === 'Headquarter') return row.headquarter;
    if (selectType === 'User') return row.userName || row.employeeId;
    if (selectType === 'Date') return row.date;
    return '';
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

            <div className="bg-[#1e1e2d] border border-[#2d2d44] p-4 flex flex-wrap gap-6 items-end shadow-sm rounded-xl">
              <div className="flex flex-col gap-2 flex-1 min-w-[200px] max-w-[300px]">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Type <span className="text-rose-500">*</span></label>
                <select value={selectType} onChange={e => setSelectType(e.target.value)} className="bg-[#151521] border border-[#3b3b5a] rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:border-sky-500 hover:border-sky-500 focus:outline-none w-full transition-colors h-[42px] cursor-pointer">
                  <option>Stockist</option>
                  <option>Headquarter</option>
                  <option>Date</option>
                  <option>User</option>
                </select>
              </div>

              <div className="flex items-center gap-2 h-[42px]">
                <span className="text-sm font-semibold text-slate-300">VIEW DATE WISE</span>
                <button 
                  onClick={() => setViewDateWise(!viewDateWise)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${viewDateWise ? 'bg-sky-500' : 'bg-[#3b3b5a]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${viewDateWise ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <button onClick={fetchReports} className="bg-[#1f84b6] hover:bg-sky-600 text-white font-medium px-6 h-[42px] rounded-lg transition-colors shadow-lg">
                See Reports
              </button>
            </div>

            {/* Main Data Table */}
            <div className="bg-[#1e1e2d] border border-[#2d2d44] shadow-sm overflow-hidden rounded-xl">
              <div className="p-4 border-b border-[#2d2d44] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  SHOWING ({data.length}) ENTRIES
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] font-bold uppercase bg-[#151521] text-slate-400 border-b border-[#3b3b5a]">
                      <tr>
                        <th className="px-4 py-3 border-r border-[#3b3b5a] w-[1%]">Sr no.</th>
                        {viewDateWise && <th className="px-4 py-3 border-r border-[#3b3b5a]">Date</th>}
                        {selectType === 'Stockist' && (
                          <>
                            <th className="px-4 py-3 border-r border-[#3b3b5a]">Stockist</th>
                            <th className="px-4 py-3 border-r border-[#3b3b5a]">Headquarter</th>
                          </>
                        )}
                        {selectType === 'Headquarter' && <th className="px-4 py-3 border-r border-[#3b3b5a]">Headquarter</th>}
                        {selectType === 'User' && <th className="px-4 py-3 border-r border-[#3b3b5a]">User</th>}
                        {selectType === 'Date' && !viewDateWise && <th className="px-4 py-3 border-r border-[#3b3b5a]">Date</th>}
                        <th className="px-4 py-3 border-r border-[#3b3b5a] text-right">Total Primary Sales (₹)</th>
                        <th className="px-4 py-3 text-center w-[1%]">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                          <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                          {viewDateWise && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-300">{d.date}</td>}
                          
                          {selectType === 'Stockist' && (
                            <>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.stockist}</td>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{d.headquarter}</td>
                            </>
                          )}
                          {selectType === 'Headquarter' && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.headquarter}</td>}
                          {selectType === 'User' && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.userName || d.employeeId}</td>}
                          {selectType === 'Date' && !viewDateWise && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-300">{d.date}</td>}
                          
                          <td className="px-4 py-2 border-r border-[#3b3b5a] text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => openDetail(d)} className="text-sky-400 hover:text-sky-300 p-1 bg-sky-500/10 rounded">
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {data.length === 0 && !loading && (
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
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">SHOWING RESULTS FOR {selectType.toUpperCase()}</p>
                <h3 className="text-xl font-black text-white">{getEntityName(detailRow)}</h3>
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
                        {detailViewDateWise && <th className="px-4 py-3 border-r border-[#3b3b5a]">Date</th>}
                        <th className="px-4 py-3 border-r border-[#3b3b5a]">Product</th>
                        {detailViewDateWise && (
                          <>
                            <th className="px-4 py-3 border-r border-[#3b3b5a] text-right">Quantity</th>
                            <th className="px-4 py-3 border-r border-[#3b3b5a] text-right">Average Price</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-right">Total {detailViewDateWise ? 'Sales' : 'Primary Sales'} (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((d, i) => (
                        <tr key={i} className="border-b border-[#2d2d44] hover:bg-[#252538] transition-colors">
                          <td className="px-4 py-2 border-r border-[#3b3b5a] text-slate-400">{i + 1}</td>
                          {detailViewDateWise && <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-300">{d.date}</td>}
                          <td className="px-4 py-2 border-r border-[#3b3b5a] font-medium text-slate-200">{d.product}</td>
                          {detailViewDateWise && (
                            <>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] text-right text-slate-300 font-semibold">{d.quantity}</td>
                              <td className="px-4 py-2 border-r border-[#3b3b5a] text-right text-slate-400">{Number(d.averagePrice || 0).toFixed(2)}</td>
                            </>
                          )}
                          <td className="px-4 py-2 text-right font-bold text-emerald-400">{Number(d.totalSales || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {detailData.length === 0 && !detailLoading && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">No products found.</td>
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
