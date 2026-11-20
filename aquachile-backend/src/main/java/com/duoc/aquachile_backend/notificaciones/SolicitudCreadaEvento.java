package com.duoc.aquachile_backend.notificaciones;

/** Se publica al crear una solicitud: avisa al analista que la creo y al evaluador asignado. */
public record SolicitudCreadaEvento(DatosSolicitudCorreo datos) {
}
