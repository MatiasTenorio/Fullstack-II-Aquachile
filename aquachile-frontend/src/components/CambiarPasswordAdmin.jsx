import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { validarCodigo, validarPassword } from '../utils/password';

// Panel con el que el administrador cambia la contraseña de otra cuenta.
// Primero pide un código, que llega al correo del propio administrador; luego lo ingresa
// junto con la nueva contraseña. onListo recibe el mensaje de éxito del backend.
function CambiarPasswordAdmin({ usuario, onListo, onCerrar }) {
  const { api } = useAuth();
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pedirCodigo = async () => {
    setError('');
    setEnviando(true);
    try {
      const respuesta = await api(`/usuarios/${usuario.id}/password/codigo`, { method: 'POST' });
      setMensaje(respuesta.mensaje);
      setCodigoEnviado(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar el código.');
    } finally {
      setEnviando(false);
    }
  };

  const cambiar = async (e) => {
    e.preventDefault();
    setError('');
    const nuevos = {};
    const errorCodigo = validarCodigo(codigo);
    const errorPassword = validarPassword(password);
    if (errorCodigo) nuevos.codigo = errorCodigo;
    if (errorPassword) nuevos.password = errorPassword;
    else if (password !== confirmacion) nuevos.confirmacion = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const respuesta = await api(`/usuarios/${usuario.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim(), nuevaPassword: password }),
      });
      onListo(respuesta.mensaje);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card shadow-sm p-3 mb-4" style={{ borderColor: '#8fb0c4' }}>
      <h3 className="h6 fw-bold mb-2" style={{ color: '#445664' }}>Cambiar contraseña de {usuario.nombre}</h3>

      {!codigoEnviado && (
        <>
          <p className="small text-muted">
            Para confirmar que eres tú, enviaremos un código a tu correo. Con ese código podrás definir la nueva
            contraseña de {usuario.email}.
          </p>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>Cancelar</button>
            <button type="button" className="btn" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} onClick={pedirCodigo} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar código a mi correo'}
            </button>
          </div>
        </>
      )}

      {codigoEnviado && (
        <form onSubmit={cambiar} noValidate>
          {mensaje && <div className="alert alert-info py-2 small" role="status">{mensaje}</div>}
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="codigoAdmin" className="form-label">Código</label>
              <input
                type="text"
                id="codigoAdmin"
                className={`form-control ${errores.codigo ? 'is-invalid' : ''}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              {errores.codigo && <div className="invalid-feedback">{errores.codigo}</div>}
            </div>
            <div className="col-md-4">
              <label htmlFor="passwordAdmin" className="form-label">Nueva contraseña</label>
              <input
                type="password"
                id="passwordAdmin"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errores.password && <div className="invalid-feedback">{errores.password}</div>}
            </div>
            <div className="col-md-4">
              <label htmlFor="confirmacionAdmin" className="form-label">Repite la contraseña</label>
              <input
                type="password"
                id="confirmacionAdmin"
                className={`form-control ${errores.confirmacion ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
              {errores.confirmacion && <div className="invalid-feedback">{errores.confirmacion}</div>}
            </div>
          </div>
          <div className="form-text">Mínimo 8 caracteres, con al menos una letra y un número. El código vale 10 minutos.</div>
          {error && <div className="alert alert-danger py-2 mt-2" role="alert">{error}</div>}
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>Cancelar</button>
            <button type="submit" className="btn" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} disabled={enviando}>
              {enviando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CambiarPasswordAdmin;
