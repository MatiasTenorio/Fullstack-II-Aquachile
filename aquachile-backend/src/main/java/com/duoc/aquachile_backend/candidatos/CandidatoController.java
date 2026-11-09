package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.auth.Permisos;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidatos")
@RequiredArgsConstructor
public class CandidatoController {

    private final CandidatoService candidatoService;

    @GetMapping
    public List<CandidatoResponse> listar(@RequestParam(required = false) String nombre) {
        return candidatoService.listar(nombre);
    }

    @GetMapping("/{id}")
    public CandidatoResponse obtener(@PathVariable Long id) {
        return candidatoService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public CandidatoResponse crear(@Valid @RequestBody CandidatoRequest request) {
        return candidatoService.crear(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public CandidatoResponse actualizar(@PathVariable Long id, @Valid @RequestBody CandidatoRequest request) {
        return candidatoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize(Permisos.ANALISTA_O_ADMIN)
    public void eliminar(@PathVariable Long id) {
        candidatoService.eliminar(id);
    }
}
