import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Gift, RefreshCw, ChevronDown, ChevronUp, Search } from 'lucide-react';
import ReportUserFilter, { SelectedUser } from '../../components/ReportUserFilter';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const GiftManagementView: React.FC = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [search, setSearch] = useState('');
    const [data, setData] = useState<any>({ summary: {}, gifts: [] });
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchGifts = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/xl/reports/gifts-management', {
                params: {
                    employeeId: selectedUser.employeeId,
                    month: month === 'All' ? undefined : month,
                    year: month === 'All' ? undefined : year
                }
            });
            if (res.data?.success) {
                setData(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser) fetchGifts();
    }, [selectedUser, month, year]);

    const filteredGifts = (data.gifts || []).filter((g: any) =>
        (g.giftName || '').toLowerCase().includes(search.toLowerCase())
    );

    const s = data.summary || {};

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 pb-24 font-sans">
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/50 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => navigate('/utilities')} 
                        className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-purple-400" />
                            GIFT <span className="text-purple-400">MANAGEMENT</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-semibold">Promotional Inputs & Doctor Gift Tracking</p>
                    </div>
                </div>
                <button 
                    onClick={fetchGifts} 
                    className="p-2 rounded-xl bg-slate-700/60 text-purple-400 hover:bg-slate-700 active:scale-95"
                    title="Refresh data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                {/* Filter Box */}
                <div className="bg-slate-800/90 rounded-2xl p-4 shadow-lg border border-slate-700/70 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Period Filter</label>
                            <select 
                                value={month} 
                                onChange={e => setMonth(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            >
                                {MONTHS.map(m => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
                            <select 
                                value={year} 
                                onChange={e => setYear(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            >
                                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search gift / promotional input..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 shadow-md text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Allotted</p>
                        <p className="text-base font-black text-purple-400 mt-0.5">{s.totalAllotted || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 shadow-md text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Distributed</p>
                        <p className="text-base font-black text-pink-400 mt-0.5">{s.totalDistributed || 0}</p>
                    </div>
                    <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/70 shadow-md text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Balance</p>
                        <p className="text-base font-black text-emerald-400 mt-0.5">{s.totalAvailable || 0}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 text-center text-xs font-bold text-slate-400">Loading gift inventory...</div>
                ) : filteredGifts.length === 0 ? (
                    <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 text-center text-xs font-bold text-slate-400">No gift allotments or distributions found.</div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredGifts.map((g: any, idx: number) => {
                            const isOpen = expandedIdx === idx;
                            return (
                                <div key={idx} className="bg-slate-800/90 rounded-2xl shadow-lg border border-slate-700/70 overflow-hidden">
                                    <div
                                        onClick={() => setExpandedIdx(isOpen ? null : idx)}
                                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white">{g.giftName}</h4>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                    Allotted: <strong className="text-purple-400">{g.allotted}</strong> • Given: <strong className="text-pink-400">{g.distributed}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Balance</span>
                                                <span className="text-xs font-black text-emerald-400">{g.available} Qty</span>
                                            </div>
                                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="border-t border-slate-700/50 bg-slate-900/60 p-3 space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Doctor Gift Distribution Log ({g.distributions?.length || 0})</p>
                                            {(g.distributions || []).length === 0 ? (
                                                <p className="text-[11px] text-slate-400 italic">No gifts distributed in DCR yet.</p>
                                            ) : (
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                    {g.distributions.map((d: any, dIdx: number) => (
                                                        <div key={dIdx} className="bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60 flex items-center justify-between text-[11px]">
                                                            <div>
                                                                <span className="font-bold text-slate-200">{d.entityName}</span>
                                                                <span className="text-[10px] text-slate-400 ml-1.5">({d.entityType})</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-black text-pink-400">{d.qty} Qty</span>
                                                                <span className="text-[10px] text-slate-400 ml-2">{d.displayDate}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GiftManagementView;