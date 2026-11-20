package com.duoc.aquachile_backend.notificaciones;

import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.solicitud.Solicitud;

/**
 * Copia de los datos que necesitan los correos, tomada al momento de crear o asignar la solicitud.
 * El correo se envia despues, en otro hilo y fuera de la transaccion, asi que no puede leer las entidades.
 */
public record DatosSolicitudCorreo(
        Long solicitudId,
        String candidatoNombre,
        String cargo,
        String familiaCargo,
        String analistaNombre,
        String analistaEmail,
        String evaluadorNombre,
        String evaluadorEmail) {

    public static DatosSolicitudCorreo de(Solicitud solicitud) {
        Usuario analista = solicitud.getAnalista();
        Usuario evaluador = solicitud.getResponsable();
        return new DatosSolicitudCorreo(
                solicitud.getId(),
                solicitud.getCandidato().getNombre(),
                solicitud.getCargo(),
                solicitud.getFamiliaCargo(),
                analista != null ? analista.getNombre() : null,
                analista != null ? analista.getEmail() : null,
                evaluador != null ? evaluador.getNombre() : null,
                evaluador != null ? evaluador.getEmail() : null);
    }
}
