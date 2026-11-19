package com.duoc.aquachile_backend.auth.service;

import com.duoc.aquachile_backend.auditoria.RegistroAcciones;
import com.duoc.aquachile_backend.auditoria.TipoAccion;
import com.duoc.aquachile_backend.auditoria.AccionUsuarioRepository;
import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.auth.dto.UsuarioActualizarRequest;
import com.duoc.aquachile_backend.auth.dto.UsuarioAdminResponse;
import com.duoc.aquachile_backend.auth.dto.UsuarioCrearRequest;
import com.duoc.aquachile_backend.auth.dto.UsuarioResponse;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Gestion de cuentas: la usa el administrador, y el analista para elegir evaluador. */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RegistroAcciones registro;
    private final AccionUsuarioRepository accionRepository;

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listar() {
        var ultimaActividad = accionRepository.ultimaAccionPorUsuarioMapa();
        return usuarioRepository.findAll(Sort.by("nombre")).stream()
                .map(u -> UsuarioAdminResponse.from(u, ultimaActividad.get(u.getId())))
                .toList();
    }

    /** Evaluadores activos, para el selector de responsable al crear una solicitud. */
    @Transactional(readOnly = true)
    public List<UsuarioResponse> evaluadores() {
        return usuarioRepository.findByRolAndActivoTrueOrderByNombreAsc(Rol.PROFESIONAL_EVALUADOR).stream()
                .map(UsuarioResponse::from)
                .toList();
    }

    @Transactional
    public UsuarioAdminResponse crear(UsuarioCrearRequest request, UsuarioActual actual) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(email);
        usuario.setRol(request.rol());
        // La cuenta nace con una clave aleatoria que nadie conoce: el usuario define la suya
        // con el flujo de restablecer contrasena por codigo OTP.
        usuario.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        Usuario guardado = usuarioRepository.save(usuario);
        registro.registrar(actual, TipoAccion.USUARIO_CREADO, "Creó la cuenta de " + guardado.getNombre()
                + " (" + guardado.getEmail() + ") con el rol " + guardado.getRol().getEtiqueta());
        return UsuarioAdminResponse.from(guardado);
    }

    @Transactional
    public UsuarioAdminResponse actualizar(Long id, UsuarioActualizarRequest request, UsuarioActual actual) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        // Evita que el administrador se quite el rol o se desactive y el sistema quede sin administrador
        if (usuario.getId().equals(actual.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes cambiar tu propio rol ni desactivarte");
        }
        String cuenta = usuario.getNombre() + " (" + usuario.getEmail() + ")";
        if (request.rol() != null && request.rol() != usuario.getRol()) {
            registro.registrar(actual, TipoAccion.ROL_CAMBIADO, "Cambió el rol de " + cuenta + " de "
                    + usuario.getRol().getEtiqueta() + " a " + request.rol().getEtiqueta());
            usuario.setRol(request.rol());
        }
        if (request.activo() != null && request.activo() != usuario.isActivo()) {
            registro.registrar(actual,
                    request.activo() ? TipoAccion.USUARIO_ACTIVADO : TipoAccion.USUARIO_DESACTIVADO,
                    (request.activo() ? "Activó la cuenta de " : "Desactivó la cuenta de ") + cuenta);
            usuario.setActivo(request.activo());
        }
        return UsuarioAdminResponse.from(usuario);
    }
}
