package com.duoc.aquachile_backend.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Usuario> findByRolAndActivoTrueOrderByNombreAsc(Rol rol);

    /** Filas [rol, cantidad] de las cuentas activas. */
    @Query("select u.rol, count(u) from Usuario u where u.activo = true group by u.rol")
    List<Object[]> contarActivosPorRol();

    long countByActivoFalse();
}
