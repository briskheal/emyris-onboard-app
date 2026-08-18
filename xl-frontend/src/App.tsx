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
          <Route path="utilities" element={<Utilities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
