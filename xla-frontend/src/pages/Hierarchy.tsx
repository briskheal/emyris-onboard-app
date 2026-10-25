import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, User, ChevronDown, ChevronRight, 
  Phone, Mail, Calendar, Activity, RefreshCw, Network, 
  Layers, Users, MapPin, GitBranch, ChevronUp 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface HierarchyNode {
  _id?: string;
  id?: string;
  employeeId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  designation: string;
  level: number;
  badge: string;
  hq: string;
  division?: string;
  phone?: string;
  email?: string;
  reportingManager?: string;
  managerName?: string;
  managerDesignation?: string;
  managerHq?: string;
  directReportsCount?: number;
  totalTeamCount?: number;
  treeDepth?: number;
  children?: HierarchyNode[];
}

export default function Hierarchy() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roots, setRoots] = useState<HierarchyNode[]>([]);
  const [flatList, setFlatList] = useState<HierarchyNode[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // View Modes: Organogram (Visual Multi-Tier) vs Tree vs Cards
  const [viewMode, setViewMode] = useState<'ORGANOGRAM' | 'TREE' | 'CARDS'>('ORGANOGRAM');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 'LEADERSHIP' | 'REGIONAL' | 'FIELD'>('ALL');
  
  // Track expanded tree nodes by employeeId
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Organogram: expanded tiers tracker
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

  const fetchHierarchy = () => {
    setLoading(true);
    axios.get('/api/xl/hierarchy')
      .then(res => {
        setLoading(false);
        if (res.data.success) {
          const fetchedRoots = res.data.roots || [];
          const fetchedFlat = res.data.flatList || [];
          setRoots(fetchedRoots);
          setFlatList(fetchedFlat);
          setDivisions(res.data.divisions || []);
          setTotalEmployees(res.data.totalEmployees || fetchedFlat.length);

          // Auto-expand top 2 levels by default in Tree mode
          const initialExpanded: Record<string, boolean> = {};
          fetchedFlat.forEach((u: HierarchyNode) => {
            if ((u.treeDepth ?? 0) <= 1 || u.level >= 6) {
              initialExpanded[u.employeeId] = true;
            }
          });
          setExpandedNodes(initialExpanded);
        }
      })
      .catch(err => {
        console.error("Failed to load hierarchy", err);
        axios.get('/api/xl/user/hierarchy?all=true')
          .then(res => {
            setLoading(false);
            if (res.data.success) {
              setRoots(res.data.roots || []);
              setFlatList(res.data.flatList || []);
              setDivisions(res.data.divisions || []);
              setTotalEmployees(res.data.totalEmployees || (res.data.flatList || []).length);
            }
          })
          .catch(() => setLoading(false));
      });
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const toggleNode = (empId: string) => {
    setExpandedNodes(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    flatList.forEach(u => { allExp[u.employeeId] = true; });
    setExpandedNodes(allExp);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const toggleTier = (tierKey: string) => {
    setCollapsedTiers(prev => ({ ...prev, [tierKey]: !prev[tierKey] }));
  };

  // Badge styling helper
  const getBadgeStyle = (badge: string, level: number) => {
    const b = (badge || '').toUpperCase();
    if (b.includes('GM') || b.includes('VP') || level >= 9) {
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    }
    if (b.includes('NSM') || b.includes('SM') || level >= 7) {
      return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
    }
    if (b.includes('ZSM') || level >= 5) {
      return 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
    }
    if (b.includes('RSM') || level >= 3) {
      return 'bg-teal-500/20 text-teal-300 border border-teal-500/40';
    }
    if (b.includes('ASM') || level === 2) {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  };

  // Filtered Flat List for Card View or Search
  const filteredList = useMemo(() => {
    return flatList.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        u.name.toLowerCase().includes(q) ||
        (u.designation && u.designation.toLowerCase().includes(q)) ||
        (u.hq && u.hq.toLowerCase().includes(q)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q));

      const matchDiv = selectedDivision === 'ALL' || u.division === selectedDivision;

      let matchLevel = true;
      if (selectedLevelFilter === 'LEADERSHIP') matchLevel = u.level >= 7;
      else if (selectedLevelFilter === 'REGIONAL') matchLevel = u.level >= 3 && u.level <= 6;
      else if (selectedLevelFilter === 'FIELD') matchLevel = u.level <= 2;

      return matchSearch && matchDiv && matchLevel;
    });
  }, [flatList, searchTerm, selectedDivision, selectedLevelFilter]);

  // Grouped Organogram Tiers
  const organogramTiers = useMemo(() => {
    const list = filteredList;
    return [
      {
        key: 'TIER_1',
        title: 'Executive Leadership',
        subtitle: 'General Managers, VPs, Directors (Level 9)',
        badge: 'Top Management',
        color: 'from-purple-600 to-indigo-700',
        borderColor: 'border-purple-500/50',
        users: list.filter(u => u.level >= 9)
      },
      {
        key: 'TIER_2',
        title: 'National & Zonal Management',
        subtitle: 'NSMs, Sales Managers, Sr. ZSMs, Product Managers (Levels 5 - 8)',
        badge: 'Zonal Heads',
        color: 'from-indigo-600 to-sky-700',
        borderColor: 'border-indigo-500/50',
        users: list.filter(u => u.level >= 5 && u.level <= 8)
      },
      {
        key: 'TIER_3',
        title: 'Regional Sales Management',
        subtitle: 'Sr. Regional & Regional Sales Managers (Levels 3 - 4)',
        badge: 'Regional Leads',
        color: 'from-sky-600 to-teal-700',
        borderColor: 'border-sky-500/50',
        users: list.filter(u => u.level >= 3 && u.level <= 4)
      },
      {
        key: 'TIER_4',
        title: 'Area Sales Management',
        subtitle: 'Area Sales Managers, Area Business Managers (Level 2)',
        badge: 'Area Managers',
        color: 'from-teal-600 to-emerald-700',
        borderColor: 'border-teal-500/50',
        users: list.filter(u => u.level === 2)
      },
      {
        key: 'TIER_5',
        title: 'Territory Business Force',
        subtitle: 'Territory Business Managers, Medical Representatives (Level 1)',
        badge: 'Field Force',
        color: 'from-emerald-700 to-slate-800',
        borderColor: 'border-emerald-500/50',
        users: list.filter(u => u.level <= 1)
      }
    ].filter(t => t.users.length > 0);
  }, [filteredList]);

  const leadershipCount = useMemo(() => flatList.filter(u => u.level >= 5).length, [flatList]);
  const regionalCount = useMemo(() => flatList.filter(u => u.level >= 2 && u.level <= 4).length, [flatList]);
  const fieldCount = useMemo(() => flatList.filter(u => u.level <= 1).length, [flatList]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: HierarchyNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.employeeId];
    
    const q = searchTerm.toLowerCase().trim();
    const isMatched = !q || 
      node.name.toLowerCase().includes(q) ||
      (node.designation && node.designation.toLowerCase().includes(q)) ||
      (node.hq && node.hq.toLowerCase().includes(q)) ||
      (node.employeeId && node.employeeId.toLowerCase().includes(q));

    const divisionMatch = selectedDivision === 'ALL' || node.division === selectedDivision;

    return (
      <div key={node.employeeId} className="relative transition-all duration-200">
        <div 
          className={`rounded-2xl border transition-all my-2.5 p-3.5 shadow-md ${
            !divisionMatch ? 'opacity-40 bg-slate-900/60 border-slate-800' :
            isMatched 
              ? 'bg-slate-800/90 border-slate-700/80 hover:border-sky-500/50' 
              : 'bg-slate-800/50 border-slate-800 opacity-60'
          }`}
          style={{ marginLeft: `${Math.min(depth * 14, 48)}px` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {hasChildren ? (
                <button 
                  onClick={() => toggleNode(node.employeeId)}
                  className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 active:scale-95 transition-transform mt-0.5"
                  title={isExpanded ? 'Collapse team' : 'Expand team'}
                >
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={18} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-white text-sm leading-tight truncate">
                    {node.name}
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getBadgeStyle(node.badge, node.level)}`}>
                    {node.badge || node.designation}
                  </span>
                  {node.division && (
                    <span className="text-[9px] font-semibold bg-slate-700/70 text-slate-300 px-1.5 py-0.5 rounded-md">
                      {node.division}
                    </span>
                  )}
                </div>

                <p className="text-xs text-sky-400 font-semibold leading-tight">
                  {node.designation}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-slate-300 bg-slate-900/60 px-1.5 py-0.5 rounded">
                    ID: {node.employeeId}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wide">
                    <MapPin size={12} className="shrink-0" />
                    {node.hq || 'HQ'}
                  </span>
                  {node.managerName && (
                    <span className="text-slate-400 truncate max-w-[200px]">
                      Reports to: <strong className="text-slate-300">{node.managerName}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {hasChildren && (
              <span 
                onClick={() => toggleNode(node.employeeId)}
                className="cursor-pointer shrink-0 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-1 rounded-xl flex items-center gap-1"
              >
                <Users size={12} />
                <span>{node.children!.length} Direct</span>
                {node.totalTeamCount && node.totalTeamCount > node.children!.length && (
                  <span className="opacity-80">({node.totalTeamCount} Team)</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-700/60 mt-3 pt-2.5 gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(`/todays-activity?employeeId=${encodeURIComponent(node.employeeId)}&name=${encodeURIComponent(node.name)}`)}
                className="flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-sky-500/30 transition-colors"
              >
                <Calendar size={13} />
                <span>Today's Activity</span>
              </button>

              <button
                onClick={() => navigate(`/consolidated-activity?employeeId=${encodeURIComponent(node.employeeId)}&name=${encodeURIComponent(node.name)}`)}
                className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/30 transition-colors"
              >
                <Activity size={13} />
                <span>Consolidated</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {node.phone && (
                <a 
                  href={`tel:${node.phone}`} 
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <Phone size={14} />
                </a>
              )}
              {node.email && (
                <a 
                  href={`mailto:${node.email}`} 
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-sky-500/30 ml-4 pl-1 space-y-1 my-1">
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-md border-b border-slate-700/60 px-4 pt-12 pb-3.5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 rounded-xl bg-slate-700/80 text-sky-400 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white leading-none">Organogram</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  ADMIN VIEW
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                Complete Company Reporting Structure • {totalEmployees} Active Force
              </p>
            </div>
          </div>

          <button 
            onClick={fetchHierarchy} 
            disabled={loading}
            className="p-2 rounded-xl bg-slate-700/80 text-sky-400 hover:bg-slate-700 transition-colors"
            title="Refresh Organogram"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, designation, HQ, ID..." 
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle: Organogram vs Tree vs Cards */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('ORGANOGRAM')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'ORGANOGRAM' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Visual Multi-Tier Organogram"
            >
              <Network size={14} />
              <span>Chart</span>
            </button>
            <button
              onClick={() => setViewMode('TREE')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'TREE' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Hierarchical Collapsible Tree"
            >
              <GitBranch size={14} />
              <span>Tree</span>
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'CARDS' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Searchable Personnel Cards"
            >
              <Layers size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-700/50 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Division:</span>
            <button
              onClick={() => setSelectedDivision('ALL')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                selectedDivision === 'ALL' ? 'bg-sky-500 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All ({totalEmployees})
            </button>
            {divisions.map(div => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  selectedDivision === div ? 'bg-sky-500 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {div}
              </button>
            ))}
          </div>

          {viewMode === 'TREE' && (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                onClick={expandAll}
                className="text-[10px] font-bold text-sky-400 hover:underline px-1 py-0.5"
              >
                Expand All
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={collapseAll}
                className="text-[10px] font-bold text-slate-400 hover:underline px-1 py-0.5"
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-4 space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
            <span className="text-xl font-black text-white">{totalEmployees}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Active Force</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
            <span className="text-xl font-black text-sky-400">{leadershipCount + regionalCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Managers</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center text-center shadow-md">
            <span className="text-xl font-black text-emerald-400">{fieldCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Field TBMs</span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={36} className="text-sky-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Building company organogram...</p>
          </div>
        ) : viewMode === 'ORGANOGRAM' ? (
          /* Visual Organogram View */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Network size={14} className="text-sky-400" />
                Organizational Hierarchy Tiers ({organogramTiers.length} Levels)
              </span>
              <span className="text-[10px] text-sky-400 font-semibold">
                Tap card for daily activity
              </span>
            </div>

            {organogramTiers.map((tier, idx) => {
              const isCollapsed = !!collapsedTiers[tier.key];
              return (
                <div 
                  key={tier.key} 
                  className={`bg-slate-800/90 border rounded-3xl overflow-hidden shadow-xl transition-all ${tier.borderColor}`}
                >
                  {/* Tier Header Banner */}
                  <div 
                    onClick={() => toggleTier(tier.key)}
                    className={`bg-gradient-to-r ${tier.color} p-4 flex items-center justify-between cursor-pointer active:opacity-90 select-none`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-black text-white leading-tight">{tier.title}</h2>
                          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {tier.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/80 font-medium mt-0.5">{tier.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-white">
                      <span className="text-xs font-black bg-black/30 px-2.5 py-1 rounded-xl">
                        {tier.users.length} {tier.users.length === 1 ? 'Person' : 'People'}
                      </span>
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                  </div>

                  {/* Tier Personnel Cards */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-2.5 bg-slate-900/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {tier.users.map((person) => (
                          <div 
                            key={person.employeeId}
                            className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-3.5 shadow-md hover:border-sky-500/50 transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-300 flex items-center justify-center shrink-0">
                                    <User size={18} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      <h3 className="font-bold text-white text-xs leading-tight truncate">
                                        {person.name}
                                      </h3>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${getBadgeStyle(person.badge, person.level)}`}>
                                        {person.badge || person.designation}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-sky-400 font-semibold leading-tight">
                                      {person.designation}
                                    </p>
                                  </div>
                                </div>

                                {person.directReportsCount && person.directReportsCount > 0 ? (
                                  <span className="text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-lg shrink-0">
                                    {person.directReportsCount} Team
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 flex-wrap">
                                <span className="font-mono bg-slate-900/60 px-1 py-0.5 rounded text-slate-300">
                                  ID: {person.employeeId}
                                </span>
                                <span className="text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                                  <MapPin size={10} />
                                  {person.hq || 'HQ'}
                                </span>
                                {person.division && (
                                  <span className="bg-slate-700/60 text-slate-300 px-1 py-0.5 rounded">
                                    {person.division}
                                  </span>
                                )}
                              </div>

                              {person.managerName && (
                                <p className="text-[10px] text-slate-400 mt-1 truncate">
                                  Reports to: <strong className="text-slate-300">{person.managerName}</strong>
                                </p>
                              )}
                            </div>

                            {/* Direct Actions on Card */}
                            <div className="flex items-center justify-between border-t border-slate-700/50 pt-2 gap-1.5">
                              <div className="flex items-center gap-1 flex-1">
                                <button
                                  onClick={() => navigate(`/todays-activity?employeeId=${encodeURIComponent(person.employeeId)}&name=${encodeURIComponent(person.name)}`)}
                                  className="flex items-center justify-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-sky-500/30 transition-colors flex-1"
                                >
                                  <Calendar size={11} />
                                  <span>Today's</span>
                                </button>
                                <button
                                  onClick={() => navigate(`/consolidated-activity?employeeId=${encodeURIComponent(person.employeeId)}&name=${encodeURIComponent(person.name)}`)}
                                  className="flex items-center justify-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/30 transition-colors flex-1"
                                >
                                  <Activity size={11} />
                                  <span>Monthly</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                {person.phone && (
                                  <a 
                                    href={`tel:${person.phone}`} 
                                    className="p-1 rounded-md bg-slate-700/80 text-slate-300 hover:text-white"
                                  >
                                    <Phone size={12} />
                                  </a>
                                )}
                                {person.email && (
                                  <a 
                                    href={`mailto:${person.email}`} 
                                    className="p-1 rounded-md bg-slate-700/80 text-slate-300 hover:text-white"
                                  >
                                    <Mail size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === 'TREE' ? (
          /* Tree View */
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Corporate Reporting Tree ({roots.length} Top Roots)
              </span>
              <span className="text-[10px] text-sky-400 font-semibold">
                Tap chevrons to expand reportees
              </span>
            </div>

            {roots.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No hierarchy records found.
              </div>
            ) : (
              <div className="space-y-1">
                {roots.map(rootNode => renderTreeNode(rootNode, 0))}
              </div>
            )}
          </div>
        ) : (
          /* Flat Cards View */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                All Field Team Members ({filteredList.length})
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button 
                  onClick={() => setSelectedLevelFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${selectedLevelFilter === 'ALL' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedLevelFilter('LEADERSHIP')}
                  className={`px-2 py-0.5 rounded ${selectedLevelFilter === 'LEADERSHIP' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'}`}
                >
                  Leaders
                </button>
                <button 
                  onClick={() => setSelectedLevelFilter('REGIONAL')}
                  className={`px-2 py-0.5 rounded ${selectedLevelFilter === 'REGIONAL' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'}`}
                >
                  Zonal/Reg
                </button>
                <button 
                  onClick={() => setSelectedLevelFilter('FIELD')}
                  className={`px-2 py-0.5 rounded ${selectedLevelFilter === 'FIELD' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'}`}
                >
                  Field
                </button>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No matching team members found.
              </div>
            ) : (
              filteredList.map((user) => (
                <div 
                  key={user.employeeId} 
                  className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg hover:border-sky-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-700/60 border border-slate-600/50 text-slate-300 flex items-center justify-center shrink-0">
                        <User size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-white text-sm leading-tight truncate">{user.name}</h3>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getBadgeStyle(user.badge, user.level)}`}>
                            {user.badge || user.designation}
                          </span>
                          {user.division && (
                            <span className="text-[9px] font-semibold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                              {user.division}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-sky-400 font-semibold">{user.designation}</p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                          <span className="font-mono bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-300">
                            ID: {user.employeeId}
                          </span>
                          <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                            <MapPin size={12} />
                            {user.hq || 'HQ'}
                          </span>
                          {user.managerName && (
                            <span className="text-slate-400">
                              Manager: <strong className="text-slate-300">{user.managerName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {user.directReportsCount && user.directReportsCount > 0 ? (
                      <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-1 rounded-xl shrink-0 flex items-center gap-1">
                        <Users size={12} />
                        {user.directReportsCount} Direct
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-700/60 mt-3 pt-3 gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/todays-activity?employeeId=${encodeURIComponent(user.employeeId)}&name=${encodeURIComponent(user.name)}`)}
                        className="flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-sky-500/30 transition-colors"
                      >
                        <Calendar size={13} />
                        <span>Today's Activity</span>
                      </button>

                      <button
                        onClick={() => navigate(`/consolidated-activity?employeeId=${encodeURIComponent(user.employeeId)}&name=${encodeURIComponent(user.name)}`)}
                        className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/30 transition-colors"
                      >
                        <Activity size={13} />
                        <span>Consolidated</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.phone && (
                        <a 
                          href={`tel:${user.phone}`} 
                          className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {user.email && (
                        <a 
                          href={`mailto:${user.email}`} 
                          className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Mail size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
