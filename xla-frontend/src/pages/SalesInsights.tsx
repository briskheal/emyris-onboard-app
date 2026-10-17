import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  ArrowUpDown,
  Download,
  Search,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronDown
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Square Month Picker Component matching Medorn style
function SquareMonthPicker({
  selectedMonth,
  selectedYear,
  onChange
}: {
  selectedMonth: string;
  selectedYear: number;
  onChange: (m: string, y: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(selectedYear);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectMonth = (m: string) => {
    onChange(m, viewYear);
    setIsOpen(false);
  };

  return (
    <div ref={pickerRef} className="relative select-none w-full">
      <label className="block text-[11px] font-bold text-sky-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
        Select Month <span className="text-rose-400">*</span>
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1e243d] text-slate-200 px-4 py-2.5 rounded-xl text-sm border border-sky-500/40 hover:border-sky-400 outline-none transition-all cursor-pointer flex items-center justify-between shadow-inner"
      >
        <span className="font-semibold text-white tracking-wide">
          {selectedMonth}, {selectedYear}
        </span>
        <Calendar size={17} className="text-white drop-shadow" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[270px] bg-[#1a2035] border border-sky-500/50 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewYear((y) => y - 1);
              }}
              className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-base text-white tracking-wider">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewYear((y) => y + 1);
              }}
              className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((m) => {
              const isSelected = selectedMonth === m && selectedYear === viewYear;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonth(m)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 font-black'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/40'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Styled Select Dropdown
function CustomDropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative select-none w-full">
      <label className="block text-[11px] font-bold text-sky-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
        {label} <span className="text-rose-400">*</span>
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1e243d] text-slate-200 px-4 py-2.5 rounded-xl text-sm border border-sky-500/40 hover:border-sky-400 outline-none transition-all cursor-pointer flex items-center justify-between shadow-inner"
      >
        <span className="font-semibold text-white tracking-wide">{selectedOption?.label}</span>
        <ChevronDown size={17} className={`text-sky-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full bg-[#1a2035] border border-sky-500/50 rounded-xl shadow-2xl p-1 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                value === opt.value
                  ? 'bg-sky-500/20 text-sky-400 font-bold border-l-2 border-sky-500'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Pure SVG Bar Chart Component for Combined & Side-by-Side Views
function SvgBarChart({
  data,
  dataType,
  valueFormat,
  chartType = 'combined', // 'combined' | 'primary' | 'secondary'
  height = 300
}: {
  data: { month: string; label: string; primary: number; secondary: number; rawPrimary: number; rawSecondary: number }[];
  dataType: string;
  valueFormat: string;
  chartType?: 'combined' | 'primary' | 'secondary';
  height?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute maximum value for Y-axis scaling
  const maxVal = useMemo(() => {
    let m = 0;
    data.forEach((d) => {
      if (chartType === 'combined') {
        m = Math.max(m, d.primary || 0, d.secondary || 0);
      } else if (chartType === 'primary') {
        m = Math.max(m, d.primary || 0);
      } else {
        m = Math.max(m, d.secondary || 0);
      }
    });
    if (m === 0) return 10;
    // Add 15% headroom
    return Math.ceil(m * 1.15);
  }, [data, chartType]);

  // Generate 5 Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxVal / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Number((step * i).toFixed(2)));
    }
    return ticks;
  }, [maxVal]);

  const svgWidth = 700;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const numItems = Math.max(data.length, 1);
  const groupWidth = chartWidth / numItems;

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[620px] relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full overflow-visible font-sans"
          style={{ height: `${height}px` }}
        >
          {/* Y Axis Gridlines and Ticks */}
          {yTicks.map((tickVal, i) => {
            const y = paddingTop + chartHeight - (tickVal / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth={i === 0 ? '1.5' : '0.8'}
                  opacity={i === 0 ? 0.8 : 0.4}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {tickVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Y-Axis Title */}
          <text
            x={15}
            y={height / 2}
            fill="#94a3b8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {dataType === 'Price' ? `Price (${valueFormat})` : `Quantity (${valueFormat})`}
          </text>

          {/* X-Axis Base Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const isHovered = hoveredIdx === idx;

            if (chartType === 'combined') {
              const barWidth = Math.min(groupWidth * 0.35, 26);
              const gap = 4;
              const totalBarWidth = barWidth * 2 + gap;
              const startX = groupX + (groupWidth - totalBarWidth) / 2;

              const priBarHeight = Math.max((item.primary / maxVal) * chartHeight, 0);
              const priY = paddingTop + chartHeight - priBarHeight;

              const secBarHeight = Math.max((item.secondary / maxVal) * chartHeight, 0);
              const secY = paddingTop + chartHeight - secBarHeight;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer transition-opacity"
                >
                  {/* Subtle column hover background */}
                  {isHovered && (
                    <rect
                      x={groupX + 5}
                      y={paddingTop}
                      width={groupWidth - 10}
                      height={chartHeight}
                      fill="#38bdf8"
                      opacity="0.06"
                      rx="6"
                    />
                  )}

                  {/* Primary Bar (Green / Emerald) */}
                  <rect
                    x={startX}
                    y={priY}
                    width={barWidth}
                    height={priBarHeight}
                    fill="url(#primaryGradient)"
                    rx="4"
                    className="transition-all duration-300 hover:brightness-125"
                  />
                  {/* Primary Value Label Above Bar */}
                  {item.primary > 0 && (
                    <text
                      x={startX + barWidth / 2}
                      y={priY - 6}
                      fill="#34d399"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.primary.toLocaleString()}
                    </text>
                  )}

                  {/* Secondary Bar (Blue / Cyan) */}
                  <rect
                    x={startX + barWidth + gap}
                    y={secY}
                    width={barWidth}
                    height={secBarHeight}
                    fill="url(#secondaryGradient)"
                    rx="4"
                    className="transition-all duration-300 hover:brightness-125"
                  />
                  {/* Secondary Value Label Above Bar */}
                  {item.secondary > 0 && (
                    <text
                      x={startX + barWidth + gap + barWidth / 2}
                      y={secY - 6}
                      fill="#38bdf8"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.secondary.toLocaleString()}
                    </text>
                  )}

                  {/* Month Label on X Axis */}
                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + chartHeight + 20}
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                    fontSize="12"
                    fontWeight={isHovered ? 'bold' : '600'}
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                </g>
              );
            } else {
              // Single Bar Chart (Primary or Secondary only)
              const isPri = chartType === 'primary';
              const val = isPri ? item.primary : item.secondary;
              const barWidth = Math.min(groupWidth * 0.45, 34);
              const barX = groupX + (groupWidth - barWidth) / 2;
              const bHeight = Math.max((val / maxVal) * chartHeight, 0);
              const bY = paddingTop + chartHeight - bHeight;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {isHovered && (
                    <rect
                      x={groupX + 5}
                      y={paddingTop}
                      width={groupWidth - 10}
                      height={chartHeight}
                      fill={isPri ? '#10b981' : '#38bdf8'}
                      opacity="0.06"
                      rx="6"
                    />
                  )}

                  <rect
                    x={barX}
                    y={bY}
                    width={barWidth}
                    height={bHeight}
                    fill={isPri ? 'url(#primaryGradient)' : 'url(#secondaryGradient)'}
                    rx="4"
                    className="transition-all duration-300 hover:brightness-125"
                  />
                  {val > 0 && (
                    <text
                      x={barX + barWidth / 2}
                      y={bY - 6}
                      fill={isPri ? '#34d399' : '#38bdf8'}
                      fontSize="10.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {val.toLocaleString()}
                    </text>
                  )}

                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + chartHeight + 20}
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                    fontSize="12"
                    fontWeight={isHovered ? 'bold' : '600'}
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                </g>
              );
            }
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* X Axis Bottom Label */}
          <text
            x={paddingLeft + chartWidth / 2}
            y={height - 5}
            fill="#64748b"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            Month
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function SalesInsights() {
  const navigate = useNavigate();

  // Top Filter States
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_NAMES[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [dataType, setDataType] = useState<string>('Price'); // 'Price' | 'Quantity'
  const [valueFormat, setValueFormat] = useState<string>('Thousands'); // 'Hundreds' | 'Thousands' | 'Lakhs'

  // Chart Carousel State: 0 = Combined, 1 = Side-by-Side
  const [carouselSlide, setCarouselSlide] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  // Table Filter & State
  const [reportType, setReportType] = useState<string>('User-Wise');
  // 'User-Wise' | 'Stockist-Wise' | 'Headquarter-Product-Wise' | 'Headquarter-Stockist-Wise'
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  // Drilldown Hierarchy State
  // drillLevel: 'root' | 'user_products' | 'stockist_products' | 'hq_products' | 'hq_stockists' | 'hq_stockist_products'
  const [drillLevel, setDrillLevel] = useState<string>('root');
  const [activeEntity, setActiveEntity] = useState<any>(null); // e.g. { type: 'User', id: 'EMP1', name: 'Dheeraj Vyas' }
  const [subEntity, setSubEntity] = useState<any>(null); // e.g. { type: 'Product', id: 'P1', name: 'Alomos Mama...' }

  // Table Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load Chart Data
  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const params: any = {
        endMonth: selectedMonth,
        endYear: selectedYear,
        dataType,
        valueFormat
      };

      if (drillLevel === 'user_products' && activeEntity) {
        params.filterType = 'User';
        params.filterValue = activeEntity.id || activeEntity.name;
        if (subEntity) {
          params.subFilterType = 'Product';
          params.subFilterValue = subEntity.name;
        }
      } else if (drillLevel === 'stockist_products' && activeEntity) {
        params.filterType = 'Stockist';
        params.filterValue = activeEntity.name || activeEntity.id;
        if (subEntity) {
          params.subFilterType = 'Product';
          params.subFilterValue = subEntity.name;
        }
      } else if (drillLevel === 'hq_products' && activeEntity) {
        params.filterType = 'Headquarter';
        params.filterValue = activeEntity.name;
        if (subEntity) {
          params.subFilterType = 'Product';
          params.subFilterValue = subEntity.name;
        }
      } else if (drillLevel === 'hq_stockists' && activeEntity) {
        params.filterType = 'Headquarter';
        params.filterValue = activeEntity.name;
      } else if (drillLevel === 'hq_stockist_products' && activeEntity && subEntity) {
        params.filterType = 'Headquarter';
        params.filterValue = activeEntity.name;
        params.subFilterType = 'Stockist';
        params.subFilterValue = subEntity.name;
      }

      const res = await axios.get('/api/xl/reports/sales-insights/charts', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data?.success) {
        setChartData(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  // Load Table Data
  const loadTableData = async () => {
    setTableLoading(true);
    try {
      const params: any = {
        endMonth: selectedMonth,
        endYear: selectedYear,
        reportType,
        drillLevel
      };

      if (activeEntity) {
        params.filterValue = activeEntity.id || activeEntity.name;
      }
      if (subEntity) {
        params.subFilterValue = subEntity.name || subEntity.id;
      }

      const res = await axios.get('/api/xl/reports/sales-insights/table', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data?.success) {
        setTableData(res.data.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load table data:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [selectedMonth, selectedYear, dataType, valueFormat, drillLevel, activeEntity, subEntity]);

  useEffect(() => {
    loadTableData();
  }, [selectedMonth, selectedYear, reportType, drillLevel, activeEntity, subEntity]);

  // Handle Drilling In
  const handleDrillIn = (row: any) => {
    if (drillLevel === 'root') {
      if (reportType === 'User-Wise') {
        setActiveEntity({ type: 'User', id: row.employeeId, name: row.userName });
        setDrillLevel('user_products');
      } else if (reportType === 'Stockist-Wise') {
        setActiveEntity({ type: 'Stockist', id: row.stockistId, name: row.stockistName });
        setDrillLevel('stockist_products');
      } else if (reportType === 'Headquarter-Product-Wise') {
        setActiveEntity({ type: 'Headquarter', name: row.headquarter });
        setDrillLevel('hq_products');
      } else if (reportType === 'Headquarter-Stockist-Wise') {
        setActiveEntity({ type: 'Headquarter', name: row.headquarter });
        setDrillLevel('hq_stockists');
      }
    } else if (drillLevel === 'hq_stockists') {
      // Drilled from HQ into a specific Stockist
      setSubEntity({ type: 'Stockist', id: row.stockistId, name: row.stockistName });
      setDrillLevel('hq_stockist_products');
    } else {
      // Drilled into product row: update the chart to view this specific product!
      setSubEntity({ type: 'Product', name: row.productName });
    }
  };

  // Handle Back Button
  const handleGoBack = () => {
    if (subEntity && (drillLevel === 'user_products' || drillLevel === 'stockist_products' || drillLevel === 'hq_products')) {
      // Clear product subentity but stay in products list
      setSubEntity(null);
    } else if (drillLevel === 'hq_stockist_products') {
      setSubEntity(null);
      setDrillLevel('hq_stockists');
    } else if (drillLevel !== 'root') {
      setActiveEntity(null);
      setSubEntity(null);
      setDrillLevel('root');
    } else {
      navigate('/utilities');
    }
  };

  // Filtered & Sorted Table Rows
  const filteredRows = useMemo(() => {
    let rows = [...tableData];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((val) => String(val || '').toLowerCase().includes(q))
      );
    }

    if (sortField) {
      rows.sort((a, b) => {
        const valA = Number(a[sortField] || 0);
        const valB = Number(b[sortField] || 0);
        if (sortDirection === 'asc') return valA - valB;
        return valB - valA;
      });
    }

    return rows;
  }, [tableData, searchTerm, sortField, sortDirection]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export Table Data to Excel
  const handleExport = () => {
    const exportData = filteredRows.map((r, i) => {
      const rowObj: any = { 'Sr No': i + 1 };
      if (r.userName) rowObj['User Name'] = r.userName;
      if (r.designation) rowObj['Designation'] = r.designation;
      if (r.stockistName) rowObj['Stockist Name'] = r.stockistName;
      if (r.headquarter) rowObj['Headquarter'] = r.headquarter;
      if (r.productName) rowObj['Product Name'] = r.productName;
      rowObj['Primary Sales Value (₹)'] = r.primarySalesValue;
      rowObj['Primary Sales Qty'] = r.primarySalesQty;
      rowObj['Secondary Sales Value (₹)'] = r.secondarySalesValue;
      rowObj['Secondary Sales Qty'] = r.secondarySalesQty;
      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Insights');
    XLSX.writeFile(workbook, `Sales_Insights_${reportType}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  // Breadcrumb Title Generation
  const breadcrumbText = useMemo(() => {
    if (drillLevel === 'root') return '';
    let prefix = '';
    if (reportType === 'User-Wise') prefix = 'User Wise';
    else if (reportType === 'Stockist-Wise') prefix = 'Stockist Wise';
    else if (reportType === 'Headquarter-Product-Wise') prefix = 'Headquarter Product Wise';
    else if (reportType === 'Headquarter-Stockist-Wise') prefix = 'Headquarter Stockist-Wise';

    const parts = [prefix];
    if (activeEntity?.name) parts.push(activeEntity.name);
    if (subEntity?.name) parts.push(subEntity.name);
    return parts.join(' > ');
  }, [drillLevel, reportType, activeEntity, subEntity]);

  // Dynamic Table Title
  const tableTitle = useMemo(() => {
    if (drillLevel !== 'root') {
      return `SHOWING (${filteredRows.length}) ENTRIES`;
    }
    if (reportType === 'User-Wise') return 'USER-WISE REPORT';
    if (reportType === 'Stockist-Wise') return 'STOCKIST-WISE REPORT';
    if (reportType === 'Headquarter-Product-Wise') return 'HEADQUARTER-WISE REPORT';
    if (reportType === 'Headquarter-Stockist-Wise') return 'HEADQUARTER-STOCKIST-WISE REPORT';
    return 'REPORT ENTRIES';
  }, [drillLevel, reportType, filteredRows.length]);

  return (
    <div className="min-h-screen bg-[#0e1326] text-slate-100 font-sans pb-28 md:pb-16 selection:bg-sky-500/30">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-[#121831]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            title="Go Back"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
              <TrendingUp size={20} className="text-sky-400" />
              Sales Insights
            </h1>
            {breadcrumbText && (
              <p className="text-[11px] font-bold text-emerald-400 tracking-wide truncate max-w-[280px] md:max-w-xl">
                {breadcrumbText}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadChartData();
              loadTableData();
            }}
            disabled={chartLoading || tableLoading}
            className="p-2 md:px-3.5 md:py-1.5 rounded-xl bg-[#1e243d] hover:bg-[#282f4d] border border-sky-500/40 text-sky-400 hover:text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={chartLoading || tableLoading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* 1. TOP 3 FILTER CONTROLS CARD */}
        <div className="bg-[#151c35]/90 border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Filter 1: Select Month */}
            <SquareMonthPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onChange={(m, y) => {
                setSelectedMonth(m);
                setSelectedYear(y);
              }}
            />

            {/* Filter 2: Select Data Type */}
            <CustomDropdown
              label="Select Data Type"
              value={dataType}
              options={[
                { label: 'Price', value: 'Price' },
                { label: 'Quantity', value: 'Quantity' }
              ]}
              onChange={(v) => setDataType(v)}
            />

            {/* Filter 3: Select Value Format */}
            <CustomDropdown
              label="Select Value Format"
              value={valueFormat}
              options={[
                { label: 'Hundreds', value: 'Hundreds' },
                { label: 'Thousands', value: 'Thousands' },
                { label: 'Lakhs', value: 'Lakhs' }
              ]}
              onChange={(v) => setValueFormat(v)}
            />

          </div>
        </div>

        {/* 2. CHART CAROUSEL SECTION */}
        <div className="relative bg-[#151c35]/90 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden backdrop-blur-md group">
          
          {/* Header & Chart Slide Navigation Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 pb-3 border-b border-slate-800/80 gap-3">
            <div>
              <h2 className="text-sm md:text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
                <BarChart3 size={18} className="text-sky-400" />
                {carouselSlide === 0
                  ? 'Primary vs Secondary Sales'
                  : 'Primary & Secondary Sales (Side-by-Side)'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Trailing 6-Month Period up to {selectedMonth} {selectedYear}
              </p>
            </div>

            {/* Legend & Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  <span className="text-slate-300">Primary</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-sky-500 shadow-sm shadow-sky-500/50"></span>
                  <span className="text-slate-300">Secondary</span>
                </div>
              </div>

              {/* Slide Buttons */}
              <div className="flex items-center gap-1 bg-[#1e243d] p-1 rounded-xl border border-slate-700/60">
                <button
                  onClick={() => setCarouselSlide(0)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    carouselSlide === 0 ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Combined View"
                >
                  <Layers size={15} />
                </button>
                <button
                  onClick={() => setCarouselSlide(1)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    carouselSlide === 1 ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Side-by-Side View"
                >
                  <BarChart3 size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Left / Right Carousel Arrow Buttons */}
          <button
            onClick={() => setCarouselSlide((prev) => (prev === 0 ? 1 : 0))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1e243d]/80 hover:bg-[#282f4d] border border-sky-500/30 text-white flex items-center justify-center transition-all z-20 shadow-lg cursor-pointer hover:scale-105 opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCarouselSlide((prev) => (prev === 0 ? 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#1e243d]/80 hover:bg-[#282f4d] border border-sky-500/30 text-white flex items-center justify-center transition-all z-20 shadow-lg cursor-pointer hover:scale-105 opacity-80 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          {/* Chart Display Area */}
          <div className="relative min-h-[300px]">
            {chartLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-sky-400">
                <RefreshCw size={28} className="animate-spin" />
                <span className="text-xs font-semibold text-slate-300">Loading sales insights...</span>
              </div>
            ) : carouselSlide === 0 ? (
              /* Slide 1: Combined Chart */
              <div className="animate-in fade-in duration-200">
                <SvgBarChart
                  data={chartData}
                  dataType={dataType}
                  valueFormat={valueFormat}
                  chartType="combined"
                  height={310}
                />
              </div>
            ) : (
              /* Slide 2: Side-by-Side Charts */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                <div className="bg-[#121831]/80 border border-slate-800 rounded-xl p-3">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Primary Sales
                  </h3>
                  <SvgBarChart
                    data={chartData}
                    dataType={dataType}
                    valueFormat={valueFormat}
                    chartType="primary"
                    height={270}
                  />
                </div>
                <div className="bg-[#121831]/80 border border-slate-800 rounded-xl p-3">
                  <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    Secondary Sales
                  </h3>
                  <SvgBarChart
                    data={chartData}
                    dataType={dataType}
                    valueFormat={valueFormat}
                    chartType="secondary"
                    height={270}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Carousel Dots Indicators */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-2">
            <button
              onClick={() => setCarouselSlide(0)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                carouselSlide === 0 ? 'w-6 bg-sky-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setCarouselSlide(1)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                carouselSlide === 1 ? 'w-6 bg-sky-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          </div>
        </div>

        {/* 3. REPORT TYPE SELECTOR & DATA TABLE */}
        <div className="bg-[#151c35]/90 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
          
          {/* Report Type Selector (only shown at root level, just like in the video) */}
          {drillLevel === 'root' && (
            <div className="max-w-xs">
              <CustomDropdown
                label="Select Report type"
                value={reportType}
                options={[
                  { label: 'User-Wise', value: 'User-Wise' },
                  { label: 'Stockist-Wise', value: 'Stockist-Wise' },
                  { label: 'Headquarter-Product-Wise', value: 'Headquarter-Product-Wise' },
                  { label: 'Headquarter-Stockist-Wise', value: 'Headquarter-Stockist-Wise' }
                ]}
                onChange={(v) => {
                  setReportType(v);
                  setDrillLevel('root');
                  setActiveEntity(null);
                  setSubEntity(null);
                }}
              />
            </div>
          )}

          {/* Table Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-sky-500"></span>
              {tableTitle}
            </h3>

            {/* Search and Export Bar */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#1e243d] border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors w-44 md:w-56"
                />
              </div>

              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-[#1e243d] hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Export to Excel"
              >
                <Download size={14} className="text-sky-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#101528]/80 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1a203a] border-b border-slate-800 text-slate-300 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3 text-center w-14">Sr no.</th>

                  {/* Dynamic Column Names based on Report Type & Drilldown */}
                  {drillLevel === 'root' && reportType === 'User-Wise' && (
                    <>
                      <th className="py-3 px-3">User Name</th>
                      <th className="py-3 px-3">Designation</th>
                    </>
                  )}
                  {drillLevel === 'root' && reportType === 'Stockist-Wise' && (
                    <>
                      <th className="py-3 px-3">Stockist Name</th>
                      <th className="py-3 px-3">Headquarter</th>
                    </>
                  )}
                  {drillLevel === 'root' && (reportType === 'Headquarter-Product-Wise' || reportType === 'Headquarter-Stockist-Wise') && (
                    <th className="py-3 px-3">Headquarter</th>
                  )}
                  {drillLevel === 'hq_stockists' && (
                    <th className="py-3 px-3">Stockist Name</th>
                  )}
                  {(drillLevel === 'user_products' || drillLevel === 'stockist_products' || drillLevel === 'hq_products' || drillLevel === 'hq_stockist_products') && (
                    <th className="py-3 px-3">Product name</th>
                  )}

                  {/* Common Sales Metrics Columns */}
                  <th
                    onClick={() => handleSort('primarySalesValue')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-sky-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Primary Sales Value</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('primarySalesQty')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-sky-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Primary Sales Qty</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('secondarySalesValue')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-sky-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Secondary Sales Value</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('secondarySalesQty')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-sky-400 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Secondary Sales Qty</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>

                  <th className="py-3 px-3 text-center w-16">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {tableLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-sky-400" />
                        <span>Loading table entries...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      No data found for the selected period
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-[#182142]/60 transition-colors group"
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-semibold">{rowNum}</td>

                        {/* Dynamic Row Data */}
                        {drillLevel === 'root' && reportType === 'User-Wise' && (
                          <>
                            <td className="py-3 px-3 text-white font-bold">{row.userName}</td>
                            <td className="py-3 px-3 text-slate-300 font-semibold">{row.designation}</td>
                          </>
                        )}
                        {drillLevel === 'root' && reportType === 'Stockist-Wise' && (
                          <>
                            <td className="py-3 px-3 text-white font-bold">{row.stockistName}</td>
                            <td className="py-3 px-3 text-slate-300 font-semibold">{row.headquarter || 'HO'}</td>
                          </>
                        )}
                        {drillLevel === 'root' && (reportType === 'Headquarter-Product-Wise' || reportType === 'Headquarter-Stockist-Wise') && (
                          <td className="py-3 px-3 text-white font-bold">{row.headquarter}</td>
                        )}
                        {drillLevel === 'hq_stockists' && (
                          <td className="py-3 px-3 text-white font-bold">{row.stockistName}</td>
                        )}
                        {(drillLevel === 'user_products' || drillLevel === 'stockist_products' || drillLevel === 'hq_products' || drillLevel === 'hq_stockist_products') && (
                          <td className="py-3 px-3 text-white font-bold">{row.productName}</td>
                        )}

                        {/* Values */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {row.primarySalesValue?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                          {row.primarySalesQty?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sky-400">
                          {row.secondarySalesValue?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                          {row.secondarySalesQty?.toLocaleString()}
                        </td>

                        {/* View Drill-in Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDrillIn(row)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 border border-slate-700/60 hover:border-sky-500/50 transition-all cursor-pointer active:scale-95 shadow-sm"
                            title="View Drilldown"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination & Page Size */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#1e243d] border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#1e243d] hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="font-semibold text-white px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#1e243d] hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
