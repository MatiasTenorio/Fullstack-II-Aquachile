package com.duoc.aquachile_backend.notificaciones;

/** Se publica cuando el analista cambia el evaluador de una solicitud: avisa al evaluador nuevo. */
public record EvaluadorReasignadoEvento(DatosSolicitudCorreo datos, String reasignadaPor) {
}
