package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.UsuarioActual;
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
    private final RegistroAcciones registro;

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
    public CandidatoResponse crear(CandidatoRequest request, UsuarioActual actual) {
        verificarCorreoLibre(request.correo(), null);
        Candidato candidato = new Candidato();
        aplicar(candidato, request);
        Candidato guardado = candidatoRepository.save(candidato);
        registro.registrar(actual, TipoAccion.CANDIDATO_REGISTRADO, "Registró al candidato " + describir(guardado));
        return CandidatoResponse.from(guardado);
    }

    @Transactional
    public CandidatoResponse actualizar(Long id, CandidatoRequest request, UsuarioActual actual) {
        Candidato candidato = buscarEntidad(id);
        verificarCorreoLibre(request.correo(), id);
        String antes = describir(candidato);
        aplicar(candidato, request);
        String despues = describir(candidato);
        registro.registrar(actual, TipoAccion.CANDIDATO_EDITADO, antes.equals(despues)
                ? "Guardó sin cambios al candidato " + despues
                : "Editó al candidato " + antes + "; quedó como " + despues);
        return CandidatoResponse.from(candidato);
    }

    /** "Ana Perez (ana@correo.cl, +56 9 1111 1111)" para las descripciones del historial de acciones. */
    private String describir(Candidato c) {
        String contacto = java.util.stream.Stream.of(c.getCorreo(), c.getTelefono())
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(", "));
        return c.getNombre() + (contacto.isEmpty() ? "" : " (" + contacto + ")");
    }

    /** Dos candidatos no pueden compartir correo; idPropio es el candidato que se esta editando (o null al crear). */
    private void verificarCorreoLibre(String correo, Long idPropio) {
        String limpio = limpiar(correo);
        if (limpio == null) {
            return;
        }
        Optional<Candidato> existente = candidatoRepository.findFirstByCorreoIgnoreCaseOrderByIdAsc(limpio);
        if (existente.isPresent() && !existente.get().getId().equals(idPropio)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un candidato registrado con ese correo");
        }
    }

    @Transactional
    public void eliminar(Long id, UsuarioActual actual) {
        Candidato candidato = buscarEntidad(id);
        if (solicitudRepository.existsByCandidatoId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar un candidato que tiene solicitudes de evaluacion");
        }
        registro.registrar(actual, TipoAccion.CANDIDATO_ELIMINADO, "Eliminó al candidato " + describir(candidato));
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
