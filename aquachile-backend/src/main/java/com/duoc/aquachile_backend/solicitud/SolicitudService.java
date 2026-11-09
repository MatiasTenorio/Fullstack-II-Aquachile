package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.candidatos.Candidato;
import com.duoc.aquachile_backend.candidatos.CandidatoService;
import com.duoc.aquachile_backend.drive.CarpetaCandidatoService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final CandidatoService candidatoService;
    private final UsuarioRepository usuarioRepository;
    private final CarpetaCandidatoService carpetaCandidatoService;

    @Transactional
    public SolicitudResponse crear(SolicitudCreateRequest request) {
        boolean conCandidatoExistente = request.candidatoId() != null;
        boolean conCandidatoNuevo = request.candidato() != null;
        if (conCandidatoExistente == conCandidatoNuevo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Indica candidatoId o los datos de un candidato nuevo, pero no ambos");
        }

        Candidato candidato = conCandidatoExistente
                ? candidatoService.buscarEntidad(request.candidatoId())
                : candidatoService.obtenerOCrear(request.candidato());

        Solicitud solicitud = new Solicitud();
        solicitud.setCandidato(candidato);
        solicitud.setCargo(request.cargo().trim());
        solicitud.setFamiliaCargo(request.familiaCargo().trim());
        Solicitud guardada = solicitudRepository.save(solicitud);
        // Si Drive falla la solicitud igual se guarda; la carpeta se puede crear despues
        carpetaCandidatoService.intentarCrear(candidato);
        return aResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudResumenResponse> listar(SolicitudFiltro filtro, UsuarioActual actual) {
        // El profesional evaluador ve las solicitudes asignadas a el y las que nadie ha tomado todavia
        Long evaluadorId = actual.rol() == Rol.PROFESIONAL_EVALUADOR ? actual.id() : null;
        Sort orden = Sort.by(Sort.Order.desc("fechaSolicitud"), Sort.Order.desc("id"));
        return solicitudRepository.findAll(especificacion(filtro, evaluadorId), orden).stream()
                .map(SolicitudResumenResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudResponse obtener(Long id, UsuarioActual actual) {
        Solicitud solicitud = buscarEntidad(id);
        verificarAcceso(solicitud, actual);
        return aResponse(solicitud);
    }

    @Transactional
    public SolicitudResponse actualizar(Long id, SolicitudActualizarRequest request) {
        Solicitud solicitud = buscarEntidad(id);

        if (request.responsableId() != null) {
            Usuario responsable = usuarioRepository.findById(request.responsableId())
                    .filter(Usuario::isActivo)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "El responsable no existe o esta inactivo"));
            if (responsable.getRol() != Rol.PROFESIONAL_EVALUADOR) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El responsable debe tener el rol Profesional Evaluador");
            }
            solicitud.setResponsable(responsable);
        }
        return aResponse(solicitud);
    }

    @Transactional
    public SolicitudResponse cambiarEstado(Long id, EstadoSolicitud nuevo, UsuarioActual actual) {
        Solicitud solicitud = buscarEntidad(id);
        verificarAcceso(solicitud, actual);

        EstadoSolicitud actualEstado = solicitud.getEstado();
        boolean transicionValida =
                (actualEstado == EstadoSolicitud.PENDIENTE && nuevo == EstadoSolicitud.EN_PROCESO)
                || (actualEstado == EstadoSolicitud.EN_PROCESO && nuevo == EstadoSolicitud.FINALIZADO);
        if (!transicionValida) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede pasar de " + actualEstado + " a " + nuevo);
        }
        if (nuevo == EstadoSolicitud.FINALIZADO && solicitud.getInformeDriveFileId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sube el informe del psicologo (PDF, DOC o DOCX) antes de completar la solicitud");
        }
        // Quien actualiza el estado queda como responsable de la solicitud
        Usuario quienActualiza = usuarioRepository.findById(actual.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        solicitud.setResponsable(quienActualiza);
        solicitud.setEstado(nuevo);
        return aResponse(solicitud);
    }

    /** Arma la respuesta de una solicitud, incluyendo cuantas solicitudes ha enviado ya ese mismo candidato. */
    public SolicitudResponse aResponse(Solicitud solicitud) {
        long total = solicitudRepository.countByCandidatoId(solicitud.getCandidato().getId());
        return SolicitudResponse.from(solicitud, total);
    }

    @Transactional(readOnly = true)
    public Solicitud buscarEntidad(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
    }

    /** Un profesional evaluador solo puede operar sobre solicitudes asignadas a el o que aun no tienen responsable. */
    public void verificarAcceso(Solicitud solicitud, UsuarioActual actual) {
        if (actual.rol() == Rol.PROFESIONAL_EVALUADOR) {
            Usuario responsable = solicitud.getResponsable();
            if (responsable != null && !responsable.getId().equals(actual.id())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La solicitud esta asignada a otro usuario");
            }
        }
    }

    private Specification<Solicitud> especificacion(SolicitudFiltro filtro, Long evaluadorId) {
        return (root, query, cb) -> {
            List<Predicate> condiciones = new ArrayList<>();
            if (tieneTexto(filtro.busqueda())) {
                Join<Solicitud, Candidato> candidato = root.join("candidato");
                String patron = contiene(filtro.busqueda());
                condiciones.add(cb.or(
                        cb.like(cb.lower(candidato.get("nombre")), patron),
                        cb.like(cb.lower(root.get("cargo")), patron),
                        cb.like(cb.lower(root.get("familiaCargo")), patron)));
            }
            if (tieneTexto(filtro.nombreCandidato())) {
                Join<Solicitud, Candidato> candidato = root.join("candidato");
                condiciones.add(cb.like(cb.lower(candidato.get("nombre")), contiene(filtro.nombreCandidato())));
            }
            if (tieneTexto(filtro.cargo())) {
                condiciones.add(cb.like(cb.lower(root.get("cargo")), contiene(filtro.cargo())));
            }
            if (tieneTexto(filtro.familiaCargo())) {
                condiciones.add(cb.equal(cb.lower(root.get("familiaCargo")), filtro.familiaCargo().trim().toLowerCase()));
            }
            if (filtro.estado() != null) {
                condiciones.add(cb.equal(root.get("estado"), filtro.estado()));
            }
            if (evaluadorId != null) {
                // left join: las solicitudes sin responsable tambien deben aparecer
                Join<Solicitud, Usuario> responsable = root.join("responsable", JoinType.LEFT);
                condiciones.add(cb.or(cb.isNull(responsable.get("id")), cb.equal(responsable.get("id"), evaluadorId)));
            } else if (filtro.responsableId() != null) {
                condiciones.add(cb.equal(root.get("responsable").get("id"), filtro.responsableId()));
            }
            if (filtro.fechaDesde() != null) {
                condiciones.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("fechaSolicitud"), filtro.fechaDesde()));
            }
            if (filtro.fechaHasta() != null) {
                condiciones.add(cb.lessThanOrEqualTo(root.<LocalDate>get("fechaSolicitud"), filtro.fechaHasta()));
            }
            return cb.and(condiciones.toArray(new Predicate[0]));
        };
    }

    private boolean tieneTexto(String texto) {
        return texto != null && !texto.isBlank();
    }

    private String contiene(String texto) {
        return "%" + texto.trim().toLowerCase() + "%";
    }
}
