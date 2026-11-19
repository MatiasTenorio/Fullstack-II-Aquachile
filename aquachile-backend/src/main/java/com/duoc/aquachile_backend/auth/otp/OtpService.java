package com.duoc.aquachile_backend.auth.otp;

import com.duoc.aquachile_backend.auth.Usuario;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Genera y valida codigos de un solo uso.
 * Reglas: 6 digitos, valen 10 minutos, admiten 5 intentos, sirven una sola vez
 * y pedir un codigo nuevo anula el anterior.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    public static final Duration VIGENCIA = Duration.ofMinutes(10);
    public static final int MAX_INTENTOS = 5;
    /** Tiempo minimo entre dos codigos para el mismo usuario y proposito. */
    private static final Duration ESPERA_ENTRE_CODIGOS = Duration.ofSeconds(60);

    private final CodigoOtpRepository codigoRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    /** Indica si a este usuario se le envio un codigo hace menos de un minuto (para no llenarle el correo). */
    @Transactional(readOnly = true)
    public boolean pidioHacePoco(Usuario usuario, PropositoOtp proposito) {
        return codigoRepository.findFirstByUsuarioIdAndPropositoOrderByCreadoEnDescIdDesc(usuario.getId(), proposito)
                .map(ultimo -> ultimo.getCreadoEn().plus(ESPERA_ENTRE_CODIGOS).isAfter(Instant.now()))
                .orElse(false);
    }

    /** Crea un codigo nuevo, anula los anteriores y devuelve el codigo en claro para enviarlo por correo. */
    @Transactional
    public String generar(Usuario usuario, PropositoOtp proposito, Usuario objetivo) {
        codigoRepository.findByUsuarioIdAndPropositoAndUsadoFalse(usuario.getId(), proposito)
                .forEach(anterior -> anterior.setUsado(true));

        String codigo = String.format("%06d", random.nextInt(1_000_000));
        Instant ahora = Instant.now();
        CodigoOtp registro = new CodigoOtp();
        registro.setUsuario(usuario);
        registro.setProposito(proposito);
        registro.setUsuarioObjetivo(objetivo);
        registro.setCodigoHash(passwordEncoder.encode(codigo));
        registro.setCreadoEn(ahora);
        registro.setExpiraEn(ahora.plus(VIGENCIA));
        codigoRepository.save(registro);
        return codigo;
    }

    /**
     * Comprueba el codigo que ingreso el usuario. Si es correcto lo marca como usado y devuelve true.
     * Si es incorrecto suma un intento (y lo anula al quinto) y devuelve false.
     * objetivoId debe coincidir con la cuenta para la que se pidio el codigo (null si no aplica).
     */
    @Transactional
    public boolean consumir(Usuario usuario, PropositoOtp proposito, Long objetivoId, String codigo) {
        Optional<CodigoOtp> ultimo = codigoRepository
                .findFirstByUsuarioIdAndPropositoOrderByCreadoEnDescIdDesc(usuario.getId(), proposito);
        if (ultimo.isEmpty()) {
            return false;
        }
        CodigoOtp registro = ultimo.get();
        Long objetivoDelCodigo = registro.getUsuarioObjetivo() != null ? registro.getUsuarioObjetivo().getId() : null;
        boolean vigente = !registro.isUsado()
                && registro.getExpiraEn().isAfter(Instant.now())
                && java.util.Objects.equals(objetivoDelCodigo, objetivoId);
        if (!vigente) {
            return false;
        }
        if (codigo != null && passwordEncoder.matches(codigo.trim(), registro.getCodigoHash())) {
            registro.setUsado(true);
            return true;
        }
        registro.setIntentos(registro.getIntentos() + 1);
        if (registro.getIntentos() >= MAX_INTENTOS) {
            registro.setUsado(true);
        }
        return false;
    }
}
