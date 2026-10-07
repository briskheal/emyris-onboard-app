import { 
  Building2, Users, ClipboardList, FileBarChart, DollarSign, Stethoscope, Gift, CheckSquare, CalendarDays, Settings as SettingsIcon,
  FileText, BarChart3, Receipt, MapPin, BellRing, List, Clock, PackageSearch, TrendingUp, ShoppingCart, CalendarRange, Box, Target,
  History, UserCheck, MonitorPlay, Shield, Bell
} from 'lucide-react';

export const adminItems = [
  { label: 'MANAGE LOCATIONS', icon: Building2, path: '/admin/locations', title: 'Manage Locations', breadcrumb: 'Admin > Locations' },
  { label: 'MANAGE USERS', icon: Users, path: '/admin/users', title: 'Manage Users', breadcrumb: 'Admin > Users' },
  { label: 'MANAGE PRODUCTS', icon: ClipboardList, path: '/admin/products', title: 'Manage Products', breadcrumb: 'Admin > Products' },
  { label: 'USER PERFORMANCE ANALYSIS', icon: FileBarChart, path: '/admin/user-performance-analysis', title: 'User Performance Analysis', breadcrumb: 'Admin > Performance' },
  { label: 'ALLOWANCES', icon: DollarSign, path: '/admin/expenses', title: 'Manage Expenses', breadcrumb: 'Admin > Expenses' },
  { label: 'DOCTORS, STOCKISTS & CHEMISTS', icon: Stethoscope, path: '/admin/dcs', title: 'Manage DCS', breadcrumb: 'Admin > DCS' },
  { label: 'SAMPLES & GIFTS', icon: Gift, path: '', title: 'Samples & Gifts', breadcrumb: 'Admin > Gifts' },
  { label: 'APPROVALS', icon: CheckSquare, path: '/admin/approvals', title: 'Approvals', breadcrumb: 'Admin > Approvals' },
  { label: 'MANAGE LEAVE', icon: CalendarDays, path: '/admin/leave', title: 'Manage Leave', breadcrumb: 'Admin > Leave' },
  { label: 'SETTINGS', icon: SettingsIcon, path: '/extras/settings', title: 'Admin Settings', breadcrumb: 'Admin > Settings' }
];

