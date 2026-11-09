package com.duoc.aquachile_backend.solicitud;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Endpoint sin autenticacion: lo usa el formulario psicolaboral que completa el candidato. */
@RestController
@RequestMapping("/public/solicitudes")
@RequiredArgsConstructor
public class SolicitudPublicaController {

    private final SolicitudPublicaService publicaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudPublicaResponse registrar(@Valid @ModelAttribute SolicitudPublicaRequest datos,
                                              @RequestParam("cv") MultipartFile cv) {
        return publicaService.registrar(datos, cv);
    }
}
