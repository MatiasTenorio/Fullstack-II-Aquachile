package com.duoc.aquasample.ui.solicitud

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun CvPreview(uri: Uri?, modifier: Modifier = Modifier) {
    val context = LocalContext.current

    when {
        uri == null -> Mensaje("No hay CV adjunto", modifier)
        context.contentResolver.getType(uri) == "application/pdf" ->
            PdfPreview(uri, modifier)
        else -> WordPreview(uri, context.contentResolver.getType(uri), modifier)
    }
}

@Composable
private fun Mensaje(texto: String, modifier: Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(texto, textAlign = TextAlign.Center)
    }
}

@Composable
private fun PdfPreview(uri: Uri, modifier: Modifier) {
    val context = LocalContext.current
    var paginas by remember(uri) { mutableStateOf<List<Bitmap>>(emptyList()) }
    var cargando by remember(uri) { mutableStateOf(true) }
    var error by remember(uri) { mutableStateOf(false) }

    LaunchedEffect(uri) {
        withContext(Dispatchers.IO) {
            try {
                context.contentResolver.openFileDescriptor(uri, "r")?.use { pfd ->
                    PdfRenderer(pfd).use { renderer ->
                        paginas = (0 until renderer.pageCount).map { i ->
                            renderer.openPage(i).use { page ->
                                val ancho = 1080
                                val alto = (ancho.toFloat() / page.width * page.height).toInt()
                                val bmp = Bitmap.createBitmap(ancho, alto, Bitmap.Config.ARGB_8888)
                                bmp.eraseColor(android.graphics.Color.WHITE)
                                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                                bmp
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                error = true
            }
            cargando = false
        }
    }

    when {
        cargando -> Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        error -> Mensaje("No se pudo mostrar el PDF", modifier)
        else -> LazyColumn(
            modifier = modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(8.dp)
        ) {
            itemsIndexed(paginas) { _, bmp ->
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = "Página del CV",
                    modifier = Modifier.fillMaxWidth(),
                    contentScale = ContentScale.FillWidth
                )
            }
        }
    }
}

@Composable
private fun WordPreview(uri: Uri, mime: String?, modifier: Modifier) {
    val context = LocalContext.current
    Column(
        modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Documento Word", textAlign = TextAlign.Center)
        Text(
            "Este formato no se puede previsualizar dentro de la app.",
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Button(onClick = {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime ?: "*/*")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                context.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "No hay una app para abrir este archivo", Toast.LENGTH_SHORT).show()
            }
        }) { Text("Abrir documento") }
    }
}

// Copia el CV a la carpeta Descargas (Android 10+ / API 29+)
fun descargarCv(context: Context, uri: Uri?, nombre: String) {
    if (uri == null) {
        Toast.makeText(context, "No hay CV para descargar", Toast.LENGTH_SHORT).show()
        return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        Toast.makeText(context, "Requiere Android 10 o superior", Toast.LENGTH_SHORT).show()
        return
    }
    try {
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, nombre)
            put(MediaStore.Downloads.MIME_TYPE, context.contentResolver.getType(uri))
        }
        val destino = context.contentResolver
            .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)!!
        context.contentResolver.openInputStream(uri)!!.use { entrada ->
            context.contentResolver.openOutputStream(destino)!!.use { salida ->
                entrada.copyTo(salida)
            }
        }
        Toast.makeText(context, "CV guardado en Descargas", Toast.LENGTH_SHORT).show()
    } catch (e: Exception) {
        Toast.makeText(context, "Error al descargar el CV", Toast.LENGTH_SHORT).show()
    }
}