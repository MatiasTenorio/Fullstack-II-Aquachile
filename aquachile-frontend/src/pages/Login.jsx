import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { rutaInicio } from '../data/catalogos';
// Las imágenes se importan para que Vite las incluya al compilar (una ruta escrita a mano solo funciona en desarrollo)
import fondo from '../assets/fondo-login.jpg';
import logo from '../assets/aquachile-logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      const usuario = await login(email.trim(), password);
      // Todos los roles parten en el dashboard
      navigate(rutaInicio(usuario?.rol));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Correo o contraseña incorrectos');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        position: 'fixed',
        inset: 0,
        background: `url(${fondo}) center/cover`
      }}
    >
      <div className="card shadow p-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="text-center mb-3">
          <img src={logo} alt="AquaChile" style={{ maxWidth: '220px' }} />
        </div>
        <p className="text-muted mb-4">
          Inicia sesión para acceder al sistema
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Correo</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope"></i></span>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Ingresa tu correo"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type="password"
                className="form-control"
                id="password"
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <button type="submit" className="btn btn-dark w-100" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Ingresar'} <i className="bi bi-arrow-right"></i>
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/restablecer-password">¿Olvidaste tu contraseña o es tu primer ingreso?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;