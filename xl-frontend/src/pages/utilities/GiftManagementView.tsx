import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Gift, RefreshCw, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
        <div className="min-h-screen bg-[#f4f6f9] pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/utilities')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Gift Management</h1>
                        <p className="text-[10px] text-gray-400 font-semibold">Promotional Inputs & Doctor Gift Tracking</p>
                    </div>
                </div>
                <button onClick={fetchGifts} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-3.5 space-y-3.5">
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-3">
                    <ReportUserFilter onSelectUser={setSelectedUser} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Period Filter</label>
                            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-gray-700">
                                {MONTHS.map(m => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Year</label>
                            <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-gray-700">
                                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search gift / promotional input..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-medium"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Allotted</p>
                        <p className="text-base font-black text-purple-600 mt-0.5">{s.totalAllotted || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Distributed</p>
                        <p className="text-base font-black text-pink-600 mt-0.5">{s.totalDistributed || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Balance</p>
                        <p className="text-base font-black text-emerald-600 mt-0.5">{s.totalAvailable || 0}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">Loading gift inventory...</div>
                ) : filteredGifts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs font-bold text-gray-400">No gift allotments or distributions found.</div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredGifts.map((g: any, idx: number) => {
                            const isOpen = expandedIdx === idx;
                            return (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div
                                        onClick={() => setExpandedIdx(isOpen ? null : idx)}
                                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-gray-800">{g.giftName}</h4>
                                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                    Allotted: <strong className="text-purple-600">{g.allotted}</strong> • Given: <strong className="text-pink-600">{g.distributed}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-gray-400 block uppercase">Balance</span>
                                                <span className="text-xs font-black text-emerald-600">{g.available} Qty</span>
                                            </div>
                                            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="border-t border-gray-100 bg-gray-50/60 p-3 space-y-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase">Doctor Gift Distribution Log ({g.distributions?.length || 0})</p>
                                            {(g.distributions || []).length === 0 ? (
                                                <p className="text-[11px] text-gray-400 italic">No gifts distributed in DCR yet.</p>
                                            ) : (
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {g.distributions.map((d: any, dIdx: number) => (
                                                        <div key={dIdx} className="bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 flex items-center justify-between text-[11px]">
                                                            <div>
                                                                <span className="font-bold text-gray-800">{d.entityName}</span>
                                                                <span className="text-[10px] text-gray-400 ml-1.5">({d.entityType})</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-black text-pink-600">{d.qty} Qty</span>
                                                                <span className="text-[10px] text-gray-400 ml-2">{d.displayDate}</span>
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
