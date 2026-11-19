package com.duoc.aquachile_backend.entrevista;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.googlecalendar.GoogleCalendarService;
import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;
import com.duoc.aquachile_backend.solicitud.Solicitud;
import com.duoc.aquachile_backend.solicitud.SolicitudResponse;
import com.duoc.aquachile_backend.solicitud.SolicitudService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Agenda de entrevistas. Solo opera el evaluador responsable de la solicitud. */
@Service
@RequiredArgsConstructor
public class EntrevistaService {

    /** El calendario pide de a un mes; se deja margen para las semanas que asoman de los meses vecinos. */
    private static final long MAX_DIAS_AGENDA = 62;

    private final EntrevistaRepository entrevistaRepository;
    private final SolicitudService solicitudService;
    private final GoogleCalendarService googleCalendar;
    private final RegistroAcciones registro;

    /** Agenda la entrevista. Si la solicitud estaba pendiente, pasa a En Proceso. */
    @Transactional
    public SolicitudResponse agendar(Long solicitudId, EntrevistaRequest request, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);

        EstadoSolicitud anterior = solicitud.getEstado();
        if (anterior != EstadoSolicitud.PENDIENTE && anterior != EstadoSolicitud.EN_PROCESO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede agendar una entrevista en una solicitud pendiente o en proceso");
        }
        if (entrevistaRepository.findBySolicitudIdAndEstado(solicitudId, EstadoEntrevista.AGENDADA).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La solicitud ya tiene una entrevista agendada; reprogramala en vez de crear otra");
        }

        Entrevista entrevista = new Entrevista();
        entrevista.setSolicitud(solicitud);
        aplicar(entrevista, request, actual, -1L);
        entrevistaRepository.save(entrevista);
        // Si el evaluador conecto su cuenta de Google, la entrevista tambien queda en su Google Calendar
        googleCalendar.sincronizar(entrevista, solicitud.getResponsable());

        solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
        solicitudService.registrarHistorial(solicitud, anterior, EstadoSolicitud.EN_PROCESO,
                "Entrevista agendada para el " + SolicitudService.formatear(entrevista.getInicio()), actual);
        registro.registrar(actual, TipoAccion.ENTREVISTA_AGENDADA, "Agendó la entrevista de la solicitud "
                + RegistroAcciones.referencia(solicitud) + " para el " + SolicitudService.formatear(entrevista.getInicio())
                + " (" + describir(entrevista) + ")", solicitud);
        return solicitudService.aResponse(solicitud);
    }

    @Transactional
    public SolicitudResponse reprogramar(Long solicitudId, Long entrevistaId, EntrevistaRequest request,
                                         UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        Entrevista entrevista = buscarAgendada(solicitudId, entrevistaId);
        Instant inicioAnterior = entrevista.getInicio();

        aplicar(entrevista, request, actual, entrevista.getId());
        googleCalendar.sincronizar(entrevista, solicitud.getResponsable());
        solicitudService.registrarHistorial(solicitud, solicitud.getEstado(), solicitud.getEstado(),
                "Entrevista reprogramada para el " + SolicitudService.formatear(entrevista.getInicio()), actual);
        registro.registrar(actual, TipoAccion.ENTREVISTA_REPROGRAMADA, "Reprogramó la entrevista de la solicitud "
                + RegistroAcciones.referencia(solicitud) + " del " + SolicitudService.formatear(inicioAnterior)
                + " al " + SolicitudService.formatear(entrevista.getInicio()), solicitud);
        return solicitudService.aResponse(solicitud);
    }

    @Transactional
    public SolicitudResponse marcarRealizada(Long solicitudId, Long entrevistaId, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        Entrevista entrevista = buscarAgendada(solicitudId, entrevistaId);
        if (entrevista.getInicio().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La entrevista todavia no ocurre; si cambio de fecha, reprogramala");
        }

        entrevista.setEstado(EstadoEntrevista.REALIZADA);
        solicitudService.registrarHistorial(solicitud, solicitud.getEstado(), solicitud.getEstado(),
                "Entrevista realizada", actual);
        registro.registrar(actual, TipoAccion.ENTREVISTA_REALIZADA, "Marcó como realizada la entrevista de la solicitud "
                + RegistroAcciones.referencia(solicitud), solicitud);
        return solicitudService.aResponse(solicitud);
    }

    /** Reintenta copiar a Google Calendar una entrevista agendada que no quedo sincronizada. */
    @Transactional
    public SolicitudResponse enviarAGoogle(Long solicitudId, Long entrevistaId, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        Entrevista entrevista = buscarAgendada(solicitudId, entrevistaId);
        if (!googleCalendar.estaConectado(actual.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Conecta tu cuenta de Google en el calendario para enviar la entrevista");
        }
        googleCalendar.sincronizar(entrevista, solicitud.getResponsable());
        if (entrevista.getGoogleEventId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "No se pudo crear el evento en Google Calendar. Intenta nuevamente mas tarde.");
        }
        return solicitudService.aResponse(solicitud);
    }

    /**
     * Entrevistas agendadas o realizadas dentro del rango, para el calendario.
     * El evaluador recibe solo las de sus solicitudes; el analista, las de todos.
     */
    @Transactional(readOnly = true)
    public List<EntrevistaAgendaResponse> agenda(Instant desde, Instant hasta, UsuarioActual actual) {
        if (!hasta.isAfter(desde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango de fechas no es valido");
        }
        if (Duration.between(desde, hasta).toDays() > MAX_DIAS_AGENDA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El rango de fechas no puede superar los " + MAX_DIAS_AGENDA + " dias");
        }
        return buscar(List.of(EstadoEntrevista.AGENDADA, EstadoEntrevista.REALIZADA), desde, hasta, actual);
    }

    /** Las siguientes entrevistas agendadas a partir de ahora, para la pagina de inicio. */
    @Transactional(readOnly = true)
    public List<EntrevistaAgendaResponse> proximas(UsuarioActual actual, int limite) {
        Instant ahora = Instant.now();
        return buscar(List.of(EstadoEntrevista.AGENDADA), ahora, ahora.plus(Duration.ofDays(MAX_DIAS_AGENDA)), actual)
                .stream()
                .limit(limite)
                .toList();
    }

    private List<EntrevistaAgendaResponse> buscar(List<EstadoEntrevista> estados, Instant desde, Instant hasta,
                                                  UsuarioActual actual) {
        List<Entrevista> entrevistas = actual.rol() == Rol.PROFESIONAL_EVALUADOR
                ? entrevistaRepository.buscarAgendaDeEvaluador(actual.id(), estados, desde, hasta)
                : entrevistaRepository.buscarAgenda(estados, desde, hasta);
        return entrevistas.stream().map(EntrevistaAgendaResponse::from).toList();
    }

    /** "Online, https://..." o "Presencial, Oficina..." para las descripciones del historial de acciones. */
    private String describir(Entrevista entrevista) {
        String modalidad = entrevista.getModalidad() == Modalidad.ONLINE ? "Online" : "Presencial";
        return entrevista.getUbicacion() != null ? modalidad + ", " + entrevista.getUbicacion() : modalidad;
    }

    private Entrevista buscarAgendada(Long solicitudId, Long entrevistaId) {
        Entrevista entrevista = entrevistaRepository.findById(entrevistaId)
                .filter(e -> e.getSolicitud().getId().equals(solicitudId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrevista no encontrada"));
        if (entrevista.getEstado() != EstadoEntrevista.AGENDADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La entrevista ya no esta agendada");
        }
        return entrevista;
    }

    /** Valida el horario (futuro y sin cruces con otras entrevistas del evaluador) y lo copia a la entrevista. */
    private void aplicar(Entrevista entrevista, EntrevistaRequest request, UsuarioActual actual, Long excluirId) {
        Instant inicio = request.inicio();
        Instant fin = inicio.plus(Duration.ofMinutes(request.duracionMinutos()));
        if (!inicio.isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La entrevista debe agendarse para una fecha y hora futuras");
        }
        if (entrevistaRepository.existeCruce(actual.id(), EstadoEntrevista.AGENDADA, inicio, fin, excluirId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya tienes otra entrevista agendada en ese horario");
        }
        entrevista.setInicio(inicio);
        entrevista.setFin(fin);
        entrevista.setModalidad(request.modalidad());
        String ubicacion = request.ubicacion();
        entrevista.setUbicacion(ubicacion == null || ubicacion.isBlank() ? null : ubicacion.trim());
    }
}
