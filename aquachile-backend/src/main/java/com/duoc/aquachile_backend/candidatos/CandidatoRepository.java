package com.duoc.aquachile_backend.candidatos;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidatoRepository extends JpaRepository<Candidato, Long> {

    List<Candidato> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

    /** El candidato mas antiguo registrado con ese correo (sin distinguir mayusculas). */
    Optional<Candidato> findFirstByCorreoIgnoreCaseOrderByIdAsc(String correo);
}
