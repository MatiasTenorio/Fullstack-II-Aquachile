package com.duoc.aquasample.ui.solicitud

import android.net.Uri

enum class EstadoSolicitud(val etiqueta: String) {
    PENDIENTE("Pendiente"),
    EN_PROCESO("En Proceso"),
    COMPLETO("Completo");

    // Pendiente -> En Proceso -> Completo -> Pendiente
    fun siguiente(): EstadoSolicitud =
        entries[(ordinal + 1) % entries.size]
}

data class Solicitud(
    val id: Int,
    val nombre: String,
    val correo: String,
    val cargo: String,
    val familiaCargo: String,
    val estado: EstadoSolicitud,
    val cvUri: Uri? = null,
    val cvNombre: String = "cv.pdf"
) {
    val iniciales: String
        get() = nombre.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
}