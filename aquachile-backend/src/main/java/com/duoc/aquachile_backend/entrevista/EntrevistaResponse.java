package com.duoc.aquachile_backend.entrevista;

import java.time.Instant;

public record EntrevistaResponse(
        Long id,
        Instant inicio,
        Instant fin,
        Modalidad modalidad,
        String ubicacion,
        EstadoEntrevista estado,
        boolean enGoogleCalendar) {

    public static EntrevistaResponse from(Entrevista e) {
        return new EntrevistaResponse(e.getId(), e.getInicio(), e.getFin(), e.getModalidad(), e.getUbicacion(),
                e.getEstado(), e.getGoogleEventId() != null);
    }
}
