package com.duoc.aquachile_backend.entrevista;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.solicitud.SolicitudResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Todas las respuestas devuelven la solicitud completa, con sus entrevistas e historial actualizados. */
@RestController
@RequestMapping("/solicitudes/{solicitudId}/entrevistas")
@RequiredArgsConstructor
@PreAuthorize(Permisos.SOLO_EVALUADOR)
public class EntrevistaController {

    private final EntrevistaService entrevistaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudResponse agendar(@PathVariable Long solicitudId,
                                     @Valid @RequestBody EntrevistaRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
        return entrevistaService.agendar(solicitudId, request, UsuarioActual.from(jwt));
    }

    @PutMapping("/{entrevistaId}")
    public SolicitudResponse reprogramar(@PathVariable Long solicitudId,
                                         @PathVariable Long entrevistaId,
                                         @Valid @RequestBody EntrevistaRequest request,
                                         @AuthenticationPrincipal Jwt jwt) {
        return entrevistaService.reprogramar(solicitudId, entrevistaId, request, UsuarioActual.from(jwt));
    }

    /** Envia a Google Calendar una entrevista agendada que no quedo sincronizada. */
    @PostMapping("/{entrevistaId}/google")
    public SolicitudResponse enviarAGoogle(@PathVariable Long solicitudId,
                                           @PathVariable Long entrevistaId,
                                           @AuthenticationPrincipal Jwt jwt) {
        return entrevistaService.enviarAGoogle(solicitudId, entrevistaId, UsuarioActual.from(jwt));
    }

    @PatchMapping("/{entrevistaId}/realizada")
    public SolicitudResponse marcarRealizada(@PathVariable Long solicitudId,
                                             @PathVariable Long entrevistaId,
                                             @AuthenticationPrincipal Jwt jwt) {
        return entrevistaService.marcarRealizada(solicitudId, entrevistaId, UsuarioActual.from(jwt));
    }
}
