package com.duoc.aquachile_backend.auditoria;

import com.duoc.aquachile_backend.auth.dto.UsuarioAdminResponse;
import java.util.List;

/** Una pagina del historial de acciones de un usuario, de la mas reciente a la mas antigua. */
public record HistorialAccionesResponse(
        UsuarioAdminResponse usuario,
        List<AccionResponse> acciones,
        int pagina,
        int totalPaginas,
        long total) {
}
