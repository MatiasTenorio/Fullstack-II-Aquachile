package com.duoc.aquachile_backend.entrevista;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EntrevistaRepository extends JpaRepository<Entrevista, Long> {

    List<Entrevista> findBySolicitudIdOrderByInicioDesc(Long solicitudId);

    Optional<Entrevista> findBySolicitudIdAndEstado(Long solicitudId, EstadoEntrevista estado);

    /** Para mostrar la fecha de la entrevista vigente en cada fila del listado de solicitudes. */
    List<Entrevista> findBySolicitudIdInAndEstado(Collection<Long> solicitudIds, EstadoEntrevista estado);

    /** Entrevistas de todos los evaluadores que caen dentro del rango [desde, hasta), ordenadas por hora. */
    @Query("""
            select e from Entrevista e
            join fetch e.solicitud s
            join fetch s.candidato
            left join fetch s.responsable
            where e.estado in :estados
              and e.inicio < :hasta
              and e.fin > :desde
            order by e.inicio
            """)
    List<Entrevista> buscarAgenda(@Param("estados") Collection<EstadoEntrevista> estados,
                                  @Param("desde") Instant desde,
                                  @Param("hasta") Instant hasta);

    /** Igual que buscarAgenda, pero solo las entrevistas de las solicitudes de un evaluador. */
    @Query("""
            select e from Entrevista e
            join fetch e.solicitud s
            join fetch s.candidato
            join fetch s.responsable r
            where r.id = :evaluadorId
              and e.estado in :estados
              and e.inicio < :hasta
              and e.fin > :desde
            order by e.inicio
            """)
    List<Entrevista> buscarAgendaDeEvaluador(@Param("evaluadorId") Long evaluadorId,
                                             @Param("estados") Collection<EstadoEntrevista> estados,
                                             @Param("desde") Instant desde,
                                             @Param("hasta") Instant hasta);

    /**
     * Indica si el evaluador ya tiene otra entrevista agendada que se cruza con el horario [inicio, fin).
     * excluirId es la entrevista que se esta reprogramando (o -1 si se esta creando una nueva).
     */
    @Query("""
            select count(e) > 0 from Entrevista e
            where e.solicitud.responsable.id = :evaluadorId
              and e.estado = :estado
              and e.inicio < :fin
              and e.fin > :inicio
              and e.id <> :excluirId
            """)
    boolean existeCruce(@Param("evaluadorId") Long evaluadorId,
                        @Param("estado") EstadoEntrevista estado,
                        @Param("inicio") Instant inicio,
                        @Param("fin") Instant fin,
                        @Param("excluirId") Long excluirId);
}
