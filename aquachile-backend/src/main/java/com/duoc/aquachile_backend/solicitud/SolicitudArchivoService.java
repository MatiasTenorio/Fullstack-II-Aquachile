package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.drive.AlmacenArchivos;
import com.duoc.aquachile_backend.drive.ArchivoDescargado;
import com.duoc.aquachile_backend.drive.ArchivoUtil;
import com.duoc.aquachile_backend.drive.CarpetaCandidatoService;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SolicitudArchivoService {

    private static final Set<String> FORMATOS_CV = Set.of("pdf", "doc", "docx");

    private final SolicitudService solicitudService;
    private final CarpetaCandidatoService carpetaCandidatoService;
    private final AlmacenArchivos almacen;

    /** Sube el CV a la carpeta del candidato; si ya habia uno, lo reemplaza. */
    @Transactional
    public SolicitudResponse subirCv(Long solicitudId, MultipartFile archivo) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        String extension = ArchivoUtil.validar(archivo, FORMATOS_CV);
        byte[] contenido = ArchivoUtil.leer(archivo, extension);

        String carpetaId = carpetaCandidatoService.asegurar(solicitud.getCandidato());
        String nombre = "CV-solicitud-" + solicitud.getId() + "." + extension;
        String anterior = solicitud.getCvDriveFileId();

        String nuevoId = almacen.subir(carpetaId, nombre, ArchivoUtil.contentType(extension), contenido);
        solicitud.setCvDriveFileId(nuevoId);
        solicitud.setCvNombreArchivo(nombre);
        if (anterior != null) {
            almacen.eliminar(anterior);
        }
        return solicitudService.aResponse(solicitud);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado descargarCv(Long solicitudId, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        if (solicitud.getCvDriveFileId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La solicitud no tiene CV adjunto");
        }
        return new ArchivoDescargado(solicitud.getCvNombreArchivo(), almacen.descargar(solicitud.getCvDriveFileId()));
    }
}
