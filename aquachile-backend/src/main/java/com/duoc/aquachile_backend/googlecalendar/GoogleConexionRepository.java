package com.duoc.aquachile_backend.googlecalendar;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoogleConexionRepository extends JpaRepository<GoogleConexion, Long> {

    Optional<GoogleConexion> findByUsuarioId(Long usuarioId);
}
