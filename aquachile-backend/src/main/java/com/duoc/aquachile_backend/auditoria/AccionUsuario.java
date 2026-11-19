package com.duoc.aquachile_backend.auditoria;

import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.solicitud.Solicitud;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Una accion hecha por un usuario. Solo se agregan registros: nunca se editan ni se borran. */
@Entity
@Table(name = "acciones_usuario")
@Getter
@Setter
@NoArgsConstructor
public class AccionUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoAccion tipo;

    /** Texto de la accion escrito al momento de hacerla, con los nombres de ese momento. */
    @Column(nullable = false, length = 500)
    private String descripcion;

    /** Motivo de una pausa o cancelacion. */
    @Column(length = 500)
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id")
    private Solicitud solicitud;

    @Column(nullable = false)
    private Instant fecha = Instant.now();
}
