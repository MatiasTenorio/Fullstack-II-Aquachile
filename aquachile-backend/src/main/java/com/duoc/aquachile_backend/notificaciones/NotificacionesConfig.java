package com.duoc.aquachile_backend.notificaciones;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Permite enviar los correos en segundo plano (@Async), sin hacer esperar a quien crea la solicitud. */
@Configuration
@EnableAsync
public class NotificacionesConfig {
}
