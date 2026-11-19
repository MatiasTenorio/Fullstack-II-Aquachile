package com.duoc.aquachile_backend.auth.service;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.auth.dto.CambiarPasswordAdminRequest;
import com.duoc.aquachile_backend.auth.dto.MensajeResponse;
import com.duoc.aquachile_backend.auth.dto.RestablecerPasswordRequest;
import com.duoc.aquachile_backend.auth.otp.OtpService;
import com.duoc.aquachile_backend.auth.otp.PropositoOtp;
import com.duoc.aquachile_backend.correo.EnviadorCorreo;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Contrasenas con codigo OTP por correo. Dos flujos:
 * 1) El propio usuario define o restablece su contrasena (tambien es el primer ingreso de una cuenta nueva).
 * 2) El administrador cambia la contrasena de una cuenta que no es de administrador; el codigo
 *    llega al correo del administrador, para confirmar que es el quien hace el cambio.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private static final String CODIGO_INVALIDO = "El código es incorrecto o ya venció. Pide uno nuevo si es necesario.";

    private final UsuarioRepository usuarioRepository;
    private final OtpService otpService;
    private final EnviadorCorreo correo;
    private final PasswordEncoder passwordEncoder;
    private final RegistroAcciones registro;

    /**
     * Envia el codigo al correo indicado. La respuesta es siempre la misma, exista o no la cuenta,
     * para no revelar que correos estan registrados.
     */
    @Transactional
    public MensajeResponse solicitarCodigo(String email) {
        Optional<Usuario> encontrado = buscarActivo(email);
        if (encontrado.isPresent() && !otpService.pidioHacePoco(encontrado.get(), PropositoOtp.RESTABLECER_PASSWORD)) {
            Usuario usuario = encontrado.get();
            String codigo = otpService.generar(usuario, PropositoOtp.RESTABLECER_PASSWORD, null);
            try {
                correo.enviar(usuario.getEmail(), "Código para tu contraseña - AquaChile", """
                        Hola %s:

                        Tu código para definir o restablecer tu contraseña es: %s

                        Vale por %d minutos y sirve una sola vez.
                        Si no pediste este código, ignora este correo: tu contraseña no cambia.
                        """.formatted(usuario.getNombre(), codigo, OtpService.VIGENCIA.toMinutes()));
            } catch (RuntimeException e) {
                // No se informa al cliente (revelaria que la cuenta existe); queda en el log para revisarlo
                log.error("No se pudo enviar el código de contraseña a {}: {}", usuario.getEmail(), e.getMessage());
            }
        }
        return new MensajeResponse(
                "Si el correo pertenece a una cuenta activa, te enviamos un código. Revisa tu bandeja de entrada.");
    }

    /** Cambia la contrasena si el codigo es correcto. Un codigo equivocado cuenta como intento aunque la peticion falle. */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public MensajeResponse restablecer(RestablecerPasswordRequest request) {
        Usuario usuario = buscarActivo(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, CODIGO_INVALIDO));
        if (!otpService.consumir(usuario, PropositoOtp.RESTABLECER_PASSWORD, null, request.codigo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, CODIGO_INVALIDO);
        }
        usuario.setPasswordHash(passwordEncoder.encode(request.nuevaPassword()));
        registro.registrar(usuario.getId(), TipoAccion.CONTRASENA_RESTABLECIDA,
                "Definió o restableció su contraseña con un código enviado a su correo", null, null);
        return new MensajeResponse("Tu contraseña fue actualizada. Ya puedes iniciar sesión.");
    }

    /** El administrador pide el codigo (llega a su propio correo) para cambiar la contrasena de otra cuenta. */
    @Transactional
    public MensajeResponse solicitarCodigoAdmin(Long objetivoId, UsuarioActual actual) {
        Usuario admin = buscarAdmin(actual);
        Usuario objetivo = buscarObjetivo(objetivoId);
        if (otpService.pidioHacePoco(admin, PropositoOtp.CAMBIO_POR_ADMIN)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Ya se envió un código hace menos de un minuto. Espera antes de pedir otro.");
        }
        String codigo = otpService.generar(admin, PropositoOtp.CAMBIO_POR_ADMIN, objetivo);
        try {
            correo.enviar(admin.getEmail(), "Código para cambiar una contraseña - AquaChile", """
                    Hola %s:

                    Tu código para cambiar la contraseña de %s (%s) es: %s

                    Vale por %d minutos y sirve una sola vez.
                    Si no fuiste tú, ignora este correo y revisa quién tiene acceso a tu cuenta.
                    """.formatted(admin.getNombre(), objetivo.getNombre(), objetivo.getEmail(), codigo,
                    OtpService.VIGENCIA.toMinutes()));
        } catch (RuntimeException e) {
            log.error("No se pudo enviar el código de administrador a {}: {}", admin.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo enviar el correo con el código. Revisa la configuración de correo del servidor.");
        }
        return new MensajeResponse("Enviamos un código a tu correo (" + admin.getEmail() + ").");
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public MensajeResponse cambiarPorAdmin(Long objetivoId, CambiarPasswordAdminRequest request, UsuarioActual actual) {
        Usuario admin = buscarAdmin(actual);
        Usuario objetivo = buscarObjetivo(objetivoId);
        if (!otpService.consumir(admin, PropositoOtp.CAMBIO_POR_ADMIN, objetivo.getId(), request.codigo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, CODIGO_INVALIDO);
        }
        objetivo.setPasswordHash(passwordEncoder.encode(request.nuevaPassword()));
        registro.registrar(actual, TipoAccion.CONTRASENA_CAMBIADA,
                "Cambió la contraseña de " + objetivo.getNombre() + " (" + objetivo.getEmail() + ")");
        return new MensajeResponse("La contraseña de " + objetivo.getNombre() + " fue actualizada.");
    }

    private Optional<Usuario> buscarActivo(String email) {
        return usuarioRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT)).filter(Usuario::isActivo);
    }

    private Usuario buscarAdmin(UsuarioActual actual) {
        return usuarioRepository.findById(actual.id())
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no disponible"));
    }

    /** La cuenta a modificar debe existir y no ser de administrador: cada administrador cambia la suya con su propio codigo. */
    private Usuario buscarObjetivo(Long objetivoId) {
        Usuario objetivo = usuarioRepository.findById(objetivoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (objetivo.getRol() == Rol.ADMINISTRADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No se puede cambiar la contraseña de una cuenta de administrador");
        }
        return objetivo;
    }
}
