package com.duoc.aquachile_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Pide un codigo para definir o restablecer la contrasena de la cuenta con ese correo. */
public record SolicitarCodigoRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        String email) {
}
