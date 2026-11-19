package com.duoc.aquachile_backend.auditoria;

import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.solicitud.Solicitud;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Anota las acciones de los usuarios. Se llama desde cada servicio despues de hacer la accion,
 * dentro de la misma transaccion: si la accion falla y se deshace, su registro tambien.
 */
@Service
@RequiredArgsConstructor
public class RegistroAcciones {

    private static final int MAX_TEXTO = 500;

    private final AccionUsuarioRepository accionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public void registrar(Long usuarioId, TipoAccion tipo, String descripcion, String motivo, Solicitud solicitud) {
        AccionUsuario accion = new AccionUsuario();
        accion.setUsuario(usuarioRepository.getReferenceById(usuarioId));
        accion.setTipo(tipo);
        accion.setDescripcion(recortar(descripcion));
        accion.setMotivo(recortar(motivo));
        accion.setSolicitud(solicitud);
        accionRepository.save(accion);
    }

    public void registrar(UsuarioActual actual, TipoAccion tipo, String descripcion) {
        registrar(actual.id(), tipo, descripcion, null, null);
    }

    public void registrar(UsuarioActual actual, TipoAccion tipo, String descripcion, Solicitud solicitud) {
        registrar(actual.id(), tipo, descripcion, null, solicitud);
    }

    /** Texto corto para nombrar una solicitud en una descripcion: "#12 de Ana Perez". */
    public static String referencia(Solicitud solicitud) {
        return "#" + solicitud.getId() + " de " + solicitud.getCandidato().getNombre();
    }

    private String recortar(String texto) {
        if (texto == null) {
            return null;
        }
        return texto.length() > MAX_TEXTO ? texto.substring(0, MAX_TEXTO) : texto;
    }
}
