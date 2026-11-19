package com.duoc.aquachile_backend.googlecalendar;

import com.duoc.aquachile_backend.auth.Usuario;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Cuenta de Google que un usuario conecto para copiar sus entrevistas a Google Calendar. */
@Entity
@Table(name = "google_conexiones")
@Getter
@Setter
@NoArgsConstructor
public class GoogleConexion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "google_email")
    private String googleEmail;

    /** Refresh token de Google cifrado (ver CifradorTokens). */
    @Column(name = "refresh_token_cifrado", nullable = false, columnDefinition = "TEXT")
    private String refreshTokenCifrado;

    @Column(name = "conectado_en", nullable = false)
    private Instant conectadoEn;
}
