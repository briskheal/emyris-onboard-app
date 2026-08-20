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

function App() {
  return (
    <BrowserRouter basename="/xla">
      <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
