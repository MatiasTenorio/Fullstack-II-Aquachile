import { useState } from 'react';

const solicitudesMock = [
  { id: 1, nombre: 'Pedro Guillermo Alfarino Ojeda', email: 'ped.guillermo@ejemplo.cl', cargo: 'Desarrollador Frontend', familiaCargo: 'Familia de Cargo A', estado: 'Pendiente' },
  { id: 2, nombre: 'Martina Alfredo Manuel Silva', email: 'mar.alfredo@ejemplo.cl', cargo: 'Analista de Datos', familiaCargo: 'Familia de Cargo B', estado: 'En Proceso' },
  { id: 3, nombre: 'Luisa Gallardo Socorro Amanda', email: 'lui.gallardo@ejemplo.cl', cargo: 'Diseñador UX/UI', familiaCargo: 'Familia de Cargo A', estado: 'Finalizado' },
  { id: 4, nombre: 'Victoria Allasgo Amanda Vega', email: 'vic.allasgo@ejemplo.cl', cargo: 'Gerente de Proyecto', familiaCargo: 'Familia de Cargo C', estado: 'En Proceso' },
  { id: 5, nombre: 'Samuel Diego Alejandro Negron', email: 'sam.diego@ejemplo.cl', cargo: 'Ingeniería de Software', familiaCargo: 'Familia de Cargo B', estado: 'Finalizado' },
  { id: 6, nombre: 'Fernanda Aguilar Contreras Núñez', email: 'fer.aguilar@ejemplo.cl', cargo: 'Analista de Marketing', familiaCargo: 'Familia de Cargo C', estado: 'Pendiente' },
];

const coloresEstado = {
  Pendiente: { bg: '#f8d7da', text: '#842029' },
  'En Proceso': { bg: '#fff3cd', text: '#664d03' },
  Finalizado: { bg: '#d1e7dd', text: '#0f5132' },
};

function obtenerIniciales(nombreCompleto) {
  const partes = nombreCompleto.trim().split(' ');
  return (partes[0]?.[0] || '') + (partes[1]?.[0] || '');
}

function HistorialSolicitudes() {
  const [busqueda, setBusqueda] = useState('');
  const [familiaFiltro, setFamiliaFiltro] = useState('Todas las familias');
  const [cargoFiltro, setCargoFiltro] = useState('Todos los cargos');

  const familias = ['Todas las familias', ...new Set(solicitudesMock.map((s) => s.familiaCargo))];
  const cargos = ['Todos los cargos', ...new Set(solicitudesMock.map((s) => s.cargo))];

  const solicitudesFiltradas = solicitudesMock.filter((s) => {
    const coincideBusqueda =
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.cargo.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.familiaCargo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFamilia = familiaFiltro === 'Todas las familias' || s.familiaCargo === familiaFiltro;
    const coincideCargo = cargoFiltro === 'Todos los cargos' || s.cargo === cargoFiltro;
    return coincideBusqueda && coincideFamilia && coincideCargo;
  });

  return (
    <div className="container-fluid px-4 py-4">
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
            {familias.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={cargoFiltro} onChange={(e) => setCargoFiltro(e.target.value)}>
            {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

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
            {solicitudesFiltradas.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-semibold"
                      style={{ width: '40px', height: '40px', backgroundColor: '#445664', color: '#FFFFFF', flexShrink: 0 }}
                    >
                      {obtenerIniciales(s.nombre)}
                    </div>
                    <div>
                      <div className="fw-semibold">{s.nombre}</div>
                      <div className="text-muted small">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td>{s.cargo}</td>
                <td>{s.familiaCargo}</td>
                <td>
                  <span
                    className="badge rounded-pill px-3 py-2"
                    style={{ backgroundColor: coloresEstado[s.estado].bg, color: coloresEstado[s.estado].text }}
                  >
                    {s.estado}
                  </span>
                </td>
                <td>
                  <button
                    className="BtnCVDownload"
                    style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  >
                    Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {solicitudesFiltradas.length === 0 && (
          <p className="text-center text-muted">No se encontraron solicitudes con esos criterios.</p>
        )}
      </div>

      <nav className="d-flex justify-content-center mt-3">
        <ul className="pagination">
          <li className="page-item"><button className="page-link">‹</button></li>
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="page-item">
              <button
                className="page-link"
                style={n === 1 ? { backgroundColor: '#445664', borderColor: '#445664', color: '#FFFFFF' } : {}}
              >
                {n}
              </button>
            </li>
          ))}
          <li className="page-item"><button className="page-link">›</button></li>
        </ul>
      </nav>
    </div>
  );
}

export default HistorialSolicitudes;