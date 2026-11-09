package com.duoc.aquachile_backend.candidatos.dto;


/** Indicadores del dashboard. */
public record DashboardResponse(
        long totalCandidatos,
        long solicitudesPendientes,
        long solicitudesEnProceso,
        long solicitudesFinalizadas) {
}
