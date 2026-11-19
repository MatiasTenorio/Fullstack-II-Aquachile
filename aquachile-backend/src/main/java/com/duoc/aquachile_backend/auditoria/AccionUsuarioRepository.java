package com.duoc.aquachile_backend.auditoria;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AccionUsuarioRepository extends JpaRepository<AccionUsuario, Long> {

    Page<AccionUsuario> findByUsuarioId(Long usuarioId, Pageable pagina);

    Page<AccionUsuario> findByUsuarioIdAndTipoIn(Long usuarioId, Collection<TipoAccion> tipos, Pageable pagina);

    /** Filas [usuario_id, fecha de su ultima accion]. */
    @Query("select a.usuario.id, max(a.fecha) from AccionUsuario a group by a.usuario.id")
    List<Object[]> ultimaAccionPorUsuario();

    default java.util.Map<Long, Instant> ultimaAccionPorUsuarioMapa() {
        java.util.Map<Long, Instant> mapa = new java.util.HashMap<>();
        for (Object[] fila : ultimaAccionPorUsuario()) {
            mapa.put((Long) fila[0], (Instant) fila[1]);
        }
        return mapa;
    }
}
