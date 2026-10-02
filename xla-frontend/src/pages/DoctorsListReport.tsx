import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import DoctorDetails from '../components/DoctorDetails';
import * as XLSX from 'xlsx';
import CustomLocationSelect from '../components/CustomLocationSelect';

export default function DoctorsListReport() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedHq, setSelectedHq] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDoctor, setViewingDoctor] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedState, selectedHq]);

  useEffect(() => {
    fetchLocations();
    fetchDoctors('');
  }, []);

  const fetchLocations = async () => {
    try {
      const [stateRes, hqRes] = await Promise.all([
        axios.get('/api/admin/locations/states'),
        axios.get('/api/admin/locations/hqs')
      ]);
      if (stateRes.data.success) setStates(stateRes.data.states || []);
      if (hqRes.data.success) setHqs(hqRes.data.hqs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctors = async (hq: string) => {
    setLoading(true);
    try {
      const url = hq ? `/api/xl/reports/doctors?hq=${encodeURIComponent(hq)}` : '/api/xl/reports/doctors';
      const res = await axios.get(url);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  
  const filteredList = doctors.filter(d => !searchQuery || (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) || (d.businessName && d.businessName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.proprietorName && d.proprietorName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.mobile && d.mobile.includes(searchQuery)));
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = paginatedList.map((d, i) => ({
      'Sr no.': i + 1,
      Name: d.name,
      Degree: d.degree,
      Specialization: d.specialization,
      Hospital: d.hospital,
      Birthday: d.birthday,
      'Anniversary Email': d.anniversary, // As seen in the video excel
      Mobile: d.mobile,
      'Clinic Contact': d.clinicContact,
      'Doctor Code': d.doctorCode,
      Address: d.address,
      Category: d.category,
      UID: d.uid,
      Contact: d.contact,
      'Update At': d.updateAt,
      'Extra Info': d.extraInformation,
      Headquarter: d.headquarter,
      'Working Area': d.workingArea
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctor List");
    XLSX.writeFile(wb, "Doctor List.xlsx");
  };

  if (viewingDoctor) {
    return <DoctorDetails doctor={viewingDoctor} onBack={() => setViewingDoctor(null)} />;
  }

  

  return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans">
        
        {/* Header / Controls */}
        <div className="p-4 md:p-6 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
                <CustomLocationSelect 
                  options={[...new Set((states || []).map((s: any) => s.stateName))]} 
                  selectedValue={selectedState} 
                  onChange={(val) => { setSelectedState(val); setSelectedHq(''); }} 
                  placeholder="Search State..." 
                />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
                <CustomLocationSelect 
                  options={(hqs || []).filter((h: any) => !selectedState || h.state === selectedState).map((h: any) => h.hqName)} 
                  selectedValue={selectedHq} 
                  onChange={(val) => { setSelectedHq(val); fetchDoctors(val); }} 
                  placeholder="Search Headquarter..." 
                />
              </div>
              <div>
               <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 ">Search</h2>
               <div className="relative w-full">
                 <input type="text" placeholder="Search Doctor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-lg px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg pl-10" />
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
              </div>
            </div>
        </div>

        {/* Main Table Content */}
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({filteredList.length}) ENTRIES
          </span>
        </div>

        <div className="overflow-x-auto w-full pb-10">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-sky-400 uppercase tracking-widest">Name ↑</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Degree ↑</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital ↑</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact ↑</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Area</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">Loading...</td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">No Doctors Found</td>
                  </tr>
                ) : (
                  filteredList.map((d, idx) => (
                    <tr key={d._id} className="border-b border-[#3b3b5a] hover:bg-[#27273f]/50 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-white">{d.name}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{d.degree || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{d.specialization || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{d.hospital || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{d.mobile || d.contact || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{d.headquarter || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-sky-400">{d.workingArea || '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button 
                          onClick={() => setViewingDoctor(d)} 
                          className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm mx-auto block"
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            <div className="flex-shrink-0 flex flex-wrap items-center justify-between py-2.5 z-20">
              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    &lt; Prev
                </button>
                <span className="text-sm text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Next &gt;
                </button>
              </div>
              
              <div className="flex items-center gap-6">
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-[#2d2d44] hover:bg-[#3b3b5a] text-slate-300 hover:text-white px-4 py-2 rounded transition-colors text-sm font-medium">
                    <Download size={16} /> Export
                </button>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Show</span>
                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1e1e2d] border border-[#3b3b5a] rounded px-2 py-1 text-slate-300 focus:outline-none">
                        {[10, 20, 50, 100, 200, 500, 1000].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
        </div>
      </div>
    );
}