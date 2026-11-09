import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

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
      await login(email.trim(), password);
      navigate('/solicitudes');
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
        background:'url(/src/assets/fondo-login.jpg) center/cover'
      }}
    >
      <div className="card shadow p-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="text-center mb-3">
          <img src="/src/assets/aquachile-logo.png" alt="AquaChile" style={{ maxWidth: '220px' }} />
        </div>
        <p className="text-muted mb-4">
          Inicia sesión para acceder a la lista de solicitudes
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
      </div>
    </div>
  );
}

export default Login;