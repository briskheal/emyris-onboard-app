import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, ArrowUp, Download, MapPinOff,
  Stethoscope, Pill, Building2, UserCog, UploadCloud, ListChecks, PanelLeftClose, PanelLeftOpen,
  CheckCircle, XCircle, CalendarDays, Search, Check, RefreshCw, MapPin
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthlyCallPlanTab from '../components/MonthlyCallPlanTab';
import CustomUserSelect from '../components/CustomUserSelect';
import CustomHqSelect from '../components/CustomHqSelect';

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
  
  const exportToExcel = async () => {
    if (displayList.length === 0) return alert('No data to export');
    try {
      const response = await axios.get(`/api/admin/dcs/export-excel?type=${filterType}&hq=${encodeURIComponent(filterHq || '')}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filterType}_List.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const ws = XLSX.utils.json_to_sheet(displayList.map((d, i) => {
        if (filterType === 'Doctor') return {
          'Sr no.': i + 1,
          UID: d.uid || '',
          Name: d.name || '',
          Degree: d.degree || '',
          Specialization: d.specialization || '',
          Hospital: d.hospital || '',
          Category: d.category || '',
          'Visit Days': d.visitDays || '',
          Headquarter: d.headquarter || '',
          'Working Area': d.workingArea || '',
          'Mobile Number': d.mobile || d.contact || '',
          'Clinic Contact': d.clinicContact || '',
          Email: d.email || '',
          'Clinics Address': d.address || '',
          Birthday: d.birthday || '',
          Anniversary: d.anniversary || '',
          'Extra Information': d.extraInformation || '',
          'Allotted User': d.userAllotted || d.employeeName || d.employeeId || '',
          Status: d.status || 'Active'
        };
        if (filterType === 'Chemist') return {
          'Sr no.': i + 1,
          UID: d.uid || '',
          'Business Name': d.businessName || '',
          'Proprietor Name': d.proprietorName || d.name || '',
          Certification: d.certifications || '',
          Birthday: d.birthday || '',
          Email: d.email || '',
          Mobile: d.mobile || '',
          Address: d.address || '',
          City: d.city || '',
          Headquarter: d.headquarter || '',
          'Working Area': d.workingArea || '',
          'Extra Information': d.extraInformation || '',
          'Allotted User': d.userAllotted || '',
          Status: d.status || 'Active'
        };
        return {
          'Sr no.': i + 1,
          UID: d.uid || '',
          'Business Name': d.businessName || '',
          'Contact Person': d.name || '',
          Certification: d.certifications || '',
          'GST Number': d.gst || '',
          'Drug License Number': d.drugLicense || '',
          'Drug Expiry Date': d.drugExpiryDate || '',
          'Establishment Date': d.establishmentDate || '',
          Mobile: d.mobile || '',
          Email: d.email || '',
          Address: d.address || '',
          City: d.city || '',
          Headquarter: d.headquarter || '',
          'Working Area': d.workingArea || '',
          'Extra Information': d.extraInformation || '',
          'Allotted User': d.userAllotted || '',
          Status: d.status || 'Active'
        };
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${filterType}s`);
      XLSX.writeFile(wb, `${filterType}_List.xlsx`);
    }
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
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docRes, chemRes, stkRes, ctrlRes, hqRes, stateRes, userRes] = await Promise.all([
        axios.get('/api/admin/dcs/doctors'),
        axios.get('/api/admin/dcs/chemists'),
        axios.get('/api/admin/dcs/stockists'),
        axios.get('/api/admin/dcs/controls'),
        axios.get('/api/admin/locations/hqs'),
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/users?includeDeactivated=true').catch(() => ({ data: { success: false, users: [] } }))
      ]);
      if(docRes.data.success) setDoctors(docRes.data.doctors);
      if(chemRes.data.success) setChemists(chemRes.data.chemists);
      if(stkRes.data.success) setStockists(stkRes.data.stockists);
      if(ctrlRes.data.success) setControls(ctrlRes.data.controls);
      
      if(hqRes.data.success) setHqs(hqRes.data.hqs);
      if(stateRes.data.success) setStates(stateRes.data.states);
      if(userRes.data?.success && userRes.data.users) setUsers(userRes.data.users);
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
      if (uploadType === 'CityOrArea') {
        alert('CityOrArea bulk upload is currently under development on the backend.');
        return;
      }
      try {
        const response = await axios.get(`/api/admin/dcs/download-format?type=${uploadType}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${uploadType.toLowerCase()}_upload_format.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        const { utils, writeFile } = await import('xlsx');
        let headers: string[] = [];
        let filename = `${uploadType.toLowerCase()}_upload_format.xlsx`;

        if (uploadType === 'Doctor') {
          headers = ['Sr no.', 'UID', 'Name', 'Degree', 'Specialization', 'Hospital', 'Category', 'Visit Days', 'Headquarter', 'Working Area', 'Mobile Number', 'Clinic Contact', 'Email', 'Clinics Address', 'Birthday', 'Anniversary', 'Extra Information', 'Allotted User', 'Status'];
        } else if (uploadType === 'Chemist') {
          headers = ['Sr no.', 'UID', 'Business Name', 'Proprietor Name', 'Certification', 'Birthday', 'Email', 'Mobile', 'Address', 'City', 'Headquarter', 'Working Area', 'Extra Information', 'Allotted User', 'Status'];
        } else if (uploadType === 'Stockist') {
          headers = ['Sr no.', 'UID', 'Business Name', 'Contact Person', 'Certification', 'GST Number', 'Drug License Number', 'Drug Expiry Date', 'Establishment Date', 'Mobile', 'Email', 'Address', 'City', 'Headquarter', 'Working Area', 'Extra Information', 'Allotted User', 'Status'];
        }

        const ws = utils.aoa_to_sheet([headers]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Template');
        writeFile(wb, filename);
      }
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
    const [subTab, setSubTab] = useState<'allot' | 'deallot' | 'transfer' | ''>('');
    const [mode, setMode] = useState<'hq' | 'user'>('hq'); // Default to HQ-wise!
    
    // HQ-wise states
    const [sourceHq, setSourceHq] = useState('');
    const [targetHq, setTargetHq] = useState('');
    const [clearUserLocks, setClearUserLocks] = useState(true);

    // User-wise states
    const [sourceUserId, setSourceUserId] = useState('');
    const [targetUserId, setTargetUserId] = useState('');
    
    const [entityType, setEntityType] = useState<'All' | 'Doctor' | 'Chemist' | 'Stockist'>('All');
    const [unallottedOnly, setUnallottedOnly] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [selectedChemIds, setSelectedChemIds] = useState<string[]>([]);
    const [selectedStkIds, setSelectedStkIds] = useState<string[]>([]);
    
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Count DCS per HQ for the dropdown badges
    const hqCountMap = React.useMemo(() => {
      const map: Record<string, number> = {};
      [...doctors, ...chemists, ...stockists].forEach(item => {
        if (item.headquarter) {
          const hqKey = item.headquarter.toLowerCase().trim();
          map[hqKey] = (map[hqKey] || 0) + 1;
        }
      });
      return map;
    }, [doctors, chemists, stockists]);

    // Reset selections on state change
    useEffect(() => {
      setSelectedDocIds([]);
      setSelectedChemIds([]);
      setSelectedStkIds([]);
      setActionMsg(null);
    }, [subTab, mode, sourceHq, targetHq, sourceUserId, targetUserId]);

    const getUserIdentifierList = (empId: string) => {
      if (!empId) return [];
      const u = users.find(x => x.employeeId === empId || x._id === empId);
      const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
      return [empId, u?.employeeId, u?.email, u?.uid, name].filter(Boolean).map(s => s.toLowerCase());
    };

    const isMatchUser = (allottedVal: string | null | undefined, empId: string) => {
      if (!allottedVal || !empId) return false;
      const lowerAllotted = allottedVal.toLowerCase();
      const ids = getUserIdentifierList(empId);
      return ids.some(id => lowerAllotted.includes(id));
    };

    // Filter available records based on subTab & mode
    const getRecords = () => {
      let docList: any[] = [];
      let chemList: any[] = [];
      let stkList: any[] = [];

      if (mode === 'hq') {
        const activeHq = subTab === 'allot' ? targetHq : sourceHq;

        // NO NEED TO SHOW DRS UNLESS HQ IS SELECTED!
        if (activeHq) {
          const hqLower = activeHq.toLowerCase().trim();
          const matchesHq = (itemHq?: string) => {
            if (!itemHq) return false;
            return itemHq.toLowerCase().trim() === hqLower;
          };

          docList = doctors.filter(d => matchesHq(d.headquarter));
          chemList = chemists.filter(c => matchesHq(c.headquarter));
          stkList = stockists.filter(s => matchesHq(s.headquarter));

          if (subTab === 'allot' && unallottedOnly) {
            docList = docList.filter(d => !d.userAllotted && !d.employeeId);
            chemList = chemList.filter(c => !c.userAllotted && !c.employeeId);
            stkList = stkList.filter(s => !s.userAllotted && !s.employeeId);
          }
        }
      } else {
        // Mode === 'user'
        const activeUserId = (subTab === 'allot') ? targetUserId : sourceUserId;

        // NO NEED TO SHOW DRS UNLESS EMPLOYEE IS SELECTED!
        if (activeUserId) {
          if (subTab === 'transfer' || subTab === 'deallot') {
            docList = doctors.filter(d => isMatchUser(d.userAllotted, activeUserId) || isMatchUser(d.employeeId, activeUserId));
            chemList = chemists.filter(c => isMatchUser(c.userAllotted, activeUserId) || isMatchUser(c.employeeId, activeUserId));
            stkList = stockists.filter(s => isMatchUser(s.userAllotted, activeUserId) || isMatchUser(s.employeeId, activeUserId));
          } else if (subTab === 'allot') {
            const userObj = users.find(u => u.employeeId === activeUserId || u._id === activeUserId);
            const userHq = (userObj?.hq || '').toLowerCase().trim();

            if (userHq) {
              // ONLY show doctors belonging to this selected employee's HQ!
              docList = doctors.filter(d => (d.headquarter || '').toLowerCase().trim() === userHq);
              chemList = chemists.filter(c => (c.headquarter || '').toLowerCase().trim() === userHq);
              stkList = stockists.filter(s => (s.headquarter || '').toLowerCase().trim() === userHq);
            } else {
              docList = doctors.filter(d => isMatchUser(d.userAllotted, activeUserId));
              chemList = chemists.filter(c => isMatchUser(c.userAllotted, activeUserId));
              stkList = stockists.filter(s => isMatchUser(s.userAllotted, activeUserId));
            }

            if (unallottedOnly) {
              docList = docList.filter(d => !d.userAllotted && !d.employeeId);
              chemList = chemList.filter(c => !c.userAllotted && !c.employeeId);
              stkList = stkList.filter(s => !s.userAllotted && !s.employeeId);
            }
          }
        }
      }

      // Filter by Search (only within the selected HQ/user items!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        docList = docList.filter(d => (d.name || '').toLowerCase().includes(q) || (d.headquarter || '').toLowerCase().includes(q) || (d.workingArea || '').toLowerCase().includes(q) || (d.specialization || '').toLowerCase().includes(q) || (d.userAllotted || '').toLowerCase().includes(q));
        chemList = chemList.filter(c => (c.businessName || c.proprietorName || '').toLowerCase().includes(q) || (c.headquarter || '').toLowerCase().includes(q) || (c.workingArea || '').toLowerCase().includes(q) || (c.userAllotted || '').toLowerCase().includes(q));
        stkList = stkList.filter(s => (s.businessName || s.name || '').toLowerCase().includes(q) || (s.headquarter || '').toLowerCase().includes(q) || (s.workingArea || '').toLowerCase().includes(q) || (s.userAllotted || '').toLowerCase().includes(q));
      }

      return { docList, chemList, stkList };
    };

    const { docList, chemList, stkList } = getRecords();

    // Combined filtered items depending on entityType tab
    const getVisibleItems = () => {
      const items: { id: string, type: 'Doctor' | 'Chemist' | 'Stockist', name: string, sub: string, hq: string, area: string, userAllotted?: string }[] = [];
      if (entityType === 'All' || entityType === 'Doctor') {
        docList.forEach(d => items.push({
          id: d._id,
          type: 'Doctor',
          name: d.name,
          sub: d.specialization || d.degree || d.category || 'Doctor',
          hq: d.headquarter || '-',
          area: d.workingArea || '-',
          userAllotted: d.userAllotted || d.employeeName || d.employeeId
        }));
      }
      if (entityType === 'All' || entityType === 'Chemist') {
        chemList.forEach(c => items.push({
          id: c._id,
          type: 'Chemist',
          name: c.businessName || c.proprietorName || 'Chemist',
          sub: c.proprietorName ? `Prop: ${c.proprietorName}` : 'Retail Outlet',
          hq: c.headquarter || '-',
          area: c.workingArea || '-',
          userAllotted: c.userAllotted
        }));
      }
      if (entityType === 'All' || entityType === 'Stockist') {
        stkList.forEach(s => items.push({
          id: s._id,
          type: 'Stockist',
          name: s.businessName || s.name || 'Stockist',
          sub: s.name ? `Contact: ${s.name}` : 'Distributor',
          hq: s.headquarter || '-',
          area: s.workingArea || '-',
          userAllotted: s.userAllotted
        }));
      }
      return items;
    };

    const visibleItems = getVisibleItems();
    const totalSelectedCount = selectedDocIds.length + selectedChemIds.length + selectedStkIds.length;

    const isItemSelected = (item: { id: string, type: string }) => {
      if (item.type === 'Doctor') return selectedDocIds.includes(item.id);
      if (item.type === 'Chemist') return selectedChemIds.includes(item.id);
      if (item.type === 'Stockist') return selectedStkIds.includes(item.id);
      return false;
    };

    const toggleSelectItem = (item: { id: string, type: string }) => {
      if (item.type === 'Doctor') {
        setSelectedDocIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]);
      } else if (item.type === 'Chemist') {
        setSelectedChemIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]);
      } else if (item.type === 'Stockist') {
        setSelectedStkIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]);
      }
    };

    const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        const docIdsToSelect = visibleItems.filter(i => i.type === 'Doctor').map(i => i.id);
        const chemIdsToSelect = visibleItems.filter(i => i.type === 'Chemist').map(i => i.id);
        const stkIdsToSelect = visibleItems.filter(i => i.type === 'Stockist').map(i => i.id);
        setSelectedDocIds(Array.from(new Set([...selectedDocIds, ...docIdsToSelect])));
        setSelectedChemIds(Array.from(new Set([...selectedChemIds, ...chemIdsToSelect])));
        setSelectedStkIds(Array.from(new Set([...selectedStkIds, ...stkIdsToSelect])));
      } else {
        const visibleDocIds = new Set(visibleItems.filter(i => i.type === 'Doctor').map(i => i.id));
        const visibleChemIds = new Set(visibleItems.filter(i => i.type === 'Chemist').map(i => i.id));
        const visibleStkIds = new Set(visibleItems.filter(i => i.type === 'Stockist').map(i => i.id));
        setSelectedDocIds(prev => prev.filter(id => !visibleDocIds.has(id)));
        setSelectedChemIds(prev => prev.filter(id => !visibleChemIds.has(id)));
        setSelectedStkIds(prev => prev.filter(id => !visibleStkIds.has(id)));
      }
    };

    // Actions
    const handleTransferSubmit = async (transferAll = false) => {
      setActionLoading(true);
      setActionMsg(null);
      try {
        if (mode === 'hq') {
          if (!sourceHq) {
            alert('Please select a Source Headquarter.');
            setActionLoading(false);
            return;
          }
          if (!targetHq) {
            alert('Please select a Target Headquarter.');
            setActionLoading(false);
            return;
          }
          if (sourceHq.toLowerCase().trim() === targetHq.toLowerCase().trim()) {
            alert('Source HQ and Target HQ cannot be the same.');
            setActionLoading(false);
            return;
          }
          if (!transferAll && totalSelectedCount === 0) {
            alert('Please select at least one record to transfer.');
            setActionLoading(false);
            return;
          }

          const countToTransfer = transferAll ? (docList.length + chemList.length + stkList.length) : totalSelectedCount;
          const confirmMsg = `Transfer ${countToTransfer} record(s) from HQ "${sourceHq}" to HQ "${targetHq}"?` + 
            (clearUserLocks ? '\n\nUser locks will be cleared so any representative in the new HQ automatically sees them.' : '');

          if (!window.confirm(confirmMsg)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/transfer-hq', {
            sourceHq,
            targetHq,
            doctorIds: transferAll ? [] : selectedDocIds,
            chemistIds: transferAll ? [] : selectedChemIds,
            stockistIds: transferAll ? [] : selectedStkIds,
            transferAll,
            clearUserAllotment: clearUserLocks
          });

          setActionMsg({ type: 'success', text: res.data.message || 'Records transferred successfully to new HQ!' });
        } else {
          // User mode
          if (!sourceUserId) {
            alert('Please select a Source User.');
            setActionLoading(false);
            return;
          }
          if (!targetUserId) {
            alert('Please select a Target User.');
            setActionLoading(false);
            return;
          }
          if (sourceUserId === targetUserId) {
            alert('Source User and Target User cannot be the same.');
            setActionLoading(false);
            return;
          }
          if (!transferAll && totalSelectedCount === 0) {
            alert('Please select at least one record to transfer.');
            setActionLoading(false);
            return;
          }

          const targetUserObj = users.find(u => u.employeeId === targetUserId || u._id === targetUserId);
          const targetName = targetUserObj ? `${targetUserObj.firstName || ''} ${targetUserObj.lastName || ''}`.trim() : targetUserId;

          const confirmMsg = transferAll 
            ? `Are you sure you want to transfer ALL allotted Doctors, Chemists, and Stockists from ${sourceUserId} to ${targetName} (${targetUserId})?`
            : `Transfer ${totalSelectedCount} selected record(s) to ${targetName} (${targetUserId})?`;

          if (!window.confirm(confirmMsg)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/transfer', {
            sourceEmpId: sourceUserId,
            targetEmpId: targetUserId,
            targetEmpName: targetName,
            doctorIds: transferAll ? [] : selectedDocIds,
            chemistIds: transferAll ? [] : selectedChemIds,
            stockistIds: transferAll ? [] : selectedStkIds,
            transferAll
          });
          setActionMsg({ type: 'success', text: res.data.message || 'Records transferred successfully!' });
        }

        setSelectedDocIds([]);
        setSelectedChemIds([]);
        setSelectedStkIds([]);
        await fetchData();
      } catch (err: any) {
        setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to transfer DCS records.' });
      } finally {
        setActionLoading(false);
      }
    };

    const handleAllotSubmit = async () => {
      setActionLoading(true);
      setActionMsg(null);
      try {
        if (mode === 'hq') {
          if (!targetHq) {
            alert('Please select a Target Headquarter.');
            setActionLoading(false);
            return;
          }
          if (totalSelectedCount === 0) {
            alert('Please select at least one record to allot to ' + targetHq + '.');
            setActionLoading(false);
            return;
          }

          if (!window.confirm(`Allot ${totalSelectedCount} selected record(s) to Headquarter "${targetHq}"?`)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/allot-hq', {
            targetHq,
            doctorIds: selectedDocIds,
            chemistIds: selectedChemIds,
            stockistIds: selectedStkIds
          });
          setActionMsg({ type: 'success', text: res.data.message || `Records allotted to HQ "${targetHq}" successfully!` });
        } else {
          // User mode
          if (!targetUserId) {
            alert('Please select a Target User.');
            setActionLoading(false);
            return;
          }
          if (totalSelectedCount === 0) {
            alert('Please select at least one record to allot.');
            setActionLoading(false);
            return;
          }

          const targetUserObj = users.find(u => u.employeeId === targetUserId || u._id === targetUserId);
          const targetName = targetUserObj ? `${targetUserObj.firstName || ''} ${targetUserObj.lastName || ''}`.trim() : targetUserId;

          if (!window.confirm(`Allot ${totalSelectedCount} selected record(s) to ${targetName} (${targetUserId})?`)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/allot', {
            targetEmpId: targetUserId,
            targetEmpName: targetName,
            doctorIds: selectedDocIds,
            chemistIds: selectedChemIds,
            stockistIds: selectedStkIds
          });
          setActionMsg({ type: 'success', text: res.data.message || 'Records allotted successfully!' });
        }

        setSelectedDocIds([]);
        setSelectedChemIds([]);
        setSelectedStkIds([]);
        await fetchData();
      } catch (err: any) {
        setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to allot DCS records.' });
      } finally {
        setActionLoading(false);
      }
    };

    const handleDeallotSubmit = async (releaseAllHq = false) => {
      setActionLoading(true);
      setActionMsg(null);
      try {
        if (mode === 'hq') {
          if (!sourceHq) {
            alert('Please select a Headquarter.');
            setActionLoading(false);
            return;
          }
          if (!releaseAllHq && totalSelectedCount === 0) {
            alert('Please select at least one record to release.');
            setActionLoading(false);
            return;
          }

          const confirmMsg = releaseAllHq
            ? `Release ALL personal locks on records in HQ "${sourceHq}"?\n\nThis will clear any old rep locks so anyone assigned to "${sourceHq}" sees all records.`
            : `Release user locks for ${totalSelectedCount} selected record(s) in HQ "${sourceHq}"?`;

          if (!window.confirm(confirmMsg)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/release-to-hq', {
            hq: sourceHq,
            doctorIds: releaseAllHq ? [] : selectedDocIds,
            chemistIds: releaseAllHq ? [] : selectedChemIds,
            stockistIds: releaseAllHq ? [] : selectedStkIds,
            releaseAll: releaseAllHq
          });
          setActionMsg({ type: 'success', text: res.data.message || 'Records released to open HQ pool successfully!' });
        } else {
          // User mode
          if (totalSelectedCount === 0) {
            alert('Please select at least one record to de-allot.');
            setActionLoading(false);
            return;
          }

          if (!window.confirm(`De-allot ${totalSelectedCount} selected record(s)? They will become unassigned.`)) {
            setActionLoading(false);
            return;
          }

          const res = await axios.post('/api/admin/dcs/deallot', {
            doctorIds: selectedDocIds,
            chemistIds: selectedChemIds,
            stockistIds: selectedStkIds
          });
          setActionMsg({ type: 'success', text: res.data.message || 'Records de-allotted successfully!' });
        }

        setSelectedDocIds([]);
        setSelectedChemIds([]);
        setSelectedStkIds([]);
        await fetchData();
      } catch (err: any) {
        setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to de-allot DCS records.' });
      } finally {
        setActionLoading(false);
      }
    };

    if (!subTab) {
      return (
        <div className="flex-1 min-w-0 overflow-auto p-6 md:p-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">DOC / CHEM / STK LIST MANAGEMENT</h2>
              <p className="text-xs text-slate-400 mt-1">Manage territorial allocation, transfer accounts between Headquarters or Representatives, and clear locks.</p>
            </div>
            {/* Global Mode Switcher Preview */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 self-start sm:self-auto">
              <button
                onClick={() => setMode('hq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'hq' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin size={13} />
                <span>HQ-Wise Mode (Recommended)</span>
              </button>
              <button
                onClick={() => setMode('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'user' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>Employee-Wise</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button 
              onClick={() => { setSubTab('allot'); setSourceHq(''); setTargetHq(''); setTargetUserId(''); setSourceUserId(''); }} 
              className="bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group text-center"
            >
              <div className="w-20 h-20 bg-slate-700 group-hover:bg-sky-500/20 rounded-full flex items-center justify-center transition-colors">
                <Users size={32} className="text-white group-hover:text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">ALLOT DCS</h3>
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block mt-1">Assign to HQ or User</span>
              </div>
              <p className="text-xs text-slate-400">Assign unallocated doctors, chemists, and stockists directly to a Headquarter territory or representative.</p>
            </button>

            <button 
              onClick={() => { setSubTab('deallot'); setSourceHq(''); setTargetHq(''); setSourceUserId(''); setTargetUserId(''); }} 
              className="bg-slate-800/80 border border-slate-700 hover:border-rose-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group text-center"
            >
              <div className="w-20 h-20 bg-slate-700 group-hover:bg-rose-500/20 rounded-full flex items-center justify-center transition-colors">
                <UserMinus size={32} className="text-white group-hover:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">DE-ALLOT / RELEASE</h3>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block mt-1">Clear Rep Locks to HQ Pool</span>
              </div>
              <p className="text-xs text-slate-400">Release personal rep locks so doctors belong purely to the HQ territory for any current or incoming staff.</p>
            </button>

            <button 
              onClick={() => { setSubTab('transfer'); setSourceHq(''); setTargetHq(''); setSourceUserId(''); setTargetUserId(''); }} 
              className="bg-slate-800/80 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 transition-all shadow-xl group text-center"
            >
              <div className="w-20 h-20 bg-slate-700 group-hover:bg-emerald-500/20 rounded-full flex items-center justify-center transition-colors">
                <ArrowRightLeft size={32} className="text-white group-hover:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">TRANSFER DCS</h3>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mt-1">Source HQ → Target HQ</span>
              </div>
              <p className="text-xs text-slate-400">Transfer accounts from Source HQ to Target HQ, or reassign from an outgoing employee to a new hire.</p>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 relative z-10 flex flex-col gap-5 w-full">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSubTab(''); setSourceHq(''); setTargetHq(''); setSourceUserId(''); setTargetUserId(''); setActionMsg(null); }} 
              className="text-sky-400 font-bold hover:underline flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={16} /> Back To Management
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              {subTab === 'allot' && (mode === 'hq' ? 'ALLOT DCS TO HEADQUARTER' : 'ALLOT DCS TO USER')}
              {subTab === 'deallot' && (mode === 'hq' ? 'RELEASE DCS USER LOCKS IN HQ' : 'DE-ALLOT DCS FROM USER')}
              {subTab === 'transfer' && (mode === 'hq' ? 'TRANSFER DCS (SOURCE HQ → TARGET HQ)' : 'TRANSFER DCS (SOURCE → TARGET USER)')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle inside subTab */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setMode('hq')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'hq' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="HQ-Wise territory management"
              >
                <MapPin size={12} />
                <span>HQ-Wise</span>
              </button>
              <button
                onClick={() => setMode('user')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'user' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Employee-specific management"
              >
                <Users size={12} />
                <span>By Employee</span>
              </button>
            </div>

            <button 
              onClick={fetchData} 
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Action notification banner */}
        {actionMsg && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            actionMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              {actionMsg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span>{actionMsg.text}</span>
            </div>
            <button onClick={() => setActionMsg(null)} className="text-xs hover:underline font-bold">Dismiss</button>
          </div>
        )}

        {/* Top Selection Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* Explanation pill for HQ mode */}
          {mode === 'hq' && (
            <div className="flex items-center gap-2 text-xs text-sky-300 bg-sky-950/40 border border-sky-800/50 px-3.5 py-2.5 rounded-xl">
              <MapPin size={15} className="text-sky-400 shrink-0" />
              <span>
                <strong>Headquarter Territory Mode:</strong> Doctors belong directly to their HQ territory. Representatives assigned to this HQ automatically inherit these doctors.
              </span>
            </div>
          )}

          {/* ROW 1: SELECTORS & OPTIONS */}
          <div className="flex flex-wrap items-end gap-4 lg:gap-6">
            {mode === 'hq' ? (
              <>
                {/* For Transfer or De-Allot: Source HQ */}
                {(subTab === 'transfer' || subTab === 'deallot') && (
                  <div className="flex-1 min-w-[280px]">
                    <label className="text-[11px] font-black text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MapPin size={12} />
                      <span>{subTab === 'transfer' ? 'Source Headquarter *' : 'Headquarter *'}</span>
                    </label>
                    <CustomHqSelect
                      hqs={hqs}
                      selectedHq={sourceHq}
                      onChange={setSourceHq}
                      countMap={hqCountMap}
                      placeholder={subTab === 'transfer' ? 'Select Source Headquarter...' : 'Select Headquarter...'}
                    />
                  </div>
                )}

                {/* Middle Transfer Arrow */}
                {subTab === 'transfer' && (
                  <div className="hidden sm:flex flex-col items-center justify-center pb-2.5 shrink-0 px-1 text-slate-500">
                    <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                      <ArrowRightLeft size={16} className="text-emerald-400" />
                    </div>
                  </div>
                )}

                {/* For Transfer or Allot: Target HQ */}
                {(subTab === 'transfer' || subTab === 'allot') && (
                  <div className="flex-1 min-w-[280px]">
                    <label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MapPin size={12} />
                      <span>Target Headquarter *</span>
                    </label>
                    <CustomHqSelect
                      hqs={hqs}
                      selectedHq={targetHq}
                      onChange={setTargetHq}
                      countMap={hqCountMap}
                      placeholder="Select Target Headquarter..."
                    />
                  </div>
                )}

                {/* Options / Checkbox */}
                {subTab === 'transfer' && (
                  <div className="pb-0.5 shrink-0">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/90 border border-slate-700 hover:border-emerald-500/50 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={clearUserLocks} 
                        onChange={e => setClearUserLocks(e.target.checked)}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold text-xs text-emerald-300">Clear old user locks</span>
                    </label>
                  </div>
                )}

                {subTab === 'allot' && (
                  <div className="pb-0.5 shrink-0">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/90 border border-slate-700 hover:border-sky-500/50 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={unallottedOnly} 
                        onChange={e => setUnallottedOnly(e.target.checked)}
                        className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold text-xs">Unassigned Only</span>
                    </label>
                  </div>
                )}
              </>
            ) : (
              /* USER-WISE SELECTORS */
              <>
                {(subTab === 'transfer' || subTab === 'deallot') && (
                  <div className="flex-1 min-w-[280px]">
                    <label className="text-[11px] font-black text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Users size={12} />
                      <span>{subTab === 'transfer' ? 'Source User *' : 'Select User *'}</span>
                    </label>
                    <CustomUserSelect 
                      users={users} 
                      selectedUser={sourceUserId} 
                      onChange={setSourceUserId}
                      placeholder={subTab === 'transfer' ? 'Select Source User...' : 'Select User...'}
                    />
                  </div>
                )}

                {subTab === 'transfer' && (
                  <div className="hidden sm:flex flex-col items-center justify-center pb-2.5 shrink-0 px-1 text-slate-500">
                    <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                      <ArrowRightLeft size={16} className="text-emerald-400" />
                    </div>
                  </div>
                )}

                {(subTab === 'transfer' || subTab === 'allot') && (
                  <div className="flex-1 min-w-[280px]">
                    <label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Users size={12} />
                      <span>Target User *</span>
                    </label>
                    <CustomUserSelect 
                      users={users} 
                      selectedUser={targetUserId} 
                      onChange={setTargetUserId}
                      placeholder="Select Target User..."
                    />
                  </div>
                )}

                {subTab === 'allot' && (
                  <div className="pb-0.5 shrink-0">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/90 border border-slate-700 hover:border-sky-500/50 px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={unallottedOnly} 
                        onChange={e => setUnallottedOnly(e.target.checked)}
                        className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold text-xs">Unallotted DCS Only</span>
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ROW 2: ACTION BAR (SEPARATED, SPACIOUS, PROMINENT) */}
          <div className="border-t border-slate-700/60 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                Selected: <strong className="text-white font-bold">{totalSelectedCount}</strong> record(s)
              </span>
              {mode === 'hq' && sourceHq && subTab === 'transfer' && (
                <span className="hidden md:inline-block text-slate-500">
                  Total in {sourceHq}: <strong className="text-sky-300 font-mono">{docList.length + chemList.length + stkList.length}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              {subTab === 'transfer' && (
                <>
                  <button
                    onClick={() => handleTransferSubmit(false)}
                    disabled={actionLoading || (mode === 'hq' ? (!sourceHq || !targetHq) : (!sourceUserId || !targetUserId)) || totalSelectedCount === 0}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer Selected ({totalSelectedCount})</span>
                  </button>
                  <button
                    onClick={() => handleTransferSubmit(true)}
                    disabled={actionLoading || (mode === 'hq' ? (!sourceHq || !targetHq || (docList.length + chemList.length + stkList.length === 0)) : (!sourceUserId || !targetUserId || (docList.length + chemList.length + stkList.length === 0)))}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow"
                    title={mode === 'hq' ? `Transfer all records in ${sourceHq} to ${targetHq}` : 'Transfer all records allotted to Source User'}
                  >
                    <span>Transfer All ({docList.length + chemList.length + stkList.length})</span>
                  </button>
                </>
              )}

              {subTab === 'allot' && (
                <button
                  onClick={handleAllotSubmit}
                  disabled={actionLoading || (mode === 'hq' ? !targetHq : !targetUserId) || totalSelectedCount === 0}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Allot Selected ({totalSelectedCount})</span>
                </button>
              )}

              {subTab === 'deallot' && (
                <>
                  <button
                    onClick={() => handleDeallotSubmit(false)}
                    disabled={actionLoading || totalSelectedCount === 0}
                    className="bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:hover:bg-rose-500 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2"
                  >
                    <UserMinus size={16} />
                    <span>{mode === 'hq' ? 'Release Selected Locks' : 'De-Allot Selected'} ({totalSelectedCount})</span>
                  </button>
                  {mode === 'hq' && (
                    <button
                      onClick={() => handleDeallotSubmit(true)}
                      disabled={actionLoading || !sourceHq || (docList.length + chemList.length + stkList.length === 0)}
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow"
                      title="Clear all employee locks in this HQ so doctors belong to the open HQ pool"
                    >
                      <span>Release All in HQ ({docList.length + chemList.length + stkList.length})</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Entity Type Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
            {(['All', 'Doctor', 'Chemist', 'Stockist'] as const).map(tab => {
              const count = tab === 'All' ? (docList.length + chemList.length + stkList.length)
                : tab === 'Doctor' ? docList.length
                : tab === 'Chemist' ? chemList.length
                : stkList.length;
              const isTabActive = entityType === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setEntityType(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isTabActive ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tab === 'All' ? 'All Types' : `${tab}s`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isTabActive ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by name, HQ, area, specialization, user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-sky-500 transition-colors placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* DCS Table / List */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllVisible}
                      checked={visibleItems.length > 0 && visibleItems.every(i => isItemSelected(i))}
                      className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Name / Business Details</th>
                  <th className="py-3 px-4">Headquarter</th>
                  <th className="py-3 px-4">Working Area</th>
                  <th className="py-3 px-4">Territory / User Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs">
                {visibleItems.map(item => {
                  const isChecked = isItemSelected(item);
                  return (
                    <tr 
                      key={`${item.type}-${item.id}`}
                      onClick={() => toggleSelectItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-sky-500/10 hover:bg-sky-500/15' : 'hover:bg-slate-700/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleSelectItem(item)}
                          className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 border ${
                          item.type === 'Doctor' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                          item.type === 'Chemist' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {item.type === 'Doctor' && <Stethoscope size={10} />}
                          {item.type === 'Chemist' && <Pill size={10} />}
                          {item.type === 'Stockist' && <Building2 size={10} />}
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs sm:text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.sub}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-emerald-400 shrink-0" />
                          <span>{item.hq}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.area}
                      </td>
                      <td className="py-3 px-4">
                        {item.userAllotted ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md inline-block">
                              Locked: {item.userAllotted}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md inline-block">
                            Open HQ Pool
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {visibleItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      {((mode === 'hq' ? !(subTab === 'allot' ? targetHq : sourceHq) : !(subTab === 'allot' ? targetUserId : sourceUserId))) ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          {mode === 'hq' ? <MapPin size={32} className="text-slate-600 mb-1" /> : <Users size={32} className="text-slate-600 mb-1" />}
                          <span className="font-bold text-slate-300 text-sm">
                            Please select a {mode === 'hq' ? 'Headquarter' : 'User'} from the dropdown above.
                          </span>
                          <span className="text-xs text-slate-500">
                            {mode === 'hq' 
                              ? 'No records will be shown until a Headquarter is selected. Only doctors, chemists, and stockists tagged to that HQ will appear.' 
                              : 'No records will be shown until an Employee is selected. Only records belonging to that Employee will appear.'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-bold text-slate-300">No records found.</span>
                          <span className="text-xs text-slate-500">No records match the selected {mode === 'hq' ? `Headquarter "${subTab === 'allot' ? targetHq : sourceHq}"` : 'User'}. Try adjusting your search query or filters.</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="px-5 py-3 bg-slate-900 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>Showing <strong className="text-white">{visibleItems.length}</strong> records</span>
            <span>Selected: <strong className="text-sky-400 font-bold">{totalSelectedCount}</strong> record(s)</span>
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
        <div className={`flex-1 min-w-0 bg-slate-900 ${(activeTab === 'edit_delete' && !editingRecord) || activeTab === 'monthly_call_plan' || activeTab === 'dcs_list_management' ? 'p-0 flex flex-col overflow-y-auto' : 'p-4 md:p-6 overflow-y-auto'}`}>
      
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


















