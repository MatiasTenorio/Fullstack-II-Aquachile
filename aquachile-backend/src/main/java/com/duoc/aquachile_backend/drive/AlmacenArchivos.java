package com.duoc.aquachile_backend.drive;

/** Donde se guardan los archivos de los candidatos. Hoy la unica implementacion real es Google Drive. */
public interface AlmacenArchivos {

    /** Crea una carpeta dentro de la carpeta raiz de la aplicacion y devuelve su id. */
    String crearCarpeta(String nombre);

    /** Sube un archivo a una carpeta y devuelve el id del archivo. */
    String subir(String carpetaId, String nombreArchivo, String contentType, byte[] contenido);

    byte[] descargar(String archivoId);

    /** Borra un archivo; si falla, no interrumpe la operacion principal. */
    void eliminar(String archivoId);
}
