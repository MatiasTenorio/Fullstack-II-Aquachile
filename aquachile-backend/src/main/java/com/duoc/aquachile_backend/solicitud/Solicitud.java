package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.candidatos.Candidato;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "solicitudes")
@Getter
@Setter
@NoArgsConstructor
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private Candidato candidato;

    /** Texto libre, decision del equipo para simplificar el MVP. */
    @Column(nullable = false, length = 160)
    private String cargo;

    @Column(name = "familia_cargo", nullable = false, length = 60)
    private String familiaCargo;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDate fechaSolicitud = LocalDate.now();

    /** Momento exacto del envio; las solicitudes anteriores a la migracion V7 lo tienen vacio. */
    @Column(name = "creada_en")
    private Instant creadaEn = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private Usuario responsable;

    /** Id en Google Drive del CV del candidato para esta solicitud. */
    @Column(name = "cv_drive_file_id")
    private String cvDriveFileId;

    @Column(name = "cv_nombre_archivo", length = 160)
    private String cvNombreArchivo;

    /** Id del informe del psicologo (PDF, DOC o DOCX); es obligatorio para completar la solicitud. */
    @Column(name = "informe_drive_file_id")
    private String informeDriveFileId;

    /** Nombre del archivo tal como lo subio quien cargo el informe. */
    @Column(name = "informe_nombre_archivo", length = 160)
    private String informeNombreArchivo;
}
