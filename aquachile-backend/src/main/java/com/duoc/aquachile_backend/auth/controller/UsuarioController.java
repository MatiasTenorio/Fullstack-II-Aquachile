package com.duoc.aquachile_backend.auth.controller;

import com.duoc.aquachile_backend.auditoria.HistorialAccionesResponse;
import com.duoc.aquachile_backend.auditoria.HistorialAccionesService;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.dto.CambiarPasswordAdminRequest;
import com.duoc.aquachile_backend.auth.dto.MensajeResponse;
import com.duoc.aquachile_backend.auth.dto.UsuarioActualizarRequest;
import com.duoc.aquachile_backend.auth.dto.UsuarioAdminResponse;
import com.duoc.aquachile_backend.auth.dto.UsuarioCrearRequest;
import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import com.duoc.aquachile_backend.auth.service.PasswordService;
import com.duoc.aquachile_backend.auth.service.UsuarioService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final PasswordService passwordService;
    private final HistorialAccionesService historialAccionesService;

    @GetMapping
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public List<UsuarioAdminResponse> listar() {
        return usuarioService.listar();
    }

    /** Lo usa el analista para elegir al responsable de una solicitud. */
    @GetMapping("/evaluadores")
    @PreAuthorize(Permisos.SOLO_ANALISTA)
    public List<UsuarioResponse> evaluadores() {
        return usuarioService.evaluadores();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public UsuarioAdminResponse crear(@Valid @RequestBody UsuarioCrearRequest request,
                                      @AuthenticationPrincipal Jwt jwt) {
        return usuarioService.crear(request, UsuarioActual.from(jwt));
    }

    /**
     * Historial de acciones de un usuario, de la mas reciente a la mas antigua, de a 30 por pagina.
     * categoria es opcional (CUENTA, ADMINISTRACION, CANDIDATOS, SOLICITUDES, ENTREVISTAS, PAUSAS_Y_CANCELACIONES).
     */
    @GetMapping("/{id}/acciones")
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public HistorialAccionesResponse acciones(@PathVariable Long id,
                                              @RequestParam(required = false) TipoAccion.Categoria categoria,
                                              @RequestParam(defaultValue = "0") int pagina) {
        return historialAccionesService.historial(id, categoria, pagina);
    }

    @PatchMapping("/{id}")
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public UsuarioAdminResponse actualizar(@PathVariable Long id,
                                           @RequestBody UsuarioActualizarRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        return usuarioService.actualizar(id, request, UsuarioActual.from(jwt));
    }

    /** Paso 1 del cambio de contrasena por el administrador: envia un codigo al correo del administrador. */
    @PostMapping("/{id}/password/codigo")
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public MensajeResponse solicitarCodigoPassword(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return passwordService.solicitarCodigoAdmin(id, UsuarioActual.from(jwt));
    }

    /** Paso 2: con ese codigo, define la nueva contrasena de la cuenta (que no puede ser de administrador). */
    @PostMapping("/{id}/password")
    @PreAuthorize(Permisos.SOLO_ADMIN)
    public MensajeResponse cambiarPassword(@PathVariable Long id,
                                           @Valid @RequestBody CambiarPasswordAdminRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        return passwordService.cambiarPorAdmin(id, request, UsuarioActual.from(jwt));
    }
}
