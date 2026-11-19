import { useState } from 'react';
import { DURACIONES_ENTREVISTA, ETIQUETA_MODALIDAD } from '../data/catalogos';
import { aValorInput } from '../utils/fechas';
import './formularios.css';

// Formulario para agendar una entrevista o reprogramar una existente (si llega "entrevista").
// fechaInicial ("2026-11-19T09:00") deja la fecha ya puesta; la usa el calendario al agendar en un día.
// apilado pone un campo por línea, para cuando el formulario va en un espacio angosto.
// onGuardar recibe { inicio, duracionMinutos, modalidad, ubicacion } listo para enviar al backend.
function EntrevistaForm({ entrevista, fechaInicial = '', apilado = false, enviando, onGuardar, onCancelar }) {
  // Ancho de cada campo: en una sola columna si va apilado, o repartidos en dos filas
  const ancho = (clase) => (apilado ? 'col-12' : clase);
  const duracionInicial = entrevista
    ? Math.round((new Date(entrevista.fin) - new Date(entrevista.inicio)) / 60000)
    : 60;
  const [inicio, setInicio] = useState(entrevista ? aValorInput(entrevista.inicio) : fechaInicial);
  const [duracion, setDuracion] = useState(String(duracionInicial));
  const [modalidad, setModalidad] = useState(entrevista?.modalidad ?? 'ONLINE');
  const [ubicacion, setUbicacion] = useState(entrevista?.ubicacion ?? '');
  const [error, setError] = useState('');

  // Si la entrevista tenía una duración que no está en la lista, se agrega para no perderla
  const duraciones = DURACIONES_ENTREVISTA.includes(duracionInicial)
    ? DURACIONES_ENTREVISTA
    : [...DURACIONES_ENTREVISTA, duracionInicial].sort((a, b) => a - b);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inicio) {
      setError('Indica la fecha y hora de la entrevista');
      return;
    }
    const fecha = new Date(inicio);
    if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
      setError('La entrevista debe agendarse para una fecha y hora futuras');
      return;
    }
    setError('');
    onGuardar({
      inicio: fecha.toISOString(),
      duracionMinutos: Number(duracion),
      modalidad,
      ubicacion: ubicacion.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="formulario-accion">
      <h3 className="seccion-titulo">{entrevista ? 'Reprogramar entrevista' : 'Agendar entrevista'}</h3>
      <div className="row g-2">
        <div className={ancho('col-sm-7')}>
          <label htmlFor="entrevistaInicio" className="form-label small mb-1">Fecha y hora</label>
          <input
            type="datetime-local"
            id="entrevistaInicio"
            className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
            min={aValorInput(new Date())}
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </div>
        <div className={ancho('col-sm-5')}>
          <label htmlFor="entrevistaDuracion" className="form-label small mb-1">Duración</label>
          <select
            id="entrevistaDuracion"
            className="form-select form-select-sm"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          >
            {duraciones.map((minutos) => (
              <option key={minutos} value={minutos}>{minutos} minutos</option>
            ))}
          </select>
        </div>
        <div className={ancho('col-sm-4')}>
          <label htmlFor="entrevistaModalidad" className="form-label small mb-1">Modalidad</label>
          <select
            id="entrevistaModalidad"
            className="form-select form-select-sm"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
          >
            {Object.entries(ETIQUETA_MODALIDAD).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>
        <div className={ancho('col-sm-8')}>
          <label htmlFor="entrevistaUbicacion" className="form-label small mb-1">
            {modalidad === 'ONLINE' ? 'Enlace de la reunión' : 'Lugar'}
          </label>
          <input
            type="text"
            id="entrevistaUbicacion"
            className="form-control form-control-sm"
            maxLength={300}
            placeholder={modalidad === 'ONLINE' ? 'https://...' : 'Oficina, sala...'}
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelar} disabled={enviando}>
          Volver
        </button>
        <button type="submit" className="btn btn-sm" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} disabled={enviando}>
          {enviando ? 'Guardando...' : entrevista ? 'Guardar nueva fecha' : 'Agendar'}
        </button>
      </div>
    </form>
  );
}

export default EntrevistaForm;
