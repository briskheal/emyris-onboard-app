import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Upload, X, CheckCircle2, Info } from 'lucide-react';
import axios from 'axios';

const convertToWebp = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
             const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
             resolve(newFile);
          } else reject('Conversion failed');
        }, 'image/webp', 0.8);
      };
      img.onerror = () => reject('Image load failed');
    };
    reader.onerror = () => reject('File read failed');
  });
};

const getUserId = () => {
  const u = localStorage.getItem('xl_user');
  return u ? JSON.parse(u).employeeId : '';
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Expense() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [tpEntries, setTpEntries] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  
  // Views: 'list', 'form', 'preview', 'success', 'view'
  const [view, setView] = useState<'list' | 'form' | 'preview' | 'success' | 'view'>('list');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Form State
  const [vehicleType, setVehicleType] = useState('2-Wheeler');
  const [hotelAmt, setHotelAmt] = useState<number | ''>('');
  const [foodAmt, setFoodAmt] = useState<number | ''>('');
  const [ticketAmt, setTicketAmt] = useState<number | ''>('');
  const [dailyAmt, setDailyAmt] = useState<number | ''>('');
  const [miscAmt, setMiscAmt] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMonthData();
  }, [selectedMonth, selectedYear]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const email = getUserId();
      
      const [expRes, tpRes, holRes] = await Promise.all([
        axios.get(`/api/xl/expense/my?email=${email}`),
        axios.get(`/api/xl/tour-program/my?email=${email}&month=${monthNames[selectedMonth]}&year=${selectedYear}`),
        axios.get('/api/xl/settings/holidays')
      ]);

      setExpenses(expRes.data.data || []);
      
      let parsedTp = [];
      if (tpRes.data.data && tpRes.data.data.status === 'Approved') {
        try { parsedTp = JSON.parse(tpRes.data.data.entries || '[]'); } catch(e){}
      }
      if (!Array.isArray(parsedTp)) parsedTp = Object.values(parsedTp);
      setTpEntries(parsedTp);
      
      const hMap: Record<string, string> = {};
      (holRes.data.data || []).forEach((h: any) => {
         const hd = new Date(h.date);
         hMap[`${hd.getFullYear()}-${String(hd.getMonth()+1).padStart(2,'0')}-${String(hd.getDate()).padStart(2,'0')}`] = h.name;
      });
      setHolidays(hMap);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const currentMonthStr = String(selectedMonth + 1).padStart(2, '0');
  
  // Aggregate expenses for the month list
  const listData = useMemo(() => {
    const data = [];
    let approvedSum = 0;
    let pendingSum = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${currentMonthStr}-${String(d).padStart(2, '0')}`;
      const dayExps = expenses.filter(e => e.date === dateStr);
      const totalAmt = dayExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      if (dayExps.length > 0) {
        if (dayExps[0].status === 'Approved') approvedSum += totalAmt;
        else pendingSum += totalAmt;
      }

      const tpEntry = tpEntries.find(e => {
         if(e.date === dateStr) return true;
         // Handle potential format mismatch
         try { return new Date(e.date).toISOString().split('T')[0] === dateStr; } catch(x){ return false; }
      });
      
      const holidayName = holidays[dateStr];
      const isSunday = new Date(selectedYear, selectedMonth, d).getDay() === 0;

      data.push({
        day: d,
        dateStr,
        dayOfWeek: new Date(selectedYear, selectedMonth, d).toLocaleDateString('en-US', { weekday: 'short' }),
        dayExps,
        totalAmt,
        hasExpense: dayExps.length > 0,
        tpEntry,
        holidayName,
        isSunday
      });
    }
    
    return { days: data, approvedSum, pendingSum };
  }, [selectedYear, selectedMonth, daysInMonth, expenses, tpEntries, holidays]);

  const handleRowClick = async (dayData: any) => {
    if (!dayData.hasExpense) {
        // Pre-check DCR
        try {
           const dcrRes = await axios.get(`/api/xl/dcr/my?email=${getUserId()}&date=${dayData.dateStr}`);
           const dcrs = dcrRes.data.data || [];
           if (dcrs.length === 0 || !dcrs.some((d: any) => d.status === 'Submitted' || d.status === 'Approved')) {
               alert('You must submit your Daily Call Report (DCR) for this date before claiming expenses!');
               return;
           }
        } catch(e) {
           alert('Failed to verify DCR status.');
           return;
        }
    }
    setSelectedDate(dayData.dateStr);
    if (dayData.hasExpense) {
      setView('view');
    } else {
      // Reset form
      setVehicleType('2-Wheeler');
      setHotelAmt(''); setFoodAmt(''); setTicketAmt(''); setDailyAmt(''); setMiscAmt('');
      setRemarks('');
      setAttachments([]);
      setUploadedUrls([]);
      setView('form');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReview = () => {
    setView('preview');
  };

  const submitExpense = async () => {
    setSubmitting(true);
    try {
      const email = getUserId();
      
      // Upload files first
      let uploadedStr = '';
      if (attachments.length > 0) {
         const urls = [];
         for (let file of attachments) {
           if (file.type.startsWith('image/')) {
              try { file = await convertToWebp(file); } catch(e){}
           }
           const formData = new FormData();
           formData.append('file', file);
           const upRes = await axios.post('/api/upload', formData);
           if (upRes.data.success && upRes.data.url) urls.push(upRes.data.url);
         }
         uploadedStr = urls.join(',');
      }

      // Prepare records
      const records = [];
      if (Number(foodAmt) > 0) records.push({ category: 'Food', amount: Number(foodAmt) });
      if (Number(hotelAmt) > 0) records.push({ category: 'Hotel', amount: Number(hotelAmt) });
      if (Number(ticketAmt) > 0) records.push({ category: 'Ticket', amount: Number(ticketAmt), vehicle: vehicleType });
      if (Number(dailyAmt) > 0) records.push({ category: 'DA', amount: Number(dailyAmt) });
      if (Number(miscAmt) > 0) records.push({ category: 'Misc', amount: Number(miscAmt) });

      if (records.length === 0) {
        alert("Please enter at least one allowance amount.");
        setSubmitting(false);
        return;
      }

      // Submit each
      await Promise.all(records.map(r => 
        axios.post('/api/xl/expense', {
          employeeId: email,
          date: selectedDate,
          amount: r.amount,
          category: r.category,
          remarks: (r.vehicle ? `Vehicle: ${r.vehicle} | ` : '') + remarks,
          receiptImage: uploadedStr
        })
      ));

      setView('success');
    } catch (e) {
      console.error(e);
      alert('Failed to submit expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccess = () => {
    setView('list');
    fetchMonthData(); // refresh data
  };

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-[#131722] flex flex-col items-center justify-center p-6">
         <div className="bg-[#1e2336] rounded-xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative border border-slate-700">
            <button onClick={closeSuccess} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-emerald-500 font-bold text-xl mb-2">Successfully Submitted!</h2>
            <p className="text-slate-300 font-medium text-[15px]">Pending Admin Approval</p>
         </div>
      </div>
    );
  }

  if (view === 'preview') {
    const total = Number(hotelAmt||0) + Number(foodAmt||0) + Number(ticketAmt||0) + Number(dailyAmt||0) + Number(miscAmt||0);
    return (
      <div className="min-h-screen bg-[#131722] flex flex-col pb-20">
        <div className="flex items-center p-4 bg-[#1e2336] border-b border-slate-800">
          <h1 className="text-white font-bold text-[16px] mx-auto tracking-wide">Expense Summary Preview</h1>
        </div>
        <div className="p-5">
           <div className="bg-[#1e2336] rounded-xl border border-slate-800 p-5 shadow-xl">
             <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                <span className="text-white font-bold text-[16px]">Total Expense</span>
                <span className="text-white font-bold text-[16px]">₹ {total}</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Travel Allowance</span><span className="text-slate-200 font-medium text-[14px]">₹ 0</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Hotel Allowance</span><span className="text-slate-200 font-medium text-[14px]">₹ {hotelAmt||0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Food Allowance</span><span className="text-slate-200 font-medium text-[14px]">₹ {foodAmt||0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Ticket Allowance</span><span className="text-slate-200 font-medium text-[14px]">₹ {ticketAmt||0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Daily Allowance</span><span className="text-slate-200 font-medium text-[14px]">₹ {dailyAmt||0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Miscellaneous</span><span className="text-slate-200 font-medium text-[14px]">₹ {miscAmt||0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Remarks</span><span className="text-slate-200 font-medium text-[14px] text-right max-w-[60%]">{remarks || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium text-[14px]">Vehicle Type</span><span className="text-slate-200 font-medium text-[14px]">{vehicleType}</span></div>
             </div>
           </div>
           
           <div className="flex gap-4 mt-6">
             <button onClick={() => setView('form')} disabled={submitting} className="flex-1 bg-transparent border border-emerald-500 text-emerald-500 font-bold py-3.5 rounded-lg active:scale-95">Cancel</button>
             <button onClick={submitExpense} disabled={submitting} className="flex-1 bg-emerald-500 text-white font-bold py-3.5 rounded-lg active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {submitting ? 'Submitting...' : 'Submit'}
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'form' || view === 'view') {
    const dayData = listData.days.find(d => d.dateStr === selectedDate);
    const tp = dayData?.tpEntry;
    
    return (
      <div className="min-h-[100dvh] bg-[#1a1e2d] flex flex-col relative overflow-x-hidden">
        {/* Header Block matching the screenshot */}
        <div className="bg-[#242b42] p-5 rounded-b-3xl shadow-lg relative z-10">
           <button onClick={() => setView('list')} className="absolute top-4 right-4 bg-white/10 text-white p-1.5 rounded-full"><X size={16}/></button>
           <h3 className="text-slate-400 text-[12px] font-bold uppercase tracking-wide mb-1">Working Area Type:</h3>
           <p className="text-slate-200 text-[14px] font-medium mb-3">{tp ? (tp.type || tp.workAreaType || 'Out-Station') : 'Out-Station'}</p>
           
           <h3 className="text-slate-400 text-[12px] font-bold uppercase tracking-wide mb-1">Working Areas:</h3>
           <p className="text-slate-200 text-[14px] font-medium mb-3">{tp ? (tp.toMarket || tp.workingArea || '-') : '-'}</p>
           
           <h3 className="text-slate-400 text-[12px] font-bold uppercase tracking-wide mb-1">Date:</h3>
           <p className="text-slate-200 text-[14px] font-medium">{selectedDate}</p>
        </div>

        {view === 'form' ? (
          <div className="p-5 pb-24 space-y-4">
             <div className="flex flex-col">
                <label className="text-slate-300 text-[13px] mb-2 font-medium">Vehicle Type</label>
                <div className="relative">
                  <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} className="w-full bg-[#242b42] border border-slate-700 text-white p-3.5 rounded-xl appearance-none focus:outline-none focus:border-sky-500">
                    <option>2-Wheeler</option>
                    <option>4-Wheeler</option>
                    <option>Public Transport</option>
                  </select>
                  <ChevronLeft className="absolute right-4 top-4 rotate-270 text-sky-500 pointer-events-none" size={16} />
                </div>
             </div>

             {[
               { label: 'Hotel Allowance', val: hotelAmt, set: setHotelAmt, icon: true },
               { label: 'Food Allowance', val: foodAmt, set: setFoodAmt, icon: true },
               { label: 'Ticket Allowance', val: ticketAmt, set: setTicketAmt, icon: false },
               { label: 'Daily Allowance', val: dailyAmt, set: setDailyAmt, icon: false },
               { label: 'Miscellaneous Allowance', val: miscAmt, set: setMiscAmt, icon: false },
             ].map((f, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                   <label className="text-slate-300 text-[13px] font-medium flex items-center gap-2">
                     {f.label} {f.icon && <Edit2 size={12} className="text-sky-500" />}
                   </label>
                   <input type="number" value={f.val} onChange={e => f.set(parseFloat(e.target.value))} placeholder="0" className="w-24 bg-transparent border border-slate-600 rounded-lg text-white text-center py-2 focus:outline-none focus:border-sky-500" />
                </div>
             ))}

             <div className="pt-2">
               <label className="text-slate-300 text-[13px] font-medium block mb-3">Upload Attachments</label>
               <div className="flex flex-wrap gap-3">
                  {attachments.map((file, idx) => (
                     <div key={idx} className="relative w-16 h-16 bg-[#242b42] border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                       <button onClick={() => removeAttachment(idx)} className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full p-0.5 z-10"><X size={10}/></button>
                       {file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" /> : <File size={24} className="text-slate-400" />}
                     </div>
                  ))}
                  <label className="w-16 h-16 bg-[#242b42] border border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                     <Upload size={20} className="text-emerald-500" />
                     <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                  </label>
               </div>
             </div>

             <div className="pt-2">
               <label className="text-slate-300 text-[13px] font-medium block mb-2">Remarks*</label>
               <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Please enter your remarks" className="w-full bg-[#242b42] border border-slate-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-sky-500" />
             </div>

             <button onClick={handleReview} className="w-full mt-6 bg-transparent border border-emerald-500 text-emerald-500 font-bold py-3.5 rounded-lg active:scale-95 transition-all mb-10">
                Review Expense
             </button>
          </div>
        ) : (
          <div className="p-5 pb-24 space-y-4">
             {/* READ ONLY VIEW */}
             <div className="flex justify-between items-center py-2 border-b border-emerald-500 mb-4">
               <span className="text-emerald-400 font-bold text-[16px]">Total</span>
               <span className="text-emerald-400 font-bold text-[16px]">₹ {dayData?.totalAmt || 0}</span>
             </div>
             
             {['Misc', 'Food', 'Ticket', 'Hotel', 'DA'].map((cat) => {
               const exp = dayData?.dayExps.find((e:any) => e.category === cat);
               if (!exp) return null;
               const lbl = cat === 'Misc' ? 'Misc. Expense' : `${cat} Allowance`;
               return (
                 <div key={cat} className="flex justify-between items-center bg-[#242b42] p-3 rounded-lg mb-2">
                   <span className="text-slate-300 text-[13px]">{lbl}</span>
                   <span className="text-white font-medium">{exp.amount}</span>
                 </div>
               );
             })}
             
             <div className="mt-6">
                <h3 className="text-slate-400 text-[13px] mb-3">Attachments</h3>
                <div className="flex gap-2 overflow-x-auto">
                   {dayData?.dayExps[0]?.receiptImage ? dayData.dayExps[0].receiptImage.split(',').map((url:string, i:number) => (
                      <img key={i} src={url} alt="receipt" className="w-20 h-20 rounded-lg object-cover border border-slate-700" />
                   )) : <span className="text-slate-500 text-xs">No attachments</span>}
                </div>
             </div>

             <div className="mt-6">
                <h3 className="text-slate-400 text-[13px] mb-1">Remarks</h3>
                <p className="text-white text-[14px]">{dayData?.dayExps[0]?.remarks || '-'}</p>
             </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="min-h-[100dvh] bg-[#1a1e2d] flex flex-col">
       {/* Top Nav */}
       <div className="flex items-center p-4">
         <button onClick={() => navigate('/extras')} className="text-white mr-4"><ChevronLeft size={24}/></button>
         <h1 className="text-white font-bold text-lg">Expense</h1>
       </div>

       {/* Filters & Score */}
       <div className="px-4">
          <div className="flex gap-3 mb-4">
             <div className="flex-1 relative">
                <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} className="w-full bg-transparent border border-sky-500/50 text-white rounded-lg p-2.5 appearance-none focus:outline-none">
                  {monthNames.map((m, i) => <option key={i} value={i} className="bg-[#1a1e2d]">{m}</option>)}
                </select>
                <ChevronLeft className="absolute right-3 top-3 rotate-270 text-sky-500 pointer-events-none" size={16} />
             </div>
             <div className="flex-1 relative">
                <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="w-full bg-transparent border border-sky-500/50 text-white rounded-lg p-2.5 appearance-none focus:outline-none">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-[#1a1e2d]">{y}</option>)}
                </select>
                <ChevronLeft className="absolute right-3 top-3 rotate-270 text-sky-500 pointer-events-none" size={16} />
             </div>
          </div>
          
          <div className="flex border border-yellow-500/50 rounded-xl overflow-hidden mb-4 bg-[#242b42]/50">
             <div className="flex-1 p-3 border-r border-yellow-500/50 text-center">
                <div className="text-emerald-500 font-bold text-[13px] mb-1">Approved</div>
                <div className="text-white font-black text-xl">{listData.approvedSum}</div>
             </div>
             <div className="flex-1 p-3 text-center">
                <div className="text-yellow-500 font-bold text-[13px] mb-1">Pending</div>
                <div className="text-white font-black text-xl">{listData.pendingSum}</div>
             </div>
          </div>
       </div>

       {/* List of Days */}
       <div className="flex-1 px-4 pb-6 overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="text-center text-slate-400 py-10">Loading...</div>
          ) : (
             listData.days.map((d, idx) => (
                <div 
                   key={idx} 
                   onClick={() => handleRowClick(d)}
                   className="flex items-center justify-between bg-[#242b42] mb-2 p-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                >
                   <div className="w-12 h-12 bg-sky-500 rounded-lg flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                      <span className="font-bold text-[18px] leading-none">{d.day}</span>
                      <span className="text-[10px] uppercase font-medium">{d.dayOfWeek}</span>
                   </div>
                   
                   <div className="flex-1 ml-4 overflow-hidden">
                      {d.hasExpense ? (
                        <span className="text-slate-200 font-medium text-[14px]">Total- ₹ {d.totalAmt}</span>
                      ) : d.tpEntry ? (
                        <span className="text-slate-200 font-medium text-[14px]">Add Expense</span>
                      ) : d.holidayName ? (
                        <span className="text-slate-400 font-medium text-[14px] truncate block">{d.holidayName}</span>
                      ) : d.isSunday ? (
                        <span className="text-slate-400 font-medium text-[14px]">Sunday</span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[14px]">No TP Found</span>
                      )}
                   </div>
                   
                   <div className="shrink-0 ml-2">
                      {d.hasExpense ? (
                         <span className="border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase">OUT</span>
                      ) : d.tpEntry ? (
                         <span className="border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase">OUT</span>
                      ) : (
                         <span className="text-slate-600 font-medium px-3 text-[16px]">+</span>
                      )}
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
}
