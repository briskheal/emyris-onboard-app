import { 
  Building2, Users, ClipboardList, FileBarChart, DollarSign, Stethoscope, Gift, CheckSquare, CalendarDays, Settings as SettingsIcon,
  FileText, BarChart3, Receipt, MapPin, BellRing, Clock, PackageSearch, TrendingUp, ShoppingCart, CalendarRange,
  History, UserCheck, MonitorPlay, Shield, Bell
} from 'lucide-react';

export interface RouteItem {
  id?: string;
  title: string;
  path: string;
  breadcrumb: string;
  keywords?: string[];
  icon?: any;
  description?: string;
  color?: string;
  bg?: string;
  label?: string;
  isNew?: boolean;
}

export const adminItems: RouteItem[] = [
  { label: 'MANAGE LOCATIONS', icon: Building2, path: '/admin/locations', title: 'Manage Locations', breadcrumb: 'Admin > Locations', keywords: ['location', 'state', 'headquarter', 'hq', 'city', 'area'] },
  { label: 'MANAGE USERS', icon: Users, path: '/admin/users', title: 'Manage Users', breadcrumb: 'Admin > Users', keywords: ['user', 'users', 'employee', 'mr', 'rep', 'representative', 'staff', 'designation'] },
  { label: 'MANAGE PRODUCTS', icon: ClipboardList, path: '/admin/products', title: 'Manage Products', breadcrumb: 'Admin > Products', keywords: ['product', 'products', 'sku', 'medicines', 'price', 'brand', 'division'] },
  { label: 'USER PERFORMANCE ANALYSIS', icon: FileBarChart, path: '/admin/user-performance-analysis', title: 'User Performance Analysis', breadcrumb: 'Admin > Performance', keywords: ['performance', 'target', 'achievement', 'kpi', 'doctor calls target', 'analysis'] },
  { label: 'ALLOWANCES', icon: DollarSign, path: '/admin/expenses', title: 'Manage Expenses & Allowances', breadcrumb: 'Admin > Expenses', keywords: ['expense', 'allowance', 'da', 'ta', 'travel', 'fare', 'rates'] },
  { label: 'DOCTORS, STOCKISTS & CHEMISTS', icon: Stethoscope, path: '/admin/dcs', title: 'Manage DCS (Doctors, Stockists, Chemists)', breadcrumb: 'Admin > DCS', keywords: ['doctor', 'chemist', 'stockist', 'dcs', 'add doctor', 'hospital', 'clinic'] },
  { label: 'SAMPLES & GIFTS', icon: Gift, path: '/extras/samples', title: 'Samples & Gifts Management', breadcrumb: 'Admin > Gifts', keywords: ['sample', 'gift', 'promotional', 'stock', 'inventory'] },
  { label: 'APPROVALS', icon: CheckSquare, path: '/admin/approvals', title: 'Approvals Hub', breadcrumb: 'Admin > Approvals', keywords: ['approval', 'approvals', 'pending', 'call plan approval', 'tp approval', 'tour program approval', 'expense approval', 'leave approval', 'dcr approval'] },
  { label: 'MANAGE LEAVE', icon: CalendarDays, path: '/admin/leave', title: 'Manage Leave', breadcrumb: 'Admin > Leave', keywords: ['leave', 'holiday', 'leave type', 'leave balance', 'vacation', 'casual leave', 'sick leave'] },
  { label: 'SETTINGS', icon: SettingsIcon, path: '/extras/settings', title: 'Admin Settings', breadcrumb: 'Admin > Settings', keywords: ['settings', 'configuration', 'preferences', 'system', 'typography', 'theme'] }
];

