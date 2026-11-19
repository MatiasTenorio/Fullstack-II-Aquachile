package com.duoc.aquachile_backend.solicitud;

/**
 * Flujo normal: PENDIENTE -> EN_PROCESO (al agendar la entrevista) -> FINALIZADO (con el informe subido).
 * Fuera de ese flujo, una solicitud pendiente o en proceso se puede pausar (EN_PAUSA, y luego reanudar
 * al estado que tenia) o cancelar (CANCELADO, sin vuelta atras).
 */
public enum EstadoSolicitud {
    PENDIENTE,
    EN_PROCESO,
    EN_PAUSA,
    CANCELADO,
    FINALIZADO;

    /** Una solicitud finalizada o cancelada ya no admite cambios. */
    public boolean esTerminal() {
        return this == FINALIZADO || this == CANCELADO;
    }
}
