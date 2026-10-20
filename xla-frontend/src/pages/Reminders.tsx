import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Clock, Trash2, CheckSquare, Square,
  Video, PhoneCall, Mail, ExternalLink, Search, CheckCircle2, AlarmClock, X, Copy, Check
} from 'lucide-react';
import axios from 'axios';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function toYYYYMMDD(year: number, monthIdx: number, day: number) {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Reminders() {
  const now = new Date();
  const todayStr = toYYYYMMDD(now.getFullYear(), now.getMonth(), now.getDate());

  // Calendar State
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Users & Multi-select Dropdown State
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reminder Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingMode, setMeetingMode] = useState<'Google Meet' | 'Concall'>('Google Meet');
  const [meetLink, setMeetLink] = useState(() => localStorage.getItem('xla_saved_meet_link') || '');
  const [emailDeliveryMode, setEmailDeliveryMode] = useState<'group' | 'individual'>('group');
  const [time, setTime] = useState('09:45');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reminders List
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
        const active = list.filter((u: any) => u.status !== 'Blocked');
        setUsers(active);
      } catch (err) {
        try {
          const fallback = await axios.get('/api/xl/admin/users');
          const list = Array.isArray(fallback.data) ? fallback.data : (fallback.data?.users || fallback.data?.data || []);
          setUsers(list.filter((u: any) => u.status !== 'Blocked'));
        } catch (e2) {
          console.error(e2);
        }
      }
    };
    loadUsers();
    fetchReminders();
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selectedEmails whenever selectedUserIds changes
  useEffect(() => {
    const emails: string[] = [];
    selectedUserIds.forEach(id => {
      const u = users.find(x => (x.employeeId || x.uid || x._id) === id);
      if (u?.email && String(u.email).includes('@')) {
        emails.push(String(u.email).trim());
      }
    });
    setSelectedEmails(Array.from(new Set(emails)));
  }, [selectedUserIds, users]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/xl/reports/reminders');
      if (res.data?.success) {
        setReminders(res.data.grouped || res.data.data || []);
        if (res.data.defaultMeetLink) {
          localStorage.setItem('xla_saved_meet_link', res.data.defaultMeetLink);
          setMeetLink(prev => prev || res.data.defaultMeetLink);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calendar Navigation
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  // Build 42-cell or 35-cell Calendar Grid
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInCurrMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  const calendarCells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const pm = calMonth === 0 ? 11 : calMonth - 1;
    const py = calMonth === 0 ? calYear - 1 : calYear;
    calendarCells.push({ day: d, dateStr: toYYYYMMDD(py, pm, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInCurrMonth; d++) {
    calendarCells.push({ day: d, dateStr: toYYYYMMDD(calYear, calMonth, d), isCurrentMonth: true });
  }
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nm = calMonth === 11 ? 0 : calMonth + 1;
    const ny = calMonth === 11 ? calYear + 1 : calYear;
    calendarCells.push({ day: d, dateStr: toYYYYMMDD(ny, nm, d), isCurrentMonth: false });
  }

  const reminderDatesSet = new Set(reminders.map(r => r.date));

  const getUserName = (u: any) =>
    u?.name || [u?.firstName, u?.middleName, u?.lastName].filter(Boolean).join(' ').trim() || u?.employeeId || u?.uid || 'User';

  // Filter users for multi-select dropdown
  const filteredUsers = users.filter(u => {
    const full = getUserName(u).toLowerCase();
    const hq = (u.hq || '').toLowerCase();
    const desig = (u.designation || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const empId = (u.employeeId || u.uid || '').toLowerCase();
    const q = userSearch.toLowerCase();
    return full.includes(q) || hq.includes(q) || desig.includes(q) || email.includes(q) || empId.includes(q);
  });

  const toggleUser = (empId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(empId) ? prev.filter(x => x !== empId) : [...prev, empId]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.employeeId || u.uid || u._id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUserIds.includes(id));
    if (allFilteredSelected) {
      setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleEmailSelection = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // Extract clean https://meet.google.com/xxx-yyyy-zzz from any pasted text
  const extractMeetUrl = (raw: string) => {
    const match = String(raw || '').match(/https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i);
    if (match) return match[0].toLowerCase();
    return raw.trim();
  };

  const handleGenerateMeetLink = () => {
    // Open Google's official instant meeting creator which registers a real room on Google's servers
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
    showToast('Google Meet opened! Click the copy icon in Google Meet, then click "Paste Link" here.', 'success');
  };

  const handlePasteMeetLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const extracted = extractMeetUrl(text);
      if (extracted && extracted.includes('meet.google.com/')) {
        setMeetLink(extracted);
        localStorage.setItem('xla_saved_meet_link', extracted);
        showToast('Valid Google Meet room link pasted & saved!', 'success');
      } else {
        showToast('No meet.google.com/xxx-yyyy-zzz link found in clipboard. Copy the link from Google Meet first.', 'error');
      }
    } catch (e) {
      showToast('Please press Ctrl+V inside the Google Meet Link box to paste.', 'error');
    }
  };

  const handleAddReminder = async () => {
    if (!title.trim()) {
      showToast('Please enter a Reminder Title.', 'error');
      return;
    }
    if (selectedUserIds.length === 0) {
      showToast('Please select at least one user from the dropdown.', 'error');
      return;
    }
    const cleanedMeetLink = extractMeetUrl(meetLink);
    if (meetingMode === 'Google Meet' && (!cleanedMeetLink || !/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(cleanedMeetLink))) {
      showToast('Please click "Create Room" to open Google Meet, copy the real room link, and paste it into the Google Meet Link box.', 'error');
      return;
    }
    if (cleanedMeetLink && /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(cleanedMeetLink)) {
      localStorage.setItem('xla_saved_meet_link', cleanedMeetLink);
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/xl/reminders', {
        employeeIds: selectedUserIds,
        date: selectedDate,
        title: title.trim(),
        description: description.trim(),
        time: time || '09:45',
        meetingMode,
        meetLink: meetingMode === 'Google Meet' ? cleanedMeetLink : '',
        emailDeliveryMode,
        selectedEmails
      });

      if (res.data?.success) {
        const emailNote = res.data.emailSent
          ? ` & Email sent to ${res.data.emailCount} recipient(s)`
          : '';
        showToast(`Reminder scheduled for ${selectedUserIds.length} user(s)${emailNote}!`, 'success');
        setTitle('');
        setDescription('');
        setMeetLink(cleanedMeetLink);
        setSelectedUserIds([]);
        fetchReminders();
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to add reminder.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/xl/reminders/${id}`);
      showToast('Reminder deleted.', 'success');
      fetchReminders();
    } catch (e) {
      showToast('Failed to delete reminder.', 'error');
    }
  };

  const selectedUsersList = selectedUserIds.map(id => {
    const u = users.find(x => (x.employeeId || x.uid || x._id) === id);
    const name = u ? getUserName(u) : id;
    const firstName = u?.firstName || name.split(' ')[0] || name;
    return { id, name, firstName, email: u?.email || '', designation: u?.designation || 'MR', hq: u?.hq || '' };
  });

  return (
    <div className="min-h-screen bg-[#181926] text-slate-100 font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
        }`}>
          <CheckCircle2 size={16} />
          <span>{toast.text}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-7">
        {/* TOP ROW: Calendar Card (Left) + Form Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* LEFT: Calendar Block (5 cols) */}
          <div className="lg:col-span-5 bg-[#232538] border border-slate-700/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg bg-[#2c2f48] hover:bg-slate-700 text-sky-400 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-base font-bold text-white tracking-wide">
                <span className="font-normal text-slate-200 mr-1.5">{MONTH_NAMES[calMonth]}</span>
                <span className="font-black text-white">{calYear}</span>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-[#2c2f48] hover:bg-slate-700 text-sky-400 flex items-center justify-center transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold text-slate-300 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-2.5 text-center">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayStr;
                const hasReminder = reminderDatesSet.has(cell.dateStr);

                return (
                  <div key={idx} className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`relative w-11 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/30'
                          : isToday
                          ? 'border border-blue-400/60 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-300 hover:bg-slate-700/60'
                          : 'text-slate-600 hover:bg-slate-800/40'
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasReminder && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-400 rounded-full" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Reminder Form Block (7 cols) */}
          <div className="lg:col-span-7 bg-[#232538] border border-slate-700/40 rounded-2xl p-6 shadow-2xl space-y-4">
            {/* Reminder Title */}
            <input
              type="text"
              placeholder="Reminder Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#2c2f45] border border-slate-700/60 focus:border-sky-500 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none transition-colors"
            />

            {/* Reminder Description (Message Box) */}
            <textarea
              rows={3}
              placeholder="Reminder Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#2c2f45] border border-slate-700/60 focus:border-sky-500 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none transition-colors resize-y"
            />

            {/* Multi-Select User Dropdown with Tick-boxes */}
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full bg-[#232538] border-2 rounded-xl px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  dropdownOpen ? 'border-sky-500' : 'border-sky-500/80 hover:border-sky-400'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5 pr-2">
                  {selectedUsersList.length === 0 ? (
                    <span className="text-sm text-slate-400 font-medium">
                      Call for a Meeting / Joint Reminder
                    </span>
                  ) : (
                    selectedUsersList.map(u => (
                      <span
                        key={u.id}
                        onClick={e => {
                          e.stopPropagation();
                          toggleUser(u.id);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#3b82f6] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-blue-600"
                      >
                        {u.firstName}
                        <X size={12} />
                      </span>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 border-l border-slate-600 pl-2.5">
                  {selectedUsersList.length > 0 && (
                    <span className="text-[11px] font-black text-sky-400">
                      {selectedUsersList.length} Selected
                    </span>
                  )}
                  <ChevronDown size={18} className={`text-slate-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Dropdown Menu with Tick-boxes */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#161826] border border-sky-500/50 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] z-50 overflow-hidden">
                  {/* Search & Select All Bar */}
                  <div className="p-2.5 border-b border-slate-700 bg-[#1e2136] space-y-2">
                    <div className="relative">
                      <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search user, HQ, designation, or email..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="w-full bg-[#181926] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={toggleSelectAllFiltered}
                        className="flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300"
                      >
                        {filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.employeeId || u.uid || u._id)) ? (
                          <CheckSquare size={15} className="text-sky-400" />
                        ) : (
                          <Square size={15} className="text-slate-400" />
                        )}
                        <span>Select All ({filteredUsers.length})</span>
                      </button>
                      {selectedUserIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds([])}
                          className="text-[11px] font-bold text-rose-400 hover:text-rose-300"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Tick-box List */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 bg-[#161826]">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No matching users found</div>
                    ) : (
                      filteredUsers.map((u, i) => {
                        const empId = u.employeeId || u.uid || u._id;
                        const fullName = getUserName(u);
                        const checked = selectedUserIds.includes(empId);
                        return (
                          <div
                            key={i}
                            onClick={() => toggleUser(empId)}
                            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              checked ? 'bg-sky-500/15' : 'hover:bg-slate-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {checked ? (
                                <CheckSquare size={16} className="text-sky-400 shrink-0" />
                              ) : (
                                <Square size={16} className="text-slate-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {fullName}{' '}
                                  <span className="text-[10px] font-semibold text-emerald-400">
                                    ({u.designation || 'MR'} • {u.hq || 'HQ'})
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {u.email || 'No email configured'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TWO MODE BOX OPTIONS: Option 1 Google Meet | Option 2 Concall */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Meeting Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeetingMode('Google Meet')}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all ${
                    meetingMode === 'Google Meet'
                      ? 'bg-sky-500/15 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-[#2c2f45] border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video size={17} className={meetingMode === 'Google Meet' ? 'text-sky-400' : 'text-slate-400'} />
                  <span>Google Meet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingMode('Concall')}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all ${
                    meetingMode === 'Concall'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-[#2c2f45] border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PhoneCall size={17} className={meetingMode === 'Concall' ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>Concall</span>
                </button>
              </div>
            </div>

            {/* GOOGLE MEET LINK & EMAIL SELECTION PANEL */}
            {meetingMode === 'Google Meet' && (
              <div className="bg-[#1b1d2b] border border-sky-500/30 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Paste real Google Meet link (e.g. https://meet.google.com/abc-defg-hij)"
                    value={meetLink}
                    onChange={e => setMeetLink(extractMeetUrl(e.target.value))}
                    className="flex-1 bg-[#25283c] border border-slate-700 rounded-lg px-3 py-2 text-xs text-sky-300 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateMeetLink}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    title="Opens meet.google.com/new to create an active room on Google servers"
                  >
                    <ExternalLink size={13} />
                    <span>1. Create Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteMeetLink}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    title="Paste copied Google Meet link from clipboard"
                  >
                    <Copy size={13} />
                    <span>2. Paste Link</span>
                  </button>
                </div>
                {localStorage.getItem('xla_saved_meet_link') && meetLink !== localStorage.getItem('xla_saved_meet_link') && (
                  <div className="flex items-center justify-between text-[11px] bg-slate-800/70 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 truncate">
                      Saved Room: <strong className="text-sky-300">{localStorage.getItem('xla_saved_meet_link')}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMeetLink(localStorage.getItem('xla_saved_meet_link') || '')}
                      className="text-sky-400 hover:text-sky-300 font-bold ml-2 shrink-0"
                    >
                      Use Saved Room
                    </button>
                  </div>
                )}

                {/* Email Delivery Mode & Recipient Tick-boxes */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Mail size={13} className="text-sky-400" />
                      Share via Email ({selectedEmails.length} selected):
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEmailDeliveryMode('group')}
                        className={`px-2.5 py-1 rounded-md font-bold transition ${
                          emailDeliveryMode === 'group'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        One Group Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailDeliveryMode('individual')}
                        className={`px-2.5 py-1 rounded-md font-bold transition ${
                          emailDeliveryMode === 'individual'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Individual Emails
                      </button>
                    </div>
                  </div>

                  {selectedUsersList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {selectedUsersList.map(u => {
                        const hasEmail = Boolean(u.email && u.email.includes('@'));
                        const isEmailChecked = hasEmail && selectedEmails.includes(u.email);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={!hasEmail}
                            onClick={() => hasEmail && toggleEmailSelection(u.email)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                              !hasEmail
                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
                                : isEmailChecked
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {isEmailChecked ? <CheckSquare size={12} /> : <Square size={12} />}
                            <span>{u.firstName}: {u.email || 'No email'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Time for Reminder */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-slate-200">Time for Reminder</span>
              <div className="flex items-center gap-2 bg-[#2c2f45] border border-slate-700/60 rounded-xl px-4 py-2.5">
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none"
                />
                <Clock size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* CENTER BUTTON: Add Reminder */}
        <div className="flex justify-center">
          <button
            type="button"
            disabled={submitting}
            onClick={handleAddReminder}
            className="border border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm px-10 py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Scheduling & Sending...' : 'Add Reminder'}
          </button>
        </div>

        {/* BOTTOM ROW: Status Cards (Left) + Reminders List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Bottom-Left Decorative Status Cards (Matching Reference) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-5">
            <div className="bg-[#232538] border border-slate-700/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px] shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-3">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <span className="text-xl font-black text-white">{reminders.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Scheduled Meetings
              </span>
            </div>

            <div className="bg-[#232538] border border-slate-700/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px] shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/15 flex items-center justify-center mb-3">
                <AlarmClock size={40} className="text-sky-400" />
              </div>
              <span className="text-xl font-black text-white">
                {reminders.filter(r => r.date >= todayStr).length}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Upcoming Reminders
              </span>
            </div>
          </div>

          {/* Bottom-Right Reminders List */}
          <div className="lg:col-span-7 bg-[#232538] border border-slate-700/40 rounded-2xl p-5 shadow-2xl max-h-[380px] overflow-y-auto space-y-3">
            {loading ? (
              <div className="text-center py-10 text-sm text-slate-400 font-semibold">
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400 font-semibold">
                No reminders scheduled yet.
              </div>
            ) : (
              reminders.map((rem, idx) => {
                const participants = Array.isArray(rem.participants) && rem.participants.length > 0
                  ? rem.participants
                  : [{ name: rem.employeeName || rem.employeeId, firstName: rem.employeeName || rem.employeeId }];
                const gId = rem.groupId || rem._id;

                return (
                  <div
                    key={idx}
                    className="bg-[#1b1d2b] border border-slate-700/50 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-1">
                        <Clock size={16} />
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        {/* Title Line: YYYY-MM-DD - Title */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-sky-400">
                            {rem.date} - {rem.title || rem.doctorName}
                          </h4>
                          {rem.time && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {rem.time}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            rem.meetingMode === 'Concall'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          }`}>
                            {rem.meetingMode === 'Concall' ? <PhoneCall size={10} /> : <Video size={10} />}
                            {rem.meetingMode || 'Google Meet'}
                          </span>
                        </div>

                        {/* Participant Blue Pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {participants.map((p: any, pIdx: number) => (
                            <span
                              key={pIdx}
                              className="bg-[#3b82f6] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm"
                            >
                              {p.firstName || p.name}
                            </span>
                          ))}
                        </div>

                        {/* Description / Message Content */}
                        {(rem.description || rem.remarks) && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {rem.description || rem.remarks}
                          </p>
                        )}

                        {/* Google Meet Link Actions */}
                        {rem.meetingMode === 'Google Meet' && (rem.meetLink || rem.calendarLink) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {rem.meetLink && (
                              <a
                                href={rem.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg transition"
                              >
                                <Video size={12} /> Join Google Meet
                              </a>
                            )}
                            {rem.meetLink && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rem.meetLink);
                                  setCopiedId(gId);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                              >
                                {copiedId === gId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                <span>{copiedId === gId ? 'Copied' : 'Copy Link'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(gId)}
                      className="text-rose-400/70 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Delete Reminder"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
