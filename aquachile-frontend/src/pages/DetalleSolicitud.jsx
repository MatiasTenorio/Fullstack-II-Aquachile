import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, guardarArchivo } from "../services/api";
import {
  ESTADOS_UI,
  ROLES_CAMBIAN_ESTADO,
  SIGUIENTE_ESTADO,
} from "../data/catalogos";
import CvPreview from "../components/CvPreview";
import "./DetalleSolicitud.css";

const EXTENSIONES_INFORME = ["pdf", "doc", "docx"];
const TAMANO_MAXIMO_INFORME = 5 * 1024 * 1024; // 5 MB, el mismo límite del backend

function formatearFecha(iso) {
  return iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("es-CL") : "";
}

// Hora local de quien mira la pantalla, en formato 24 horas (ej: 03:20 o 15:45).
function formatearHora(instante) {
  return instante
    ? new Date(instante).toLocaleTimeString("es-CL", { hour: "numeric", minute: "2-digit", hour12: false })
    : "";
}

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, descargar, usuarioActual } = useAuth();
  const inputInforme = useRef(null);

  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo: "warning" | "success", texto }
  const [guardando, setGuardando] = useState(false);
  const [subiendoInforme, setSubiendoInforme] = useState(false);

  // { blob, nombre, url } cuando el CV ya se descargó; errorCv si falló.
  const [cv, setCv] = useState(null);
  const [cargandoCv, setCargandoCv] = useState(false);
  const [errorCv, setErrorCv] = useState("");

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga("");
    setSolicitud(null);
    api(`/solicitudes/${id}`)
      .then((datos) => {
        if (!cancelado) setSolicitud(datos);
      })
      .catch((e) => {
        if (!cancelado) {
          setErrorCarga(e instanceof ApiError ? e.message : "No se pudo cargar la solicitud.");
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [api, id]);

  // El CV está protegido con token, así que se baja con fetch y se muestra desde una URL local del navegador.
  const cvDisponible = solicitud?.cvDisponible ?? false;
  useEffect(() => {
    if (!cvDisponible) {
      setCv(null);
      return undefined;
    }
    let cancelado = false;
    let urlCreada = null;
    setCargandoCv(true);
    setErrorCv("");
    descargar(`/solicitudes/${id}/cv`)
      .then(({ blob, nombre }) => {
        if (cancelado) return;
        urlCreada = URL.createObjectURL(blob);
        setCv({ blob, nombre, url: urlCreada });
      })
      .catch((e) => {
        if (!cancelado) setErrorCv(e instanceof ApiError ? e.message : "No se pudo cargar el CV.");
      })
      .finally(() => {
        if (!cancelado) setCargandoCv(false);
      });
    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [descargar, id, cvDisponible]);

  if (cargando) {
    return (
      <div className="container py-4">
        <p className="text-muted">Cargando solicitud...</p>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="container py-4">
        <p>{errorCarga || "No se encontró la solicitud seleccionada."}</p>
        <button className="btn btn-secondary" onClick={() => navigate("/solicitudes")}>
          Volver
        </button>
      </div>
    );
  }

  const nombre = solicitud.candidato.nombre;
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();

  const estado = ESTADOS_UI[solicitud.estado] ?? { etiqueta: solicitud.estado, bg: "#e9ecef", text: "#495057", clase: "" };
  const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
  const rolPuedeGestionar = ROLES_CAMBIAN_ESTADO.includes(usuarioActual?.rol);
  const puedeCambiarEstado = rolPuedeGestionar && siguiente;
  const informeDisponible = solicitud.informeDisponible;
  const puedeSubirInforme = rolPuedeGestionar && solicitud.estado !== "FINALIZADO";
  // Para completar la solicitud hace falta el informe del psicólogo.
  const faltaInforme = siguiente === "FINALIZADO" && !informeDisponible;

  const seleccionarInforme = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const extension = archivo.name.split(".").pop().toLowerCase();
    if (!EXTENSIONES_INFORME.includes(extension)) {
      setAviso({ tipo: "warning", texto: "El informe debe ser un archivo PDF, DOC o DOCX." });
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_INFORME) {
      setAviso({ tipo: "warning", texto: "El informe no puede superar los 5 MB." });
      return;
    }
    setAviso(null);
    setSubiendoInforme(true);
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const actualizada = await api(`/solicitudes/${id}/informe`, { method: "POST", body: datos });
      setSolicitud(actualizada);
      setAviso({ tipo: "success", texto: "Informe subido correctamente." });
    } catch (err) {
      setAviso({ tipo: "warning", texto: err instanceof ApiError ? err.message : "No se pudo subir el informe." });
    } finally {
      setSubiendoInforme(false);
    }
  };

  const descargarInforme = async () => {
    try {
      const { blob, nombre } = await descargar(`/solicitudes/${id}/informe`);
      guardarArchivo(blob, nombre);
    } catch (err) {
      setAviso({ tipo: "warning", texto: err instanceof ApiError ? err.message : "No se pudo descargar el informe." });
    }
  };

  const actualizarEstado = async () => {
    setAviso(null);
    setGuardando(true);
    try {
      const actualizada = await api(`/solicitudes/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: siguiente }),
      });
      setSolicitud(actualizada);
    } catch (e) {
      setAviso({ tipo: "warning", texto: e instanceof ApiError ? e.message : "No se pudo actualizar el estado." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="detalle-pagina container-fluid py-3 px-4">
      <div className="row g-3">
        <div className="col-lg-6">
          <section className="panel">
            <header className="panel-encabezado">
              <div className="position-relative d-flex align-items-center justify-content-center py-1 Volver"
              style={{ backgroundColor: '#8fb0c5' }}>
                <button
                  className="btn btn-sm position-absolute start-0 ms-30"
                  style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  onClick={() => navigate("/solicitudes")}
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
                  <strong>{nombre}</strong>
                  <div className="candidato-email">{solicitud.candidato.correo ?? "Sin correo registrado"}</div>
                </div>
              </div>

              <ul className="datos-solicitud">
                <li>Cargo: {solicitud.cargo}</li>
                <li>Familia de Cargo: {solicitud.familiaCargo}</li>
                <li>Fecha de solicitud: {formatearFecha(solicitud.fechaSolicitud)}</li>
                {solicitud.creadaEn && <li>Hora de envío: {formatearHora(solicitud.creadaEn)}</li>}
                <li>Responsable: {solicitud.responsable ? solicitud.responsable.nombre : "Sin asignar"}</li>
                <li>Informe: {informeDisponible ? solicitud.informeNombreArchivo ?? "Adjunto" : "Pendiente"}</li>
                {solicitud.solicitudesDelCandidato > 1 && (
                  <li className="aviso-repetido">
                    Este correo ha enviado <strong>{solicitud.solicitudesDelCandidato}</strong> solicitudes
                  </li>
                )}
              </ul>
            </div>

            {aviso && <div className={`alert alert-${aviso.tipo} py-2 mx-3`}>{aviso.texto}</div>}
            {puedeCambiarEstado && faltaInforme && !aviso && (
              <p className="aviso-informe">Sube el informe del psicólogo para poder completar la solicitud.</p>
            )}

            <footer className="panel-acciones">
              <span
                className={`badge rounded-pill px-3 py-2 ${estado.clase}`}
                style={{ backgroundColor: estado.bg, color: estado.text }}
              >
                {estado.etiqueta}
              </span>
              {puedeCambiarEstado && (
                <button
                  type="button"
                  className="btn btn-sm ActualizarEstado"
                  style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  disabled={guardando || faltaInforme}
                  title={faltaInforme ? "Primero sube el informe del psicólogo" : undefined}
                  onClick={actualizarEstado}
                >
                  {guardando ? "Actualizando..." : "Actualizar Estado"}
                </button>
              )}
              {puedeSubirInforme && (
                <>
                  <input
                    ref={inputInforme}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="d-none"
                    onChange={seleccionarInforme}
                  />
                  <button
                    type="button"
                    className="btn btn-sm SubirInforme"
                    style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                    disabled={subiendoInforme}
                    onClick={() => inputInforme.current?.click()}
                  >
                    {subiendoInforme ? "Subiendo..." : informeDisponible ? "Reemplazar informe" : "Subir informe"}
                  </button>
                </>
              )}
              {informeDisponible && (
                <button
                  type="button"
                  className="btn btn-sm DescargarInforme"
                  style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  onClick={descargarInforme}
                >
                  Descargar informe
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm CVDownload"
                style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                disabled={!cv}
                onClick={() => guardarArchivo(cv.blob, cv.nombre)}
              >
                Descargar CV
              </button>
            </footer>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="panel">
            <header className="panel-encabezado">
              <h2>Previsualización del CV</h2>
            </header>
            <div className="panel-cuerpo panel-visor">
              {!cvDisponible && <p className="text-muted">Esta solicitud no tiene un CV adjunto.</p>}
              {cargandoCv && <p className="text-muted">Cargando CV...</p>}
              {errorCv && <div className="alert alert-danger py-2">{errorCv}</div>}
              {cv && <CvPreview url={cv.url} nombreArchivo={cv.nombre} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
