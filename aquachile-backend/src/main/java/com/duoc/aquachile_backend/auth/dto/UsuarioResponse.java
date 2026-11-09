package com.duoc.aquachile_backend.auth.dto;

import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;

public record UsuarioResponse(Long id, String nombre, String email, Rol rol) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol());
    }
}
