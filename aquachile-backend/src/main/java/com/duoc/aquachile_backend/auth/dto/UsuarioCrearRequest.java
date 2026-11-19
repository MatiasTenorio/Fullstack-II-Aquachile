package com.duoc.aquachile_backend.auth.dto;

import com.duoc.aquachile_backend.auth.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos con los que el administrador crea una cuenta. No lleva clave: el usuario la define despues. */
public record UsuarioCrearRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres")
        String nombre,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        @Size(max = 160, message = "El correo no puede superar los 160 caracteres")
        String email,

        @NotNull(message = "El rol es obligatorio")
        Rol rol) {
}
