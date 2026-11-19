package com.duoc.aquachile_backend.auth.dto;

import com.duoc.aquachile_backend.auth.Rol;

/** Cambios que el administrador puede hacer sobre una cuenta; los campos que llegan vacios no se tocan. */
public record UsuarioActualizarRequest(Rol rol, Boolean activo) {
}
