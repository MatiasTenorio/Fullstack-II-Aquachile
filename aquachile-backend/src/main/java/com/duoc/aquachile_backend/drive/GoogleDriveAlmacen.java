package com.duoc.aquachile_backend.drive;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Google Drive con OAuth de usuario y scope drive.file: la aplicacion solo ve los archivos
 * y carpetas que ella misma crea, nunca el resto del Drive.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.drive.enabled", havingValue = "true")
public class GoogleDriveAlmacen implements AlmacenArchivos {

    private static final String CARPETA = "application/vnd.google-apps.folder";

    private final Drive drive;
    private final String nombreCarpetaRaiz;
    private String carpetaRaizId;

    public GoogleDriveAlmacen(@Value("${app.drive.client-id}") String clientId,
                              @Value("${app.drive.client-secret}") String clientSecret,
                              @Value("${app.drive.refresh-token}") String refreshToken,
                              @Value("${app.drive.root-folder-name}") String nombreCarpetaRaiz)
            throws GeneralSecurityException, IOException {
        if (clientId.isBlank() || clientSecret.isBlank() || refreshToken.isBlank()) {
            throw new IllegalStateException(
                    "app.drive.enabled es true pero faltan app.drive.client-id, client-secret o refresh-token");
        }
        UserCredentials credenciales = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();
        this.drive = new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credenciales))
                .setApplicationName("aquachile-backend")
                .build();
        this.nombreCarpetaRaiz = nombreCarpetaRaiz;
    }

    @Override
    public String crearCarpeta(String nombre) {
        try {
            File carpeta = new File()
                    .setName(nombre)
                    .setMimeType(CARPETA)
                    .setParents(List.of(carpetaRaiz()));
            return drive.files().create(carpeta).setFields("id").execute().getId();
        } catch (IOException e) {
            throw fallo("crear la carpeta", e);
        }
    }

    @Override
    public String subir(String carpetaId, String nombreArchivo, String contentType, byte[] contenido) {
        try {
            InputStreamContent media = new InputStreamContent(contentType, new ByteArrayInputStream(contenido));
            media.setLength(contenido.length);
            File metadatos = new File().setName(nombreArchivo).setParents(List.of(carpetaId));
            return drive.files().create(metadatos, media).setFields("id").execute().getId();
        } catch (IOException e) {
            throw fallo("subir el archivo", e);
        }
    }

    @Override
    public byte[] descargar(String archivoId) {
        try {
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            drive.files().get(archivoId).executeMediaAndDownloadTo(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw fallo("descargar el archivo", e);
        }
    }

    @Override
    public void eliminar(String archivoId) {
        try {
            drive.files().delete(archivoId).execute();
        } catch (IOException e) {
            log.warn("No se pudo borrar el archivo {} de Drive: {}", archivoId, e.getMessage());
        }
    }

    /** Busca la carpeta raiz de la aplicacion y la crea la primera vez. */
    private synchronized String carpetaRaiz() throws IOException {
        if (carpetaRaizId == null) {
            String consulta = "mimeType='" + CARPETA + "' and name='" + nombreCarpetaRaiz.replace("'", "\\'")
                    + "' and 'root' in parents and trashed=false";
            List<File> existentes = drive.files().list()
                    .setQ(consulta)
                    .setSpaces("drive")
                    .setFields("files(id)")
                    .setPageSize(1)
                    .execute()
                    .getFiles();
            if (existentes != null && !existentes.isEmpty()) {
                carpetaRaizId = existentes.get(0).getId();
            } else {
                File raiz = new File().setName(nombreCarpetaRaiz).setMimeType(CARPETA);
                carpetaRaizId = drive.files().create(raiz).setFields("id").execute().getId();
            }
        }
        return carpetaRaizId;
    }

    private ResponseStatusException fallo(String accion, IOException e) {
        log.error("Error de Google Drive al {}", accion, e);
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo " + accion + " en Google Drive");
    }
}
