package com.duoc.aquachile_backend.auth;

import java.util.List;
import org.springframework.security.oauth2.jwt.Jwt;

/** Datos del usuario autenticado, leidos desde el token JWT. */
public record UsuarioActual(Long id, String email, Rol rol) {

    public static UsuarioActual from(Jwt jwt) {
        Number uid = jwt.getClaim("uid");
        List<String> roles = jwt.getClaimAsStringList("roles");
        return new UsuarioActual(uid.longValue(), jwt.getSubject(), Rol.valueOf(roles.get(0)));
    }
}
