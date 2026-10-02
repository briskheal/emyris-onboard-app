import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Download } from 'lucide-react';
import DoctorDetails from '../components/DoctorDetails';
import * as XLSX from 'xlsx';

export default function DoctorsListReport() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [hqs, setHqs] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedHq, setSelectedHq] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDoctor, setViewingDoctor] = useState<any>(null);

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

  
  const exportToExcel = () => {
    const dataToExport = filteredList.map((d, i) => ({
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

  const filteredList = doctors.filter(d => !searchQuery || (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) || (d.businessName && d.businessName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.proprietorName && d.proprietorName.toLowerCase().includes(searchQuery.toLowerCase())) || (d.mobile && d.mobile.includes(searchQuery)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2d] relative font-sans overflow-hidden">
      
      {/* Header / Controls */}
      <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
            <div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
              <input list="state-list" placeholder="Search State..." value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedHq(''); }} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg" />
              <datalist id="state-list">{(states || []).map((s: any) => <option key={s._id} value={s.state} />)}</datalist>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
              <input list="hq-list" placeholder="Search Headquarter..." value={selectedHq} onChange={(e) => { setSelectedHq(e.target.value); fetchDoctors(e.target.value); }} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg" />
              <datalist id="hq-list">{(hqs || []).filter((h: any) => !selectedState || h.state === selectedState).map((h: any) => <option key={h._id} value={h.hqName} />)}</datalist>
            </div>
          </div>
          <div className="w-full md:w-1/3 pt-6 md:pt-0">
             <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 md:opacity-0 md:block">Search</h2>
             <div className="relative w-full">
               <input type="text" placeholder="Search Doctor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#27273f] border border-[#3b3b5a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-lg pl-10" />
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            SHOWING ({filteredList.length}) ENTRIES
          </span>
        </div>

        <div className="flex-1 bg-[#151521] rounded-2xl border border-[#3b3b5a] shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1c1c2e] border-b border-[#3b3b5a]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
                  <th className="px-4 py-4 text-[10px] font-black text-sky-400 uppercase tracking-widest">Name ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Degree ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact ↑</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Area</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">View</th>
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
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-white">{d.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{d.degree || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{d.specialization || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{d.hospital || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{d.mobile || d.contact || '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{d.headquarter || '-'}</td>
                      <td className="px-4 py-4 text-sm text-sky-400">{d.workingArea || '-'}</td>
                      <td className="px-4 py-4 text-center">
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

          {/* Export Footer */}
          <div className="p-4 border-t border-[#3b3b5a] bg-[#1c1c2e] flex justify-end">
            <button 
              onClick={exportToExcel}
              disabled={filteredList.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
