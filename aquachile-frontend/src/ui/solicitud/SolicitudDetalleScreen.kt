package com.duoc.aquasample.ui.solicitud

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

private val AzulOscuro = Color(0xFF1B2F4B)
private val AzulTopBar = Color(0xFF3D5A73)
private val AzulHeader = Color(0xFF8FB0C7)
private val GrisBoton = Color(0xFF3F566B)

private fun colorEstado(e: EstadoSolicitud) = when (e) {
    EstadoSolicitud.PENDIENTE -> Color(0xFFFF5A5F)
    EstadoSolicitud.EN_PROCESO -> Color(0xFFF5A623)
    EstadoSolicitud.COMPLETO -> Color(0xFF3DB06B)
}

@Composable
fun SolicitudDetalleScreen(
    onVolver: () -> Unit,
    viewModel: SolicitudDetalleViewModel = viewModel()
) {
    val solicitud by viewModel.solicitud.collectAsState()
    val context = LocalContext.current

    Column(Modifier.fillMaxSize().background(Color.White)) {

        // Barra superior
        Row(
            Modifier.fillMaxWidth().background(AzulTopBar).padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("AquaChile", color = Color.White, fontWeight = FontWeight.Bold) // reemplaza por tu logo
            Spacer(Modifier.weight(1f))
            Text("Administrador", color = Color.White, fontSize = 13.sp)
        }

        Column(Modifier.padding(16.dp)) {
            Text("Detalles de solicitud", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AzulOscuro)
            Text(
                "Revisa los detalles de la solicitud seleccionada",
                fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = AzulTopBar
            )
        }

        BoxWithConstraints(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
            val ancho = maxWidth >= 600.dp

            val panelSolicitud: @Composable (Modifier) -> Unit = { mod ->
                Panel(titulo = "Solicitud", modifier = mod, onVolver = onVolver) {
                    Column(Modifier.fillMaxSize().padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(52.dp).background(AzulOscuro, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(solicitud.iniciales, color = Color.White, fontWeight = FontWeight.Medium)
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(solicitud.nombre, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(solicitud.correo, fontSize = 12.sp)
                            }
                        }
                        Spacer(Modifier.height(28.dp))
                        Text(solicitud.cargo, Modifier.padding(start = 64.dp), fontSize = 14.sp)
                        Spacer(Modifier.height(36.dp))
                        Text(solicitud.familiaCargo, Modifier.padding(start = 64.dp), fontSize = 14.sp)

                        Spacer(Modifier.weight(1f))

                        Row(
                            Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Chip de estado
                            Box(
                                Modifier
                                    .background(colorEstado(solicitud.estado), RoundedCornerShape(4.dp))
                                    .border(BorderStroke(1.dp, AzulOscuro), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(solicitud.estado.etiqueta, color = Color.White, fontSize = 12.sp)
                            }
                            Button(
                                onClick = { viewModel.actualizarEstado() },
                                colors = ButtonDefaults.buttonColors(containerColor = AzulOscuro),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) { Text("Actualizar Estado", fontSize = 12.sp) }
                            Button(
                                onClick = { descargarCv(context, solicitud.cvUri, solicitud.cvNombre) },
                                colors = ButtonDefaults.buttonColors(containerColor = GrisBoton),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) { Text("Descargar CV", fontSize = 12.sp) }
                        }
                    }
                }
            }

            val panelCv: @Composable (Modifier) -> Unit = { mod ->
                Panel(titulo = "Previsualización del CV", modifier = mod) {
                    CvPreview(solicitud.cvUri)
                }
            }

            if (ancho) {
                Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    panelSolicitud(Modifier.weight(1f).fillMaxHeight())
                    panelCv(Modifier.weight(1f).fillMaxHeight())
                }
            } else {
                Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    panelSolicitud(Modifier.weight(1f).fillMaxWidth())
                    panelCv(Modifier.weight(1f).fillMaxWidth())
                }
            }
        }
    }
}

@Composable
private fun Panel(
    titulo: String,
    modifier: Modifier = Modifier,
    onVolver: (() -> Unit)? = null,
    contenido: @Composable () -> Unit
) {
    Column(modifier.border(1.dp, AzulTopBar)) {
        Box(
            Modifier.fillMaxWidth().background(AzulHeader).height(36.dp),
            contentAlignment = Alignment.Center
        ) {
            if (onVolver != null) {
                TextButton(
                    onClick = onVolver,
                    modifier = Modifier.align(Alignment.CenterStart),
                    colors = ButtonDefaults.textButtonColors(containerColor = AzulTopBar, contentColor = Color.White),
                    shape = RoundedCornerShape(0.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp)
                ) { Text("◀ Volver", fontSize = 11.sp) }
            }
            Text(titulo, fontWeight = FontWeight.Bold, color = AzulOscuro)
        }
        Box(Modifier.weight(1f).fillMaxWidth()) { contenido() }
    }
}