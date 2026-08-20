import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Extras from './pages/Extras';
import AdminMenu from './pages/AdminMenu';
import Utilities from './pages/Utilities';
import CallReport from './pages/CallReport';
import Hierarchy from './pages/Hierarchy';
import TodaysActivity from './pages/TodaysActivity';
import ConsolidatedActivity from './pages/ConsolidatedActivity';

function App() {
  return (
    <BrowserRouter basename="/xla">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="extras" element={<Extras />} />
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
