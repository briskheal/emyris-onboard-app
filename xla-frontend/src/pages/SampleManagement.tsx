import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Info, Plus, Download, X, RefreshCw, Package, Gift as GiftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CustomSelect from '../components/CustomSelect';

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
        const [uRes, pRes] = await Promise.allSettled([
          axios.get('/api/admin/users').catch(() => axios.get('/api/xl/admin/users')),
          axios.get('/api/xl/products').catch(() => axios.get('/api/xl/reports/products'))
        ]);

        let userList: any[] = [];
        if (uRes.status === 'fulfilled' && uRes.value) {
          const d = uRes.value.data;
          userList = Array.isArray(d) ? d : (d?.users || d?.data || []);
        }
        const activeUsers = userList.filter((u: any) => u.status !== 'Blocked' && u.status !== 'Deactivated');
        setUsers(activeUsers);
        if (activeUsers.length > 0) {
          const firstEmp = activeUsers[0].employeeId || activeUsers[0].uid || activeUsers[0]._id;
          setSelectedUserId(firstEmp);
          setAllotForm(prev => ({ ...prev, employeeId: firstEmp }));
        }

        let prodList: any[] = [];
        if (pRes.status === 'fulfilled' && pRes.value) {
          const pd = pRes.value.data;
          prodList = Array.isArray(pd) ? pd : (pd?.products || pd?.data || []);
        }
        setProducts(prodList);
      } catch (e) {
        console.error('Initial load error in SampleManagement:', e);
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
        if (res.data?.success) setRows(res.data.products || res.data.data || []);
      } else {
        const res = await axios.get('/api/xl/reports/gifts-management', { params: { employeeId: selectedUserId } });
        if (res.data?.success) setRows(res.data.gifts || res.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching sample/gift report:', e);
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
      alert('Error saving allotment');
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
    <div className="min-h-screen md:h-dvh bg-slate-900 flex flex-col text-slate-100 font-sans pb-16 md:pb-0 relative overflow-hidden">
      {/* Mobile Sticky Header */}
      <div className="md:hidden flex items-center gap-3 px-4 pt-8 pb-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-white active:scale-95 transition-transform flex items-center gap-1">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-black text-white tracking-tight leading-none">EMYRIS</h1>
          <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">Biolifesciences</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-4 py-3 md:px-6 md:py-4 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* DESKTOP HEADER & BANNER */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => navigate('/dashboard')} className="hidden md:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {reportType === 'Samples' ? <Package size={18} className="text-emerald-400" /> : <GiftIcon size={18} className="text-purple-400" />}
                {reportType === 'Samples' ? 'Samples Management' : 'Gift & Promotional Inputs Management'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAllotForm(prev => ({ ...prev, employeeId: selectedUserId }));
                  setShowAllotModal(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow shadow-emerald-500/20 transition-colors"
              >
                <Plus size={14} /> Allot {reportType === 'Samples' ? 'Sample' : 'Gift'}
              </button>
              <button
                onClick={handleExport}
                className="bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-3 shadow-sm flex items-start gap-2.5">
            <Info className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-slate-300 leading-relaxed">
              Samples and Promotional Gifts allotted here directly synchronize with the Field User's mobile XL Portal (<strong className="text-white">Utilities → Sample / Gift Management</strong>) and automatically reconcile against their Daily Call Reports (DCR).
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl shadow-lg items-end">
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider pl-0.5">Select Report Type</label>
            <CustomSelect
              options={[
                { value: 'Samples', label: 'Products Sample Report' },
                { value: 'Gifts', label: 'Promotional Gifts Report' }
              ]}
              value={reportType}
              onChange={(val) => setReportType(val as any)}
              placeholder="Select Report Type"
              compact={true}
            />
          </div>

          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider pl-0.5">Select User *</label>
            <CustomSelect
              options={users.map((u: any) => {
                const empId = u.employeeId || u.uid || u._id;
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId;
                return {
                  value: empId,
                  label: fullName,
                  subLabel: `${u.designation || 'MR'}${u.hq ? ` • ${u.hq}` : ''} (${empId})`,
                  showDefaultAvatar: true,
                  avatarUrl: u.profilePic
                };
              })}
              value={selectedUserId}
              onChange={(val) => {
                setSelectedUserId(val);
                setAllotForm(prev => ({ ...prev, employeeId: val }));
              }}
              placeholder="Select User"
              compact={true}
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={fetchReport}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-1.5 font-bold shadow shadow-sky-500/20 transition-colors h-[34px] flex items-center justify-center gap-1.5 text-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> See Reports
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex flex-col flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg relative min-h-[300px]">
          <div className="px-3.5 py-2 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Showing ({rows.length}) Entries</h3>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700/50">
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-14">Sr no.</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                    {reportType === 'Samples' ? 'Sample Product' : 'Gift / Input Name'}
                  </th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Allotted Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Distributed Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Restored Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">De-Allotted Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Available Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-xs text-slate-400 font-semibold">Loading inventory records...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-xs text-slate-400 font-semibold">
                      No allotments or distributions found for this user. Click "Allot {reportType === 'Samples' ? 'Sample' : 'Gift'}" to assign stock.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900/20">{idx + 1}</td>
                      <td className="py-2 px-3 text-xs font-bold text-white text-left">{r.productName || r.giftName}</td>
                      <td className="py-2 px-3 text-xs font-bold text-sky-400">{r.allotted || 0}</td>
                      <td className="py-2 px-3 text-xs font-bold text-amber-400">{r.distributed || 0}</td>
                      <td className="py-2 px-3 text-xs font-bold text-indigo-400">{r.restored || 0}</td>
                      <td className="py-2 px-3 text-xs font-bold text-rose-400">{r.deAllotted || 0}</td>
                      <td className="py-2 px-3 text-xs font-bold text-emerald-400">{r.available || 0}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setDetailRow(r)}
                          className="text-slate-400 hover:text-sky-400 transition-colors p-1 rounded hover:bg-sky-500/10 inline-flex items-center justify-center"
                          title="View distributions"
                        >
                          <Eye size={16} />
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase">Allot {reportType === 'Samples' ? 'Product Sample' : 'Promotional Gift'}</h3>
              <button onClick={() => setShowAllotModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAllotSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Employee *</label>
                <CustomSelect
                  options={users.map((u: any) => {
                    const empId = u.employeeId || u.uid || u._id;
                    return {
                      value: empId,
                      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || empId,
                      subLabel: `${u.designation || 'MR'}${u.hq ? ` • ${u.hq}` : ''} (${empId})`,
                      showDefaultAvatar: true,
                      avatarUrl: u.profilePic
                    };
                  })}
                  value={allotForm.employeeId}
                  onChange={(val) => setAllotForm(prev => ({ ...prev, employeeId: val }))}
                  placeholder="Select Employee"
                  compact={true}
                />
              </div>

              {reportType === 'Samples' ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Select Sample Product *</label>
                  <CustomSelect
                    options={products.map((p: any) => {
                      const pName = p.productName || p.name;
                      return {
                        value: pName,
                        label: pName,
                        subLabel: p.category || p.composition || ''
                      };
                    })}
                    value={allotForm.itemName}
                    onChange={(val) => {
                      const p = products.find(x => (x.productName || x.name) === val);
                      setAllotForm(prev => ({ ...prev, itemName: val, productId: p?._id || p?.uid || '' }));
                    }}
                    placeholder="Choose Product"
                    compact={true}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Gift / Promotional Input Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Doctor Diary, Pen Stand, Apron..."
                    value={allotForm.itemName}
                    onChange={e => setAllotForm({ ...allotForm, itemName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Allotted Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={allotForm.allottedQty}
                    onChange={e => setAllotForm({ ...allotForm, allottedQty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Batch / Ref No.</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={allotForm.batchNo}
                    onChange={e => setAllotForm({ ...allotForm, batchNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional dispatch notes"
                  value={allotForm.remarks}
                  onChange={e => setAllotForm({ ...allotForm, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAllotModal(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow shadow-emerald-500/20">
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase">
                Distribution Log: {detailRow.productName || detailRow.giftName}
              </h3>
              <button onClick={() => setDetailRow(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {(detailRow.distributions || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No field distributions recorded in DCR yet.</p>
              ) : (
                detailRow.distributions.map((d: any, i: number) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{d.entityName}</p>
                      <p className="text-[10px] text-slate-400">{d.entityType} • Date: {d.displayDate}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{d.qty} Units</span>
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
