package com.duoc.aquachile_backend.drive;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Validaciones comunes de los archivos que suben los usuarios. */
public final class ArchivoUtil {

    public static final long MAX_BYTES = 5L * 1024 * 1024;

    private ArchivoUtil() {
    }

    /** Valida el archivo recibido y devuelve su extension en minusculas. */
    public static String validar(MultipartFile archivo, Set<String> extensionesPermitidas) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes adjuntar un archivo");
        }
        if (archivo.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "El archivo supera los 5 MB");
        }
        String extension = extension(archivo.getOriginalFilename());
        if (!extensionesPermitidas.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato no permitido. Formatos aceptados: " + String.join(", ", extensionesPermitidas));
        }
        return extension;
    }

    /** Lee el contenido y comprueba que los primeros bytes correspondan al formato declarado. */
    public static byte[] leer(MultipartFile archivo, String extension) {
        byte[] bytes;
        try {
            bytes = archivo.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo");
        }
        boolean coincide = switch (extension) {
            case "pdf" -> empiezaCon(bytes, 0x25, 0x50, 0x44, 0x46);            // %PDF
            case "docx" -> empiezaCon(bytes, 0x50, 0x4B);                        // PK (zip)
            case "doc" -> empiezaCon(bytes, 0xD0, 0xCF, 0x11, 0xE0);             // formato OLE
            default -> false;
        };
        if (!coincide) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El contenido del archivo no corresponde a un .%s valido".formatted(extension));
        }
        return bytes;
    }

    public static String extension(String nombre) {
        if (nombre == null || !nombre.contains(".")) {
            return "";
        }
        return nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    public static String contentType(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    private static boolean empiezaCon(byte[] bytes, int... firma) {
        if (bytes.length < firma.length) {
            return false;
        }
        for (int i = 0; i < firma.length; i++) {
            if ((bytes[i] & 0xFF) != firma[i]) {
                return false;
            }
        }
        return true;
    }
}
