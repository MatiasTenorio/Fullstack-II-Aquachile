package com.duoc.aquachile_backend.auth.otp;

import com.duoc.aquachile_backend.auth.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Codigo de un solo uso enviado por correo. Se guarda solo su hash. */
@Entity
@Table(name = "codigos_otp")
@Getter
@Setter
@NoArgsConstructor
public class CodigoOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Quien recibe el codigo y debe ingresarlo. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PropositoOtp proposito;

    /** Cuenta a la que se le cambiara la contrasena (solo en CAMBIO_POR_ADMIN). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_objetivo_id")
    private Usuario usuarioObjetivo;

    @Column(name = "codigo_hash", nullable = false)
    private String codigoHash;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    /** Veces que se ingreso un codigo equivocado. */
    @Column(nullable = false)
    private int intentos;

    /** Un codigo queda usado al acertarlo, al pedir uno nuevo o al agotar los intentos. */
    @Column(nullable = false)
    private boolean usado;
}
