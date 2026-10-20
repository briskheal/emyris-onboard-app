import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Info, Plus, Download, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function SampleManagement() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<'Samples' | 'Gifts'>('Samples');
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Allotment Modal State
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [allotForm, setAllotForm] = useState({
    employeeId: '',
    itemName: '',
    productId: '',
    allottedQty: '',
    batchNo: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // View Distribution Modal
  const [detailRow, setDetailRow] = useState<any | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          axios.get('/api/xl/admin/users'),
          axios.get('/api/xl/products')
        ]);
        const userList = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.users || uRes.data?.data || []);
        const activeUsers = userList.filter((u: any) => u.status !== 'Blocked');
        setUsers(activeUsers);
        if (activeUsers.length > 0) {
          const firstEmp = activeUsers[0].employeeId || activeUsers[0].uid || activeUsers[0]._id;
          setSelectedUserId(firstEmp);
          setAllotForm(prev => ({ ...prev, employeeId: firstEmp }));
        }
        const prodList = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.products || pRes.data?.data || []);
        setProducts(prodList);
      } catch (e) {
        console.error(e);
      }
    };
    loadInitial();
  }, []);

  const fetchReport = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      if (reportType === 'Samples') {
        const res = await axios.get('/api/xl/reports/samples', { params: { employeeId: selectedUserId } });
        if (res.data?.success) setRows(res.data.products || []);
      } else {
        const res = await axios.get('/api/xl/reports/gifts-management', { params: { employeeId: selectedUserId } });
        if (res.data?.success) setRows(res.data.gifts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) fetchReport();
  }, [selectedUserId, reportType]);

  const handleAllotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allotForm.employeeId || !allotForm.itemName || !allotForm.allottedQty) return;
    setSubmitting(true);
    try {
      const u = users.find(x => (x.employeeId || x.uid || x._id) === allotForm.employeeId);
      const empName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : allotForm.employeeId;

      if (reportType === 'Samples') {
        await axios.post('/api/xl/samples/allot', {
          employeeId: allotForm.employeeId,
          employeeName: empName,
          productId: allotForm.productId || allotForm.itemName,
          productName: allotForm.itemName,
          batchNo: allotForm.batchNo,
          allottedQty: Number(allotForm.allottedQty),
          remarks: allotForm.remarks
        });
      } else {
        await axios.post('/api/xl/gifts/allot', {
          employeeId: allotForm.employeeId,
          employeeName: empName,
          giftName: allotForm.itemName,
          allottedQty: Number(allotForm.allottedQty),
          remarks: allotForm.remarks
        });
      }
      setShowAllotModal(false);
      setAllotForm(prev => ({ ...prev, itemName: '', allottedQty: '', batchNo: '', remarks: '' }));
      fetchReport();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData = rows.map((r, i) => ({
      'Sr No.': i + 1,
      [reportType === 'Samples' ? 'Sample Name' : 'Gift Name']: r.productName || r.giftName,
      'Allotted Quantity': r.allotted || 0,
      'Distributed Quantity': r.distributed || 0,
      'Restored Quantity': r.restored || 0,
      'De-Allotted Quantity': r.deAllotted || 0,
      'Available Quantity': r.available || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), `${reportType}_Report`);
    XLSX.writeFile(wb, `${reportType}_Management_${selectedUserId}.xlsx`);
  };

  return (
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-24 md:pb-0 relative overflow-hidden">
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-4 px-5 pt-12 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-5 py-6 md:p-8 overflow-y-auto">
        {/* DESKTOP HEADER & BANNER */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="hidden md:flex p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                {reportType === 'Samples' ? 'Samples Management' : 'Gift & Promotional Inputs Management'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAllotForm(prev => ({ ...prev, employeeId: selectedUserId }));
                  setShowAllotModal(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
              >
                <Plus size={16} /> Allot {reportType === 'Samples' ? 'Sample' : 'Gift'}
              </button>
              <button
                onClick={handleExport}
                className="bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>

          <div className="bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-xl p-4 shadow-lg flex items-start gap-3">
            <Info className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-slate-300 leading-relaxed">
              Samples and Promotional Gifts allotted here are directly synchronized with the Field User's mobile XL Portal (<strong className="text-white">Utilities → Sample / Gift Management</strong>) and automatically reconciled against their Daily Call Reports (DCR).
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl">
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-1">Select Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Samples">Products Sample Report</option>
              <option value="Gifts">Promotional Gifts Report</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[250px] flex-1">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-1">Select User *</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              {users.map((u, idx) => {
                const empId = u.employeeId || u.uid || u._id;
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId;
                return (
                  <option key={idx} value={empId}>
                    {fullName} ({u.designation || 'MR'} - {u.hq || 'HQ'})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={fetchReport}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-8 py-3 font-bold shadow-lg shadow-sky-500/20 transition-colors h-[46px] flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> See Reports
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="flex flex-col flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Showing ({rows.length}) Entries</h3>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">Sr no.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                    {reportType === 'Samples' ? 'Sample Product' : 'Gift / Input Name'}
                  </th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">Allotted Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">Distributed Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">Restored Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">De-Allotted Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">Available Qty</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-sm text-slate-400 font-semibold">Loading inventory records...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-sm text-slate-400 font-semibold">No allotments or distributions found for this user. Click "Allot {reportType === 'Samples' ? 'Sample' : 'Gift'}" to assign stock.</td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm font-semibold text-slate-300 bg-slate-900/20">{idx + 1}</td>
                      <td className="p-4 text-sm font-bold text-white text-left">{r.productName || r.giftName}</td>
                      <td className="p-4 text-sm font-black text-sky-400">{r.allotted || 0}</td>
                      <td className="p-4 text-sm font-black text-amber-400">{r.distributed || 0}</td>
                      <td className="p-4 text-sm font-black text-indigo-400">{r.restored || 0}</td>
                      <td className="p-4 text-sm font-black text-rose-400">{r.deAllotted || 0}</td>
                      <td className="p-4 text-sm font-black text-emerald-400">{r.available || 0}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setDetailRow(r)}
                          className="text-slate-400 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10 inline-flex items-center justify-center"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Allot Sample/Gift Modal */}
      {showAllotModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-black text-white uppercase">Allot {reportType === 'Samples' ? 'Product Sample' : 'Promotional Gift'}</h3>
              <button onClick={() => setShowAllotModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAllotSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Employee *</label>
                <select
                  value={allotForm.employeeId}
                  onChange={e => setAllotForm({ ...allotForm, employeeId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                  required
                >
                  {users.map((u, i) => {
                    const empId = u.employeeId || u.uid || u._id;
                    return (
                      <option key={i} value={empId}>
                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || empId} ({u.hq || 'HQ'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {reportType === 'Samples' ? (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Select Sample Product *</label>
                  <select
                    value={allotForm.itemName}
                    onChange={e => {
                      const p = products.find(x => (x.productName || x.name) === e.target.value);
                      setAllotForm({ ...allotForm, itemName: e.target.value, productId: p?._id || p?.uid || '' });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p, i) => {
                      const pName = p.productName || p.name;
                      return <option key={i} value={pName}>{pName}</option>;
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Gift / Promotional Input Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Doctor Diary, Pen Stand, Apron..."
                    value={allotForm.itemName}
                    onChange={e => setAllotForm({ ...allotForm, itemName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Allotted Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={allotForm.allottedQty}
                    onChange={e => setAllotForm({ ...allotForm, allottedQty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Batch / Ref No.</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={allotForm.batchNo}
                    onChange={e => setAllotForm({ ...allotForm, batchNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional dispatch notes"
                  value={allotForm.remarks}
                  onChange={e => setAllotForm({ ...allotForm, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAllotModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold">
                  {submitting ? 'Saving...' : 'Save Allotment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribution Details Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase">
                Distribution Log: {detailRow.productName || detailRow.giftName}
              </h3>
              <button onClick={() => setDetailRow(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-2">
              {(detailRow.distributions || []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No field distributions recorded in DCR yet.</p>
              ) : (
                detailRow.distributions.map((d: any, i: number) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{d.entityName}</p>
                      <p className="text-xs text-slate-400">{d.entityType} • Date: {d.displayDate}</p>
                    </div>
                    <span className="text-sm font-black text-amber-400">{d.qty} Units</span>
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
