import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ETIQUETA_ROL, ROLES, rutaInicio } from '../data/catalogos';
import logoBlanco from '../assets/aquachile-white-logo.png';
import './MainLayout.css';

// Enlaces de la barra lateral que ve cada rol. "exacto" evita que /solicitudes quede
// marcado como activo cuando se está en /solicitudes/nueva.
const INICIO = { to: '/dashboard', texto: 'Inicio', icono: 'bi-house-door' };
const MENU = {
  [ROLES.ANALISTA]: [
    INICIO,
    { to: '/solicitudes', texto: 'Solicitudes', icono: 'bi-card-list', exacto: true },
    { to: '/solicitudes/nueva', texto: 'Nueva solicitud', icono: 'bi-plus-circle' },
    { to: '/candidatos', texto: 'Candidatos', icono: 'bi-people' },
    { to: '/calendario', texto: 'Calendario', icono: 'bi-calendar3' },
  ],
  [ROLES.EVALUADOR]: [
    INICIO,
    { to: '/solicitudes', texto: 'Mis solicitudes', icono: 'bi-card-list' },
    { to: '/calendario', texto: 'Calendario', icono: 'bi-calendar3' },
  ],
  [ROLES.ADMIN]: [
    INICIO,
    { to: '/usuarios', texto: 'Usuarios', icono: 'bi-person-gear' },
    { to: '/acciones', texto: 'Historial de acciones', icono: 'bi-clock-history' },
  ],
};

function MainLayout() {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();
  const enlaces = MENU[usuarioActual?.rol] ?? [];

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link to={rutaInicio(usuarioActual?.rol)} className="app-sidebar-logo">
          <img src={logoBlanco} alt="AquaChile" />
        </Link>

        <nav className="app-sidebar-nav" aria-label="Menú principal">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.exacto}
              className={({ isActive }) => `app-sidebar-enlace ${isActive ? 'activo' : ''}`}
            >
              <i className={`bi ${enlace.icono}`} aria-hidden="true"></i>
              {enlace.texto}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-usuario">
          <div className="mb-2">
            <div className="nombre">{usuarioActual?.nombre}</div>
            <div className="rol">{ETIQUETA_ROL[usuarioActual?.rol] ?? usuarioActual?.rol}</div>
          </div>
          <button type="button" className="btn btn-sm btn-outline-light w-100" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="app-contenido">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
