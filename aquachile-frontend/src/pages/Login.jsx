import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Completa usuario y contraseña');
      return;
    }
    const exito = login(usuario, password);
    if (exito) {
      navigate('/solicitudes');
    } else {
      setError('Usuario o contraseña incorrectos');
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
            <label htmlFor="usuario" className="form-label">Usuario</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person"></i></span>
              <input
                type="text"
                className="form-control"
                id="usuario"
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
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
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <button type="submit" className="btn btn-dark w-100">
            Ingresar <i className="bi bi-arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;