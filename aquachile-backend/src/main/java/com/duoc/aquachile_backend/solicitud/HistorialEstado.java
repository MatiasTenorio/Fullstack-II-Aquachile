package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un registro de la bitacora de una solicitud: quien hizo el cambio, cuando y por que. */
@Entity
@Table(name = "historial_estados")
@Getter
@Setter
@NoArgsConstructor
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Vacio en el registro de creacion de la solicitud. */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoSolicitud estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private EstadoSolicitud estadoNuevo;

    /** Motivo que escribio el usuario (pausa, cancelacion) o descripcion automatica del cambio. */
    @Column(length = 500)
    private String comentario;

    @Column(nullable = false)
    private Instant fecha = Instant.now();
}
