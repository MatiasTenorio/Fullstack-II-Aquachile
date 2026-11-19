package com.duoc.aquachile_backend.googlecalendar;

/** Google ya no acepta el permiso guardado (el usuario lo quito o vencio): hay que conectar la cuenta otra vez. */
public class GoogleAutorizacionRevocadaException extends RuntimeException {

    public GoogleAutorizacionRevocadaException(String mensaje) {
        super(mensaje);
    }
}
