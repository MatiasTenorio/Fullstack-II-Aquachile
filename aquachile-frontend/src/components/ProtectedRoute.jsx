import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rutaInicio } from '../data/catalogos';

// Sin sesión manda al login. Si se indica "roles" y el usuario no tiene uno de ellos,
// lo devuelve a su pantalla de inicio en vez de mostrarle una página que el backend le negaría.
function ProtectedRoute({ children, roles }) {
  const { usuarioActual } = useAuth();
  if (!usuarioActual) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuarioActual.rol)) {
    return <Navigate to={rutaInicio(usuarioActual.rol)} replace />;
  }
  return children ?? <Outlet />;
}

export default ProtectedRoute;
