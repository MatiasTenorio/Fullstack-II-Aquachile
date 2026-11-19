package com.duoc.aquachile_backend.candidatos.dto;

import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.entrevista.EntrevistaAgendaResponse;
import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;
import java.util.List;
import java.util.Map;

/**
 * Indicadores de la pagina de inicio. Cada rol recibe solo lo suyo; el resto llega vacio (null).
 * Analista: solicitudes de todos por estado, candidatos, solicitudes sin evaluador y proximas entrevistas.
 * Evaluador: sus solicitudes por estado, las que esperan informe y sus proximas entrevistas.
 * Administrador: cuentas activas por rol y cuentas inactivas.
 */
public record DashboardResponse(
        Map<EstadoSolicitud, Long> solicitudesPorEstado,
        Long totalCandidatos,
        Long solicitudesSinAsignar,
        Long solicitudesSinInforme,
        List<EntrevistaAgendaResponse> proximasEntrevistas,
        Map<Rol, Long> usuariosPorRol,
        Long usuariosInactivos) {
}
