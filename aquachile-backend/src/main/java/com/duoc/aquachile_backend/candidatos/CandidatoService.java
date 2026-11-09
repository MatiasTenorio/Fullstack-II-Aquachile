package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.solicitud.SolicitudRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CandidatoService {

    private final CandidatoRepository candidatoRepository;
    private final SolicitudRepository solicitudRepository;

    @Transactional(readOnly = true)
    public List<CandidatoResponse> listar(String nombre) {
        List<Candidato> candidatos = (nombre == null || nombre.isBlank())
                ? candidatoRepository.findAll(Sort.by("nombre"))
                : candidatoRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre.trim());
        return candidatos.stream().map(CandidatoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CandidatoResponse obtener(Long id) {
        return CandidatoResponse.from(buscarEntidad(id));
    }

    @Transactional
    public CandidatoResponse crear(CandidatoRequest request) {
        return CandidatoResponse.from(crearEntidad(request));
    }

    /** Lo usa tambien el servicio de solicitudes cuando el candidato llega junto con la solicitud. */
    @Transactional
    public Candidato crearEntidad(CandidatoRequest request) {
        Candidato candidato = new Candidato();
        aplicar(candidato, request);
        return candidatoRepository.save(candidato);
    }

    /** Reutiliza al candidato que ya se registro con el mismo correo; si no existe (o no hay correo), crea uno nuevo. */
    @Transactional
    public Candidato obtenerOCrear(CandidatoRequest request) {
        String correo = limpiar(request.correo());
        if (correo != null) {
            Optional<Candidato> existente = candidatoRepository.findFirstByCorreoIgnoreCaseOrderByIdAsc(correo);
            if (existente.isPresent()) {
                return existente.get();
            }
        }
        return crearEntidad(request);
    }

    @Transactional
    public CandidatoResponse actualizar(Long id, CandidatoRequest request) {
        Candidato candidato = buscarEntidad(id);
        aplicar(candidato, request);
        return CandidatoResponse.from(candidato);
    }

    @Transactional
    public void eliminar(Long id) {
        Candidato candidato = buscarEntidad(id);
        if (solicitudRepository.existsByCandidatoId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar un candidato que tiene solicitudes de evaluacion");
        }
        candidatoRepository.delete(candidato);
    }

    @Transactional(readOnly = true)
    public Candidato buscarEntidad(Long id) {
        return candidatoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidato no encontrado"));
    }

    private void aplicar(Candidato candidato, CandidatoRequest request) {
        candidato.setNombre(request.nombre().trim());
        candidato.setCorreo(limpiar(request.correo()));
        candidato.setTelefono(limpiar(request.telefono()));
    }

    private String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
