package com.duoc.aquachile_backend.solicitud;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SolicitudRepository extends JpaRepository<Solicitud, Long>, JpaSpecificationExecutor<Solicitud> {

    /** Trae candidato y responsable en la misma consulta para no hacer una consulta extra por fila. */
    @Override
    @EntityGraph(attributePaths = {"candidato", "responsable"})
    List<Solicitud> findAll(Specification<Solicitud> spec, Sort sort);

    long countByEstado(EstadoSolicitud estado);

    boolean existsByCandidatoId(Long candidatoId);

    long countByCandidatoId(Long candidatoId);
}
