import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import FormularioSolicitud from './pages/FormularioSolicitud';
import HistorialSolicitudes from './pages/HistorialSolicitudes';
import DetalleSolicitud from './pages/DetalleSolicitud';
import Candidatos from './pages/Candidatos';
import Usuarios from './pages/Usuarios';
import HistorialAcciones from './pages/HistorialAcciones';
import Dashboard from './pages/Dashboard';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import RestablecerPassword from './pages/RestablecerPassword';
import { ROLES, rutaInicio } from './data/catalogos';

// Página de entrada: con sesión, el dashboard; sin sesión, el login.
function Inicio() {
  const { usuarioActual } = useAuth();
  return <Navigate to={usuarioActual ? rutaInicio(usuarioActual.rol) : '/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />

          {/* Todo lo demás exige sesión; cada grupo indica qué roles pueden entrar */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* El dashboard es la página de inicio de los tres roles */}
            <Route path="/dashboard" element={<Dashboard />} />

            <Route element={<ProtectedRoute roles={[ROLES.ANALISTA, ROLES.EVALUADOR]} />}>
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/solicitudes" element={<HistorialSolicitudes />} />
              <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.ANALISTA]} />}>
              <Route path="/solicitudes/nueva" element={<FormularioSolicitud />} />
              <Route path="/candidatos" element={<Candidatos />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/acciones" element={<HistorialAcciones />} />
              <Route path="/acciones/:usuarioId" element={<HistorialAcciones />} />
            </Route>
          </Route>

          <Route path="*" element={<Inicio />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
