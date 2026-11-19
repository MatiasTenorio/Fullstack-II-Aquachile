package com.duoc.aquachile_backend.entrevista;

import com.duoc.aquachile_backend.solicitud.Solicitud;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Entrevista que el evaluador agenda con el candidato de una solicitud. */
@Entity
@Table(name = "entrevistas")
@Getter
@Setter
@NoArgsConstructor
public class Entrevista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @Column(nullable = false)
    private Instant inicio;

    @Column(nullable = false)
    private Instant fin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Modalidad modalidad;

    /** Enlace de la reunion (online) o lugar (presencial). */
    @Column(length = 300)
    private String ubicacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoEntrevista estado = EstadoEntrevista.AGENDADA;

    /** Id del evento en el Google Calendar del evaluador; vacio si no se ha copiado a Google. */
    @Column(name = "google_event_id")
    private String googleEventId;
}