export const utilitiesOptions = [
  { id: 'tour-program', path: '/extras/tour-program', label: 'TOUR PROGRAM', description: 'Access detailed reports of field Tour Programs submitted by users, outlining their planned doctor visits, working areas, and daily schedule.', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Tour Program Report', breadcrumb: 'Utilities > Tour Program' },
  { id: 'call-reports', path: '/report', label: 'CALL REPORTS', description: 'Access official records of doctor, chemist, and stockist visits made by Medical Representatives, including visit dates, covered areas, and key visit details.', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10', title: 'Call Reports', breadcrumb: 'Utilities > Call Reports' },
  { label: 'REMINDER CALLS REPORTS', description: 'Reminder Calls Reports record all reminder calls, including dates and outcomes, ensuring timely follow-ups and effective communication tracking.', icon: BellRing, color: 'text-blue-400', bg: 'bg-blue-400/10', path: '', title: 'Reminder Calls', breadcrumb: 'Utilities > Reminders' },
  { id: 'missed-reports', path: '/reports/missed-reports', label: 'MISSED REPORTS', description: 'Missed Call Reports track visits made to doctors, stockists, and chemists, highlighting those missed. They help identify coverage gaps and improve follow-up efficiency.', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10', title: 'Missed Reports', breadcrumb: 'Utilities > Missed Reports' },
  { label: 'DCS DUPLICATE ENTRIES', description: 'DCS Duplicate Entries help find and fix repeated records of doctors, chemists, and stockists to keep the information accurate and organized.', icon: List, color: 'text-rose-400', bg: 'bg-rose-400/10', path: '', title: 'DCS Duplicate', breadcrumb: 'Utilities > DCS Duplicate' },
  { label: 'SALES INSIGHTS', description: 'Graphical insights of primary, secondary, and combined sales for complete visibility along with their report types User-Wise, Stockist-Wise and Headquarter-Wise.', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', path: '', title: 'Sales Insights', breadcrumb: 'Utilities > Insights' },
  { path: '/reports/primary-sales', label: 'PRIMARY SALES REPORTS', description: 'Provide detailed data on pharmaceutical sales to doctors, chemists, and stockists, including quantities and dates, helping in accurate tracking and planning.', icon: PackageSearch, color: 'text-teal-400', bg: 'bg-teal-400/10', title: 'Primary Sales Reports', breadcrumb: 'Utilities > Primary Sales' },
  { path: '/reports/secondary-sales', label: 'SECONDARY SALES REPORTS', description: 'Secondary Sales Reports track pharmaceutical product movement from stockists to retailers, including sales volumes and dates. They support monitoring distribution performance.', icon: ShoppingCart, color: 'text-lime-400', bg: 'bg-lime-400/10', title: 'Secondary Sales Reports', breadcrumb: 'Utilities > Secondary Sales' },
  { label: 'PRODUCT-WISE REPORTS', description: 'Product-Wise Reports summarize key metrics for each product, including primary and secondary quantities, free stock, and closing stock, enabling effective inventory and sales management.', icon: Box, color: 'text-amber-400', bg: 'bg-amber-400/10', path: '', title: 'Product-Wise Reports', breadcrumb: 'Utilities > Product Reports' },
  { id: 'lists', path: '/utilities/lists/doctors', label: 'LISTS', description: 'This list consolidates essential data such as doctors, chemists, stockists, products, gifts, routes, holidays, and geofencing details, streamlining field management and operational planning.', icon: ClipboardList, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', title: 'Lists (Doctors, etc.)', breadcrumb: 'Utilities > Lists' },
  { label: 'TARGET', description: 'Target Reports summarize product-wise sales targets, including amount and quantity, helping track progress and ensure goal achievement.', icon: Target, color: 'text-pink-400', bg: 'bg-pink-400/10', path: '', title: 'Targets', breadcrumb: 'Utilities > Targets' },
  { label: 'POB REPORTS', description: 'POB Reports track the details of Products on Booking, including quantities and value, providing insights into order status and sales performance.', icon: Receipt, color: 'text-purple-400', bg: 'bg-purple-400/10', path: '', title: 'POB Reports', breadcrumb: 'Utilities > POB' },
  { label: 'MONTHLY REPORTS', description: 'Monthly Call Reports summarize all calls made by field staff to doctors, chemists, and stockists, highlighting call frequency and outcomes to assess engagement and performance.', icon: CalendarRange, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '', title: 'Monthly Reports', breadcrumb: 'Utilities > Monthly' },
  { label: 'ANNUAL REPORTS', description: 'Annual Call Reports summarize yearly calls made by field staff to doctors, chemists, and stockists, highlighting call frequency and outcomes to assess engagement and performance.', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '', title: 'Annual Reports', breadcrumb: 'Utilities > Annual' },
  { label: 'GEO-LOCATION ANALYSIS REPORT', description: 'Geo-Location Analysis Report tracks and analyzes the geographic locations of field activities, helping optimize routes, monitor coverage, and improve overall field efficiency.', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '', title: 'Geo-Location Analysis', breadcrumb: 'Utilities > Geo-Location' },
  { label: 'EXPENSE REPORTS', description: 'Expense Reports record field-related expenses such as food, travel tickets, hotel stays, and other costs, enabling effective budget management and cost control.', icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '', title: 'Expense Reports', breadcrumb: 'Utilities > Expenses' },
];

export const extrasOptions = [
  { label: 'Leave Request', path: '/extras/leave', description: 'Apply for leaves & track status', icon: CalendarDays, color: 'text-emerald-400', bg: 'bg-emerald-400/10', title: 'Leave Request', breadcrumb: 'Extras > Leave Request' },
  { label: 'Geo Fencing', path: '/extras/geo-fencing', description: 'Geo-tag doctors & clinic locations', icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500/10', title: 'Geo-Fencing', breadcrumb: 'Extras > Geo-Fencing' },
  { label: 'Expense', path: '/extras/expense', description: 'Submit and track travel expenses', icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-400/10', title: 'Expense Entry', breadcrumb: 'Extras > Expense' },
  { label: 'Backlog Reporting', path: '/extras/backlog', description: 'Submit missed call reports', icon: History, color: 'text-sky-500', bg: 'bg-sky-500/10', title: 'Backlog Report', breadcrumb: 'Extras > Backlog' },
  { label: 'Attendance', path: '/extras', description: 'Daily attendance & punch-in', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-400/10', title: 'Attendance', breadcrumb: 'Extras > Attendance' },
  { label: 'eDetailing', path: '/extras', description: 'Interactive product detailing', icon: MonitorPlay, color: 'text-slate-300', bg: 'bg-slate-300/10', isNew: true, title: 'E-Detailing', breadcrumb: 'Extras > E-Detailing' },
  { label: 'Settings', path: '/extras/settings', description: 'App preferences & account', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Settings', breadcrumb: 'Extras > Settings' },
  { label: 'User Performance Analysis', path: '/extras/performance', description: 'View sales & call metrics', icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10', isNew: true, title: 'Performance Menu', breadcrumb: 'Extras > Performance' },
  { label: 'Reminders', path: '/extras', description: 'Follow-up and notification alerts', icon: Bell, color: 'text-sky-200', bg: 'bg-sky-200/10', title: 'Reminders', breadcrumb: 'Extras > Reminders' }
];

export const staticRoutes = [
  { title: 'Dashboard', path: '/dashboard', breadcrumb: 'Dashboard' },
  { title: 'Primary Sales Entry', path: '/extras/primary-sales', breadcrumb: 'Sales > Primary Entry' },
  { title: 'All Primary Sales', path: '/extras/primary-sales/all', breadcrumb: 'Sales > All Primary' },
  { title: 'Secondary Sales Entry', path: '/extras/secondary', breadcrumb: 'Sales > Secondary Entry' },
  { title: 'All Secondary Sales', path: '/extras/secondary/all', breadcrumb: 'Sales > All Secondary' },
  { title: 'Hierarchy', path: '/hierarchy', breadcrumb: 'Hierarchy' },
  { title: 'Todays Activity', path: '/todays-activity', breadcrumb: 'Activity > Today' },
  { title: 'Consolidated Activity', path: '/consolidated-activity', breadcrumb: 'Activity > Consolidated' },
  { title: 'Call Report', path: '/report', breadcrumb: 'Report' },
  { title: 'Chemists List', path: '/utilities/lists/chemists', breadcrumb: 'Utilities > Chemists' },
  { title: 'Stockists List', path: '/utilities/lists/stockists', breadcrumb: 'Utilities > Stockists' },
  { title: 'Locations List', path: '/utilities/lists/locations', breadcrumb: 'Utilities > Locations' },
  { title: 'Products List', path: '/utilities/lists/products', breadcrumb: 'Utilities > Products' },
  { title: 'Geo-Fencing List', path: '/utilities/lists/geo-fencing', breadcrumb: 'Utilities > Geo-Fencing' },
  { title: 'Gifts List', path: '/utilities/lists/gifts', breadcrumb: 'Utilities > Gifts' },
  { title: 'Routes List', path: '/utilities/lists/routes', breadcrumb: 'Utilities > Routes' },
];

export const GLOBAL_ROUTES = [
  ...staticRoutes,
  ...adminItems.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb })).filter(item => item.path),
  ...utilitiesOptions.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb })).filter(item => item.path),
  ...extrasOptions.map(item => ({ title: item.title, path: item.path, breadcrumb: item.breadcrumb })).filter(item => item.path),
];
