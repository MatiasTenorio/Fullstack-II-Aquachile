import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { ETIQUETA_ROL, ROLES } from '../data/catalogos';
import CambiarPasswordAdmin from '../components/CambiarPasswordAdmin';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMULARIO_VACIO = { nombre: '', email: '', rol: ROLES.ANALISTA };
const OPCIONES_ROL = Object.values(ROLES);

// Pantalla del administrador: crea cuentas, asigna roles y activa o desactiva usuarios.
function Usuarios() {
  const { api, usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');

  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null); // { tipo: 'success' | 'danger', texto }
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);
  // Usuario al que se le está cambiando la contraseña (null = panel cerrado)
  const [cambiandoPassword, setCambiandoPassword] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    return api('/usuarios')
      .then((datos) => {
        setUsuarios(datos);
        setErrorLista('');
      })
      .catch((e) => setErrorLista(e instanceof ApiError ? e.message : 'No se pudo cargar la lista de usuarios.'))
      .finally(() => setCargando(false));
  }, [api]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    const nuevos = {};
    if (!formData.nombre.trim()) nuevos.nombre = 'Este campo es obligatorio';
    if (!formData.email.trim()) nuevos.email = 'Este campo es obligatorio';
    else if (!FORMATO_CORREO.test(formData.email.trim())) nuevos.email = 'Ingresa un correo válido';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const crear = async (e) => {
    e.preventDefault();
    setAviso(null);
    if (!validar()) return;

    setGuardando(true);
    try {
      const creado = await api('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formData.nombre.trim(), email: formData.email.trim(), rol: formData.rol }),
      });
      setUsuarios((prev) => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setFormData(FORMULARIO_VACIO);
      setErrores({});
      setAviso({
        tipo: 'success',
        texto: `Usuario ${creado.nombre} creado. Para entrar por primera vez debe usar "¿Olvidaste tu contraseña o es tu primer ingreso?" en la pantalla de inicio de sesión.`,
      });
    } catch (error) {
      const campos = error instanceof ApiError ? error.campos : {};
      if (Object.keys(campos).length > 0) {
        setErrores(campos);
      } else {
        setAviso({ tipo: 'danger', texto: error instanceof ApiError ? error.message : 'No se pudo crear el usuario.' });
      }
    } finally {
      setGuardando(false);
    }
  };

  // cambios = { rol } o { activo }
  const actualizar = async (usuario, cambios) => {
    setAviso(null);
    setActualizandoId(usuario.id);
    try {
      const actualizado = await api(`/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
    } catch (error) {
      setAviso({ tipo: 'danger', texto: error instanceof ApiError ? error.message : 'No se pudo actualizar el usuario.' });
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="container py-4 text-start">
      <h2 className="fw-bold" style={{ color: '#445664' }}>Usuarios</h2>
      <p className="text-muted">Crea las cuentas del equipo de Reclutamiento y Selección y asigna sus roles.</p>

      <form onSubmit={crear} noValidate className="card shadow-sm p-3 mb-4">
        <h3 className="h6 fw-bold mb-3" style={{ color: '#445664' }}>Nuevo usuario</h3>
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="nombre" className="form-label">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
            {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
          </div>
          <div className="col-md-4">
            <label htmlFor="email" className="form-label">
              Correo <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errores.email ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errores.email && <div className="invalid-feedback">{errores.email}</div>}
          </div>
          <div className="col-md-4">
            <label htmlFor="rol" className="form-label">
              Rol <span className="text-danger">*</span>
            </label>
            <select className="form-select" id="rol" name="rol" value={formData.rol} onChange={handleChange}>
              {OPCIONES_ROL.map((rol) => (
                <option key={rol} value={rol}>{ETIQUETA_ROL[rol]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="submit" className="btn" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>

      {cambiandoPassword && (
        <CambiarPasswordAdmin
          key={cambiandoPassword.id}
          usuario={cambiandoPassword}
          onCerrar={() => setCambiandoPassword(null)}
          onListo={(texto) => {
            setCambiandoPassword(null);
            setAviso({ tipo: 'success', texto });
          }}
        />
      )}

      {aviso && <div className={`alert alert-${aviso.tipo} py-2`} role="alert">{aviso.texto}</div>}
      {errorLista && <div className="alert alert-danger py-2" role="alert">{errorLista}</div>}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr style={{ color: '#445664' }}>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const esPropio = u.id === usuarioActual?.id;
              const ocupado = actualizandoId === u.id;
              return (
                <tr key={u.id}>
                  <td className="fw-semibold">
                    {u.nombre} {esPropio && <span className="text-muted fw-normal">(tú)</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      aria-label={`Rol de ${u.nombre}`}
                      value={u.rol}
                      disabled={esPropio || ocupado}
                      onChange={(e) => actualizar(u, { rol: e.target.value })}
                    >
                      {OPCIONES_ROL.map((rol) => (
                        <option key={rol} value={rol}>{ETIQUETA_ROL[rol]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={u.activo
                        ? { backgroundColor: '#d1e7dd', color: '#0f5132' }
                        : { backgroundColor: '#e9ecef', color: '#495057' }}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-end">
                    {/* La contraseña de un administrador solo la cambia él mismo, con su propio código */}
                    {u.rol !== ROLES.ADMIN && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => { setAviso(null); setCambiandoPassword(u); }}
                      >
                        Cambiar contraseña
                      </button>
                    )}
                    {!esPropio && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={ocupado}
                        onClick={() => actualizar(u, { activo: !u.activo })}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {cargando && <p className="text-center text-muted">Cargando usuarios...</p>}
      </div>
    </div>
  );
}

export default Usuarios;
