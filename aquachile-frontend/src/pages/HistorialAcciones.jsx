import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { CATEGORIAS_ACCION, ETIQUETA_ROL } from '../data/catalogos';
import { formatearFechaHora } from '../utils/fechas';
import './HistorialAcciones.css';

const FILTROS_ESTADO = { todos: 'Todos', activos: 'Activos', inactivos: 'Inactivos' };

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

// Pantalla del administrador: a la izquierda los usuarios (activos e inactivos) y, al elegir uno,
// a la derecha su historial de acciones con los motivos de pausas y cancelaciones.
function HistorialAcciones() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { usuarioId } = useParams();

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [historial, setHistorial] = useState(null); // { usuario, acciones, pagina, totalPaginas, total }
  const [categoria, setCategoria] = useState('');
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  useEffect(() => {
    let cancelado = false;
    api('/usuarios')
      .then((lista) => {
        if (!cancelado) setUsuarios(lista);
      })
      .catch((e) => {
        if (!cancelado) setErrorUsuarios(e instanceof ApiError ? e.message : 'No se pudo cargar la lista de usuarios.');
      })
      .finally(() => {
        if (!cancelado) setCargandoUsuarios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [api]);

  // Primera página del historial cada vez que cambia el usuario elegido o la categoría.
  useEffect(() => {
    setHistorial(null);
    setErrorHistorial('');
    if (!usuarioId) return undefined;
    let cancelado = false;
    const consulta = categoria ? `?categoria=${categoria}` : '';
    setCargandoHistorial(true);
    api(`/usuarios/${usuarioId}/acciones${consulta}`)
      .then((datos) => {
        if (!cancelado) setHistorial(datos);
      })
      .catch((e) => {
        if (!cancelado) setErrorHistorial(e instanceof ApiError ? e.message : 'No se pudo cargar el historial.');
      })
      .finally(() => {
        if (!cancelado) setCargandoHistorial(false);
      });
    return () => {
      cancelado = true;
    };
  }, [api, usuarioId, categoria]);

  // Agrega la página siguiente al final de la lista
  const cargarMas = async () => {
    const parametros = new URLSearchParams({ pagina: String(historial.pagina + 1) });
    if (categoria) parametros.set('categoria', categoria);
    setCargandoHistorial(true);
    try {
      const siguiente = await api(`/usuarios/${usuarioId}/acciones?${parametros}`);
      setHistorial((actual) => ({ ...siguiente, acciones: [...actual.acciones, ...siguiente.acciones] }));
    } catch (e) {
      setErrorHistorial(e instanceof ApiError ? e.message : 'No se pudieron cargar más acciones.');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const visibles = usuarios.filter((u) => {
    if (filtroEstado === 'activos' && !u.activo) return false;
    if (filtroEstado === 'inactivos' && u.activo) return false;
    return !texto || `${u.nombre} ${u.email}`.toLowerCase().includes(texto);
  });

  const usuario = historial?.usuario;
  const hayMas = historial && historial.pagina + 1 < historial.totalPaginas;

  return (
    <div className="container-fluid py-4 px-4 text-start">
      <h2 className="fw-bold" style={{ color: '#445664' }}>Historial de acciones</h2>
      <p className="text-muted">Elige un usuario para ver qué hizo en el sistema y cuándo.</p>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="d-flex gap-2 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar usuario"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className="form-select w-auto"
              aria-label="Filtrar por estado de la cuenta"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {Object.entries(FILTROS_ESTADO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>

          {errorUsuarios && <div className="alert alert-danger py-2" role="alert">{errorUsuarios}</div>}
          {cargandoUsuarios && <p className="text-muted">Cargando usuarios...</p>}
          {!cargandoUsuarios && !errorUsuarios && visibles.length === 0 && (
            <p className="text-muted">Ningún usuario coincide con la búsqueda.</p>
          )}

          <div className="acciones-usuarios">
            {visibles.map((u) => (
              <button
                type="button"
                key={u.id}
                className={`acciones-usuario ${String(u.id) === usuarioId ? 'seleccionado' : ''}`}
                aria-pressed={String(u.id) === usuarioId}
                onClick={() => {
                  // El filtro de tipo de acción es por usuario: al cambiar de usuario se vuelve a "Todas"
                  setCategoria('');
                  navigate(`/acciones/${u.id}`);
                }}
              >
                <span className="acciones-avatar">{iniciales(u.nombre)}</span>
                <span className="flex-grow-1 text-truncate">
                  <span className="d-flex justify-content-between gap-2">
                    <strong className="text-truncate">{u.nombre}</strong>
                    <span className={`acciones-estado ${u.activo ? 'activo' : ''}`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </span>
                  <span className="d-block small text-muted text-truncate">{ETIQUETA_ROL[u.rol] ?? u.rol} · {u.email}</span>
                  <span className="d-block small text-muted">
                    {u.ultimaActividad ? `Última actividad: ${formatearFechaHora(u.ultimaActividad)}` : 'Sin actividad registrada'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-8">
          {!usuarioId && (
            <div className="acciones-vacio">
              <i className="bi bi-clock-history" aria-hidden="true"></i>
              <p className="mb-0">Elige un usuario de la lista para ver su historial de acciones.</p>
            </div>
          )}

          {usuarioId && (
            <div className="acciones-panel">
              {usuario && (
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h3 className="h5 fw-bold mb-0" style={{ color: '#1b2f4b' }}>{usuario.nombre}</h3>
                    <div className="small text-muted">
                      {ETIQUETA_ROL[usuario.rol] ?? usuario.rol} · {usuario.email} · {usuario.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
                    </div>
                  </div>
                  <select
                    className="form-select form-select-sm w-auto"
                    aria-label="Filtrar por tipo de acción"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Todas las acciones</option>
                    {Object.entries(CATEGORIAS_ACCION).map(([valor, ui]) => (
                      <option key={valor} value={valor}>{ui.etiqueta}</option>
                    ))}
                  </select>
                </div>
              )}

              {errorHistorial && <div className="alert alert-danger py-2" role="alert">{errorHistorial}</div>}
              {historial && historial.acciones.length === 0 && (
                <p className="text-muted">
                  {categoria ? 'Este usuario no tiene acciones de este tipo.' : 'Este usuario todavía no tiene acciones registradas.'}
                </p>
              )}
              {historial && historial.acciones.length > 0 && (
                <p className="small text-muted">
                  {historial.total} {historial.total === 1 ? 'acción' : 'acciones'}, de la más reciente a la más antigua.
                </p>
              )}

              <ul className="acciones-lista">
                {historial?.acciones.map((a) => {
                  const ui = CATEGORIAS_ACCION[a.categoria] ?? { etiqueta: a.categoria, bg: '#e9ecef', text: '#495057' };
                  return (
                    <li key={a.id}>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="acciones-fecha">{formatearFechaHora(a.fecha)}</span>
                        <span className="badge rounded-pill" style={{ backgroundColor: ui.bg, color: ui.text }}>{ui.etiqueta}</span>
                        {a.solicitudId && <span className="small text-muted">Solicitud #{a.solicitudId}</span>}
                      </div>
                      <div>{a.descripcion}</div>
                      {a.motivo && (
                        <div className="acciones-motivo">
                          <strong>Motivo:</strong> {a.motivo}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {cargandoHistorial && <p className="text-muted">Cargando historial...</p>}
              {hayMas && !cargandoHistorial && (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cargarMas}>
                  Cargar más acciones
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistorialAcciones;
