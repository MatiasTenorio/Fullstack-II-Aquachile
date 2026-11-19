import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { ESTADOS_UI, ETIQUETA_MODALIDAD, ETIQUETA_ROL, ROLES } from '../data/catalogos';
import { capitalizar, formatearFechaHora } from '../utils/fechas';
import './Dashboard.css';

// Accesos rápidos de cada rol: los atajos a lo que más se usa.
const ACCESOS = {
  [ROLES.ANALISTA]: [
    { to: '/solicitudes/nueva', icono: 'bi-plus-circle', titulo: 'Nueva solicitud', detalle: 'Crear una solicitud de evaluación' },
    { to: '/candidatos', icono: 'bi-person-plus', titulo: 'Registrar candidato', detalle: 'Agregar o editar candidatos' },
    { to: '/solicitudes', icono: 'bi-card-list', titulo: 'Solicitudes', detalle: 'Revisar el estado de cada una' },
    { to: '/calendario', icono: 'bi-calendar3', titulo: 'Calendario', detalle: 'Entrevistas agendadas' },
  ],
  [ROLES.EVALUADOR]: [
    { to: '/solicitudes?estado=PENDIENTE', icono: 'bi-calendar-plus', titulo: 'Por agendar', detalle: 'Solicitudes que esperan entrevista' },
    { to: '/solicitudes', icono: 'bi-card-list', titulo: 'Mis solicitudes', detalle: 'Todas las que tengo asignadas' },
    { to: '/calendario', icono: 'bi-calendar3', titulo: 'Calendario', detalle: 'Mis entrevistas' },
  ],
  [ROLES.ADMIN]: [
    { to: '/usuarios', icono: 'bi-person-gear', titulo: 'Usuarios', detalle: 'Crear cuentas y asignar roles' },
    { to: '/acciones', icono: 'bi-clock-history', titulo: 'Historial de acciones', detalle: 'Qué hizo cada usuario y cuándo' },
  ],
};

function Contador({ numero, etiqueta, color, to }) {
  const contenido = (
    <>
      <div className="numero">{numero}</div>
      <div className="etiqueta">
        {color && <span className="marca" style={{ backgroundColor: color }}></span>}
        {etiqueta}
      </div>
    </>
  );
  return to
    ? <Link to={to} className="contador" aria-label={`${etiqueta}: ${numero}`}>{contenido}</Link>
    : <div className="contador">{contenido}</div>;
}

// Página de inicio. Muestra los accesos rápidos y los indicadores del rol de quien entra.
function Dashboard() {
  const { api, usuarioActual } = useAuth();
  const rol = usuarioActual?.rol;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    api('/dashboard')
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta);
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los indicadores.');
      });
    return () => {
      cancelado = true;
    };
  }, [api]);

  const accesos = ACCESOS[rol] ?? [];
  const porEstado = datos?.solicitudesPorEstado;
  const proximas = datos?.proximasEntrevistas;
  const usuariosPorRol = datos?.usuariosPorRol;
  const hoy = capitalizar(new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }));

  return (
    <div className="container py-4 text-start">
      <h2 className="inicio-titulo mb-0">Hola, {usuarioActual?.nombre}</h2>
      <p className="text-muted">{ETIQUETA_ROL[rol] ?? rol} · {hoy}</p>

      <h3 className="inicio-seccion">Accesos rápidos</h3>
      <div className="row g-3">
        {accesos.map((acceso) => (
          <div key={acceso.to} className="col-sm-6 col-lg-3">
            <Link to={acceso.to} className="acceso-rapido">
              <i className={`bi ${acceso.icono}`} aria-hidden="true"></i>
              <div>
                <div className="titulo">{acceso.titulo}</div>
                <div className="detalle">{acceso.detalle}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger py-2 mt-4" role="alert">{error}</div>}
      {!datos && !error && <p className="text-muted mt-4">Cargando indicadores...</p>}

      {porEstado && (
        <>
          <h3 className="inicio-seccion">
            {rol === ROLES.EVALUADOR ? 'Mis solicitudes por estado' : 'Solicitudes por estado'}
          </h3>
          <div className="row g-3">
            {Object.entries(ESTADOS_UI).map(([estado, ui]) => (
              <div key={estado} className="col-6 col-md-4 col-xl">
                <Contador
                  numero={porEstado[estado] ?? 0}
                  etiqueta={ui.etiqueta}
                  color={ui.text}
                  to={`/solicitudes?estado=${estado}`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {datos && rol === ROLES.ANALISTA && (
        <div className="row g-3 mt-0">
          <div className="col-6 col-md-4 col-xl-3">
            <Contador numero={datos.totalCandidatos ?? 0} etiqueta="Candidatos registrados" to="/candidatos" />
          </div>
          <div className="col-6 col-md-4 col-xl-3">
            <Contador numero={datos.solicitudesSinAsignar ?? 0} etiqueta="Solicitudes abiertas sin evaluador" />
          </div>
        </div>
      )}

      {datos && rol === ROLES.EVALUADOR && (
        <div className="row g-3 mt-0">
          <div className="col-6 col-md-4 col-xl-3">
            <Contador
              numero={datos.solicitudesSinInforme ?? 0}
              etiqueta="En proceso sin informe"
              to="/solicitudes?estado=EN_PROCESO"
            />
          </div>
        </div>
      )}

      {proximas && (
        <>
          <h3 className="inicio-seccion">Próximas entrevistas</h3>
          {proximas.length === 0 && <p className="text-muted">No hay entrevistas agendadas.</p>}
          {proximas.map((e) => (
            <Link key={e.id} to={`/solicitudes/${e.solicitudId}`} className="proxima-entrevista">
              <div className="cuando">{formatearFechaHora(e.inicio)}</div>
              <div>
                <div className="fw-semibold">{e.candidatoNombre}</div>
                <div className="detalle">
                  {e.cargo} · {ETIQUETA_MODALIDAD[e.modalidad] ?? e.modalidad}
                  {rol === ROLES.ANALISTA && e.evaluadorNombre && <> · {e.evaluadorNombre}</>}
                </div>
              </div>
            </Link>
          ))}
          {proximas.length > 0 && <Link to="/calendario">Ver el calendario completo</Link>}
        </>
      )}

      {usuariosPorRol && (
        <>
          <h3 className="inicio-seccion">Cuentas del sistema</h3>
          <div className="row g-3">
            {Object.values(ROLES).map((valor) => (
              <div key={valor} className="col-6 col-md-3">
                <Contador numero={usuariosPorRol[valor] ?? 0} etiqueta={`${ETIQUETA_ROL[valor]} (activos)`} />
              </div>
            ))}
            <div className="col-6 col-md-3">
              <Contador numero={datos.usuariosInactivos ?? 0} etiqueta="Cuentas inactivas" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
