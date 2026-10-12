import { Outlet, Link } from 'react-router-dom';
import logoBlanco from '../assets/aqua-chile-logo-blanco.png'; // ajusta el nombre si lo guardaste distinto

function MainLayout() {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#FFFFFF' }}>
      <header
        className="d-flex align-items-center justify-content-between px-4 py-2"
        style={{ backgroundColor: '#445664' }}
      >
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <img src={logoBlanco} alt="AquaChile" style={{ height: '32px' }} />
        </Link>

        <div className="d-flex align-items-center gap-4">
          <button
            className="btn position-relative p-0 border-0 bg-transparent"
            style={{ color: '#FFFFFF', fontSize: '1.3rem' }}
            aria-label="Notificaciones"
          >
            🔔
            <span
              className="position-absolute top-0 start-100 translate-middle p-1 bg-info border border-light rounded-circle"
            >
              <span className="visually-hidden">Notificaciones nuevas</span>
            </span>
          </button>

          <div className="d-flex align-items-center gap-2" style={{ color: '#FFFFFF' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '28px', height: '28px', backgroundColor: '#FFFFFF', color: '#445664' }}
            >
              👤
            </div>
            <span>Administrador</span>
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;