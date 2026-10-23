import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreationMenu from './pages/CreationMenu';
import ApprovalsLanding from './pages/creation/ApprovalsLanding';
import ApprovalDetail from './pages/creation/ApprovalDetail';
import DoctorForm from './pages/creation/DoctorForm';
import DoctorProfile from './pages/creation/DoctorProfile';
import ChemistForm from './pages/creation/ChemistForm';
import StockistForm from './pages/creation/StockistForm';
import PrimarySalesForm from './pages/creation/PrimarySalesForm';
import PrimarySalesHistory from './pages/creation/PrimarySalesHistory';
import SecondarySalesForm from './pages/creation/SecondarySalesForm';
import SecondarySalesHistory from './pages/creation/SecondarySalesHistory';
import CityForm from './pages/creation/CityForm';
import RouteForm from './pages/creation/RouteForm';
import Extras from './pages/Extras';
import TourProgram from './pages/TourProgram';
import Attendance from './pages/extras/Attendance';
import CallPlan from './pages/extras/CallPlan';
import Backlog from './pages/extras/Backlog';
import LeaveRequest from './pages/extras/LeaveRequest';
import Expense from './pages/extras/Expense';
import GeoFencingMenu from './pages/extras/GeoFencingMenu';
import GeoFencingTag from './pages/extras/GeoFencingTag';
import GeoFencingTagged from './pages/extras/GeoFencingTagged';
import PerformanceMenu from './pages/extras/performance/PerformanceMenu';
import TargetAnalysisReport from './pages/extras/performance/TargetAnalysisReport';
import EffortAnalysisReport from './pages/extras/performance/EffortAnalysisReport';
import Utilities from './pages/Utilities';
import DailyCallReport from './pages/DailyCallReport';
import QuickReports from './pages/utilities/QuickReports';
import CallReportsView from './pages/utilities/CallReportsView';
import AnalysisReportsView from './pages/utilities/AnalysisReportsView';
import ReminderReportsView from './pages/utilities/ReminderReportsView';
import ListsView from './pages/utilities/ListsView';
import MissedReportsView from './pages/utilities/MissedReportsView';
import PrimarySalesReportView from './pages/utilities/PrimarySalesReportView';
import SalesInsightsView from './pages/utilities/SalesInsightsView';
import SecondarySalesReportView from './pages/utilities/SecondarySalesReportView';
import PobReportsView from './pages/utilities/PobReportsView';
import MonthlyReportsView from './pages/utilities/MonthlyReportsView';
import SampleManagementView from './pages/utilities/SampleManagementView';
import GiftManagementView from './pages/utilities/GiftManagementView';
import TargetsView from './pages/utilities/TargetsView';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('xl_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, []);

  return (
    <BrowserRouter basename="/xl">
      <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
          <Route path="creation" element={<CreationMenu />} />
          <Route path="creation/doctor" element={<DoctorForm />} />
          <Route path="creation/doctor-profile" element={<DoctorProfile />} />
          <Route path="creation/chemist" element={<ChemistForm />} />
          <Route path="creation/stockist" element={<StockistForm />} />
          <Route path="creation/primary-sales" element={<PrimarySalesForm />} />
          <Route path="creation/primary-sales/history" element={<PrimarySalesHistory />} />
          <Route path="creation/secondary-sales" element={<SecondarySalesForm />} />
          <Route path="creation/secondary-sales/history" element={<SecondarySalesHistory />} />
          <Route path="creation/city" element={<CityForm />} />
          <Route path="creation/route" element={<RouteForm />} />
          <Route path="creation/approvals" element={<ApprovalsLanding />} />
          <Route path="creation/approvals/:type" element={<ApprovalDetail />} />
          <Route path="extras" element={<Extras />} />
          <Route path="extras/tour-program" element={<TourProgram />} />
          <Route path="extras/attendance" element={<Attendance />} />
          <Route path="extras/call-plan" element={<CallPlan />} />
          <Route path="extras/backlog" element={<Backlog />} />
          <Route path="extras/leave" element={<LeaveRequest />} />
          <Route path="extras/expense" element={<Expense />} />
          <Route path="extras/geo-fencing" element={<GeoFencingMenu />} />
          <Route path="extras/geo-fencing/tag/:type" element={<GeoFencingTag />} />
          <Route path="extras/geo-fencing/tagged" element={<GeoFencingTagged />} />
          <Route path="extras/performance" element={<PerformanceMenu />} />
          <Route path="extras/performance/targets/:kpiId" element={<TargetAnalysisReport />} />
          <Route path="extras/performance/effort" element={<EffortAnalysisReport />} />
          <Route path="report" element={<DailyCallReport />} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="utilities/quick-reports" element={<QuickReports />} />
          <Route path="utilities/call-reports" element={<CallReportsView />} />
          <Route path="utilities/analysis-reports" element={<AnalysisReportsView />} />
          <Route path="utilities/reminder-calls" element={<ReminderReportsView />} />
          <Route path="utilities/lists" element={<ListsView />} />
          <Route path="utilities/missed-reports" element={<MissedReportsView />} />
          <Route path="utilities/primary-sales" element={<PrimarySalesReportView />} />
          <Route path="utilities/sales-insights" element={<SalesInsightsView />} />
          <Route path="utilities/secondary-sales" element={<SecondarySalesReportView />} />
          <Route path="utilities/pob-reports" element={<PobReportsView />} />
          <Route path="utilities/monthly-reports" element={<MonthlyReportsView />} />
          <Route path="utilities/samples" element={<SampleManagementView />} />
          <Route path="utilities/gifts" element={<GiftManagementView />} />
          <Route path="utilities/targets" element={<TargetsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
