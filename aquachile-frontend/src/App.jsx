import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import FormularioSolicitud from './pages/FormularioSolicitud';
import HistorialSolicitudes from './pages/HistorialSolicitudes';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solicitudes/nueva" element={<FormularioSolicitud />} />
          <Route path="/solicitudes" element={<HistorialSolicitudes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;