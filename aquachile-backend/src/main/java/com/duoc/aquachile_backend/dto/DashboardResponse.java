package com.duoc.aquachile_backend.dto;

/** Indicadores del dashboard. */
public record DashboardResponse(
        long totalCandidatos,
        long solicitudesPendientes,
        long solicitudesEnProceso,
        long solicitudesFinalizadas) {
}
