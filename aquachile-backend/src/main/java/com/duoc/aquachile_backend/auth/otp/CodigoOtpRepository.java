package com.duoc.aquachile_backend.auth.otp;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodigoOtpRepository extends JpaRepository<CodigoOtp, Long> {

    /** El ultimo codigo que se le envio a un usuario para un proposito (este usado o no). */
    Optional<CodigoOtp> findFirstByUsuarioIdAndPropositoOrderByCreadoEnDescIdDesc(Long usuarioId, PropositoOtp proposito);

    List<CodigoOtp> findByUsuarioIdAndPropositoAndUsadoFalse(Long usuarioId, PropositoOtp proposito);
}
