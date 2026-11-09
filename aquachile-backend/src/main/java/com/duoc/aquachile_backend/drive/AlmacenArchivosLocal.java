package com.duoc.aquachile_backend.drive;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Guarda los archivos en una carpeta del disco. Se usa mientras Google Drive no este habilitado
 * (app.drive.enabled=false), para que el flujo completo funcione sin credenciales.
 * Los ids son UUID generados aqui, nunca nombres que vengan del usuario.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.drive.enabled", havingValue = "false", matchIfMissing = true)
public class AlmacenArchivosLocal implements AlmacenArchivos {

    private static final Pattern ID_ARCHIVO = Pattern.compile("[0-9a-f-]{36}/[0-9a-f-]{36}");

    private final Path base;

    public AlmacenArchivosLocal(@Value("${app.storage.local-path}") String ruta) throws IOException {
        this.base = Path.of(ruta).toAbsolutePath().normalize();
        Files.createDirectories(base);
        log.info("Almacenamiento local de archivos en {}", base);
    }

    @Override
    public String crearCarpeta(String nombre) {
        try {
            String id = UUID.randomUUID().toString();
            Files.createDirectories(base.resolve(id));
            return id;
        } catch (IOException e) {
            throw fallo("crear la carpeta", e);
        }
    }

    @Override
    public String subir(String carpetaId, String nombreArchivo, String contentType, byte[] contenido) {
        try {
            Path carpeta = base.resolve(carpetaId).normalize();
            if (!carpeta.startsWith(base) || !Files.isDirectory(carpeta)) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Carpeta de archivos invalida");
            }
            String id = carpetaId + "/" + UUID.randomUUID();
            Files.write(base.resolve(id), contenido);
            return id;
        } catch (IOException e) {
            throw fallo("guardar el archivo", e);
        }
    }

    @Override
    public byte[] descargar(String archivoId) {
        try {
            return Files.readAllBytes(resolver(archivoId));
        } catch (IOException e) {
            throw fallo("leer el archivo", e);
        }
    }

    @Override
    public void eliminar(String archivoId) {
        try {
            Files.deleteIfExists(resolver(archivoId));
        } catch (IOException | RuntimeException e) {
            log.warn("No se pudo borrar el archivo {}: {}", archivoId, e.getMessage());
        }
    }

    private Path resolver(String archivoId) {
        if (archivoId == null || !ID_ARCHIVO.matcher(archivoId).matches()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Id de archivo invalido");
        }
        Path ruta = base.resolve(archivoId).normalize();
        if (!ruta.startsWith(base)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Id de archivo invalido");
        }
        return ruta;
    }

    private ResponseStatusException fallo(String accion, IOException e) {
        log.error("Error de almacenamiento local al {}", accion, e);
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo " + accion);
    }
}
