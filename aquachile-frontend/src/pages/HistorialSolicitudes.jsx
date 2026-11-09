import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError, guardarArchivo } from '../services/api';
import { ESTADOS_UI, FAMILIAS_CARGO, NOMBRES_CARGO } from '../data/catalogos';

const TODAS_FAMILIAS = 'Todas las familias';
const TODOS_CARGOS = 'Todos los cargos';
const POR_PAGINA = 10;

function obtenerIniciales(nombreCompleto) {
  const partes = nombreCompleto.trim().split(' ');
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function HistorialSolicitudes() {
  const navigate = useNavigate();
  const { api, descargar } = useAuth();

  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [familiaFiltro, setFamiliaFiltro] = useState(TODAS_FAMILIAS);
  const [cargoFiltro, setCargoFiltro] = useState(TODOS_CARGOS);

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [descargandoId, setDescargandoId] = useState(null);

  // Espera a que la persona deje de escribir antes de consultar al backend.
  useEffect(() => {
    const espera = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => clearTimeout(espera);
  }, [busqueda]);

  // Los filtros se aplican en el backend.
  useEffect(() => {
    let cancelado = false;
    const params = new URLSearchParams();
    if (busquedaAplicada) params.set('busqueda', busquedaAplicada);
    if (familiaFiltro !== TODAS_FAMILIAS) params.set('familiaCargo', familiaFiltro);
    if (cargoFiltro !== TODOS_CARGOS) params.set('cargo', cargoFiltro);
    const consulta = params.toString();

    setCargando(true);
    api(`/solicitudes${consulta ? `?${consulta}` : ''}`)
      .then((datos) => {
        if (cancelado) return;
        setSolicitudes(datos);
        setError('');
        setPagina(1);
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el historial.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [api, busquedaAplicada, familiaFiltro, cargoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(solicitudes.length / POR_PAGINA));
  const visibles = solicitudes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const descargarCv = async (e, solicitud) => {
    e.stopPropagation();
    setDescargandoId(solicitud.id);
    try {
      const { blob, nombre } = await descargar(`/solicitudes/${solicitud.id}/cv`);
      guardarArchivo(blob, nombre);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo descargar el CV.');
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold" style={{ color: '#445664' }}>Historial de solicitudes</h2>
      <p className="text-muted">Revisa el listado de candidatos que han postulado a los distintos puestos de trabajo.</p>

      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, cargo o familia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={familiaFiltro} onChange={(e) => setFamiliaFiltro(e.target.value)}>
            {[TODAS_FAMILIAS, ...FAMILIAS_CARGO].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={cargoFiltro} onChange={(e) => setCargoFiltro(e.target.value)}>
            {[TODOS_CARGOS, ...NOMBRES_CARGO].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr style={{ color: '#445664' }}>
              <th>Candidato</th>
              <th>Cargo</th>
              <th>Familia del Cargo</th>
              <th>Estado</th>
              <th>CV</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((s) => {
              const estado = ESTADOS_UI[s.estado] ?? { etiqueta: s.estado, bg: '#e9ecef', text: '#495057' };
              return (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/solicitudes/${s.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-semibold"
                        style={{ width: '40px', height: '40px', backgroundColor: '#445664', color: '#FFFFFF', flexShrink: 0 }}
                      >
                        {obtenerIniciales(s.candidatoNombre)}
                      </div>
                      <div>
                        <div className="fw-semibold">{s.candidatoNombre}</div>
                        <div className="text-muted small">{s.candidatoCorreo ?? 'Sin correo registrado'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.cargo}</td>
                  <td>{s.familiaCargo}</td>
                  <td>
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={{ backgroundColor: estado.bg, color: estado.text }}
                    >
                      {estado.etiqueta}
                    </span>
                  </td>
                  <td>
                    <button
                      className="CVDownload"
                      style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                      disabled={!s.cvDisponible || descargandoId === s.id}
                      onClick={(e) => descargarCv(e, s)}
                    >
                      {descargandoId === s.id ? 'Descargando...' : 'Descargar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {cargando && <p className="text-center text-muted">Cargando solicitudes...</p>}
        {!cargando && !error && solicitudes.length === 0 && (
          <p className="text-center text-muted">No se encontraron solicitudes con esos criterios.</p>
        )}
      </div>

      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPagina(pagina - 1)}>‹</button>
            </li>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <li key={n} className="page-item">
                <button
                  className="page-link"
                  onClick={() => setPagina(n)}
                  style={n === pagina ? { backgroundColor: '#445664', borderColor: '#445664', color: '#FFFFFF' } : {}}
                >
                  {n}
                </button>
              </li>
            ))}
            <li className={`page-item ${pagina === totalPaginas ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPagina(pagina + 1)}>›</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default HistorialSolicitudes;
