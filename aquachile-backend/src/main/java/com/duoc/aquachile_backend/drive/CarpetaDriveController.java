package com.duoc.aquachile_backend.drive;

import com.duoc.aquachile_backend.auth.Permisos;
import com.duoc.aquachile_backend.candidatos.CandidatoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CarpetaDriveController {

    private final CarpetaCandidatoService carpetaCandidatoService;

    /** Reintenta crear la carpeta de un candidato cuando Drive fallo al crearlo. */
    @PostMapping("/candidatos/{id}/carpeta-drive")
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public CandidatoResponse crearCarpeta(@PathVariable Long id) {
        return carpetaCandidatoService.asegurarPorId(id);
    }
}
