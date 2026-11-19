package com.duoc.aquachile_backend.solicitud;

import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitudRepository extends JpaRepository<Solicitud, Long>, JpaSpecificationExecutor<Solicitud> {

    /** Trae candidato y responsable en la misma consulta para no hacer una consulta extra por fila. */
    @Override
    @EntityGraph(attributePaths = {"candidato", "responsable"})
    List<Solicitud> findAll(Specification<Solicitud> spec, Sort sort);

    long countByEstado(EstadoSolicitud estado);

    /** Filas [estado, cantidad] de todas las solicitudes. */
    @Query("select s.estado, count(s) from Solicitud s group by s.estado")
    List<Object[]> contarPorEstado();

    /** Filas [estado, cantidad] de las solicitudes asignadas a un evaluador. */
    @Query("select s.estado, count(s) from Solicitud s where s.responsable.id = :evaluadorId group by s.estado")
    List<Object[]> contarPorEstadoDeEvaluador(@Param("evaluadorId") Long evaluadorId);

    /** Solicitudes abiertas que todavia no tienen evaluador. */
    long countByResponsableIsNullAndEstadoIn(Collection<EstadoSolicitud> estados);

    /** Solicitudes de un evaluador que estan en un estado y aun no tienen informe. */
    long countByResponsableIdAndEstadoAndInformeDriveFileIdIsNull(Long responsableId, EstadoSolicitud estado);

    boolean existsByCandidatoId(Long candidatoId);

    long countByCandidatoId(Long candidatoId);
}
