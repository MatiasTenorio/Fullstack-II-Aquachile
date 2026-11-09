package com.duoc.aquachile_backend.candidatos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidatoRequest(
        @NotBlank(message = "El nombre del candidato es obligatorio")
        @Size(max = 160, message = "El nombre no puede superar los 160 caracteres")
        String nombre,

        @Email(message = "El correo no tiene un formato valido")
        @Size(max = 160, message = "El correo no puede superar los 160 caracteres")
        String correo,

        @Size(max = 30, message = "El telefono no puede superar los 30 caracteres")
        String telefono) {
}
