import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreationMenu from './pages/CreationMenu';
import DoctorForm from './pages/creation/DoctorForm';
import ChemistForm from './pages/creation/ChemistForm';
import StockistForm from './pages/creation/StockistForm';
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

function App() {
  return (
    <BrowserRouter basename="/xl">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="creation" element={<CreationMenu />} />
          <Route path="creation/doctor" element={<DoctorForm />} />
          <Route path="creation/chemist" element={<ChemistForm />} />
          <Route path="creation/stockist" element={<StockistForm />} />
          <Route path="creation/city" element={<CityForm />} />
          <Route path="creation/route" element={<RouteForm />} />
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
          <Route path="utilities" element={<Utilities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
