package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.solicitud.Solicitud;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "candidatos")
@Getter
@Setter
@NoArgsConstructor
public class Candidato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(length = 160)
    private String correo;

    @Column(length = 30)
    private String telefono;

    /** Id de la carpeta de Google Drive de este candidato (se llena cuando el modulo drive la crea). */
    @Column(name = "drive_folder_id")
    private String driveFolderId;

    @OneToMany(mappedBy = "candidato")
    private List<Solicitud> solicitudes = new ArrayList<>();
}
