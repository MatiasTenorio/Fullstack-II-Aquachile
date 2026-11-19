package com.duoc.aquachile_backend.googlecalendar;

/**
 * Estado de la integracion para el usuario que consulta.
 * habilitado: el servidor tiene configurado Google Calendar. conectado: el usuario ya vinculo su cuenta.
 */
public record GoogleCalendarEstadoResponse(boolean habilitado, boolean conectado, String googleEmail) {
}
