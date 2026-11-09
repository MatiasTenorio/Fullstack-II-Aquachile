package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/solicitudes/{solicitudId}/informe")
@RequiredArgsConstructor
public class InformeController {

    private final InformeService informeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(Permisos.ANALISTA_EVALUADOR_O_ADMIN)
    public SolicitudResponse subir(@PathVariable Long solicitudId,
                                   @RequestParam("archivo") MultipartFile archivo,
                                   @AuthenticationPrincipal Jwt jwt) {
        return informeService.subir(solicitudId, archivo, UsuarioActual.from(jwt));
    }

    @GetMapping
    public ResponseEntity<byte[]> descargar(@PathVariable Long solicitudId, @AuthenticationPrincipal Jwt jwt) {
        return informeService.descargar(solicitudId, UsuarioActual.from(jwt)).comoRespuesta();
    }
}
