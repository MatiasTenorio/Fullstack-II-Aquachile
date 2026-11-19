package com.duoc.aquachile_backend.solicitud;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {

    /** Del mas reciente al mas antiguo, con el usuario cargado en la misma consulta. */
    @EntityGraph(attributePaths = "usuario")
    List<HistorialEstado> findBySolicitudIdOrderByFechaDescIdDesc(Long solicitudId);
}
