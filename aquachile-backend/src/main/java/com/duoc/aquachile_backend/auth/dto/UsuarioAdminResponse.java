package com.duoc.aquachile_backend.auth.dto;

import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;
import java.time.Instant;

/**
 * Fila de las pantallas del administrador: incluye si la cuenta esta activa y la fecha de
 * su ultima accion registrada (vacia si nunca ha hecho nada o si no se consulto).
 */
public record UsuarioAdminResponse(Long id, String nombre, String email, Rol rol, boolean activo,
                                   Instant ultimaActividad) {

    public static UsuarioAdminResponse from(Usuario u) {
        return from(u, null);
    }

    public static UsuarioAdminResponse from(Usuario u, Instant ultimaActividad) {
        return new UsuarioAdminResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.isActivo(),
                ultimaActividad);
    }
}
