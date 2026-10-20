import { useState, useEffect } from 'react';
import { Users, ChevronDown, MapPin } from 'lucide-react';
import axios from 'axios';

export interface SelectedReportUser {
  _id?: string;
  employeeId: string;
  name: string;
  designation?: string;
  hq?: string;
}

export type SelectedUser = SelectedReportUser;
export const SelectedReportUser = {};
export const SelectedUser = {};

interface ReportUserFilterProps {
  onSelectUser: (user: SelectedReportUser) => void;
  selectedEmployeeId?: string;
}

export default function ReportUserFilter({ onSelectUser, selectedEmployeeId }: ReportUserFilterProps) {
  const [currentUser, setCurrentUser] = useState<SelectedReportUser | null>(null);
  const [team, setTeam] = useState<SelectedReportUser[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('xl_user');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const selfUser: SelectedReportUser = {
        _id: parsed._id,
        employeeId: parsed.employeeId,
        name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.name || parsed.employeeId,
        designation: parsed.designation || 'MR',
        hq: parsed.hq || ''
      };
      setCurrentUser(selfUser);
      if (!selectedEmployeeId) {
        onSelectUser(selfUser);
      }

      axios.get(`/api/xl/performance/my-team?employeeId=${encodeURIComponent(parsed.employeeId)}`)
        .then(res => {
          if (res.data?.success) {
            const teamList: SelectedReportUser[] = res.data.team || [];
            setTeam(teamList);
            setIsManager(teamList.length > 0);
          }
        })
        .catch(() => {});
    } catch (e) {}
  }, []);

  if (!currentUser) return null;

  const allOptions = [currentUser, ...team];
  const activeUser = allOptions.find(u => u.employeeId === selectedEmployeeId) || currentUser;

  if (!isManager) {
    return (
      <div className="bg-slate-700/60 border border-slate-600/50 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">
            {activeUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{activeUser.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{activeUser.designation}</div>
          </div>
        </div>
        {activeUser.hq && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-bold text-[10px] border border-slate-700 shrink-0">
            <MapPin size={10} />
            {activeUser.hq}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700/80 hover:bg-slate-700 border border-sky-500/30 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0">
            <Users size={14} />
          </div>
          <div className="text-left min-w-0">
            <div className="font-bold text-white truncate">
              {activeUser.name} {activeUser.employeeId === currentUser.employeeId ? '(Me)' : ''}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {activeUser.designation} {activeUser.hq ? `• ${activeUser.hq}` : ''}
            </div>
          </div>
        </div>
        <ChevronDown size={16} className={`text-sky-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-700/50">
          {allOptions.map((u) => {
            const isSelected = u.employeeId === activeUser.employeeId;
            return (
              <button
                key={u.employeeId}
                type="button"
                onClick={() => {
                  onSelectUser(u);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                  isSelected ? 'bg-sky-500/15 text-sky-300' : 'text-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">
                    {u.name} {u.employeeId === currentUser.employeeId ? '(Myself)' : ''}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    {u.designation} {u.hq ? `• ${u.hq}` : ''}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
