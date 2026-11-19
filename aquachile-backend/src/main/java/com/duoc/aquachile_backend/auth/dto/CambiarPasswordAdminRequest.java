package com.duoc.aquachile_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** El administrador ingresa el codigo que llego a su correo y la nueva contrasena de la otra cuenta. */
public record CambiarPasswordAdminRequest(
        @NotBlank(message = "Ingresa el código que recibiste por correo")
        String codigo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$", message = "La contraseña debe incluir al menos una letra y un número")
        String nuevaPassword) {
}
