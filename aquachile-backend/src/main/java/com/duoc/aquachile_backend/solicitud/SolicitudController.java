package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.candidatos.dto.CambiarEstadoRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public SolicitudResponse crear(@Valid @RequestBody SolicitudCreateRequest request) {
        return solicitudService.crear(request);
    }

    @GetMapping
    public List<SolicitudResumenResponse> listar(SolicitudFiltro filtro, @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.listar(filtro, UsuarioActual.from(jwt));
    }

    @GetMapping("/{id}")
    public SolicitudResponse obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.obtener(id, UsuarioActual.from(jwt));
    }

    @PatchMapping("/{id}")
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public SolicitudResponse actualizar(@PathVariable Long id,
                                        @Valid @RequestBody SolicitudActualizarRequest request) {
        return solicitudService.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize(Permisos.ANALISTA_EVALUADOR_O_ADMIN)
    public SolicitudResponse cambiarEstado(@PathVariable Long id,
                                           @Valid @RequestBody CambiarEstadoRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.cambiarEstado(id, request.estado(), UsuarioActual.from(jwt));
    }
}
