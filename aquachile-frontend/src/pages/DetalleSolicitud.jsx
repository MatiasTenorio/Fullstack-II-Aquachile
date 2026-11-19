import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, guardarArchivo } from "../services/api";
import {
  ESTADOS_CERRADOS,
  ESTADOS_ENTREVISTA_UI,
  ESTADOS_UI,
  ETIQUETA_MODALIDAD,
  ROLES,
  ROLES_CAMBIAN_ESTADO,
} from "../data/catalogos";
import { formatearFecha, formatearFechaHora, formatearHora } from "../utils/fechas";
import CvPreview from "../components/CvPreview";
import EntrevistaForm from "../components/EntrevistaForm";
import MotivoForm from "../components/MotivoForm";
import HistorialEstados from "../components/HistorialEstados";
import "../components/formularios.css";
import "./DetalleSolicitud.css";

const EXTENSIONES_INFORME = ["pdf", "doc", "docx"];
const TAMANO_MAXIMO_INFORME = 5 * 1024 * 1024; // 5 MB, el mismo límite del backend
const COLOR_BOTON = { backgroundColor: '#445664', color: '#FFFFFF' };

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
  // Formulario abierto en este momento: "agendar" | "reprogramar" | "pausar" | "cancelar" | null
  const [accion, setAccion] = useState(null);

  // { blob, nombre, url } cuando el CV ya se descargó; errorCv si falló.
  const [cv, setCv] = useState(null);
  const [cargandoCv, setCargandoCv] = useState(false);
  const [errorCv, setErrorCv] = useState("");

  // Solo el analista asigna o cambia el evaluador responsable.
  const esAnalista = usuarioActual?.rol === ROLES.ANALISTA;
  const [evaluadores, setEvaluadores] = useState([]);
  const [evaluadorElegido, setEvaluadorElegido] = useState("");
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    if (!esAnalista) return undefined;
    let cancelado = false;
    api("/usuarios/evaluadores")
      .then((lista) => {
        if (!cancelado && Array.isArray(lista)) setEvaluadores(lista);
      })
      .catch(() => {
        // sin la lista no se muestra el selector; el resto de la pantalla funciona igual
      });
    return () => {
      cancelado = true;
    };
  }, [api, esAnalista]);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga("");
    setSolicitud(null);
    setAccion(null);
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

  const estadoActual = solicitud.estado;
  const estado = ESTADOS_UI[estadoActual] ?? { etiqueta: estadoActual, bg: "#e9ecef", text: "#495057", clase: "" };
  const cerrada = ESTADOS_CERRADOS.includes(estadoActual);
  const informeDisponible = solicitud.informeDisponible;

  // Entrevistas: la vigente es la que sigue agendada. Si no hay, se muestra como registro
  // la última realizada y, si tampoco hay, la más reciente (que estará cancelada).
  const entrevistas = solicitud.entrevistas ?? [];
  const historial = solicitud.historial ?? [];
  const entrevistaVigente = entrevistas.find((e) => e.estado === "AGENDADA") ?? null;
  const entrevistaMostrada = entrevistaVigente
    ?? entrevistas.find((e) => e.estado === "REALIZADA")
    ?? entrevistas[0]
    ?? null;
  const entrevistaYaOcurrio = entrevistaVigente && new Date(entrevistaVigente.inicio) <= new Date();

  // Acciones del evaluador responsable según el estado de la solicitud.
  const esEvaluador = ROLES_CAMBIAN_ESTADO.includes(usuarioActual?.rol);
  const abierta = estadoActual === "PENDIENTE" || estadoActual === "EN_PROCESO";
  const puedeAgendar = esEvaluador && abierta && !entrevistaVigente;
  const puedeSubirInforme = esEvaluador && estadoActual === "EN_PROCESO";
  const puedeFinalizar = esEvaluador && estadoActual === "EN_PROCESO";
  const puedePausar = esEvaluador && abierta;
  const puedeReanudar = esEvaluador && estadoActual === "EN_PAUSA";
  const puedeCancelar = esEvaluador && !cerrada;
  const puedeAsignar = esAnalista && !cerrada && evaluadores.length > 0;

  // Motivo con el que se pausó o canceló: es el comentario del registro que la dejó en ese estado.
  const registroEstado = (estadoActual === "EN_PAUSA" || estadoActual === "CANCELADO")
    ? historial.find((h) => h.estadoNuevo === estadoActual && h.estadoAnterior !== estadoActual)
    : null;

  // Ejecuta una llamada que devuelve la solicitud actualizada y muestra el resultado.
  const ejecutar = async (llamada, mensajeExito, mensajeError) => {
    setAviso(null);
    setGuardando(true);
    try {
      const actualizada = await llamada();
      setSolicitud(actualizada);
      setAccion(null);
      if (mensajeExito) setAviso({ tipo: "success", texto: mensajeExito });
    } catch (e) {
      setAviso({ tipo: "warning", texto: e instanceof ApiError ? e.message : mensajeError });
    } finally {
      setGuardando(false);
    }
  };

  const enviarJson = (ruta, method, cuerpo) =>
    api(ruta, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

  const cambiarEstado = (nuevoEstado, motivo, mensajeExito) =>
    ejecutar(
      () => enviarJson(`/solicitudes/${id}/estado`, "PATCH", motivo ? { estado: nuevoEstado, motivo } : { estado: nuevoEstado }),
      mensajeExito,
      "No se pudo actualizar el estado."
    );

  const agendarEntrevista = (datos) =>
    ejecutar(
      () => enviarJson(`/solicitudes/${id}/entrevistas`, "POST", datos),
      "Entrevista agendada. La solicitud quedó En Proceso.",
      "No se pudo agendar la entrevista."
    );

  const reprogramarEntrevista = (datos) =>
    ejecutar(
      () => enviarJson(`/solicitudes/${id}/entrevistas/${entrevistaVigente.id}`, "PUT", datos),
      "Entrevista reprogramada.",
      "No se pudo reprogramar la entrevista."
    );

  const marcarRealizada = () =>
    ejecutar(
      () => api(`/solicitudes/${id}/entrevistas/${entrevistaVigente.id}/realizada`, { method: "PATCH" }),
      "Entrevista marcada como realizada.",
      "No se pudo actualizar la entrevista."
    );

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

  const asignarEvaluador = async () => {
    setAviso(null);
    setAsignando(true);
    try {
      const actualizada = await enviarJson(`/solicitudes/${id}`, "PATCH", { responsableId: Number(evaluadorElegido) });
      setSolicitud(actualizada);
      setEvaluadorElegido("");
      setAviso({ tipo: "success", texto: `Solicitud asignada a ${actualizada.responsable.nombre}.` });
    } catch (e) {
      setAviso({ tipo: "warning", texto: e instanceof ApiError ? e.message : "No se pudo asignar el evaluador." });
    } finally {
      setAsignando(false);
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
                  style={COLOR_BOTON}
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
                {solicitud.analista && <li>Creada por: {solicitud.analista.nombre}</li>}
                <li>Informe: {informeDisponible ? solicitud.informeNombreArchivo ?? "Adjunto" : "Pendiente"}</li>
                {solicitud.solicitudesDelCandidato > 1 && (
                  <li className="aviso-repetido">
                    Este candidato tiene <strong>{solicitud.solicitudesDelCandidato}</strong> solicitudes
                  </li>
                )}
              </ul>

              {registroEstado && (
                <div className="aviso-estado" style={{ backgroundColor: estado.bg, color: estado.text }}>
                  <strong>{estadoActual === "EN_PAUSA" ? "Solicitud en pausa" : "Solicitud cancelada"}</strong>
                  {" "}por {registroEstado.usuarioNombre} el {formatearFechaHora(registroEstado.fecha)}.
                  {registroEstado.comentario && <div>Motivo: {registroEstado.comentario}</div>}
                </div>
              )}

              {puedeAsignar && (
                <div className="d-flex align-items-end gap-2 mt-3">
                  <div className="flex-grow-1">
                    <label htmlFor="evaluador" className="form-label small mb-1">
                      {solicitud.responsable ? "Cambiar evaluador responsable" : "Asignar evaluador responsable"}
                    </label>
                    <select
                      id="evaluador"
                      className="form-select form-select-sm"
                      value={evaluadorElegido}
                      onChange={(e) => setEvaluadorElegido(e.target.value)}
                    >
                      <option value="">Seleccione un evaluador</option>
                      {evaluadores
                        .filter((u) => u.id !== solicitud.responsable?.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                    </select>
                    {entrevistaVigente && (
                      <div className="form-text">Al cambiar de evaluador se cancela la entrevista agendada.</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={COLOR_BOTON}
                    disabled={!evaluadorElegido || asignando}
                    onClick={asignarEvaluador}
                  >
                    {asignando ? "Asignando..." : "Asignar"}
                  </button>
                </div>
              )}

              <div className="seccion">
                <h3 className="seccion-titulo">Entrevista</h3>
                {!entrevistaMostrada && (
                  <p className="small text-muted mb-0">
                    {estadoActual === "PENDIENTE"
                      ? "Aún no hay entrevista. Al agendarla, la solicitud pasa a En Proceso."
                      : "No hay una entrevista agendada."}
                  </p>
                )}
                {entrevistaMostrada && accion !== "reprogramar" && (
                  <div className="entrevista-tarjeta">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="entrevista-fecha">
                          {formatearFechaHora(entrevistaMostrada.inicio)} a {formatearHora(entrevistaMostrada.fin)}
                        </div>
                        <div>
                          {ETIQUETA_MODALIDAD[entrevistaMostrada.modalidad] ?? entrevistaMostrada.modalidad}
                          {entrevistaMostrada.ubicacion && <> · {entrevistaMostrada.ubicacion}</>}
                        </div>
                        {entrevistaMostrada.enGoogleCalendar && (
                          <div className="small text-muted">
                            <i className="bi bi-google" aria-hidden="true"></i> En Google Calendar
                          </div>
                        )}
                      </div>
                      <span
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          backgroundColor: ESTADOS_ENTREVISTA_UI[entrevistaMostrada.estado]?.bg,
                          color: ESTADOS_ENTREVISTA_UI[entrevistaMostrada.estado]?.text,
                        }}
                      >
                        {ESTADOS_ENTREVISTA_UI[entrevistaMostrada.estado]?.etiqueta ?? entrevistaMostrada.estado}
                      </span>
                    </div>
                    {esEvaluador && entrevistaVigente && !accion && (
                      <div className="d-flex gap-2 mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          disabled={guardando}
                          onClick={() => { setAviso(null); setAccion("reprogramar"); }}
                        >
                          Reprogramar
                        </button>
                        {entrevistaYaOcurrio && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={guardando}
                            onClick={marcarRealizada}
                          >
                            Marcar como realizada
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {entrevistas.length > 1 && accion !== "reprogramar" && (
                  <p className="small text-muted mt-2 mb-0">
                    Entrevistas anteriores: {entrevistas
                      .filter((e) => e.id !== entrevistaMostrada.id)
                      .map((e) => `${formatearFechaHora(e.inicio)} (${(ESTADOS_ENTREVISTA_UI[e.estado]?.etiqueta ?? e.estado).toLowerCase()})`)
                      .join(", ")}
                  </p>
                )}
              </div>

              {accion === "agendar" && (
                <EntrevistaForm enviando={guardando} onGuardar={agendarEntrevista} onCancelar={() => setAccion(null)} />
              )}
              {accion === "reprogramar" && entrevistaVigente && (
                <EntrevistaForm
                  entrevista={entrevistaVigente}
                  enviando={guardando}
                  onGuardar={reprogramarEntrevista}
                  onCancelar={() => setAccion(null)}
                />
              )}
              {accion === "pausar" && (
                <MotivoForm
                  titulo="Pausar solicitud"
                  descripcion={entrevistaVigente
                    ? "La solicitud queda detenida hasta que la reanudes. La entrevista agendada se cancela."
                    : "La solicitud queda detenida hasta que la reanudes."}
                  etiquetaBoton="Pausar solicitud"
                  enviando={guardando}
                  onConfirmar={(motivo) => cambiarEstado("EN_PAUSA", motivo, "Solicitud en pausa.")}
                  onCancelar={() => setAccion(null)}
                />
              )}
              {accion === "cancelar" && (
                <MotivoForm
                  titulo="Cancelar solicitud"
                  descripcion="Esta acción es definitiva: una solicitud cancelada no se puede reabrir."
                  etiquetaBoton="Cancelar solicitud"
                  peligro
                  enviando={guardando}
                  onConfirmar={(motivo) => cambiarEstado("CANCELADO", motivo, "Solicitud cancelada.")}
                  onCancelar={() => setAccion(null)}
                />
              )}

              <div className="seccion">
                <h3 className="seccion-titulo">Historial</h3>
                <HistorialEstados historial={historial} />
              </div>
            </div>

            {aviso && <div className={`alert alert-${aviso.tipo} py-2 mx-3 mt-2 mb-0`}>{aviso.texto}</div>}
            {puedeFinalizar && !informeDisponible && !aviso && (
              <p className="aviso-informe mt-2">Sube el informe del psicólogo para poder completar la solicitud.</p>
            )}

            <footer className="panel-acciones">
              <span
                className={`badge rounded-pill px-3 py-2 ${estado.clase}`}
                style={{ backgroundColor: estado.bg, color: estado.text }}
              >
                {estado.etiqueta}
              </span>
              {puedeAgendar && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={COLOR_BOTON}
                  disabled={guardando || accion === "agendar"}
                  onClick={() => { setAviso(null); setAccion("agendar"); }}
                >
                  Agendar entrevista
                </button>
              )}
              {puedeReanudar && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={COLOR_BOTON}
                  disabled={guardando}
                  onClick={() => cambiarEstado(solicitud.estadoPrevio ?? "PENDIENTE", null, "Solicitud reanudada.")}
                >
                  {guardando ? "Reanudando..." : "Reanudar solicitud"}
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
                    style={COLOR_BOTON}
                    disabled={subiendoInforme}
                    onClick={() => inputInforme.current?.click()}
                  >
                    {subiendoInforme ? "Subiendo..." : informeDisponible ? "Reemplazar informe" : "Subir informe"}
                  </button>
                </>
              )}
              {puedeFinalizar && (
                <button
                  type="button"
                  className="btn btn-sm ActualizarEstado"
                  style={COLOR_BOTON}
                  disabled={guardando || !informeDisponible}
                  title={!informeDisponible ? "Primero sube el informe del psicólogo" : undefined}
                  onClick={() => cambiarEstado("FINALIZADO", null, "Solicitud finalizada.")}
                >
                  Finalizar solicitud
                </button>
              )}
              {puedePausar && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={guardando || accion === "pausar"}
                  onClick={() => { setAviso(null); setAccion("pausar"); }}
                >
                  Pausar
                </button>
              )}
              {puedeCancelar && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={guardando || accion === "cancelar"}
                  onClick={() => { setAviso(null); setAccion("cancelar"); }}
                >
                  Cancelar solicitud
                </button>
              )}
              {informeDisponible && (
                <button
                  type="button"
                  className="btn btn-sm DescargarInforme"
                  style={COLOR_BOTON}
                  onClick={descargarInforme}
                >
                  Descargar informe
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm CVDownload"
                style={COLOR_BOTON}
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
