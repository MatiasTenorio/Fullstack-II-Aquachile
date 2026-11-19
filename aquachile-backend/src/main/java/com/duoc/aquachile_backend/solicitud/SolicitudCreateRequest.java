package com.duoc.aquachile_backend.solicitud;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Campos de texto con los que el analista crea una solicitud (el CV llega como archivo aparte).
 * El candidato debe estar registrado antes y el responsable debe ser un profesional evaluador.
 */
public record SolicitudCreateRequest(
        @NotNull(message = "Selecciona un candidato")
        Long candidatoId,

        @NotNull(message = "Selecciona el evaluador responsable")
        Long responsableId,

        @NotBlank(message = "El cargo es obligatorio")
        @Size(max = 160, message = "El cargo no puede superar los 160 caracteres")
        String cargo,

        @NotBlank(message = "La familia de cargo es obligatoria")
        @Size(max = 60, message = "La familia de cargo no puede superar los 60 caracteres")
        String familiaCargo) {
}
