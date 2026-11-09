package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import com.duoc.aquachile_backend.candidatos.CandidatoResponse;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Detalle completo de una solicitud, con candidato y responsable.
 * solicitudesDelCandidato cuenta todas las solicitudes del mismo candidato (mismo correo), incluida esta.
 */
public record SolicitudResponse(
        Long id,
        CandidatoResponse candidato,
        String cargo,
        String familiaCargo,
        LocalDate fechaSolicitud,
        Instant creadaEn,
        EstadoSolicitud estado,
        UsuarioResponse responsable,
        boolean cvDisponible,
        boolean informeDisponible,
        String informeNombreArchivo,
        long solicitudesDelCandidato) {

    public static SolicitudResponse from(Solicitud s, long solicitudesDelCandidato) {
        return new SolicitudResponse(
                s.getId(),
                CandidatoResponse.from(s.getCandidato()),
                s.getCargo(),
                s.getFamiliaCargo(),
                s.getFechaSolicitud(),
                s.getCreadaEn(),
                s.getEstado(),
                s.getResponsable() != null ? UsuarioResponse.from(s.getResponsable()) : null,
                s.getCvDriveFileId() != null,
                s.getInformeDriveFileId() != null,
                s.getInformeNombreArchivo(),
                solicitudesDelCandidato);
    }
}
