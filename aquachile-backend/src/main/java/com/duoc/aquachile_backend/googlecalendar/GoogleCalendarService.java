package com.duoc.aquachile_backend.googlecalendar;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.entrevista.Entrevista;
import com.duoc.aquachile_backend.solicitud.Solicitud;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Conexion de cada evaluador con su Google Calendar.
 * La base de datos manda: la entrevista siempre se guarda en el sistema y despues se copia a Google.
 * Si Google falla o el evaluador no conecto su cuenta, la entrevista queda igual y solo no aparece en Google.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private static final String USO_ESTADO = "google-oauth";
    private static final Duration VIGENCIA_ESTADO = Duration.ofMinutes(10);

    private final GoogleCalendarConfig config;
    private final GoogleApiCliente google;
    private final GoogleConexionRepository conexionRepository;
    private final UsuarioRepository usuarioRepository;
    private final CifradorTokens cifrador;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final RegistroAcciones registro;

    /** Tokens de acceso vigentes por usuario, para no pedir uno nuevo a Google en cada operacion. */
    private final Map<Long, TokenEnMemoria> tokens = new ConcurrentHashMap<>();

    private record TokenEnMemoria(String accessToken, Instant expira) {
    }

    @Transactional(readOnly = true)
    public GoogleCalendarEstadoResponse estado(UsuarioActual actual) {
        Optional<GoogleConexion> conexion = conexionRepository.findByUsuarioId(actual.id());
        return new GoogleCalendarEstadoResponse(
                config.isListo(),
                conexion.isPresent(),
                conexion.map(GoogleConexion::getGoogleEmail).orElse(null));
    }

    /**
     * Direccion de Google donde el evaluador autoriza el acceso a su calendario.
     * El parametro "state" es un token firmado y de corta duracion que dice a que usuario
     * pertenece la autorizacion; Google lo devuelve intacto al volver al sistema.
     */
    public String urlAutorizacion(UsuarioActual actual) {
        exigirHabilitado();
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("aquachile-backend")
                .issuedAt(ahora)
                .expiresAt(ahora.plus(VIGENCIA_ESTADO))
                .subject(actual.email())
                .claim("uid", actual.id())
                .claim("uso", USO_ESTADO)
                .build();
        String estado = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return UriComponentsBuilder.fromUriString(config.getAuthUrl())
                .queryParam("client_id", config.getClientId())
                .queryParam("redirect_uri", config.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", GoogleCalendarConfig.SCOPES)
                // offline + consent: Google entrega el permiso permanente (refresh token)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", estado)
                .build()
                .encode()
                .toUriString();
    }

    /**
     * Google vuelve aqui despues de que el evaluador acepta (o rechaza). Guarda la conexion y
     * devuelve la direccion del frontend a la que hay que redirigir, con el resultado en ?google=...
     */
    @Transactional
    public String completarConexion(String codigo, String estado, String error) {
        if (error != null || codigo == null || estado == null) {
            return destino(error != null ? "cancelado" : "error");
        }
        try {
            Jwt jwt = jwtDecoder.decode(estado);
            if (!USO_ESTADO.equals(jwt.getClaimAsString("uso"))) {
                return destino("error");
            }
            Number uid = jwt.getClaim("uid");
            Usuario usuario = usuarioRepository.findById(uid.longValue()).filter(Usuario::isActivo).orElse(null);
            if (usuario == null || !config.isListo()) {
                return destino("error");
            }

            GoogleApiCliente.Tokens recibidos = google.canjearCodigo(codigo);
            if (recibidos.refreshToken() == null) {
                // Sin permiso permanente no se podria sincronizar mas adelante
                log.warn("Google no entrego refresh token al usuario {}", usuario.getId());
                return destino("error");
            }
            GoogleConexion conexion = conexionRepository.findByUsuarioId(usuario.getId()).orElseGet(GoogleConexion::new);
            conexion.setUsuario(usuario);
            conexion.setGoogleEmail(google.correoDeLaCuenta(recibidos.accessToken()));
            conexion.setRefreshTokenCifrado(cifrador.cifrar(recibidos.refreshToken()));
            conexion.setConectadoEn(Instant.now());
            conexionRepository.save(conexion);
            registro.registrar(usuario.getId(), TipoAccion.GOOGLE_CONECTADO, "Conectó su cuenta de Google Calendar"
                    + (conexion.getGoogleEmail() != null ? " (" + conexion.getGoogleEmail() + ")" : ""), null, null);
            recordar(usuario.getId(), recibidos);
            return destino("conectado");
        } catch (JwtException e) {
            log.warn("Estado de autorizacion de Google invalido o vencido: {}", e.getMessage());
            return destino("error");
        } catch (RuntimeException e) {
            log.error("No se pudo completar la conexion con Google Calendar: {}", e.getMessage());
            return destino("error");
        }
    }

    /** Quita la conexion. Los eventos que ya estan en Google Calendar no se borran. */
    @Transactional
    public GoogleCalendarEstadoResponse desconectar(UsuarioActual actual) {
        conexionRepository.findByUsuarioId(actual.id()).ifPresent(conexion -> {
            try {
                google.revocar(cifrador.descifrar(conexion.getRefreshTokenCifrado()));
            } catch (RuntimeException e) {
                log.warn("No se pudo revocar el permiso en Google (se quita la conexion igual): {}", e.getMessage());
            }
            conexionRepository.delete(conexion);
            tokens.remove(actual.id());
            registro.registrar(actual, TipoAccion.GOOGLE_DESCONECTADO, "Desconectó su cuenta de Google Calendar"
                    + (conexion.getGoogleEmail() != null ? " (" + conexion.getGoogleEmail() + ")" : ""));
        });
        return new GoogleCalendarEstadoResponse(config.isListo(), false, null);
    }

    public boolean estaConectado(Long usuarioId) {
        return config.isListo() && conexionRepository.findByUsuarioId(usuarioId).isPresent();
    }

    /**
     * Crea o actualiza el evento de la entrevista en el Google Calendar del evaluador (dueno).
     * No lanza errores: si algo falla, la entrevista queda sin evento y se puede reintentar despues.
     */
    public void sincronizar(Entrevista entrevista, Usuario dueno) {
        conexionDe(dueno).ifPresent(conexion -> {
            try {
                String accessToken = tokenDeAcceso(conexion);
                Map<String, Object> evento = construirEvento(entrevista);
                String eventoId = entrevista.getGoogleEventId();
                if (eventoId != null && google.actualizarEvento(accessToken, eventoId, evento)) {
                    return;
                }
                entrevista.setGoogleEventId(google.crearEvento(accessToken, evento));
            } catch (GoogleAutorizacionRevocadaException e) {
                olvidar(conexion);
            } catch (RuntimeException e) {
                log.warn("No se pudo copiar la entrevista {} a Google Calendar: {}", entrevista.getId(), e.getMessage());
            }
        });
    }

    /** Borra de Google Calendar el evento de una entrevista cancelada. Tampoco lanza errores. */
    public void quitar(Entrevista entrevista, Usuario dueno) {
        String eventoId = entrevista.getGoogleEventId();
        if (eventoId == null) {
            return;
        }
        conexionDe(dueno).ifPresent(conexion -> {
            try {
                google.eliminarEvento(tokenDeAcceso(conexion), eventoId);
                entrevista.setGoogleEventId(null);
            } catch (GoogleAutorizacionRevocadaException e) {
                olvidar(conexion);
            } catch (RuntimeException e) {
                log.warn("No se pudo borrar de Google Calendar el evento de la entrevista {}: {}",
                        entrevista.getId(), e.getMessage());
            }
        });
    }

    private Optional<GoogleConexion> conexionDe(Usuario dueno) {
        if (!config.isListo() || dueno == null) {
            return Optional.empty();
        }
        return conexionRepository.findByUsuarioId(dueno.getId());
    }

    /** Google ya no acepta el permiso: se elimina la conexion para que el evaluador vuelva a conectar su cuenta. */
    private void olvidar(GoogleConexion conexion) {
        Long usuarioId = conexion.getUsuario().getId();
        log.warn("Google revoco el permiso del usuario {}; debe volver a conectar su cuenta", usuarioId);
        tokens.remove(usuarioId);
        conexionRepository.delete(conexion);
    }

    private String tokenDeAcceso(GoogleConexion conexion) {
        Long usuarioId = conexion.getUsuario().getId();
        TokenEnMemoria guardado = tokens.get(usuarioId);
        // Se renueva un minuto antes del vencimiento para no usar un token a punto de caducar
        if (guardado != null && guardado.expira().isAfter(Instant.now().plusSeconds(60))) {
            return guardado.accessToken();
        }
        GoogleApiCliente.Tokens nuevos = google.renovar(cifrador.descifrar(conexion.getRefreshTokenCifrado()));
        recordar(usuarioId, nuevos);
        return nuevos.accessToken();
    }

    private void recordar(Long usuarioId, GoogleApiCliente.Tokens recibidos) {
        tokens.put(usuarioId, new TokenEnMemoria(recibidos.accessToken(),
                Instant.now().plusSeconds(recibidos.expiraEnSegundos())));
    }

    /** Datos del evento. No se agregan invitados: los correos de los candidatos son ficticios. */
    private Map<String, Object> construirEvento(Entrevista entrevista) {
        Solicitud solicitud = entrevista.getSolicitud();
        Map<String, Object> evento = new LinkedHashMap<>();
        evento.put("summary", "Entrevista psicolaboral: " + solicitud.getCandidato().getNombre());
        evento.put("description", "Cargo: " + solicitud.getCargo()
                + "\nFamilia de cargo: " + solicitud.getFamiliaCargo()
                + "\nSolicitud: " + config.getFrontendUrl() + "/solicitudes/" + solicitud.getId()
                + "\n\nEvento creado desde el sistema de evaluaciones psicolaborales de AquaChile.");
        if (entrevista.getUbicacion() != null) {
            evento.put("location", entrevista.getUbicacion());
        }
        evento.put("start", Map.of("dateTime", entrevista.getInicio().toString()));
        evento.put("end", Map.of("dateTime", entrevista.getFin().toString()));
        return evento;
    }

    private void exigirHabilitado() {
        if (!config.isListo()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Google Calendar no esta configurado en el servidor");
        }
    }

    private String destino(String resultado) {
        return config.getFrontendUrl() + "/calendario?google=" + resultado;
    }
}
