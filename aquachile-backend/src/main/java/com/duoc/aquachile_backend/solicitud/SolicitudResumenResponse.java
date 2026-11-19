package com.duoc.aquachile_backend.solicitud;

import java.time.Instant;
import java.time.LocalDate;

/** Fila del historial de solicitudes. entrevistaInicio es la entrevista agendada vigente, si la hay. */
public record SolicitudResumenResponse(
        Long id,
        Long candidatoId,
        String candidatoNombre,
        String candidatoCorreo,
        String cargo,
        String familiaCargo,
        LocalDate fechaSolicitud,
        EstadoSolicitud estado,
        String responsableNombre,
        boolean cvDisponible,
        Instant entrevistaInicio) {

    public static SolicitudResumenResponse from(Solicitud s, Instant entrevistaInicio) {
        return new SolicitudResumenResponse(
                s.getId(),
                s.getCandidato().getId(),
                s.getCandidato().getNombre(),
                s.getCandidato().getCorreo(),
                s.getCargo(),
                s.getFamiliaCargo(),
                s.getFechaSolicitud(),
                s.getEstado(),
                s.getResponsable() != null ? s.getResponsable().getNombre() : null,
                s.getCvDriveFileId() != null,
                entrevistaInicio);
    }
}
