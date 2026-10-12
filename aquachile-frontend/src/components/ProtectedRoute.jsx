import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { usuarioActual } = useAuth();
  return usuarioActual ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;