package com.duoc.aquachile_backend.auth.controller;

import com.duoc.aquachile_backend.auth.dto.MensajeResponse;
import com.duoc.aquachile_backend.auth.dto.RestablecerPasswordRequest;
import com.duoc.aquachile_backend.auth.dto.SolicitarCodigoRequest;
import com.duoc.aquachile_backend.auth.service.PasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints sin sesion: quien olvido su contrasena (o entra por primera vez) todavia no puede iniciar sesion. */
@RestController
@RequestMapping("/auth/password")
@RequiredArgsConstructor
public class PasswordController {

    private final PasswordService passwordService;

    @PostMapping("/codigo")
    public MensajeResponse solicitarCodigo(@Valid @RequestBody SolicitarCodigoRequest request) {
        return passwordService.solicitarCodigo(request.email());
    }

    @PostMapping("/restablecer")
    public MensajeResponse restablecer(@Valid @RequestBody RestablecerPasswordRequest request) {
        return passwordService.restablecer(request);
    }
}
