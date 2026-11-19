package com.duoc.aquachile_backend.solicitud;

import jakarta.validation.constraints.NotNull;

/** Asigna (o cambia) el profesional evaluador responsable de la solicitud. */
public record SolicitudActualizarRequest(
        @NotNull(message = "Selecciona el evaluador responsable")
        Long responsableId) {
}
