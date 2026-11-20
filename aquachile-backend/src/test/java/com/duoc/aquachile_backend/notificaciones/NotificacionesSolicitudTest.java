package com.duoc.aquachile_backend.notificaciones;

import static org.assertj.core.api.Assertions.assertThat;

import com.duoc.aquachile_backend.correo.EnviadorCorreo;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Pruebas de los avisos por correo, sin Spring ni base de datos: el envio se reemplaza por una lista. */
class NotificacionesSolicitudTest {

    private record Enviado(String para, String asunto, String texto) {
    }

    private final List<Enviado> enviados = new ArrayList<>();
    private final EnviadorCorreo correoFalso = (para, asunto, texto) -> enviados.add(new Enviado(para, asunto, texto));

    private final DatosSolicitudCorreo datos = new DatosSolicitudCorreo(12L, "Ana Pérez", "Gruero", "Operario Calificado",
            "Analista Uno", "analista@empresa.cl", "Evaluador Dos", "evaluador@empresa.cl");

    private NotificacionesSolicitud notificaciones(boolean envioReal) {
        return new NotificacionesSolicitud(correoFalso, envioReal, "http://localhost:5173");
    }

    @Test
    void alCrearAvisaAlAnalistaYAlEvaluador() {
        notificaciones(true).solicitudCreada(new SolicitudCreadaEvento(datos));

        assertThat(enviados).extracting(Enviado::para).containsExactly("analista@empresa.cl", "evaluador@empresa.cl");
        assertThat(enviados.get(0).asunto()).isEqualTo("Solicitud #12 creada - AquaChile");
        assertThat(enviados.get(0).texto()).contains("Ana Pérez", "Evaluador Dos", "http://localhost:5173/solicitudes/12");
        assertThat(enviados.get(1).asunto()).isEqualTo("Se te asignó la solicitud #12 - AquaChile");
        assertThat(enviados.get(1).texto()).contains("Creada por: Analista Uno", "agendar la entrevista");
    }

    @Test
    void alReasignarAvisaSoloAlEvaluadorNuevo() {
        notificaciones(true).evaluadorReasignado(new EvaluadorReasignadoEvento(datos, "Analista Tres"));

        assertThat(enviados).extracting(Enviado::para).containsExactly("evaluador@empresa.cl");
        assertThat(enviados.get(0).texto()).contains("Te la asignó: Analista Tres");
    }

    @Test
    void conEnvioRealOmiteLasDireccionesDePrueba() {
        DatosSolicitudCorreo dePrueba = new DatosSolicitudCorreo(12L, "Ana Pérez", "Gruero", "Operario Calificado",
                "Analista", "analista@aquachile.test", "Evaluador", "evaluador@empresa.cl");

        notificaciones(true).solicitudCreada(new SolicitudCreadaEvento(dePrueba));

        assertThat(enviados).extracting(Enviado::para).containsExactly("evaluador@empresa.cl");
    }

    @Test
    void enModoDesarrolloTambienMuestraLasDireccionesDePrueba() {
        DatosSolicitudCorreo dePrueba = new DatosSolicitudCorreo(12L, "Ana Pérez", "Gruero", "Operario Calificado",
                "Analista", "analista@aquachile.test", "Evaluador", "evaluador@aquachile.test");

        notificaciones(false).solicitudCreada(new SolicitudCreadaEvento(dePrueba));

        assertThat(enviados).hasSize(2);
    }

    @Test
    void unErrorAlEnviarNoInterrumpeElSegundoAviso() {
        EnviadorCorreo fallaConElAnalista = (para, asunto, texto) -> {
            if (para.startsWith("analista")) {
                throw new IllegalStateException("SMTP no disponible");
            }
            enviados.add(new Enviado(para, asunto, texto));
        };

        new NotificacionesSolicitud(fallaConElAnalista, true, "http://localhost:5173")
                .solicitudCreada(new SolicitudCreadaEvento(datos));

        assertThat(enviados).extracting(Enviado::para).containsExactly("evaluador@empresa.cl");
    }

    @Test
    void reconoceLosDominiosReservados() {
        assertThat(NotificacionesSolicitud.esDominioReservado("admin@aquachile.test")).isTrue();
        assertThat(NotificacionesSolicitud.esDominioReservado("x@ejemplo.TEST")).isTrue();
        assertThat(NotificacionesSolicitud.esDominioReservado("x@algo.example")).isTrue();
        assertThat(NotificacionesSolicitud.esDominioReservado("mtvj2701@gmail.com")).isFalse();
        assertThat(NotificacionesSolicitud.esDominioReservado("mat.tenorio@duocuc.cl")).isFalse();
    }
}
