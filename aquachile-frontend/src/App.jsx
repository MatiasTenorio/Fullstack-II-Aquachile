import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HistorialSolicitudes />} />
            <Route path="/solicitudes/nueva" element={<FormularioSolicitud />} />
            <Route path="/solicitudes" element={<HistorialSolicitudes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;