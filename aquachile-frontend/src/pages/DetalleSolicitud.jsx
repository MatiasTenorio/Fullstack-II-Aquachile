import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ESTADOS, solicitudesMock } from "../data/solicitudes";
import CvPreview from "../components/CvPreview";
import "./DetalleSolicitud.css";

const claseEstado = {
  Pendiente: "estado-pendiente",
  "En Proceso": "estado-proceso",
  Completo: "estado-completo",
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
              <button className="btn-volver" onClick={() => navigate("/solicitudes")}>
                ◀ Volver
              </button>
              <h2>Solicitud</h2>
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
              <span className={`badge-estado ${claseEstado[estado]}`}>{estado}</span>
              <button className="btn-accion btn-actualizar" onClick={actualizarEstado}>
                Actualizar Estado
              </button>
              <a
                className="btn-accion btn-descargar"
                href={solicitud.cv.url}
                download={solicitud.cv.nombreArchivo}
              >
                Descargar CV
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