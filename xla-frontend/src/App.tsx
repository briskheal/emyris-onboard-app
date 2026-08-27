import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Extras from './pages/Extras';
import TourProgram from './pages/TourProgram';
import CallPlan from './pages/CallPlan';
import LeaveRequest from './pages/LeaveRequest';
import GeoFencing from './pages/GeoFencing';
import Expense from './pages/Expense';
import Backlog from './pages/Backlog';
import Settings from './pages/Settings';
import PerformanceMenu from './pages/PerformanceMenu';
import AdminMenu from './pages/AdminMenu';
import Utilities from './pages/Utilities';
import CallReport from './pages/CallReport';
import Hierarchy from './pages/Hierarchy';
import TodaysActivity from './pages/TodaysActivity';
import ConsolidatedActivity from './pages/ConsolidatedActivity';
import EDetailing from './pages/EDetailing';
import PrimarySales from './pages/PrimarySales';
import SecondarySales from './pages/SecondarySales';
import Attendance from './pages/Attendance';
import Reminders from './pages/Reminders';
import CRM from './pages/CRM';
import ProfitAnalysis from './pages/ProfitAnalysis';
import SampleManagement from './pages/SampleManagement';
import ManageLocations from './pages/ManageLocations';
import ManageUsers from './pages/ManageUsers';
import ManageProducts from './pages/ManageProducts';
import ManageAllowances from './pages/ManageAllowances';
import ManageDCS from './pages/ManageDCS';
import Approvals from './pages/Approvals';

function App() {
  return (
    <BrowserRouter basename="/xla">
      <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/locations" element={<ManageLocations />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/expenses" element={<ManageAllowances />} />
          <Route path="/admin/dcs" element={<ManageDCS />} />
          <Route path="/admin/approvals" element={<Approvals />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
          <Route path="extras" element={<Extras />} />
          <Route path="extras/tour-program" element={<TourProgram />} />
          <Route path="extras/call-plan" element={<CallPlan />} />
          <Route path="extras/leave" element={<LeaveRequest />} />
          <Route path="extras/geo-fencing" element={<GeoFencing />} />
          <Route path="extras/expense" element={<Expense />} />
          <Route path="extras/backlog" element={<Backlog />} />
          <Route path="extras/settings" element={<Settings />} />
          <Route path="extras/performance" element={<PerformanceMenu />} />
          <Route path="extras/e-detailing" element={<EDetailing />} />
          <Route path="extras/primary-sales" element={<PrimarySales />} />
          <Route path="extras/secondary" element={<SecondarySales />} />
          <Route path="report" element={<CallReport />} />
          <Route path="admin" element={<AdminMenu />} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="hierarchy" element={<Hierarchy />} />
          <Route path="todays-activity" element={<TodaysActivity />} />
          <Route path="consolidated-activity" element={<ConsolidatedActivity />} />
          <Route path="extras/attendance" element={<Attendance />} />
          <Route path="extras/reminders" element={<Reminders />} />
          <Route path="extras/crm" element={<CRM />} />
          <Route path="extras/profit" element={<ProfitAnalysis />} />
          <Route path="extras/samples" element={<SampleManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
