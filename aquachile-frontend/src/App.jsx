import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import FormularioSolicitud from './pages/FormularioSolicitud';
import HistorialSolicitudes from './pages/HistorialSolicitudes';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/solicitudes/nueva" replace />} />
          <Route path="/solicitudes/nueva" element={<FormularioSolicitud />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/solicitudes" element={<HistorialSolicitudes />} />
          </Route>

          {/* Cualquier otra URL vuelve al formulario */}
          <Route path="*" element={<Navigate to="/solicitudes/nueva" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;