import { useRef, useState } from 'react';
import fondo from '../assets/montana-sobre-mar.png';
import logo from '../assets/aquachile-form-logo.png';
import { ApiError, enviarSolicitudPublica } from '../services/api';
import { NOMBRES_CARGO, FAMILIAS_CARGO } from '../data/catalogos';

const EXTENSIONES_CV = ['pdf', 'doc', 'docx'];
const TAMANO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB, el mismo límite del backend

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FORMULARIO_VACIO = {
  nombreCandidato: '',
  correo: '',
  nombreCargo: '',
  familiaCargo: '',
  cv: null,
};

function FormularioSolicitud() {
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const inputCv = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, cv: e.target.files[0] }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.nombreCandidato.trim()) nuevosErrores.nombreCandidato = 'Este campo es obligatorio';
    if (!formData.correo.trim()) nuevosErrores.correo = 'Este campo es obligatorio';
    else if (!FORMATO_CORREO.test(formData.correo.trim())) nuevosErrores.correo = 'Ingresa un correo válido, por ejemplo nombre@dominio.cl';
    if (!formData.nombreCargo.trim()) nuevosErrores.nombreCargo = 'Selecciona una opción';
    if (!formData.familiaCargo) nuevosErrores.familiaCargo = 'Selecciona una opción';
    if (!formData.cv) {
      nuevosErrores.cv = 'Debes adjuntar tu CV';
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
    setMensajeExito('');
    setErrorGeneral('');
    if (!validar()) return;

    const datos = new FormData();
    datos.append('nombreCandidato', formData.nombreCandidato.trim());
    datos.append('correo', formData.correo.trim());
    datos.append('cargo', formData.nombreCargo);
    datos.append('familiaCargo', formData.familiaCargo);
    datos.append('cv', formData.cv);

    setEnviando(true);
    try {
      await enviarSolicitudPublica(datos);
      setFormData(FORMULARIO_VACIO);
      setErrores({});
      if (inputCv.current) inputCv.current.value = '';
      setMensajeExito('Tu solicitud fue enviada correctamente. ¡Gracias!');
    } catch (error) {
      // El backend nombra "cargo" al campo que aquí se llama nombreCargo
      const camposBackend = error instanceof ApiError ? error.campos : {};
      const erroresServidor = {};
      if (camposBackend.nombreCandidato) erroresServidor.nombreCandidato = camposBackend.nombreCandidato;
      if (camposBackend.correo) erroresServidor.correo = camposBackend.correo;
      if (camposBackend.cargo) erroresServidor.nombreCargo = camposBackend.cargo;
      if (camposBackend.familiaCargo) erroresServidor.familiaCargo = camposBackend.familiaCargo;

      if (Object.keys(erroresServidor).length > 0) {
        setErrores(erroresServidor);
      } else {
        setErrorGeneral(error.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflowY: 'auto',
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="card shadow p-5 m-3" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="text-center mb-3">
          <img src={logo} alt="AquaChile - Formulario Psicolaboral" className="img-fluid" style={{ maxWidth: '450px' }} />
        </div>

        {mensajeExito && <div className="alert alert-success" role="alert">{mensajeExito}</div>}
        {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="nombreCandidato" className="form-label">
              Nombre del candidato <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errores.nombreCandidato ? 'is-invalid' : ''}`}
              id="nombreCandidato"
              name="nombreCandidato"
              value={formData.nombreCandidato}
              onChange={handleChange}
            />
            {errores.nombreCandidato && <div className="invalid-feedback">{errores.nombreCandidato}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="correo" className="form-label">
              Correo electrónico <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errores.correo ? 'is-invalid' : ''}`}
              id="correo"
              name="correo"
              autoComplete="email"
              value={formData.correo}
              onChange={handleChange}
            />
            {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="nombreCargo" className="form-label">
              Nombre del cargo <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errores.nombreCargo ? 'is-invalid' : ''}`}
              id="nombreCargo"
              name="nombreCargo"
              value={formData.nombreCargo}
              onChange={handleChange}
            >
              <option value="">Seleccione una opción</option>
              {NOMBRES_CARGO.map((cargo) => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
            {errores.nombreCargo && <div className="invalid-feedback">{errores.nombreCargo}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="familiaCargo" className="form-label">
              Familia del cargo <span className="text-danger">*</span>
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

          <div className="mb-3">
            <label htmlFor="cv" className="form-label">
              Cargue su CV aquí <span className="text-danger">*</span>
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
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormularioSolicitud;
