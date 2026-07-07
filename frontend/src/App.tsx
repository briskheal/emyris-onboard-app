import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApplicantPortal from './pages/ApplicantPortal';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicantPortal />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
