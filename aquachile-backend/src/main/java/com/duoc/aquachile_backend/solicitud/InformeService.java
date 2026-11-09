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
public class InformeService {

    private static final Set<String> FORMATOS_INFORME = Set.of("pdf", "doc", "docx");
    private static final int MAX_NOMBRE = 160;

    private final SolicitudService solicitudService;
    private final CarpetaCandidatoService carpetaCandidatoService;
    private final AlmacenArchivos almacen;

    /**
     * Sube el informe del psicologo (PDF, DOC o DOCX) a la carpeta del candidato; si ya habia uno, lo reemplaza.
     * El informe es la condicion para poder completar la solicitud.
     */
    @Transactional
    public SolicitudResponse subir(Long solicitudId, MultipartFile archivo, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        if (solicitud.getEstado() == EstadoSolicitud.FINALIZADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La solicitud ya esta finalizada");
        }

        String extension = ArchivoUtil.validar(archivo, FORMATOS_INFORME);
        byte[] contenido = ArchivoUtil.leer(archivo, extension);
        String carpetaId = carpetaCandidatoService.asegurar(solicitud.getCandidato());

        String nombre = nombreSeguro(archivo.getOriginalFilename(), extension, solicitud.getId());
        String anterior = solicitud.getInformeDriveFileId();
        String nuevoId = almacen.subir(carpetaId, nombre, ArchivoUtil.contentType(extension), contenido);
        solicitud.setInformeDriveFileId(nuevoId);
        solicitud.setInformeNombreArchivo(nombre);
        if (anterior != null) {
            almacen.eliminar(anterior);
        }
        return solicitudService.aResponse(solicitud);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado descargar(Long solicitudId, UsuarioActual actual) {
        Solicitud solicitud = solicitudService.buscarEntidad(solicitudId);
        solicitudService.verificarAcceso(solicitud, actual);
        if (solicitud.getInformeDriveFileId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La solicitud no tiene informe adjunto");
        }
        return new ArchivoDescargado(solicitud.getInformeNombreArchivo(),
                almacen.descargar(solicitud.getInformeDriveFileId()));
    }

    /** Conserva el nombre que puso quien subio el archivo, quitando rutas y caracteres no validos. */
    private String nombreSeguro(String original, String extension, Long solicitudId) {
        String nombre = original == null ? "" : original.replace('\\', '/');
        nombre = nombre.substring(nombre.lastIndexOf('/') + 1);
        nombre = nombre.replaceAll("[\\p{Cntrl}\"<>:*?|]", "").trim();
        if (nombre.length() > MAX_NOMBRE) {
            String sufijo = "." + extension;
            nombre = nombre.substring(0, MAX_NOMBRE - sufijo.length()) + sufijo;
        }
        return nombre.isBlank() ? "Informe-solicitud-" + solicitudId + "." + extension : nombre;
    }
}
