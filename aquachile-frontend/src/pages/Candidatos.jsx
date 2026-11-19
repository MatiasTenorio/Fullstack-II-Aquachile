import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMULARIO_VACIO = { nombre: '', correo: '', telefono: '' };

// Pantalla del analista: registra, edita y consulta candidatos.
function Candidatos() {
  const { api } = useAuth();

  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null); // null = se está registrando uno nuevo
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null); // { tipo: 'success' | 'danger', texto }
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    return api('/candidatos')
      .then((datos) => {
        setCandidatos(datos);
        setErrorLista('');
      })
      .catch((e) => setErrorLista(e instanceof ApiError ? e.message : 'No se pudo cargar la lista de candidatos.'))
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
    if (formData.correo.trim() && !FORMATO_CORREO.test(formData.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido, por ejemplo nombre@dominio.cl';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const limpiarFormulario = () => {
    setFormData(FORMULARIO_VACIO);
    setEditandoId(null);
    setErrores({});
  };

  const editar = (candidato) => {
    setEditandoId(candidato.id);
    setFormData({
      nombre: candidato.nombre,
      correo: candidato.correo ?? '',
      telefono: candidato.telefono ?? '',
    });
    setErrores({});
    setAviso(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAviso(null);
    if (!validar()) return;

    setGuardando(true);
    try {
      await api(editandoId ? `/candidatos/${editandoId}` : '/candidatos', {
        method: editandoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim(),
          telefono: formData.telefono.trim(),
        }),
      });
      setAviso({ tipo: 'success', texto: editandoId ? 'Candidato actualizado.' : 'Candidato registrado.' });
      limpiarFormulario();
      await cargar();
    } catch (error) {
      const campos = error instanceof ApiError ? error.campos : {};
      if (Object.keys(campos).length > 0) {
        setErrores(campos);
      } else {
        setAviso({ tipo: 'danger', texto: error instanceof ApiError ? error.message : 'No se pudo guardar el candidato.' });
      }
    } finally {
      setGuardando(false);
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const visibles = texto
    ? candidatos.filter((c) => `${c.nombre} ${c.correo ?? ''}`.toLowerCase().includes(texto))
    : candidatos;

  return (
    <div className="container py-4 text-start">
      <h2 className="fw-bold" style={{ color: '#445664' }}>Candidatos</h2>
      <p className="text-muted">Registra a los candidatos antes de crear su solicitud de evaluación.</p>

      <form onSubmit={handleSubmit} noValidate className="card shadow-sm p-3 mb-4">
        <h3 className="h6 fw-bold mb-3" style={{ color: '#445664' }}>
          {editandoId ? 'Editar candidato' : 'Registrar candidato'}
        </h3>
        <div className="row g-3">
          <div className="col-md-5">
            <label htmlFor="nombre" className="form-label">
              Nombre completo <span className="text-danger">*</span>
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
            <label htmlFor="correo" className="form-label">Correo electrónico</label>
            <input
              type="email"
              className={`form-control ${errores.correo ? 'is-invalid' : ''}`}
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
            />
            {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
          </div>
          <div className="col-md-3">
            <label htmlFor="telefono" className="form-label">Teléfono</label>
            <input
              type="tel"
              className={`form-control ${errores.telefono ? 'is-invalid' : ''}`}
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
            {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          {editandoId && (
            <button type="button" className="btn btn-outline-secondary" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
          <button type="submit" className="btn" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} disabled={guardando}>
            {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar candidato'}
          </button>
        </div>
      </form>

      {aviso && <div className={`alert alert-${aviso.tipo} py-2`} role="alert">{aviso.texto}</div>}
      {errorLista && <div className="alert alert-danger py-2" role="alert">{errorLista}</div>}

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por nombre o correo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr style={{ color: '#445664' }}>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold">{c.nombre}</td>
                <td>{c.correo ?? <span className="text-muted">Sin correo</span>}</td>
                <td>{c.telefono ?? <span className="text-muted">Sin teléfono</span>}</td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => editar(c)}>
                    Editar
                  </button>
                  <Link
                    to={`/solicitudes/nueva?candidato=${c.id}`}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  >
                    Crear solicitud
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && <p className="text-center text-muted">Cargando candidatos...</p>}
        {!cargando && !errorLista && visibles.length === 0 && (
          <p className="text-center text-muted">
            {candidatos.length === 0 ? 'Aún no hay candidatos registrados.' : 'Ningún candidato coincide con la búsqueda.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default Candidatos;
