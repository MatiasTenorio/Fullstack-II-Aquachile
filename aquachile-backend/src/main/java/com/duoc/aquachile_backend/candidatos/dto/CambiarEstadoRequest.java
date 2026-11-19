package com.duoc.aquachile_backend.candidatos.dto;

import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Cambio de estado de una solicitud. El motivo es obligatorio al pausar o cancelar. */
public record CambiarEstadoRequest(
        @NotNull(message = "El estado es obligatorio")
        EstadoSolicitud estado,

        @Size(max = 500, message = "El motivo no puede superar los 500 caracteres")
        String motivo) {
}
