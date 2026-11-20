package com.duoc.aquachile_backend.notificaciones;

import com.duoc.aquachile_backend.correo.EnviadorCorreo;
import java.util.Locale;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Correos que avisan de una solicitud nueva o asignada.
 * Se envian solo cuando la solicitud ya quedo guardada (AFTER_COMMIT) y en segundo plano (@Async):
 * si el correo falla o tarda, la solicitud se crea igual y el error queda en la consola del backend.
 */
@Slf4j
@Component
public class NotificacionesSolicitud {

    /**
     * Dominios reservados que nunca reciben correo (RFC 2606), como los usuarios de prueba @aquachile.test.
     * Con el envio real activado se omiten, para que Gmail no devuelva correos rebotados a la cuenta remitente.
     */
    private static final Set<String> DOMINIOS_RESERVADOS = Set.of("test", "example", "invalid", "localhost");

    private final EnviadorCorreo correo;
    private final boolean envioReal;
    private final String frontendUrl;

    public NotificacionesSolicitud(EnviadorCorreo correo,
                                   @Value("${app.mail.enabled:false}") boolean envioReal,
                                   @Value("${app.frontend-url}") String frontendUrl) {
        this.correo = correo;
        this.envioReal = envioReal;
        this.frontendUrl = frontendUrl;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void solicitudCreada(SolicitudCreadaEvento evento) {
        DatosSolicitudCorreo d = evento.datos();
        enviar(d.analistaEmail(), "Solicitud #" + d.solicitudId() + " creada - AquaChile", """
                Hola %s:

                Creaste la solicitud de evaluación psicolaboral #%d.

                Candidato: %s
                Cargo: %s (%s)
                Evaluador responsable: %s

                Puedes seguir su avance aquí: %s

                Este es un aviso automático del sistema de evaluaciones psicolaborales de AquaChile.
                """.formatted(d.analistaNombre(), d.solicitudId(), d.candidatoNombre(), d.cargo(), d.familiaCargo(),
                d.evaluadorNombre(), enlace(d)));
        avisarEvaluador(d, "Creada por: " + d.analistaNombre());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void evaluadorReasignado(EvaluadorReasignadoEvento evento) {
        avisarEvaluador(evento.datos(), "Te la asignó: " + evento.reasignadaPor());
    }

    private void avisarEvaluador(DatosSolicitudCorreo d, String origen) {
        enviar(d.evaluadorEmail(), "Se te asignó la solicitud #" + d.solicitudId() + " - AquaChile", """
                Hola %s:

                Se te asignó la solicitud de evaluación psicolaboral #%d.

                Candidato: %s
                Cargo: %s (%s)
                %s

                El siguiente paso es agendar la entrevista con el candidato: %s

                Este es un aviso automático del sistema de evaluaciones psicolaborales de AquaChile.
                """.formatted(d.evaluadorNombre(), d.solicitudId(), d.candidatoNombre(), d.cargo(), d.familiaCargo(),
                origen, enlace(d)));
    }

    private void enviar(String destinatario, String asunto, String texto) {
        if (destinatario == null || destinatario.isBlank()) {
            return;
        }
        if (envioReal && esDominioReservado(destinatario)) {
            log.info("No se envía el aviso a {}: es una dirección de prueba que no puede recibir correos", destinatario);
            return;
        }
        try {
            correo.enviar(destinatario, asunto, texto);
        } catch (RuntimeException e) {
            log.error("No se pudo enviar el aviso \"{}\" a {}: {}", asunto, destinatario, e.getMessage());
        }
    }

    private String enlace(DatosSolicitudCorreo d) {
        return frontendUrl + "/solicitudes/" + d.solicitudId();
    }

    static boolean esDominioReservado(String email) {
        String dominio = email.substring(email.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);
        String tld = dominio.substring(dominio.lastIndexOf('.') + 1);
        return DOMINIOS_RESERVADOS.contains(tld) || "localhost".equals(dominio);
    }
}
