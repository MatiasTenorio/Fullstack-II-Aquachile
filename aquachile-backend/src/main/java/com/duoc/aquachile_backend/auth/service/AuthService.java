package com.duoc.aquachile_backend.auth.service;

import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.auth.dto.LoginRequest;
import com.duoc.aquachile_backend.auth.dto.LoginResponse;
import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Duration expiracion;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtEncoder jwtEncoder,
                       @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.expiracion = Duration.ofMinutes(expirationMinutes);
    }

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .filter(Usuario::isActivo)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Mismo mensaje si falla el email o la clave, para no revelar cuales usuarios existen
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("aquachile-backend")
                .issuedAt(ahora)
                .expiresAt(ahora.plus(expiracion))
                .subject(usuario.getEmail())
                .claim("uid", usuario.getId())
                .claim("nombre", usuario.getNombre())
                .claim("roles", List.of(usuario.getRol().name()))
                .build();

        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        return new LoginResponse(token, "Bearer", expiracion.toSeconds(), UsuarioResponse.from(usuario));
    }

    public UsuarioResponse usuarioActual(String email) {
        return usuarioRepository.findByEmail(email)
                .filter(Usuario::isActivo)
                .map(UsuarioResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no disponible"));
    }
}
