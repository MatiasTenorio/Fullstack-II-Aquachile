import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL } from '../data/catalogos';
import logoBlanco from '../assets/aquachile-white-logo.png'; // ajusta el nombre si lo guardaste distinto

function MainLayout() {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#FFFFFF' }}>
      <header
        className="d-flex align-items-center justify-content-between px-4 py-2"
        style={{ backgroundColor: '#445664' }}
      >
        <Link to="/solicitudes" className="d-flex align-items-center text-decoration-none">
          <img src={logoBlanco} alt="AquaChile" style={{ height: '32px' }} />
        </Link>

        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-2" style={{ color: '#FFFFFF' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '28px', height: '28px', backgroundColor: '#FFFFFF', color: '#445664' }}
            >
              👤
            </div>
            <div className="d-flex flex-column lh-sm">
              <span>{usuarioActual?.nombre}</span>
              <small style={{ opacity: 0.75 }}>{ETIQUETA_ROL[usuarioActual?.rol] ?? usuarioActual?.rol}</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
