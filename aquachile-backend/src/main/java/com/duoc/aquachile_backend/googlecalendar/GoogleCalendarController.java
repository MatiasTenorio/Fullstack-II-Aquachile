package com.duoc.aquachile_backend.googlecalendar;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import java.net.URI;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/google/calendar")
@RequiredArgsConstructor
public class GoogleCalendarController {

    private final GoogleCalendarService calendarService;

    @GetMapping("/estado")
    @PreAuthorize(Permisos.SOLO_EVALUADOR)
    public GoogleCalendarEstadoResponse estado(@AuthenticationPrincipal Jwt jwt) {
        return calendarService.estado(UsuarioActual.from(jwt));
    }

    /** Devuelve la direccion de Google a la que el navegador debe ir para autorizar. */
    @PostMapping("/autorizacion")
    @PreAuthorize(Permisos.SOLO_EVALUADOR)
    public Map<String, String> autorizacion(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("url", calendarService.urlAutorizacion(UsuarioActual.from(jwt)));
    }

    /**
     * Google redirige aqui al navegador despues de la autorizacion. No lleva el token de sesion
     * (es una redireccion), por eso es publico: el usuario se identifica con el parametro "state".
     * Siempre termina redirigiendo al calendario del frontend.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error) {
        String destino = calendarService.completarConexion(code, state, error);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(destino)).build();
    }

    @DeleteMapping("/conexion")
    @PreAuthorize(Permisos.SOLO_EVALUADOR)
    public GoogleCalendarEstadoResponse desconectar(@AuthenticationPrincipal Jwt jwt) {
        return calendarService.desconectar(UsuarioActual.from(jwt));
    }
}
