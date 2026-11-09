package com.duoc.aquachile_backend.drive;

import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

public record ArchivoDescargado(String nombre, byte[] contenido) {

    public ResponseEntity<byte[]> comoRespuesta() {
        String tipo = ArchivoUtil.contentType(ArchivoUtil.extension(nombre));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(tipo))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nombre, StandardCharsets.UTF_8).build().toString())
                .body(contenido);
    }
}
