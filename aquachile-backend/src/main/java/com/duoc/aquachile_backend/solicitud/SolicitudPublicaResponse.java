package com.duoc.aquachile_backend.solicitud;

/** Respuesta minima al formulario publico: no se devuelven datos internos. */
public record SolicitudPublicaResponse(Long id, String mensaje) {
}
