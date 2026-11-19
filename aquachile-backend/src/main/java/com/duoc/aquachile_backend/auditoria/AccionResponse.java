package com.duoc.aquachile_backend.auditoria;

import java.time.Instant;

public record AccionResponse(
        Long id,
        TipoAccion tipo,
        TipoAccion.Categoria categoria,
        String descripcion,
        String motivo,
        Long solicitudId,
        Instant fecha) {

    public static AccionResponse from(AccionUsuario a) {
        return new AccionResponse(a.getId(), a.getTipo(), a.getTipo().getCategoria(), a.getDescripcion(),
                a.getMotivo(), a.getSolicitud() != null ? a.getSolicitud().getId() : null, a.getFecha());
    }
}
