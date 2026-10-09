import { useState } from 'react';
import fondo from '../assets/montana-sobre-mar.png';
import logo from '../assets/aqua-chile-logo.png';

const NOMBRES_CARGO = ['A', 'B', 'C'];
const FAMILIAS_CARGO = ['Profesional A', 'Profesional B C'];

function FormularioSolicitud() {
  const [formData, setFormData] = useState({
    nombreCandidato: '',
    nombreCargo: '',
    familiaCargo: '',
    cv: null,
  });
  const [errores, setErrores] = useState({});

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
    if (!formData.nombreCargo.trim()) nuevosErrores.nombreCargo = 'Selecciona una opción';
    if (!formData.familiaCargo) nuevosErrores.familiaCargo = 'Selecciona una opción';
    if (!formData.cv) nuevosErrores.cv = 'Debes adjuntar tu CV';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validar()) {
      console.log('Solicitud enviada:', formData);
      // Más adelante esto se conecta con el backend (Spring Boot)
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
              onChange={handleFileChange}
            />
            {errores.cv && <div className="invalid-feedback">{errores.cv}</div>}
          </div>

          <button type="submit" className="btn btn-primary w-100">Enviar</button>
        </form>
      </div>
    </div>
  );
}

export default FormularioSolicitud;