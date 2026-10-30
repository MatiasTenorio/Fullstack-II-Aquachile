import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ESTADOS, solicitudesMock } from "../data/solicitudes";
import CvPreview from "../components/CvPreview";
import "./DetalleSolicitud.css";

const claseEstado = {
  "Pendiente": "estado-pendiente",
  "En Proceso": "estado-proceso",
  "Completo": "estado-completo",
};

const coloresEstado = {
  "Pendiente": { bg: '#f8d7da', text: '#842029' },
  "En Proceso": { bg: '#fff3cd', text: '#664d03' },
  "Completo": { bg: '#d1e7dd', text: '#0f5132' },
};

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const solicitud = solicitudesMock.find((s) => s.id === Number(id));
  const [estado, setEstado] = useState(solicitud ? solicitud.estado : ESTADOS[0]);

  if (!solicitud) {
    return (
      <div className="container py-4">
        <p>No se encontró la solicitud seleccionada.</p>
        <button className="btn btn-secondary" onClick={() => navigate("/solicitudes")}>
          Volver
        </button>
      </div>
    );
  }

  const iniciales = solicitud.nombre
    .split(" ")
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();

  const actualizarEstado = () => {
    setEstado((actual) => ESTADOS[(ESTADOS.indexOf(actual) + 1) % ESTADOS.length]);
  };

  return (
    <div className="detalle-pagina container-fluid py-3 px-4">
      <h1 className="detalle-titulo">Detalles de solicitud</h1>
      <p className="detalle-subtitulo">Revisa los detalles de la solicitud seleccionada</p>

      <div className="row g-3">
        <div className="col-lg-6">
          <section className="panel">
            <header className="panel-encabezado">
              <div className="position-relative d-flex align-items-center justify-content-center py-1 Volver" 
              style={{ backgroundColor: '#8fb0c5' }}>
                <button
                  className="btn btn-sm position-absolute start-0 ms-30"
                  style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  onClick={() => navigate(-1)}
                >
                  Volver
                </button>
                <h2 className="m-0 fw-bold" style={{ color: '#1b2f4b' }}>Solicitud</h2>
              </div>
            </header>

            <div className="panel-cuerpo">
              <div className="candidato">
                <div className="avatar">{iniciales}</div>
                <div>
                  <strong>{solicitud.nombre}</strong>
                  <div className="candidato-email">{solicitud.email}</div>
                </div>
              </div>

              <p className="dato">{solicitud.cargo}</p>
              <p className="dato">{solicitud.familiaCargo}</p>
            </div>

            <footer className="panel-acciones">
              <span
                className={`badge rounded-pill px-3 py-2 ${claseEstado[estado]}`}
                style={{
                  backgroundColor: coloresEstado[estado]?.bg,
                  color: coloresEstado[estado]?.text,
                }}
              >
                {estado}
              </span>
              <a
                className="btn btn-sm text-decoration-none ActualizarEstado"
                style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                onClick={actualizarEstado}
              >
                Actualizar Estado
              </a>
              <a
                className="btn btn-sm text-decoration-none CVDownload"
                href={solicitud.cv.url}
                download={solicitud.cv.nombreArchivo}
                style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                onClick={(e) => e.stopPropagation()}
              >
                Descargar
              </a>
            </footer>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="panel">
            <header className="panel-encabezado">
              <h2>Previsualización del CV</h2>
            </header>
            <div className="panel-cuerpo panel-visor">
              <CvPreview url={solicitud.cv.url} nombreArchivo={solicitud.cv.nombreArchivo} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}