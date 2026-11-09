package com.duoc.aquachile_backend.solicitud;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * Filtros del historial; todos son opcionales y se combinan entre si.
 * busqueda es el cuadro de texto libre: coincide con el nombre del candidato, el cargo o la familia de cargo.
 */
public record SolicitudFiltro(
        String busqueda,
        String nombreCandidato,
        String cargo,
        String familiaCargo,
        EstadoSolicitud estado,
        Long responsableId,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
}
