package com.duoc.aquachile_backend.entrevista;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Calendario de entrevistas: el evaluador ve las suyas y el analista las de todos. */
@RestController
@RequestMapping("/entrevistas")
@RequiredArgsConstructor
public class AgendaController {

    private final EntrevistaService entrevistaService;

    /** Entrevistas agendadas o realizadas que caen dentro del rango [desde, hasta), en formato ISO (ej: 2026-11-01T03:00:00Z). */
    @GetMapping
    @PreAuthorize(Permisos.ANALISTA_O_EVALUADOR)
    public List<EntrevistaAgendaResponse> agenda(@RequestParam Instant desde,
                                                 @RequestParam Instant hasta,
                                                 @AuthenticationPrincipal Jwt jwt) {
        return entrevistaService.agenda(desde, hasta, UsuarioActual.from(jwt));
    }
}
