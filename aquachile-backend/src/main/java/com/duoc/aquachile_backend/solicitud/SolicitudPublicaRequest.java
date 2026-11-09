package com.duoc.aquachile_backend.solicitud;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Campos de texto del formulario psicolaboral publico (el CV llega como archivo aparte). */
public record SolicitudPublicaRequest(
        @NotBlank(message = "El nombre del candidato es obligatorio")
        @Size(max = 160, message = "El nombre no puede superar los 160 caracteres")
        String nombreCandidato,

        @NotBlank(message = "El correo electronico es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        @Size(max = 160, message = "El correo no puede superar los 160 caracteres")
        String correo,


        @NotBlank(message = "El cargo es obligatorio")
        @Size(max = 160, message = "El cargo no puede superar los 160 caracteres")
        String cargo,

        @NotBlank(message = "La familia de cargo es obligatoria")
        @Size(max = 60, message = "La familia de cargo no puede superar los 60 caracteres")
        String familiaCargo) {
}
