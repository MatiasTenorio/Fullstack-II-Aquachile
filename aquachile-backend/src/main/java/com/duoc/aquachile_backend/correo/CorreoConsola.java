package com.duoc.aquachile_backend.correo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Modo desarrollo (app.mail.enabled=false): no envia nada, escribe el correo en la consola del backend.
 * Permite probar el flujo de codigos sin configurar una cuenta de correo. No usar en un despliegue real.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class CorreoConsola implements EnviadorCorreo {

    @Override
    public void enviar(String destinatario, String asunto, String texto) {
        log.info("\n===== CORREO (modo desarrollo, no se envio) =====\nPara: {}\nAsunto: {}\n\n{}\n=================================================",
                destinatario, asunto, texto);
    }
}
