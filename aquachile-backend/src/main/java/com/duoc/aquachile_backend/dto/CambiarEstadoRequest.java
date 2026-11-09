package com.duoc.aquachile_backend.dto;

import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoRequest(
        @NotNull(message = "El estado es obligatorio")
        EstadoSolicitud estado) {
}
