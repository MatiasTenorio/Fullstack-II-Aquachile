import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { CARGOS_POR_FAMILIA, FAMILIAS_CARGO } from '../data/catalogos';

const EXTENSIONES_CV = ['pdf', 'doc', 'docx'];
const TAMANO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB, el mismo límite del backend

// Formulario con el que el analista crea una solicitud de evaluación:
// elige un candidato ya registrado, el cargo, el evaluador responsable y adjunta el CV.
function FormularioSolicitud() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const [formData, setFormData] = useState({
    // Llega con ?candidato=ID cuando se entra desde la pantalla de candidatos
    candidatoId: parametros.get('candidato') ?? '',
    familiaCargo: '',
    nombreCargo: '',
    responsableId: '',
    cv: null,
  });
  const [candidatos, setCandidatos] = useState([]);
  const [evaluadores, setEvaluadores] = useState([]);
  const [cargandoListas, setCargandoListas] = useState(true);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const inputCv = useRef(null);

  // Los selectores de candidato y de evaluador se llenan desde el backend.
  useEffect(() => {
    let cancelado = false;
    Promise.all([api('/candidatos'), api('/usuarios/evaluadores')])
      .then(([listaCandidatos, listaEvaluadores]) => {
        if (cancelado) return;
        setCandidatos(listaCandidatos);
        setEvaluadores(listaEvaluadores);
      })
      .catch((e) => {
        if (!cancelado) {
          setErrorGeneral(e instanceof ApiError ? e.message : 'No se pudieron cargar los candidatos y evaluadores.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoListas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [api]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Los cargos dependen de la familia: si cambia la familia, se vuelve a elegir el cargo
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'familiaCargo' ? { nombreCargo: '' } : {}) }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, cv: e.target.files[0] ?? null }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.candidatoId) nuevosErrores.candidatoId = 'Selecciona un candidato';
    if (!formData.familiaCargo) nuevosErrores.familiaCargo = 'Selecciona una opción';
    if (!formData.nombreCargo) nuevosErrores.nombreCargo = 'Selecciona una opción';
    if (!formData.responsableId) nuevosErrores.responsableId = 'Selecciona el evaluador responsable';
    if (!formData.cv) {
      nuevosErrores.cv = 'Debes adjuntar el CV del candidato';
    } else {
      const extension = formData.cv.name.split('.').pop().toLowerCase();
      if (!EXTENSIONES_CV.includes(extension)) nuevosErrores.cv = 'El CV debe ser un archivo PDF, DOC o DOCX';
      else if (formData.cv.size > TAMANO_MAXIMO_CV) nuevosErrores.cv = 'El CV no puede superar los 5 MB';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    if (!validar()) return;

    // No se define Content-Type: el navegador lo arma con el límite (boundary) del multipart.
    const datos = new FormData();
    datos.append('candidatoId', formData.candidatoId);
    datos.append('responsableId', formData.responsableId);
    datos.append('cargo', formData.nombreCargo);
    datos.append('familiaCargo', formData.familiaCargo);
    datos.append('cv', formData.cv);

    setEnviando(true);
    try {
      const creada = await api('/solicitudes', { method: 'POST', body: datos });
      navigate(`/solicitudes/${creada.id}`);
    } catch (error) {
      // El backend nombra "cargo" al campo que aquí se llama nombreCargo
      const camposBackend = error instanceof ApiError ? error.campos : {};
      const erroresServidor = {};
      if (camposBackend.candidatoId) erroresServidor.candidatoId = camposBackend.candidatoId;
      if (camposBackend.responsableId) erroresServidor.responsableId = camposBackend.responsableId;
      if (camposBackend.cargo) erroresServidor.nombreCargo = camposBackend.cargo;
      if (camposBackend.familiaCargo) erroresServidor.familiaCargo = camposBackend.familiaCargo;

      if (Object.keys(erroresServidor).length > 0) {
        setErrores(erroresServidor);
      } else {
        setErrorGeneral(error instanceof ApiError ? error.message : 'No se pudo crear la solicitud.');
      }
      setEnviando(false);
    }
  };

  return (
    <div className="container py-4 text-start" style={{ maxWidth: '760px' }}>
      <h2 className="fw-bold" style={{ color: '#445664' }}>Nueva solicitud de evaluación</h2>
      <p className="text-muted">
        Elige al candidato, el cargo al que postula y el profesional evaluador que quedará a cargo.
      </p>

      {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

      <form onSubmit={handleSubmit} noValidate className="card shadow-sm p-4">
        <div className="mb-3">
          <label htmlFor="candidatoId" className="form-label">
            Candidato <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errores.candidatoId ? 'is-invalid' : ''}`}
            id="candidatoId"
            name="candidatoId"
            value={formData.candidatoId}
            onChange={handleChange}
            disabled={cargandoListas}
          >
            <option value="">{cargandoListas ? 'Cargando...' : 'Seleccione un candidato'}</option>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.correo ? ` (${c.correo})` : ''}
              </option>
            ))}
          </select>
          {errores.candidatoId && <div className="invalid-feedback">{errores.candidatoId}</div>}
          <div className="form-text">
            ¿No aparece en la lista? <Link to="/candidatos">Regístralo en Candidatos</Link> y vuelve a esta pantalla.
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="familiaCargo" className="form-label">
              Familia de cargo <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errores.familiaCargo ? 'is-invalid' : ''}`}
              id="familiaCargo"
              name="familiaCargo"
              value={formData.familiaCargo}
              onChange={handleChange}
            >
              <option value="">Seleccione una opción</option>
              {FAMILIAS_CARGO.map((familia) => (
                <option key={familia} value={familia}>{familia}</option>
              ))}
            </select>
            {errores.familiaCargo && <div className="invalid-feedback">{errores.familiaCargo}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="nombreCargo" className="form-label">
              Nombre del cargo <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errores.nombreCargo ? 'is-invalid' : ''}`}
              id="nombreCargo"
              name="nombreCargo"
              value={formData.nombreCargo}
              onChange={handleChange}
              disabled={!formData.familiaCargo}
            >
              <option value="">Seleccione una opción</option>
              {(CARGOS_POR_FAMILIA[formData.familiaCargo] ?? []).map((cargo) => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
            {errores.nombreCargo && <div className="invalid-feedback">{errores.nombreCargo}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="responsableId" className="form-label">
            Evaluador responsable <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errores.responsableId ? 'is-invalid' : ''}`}
            id="responsableId"
            name="responsableId"
            value={formData.responsableId}
            onChange={handleChange}
            disabled={cargandoListas}
          >
            <option value="">{cargandoListas ? 'Cargando...' : 'Seleccione un evaluador'}</option>
            {evaluadores.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          {errores.responsableId && <div className="invalid-feedback">{errores.responsableId}</div>}
        </div>

        <div className="mb-4">
          <label htmlFor="cv" className="form-label">
            CV del candidato <span className="text-danger">*</span>
          </label>
          <input
            type="file"
            className={`form-control ${errores.cv ? 'is-invalid' : ''}`}
            id="cv"
            name="cv"
            accept=".pdf,.doc,.docx"
            ref={inputCv}
            onChange={handleFileChange}
          />
          {errores.cv && <div className="invalid-feedback">{errores.cv}</div>}
          <div className="form-text">PDF, DOC o DOCX de hasta 5 MB.</div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Link to="/solicitudes" className="btn btn-outline-secondary">Cancelar</Link>
          <button type="submit" className="btn" style={{ backgroundColor: '#445664', color: '#FFFFFF' }} disabled={enviando}>
            {enviando ? 'Creando...' : 'Crear solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioSolicitud;
