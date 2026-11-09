package com.duoc.aquachile_backend.auth.controller;

import com.duoc.aquachile_backend.auth.dto.LoginRequest;
import com.duoc.aquachile_backend.auth.dto.LoginResponse;
import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import com.duoc.aquachile_backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Devuelve el usuario dueno del token; el frontend lo usa para restaurar la sesion. */
    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.usuarioActual(jwt.getSubject());
    }
}
