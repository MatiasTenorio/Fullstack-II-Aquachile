import { useState } from 'react';
import './formularios.css';

// Pide el motivo antes de pausar o cancelar una solicitud. onConfirmar recibe el texto ya recortado.
function MotivoForm({ titulo, descripcion, etiquetaBoton, peligro = false, enviando, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Escribe el motivo');
      return;
    }
    setError('');
    onConfirmar(motivo.trim());
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="formulario-accion">
      <h3 className="seccion-titulo">{titulo}</h3>
      {descripcion && <p className="small text-muted mb-2">{descripcion}</p>}
      <label htmlFor="motivo" className="form-label small mb-1">Motivo</label>
      <textarea
        id="motivo"
        className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
        rows={2}
        maxLength={500}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />
      {error && <div className="invalid-feedback">{error}</div>}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelar} disabled={enviando}>
          Volver
        </button>
        <button
          type="submit"
          className={`btn btn-sm ${peligro ? 'btn-danger' : ''}`}
          style={peligro ? undefined : { backgroundColor: '#445664', color: '#FFFFFF' }}
          disabled={enviando}
        >
          {enviando ? 'Guardando...' : etiquetaBoton}
        </button>
      </div>
    </form>
  );
}

export default MotivoForm;
