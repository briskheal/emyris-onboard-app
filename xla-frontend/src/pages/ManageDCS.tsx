import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, ArrowUp, Download, MapPinOff,
  Stethoscope, Pill, Building2, UserCog, UploadCloud, ListChecks, PanelLeftClose, PanelLeftOpen,
  CheckCircle, XCircle, CalendarDays
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthlyCallPlanTab from '../components/MonthlyCallPlanTab';

const EditDeleteTabComponent = ({ doctors, chemists, stockists, hqs, states, fetchData, onEdit }: any) => {
  const checkHQMatch = (h1?: string, h2?: string) => {
    if (!h1 || !h2) return false;
    const c1 = h1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const c2 = h2.toLowerCase().replace(/[^a-z0-9]/g, '');
    return c1.includes(c2) || c2.includes(c1);
  };

  const [filterType, setFilterType] = useState('Chemist');
  const [filterHq, setFilterHq] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('xla_dcs_items_per_page');
    return saved ? Number(saved) : 20;
  });
  
  let displayList: any[] = [];
  if (filterType === 'Doctor') displayList = doctors;
  if (filterType === 'Chemist') displayList = chemists;
  if (filterType === 'Stockist') displayList = stockists;

  if (filterState) {
    const hqsInState = hqs.filter((h: any) => h.state === filterState).map((h: any) => h.hqName);
    displayList = displayList.filter(d => hqsInState.some((hq: string) => checkHQMatch(hq, d.headquarter)));
  }
  if (filterHq) displayList = displayList.filter(d => checkHQMatch(d.headquarter, filterHq));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayList = displayList.filter(d => 
      (d.name || d.businessName || '').toLowerCase().includes(q) ||
      (d.proprietorName || '').toLowerCase().includes(q) ||
      (d.address || '').toLowerCase().includes(q) ||
      (d.uid || '').toLowerCase().includes(q) ||
      (d.mobile || '').toLowerCase().includes(q) ||
        ((q === 'core') ? (d.category || '').toLowerCase().startsWith('core') : (d.category || '').toLowerCase().includes(q))
    );
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterHq, filterState, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(displayList.length / itemsPerPage));
  const paginatedList = displayList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginatedList.map(d => d._id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Delete this record?')) return;
    try {
      await axios.delete(`/api/admin/dcs/${filterType.toLowerCase()}s/${id}`);
      fetchData();
    } catch (e) { alert('Error deleting record'); }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return alert('Select records to delete');
    if(!window.confirm(`Delete ${selectedIds.length} records?`)) return;
    try {
      for (const id of selectedIds) {
        await axios.delete(`/api/admin/dcs/${filterType.toLowerCase()}s/${id}`);
      }
      setSelectedIds([]);
      fetchData();
    } catch (e) { alert('Error deleting records'); }
  };
  
  const exportToExcel = () => {
    if(displayList.length === 0) return alert('No data to export');
    const ws = XLSX.utils.json_to_sheet(displayList.map((d, i) => {
        if(filterType === 'Doctor') return { 'Sr no.': i+1, Name: d.name, Degree: d.degree, Specialization: d.specialization, Hospital: d.hospital, 'Visit Days': d.visitDays, Birthday: d.birthday, Anniversary: d.anniversary, Email: d.email, Mobile: d.mobile, 'Clinic Contact': d.clinicContact, Address: d.address, Category: d.category, Contact: d.contact, Headquarter: d.headquarter, 'Working Area': d.workingArea };
        if(filterType === 'Chemist') return { 'Sr no.': i+1, Name: d.proprietorName || d.name, 'Business Name': d.businessName, Certification: d.certifications, Birthday: d.birthday, Email: d.email, 'Chemist Contact': d.mobile, Address: d.address, City: d.city || '', 'Working Area': d.workingArea };
        if(filterType === 'Stockist') return { 'Sr no.': i+1, Name: d.name, 'Business Name': d.businessName, Certification: d.certifications, 'GST Number': d.gst, 'Drug License Number': d.drugLicense, 'Drug Expiry Number': d.drugExpiryDate || '', 'Establishment Date': d.establishmentDate || '', 'Stockist Contact': d.mobile, Address: d.address, City: d.city || '' };
      }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${filterType}s`);
    XLSX.writeFile(wb, `${filterType}_List.xlsx`);
  };

  const ThBase = ({ children, align = 'left', border = true }: { children: React.ReactNode, align?: 'left'|'center', border?: boolean }) => (
    <th className={`px-2 py-2 ${border ? 'border-r border-[#3b3b5a]' : ''} font-bold text-slate-300 text-xs whitespace-nowrap bg-[#252538] text-${align}`}>
      {children}
    </th>
  );

  const ThWithIcons = ({ label, sortable }: { label: string, sortable?: boolean }) => (
    <ThBase>
      <div className="flex items-center justify-center gap-2 w-full">
        <span className="flex-1 min-w-0 text-center">{label}</span>
        {sortable && <ArrowUp size={14} className="text-slate-500 shrink-0" />}
      </div>
    </ThBase>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#1e1e2d] relative z-10">
      
      {/* TOP TOOLBAR */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[#3b3b5a] bg-[#1e1e2d] shadow-sm relative z-20 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SELECT TYPE</label>
            <select value={filterType} onChange={e=>{setFilterType(e.target.value); setSelectedIds([]);}} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[32px]">
              <option value="Doctor">Doctor</option>
              <option value="Chemist">Chemist</option>
              <option value="Stockist">Stockist</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SELECT STATE</label>
            <select value={filterState} onChange={e=>setFilterState(e.target.value)} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[32px]">
              <option value="">All States</option>
              {states.map((s: any) => <option key={s._id} value={s.stateName}>{s.stateName}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SELECT HQ</label>
            <select value={filterHq} onChange={e=>setFilterHq(e.target.value)} className="w-full bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer h-[32px]">
              <option value="">All Headquarters</option>
              {hqs.filter((h: any) => !filterState || h.state === filterState).map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">SHOWING ({displayList.length}) ENTRIES</span>
          
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search by name, uid..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-900 border border-[#3b3b5a] rounded-lg px-2.5 py-1 text-xs text-white w-52 sm:w-60 focus:outline-none focus:border-sky-500 h-[32px]" />
            <button onClick={handleBatchDelete} className="text-rose-500 hover:text-rose-400 hover:scale-110 transition-all p-1" title="Delete Selected">
              <Trash2 size={18} className="fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* SPREADSHEET GRID (Free-flowing records) */}
      <div className="w-full overflow-x-auto bg-[#1e1e2d]">
        <table className="w-full min-w-max text-left border-collapse">
          <thead>
            <tr className="border-b border-[#3b3b5a]">
              <th className="p-2 border-r border-[#3b3b5a] text-center w-10 bg-[#252538]"><input type="checkbox" onChange={handleSelectAll} checked={paginatedList.length > 0 && selectedIds.length === paginatedList.length} className="cursor-pointer accent-sky-500" /></th>
              
              <ThBase align="center">Sr no.</ThBase>
              
              {filterType === 'Doctor' ? (
                <>
                  <ThWithIcons label="Doctor Name" sortable />
                  <ThWithIcons label="Degree" sortable />
                  <ThWithIcons label="Specialization" sortable />
                  <ThWithIcons label="Category" sortable />
                  <ThWithIcons label="Hospital" />
                  <ThWithIcons label="Visit Days" />
                </>
              ) : (
                <>
                  <ThWithIcons label="Business Name" sortable />
                  <ThWithIcons label="Propreitor Name" sortable />
                  <ThWithIcons label="Address" />
                </>
              )}
              
              <ThWithIcons label="Mobile Number" />
              <ThWithIcons label="HQ" sortable />
              <ThBase align="center" border={false}>Actions</ThBase>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr><td colSpan={10} className="py-8 text-center text-slate-500 font-medium">No records found.</td></tr>
            ) : paginatedList.map((d, i) => (
              <tr key={d._id} className="border-b border-[#3b3b5a]/40 hover:bg-[#252538] text-white text-xs transition-colors">
                <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-center"><input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => handleSelectOne(d._id)} className="cursor-pointer accent-sky-500" /></td>
                <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-center font-medium text-slate-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                
                {filterType === 'Doctor' ? (
                  <>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 font-bold">{d.name}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300">{d.degree || '-'}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300">{d.specialization || '-'}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-emerald-400 font-semibold">{d.category || '-'}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300 truncate max-w-[200px]">{d.hospital || '-'}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300">{d.visitDays || '-'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 font-bold text-sky-400">{d.businessName}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300">{d.proprietorName || d.name || '-'}</td>
                    <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 text-slate-300 max-w-[200px] break-words whitespace-normal leading-relaxed">{d.address || '-'}</td>
                  </>
                )}
                
                <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40">{d.mobile || d.contact || '-'}</td>
                <td className="px-2 py-1.5 border-r border-[#3b3b5a]/40 font-medium">{d.headquarter || '-'}</td>
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-2.5">
                    <button title="Edit Record" onClick={() => onEdit(d, filterType)} className="text-emerald-400 hover:text-emerald-300 hover:scale-110 transition-transform"><Edit2 size={14} /></button>
                    <button title="Reset GPS Locations" onClick={async () => {
                      if(!window.confirm('Erase all GPS location tags for this record? This allows the MR to re-tag them.')) return;
                      try {
                        await axios.put(`/api/admin/dcs/${filterType.toLowerCase()}s/${d._id}`, { lat1: null, lng1: null, geoAddress1: null, lat2: null, lng2: null, geoAddress2: null });
                        fetchData();
                        alert('GPS Locations reset successfully!');
                      } catch (e) { alert('Error resetting GPS'); }
                    }} className="text-amber-400 hover:text-amber-300 hover:scale-110 transition-transform"><MapPinOff size={14} /></button>
                    <button title="Delete Record" onClick={() => handleDelete(d._id)} className="text-rose-400 hover:text-rose-300 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM PAGINATION (Directly below the last record in normal document flow) */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252538] border-t border-[#3b3b5a] text-xs">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2.5 py-1 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
            &lt; Prev
          </button>
          <span className="text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2.5 py-1 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
            Next &gt;
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold px-3 py-1 rounded border border-[#3b3b5a] bg-[#1e1e2d] hover:bg-[#3b3b5a]/50 transition-colors">
            <Download size={14} /> Export
          </button>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Show</span>
            <select 
              value={itemsPerPage} 
              onChange={e => { 
                const val = Number(e.target.value);
                setItemsPerPage(val); 
                localStorage.setItem('xla_dcs_items_per_page', val.toString());
                setCurrentPage(1); 
              }} 
              className="bg-[#1e1e2d] border border-[#3b3b5a] rounded px-2 py-0.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              {[10, 15, 20, 25, 50, 100, 200, 500, 1000].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

    </div>
  );
};


export default function ManageDCS() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'create_doctor' | 'create_chemist' | 'create_stockist' | 'edit_delete' | 'monthly_call_plan' | 'upload_dcs' | 'dcs_list_management'>(
    location.state?.activeTab || 'create_doctor'
  );
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingType, setEditingType] = useState<string>('');

  // Approval review state
  const [approvalRecord, setApprovalRecord] = useState<any>(location.state?.approvalData || null);
  const [approvalType, setApprovalType] = useState<string>(location.state?.approvalType || 'Doctor');
  const [isApprovalMode, setIsApprovalMode] = useState<boolean>(!!location.state?.isApprovalView);

  useEffect(() => {
    if (location.state?.approvalData) {
      setApprovalRecord(location.state.approvalData);
      const type = location.state.approvalType || 'Doctor';
      setApprovalType(type);
      setIsApprovalMode(true);
      if (type === 'Doctor') setActiveTab('create_doctor');
      else if (type === 'Chemist') setActiveTab('create_chemist');
      else if (type === 'Stockist') setActiveTab('create_stockist');
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const approvalId = params.get('approvalId') || params.get('id');
    const typeParam = params.get('type') || 'Doctor';
    if (approvalId && !approvalRecord) {
      axios.get('/api/admin/dcs/doctors').then(res => {
        if (res.data?.success && res.data.doctors) {
          const found = res.data.doctors.find((d: any) => d._id === approvalId);
          if (found) {
            setApprovalRecord(found);
            setApprovalType(typeParam);
            setIsApprovalMode(true);
            setActiveTab('create_doctor');
          }
        }
      }).catch(() => {});
    }
  }, [location.search]);

  const menuItems = [
    { id: 'create_doctor', label: 'Create Doctors', icon: Stethoscope },
    { id: 'create_chemist', label: 'Create Chemists', icon: Pill },
    { id: 'create_stockist', label: 'Create Stockists', icon: Building2 },
    { id: 'edit_delete', label: 'Edit / Delete', icon: UserCog },
    { id: 'monthly_call_plan', label: 'Monthly Call Plan', icon: CalendarDays },
    { id: 'upload_dcs', label: 'Upload DCS City / Area', icon: UploadCloud },
    { id: 'dcs_list_management', label: 'DCS List Management', icon: ListChecks },
  ] as const;
  
  // Data
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  
  const [hqs, setHqs] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docRes, chemRes, stkRes, ctrlRes, hqRes, stateRes] = await Promise.all([
        axios.get('/api/admin/dcs/doctors'),
        axios.get('/api/admin/dcs/chemists'),
        axios.get('/api/admin/dcs/stockists'),
        axios.get('/api/admin/dcs/controls'),
        
        axios.get('/api/admin/locations/hqs'),
        axios.get('/api/admin/locations/states')
      ]);
      if(docRes.data.success) setDoctors(docRes.data.doctors);
      if(chemRes.data.success) setChemists(chemRes.data.chemists);
      if(stkRes.data.success) setStockists(stkRes.data.stockists);
      if(ctrlRes.data.success) setControls(ctrlRes.data.controls);
      
      if(hqRes.data.success) setHqs(hqRes.data.hqs);
      if(stateRes.data.success) setStates(stateRes.data.states);
    } catch (e) { console.error(e); }
  };

  const getControls = (type: string, hq?: string) => controls.filter(c => c.type === type && c.isActive !== false && (type !== 'Hospital' || !hq || !c.hq || c.hq.toLowerCase() === hq.toLowerCase()));

  // --- DOCTOR TAB ---
  const CreateDoctorTab = ({ 
    editData, 
    onCancel, 
    isApprovalView 
  }: { 
    editData?: any, 
    onCancel?: () => void,
    isApprovalView?: boolean
  }) => {
    const [formData, setFormData] = useState(editData || {
      name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '',
      mobile: '', clinicContact: '', email: '', category: '', userAllotted: '',
      headquarter: '', workingArea: '', address: '', extraInformation: '', visitDays: ''
    });

    useEffect(() => {
      if (editData) {
        setFormData({
          ...editData,
          name: editData.name || '',
          degree: editData.degree || '',
          specialization: editData.specialization || '',
          hospital: editData.hospital || '',
          birthday: editData.birthday || '',
          anniversary: editData.anniversary || '',
          mobile: editData.mobile || '',
          clinicContact: editData.clinicContact || '',
          email: editData.email || '',
          category: editData.category || '',
          userAllotted: editData.userAllotted || '',
          headquarter: editData.headquarter || '',
          workingArea: editData.workingArea || '',
          address: editData.address || '',
          extraInformation: editData.extraInformation || '',
          visitDays: editData.visitDays || '',
          uid: editData.uid || ''
        });
      }
    }, [editData]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(`/api/admin/dcs/doctors/${editData._id}`, formData);
          if(res.data.success) { 
            alert(isApprovalView ? 'Doctor details updated successfully' : 'Doctor updated successfully'); 
            fetchData(); 
            if(onCancel && !isApprovalView) onCancel(); 
          }
        } else {
          const res = await axios.post('/api/admin/dcs/doctors', formData);
          if(res.data.success) { 
            alert('Doctor added successfully'); 
            fetchData(); 
            setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: '', visitDays: ''}); 
          }
        }
      } catch (e: any) { 
        alert(editData ? 'Error updating doctor: ' + (e.response?.data?.message || e.message) : 'Error adding doctor'); 
      } finally { 
        setLoading(false); 
      }
    };

    const handleApprovalAction = async (action: 'Approved' | 'Rejected') => {
      if (!formData._id) return;
      
      if (action === 'Rejected') {
        const reason = window.prompt(`Are you sure you want to REJECT doctor "${formData.name}"? Enter rejection remarks (optional):`);
        if (reason === null) return;
        setLoading(true);
        try {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
          const res = await axios.post('/api/xl/approvals/action', {
            recordId: formData._id,
            type: 'Doctors',
            action: 'Rejected',
            remarks: reason || '',
            approvedBy: approver
          });
          if (res.data.success) {
            alert(`Doctor "${formData.name}" has been rejected.`);
            navigate('/admin/approvals');
          } else {
            alert(res.data.message || 'Failed to reject doctor');
          }
        } catch (err: any) {
          console.error(err);
          alert('Error rejecting doctor: ' + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
        return;
      }

      // If Approved:
      if (!window.confirm(`Are you sure you want to APPROVE doctor "${formData.name}"?`)) return;
      setLoading(true);
      try {
        // First save any modifications the admin made in the form
        await axios.put(`/api/admin/dcs/doctors/${formData._id}`, formData);

        // Execute approval action
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
        const res = await axios.post('/api/xl/approvals/action', {
          recordId: formData._id,
          type: 'Doctors',
          action: 'Approved',
          approvedBy: approver
        });

        if (res.data.success) {
          alert(`Doctor "${formData.name}" approved successfully!`);
          navigate('/admin/approvals');
        } else {
          alert(res.data.message || 'Failed to approve doctor');
        }
      } catch (err: any) {
        console.error(err);
        alert('Error approving doctor: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex-1 min-w-0 overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">
              {isApprovalView ? `REVIEW PENDING DOCTOR: ${formData.name || 'NEW'}` : (editData ? `EDIT DOCTOR: ${editData.name}` : 'CREATE DOCTOR...')}
            </h2>
            {isApprovalView && (
              <p className="text-xs text-amber-400 mt-1 font-semibold">
                Review and modify any doctor details below, then click Approve or Reject.
              </p>
            )}
          </div>
          <button type="button" onClick={() => navigate('/extras/settings?tab=doctor_controls')} className="text-sky-400 text-sm font-bold hover:underline">Do you want to add more Degrees and Specializations?</button>
        </div>

        {isApprovalView && (
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Stethoscope size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm uppercase">Doctor Approval Review</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {formData.status || 'Pending Approval'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Submitted by: <strong className="text-sky-300">{formData.employeeName || formData.employeeId || 'MR'}</strong>
                  {formData.createdAt ? ` • Submitted on: ${new Date(formData.createdAt).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
            {(formData.lat1 || formData.lng1 || formData.geoAddress1) && (
              <div className="flex items-center gap-2 text-xs bg-[#151521] px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-emerald-400 font-bold">📍 Tagged GPS:</span>
                <span className="text-slate-300 font-mono">{formData.lat1 ?? '-'}, {formData.lng1 ?? '-'}</span>
                {formData.geoAddress1 && <span className="text-slate-400 truncate max-w-xs">({formData.geoAddress1})</span>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">NAME *</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Doctor's Name" /></div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">DEGREE *</label>
              <select required value={formData.degree} onChange={e=>setFormData({...formData, degree: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Degree</option>
                {(() => {
                  const opts = getControls('Degree', formData.headquarter);
                  if (formData.degree && !opts.find(o => o.name === formData.degree)) {
                    opts.push({ _id: 'temp_deg', name: formData.degree, type: 'Degree' });
                  }
                  return opts.map(c => <option key={c._id} value={c.name}>{c.name}</option>);
                })()}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">SPECIALIZATION *</label>
              <select required value={formData.specialization} onChange={e=>setFormData({...formData, specialization: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Specialization</option>
                {(() => {
                  const opts = getControls('Specialization', formData.headquarter);
                  if (formData.specialization && !opts.find(o => o.name === formData.specialization)) {
                    opts.push({ _id: 'temp_spec', name: formData.specialization, type: 'Specialization' });
                  }
                  return opts.map(c => <option key={c._id} value={c.name}>{c.name}</option>);
                })()}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">HOSPITAL</label>
              <input 
                list="hospital-options"
                value={formData.hospital} 
                onChange={e=>setFormData({...formData, hospital: e.target.value})} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"
                placeholder="Search or enter hospital..."
              />
              <datalist id="hospital-options">
                {getControls('Hospital', formData.headquarter).map(c => <option key={c._id} value={c.name} />)}
              </datalist>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 font-bold mb-1 block">DAYS OF VISIT</label>
              <div className="flex gap-2">
                {[
                  { k: 'M', d: 'M' }, { k: 'Tu', d: 'T' }, { k: 'W', d: 'W' },
                  { k: 'Th', d: 'T' }, { k: 'F', d: 'F' }, { k: 'Sa', d: 'S' },
                  { k: 'ALL', d: 'ALL' }
                ].map(item => {
                  const currentDays = formData.visitDays ? formData.visitDays.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                  const isSelected = item.k === 'ALL' 
                    ? currentDays.length === 6 || (formData.visitDays && formData.visitDays.toUpperCase() === 'ALL')
                    : currentDays.includes(item.k);
                    
                  const toggle = () => {
                    if (item.k === 'ALL') {
                      setFormData({...formData, visitDays: (currentDays.length === 6 || formData.visitDays?.toUpperCase() === 'ALL') ? '' : 'M,Tu,W,Th,F,Sa'});
                    } else {
                      let next = new Set(currentDays);
                      if (next.has(item.k)) next.delete(item.k);
                      else next.add(item.k);
                      setFormData({...formData, visitDays: Array.from(next).join(',')});
                    }
                  };

                  return (
                    <button
                      type="button"
                      key={item.k}
                      onClick={toggle}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${isSelected ? 'bg-green-500 text-white' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'}`}
                    >
                      {item.d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BIRTHDAY</label><input type="date" value={formData.birthday} onChange={e=>setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MARRIAGE ANNIVERSARY</label><input type="date" value={formData.anniversary} onChange={e=>setFormData({...formData, anniversary: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">MOBILE NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Mobile Number" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CLINICS CONTACT NUMBER</label><input value={formData.clinicContact} onChange={e=>setFormData({...formData, clinicContact: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Alternate Number" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="text" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">CATEGORY *</label>
              <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Category</option>
                {(() => {
                  const opts = getControls('Category', formData.headquarter);
                  if (formData.category && !opts.find(o => o.name === formData.category)) {
                    opts.push({ _id: 'temp_cat', name: formData.category, type: 'Category' });
                  }
                  return opts.map(c => <option key={c._id} value={c.name}>{c.name}</option>);
                })()}
              </select>
            </div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CLINICS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SYSTEM UID</label><input disabled value={formData.uid || 'Auto-generated'} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-500 cursor-not-allowed" /></div>

            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          {isApprovalView ? (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Approved')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <CheckCircle size={18} strokeWidth={2.5} /> Approve Doctor
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Rejected')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <XCircle size={18} strokeWidth={2.5} /> Reject Doctor
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Save Changes Only
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Back to Approvals
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">{editData ? 'Update Doctor' : 'Add Doctor'}</button>
              {editData && <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Cancel Edit</button>}
            </div>
          )}
        </form>
      </div>
    );
  };

  // --- CHEMIST TAB ---
  const CreateChemistTab = ({ 
    editData, 
    onCancel,
    isApprovalView
  }: { 
    editData?: any, 
    onCancel?: () => void,
    isApprovalView?: boolean
  }) => {
    const [formData, setFormData] = useState(editData || {
      businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '',
      userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''
    });

    useEffect(() => {
      if (editData) {
        setFormData({
          ...editData,
          businessName: editData.businessName || '',
          proprietorName: editData.proprietorName || '',
          certifications: editData.certifications || '',
          birthday: editData.birthday || '',
          email: editData.email || '',
          mobile: editData.mobile || '',
          userAllotted: editData.userAllotted || '',
          address: editData.address || '',
          headquarter: editData.headquarter || '',
          workingArea: editData.workingArea || '',
          extraInformation: editData.extraInformation || ''
        });
      }
    }, [editData]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(`/api/admin/dcs/chemists/${editData._id}`, formData);
          if(res.data.success) { 
            alert(isApprovalView ? 'Chemist details updated successfully' : 'Chemist updated successfully'); 
            fetchData(); 
            if(onCancel && !isApprovalView) onCancel(); 
          }
        } else {
          const res = await axios.post('/api/admin/dcs/chemists', formData);
          if(res.data.success) { 
            alert('Chemist added successfully'); 
            fetchData(); 
            setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: '', visitDays: ''}); 
          }
        }
      } catch (e: any) { alert(editData ? 'Error updating chemist: ' + (e.response?.data?.message || e.message) : 'Error adding chemist'); } finally { setLoading(false); }
    };

    const handleApprovalAction = async (action: 'Approved' | 'Rejected') => {
      if (!formData._id) return;
      if (action === 'Rejected') {
        const reason = window.prompt(`Are you sure you want to REJECT chemist "${formData.businessName}"? Enter rejection remarks (optional):`);
        if (reason === null) return;
        setLoading(true);
        try {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
          const res = await axios.post('/api/xl/approvals/action', {
            recordId: formData._id,
            type: 'Chemists',
            action: 'Rejected',
            remarks: reason || '',
            approvedBy: approver
          });
          if (res.data.success) {
            alert(`Chemist "${formData.businessName}" has been rejected.`);
            navigate('/admin/approvals');
          } else {
            alert(res.data.message || 'Failed to reject chemist');
          }
        } catch (err: any) {
          console.error(err);
          alert('Error rejecting chemist: ' + (err.response?.data?.message || err.message));
        } finally { setLoading(false); }
        return;
      }

      if (!window.confirm(`Are you sure you want to APPROVE chemist "${formData.businessName}"?`)) return;
      setLoading(true);
      try {
        await axios.put(`/api/admin/dcs/chemists/${formData._id}`, formData);
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
        const res = await axios.post('/api/xl/approvals/action', {
          recordId: formData._id,
          type: 'Chemists',
          action: 'Approved',
          approvedBy: approver
        });
        if (res.data.success) {
          alert(`Chemist "${formData.businessName}" approved successfully!`);
          navigate('/admin/approvals');
        } else {
          alert(res.data.message || 'Failed to approve chemist');
        }
      } catch (err: any) {
        console.error(err);
        alert('Error approving chemist: ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };

    return (
      <div className="flex-1 min-w-0 overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">
              {isApprovalView ? `REVIEW PENDING CHEMIST: ${formData.businessName || 'NEW'}` : (editData ? `EDIT CHEMIST: ${editData.businessName}` : 'CREATE CHEMIST')}
            </h2>
            {isApprovalView && (
              <p className="text-xs text-amber-400 mt-1 font-semibold">
                Review and modify chemist details below, then click Approve or Reject.
              </p>
            )}
          </div>
        </div>

        {isApprovalView && (
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Pill size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm uppercase">Chemist Approval Review</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {formData.status || 'Pending Approval'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Submitted by: <strong className="text-sky-300">{formData.employeeName || formData.employeeId || 'MR'}</strong>
                  {formData.createdAt ? ` • Submitted on: ${new Date(formData.createdAt).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
            {(formData.lat1 || formData.lng1 || formData.geoAddress1) && (
              <div className="flex items-center gap-2 text-xs bg-[#151521] px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-emerald-400 font-bold">📍 Tagged GPS:</span>
                <span className="text-slate-300 font-mono">{formData.lat1 ?? '-'}, {formData.lng1 ?? '-'}</span>
                {formData.geoAddress1 && <span className="text-slate-400 truncate max-w-xs">({formData.geoAddress1})</span>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BUSINESS NAME *</label><input required value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Chemist's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">PROPRIETOR NAME</label><input value={formData.proprietorName} onChange={e=>setFormData({...formData, proprietorName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Proprietor's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CERTIFICATIONS/TRADEMARKS</label><input value={formData.certifications} onChange={e=>setFormData({...formData, certifications: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Certification" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BIRTHDAY</label><input type="date" value={formData.birthday} onChange={e=>setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="text" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CHEMISTS CONTACT NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Number" /></div>
            
            <div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">CHEMISTS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            
            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          {isApprovalView ? (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Approved')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <CheckCircle size={18} strokeWidth={2.5} /> Approve Chemist
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Rejected')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <XCircle size={18} strokeWidth={2.5} /> Reject Chemist
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Save Changes Only
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Back to Approvals
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">{editData ? 'Update Chemist' : 'Add Chemist'}</button>
              {editData && <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Cancel Edit</button>}
            </div>
          )}
        </form>
      </div>
    );
  };

  // --- STOCKIST TAB ---
  const CreateStockistTab = ({ 
    editData, 
    onCancel,
    isApprovalView
  }: { 
    editData?: any, 
    onCancel?: () => void,
    isApprovalView?: boolean
  }) => {
    const [formData, setFormData] = useState(editData || {
      businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '',
      userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''
    });

    useEffect(() => {
      if (editData) {
        setFormData({
          ...editData,
          businessName: editData.businessName || '',
          name: editData.name || '',
          certifications: editData.certifications || '',
          email: editData.email || '',
          gst: editData.gst || '',
          drugLicense: editData.drugLicense || '',
          drugExpiryDate: editData.drugExpiryDate || '',
          establishmentDate: editData.establishmentDate || '',
          mobile: editData.mobile || '',
          userAllotted: editData.userAllotted || '',
          address: editData.address || '',
          headquarter: editData.headquarter || '',
          workingArea: editData.workingArea || '',
          extraInformation: editData.extraInformation || ''
        });
      }
    }, [editData]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(`/api/admin/dcs/stockists/${editData._id}`, formData);
          if(res.data.success) { 
            alert(isApprovalView ? 'Stockist details updated successfully' : 'Stockist updated successfully'); 
            fetchData(); 
            if(onCancel && !isApprovalView) onCancel(); 
          }
        } else {
          const res = await axios.post('/api/admin/dcs/stockists', formData);
          if(res.data.success) { 
            alert('Stockist added successfully'); 
            fetchData(); 
            setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: '', visitDays: ''}); 
          }
        }
      } catch (e: any) { alert(editData ? 'Error updating stockist: ' + (e.response?.data?.message || e.message) : 'Error adding stockist'); } finally { setLoading(false); }
    };

    const handleApprovalAction = async (action: 'Approved' | 'Rejected') => {
      if (!formData._id) return;
      if (action === 'Rejected') {
        const reason = window.prompt(`Are you sure you want to REJECT stockist "${formData.businessName}"? Enter rejection remarks (optional):`);
        if (reason === null) return;
        setLoading(true);
        try {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
          const res = await axios.post('/api/xl/approvals/action', {
            recordId: formData._id,
            type: 'Stockists',
            action: 'Rejected',
            remarks: reason || '',
            approvedBy: approver
          });
          if (res.data.success) {
            alert(`Stockist "${formData.businessName}" has been rejected.`);
            navigate('/admin/approvals');
          } else {
            alert(res.data.message || 'Failed to reject stockist');
          }
        } catch (err: any) {
          console.error(err);
          alert('Error rejecting stockist: ' + (err.response?.data?.message || err.message));
        } finally { setLoading(false); }
        return;
      }

      if (!window.confirm(`Are you sure you want to APPROVE stockist "${formData.businessName}"?`)) return;
      setLoading(true);
      try {
        await axios.put(`/api/admin/dcs/stockists/${formData._id}`, formData);
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const approver = userObj.employeeId || userObj.uid || userObj.name || 'Admin';
        const res = await axios.post('/api/xl/approvals/action', {
          recordId: formData._id,
          type: 'Stockists',
          action: 'Approved',
          approvedBy: approver
        });
        if (res.data.success) {
          alert(`Stockist "${formData.businessName}" approved successfully!`);
          navigate('/admin/approvals');
        } else {
          alert(res.data.message || 'Failed to approve stockist');
        }
      } catch (err: any) {
        console.error(err);
        alert('Error approving stockist: ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };

    return (
      <div className="flex-1 min-w-0 overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">
              {isApprovalView ? `REVIEW PENDING STOCKIST: ${formData.businessName || 'NEW'}` : (editData ? `EDIT STOCKIST: ${editData.businessName}` : 'CREATE STOCKIST')}
            </h2>
            {isApprovalView && (
              <p className="text-xs text-amber-400 mt-1 font-semibold">
                Review and modify stockist details below, then click Approve or Reject.
              </p>
            )}
          </div>
        </div>

        {isApprovalView && (
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm uppercase">Stockist Approval Review</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {formData.status || 'Pending Approval'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Submitted by: <strong className="text-sky-300">{formData.employeeName || formData.employeeId || 'MR'}</strong>
                  {formData.createdAt ? ` • Submitted on: ${new Date(formData.createdAt).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
            {(formData.lat1 || formData.lng1 || formData.geoAddress1) && (
              <div className="flex items-center gap-2 text-xs bg-[#151521] px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-emerald-400 font-bold">📍 Tagged GPS:</span>
                <span className="text-slate-300 font-mono">{formData.lat1 ?? '-'}, {formData.lng1 ?? '-'}</span>
                {formData.geoAddress1 && <span className="text-slate-400 truncate max-w-xs">({formData.geoAddress1})</span>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">BUSINESS NAME *</label><input required value={formData.businessName} onChange={e=>setFormData({...formData, businessName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Stockist's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">NAME</label><input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Proprietor's Name" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">CERTIFICATIONS/TRADEMARKS</label><input value={formData.certifications} onChange={e=>setFormData({...formData, certifications: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Certification" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">EMAIL</label><input type="text" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Email Address" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">GST NUMBER *</label><input required value={formData.gst} onChange={e=>setFormData({...formData, gst: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter GST" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DRUG LICENSE NUMBER *</label><input required value={formData.drugLicense} onChange={e=>setFormData({...formData, drugLicense: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter DL" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">DRUG EXPIRY DATE</label><input type="date" value={formData.drugExpiryDate} onChange={e=>setFormData({...formData, drugExpiryDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">ESTABLISHMENT DATE</label><input type="date" value={formData.establishmentDate} onChange={e=>setFormData({...formData, establishmentDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" /></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">STOCKISTS CONTACT NUMBER *</label><input required value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Number" /></div>
            
            <div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">STOCKISTS ADDRESS</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Clinic Address" /></div>
            
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT HQ *</label><select required value={formData.headquarter} onChange={e=>setFormData({...formData, headquarter: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white"><option value="">Select Headquarter</option>{hqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}</select></div>
            <div><label className="text-xs text-slate-400 font-bold mb-1 block">SELECT WORKING AREA *</label><input required value={formData.workingArea} onChange={e=>setFormData({...formData, workingArea: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white" placeholder="Enter Working Area" /></div>
            
            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">EXTRA INFORMATION</label><textarea value={formData.extraInformation} onChange={e=>setFormData({...formData, extraInformation: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24" placeholder="Enter Extra Information" /></div>
          </div>
          {isApprovalView ? (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Approved')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <CheckCircle size={18} strokeWidth={2.5} /> Approve Stockist
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprovalAction('Rejected')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                <XCircle size={18} strokeWidth={2.5} /> Reject Stockist
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Save Changes Only
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/approvals')}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Back to Approvals
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">{editData ? 'Update Stockist' : 'Add Stockist'}</button>
              {editData && <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">Cancel Edit</button>}
            </div>
          )}
        </form>
      </div>
    );
  };

  // --- EDIT / DELETE TAB ---
  
  // --- UPLOAD DCS TAB ---
  const UploadDCSTab = () => {
    const [uploadType, setUploadType] = useState('Doctor');
    const [uploadHq, setUploadHq] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const handleUpload = async () => {
      if (!uploadHq) return alert('Please select a Headquarter.');
      if (!uploadFile) return alert('Please select an Excel file.');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('hq', uploadHq);
      
      setLoading(true);
      try {
        const res = await axios.post('/api/admin/dcs/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          alert('Upload successful!');
          fetchData();
        } else {
          alert('Upload failed: ' + res.data.message);
        }
      } catch (e: any) {
        alert('Error uploading file: ' + (e.response?.data?.message || e.message));
      } finally {
        setLoading(false);
      }
    };

    const handleDownloadFormat = async () => {
      const { utils, writeFile } = await import('xlsx');
      let headers: string[] = [];
      let filename = '';

      if (uploadType === 'Doctor') {
        headers = ['Sr no.', 'Name', 'Degree', 'Specialization', 'Hospital', 'Visit Days', 'Birthday', 'Anniversary', 'Email', 'Mobile', 'Clinic Contact', 'Address', 'Category', 'Contact', 'Headquarter', 'Working Area'];
        filename = 'doctor_upload_format.xlsx';
      } else if (uploadType === 'Chemist') {
        headers = ['Sr no.', 'Name', 'Business Name', 'Certification', 'Birthday', 'Email', 'Chemist Contact', 'Address', 'City', 'Working Area'];
        filename = 'chemist_upload_format.xlsx';
      } else if (uploadType === 'Stockist') {
        headers = ['Sr no.', 'Name', 'Business Name', 'Certification', 'GST Number', 'Drug License Number', 'Drug Expiry Number', 'Establishment Date', 'Stockist Contact', 'Address', 'City'];
        filename = 'stockist_upload_format.xlsx';
      } else if (uploadType === 'CityOrArea') {
        alert('CityOrArea bulk upload is currently under development on the backend.');
        return;
      }

      const ws = utils.aoa_to_sheet([headers]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');
      writeFile(wb, filename);
    };

    return (
      <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">
        <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">UPLOAD DOCTOR / CHEMIST / STOCKIST / CITY OR AREA</h2>
        
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl p-8 mb-8">
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-4xl bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            The UID is a system-generated unique identifier assigned to each entity (for example, DOC1, HOS1, CTY1). These UIDs are automatically created by the system and are used to uniquely identify records. You can find the UID for a specific entity in its corresponding list or management section within the system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">SELECT TYPE *</label>
              <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="Doctor">Doctor</option>
                <option value="Chemist">Chemist</option>
                <option value="Stockist">Stockist</option>
                <option value="CityOrArea">CityOrArea</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">SELECT HQ *</label>
              <select value={uploadHq} onChange={e => setUploadHq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white">
                <option value="">Select Headquarter</option>
                {hqs.map((h: any) => <option key={h._id} value={h.hqName}>{h.hqName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-2 block">UPLOAD EXCEL *</label>
              <input type="file" accept=".xlsx,.csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30" />
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <button onClick={handleUpload} disabled={loading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"><Upload size={20}/> Upload List</button>
            <button onClick={handleDownloadFormat} className="text-emerald-400 font-semibold text-sm hover:underline border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/10 transition-colors">Download Format</button>
          </div>
        </div>
      </div>
    );
  };

  // --- DCS LIST MANAGEMENT TAB ---
  const ListManagementTab = () => {
    const [subTab, setSubTab] = useState('');
    
    if(!subTab) return (
      <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">
        <h2 className="text-lg font-bold text-white mb-8 tracking-wide uppercase">DOC / CHEM / STK LIST MANAGEMENT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button onClick={()=>setSubTab('allot')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-sky-500/20 rounded-full flex items-center justify-center transition-colors"><Users size={32} className="text-white group-hover:text-sky-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">ALLOT DCS</h3>
          </button>
          <button onClick={()=>setSubTab('deallot')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-rose-500/20 rounded-full flex items-center justify-center transition-colors"><UserMinus size={32} className="text-white group-hover:text-rose-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">DE-ALLOT DCS</h3>
          </button>
          <button onClick={()=>setSubTab('transfer')} className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group">
            <div className="w-20 h-20 bg-slate-700 group-hover:bg-emerald-500/20 rounded-full flex items-center justify-center transition-colors"><ArrowRightLeft size={32} className="text-white group-hover:text-emerald-400" /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">TRANSFER DCS</h3>
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex-1 min-w-0 overflow-auto p-8 relative z-10">
        <button onClick={()=>setSubTab('')} className="text-sky-400 font-bold mb-8 hover:underline">Back To Management</button>
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
          <p className="text-slate-400 mb-6">List assignment workflows (Allot, De-allot, Transfer) interface placeholder.</p>
          <div className="flex justify-center gap-6 opacity-50 pointer-events-none">
            <select className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white w-64"><option>Select Source User...</option></select>
            <select className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white w-64"><option>Select Target User...</option></select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex-1 flex flex-col font-sans text-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 sticky top-0 z-20 flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button onClick={() => navigate(isApprovalMode ? '/admin/approvals' : '/admin')} className="text-white hover:text-sky-400 transition-colors flex items-center gap-2">
            <ArrowLeft size={18} /> <span className="font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase">{isApprovalMode ? 'Back to Approvals' : 'Back to Admin Menu'}</span>
          </button>
          
          <span className="text-slate-600 font-bold">/</span>
          
          <span className="text-sky-400 font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase">
            {activeTab === 'edit_delete' ? 'Edit / Delete' : (menuItems.find(m => m.id === activeTab)?.label || 'Manage DCS')}
          </span>
        </div>

        {activeTab === 'edit_delete' && !editingRecord && (
          <div className="flex items-center gap-2 border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Deleting a DCS from here will also remove it from the list.</span>
          </div>
        )}

        {isApprovalMode && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
              Approvals Mode: Reviewing Pending {approvalType}
            </span>
            <button
              onClick={() => {
                setIsApprovalMode(false);
                setApprovalRecord(null);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Exit Review Mode
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Menu */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-slate-800/60 border-r border-slate-800 flex flex-col py-4 overflow-y-auto transition-all duration-200 flex-shrink-0`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-1' : 'justify-between px-3.5'} mb-3`}>
            {!sidebarCollapsed && (
              <h2 className="text-white font-bold text-base tracking-wide truncate" style={{ fontSize: 'var(--menu-heading-size, 16px)' }}>
                Manage DCS
              </h2>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu to Free Space"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className="flex flex-col space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isApprovalMode) {
                      if (item.id === 'create_doctor' && approvalType !== 'Doctor') {
                        setIsApprovalMode(false);
                        setApprovalRecord(null);
                      } else if (item.id === 'create_chemist' && approvalType !== 'Chemist') {
                        setIsApprovalMode(false);
                        setApprovalRecord(null);
                      } else if (item.id === 'create_stockist' && approvalType !== 'Stockist') {
                        setIsApprovalMode(false);
                        setApprovalRecord(null);
                      } else if (!['create_doctor', 'create_chemist', 'create_stockist'].includes(item.id)) {
                        setIsApprovalMode(false);
                        setApprovalRecord(null);
                      }
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-xs font-medium ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'text-left'
                  } ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 font-bold border-l-2 border-sky-400 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right Content Area */}
        <div className={`flex-1 min-w-0 bg-slate-900 ${(activeTab === 'edit_delete' && !editingRecord) || activeTab === 'monthly_call_plan' ? 'p-0 flex flex-col overflow-y-auto' : 'p-4 md:p-6 overflow-y-auto'}`}>
      
      {activeTab === 'create_doctor' && (
        <CreateDoctorTab 
          editData={isApprovalMode && approvalType === 'Doctor' ? approvalRecord : undefined}
          isApprovalView={isApprovalMode && approvalType === 'Doctor'}
          onCancel={() => {
            if (isApprovalMode) {
              setIsApprovalMode(false);
              setApprovalRecord(null);
              navigate('/admin/approvals');
            }
          }}
        />
      )}
      {activeTab === 'create_chemist' && (
        <CreateChemistTab 
          editData={isApprovalMode && approvalType === 'Chemist' ? approvalRecord : undefined}
          isApprovalView={isApprovalMode && approvalType === 'Chemist'}
          onCancel={() => {
            if (isApprovalMode) {
              setIsApprovalMode(false);
              setApprovalRecord(null);
              navigate('/admin/approvals');
            }
          }}
        />
      )}
      {activeTab === 'create_stockist' && (
        <CreateStockistTab 
          editData={isApprovalMode && approvalType === 'Stockist' ? approvalRecord : undefined}
          isApprovalView={isApprovalMode && approvalType === 'Stockist'}
          onCancel={() => {
            if (isApprovalMode) {
              setIsApprovalMode(false);
              setApprovalRecord(null);
              navigate('/admin/approvals');
            }
          }}
        />
      )}
      {activeTab === 'edit_delete' && !editingRecord && (
        <div className="flex-1 min-w-0 flex flex-col">
          <EditDeleteTabComponent onEdit={(record: any, type: string) => { setEditingRecord(record); setEditingType(type); }} doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} fetchData={fetchData} />
        </div>
      )}
      {activeTab === 'edit_delete' && editingRecord && editingType === 'Doctor' && <CreateDoctorTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}
      {activeTab === 'edit_delete' && editingRecord && editingType === 'Chemist' && <CreateChemistTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}
      {activeTab === 'edit_delete' && editingRecord && editingType === 'Stockist' && <CreateStockistTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}
      {activeTab === 'upload_dcs' && <UploadDCSTab />}
      {activeTab === 'dcs_list_management' && <ListManagementTab />}
      {activeTab === 'monthly_call_plan' && <MonthlyCallPlanTab hqs={hqs} />}
        </div>
      </div>
    </div>
  );
}


















