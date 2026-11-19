import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiFetch } from '../services/api';
import { validarCodigo, validarPassword } from '../utils/password';
import fondo from '../assets/fondo-login.jpg';
import logo from '../assets/aquachile-logo.png';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function enviarJson(ruta, cuerpo) {
  return apiFetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

// Pantalla pública para definir la contraseña (primer ingreso) o restablecerla si se olvidó.
// Paso 1: se pide un código al correo. Paso 2: se ingresa el código y la nueva contraseña.
function RestablecerPassword() {
  const [paso, setPaso] = useState('correo'); // 'correo' | 'codigo' | 'listo'
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pedirCodigo = async (e) => {
    e.preventDefault();
    setError('');
    if (!FORMATO_CORREO.test(email.trim())) {
      setErrores({ email: 'Ingresa un correo válido' });
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const respuesta = await enviarJson('/auth/password/codigo', { email: email.trim() });
      setMensaje(respuesta.mensaje);
      setPaso('codigo');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo pedir el código. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarPassword = async (e) => {
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
      await enviarJson('/auth/password/restablecer', {
        email: email.trim(),
        codigo: codigo.trim(),
        nuevaPassword: password,
      });
      setPaso('listo');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const volverAlCorreo = () => {
    setPaso('correo');
    setCodigo('');
    setErrores({});
    setError('');
  };

  return (
    <div
      className="d-flex p-3"
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: `url(${fondo}) center/cover` }}
    >
      {/* m-auto centra la tarjeta y, si no cabe en la pantalla, deja hacer scroll desde arriba */}
      <div className="card shadow p-4 m-auto text-start" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-3">
          <img src={logo} alt="AquaChile" style={{ maxWidth: '220px' }} />
        </div>
        <h1 className="h5 fw-bold" style={{ color: '#445664' }}>
          {paso === 'listo' ? 'Contraseña actualizada' : 'Definir o restablecer contraseña'}
        </h1>

        {paso === 'correo' && (
          <form onSubmit={pedirCodigo} noValidate>
            <p className="text-muted small">
              Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos. Sirve tanto si olvidaste tu
              contraseña como si es la primera vez que entras.
            </p>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo</label>
              <input
                type="email"
                id="email"
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
            <button type="submit" className="btn btn-dark w-100" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {paso === 'codigo' && (
          <form onSubmit={cambiarPassword} noValidate>
            {mensaje && <div className="alert alert-info py-2 small" role="status">{mensaje}</div>}
            <p className="text-muted small">El código vale por 10 minutos y sirve una sola vez.</p>
            <div className="mb-3">
              <label htmlFor="codigo" className="form-label">Código</label>
              <input
                type="text"
                id="codigo"
                className={`form-control ${errores.codigo ? 'is-invalid' : ''}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              {errores.codigo && <div className="invalid-feedback">{errores.codigo}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Nueva contraseña</label>
              <input
                type="password"
                id="password"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errores.password
                ? <div className="invalid-feedback">{errores.password}</div>
                : <div className="form-text">Mínimo 8 caracteres, con al menos una letra y un número.</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="confirmacion" className="form-label">Repite la contraseña</label>
              <input
                type="password"
                id="confirmacion"
                className={`form-control ${errores.confirmacion ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
              {errores.confirmacion && <div className="invalid-feedback">{errores.confirmacion}</div>}
            </div>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
            <button type="submit" className="btn btn-dark w-100" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
            <button type="button" className="btn btn-link w-100 mt-1" onClick={volverAlCorreo}>
              No me llegó: pedir otro código
            </button>
          </form>
        )}

        {paso === 'listo' && (
          <div className="alert alert-success mt-2" role="status">
            Tu contraseña fue actualizada. Ya puedes iniciar sesión con ella.
          </div>
        )}

        <div className="text-center mt-2">
          <Link to="/login">{paso === 'listo' ? 'Ir a iniciar sesión' : 'Volver a iniciar sesión'}</Link>
        </div>
      </div>
    </div>
  );
}

export default RestablecerPassword;
