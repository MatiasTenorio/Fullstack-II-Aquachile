package com.duoc.aquachile_backend.correo;

/**
 * Envio de correos. Hay dos implementaciones y se elige con app.mail.enabled:
 * CorreoSmtp (true) envia por SMTP; CorreoConsola (false, por defecto) solo lo escribe en el log.
 */
public interface EnviadorCorreo {

    /** Lanza una excepcion si el correo no se pudo enviar. */
    void enviar(String destinatario, String asunto, String texto);
}
