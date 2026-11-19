package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.candidatos.dto.CambiarEstadoRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final SolicitudRegistroService registroService;

    /** El analista crea la solicitud de un candidato ya registrado, le asigna evaluador y adjunta el CV. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Permisos.SOLO_ANALISTA)
    public SolicitudResponse crear(@Valid @ModelAttribute SolicitudCreateRequest datos,
                                   @RequestParam(value = "cv", required = false) MultipartFile cv,
                                   @AuthenticationPrincipal Jwt jwt) {
        return registroService.registrar(datos, cv, UsuarioActual.from(jwt));
    }

    /** El analista ve todas las solicitudes; el evaluador solo las que tiene asignadas. */
    @GetMapping
    @PreAuthorize(Permisos.ANALISTA_O_EVALUADOR)
    public List<SolicitudResumenResponse> listar(SolicitudFiltro filtro, @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.listar(filtro, UsuarioActual.from(jwt));
    }

    @GetMapping("/{id}")
    @PreAuthorize(Permisos.ANALISTA_O_EVALUADOR)
    public SolicitudResponse obtener(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.obtener(id, UsuarioActual.from(jwt));
    }

    /** El analista asigna o cambia el evaluador responsable. */
    @PatchMapping("/{id}")
    @PreAuthorize(Permisos.SOLO_ANALISTA)
    public SolicitudResponse actualizar(@PathVariable Long id,
                                        @Valid @RequestBody SolicitudActualizarRequest request,
                                        @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.actualizar(id, request, UsuarioActual.from(jwt));
    }

    /**
     * Solo el evaluador responsable cambia el estado: pausar, reanudar, cancelar o finalizar.
     * Para pasar a En Proceso se agenda la entrevista (ver EntrevistaController).
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize(Permisos.SOLO_EVALUADOR)
    public SolicitudResponse cambiarEstado(@PathVariable Long id,
                                           @Valid @RequestBody CambiarEstadoRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        return solicitudService.cambiarEstado(id, request.estado(), request.motivo(), UsuarioActual.from(jwt));
    }
}
