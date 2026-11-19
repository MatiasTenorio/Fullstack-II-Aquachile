import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { ESTADOS_ENTREVISTA_UI, ETIQUETA_MODALIDAD, ROLES } from '../data/catalogos';
import { capitalizar, formatearHora } from '../utils/fechas';
import { redirigir } from '../utils/navegador';
import EntrevistaForm from '../components/EntrevistaForm';
import './Calendario.css';

const NOMBRES_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_EVENTOS_POR_DIA = 3;

// Mensaje que se muestra al volver desde la página de autorización de Google (?google=...)
const RESULTADO_GOOGLE = {
  conectado: { tipo: 'success', texto: 'Tu cuenta de Google quedó conectada. Las entrevistas que agendes aparecerán también en tu Google Calendar.' },
  cancelado: { tipo: 'warning', texto: 'No se conectó la cuenta de Google porque la autorización fue cancelada.' },
  error: { tipo: 'warning', texto: 'No se pudo conectar la cuenta de Google. Intenta nuevamente.' },
};

const dos = (n) => String(n).padStart(2, '0');

// Clave de un día en hora local, ej: "2026-11-19". Sirve para agrupar las entrevistas por día.
function claveDia(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function primerDiaDelMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// Días que muestra la grilla: semanas completas de lunes a domingo que cubren el mes.
function diasDeLaGrilla(mes) {
  const inicio = new Date(mes);
  inicio.setDate(1 - ((mes.getDay() + 6) % 7)); // retrocede hasta el lunes
  const ultimoDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  const dias = [];
  const dia = new Date(inicio);
  while (dia <= ultimoDelMes || dias.length % 7 !== 0) {
    dias.push(new Date(dia));
    dia.setDate(dia.getDate() + 1);
  }
  return dias;
}

// Calendario de entrevistas. El evaluador ve las suyas y puede agendar desde un día;
// el analista ve las de todos los evaluadores.
function Calendario() {
  const { api, usuarioActual } = useAuth();
  const esEvaluador = usuarioActual?.rol === ROLES.EVALUADOR;

  const [mes, setMes] = useState(() => primerDiaDelMes(new Date()));
  const [seleccionado, setSeleccionado] = useState(() => claveDia(new Date()));
  const [entrevistas, setEntrevistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Agendar desde el calendario (solo el evaluador)
  const [agendables, setAgendables] = useState([]); // sus solicitudes abiertas sin entrevista agendada
  const [agendando, setAgendando] = useState(false);
  const [solicitudElegida, setSolicitudElegida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'success' | 'warning', texto }

  // Google Calendar (solo el evaluador): { habilitado, conectado, googleEmail }
  const [google, setGoogle] = useState(null);
  const [avisoGoogle, setAvisoGoogle] = useState(null);
  const [ocupadoGoogle, setOcupadoGoogle] = useState(false);
  const [parametros, setParametros] = useSearchParams();
  const resultadoGoogle = parametros.get('google');

  useEffect(() => {
    if (!esEvaluador) return undefined;
    let cancelado = false;
    api('/google/calendar/estado')
      .then((estado) => {
        if (!cancelado) setGoogle(estado);
      })
      .catch(() => {
        // sin el estado no se muestra la tarjeta de Google; el calendario interno funciona igual
      });
    return () => {
      cancelado = true;
    };
  }, [api, esEvaluador]);

  // Al volver desde Google se muestra el resultado y se limpia el parámetro de la dirección
  useEffect(() => {
    if (!resultadoGoogle) return;
    setAvisoGoogle(RESULTADO_GOOGLE[resultadoGoogle] ?? RESULTADO_GOOGLE.error);
    setParametros({}, { replace: true });
  }, [resultadoGoogle, setParametros]);

  const conectarGoogle = async () => {
    setAvisoGoogle(null);
    setOcupadoGoogle(true);
    try {
      const { url } = await api('/google/calendar/autorizacion', { method: 'POST' });
      redirigir(url); // el navegador sale a la página de Google y vuelve a /calendario?google=...
    } catch (e) {
      setAvisoGoogle({ tipo: 'warning', texto: e instanceof ApiError ? e.message : 'No se pudo iniciar la conexión con Google.' });
      setOcupadoGoogle(false);
    }
  };

  const desconectarGoogle = async () => {
    setAvisoGoogle(null);
    setOcupadoGoogle(true);
    try {
      setGoogle(await api('/google/calendar/conexion', { method: 'DELETE' }));
      setAvisoGoogle({ tipo: 'success', texto: 'Cuenta de Google desconectada. Los eventos que ya estaban en tu Google Calendar no se borran.' });
    } catch (e) {
      setAvisoGoogle({ tipo: 'warning', texto: e instanceof ApiError ? e.message : 'No se pudo desconectar la cuenta.' });
    } finally {
      setOcupadoGoogle(false);
    }
  };

  const dias = useMemo(() => diasDeLaGrilla(mes), [mes]);

  const cargarEntrevistas = useCallback(() => {
    const grilla = diasDeLaGrilla(mes);
    const desde = grilla[0];
    const hasta = new Date(grilla[grilla.length - 1]);
    hasta.setDate(hasta.getDate() + 1);
    setCargando(true);
    return api(`/entrevistas?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`)
      .then((datos) => {
        setEntrevistas(datos);
        setError('');
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar el calendario.'))
      .finally(() => setCargando(false));
  }, [api, mes]);

  const cargarAgendables = useCallback(() => {
    if (!esEvaluador) return Promise.resolve();
    return api('/solicitudes')
      .then((lista) => {
        setAgendables(lista.filter((s) => ['PENDIENTE', 'EN_PROCESO'].includes(s.estado) && !s.entrevistaInicio));
      })
      .catch(() => {
        // sin esta lista solo se pierde el botón de agendar; el calendario se sigue viendo
      });
  }, [api, esEvaluador]);

  useEffect(() => {
    cargarEntrevistas();
  }, [cargarEntrevistas]);

  useEffect(() => {
    cargarAgendables();
  }, [cargarAgendables]);

  const porDia = useMemo(() => {
    const mapa = {};
    for (const entrevista of entrevistas) {
      const clave = claveDia(new Date(entrevista.inicio));
      (mapa[clave] ??= []).push(entrevista);
    }
    return mapa;
  }, [entrevistas]);

  const cambiarMes = (meses) => {
    setMes((actual) => new Date(actual.getFullYear(), actual.getMonth() + meses, 1));
    setAgendando(false);
  };

  const irAHoy = () => {
    setMes(primerDiaDelMes(new Date()));
    setSeleccionado(claveDia(new Date()));
    setAgendando(false);
  };

  const seleccionarDia = (dia) => {
    setSeleccionado(claveDia(dia));
    setAgendando(false);
    setAviso(null);
  };

  const agendar = async (datos) => {
    setAviso(null);
    setGuardando(true);
    try {
      await api(`/solicitudes/${solicitudElegida}/entrevistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      setAgendando(false);
      setSolicitudElegida('');
      setAviso({ tipo: 'success', texto: 'Entrevista agendada.' });
      await Promise.all([cargarEntrevistas(), cargarAgendables()]);
    } catch (e) {
      setAviso({ tipo: 'warning', texto: e instanceof ApiError ? e.message : 'No se pudo agendar la entrevista.' });
    } finally {
      setGuardando(false);
    }
  };

  // Reintenta copiar a Google Calendar una entrevista agendada que no quedó sincronizada
  const enviarAGoogle = async (entrevista) => {
    setAviso(null);
    setOcupadoGoogle(true);
    try {
      await api(`/solicitudes/${entrevista.solicitudId}/entrevistas/${entrevista.id}/google`, { method: 'POST' });
      setAviso({ tipo: 'success', texto: 'Entrevista enviada a Google Calendar.' });
      await cargarEntrevistas();
    } catch (e) {
      setAviso({ tipo: 'warning', texto: e instanceof ApiError ? e.message : 'No se pudo enviar a Google Calendar.' });
    } finally {
      setOcupadoGoogle(false);
    }
  };

  const hoy = claveDia(new Date());
  const entrevistasDelDia = porDia[seleccionado] ?? [];
  const fechaSeleccionada = new Date(`${seleccionado}T00:00:00`);
  const tituloDia = capitalizar(
    fechaSeleccionada.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  );
  const puedeAgendar = esEvaluador && seleccionado >= hoy;

  return (
    <div className="container-fluid py-4 px-4 text-start">
      <h2 className="fw-bold" style={{ color: '#445664' }}>Calendario</h2>
      <p className="text-muted">
        {esEvaluador
          ? 'Tus entrevistas agendadas y realizadas. Elige un día para ver el detalle o agendar.'
          : 'Entrevistas agendadas y realizadas de todos los evaluadores.'}
      </p>

      {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

      {avisoGoogle && <div className={`alert alert-${avisoGoogle.tipo} py-2`} role="alert">{avisoGoogle.texto}</div>}
      {google?.habilitado && (
        <div className="calendario-google">
          <i className="bi bi-google" aria-hidden="true"></i>
          {google.conectado ? (
            <>
              <span>
                Google Calendar conectado{google.googleEmail && <> como <strong>{google.googleEmail}</strong></>}.
                Las entrevistas que agendes se copian a ese calendario.
              </span>
              <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" disabled={ocupadoGoogle} onClick={desconectarGoogle}>
                Desconectar
              </button>
            </>
          ) : (
            <>
              <span>Conecta tu cuenta de Google para que tus entrevistas aparezcan también en tu Google Calendar.</span>
              <button
                type="button"
                className="btn btn-sm ms-auto"
                style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                disabled={ocupadoGoogle}
                onClick={conectarGoogle}
              >
                Conectar Google Calendar
              </button>
            </>
          )}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="calendario-barra">
            <button type="button" className="btn btn-sm btn-outline-secondary" aria-label="Mes anterior" onClick={() => cambiarMes(-1)}>
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" aria-label="Mes siguiente" onClick={() => cambiarMes(1)}>
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
            <h3 className="calendario-mes">
              {capitalizar(mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }))}
            </h3>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={irAHoy}>Hoy</button>
            {cargando && <span className="small text-muted">Cargando...</span>}
          </div>

          <div className="calendario-grilla">
            {NOMBRES_DIAS.map((nombre) => (
              <div key={nombre} className="calendario-nombre-dia">{nombre}</div>
            ))}
            {dias.map((dia) => {
              const clave = claveDia(dia);
              const eventos = porDia[clave] ?? [];
              const clases = [
                'calendario-dia',
                dia.getMonth() !== mes.getMonth() ? 'otro-mes' : '',
                clave === hoy ? 'hoy' : '',
                clave === seleccionado ? 'seleccionado' : '',
              ].join(' ');
              return (
                <button
                  type="button"
                  key={clave}
                  className={clases}
                  aria-label={`${dia.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}, ${eventos.length} entrevistas`}
                  aria-pressed={clave === seleccionado}
                  onClick={() => seleccionarDia(dia)}
                >
                  <span className="calendario-numero">{dia.getDate()}</span>
                  {eventos.slice(0, MAX_EVENTOS_POR_DIA).map((e) => (
                    <span
                      key={e.id}
                      className="calendario-evento"
                      style={{
                        backgroundColor: ESTADOS_ENTREVISTA_UI[e.estado]?.bg,
                        color: ESTADOS_ENTREVISTA_UI[e.estado]?.text,
                      }}
                    >
                      {formatearHora(e.inicio)} {e.candidatoNombre}
                    </span>
                  ))}
                  {eventos.length > MAX_EVENTOS_POR_DIA && (
                    <span className="calendario-mas">+{eventos.length - MAX_EVENTOS_POR_DIA} más</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="calendario-panel">
            <h3 className="calendario-panel-titulo">{tituloDia}</h3>

            {aviso && <div className={`alert alert-${aviso.tipo} py-2`} role="alert">{aviso.texto}</div>}

            {entrevistasDelDia.length === 0 && <p className="text-muted small mb-2">No hay entrevistas este día.</p>}
            {entrevistasDelDia.map((e) => (
              <div key={e.id} className="calendario-entrevista">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="hora">{formatearHora(e.inicio)} a {formatearHora(e.fin)}</span>
                  <span
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: ESTADOS_ENTREVISTA_UI[e.estado]?.bg,
                      color: ESTADOS_ENTREVISTA_UI[e.estado]?.text,
                    }}
                  >
                    {ESTADOS_ENTREVISTA_UI[e.estado]?.etiqueta ?? e.estado}
                  </span>
                </div>
                <div className="fw-semibold">{e.candidatoNombre}</div>
                <div className="text-muted">{e.cargo}</div>
                {!esEvaluador && e.evaluadorNombre && <div className="text-muted">Evaluador: {e.evaluadorNombre}</div>}
                <div className="text-muted">
                  {ETIQUETA_MODALIDAD[e.modalidad] ?? e.modalidad}{e.ubicacion && <> · {e.ubicacion}</>}
                </div>
                {e.enGoogleCalendar && (
                  <div className="text-muted"><i className="bi bi-google" aria-hidden="true"></i> En Google Calendar</div>
                )}
                {esEvaluador && google?.conectado && !e.enGoogleCalendar && e.estado === 'AGENDADA' && (
                  <div>
                    <button type="button" className="btn btn-link btn-sm p-0" disabled={ocupadoGoogle} onClick={() => enviarAGoogle(e)}>
                      Enviar a Google Calendar
                    </button>
                  </div>
                )}
                <Link to={`/solicitudes/${e.solicitudId}`}>Ver solicitud</Link>
              </div>
            ))}

            {puedeAgendar && !agendando && (
              agendables.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-sm mt-2"
                  style={{ backgroundColor: '#445664', color: '#FFFFFF' }}
                  onClick={() => { setAviso(null); setAgendando(true); }}
                >
                  <i className="bi bi-calendar-plus" aria-hidden="true"></i> Agendar entrevista este día
                </button>
              ) : (
                <p className="text-muted small mt-2 mb-0">No tienes solicitudes pendientes de agendar.</p>
              )
            )}

            {puedeAgendar && agendando && (
              <div className="mt-2">
                <label htmlFor="solicitudAgendar" className="form-label small mb-1">Solicitud</label>
                <select
                  id="solicitudAgendar"
                  className="form-select form-select-sm"
                  value={solicitudElegida}
                  onChange={(e) => setSolicitudElegida(e.target.value)}
                >
                  <option value="">Seleccione una solicitud</option>
                  {agendables.map((s) => (
                    <option key={s.id} value={s.id}>{s.candidatoNombre} · {s.cargo}</option>
                  ))}
                </select>
                {solicitudElegida ? (
                  <EntrevistaForm
                    key={`${solicitudElegida}-${seleccionado}`}
                    fechaInicial={`${seleccionado}T09:00`}
                    apilado
                    enviando={guardando}
                    onGuardar={agendar}
                    onCancelar={() => setAgendando(false)}
                  />
                ) : (
                  <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setAgendando(false)}>
                    Volver
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendario;
