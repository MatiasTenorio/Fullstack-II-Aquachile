package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.candidatos.Candidato;
import com.duoc.aquachile_backend.candidatos.CandidatoService;
import com.duoc.aquachile_backend.drive.CarpetaCandidatoService;
import com.duoc.aquachile_backend.entrevista.Entrevista;
import com.duoc.aquachile_backend.entrevista.EntrevistaRepository;
import com.duoc.aquachile_backend.entrevista.EntrevistaResponse;
import com.duoc.aquachile_backend.entrevista.EstadoEntrevista;
import com.duoc.aquachile_backend.googlecalendar.GoogleCalendarService;
import com.duoc.aquachile_backend.notificaciones.DatosSolicitudCorreo;
import com.duoc.aquachile_backend.notificaciones.EvaluadorReasignadoEvento;
import com.duoc.aquachile_backend.notificaciones.SolicitudCreadaEvento;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final CandidatoService candidatoService;
    private final UsuarioRepository usuarioRepository;
    private final CarpetaCandidatoService carpetaCandidatoService;
    private final EntrevistaRepository entrevistaRepository;
    private final HistorialEstadoRepository historialRepository;
    private final GoogleCalendarService googleCalendar;
    private final RegistroAcciones registro;
    private final ApplicationEventPublisher eventos;

    /** Las fechas que se escriben en el historial van en hora de Chile. */
    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm").withZone(ZoneId.of("America/Santiago"));

    public static String formatear(Instant instante) {
        return FORMATO_FECHA_HORA.format(instante);
    }

    @Transactional
    public SolicitudResponse crear(SolicitudCreateRequest request, UsuarioActual actual) {
        CatalogoCargos.validar(request.familiaCargo().trim(), request.cargo().trim());
        Candidato candidato = candidatoService.buscarEntidad(request.candidatoId());

        Solicitud solicitud = new Solicitud();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(request.cargo().trim());
        solicitud.setFamiliaCargo(request.familiaCargo().trim());
        solicitud.setResponsable(buscarEvaluador(request.responsableId()));
        solicitud.setAnalista(usuarioRepository.findById(actual.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado")));
        Solicitud guardada = solicitudRepository.save(solicitud);
        registrarHistorial(guardada, null, EstadoSolicitud.PENDIENTE,
                "Solicitud creada y asignada a " + guardada.getResponsable().getNombre(), actual);
        registro.registrar(actual, TipoAccion.SOLICITUD_CREADA, "Creó la solicitud " + RegistroAcciones.referencia(guardada)
                + " para el cargo " + guardada.getCargo() + ", asignada a " + guardada.getResponsable().getNombre(), guardada);
        // Aviso por correo al analista y al evaluador; se envia recien cuando la solicitud quedo guardada
        eventos.publishEvent(new SolicitudCreadaEvento(DatosSolicitudCorreo.de(guardada)));
        // Si Drive falla la solicitud igual se guarda; la carpeta se puede crear despues
        carpetaCandidatoService.intentarCrear(candidato);
        return aResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudResumenResponse> listar(SolicitudFiltro filtro, UsuarioActual actual) {
        // El analista ve todas; el profesional evaluador solo las que tiene asignadas
        Long evaluadorId = actual.rol() == Rol.PROFESIONAL_EVALUADOR ? actual.id() : null;
        Sort orden = Sort.by(Sort.Order.desc("fechaSolicitud"), Sort.Order.desc("id"));
        List<Solicitud> solicitudes = solicitudRepository.findAll(especificacion(filtro, evaluadorId), orden);

        // Una sola consulta trae la entrevista vigente de todas las solicitudes listadas
        Map<Long, Instant> entrevistaPorSolicitud = new HashMap<>();
        List<Long> ids = solicitudes.stream().map(Solicitud::getId).toList();
        if (!ids.isEmpty()) {
            for (Entrevista e : entrevistaRepository.findBySolicitudIdInAndEstado(ids, EstadoEntrevista.AGENDADA)) {
                entrevistaPorSolicitud.put(e.getSolicitud().getId(), e.getInicio());
            }
        }
        return solicitudes.stream()
                .map(s -> SolicitudResumenResponse.from(s, entrevistaPorSolicitud.get(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudResponse obtener(Long id, UsuarioActual actual) {
        Solicitud solicitud = buscarEntidad(id);
        verificarAcceso(solicitud, actual);
        return aResponse(solicitud);
    }

    /** El analista asigna o cambia al evaluador. La entrevista que tenia agendada el evaluador anterior se cancela. */
    @Transactional
    public SolicitudResponse actualizar(Long id, SolicitudActualizarRequest request, UsuarioActual actual) {
        Solicitud solicitud = buscarEntidad(id);
        if (solicitud.getEstado().esTerminal()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud ya esta cerrada; no se puede cambiar su responsable");
        }
        Usuario anterior = solicitud.getResponsable();
        Usuario nuevo = buscarEvaluador(request.responsableId());
        if (anterior != null && anterior.getId().equals(nuevo.getId())) {
            return aResponse(solicitud);
        }
        solicitud.setResponsable(nuevo);
        // El evento se borra del Google Calendar del evaluador anterior, que era su dueno
        boolean habiaEntrevista = cancelarEntrevistaAgendada(solicitud, anterior);
        registrarHistorial(solicitud, solicitud.getEstado(), solicitud.getEstado(),
                "Asignada a " + nuevo.getNombre()
                        + (habiaEntrevista ? "; se canceló la entrevista que estaba agendada" : ""),
                actual);
        registro.registrar(actual, TipoAccion.EVALUADOR_ASIGNADO, "Asignó la solicitud "
                + RegistroAcciones.referencia(solicitud) + " a " + nuevo.getNombre()
                + (anterior != null ? " (antes: " + anterior.getNombre() + ")" : ""), solicitud);
        eventos.publishEvent(new EvaluadorReasignadoEvento(DatosSolicitudCorreo.de(solicitud),
                usuarioRepository.findById(actual.id()).map(Usuario::getNombre).orElse(actual.email())));
        return aResponse(solicitud);
    }

    /**
     * Cambios de estado que hace el evaluador responsable:
     * pausar (desde Pendiente o En Proceso, con motivo), reanudar (vuelve al estado que tenia),
     * cancelar (con motivo, sin vuelta atras) y finalizar (requiere el informe).
     * Pasar a En Proceso no se hace aqui: ocurre al agendar la entrevista.
     */
    @Transactional
    public SolicitudResponse cambiarEstado(Long id, EstadoSolicitud nuevo, String motivo, UsuarioActual actual) {
        Solicitud solicitud = buscarEntidad(id);
        verificarAcceso(solicitud, actual);

        EstadoSolicitud anterior = solicitud.getEstado();
        String motivoLimpio = motivo == null || motivo.isBlank() ? null : motivo.trim();
        boolean abierta = anterior == EstadoSolicitud.PENDIENTE || anterior == EstadoSolicitud.EN_PROCESO;
        String comentario;

        if (nuevo == EstadoSolicitud.EN_PAUSA && abierta) {
            exigirMotivo(motivoLimpio, "Indica el motivo de la pausa");
            solicitud.setEstadoPrevio(anterior);
            boolean habiaEntrevista = cancelarEntrevistaAgendada(solicitud, solicitud.getResponsable());
            comentario = motivoLimpio + (habiaEntrevista ? " (se canceló la entrevista agendada)" : "");
        } else if (nuevo == EstadoSolicitud.CANCELADO && (abierta || anterior == EstadoSolicitud.EN_PAUSA)) {
            exigirMotivo(motivoLimpio, "Indica el motivo de la cancelacion");
            solicitud.setEstadoPrevio(null);
            boolean habiaEntrevista = cancelarEntrevistaAgendada(solicitud, solicitud.getResponsable());
            comentario = motivoLimpio + (habiaEntrevista ? " (se canceló la entrevista agendada)" : "");
        } else if (anterior == EstadoSolicitud.EN_PAUSA && nuevo == solicitud.getEstadoPrevio()) {
            solicitud.setEstadoPrevio(null);
            comentario = motivoLimpio != null ? motivoLimpio : "Solicitud reanudada";
        } else if (anterior == EstadoSolicitud.EN_PROCESO && nuevo == EstadoSolicitud.FINALIZADO) {
            if (solicitud.getInformeDriveFileId() == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Sube el informe del psicologo (PDF, DOC o DOCX) antes de completar la solicitud");
            }
            // Si la entrevista seguia como agendada, se da por realizada al cerrar la solicitud
            entrevistaRepository.findBySolicitudIdAndEstado(solicitud.getId(), EstadoEntrevista.AGENDADA)
                    .ifPresent(e -> e.setEstado(EstadoEntrevista.REALIZADA));
            comentario = motivoLimpio != null ? motivoLimpio : "Solicitud finalizada con informe";
        } else if (anterior == EstadoSolicitud.PENDIENTE && nuevo == EstadoSolicitud.EN_PROCESO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Agenda la entrevista para pasar la solicitud a En Proceso");
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede pasar de " + anterior + " a " + nuevo);
        }

        solicitud.setEstado(nuevo);
        registrarHistorial(solicitud, anterior, nuevo, comentario, actual);
        registrarCambioDeEstado(solicitud, anterior, nuevo, motivoLimpio, actual);
        return aResponse(solicitud);
    }

    /** Anota el cambio de estado en el historial de acciones del usuario, con el motivo si lo hay. */
    private void registrarCambioDeEstado(Solicitud solicitud, EstadoSolicitud anterior, EstadoSolicitud nuevo,
                                         String motivo, UsuarioActual actual) {
        String referencia = RegistroAcciones.referencia(solicitud);
        TipoAccion tipo;
        String descripcion;
        if (nuevo == EstadoSolicitud.EN_PAUSA) {
            tipo = TipoAccion.SOLICITUD_PAUSADA;
            descripcion = "Pausó la solicitud " + referencia;
        } else if (nuevo == EstadoSolicitud.CANCELADO) {
            tipo = TipoAccion.SOLICITUD_CANCELADA;
            descripcion = "Canceló la solicitud " + referencia;
        } else if (anterior == EstadoSolicitud.EN_PAUSA) {
            tipo = TipoAccion.SOLICITUD_REANUADA;
            descripcion = "Reanudó la solicitud " + referencia;
        } else {
            tipo = TipoAccion.SOLICITUD_FINALIZADA;
            descripcion = "Finalizó la solicitud " + referencia + " con el informe " + solicitud.getInformeNombreArchivo();
        }
        registro.registrar(actual.id(), tipo, descripcion, motivo, solicitud);
    }

    private void exigirMotivo(String motivo, String mensaje) {
        if (motivo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
        }
    }

    /**
     * Cancela la entrevista vigente de la solicitud, si tiene una, y borra su evento del
     * Google Calendar del evaluador que la tenia (duenoCalendario). Devuelve true si habia entrevista.
     */
    private boolean cancelarEntrevistaAgendada(Solicitud solicitud, Usuario duenoCalendario) {
        return entrevistaRepository.findBySolicitudIdAndEstado(solicitud.getId(), EstadoEntrevista.AGENDADA)
                .map(e -> {
                    e.setEstado(EstadoEntrevista.CANCELADA);
                    googleCalendar.quitar(e, duenoCalendario);
                    return true;
                })
                .orElse(false);
    }

    /** Agrega una linea a la bitacora de la solicitud. Lo usa tambien el servicio de entrevistas. */
    public void registrarHistorial(Solicitud solicitud, EstadoSolicitud anterior, EstadoSolicitud nuevo,
                                   String comentario, UsuarioActual actual) {
        HistorialEstado registro = new HistorialEstado();
        registro.setSolicitud(solicitud);
        registro.setUsuario(usuarioRepository.getReferenceById(actual.id()));
        registro.setEstadoAnterior(anterior);
        registro.setEstadoNuevo(nuevo);
        registro.setComentario(comentario != null && comentario.length() > 500 ? comentario.substring(0, 500) : comentario);
        historialRepository.save(registro);
    }

    /** El responsable de una solicitud debe ser un profesional evaluador con la cuenta activa. */
    private Usuario buscarEvaluador(Long id) {
        Usuario evaluador = usuarioRepository.findById(id)
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El responsable no existe o esta inactivo"));
        if (evaluador.getRol() != Rol.PROFESIONAL_EVALUADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El responsable debe tener el rol Profesional Evaluador");
        }
        return evaluador;
    }

    /** Arma el detalle de una solicitud: sus datos, sus entrevistas, su historial y cuantas solicitudes tiene ese candidato. */
    public SolicitudResponse aResponse(Solicitud solicitud) {
        long total = solicitudRepository.countByCandidatoId(solicitud.getCandidato().getId());
        List<EntrevistaResponse> entrevistas = entrevistaRepository
                .findBySolicitudIdOrderByInicioDesc(solicitud.getId()).stream()
                .map(EntrevistaResponse::from)
                .toList();
        List<HistorialResponse> historial = historialRepository
                .findBySolicitudIdOrderByFechaDescIdDesc(solicitud.getId()).stream()
                .map(HistorialResponse::from)
                .toList();
        return SolicitudResponse.from(solicitud, total, entrevistas, historial);
    }

    @Transactional(readOnly = true)
    public Solicitud buscarEntidad(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
    }

    /** Un profesional evaluador solo puede ver y operar las solicitudes que tiene asignadas. */
    public void verificarAcceso(Solicitud solicitud, UsuarioActual actual) {
        if (actual.rol() == Rol.PROFESIONAL_EVALUADOR) {
            Usuario responsable = solicitud.getResponsable();
            if (responsable == null || !responsable.getId().equals(actual.id())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La solicitud no esta asignada a ti");
            }
        }
    }

    private Specification<Solicitud> especificacion(SolicitudFiltro filtro, Long evaluadorId) {
        return (root, query, cb) -> {
            List<Predicate> condiciones = new ArrayList<>();
            if (tieneTexto(filtro.busqueda())) {
                Join<Solicitud, Candidato> candidato = root.join("candidato");
                String patron = contiene(filtro.busqueda());
                condiciones.add(cb.or(
                        cb.like(cb.lower(candidato.get("nombre")), patron),
                        cb.like(cb.lower(root.get("cargo")), patron),
                        cb.like(cb.lower(root.get("familiaCargo")), patron)));
            }
            if (tieneTexto(filtro.nombreCandidato())) {
                Join<Solicitud, Candidato> candidato = root.join("candidato");
                condiciones.add(cb.like(cb.lower(candidato.get("nombre")), contiene(filtro.nombreCandidato())));
            }
            if (tieneTexto(filtro.cargo())) {
                condiciones.add(cb.like(cb.lower(root.get("cargo")), contiene(filtro.cargo())));
            }
            if (tieneTexto(filtro.familiaCargo())) {
                condiciones.add(cb.equal(cb.lower(root.get("familiaCargo")), filtro.familiaCargo().trim().toLowerCase()));
            }
            if (filtro.estado() != null) {
                condiciones.add(cb.equal(root.get("estado"), filtro.estado()));
            }
            if (evaluadorId != null) {
                condiciones.add(cb.equal(root.get("responsable").get("id"), evaluadorId));
            } else if (filtro.responsableId() != null) {
                condiciones.add(cb.equal(root.get("responsable").get("id"), filtro.responsableId()));
            }
            if (filtro.fechaDesde() != null) {
                condiciones.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("fechaSolicitud"), filtro.fechaDesde()));
            }
            if (filtro.fechaHasta() != null) {
                condiciones.add(cb.lessThanOrEqualTo(root.<LocalDate>get("fechaSolicitud"), filtro.fechaHasta()));
            }
            return cb.and(condiciones.toArray(new Predicate[0]));
        };
    }

    private boolean tieneTexto(String texto) {
        return texto != null && !texto.isBlank();
    }

    private String contiene(String texto) {
        return "%" + texto.trim().toLowerCase() + "%";
    }
}
