package com.duoc.aquachile_backend.entrevista;

import com.duoc.aquachile_backend.solicitud.Solicitud;
import java.time.Instant;

/** Entrevista con los datos de su solicitud, para el calendario y la lista de proximas entrevistas. */
public record EntrevistaAgendaResponse(
        Long id,
        Long solicitudId,
        String candidatoNombre,
        String cargo,
        String evaluadorNombre,
        Instant inicio,
        Instant fin,
        Modalidad modalidad,
        String ubicacion,
        EstadoEntrevista estado,
        boolean enGoogleCalendar) {

    public static EntrevistaAgendaResponse from(Entrevista e) {
        Solicitud s = e.getSolicitud();
        return new EntrevistaAgendaResponse(
                e.getId(),
                s.getId(),
                s.getCandidato().getNombre(),
                s.getCargo(),
                s.getResponsable() != null ? s.getResponsable().getNombre() : null,
                e.getInicio(),
                e.getFin(),
                e.getModalidad(),
                e.getUbicacion(),
                e.getEstado(),
                e.getGoogleEventId() != null);
    }
}