export const utilitiesOptions: RouteItem[] = [
  { path: '/extras/tour-program', label: 'TOUR PROGRAM', description: 'Access detailed reports of field Tour Programs submitted by users, outlining their planned doctor visits, working areas, and daily schedule.', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Tour Program Report', breadcrumb: 'Utilities > Tour Program', keywords: ['tour program', 'tp', 'tour plan', 'monthly tp', 'field tour', 'travel plan', 'monthly plan'] },
  { path: '/report', label: 'CALL REPORTS', description: 'Access official records of doctor, chemist, and stockist visits made by Medical Representatives, including visit dates, covered areas, and key visit details.', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10', title: 'Call Reports (DCR)', breadcrumb: 'Utilities > Call Reports', keywords: ['call report', 'call reports', 'dcr', 'daily call report', 'doctor visit', 'visit report'] },
  { label: 'REMINDER CALLS REPORTS', description: 'Reminder Calls Reports record all reminder calls, including dates and outcomes, ensuring timely follow-ups and effective communication tracking.', icon: BellRing, color: 'text-blue-400', bg: 'bg-blue-400/10', path: '/extras/reminders', title: 'Reminder Calls Reports', breadcrumb: 'Utilities > Reminders', keywords: ['reminder', 'reminders', 'reminder call', 'follow up'] },
  { path: '/reports/missed-reports', label: 'MISSED REPORTS', description: 'Missed Call Reports track visits made to doctors, stockists, and chemists, highlighting those missed. They help identify coverage gaps and improve follow-up efficiency.', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10', title: 'Missed Reports', breadcrumb: 'Utilities > Missed Reports', keywords: ['missed', 'missed reports', 'missed calls', 'missed doctors', 'gap', 'coverage'] },
  { path: '/reports/sales-insights', label: 'SALES INSIGHTS', description: 'Graphical insights of primary, secondary, and combined sales for complete visibility along with their report types User-Wise, Stockist-Wise and Headquarter-Wise.', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', title: 'Sales Insights', breadcrumb: 'Utilities > Insights', keywords: ['sales insights', 'insights', 'analytics', 'charts', 'revenue', 'primary vs secondary'] },
  { path: '/reports/primary-sales', label: 'PRIMARY SALES REPORTS', description: 'Provide detailed data on pharmaceutical sales to doctors, chemists, and stockists, including quantities and dates, helping in accurate tracking and planning.', icon: PackageSearch, color: 'text-teal-400', bg: 'bg-teal-400/10', title: 'Primary Sales Reports', breadcrumb: 'Utilities > Primary Sales', keywords: ['primary sales', 'primary sales reports', 'primary report', 'stockist primary', 'invoice value', 'billing'] },
  { path: '/reports/secondary-sales', label: 'SECONDARY SALES REPORTS', description: 'Secondary Sales Reports track pharmaceutical product movement from stockists to retailers, including sales volumes and dates. They support monitoring distribution performance.', icon: ShoppingCart, color: 'text-lime-400', bg: 'bg-lime-400/10', title: 'Secondary Sales Reports', breadcrumb: 'Utilities > Secondary Sales', keywords: ['secondary sales', 'secondary sales reports', 'secondary report', 'retailer sales', 'inventory sales', 'stockist secondary'] },
  { path: '/utilities/lists/doctors', label: 'LISTS', description: 'This list consolidates essential data such as doctors, chemists, stockists, call plans, products, gifts, routes, holidays, and geofencing details.', icon: ClipboardList, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', title: 'Lists Directory', breadcrumb: 'Utilities > Lists', keywords: ['lists', 'doctors list', 'chemists list', 'stockists list', 'call plan lists'] },
  { path: '/reports/geo-location-analysis', label: 'GEO-LOCATION ANALYSIS REPORT', description: 'Geo-Location Analysis Report tracks and analyzes the geographic locations of field activities, helping optimize routes, monitor coverage, and improve overall field efficiency.', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Geo-Location Analysis', breadcrumb: 'Utilities > Geo-Location', keywords: ['geo location', 'gps tracking', 'route analysis', 'map analysis', 'coordinates'] }
];

export const extrasOptions: RouteItem[] = [
  { label: 'Call Plan', path: '/extras/call-plan', description: 'Design and submit monthly Doctor Call Plans', icon: CalendarRange, color: 'text-sky-400', bg: 'bg-sky-400/10', title: 'Monthly Call Plan', breadcrumb: 'Field Operations > Call Plan', keywords: ['call plan', 'monthly call plan', 'cp', 'plan doctor', 'doctor call plan', 'planning', 'submit call plan'] },
  { label: 'Tour Program', path: '/extras/tour-program', description: 'Submit and view monthly field Tour Programs', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Tour Program (TP)', breadcrumb: 'Field Operations > Tour Program', keywords: ['tour program', 'tp', 'tour plan', 'monthly tour plan', 'submit tp'] },
  { label: 'Leave Request', path: '/extras/leave', description: 'Apply for leaves & track status', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Leave Request', breadcrumb: 'Extras > Leave Request', keywords: ['leave', 'leave request', 'apply leave', 'vacation', 'sick leave'] },
  { label: 'Geo Fencing', path: '/extras/geo-fencing', description: 'Geo-tag doctors & clinic locations', icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500/10', title: 'Geo-Fencing', breadcrumb: 'Extras > Geo-Fencing', keywords: ['geo fencing', 'tag location', 'gps tag', 'doctor geo'] },
  { label: 'Expense', path: '/extras/expense', description: 'Submit and track travel expenses', icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-400/10', title: 'Expense Entry', breadcrumb: 'Extras > Expense', keywords: ['expense', 'daily allowance', 'travel allowance', 'da', 'ta', 'bill'] },
  { label: 'Backlog Reporting', path: '/extras/backlog', description: 'Submit missed call reports', icon: History, color: 'text-sky-500', bg: 'bg-sky-500/10', title: 'Backlog Reporting', breadcrumb: 'Extras > Backlog', keywords: ['backlog', 'missed call report', 'past reporting', 'dcr backlog'] },
  { label: 'Attendance', path: '/extras/attendance', description: 'Daily attendance & punch-in', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-400/10', title: 'Attendance', breadcrumb: 'Extras > Attendance', keywords: ['attendance', 'punch in', 'punch out', 'daily punch', 'work time'] },
  { label: 'eDetailing', path: '/extras/e-detailing', description: 'Interactive product detailing', icon: MonitorPlay, color: 'text-slate-300', bg: 'bg-slate-300/10', title: 'E-Detailing', breadcrumb: 'Extras > E-Detailing', keywords: ['edetailing', 'e detailing', 'visual aid', 'presentation', 'slides'] },
  { label: 'CRM', path: '/extras/crm', description: 'Customer Relationship Management', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'CRM (Customer Management)', breadcrumb: 'Extras > CRM', keywords: ['crm', 'customer', 'doctor crm', 'relationship', 'history'] },
  { label: 'Profit Analysis', path: '/extras/profit', description: 'Profitability and margin analysis', icon: BarChart3, color: 'text-teal-400', bg: 'bg-teal-400/10', title: 'Profit Analysis', breadcrumb: 'Extras > Profit', keywords: ['profit', 'profit analysis', 'margin', 'gross margin', 'financial'] },
  { label: 'Sample Management', path: '/extras/samples', description: 'Track drug samples issued and distributed', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-400/10', title: 'Sample Management', breadcrumb: 'Extras > Samples', keywords: ['samples', 'sample management', 'drug sample', 'stock'] },
  { label: 'Reminders', path: '/extras/reminders', description: 'Follow-up and notification alerts', icon: Bell, color: 'text-sky-200', bg: 'bg-sky-200/10', title: 'Reminders & Alerts', breadcrumb: 'Extras > Reminders', keywords: ['reminders', 'alerts', 'notifications', 'doctor reminders'] },
  { label: 'Settings', path: '/extras/settings', description: 'App preferences & account', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'System Settings', breadcrumb: 'Extras > Settings', keywords: ['settings', 'preferences', 'configuration'] }
];

export const staticRoutes: RouteItem[] = [
  { title: 'Dashboard', path: '/dashboard', breadcrumb: 'Dashboard', keywords: ['dashboard', 'home', 'overview', 'stats', 'summary'] },
  
  // Lists Submenus
  { title: 'Doctors List', path: '/utilities/lists/doctors', breadcrumb: 'Utilities > Lists > Doctors', keywords: ['doctors list', 'doctor', 'doctors', 'dr list', 'hospital', 'specialization', 'category', 'core doctors'] },
  { title: 'Chemists List', path: '/utilities/lists/chemists', breadcrumb: 'Utilities > Lists > Chemists', keywords: ['chemists list', 'chemist', 'chemists', 'pharmacy', 'medical store', 'retailer'] },
  { title: 'Stockists List', path: '/utilities/lists/stockists', breadcrumb: 'Utilities > Lists > Stockists', keywords: ['stockists list', 'stockist', 'stockists', 'distributor', 'wholesaler', 'supply'] },
  { title: 'Call Plan Lists (Approved)', path: '/utilities/lists/call-plans', breadcrumb: 'Utilities > Lists > Call Plans', keywords: ['call plan lists', 'call plans list', 'approved call plans', 'download call plan in excel', 'call plan excel', 'cp list', 'doctor plan list', 'approved plans'] },
  { title: 'HQ / City / Local Area List', path: '/utilities/lists/locations', breadcrumb: 'Utilities > Lists > Locations', keywords: ['locations list', 'headquarter list', 'hq list', 'city list', 'local area list', 'areas'] },
  { title: 'Geo Fencing List', path: '/utilities/lists/geo-fencing', breadcrumb: 'Utilities > Lists > Geo-Fencing', keywords: ['geo fencing list', 'tagged doctors', 'geo coordinates', 'gps list'] },
  { title: 'Products List', path: '/utilities/lists/products', breadcrumb: 'Utilities > Lists > Products', keywords: ['products list', 'product list', 'medicines list', 'skus', 'brand list', 'packaging'] },
  { title: 'Gifts List', path: '/utilities/lists/gifts', breadcrumb: 'Utilities > Lists > Gifts', keywords: ['gifts list', 'promotional items', 'gift inventory', 'merchandise'] },
  { title: 'Routes List', path: '/utilities/lists/routes', breadcrumb: 'Utilities > Lists > Routes', keywords: ['routes list', 'route list', 'travel routes', 'distance', 'ex station', 'out station'] },

  // Primary & Secondary Sales Entries & All Records
  { title: 'Primary Sales Entry', path: '/extras/primary-sales', breadcrumb: 'Sales > Primary Entry', keywords: ['primary sales entry', 'add primary invoice', 'primary bill', 'stockist invoice'] },
  { title: 'All Primary Sales', path: '/extras/primary-sales/all', breadcrumb: 'Sales > All Primary Sales', keywords: ['all primary sales', 'view primary sales', 'primary sales records', 'invoices list'] },
  { title: 'Secondary Sales Entry', path: '/extras/secondary', breadcrumb: 'Sales > Secondary Entry', keywords: ['secondary sales entry', 'add secondary sale', 'secondary bill'] },
  { title: 'All Secondary Sales', path: '/extras/secondary/all', breadcrumb: 'Sales > All Secondary Sales', keywords: ['all secondary sales', 'view secondary sales', 'secondary sales records'] },

  // Approvals Breakdown
  { title: 'Call Plan Approvals', path: '/admin/approvals', breadcrumb: 'Admin > Approvals > Call Plans', keywords: ['call plan approvals', 'approve call plan', 'cp approval', 'doctor planning approval'] },
  { title: 'Tour Program Approvals', path: '/admin/approvals', breadcrumb: 'Admin > Approvals > Tour Program', keywords: ['tour program approvals', 'approve tour program', 'tp approval', 'monthly tp approval'] },
  { title: 'Expense Approvals', path: '/admin/approvals', breadcrumb: 'Admin > Approvals > Expense', keywords: ['expense approvals', 'approve expense', 'allowance approval', 'bill approval'] },
  { title: 'Leave Approvals', path: '/admin/approvals', breadcrumb: 'Admin > Approvals > Leave', keywords: ['leave approvals', 'approve leave', 'leave request approval'] },
  { title: 'Call Report Approvals', path: '/admin/approvals', breadcrumb: 'Admin > Approvals > Call Report', keywords: ['call report approvals', 'approve dcr', 'dcr approval'] },

  // Field Team Activity
  { title: 'Hierarchy', path: '/hierarchy', breadcrumb: 'Organization > Hierarchy', keywords: ['hierarchy', 'org chart', 'reporting tree', 'team members', 'chain of command'] },
  { title: "Today's Activity", path: '/todays-activity', breadcrumb: 'Activity > Today', keywords: ["today's activity", 'live tracking', 'daily activity', 'todays calls'] },
  { title: 'Consolidated Activity', path: '/consolidated-activity', breadcrumb: 'Activity > Consolidated', keywords: ['consolidated activity', 'monthly field activity', 'all activity'] },
];

export const GLOBAL_ROUTES: RouteItem[] = [
  ...staticRoutes,
  ...adminItems.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb, keywords: item.keywords })).filter(item => item.path),
  ...utilitiesOptions.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb, keywords: item.keywords })).filter(item => item.path),
  ...extrasOptions.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb, keywords: item.keywords })).filter(item => item.path),
];
