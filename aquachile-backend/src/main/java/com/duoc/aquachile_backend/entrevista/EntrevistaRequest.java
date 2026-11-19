package com.duoc.aquachile_backend.entrevista;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Datos para agendar o reprogramar una entrevista. */
public record EntrevistaRequest(
        @NotNull(message = "Indica la fecha y hora de la entrevista")
        Instant inicio,

        @NotNull(message = "Indica la duracion de la entrevista")
        @Min(value = 15, message = "La entrevista debe durar al menos 15 minutos")
        @Max(value = 240, message = "La entrevista no puede durar mas de 4 horas")
        Integer duracionMinutos,

        @NotNull(message = "Indica la modalidad de la entrevista")
        Modalidad modalidad,

        @Size(max = 300, message = "El enlace o lugar no puede superar los 300 caracteres")
        String ubicacion) {
}
