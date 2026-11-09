package com.duoc.aquachile_backend.drive;

import com.duoc.aquachile_backend.candidatos.Candidato;
import com.duoc.aquachile_backend.candidatos.CandidatoRepository;
import com.duoc.aquachile_backend.candidatos.CandidatoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Garantiza que cada candidato tenga su carpeta en Drive. */
@Slf4j
@Service
@RequiredArgsConstructor
public class CarpetaCandidatoService {

    private final AlmacenArchivos almacen;
    private final CandidatoRepository candidatoRepository;

    /** Devuelve el id de la carpeta del candidato y la crea si todavia no existe. */
    public String asegurar(Candidato candidato) {
        if (candidato.getDriveFolderId() != null) {
            return candidato.getDriveFolderId();
        }
        String carpetaId = almacen.crearCarpeta(candidato.getId() + " - " + nombreSeguro(candidato.getNombre()));
        candidato.setDriveFolderId(carpetaId);
        candidatoRepository.save(candidato);
        return carpetaId;
    }

    /** Igual que asegurar, pero un fallo de Drive se registra y no interrumpe quien llama. */
    public void intentarCrear(Candidato candidato) {
        try {
            asegurar(candidato);
        } catch (RuntimeException e) {
            log.warn("No se pudo crear la carpeta de Drive del candidato {}: {}", candidato.getId(), e.getMessage());
        }
    }

    @Transactional
    public CandidatoResponse asegurarPorId(Long candidatoId) {
        Candidato candidato = candidatoRepository.findById(candidatoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidato no encontrado"));
        asegurar(candidato);
        return CandidatoResponse.from(candidato);
    }

    private String nombreSeguro(String nombre) {
        String limpio = nombre.replaceAll("[\\\\/:*?\"<>|]", "").trim();
        return limpio.length() > 80 ? limpio.substring(0, 80) : limpio;
    }
}
