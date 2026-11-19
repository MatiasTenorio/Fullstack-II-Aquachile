package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import com.duoc.aquachile_backend.candidatos.CandidatoResponse;
import com.duoc.aquachile_backend.entrevista.EntrevistaResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Detalle completo de una solicitud, con candidato, evaluador responsable y analista que la creo.
 * estadoPrevio solo tiene valor mientras esta en pausa: es el estado al que vuelve al reanudarse.
 * solicitudesDelCandidato cuenta todas las solicitudes del mismo candidato, incluida esta.
 * entrevistas e historial van de lo mas reciente a lo mas antiguo.
 */
public record SolicitudResponse(
        Long id,
        CandidatoResponse candidato,
        String cargo,
        String familiaCargo,
        LocalDate fechaSolicitud,
        Instant creadaEn,
        EstadoSolicitud estado,
        EstadoSolicitud estadoPrevio,
        UsuarioResponse responsable,
        UsuarioResponse analista,
        boolean cvDisponible,
        boolean informeDisponible,
        String informeNombreArchivo,
        long solicitudesDelCandidato,
        List<EntrevistaResponse> entrevistas,
        List<HistorialResponse> historial) {

    public static SolicitudResponse from(Solicitud s, long solicitudesDelCandidato,
                                         List<EntrevistaResponse> entrevistas, List<HistorialResponse> historial) {
        return new SolicitudResponse(
                s.getId(),
                CandidatoResponse.from(s.getCandidato()),
                s.getCargo(),
                s.getFamiliaCargo(),
                s.getFechaSolicitud(),
                s.getCreadaEn(),
                s.getEstado(),
                s.getEstadoPrevio(),
                s.getResponsable() != null ? UsuarioResponse.from(s.getResponsable()) : null,
                s.getAnalista() != null ? UsuarioResponse.from(s.getAnalista()) : null,
                s.getCvDriveFileId() != null,
                s.getInformeDriveFileId() != null,
                s.getInformeNombreArchivo(),
                solicitudesDelCandidato,
                entrevistas,
                historial);
    }
}
