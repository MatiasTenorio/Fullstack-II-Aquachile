package com.duoc.aquachile_backend.solicitud;

import java.time.Instant;

/** Una linea del historial que se muestra en el detalle de la solicitud. */
public record HistorialResponse(
        Long id,
        EstadoSolicitud estadoAnterior,
        EstadoSolicitud estadoNuevo,
        String comentario,
        String usuarioNombre,
        Instant fecha) {

    public static HistorialResponse from(HistorialEstado h) {
        return new HistorialResponse(h.getId(), h.getEstadoAnterior(), h.getEstadoNuevo(), h.getComentario(),
                h.getUsuario().getNombre(), h.getFecha());
    }
}
