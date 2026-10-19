package com.duoc.aquasample.ui.solicitud

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class SolicitudDetalleViewModel : ViewModel() {

    // Datos de prueba (luego los reemplazas por tu fuente real)
    private val _solicitud = MutableStateFlow(
        Solicitud(
            id = 1,
            nombre = "Pedro Guillermo Alfarinez Ojeda",
            correo = "ped.guillermo@gmail.com",
            cargo = "Cargo A",
            familiaCargo = "Familia de Cargo A",
            estado = EstadoSolicitud.PENDIENTE
        )
    )
    val solicitud: StateFlow<Solicitud> = _solicitud.asStateFlow()

    fun actualizarEstado() {
        _solicitud.update { it.copy(estado = it.estado.siguiente()) }
    }

    fun setCv(uri: android.net.Uri, nombre: String) {
        _solicitud.update { it.copy(cvUri = uri, cvNombre = nombre) }
    }
}