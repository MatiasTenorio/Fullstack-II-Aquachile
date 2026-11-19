package com.duoc.aquachile_backend.correo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Envio real por SMTP (app.mail.enabled=true). Los datos del servidor y de la cuenta
 * son las propiedades spring.mail.* de application.properties (Gmail por defecto).
 */
@Component
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class CorreoSmtp implements EnviadorCorreo {

    private final JavaMailSender mailSender;
    private final String remitente;

    public CorreoSmtp(JavaMailSender mailSender, @Value("${app.mail.from}") String remitente) {
        if (remitente == null || remitente.isBlank()) {
            throw new IllegalStateException(
                    "app.mail.enabled=true pero falta la cuenta de correo: define MAIL_USERNAME y MAIL_PASSWORD");
        }
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    @Override
    public void enviar(String destinatario, String asunto, String texto) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(texto);
        mailSender.send(mensaje);
    }
}
