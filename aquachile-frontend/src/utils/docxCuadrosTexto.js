import JSZip from 'jszip';

// Algunos CV se arman completos con "cuadros de texto" flotantes de Word: cada bloque (datos
// personales, estudios, experiencia...) es un cuadro posicionado con coordenadas sobre la hoja.
// docx-preview no sabe ubicar esos cuadros (los corre fuera de la hoja y no dibuja su texto),
// así que el CV se ve casi en blanco.
//
// Este módulo saca el contenido de cada cuadro y lo deja como párrafos normales, ordenados de
// arriba hacia abajo según su posición original. Se pierde el diseño exacto (bordes y ubicación
// de los cuadros), pero se ve todo el texto con su formato. Los documentos sin cuadros de texto
// no se tocan.

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  v: 'urn:schemas-microsoft-com:vml',
};

const EMU_POR_PUNTO = 12700;
// Posición de los cuadros alineados (en vez de una distancia exacta), para poder ordenarlos.
const POSICION_ALINEADA = { top: 0, left: 0, inside: 0, center: 1e7, bottom: 2e7, right: 2e7, outside: 2e7 };

const es = (nodo, ns, nombre) => nodo.namespaceURI === NS[ns] && nodo.localName === nombre;
const hijos = (nodo, ns, nombre) => Array.from(nodo.childNodes).filter((h) => h.nodeType === 1 && es(h, ns, nombre));
const descendientes = (nodo, ns, nombre) => Array.from(nodo.getElementsByTagNameNS(NS[ns], nombre));

function dentroDe(nodo, ns, nombre, limite) {
  for (let actual = nodo.parentNode; actual && actual !== limite; actual = actual.parentNode) {
    if (actual.nodeType === 1 && es(actual, ns, nombre)) return true;
  }
  return false;
}

// Distancia del cuadro (en EMU) desde su párrafo de referencia, en el eje indicado ("V" o "H").
function posicionAnclada(ancla, eje) {
  const posicion = hijos(ancla, 'wp', `position${eje}`)[0];
  if (!posicion) return 0;
  const distancia = hijos(posicion, 'wp', 'posOffset')[0];
  if (distancia) return Number(distancia.textContent) || 0;
  const alineacion = hijos(posicion, 'wp', 'align')[0];
  return POSICION_ALINEADA[alineacion?.textContent] ?? 0;
}

// Cuadros en formato antiguo (VML): la posición viene en el estilo, ej. "margin-top:16.35pt".
function posicionVml(forma, propiedad) {
  const valor = new RegExp(`${propiedad}:\\s*(-?[\\d.]+)pt`).exec(forma.getAttribute('style') ?? '');
  return valor ? Number(valor[1]) * EMU_POR_PUNTO : 0;
}

// Si el nodo es un cuadro de texto flotante, devuelve su contenido y posición; si no, null.
function leerCuadro(nodo) {
  const contenidos = descendientes(nodo, 'w', 'txbxContent');
  if (contenidos.length === 0) return null;

  // mc:AlternateContent trae el mismo cuadro dos veces (formato nuevo y antiguo): se usa el nuevo
  const ancla = descendientes(nodo, 'wp', 'anchor')[0];
  if (ancla) {
    const contenido = descendientes(ancla, 'w', 'txbxContent')[0];
    if (!contenido) return null;
    return { contenido, y: posicionAnclada(ancla, 'V'), x: posicionAnclada(ancla, 'H') };
  }
  // Un cuadro dentro de la línea de texto (wp:inline) ya se ubica bien: no se toca
  if (descendientes(nodo, 'wp', 'inline').length > 0) return null;

  const forma = descendientes(nodo, 'v', 'shape')[0] ?? descendientes(nodo, 'v', 'rect')[0];
  if (!forma || !/position:\s*absolute/.test(forma.getAttribute('style') ?? '')) return null;
  return { contenido: contenidos[0], y: posicionVml(forma, 'margin-top'), x: posicionVml(forma, 'margin-left') };
}

// Busca los cuadros flotantes de un párrafo, sin entrar en el contenido de los propios cuadros.
function cuadrosDelParrafo(parrafo) {
  const encontrados = [];
  const recorrer = (nodo) => {
    for (const hijo of Array.from(nodo.childNodes)) {
      if (hijo.nodeType !== 1) continue;
      const esContenedor = es(hijo, 'mc', 'AlternateContent') || es(hijo, 'w', 'drawing') || es(hijo, 'w', 'pict');
      const cuadro = esContenedor ? leerCuadro(hijo) : null;
      if (cuadro) encontrados.push({ ...cuadro, nodo: hijo });
      else if (!es(hijo, 'w', 'txbxContent')) recorrer(hijo);
    }
  };
  recorrer(parrafo);
  return encontrados;
}

function tieneSaltoDePagina(nodo) {
  return descendientes(nodo, 'w', 'br').some(
    (salto) => salto.getAttributeNS(NS.w, 'type') === 'page' && !dentroDe(salto, 'w', 'txbxContent', nodo)
  );
}

// Hijo directo del párrafo que contiene al nodo.
function hijoDirecto(parrafo, nodo) {
  let actual = nodo;
  while (actual.parentNode !== parrafo) actual = actual.parentNode;
  return actual;
}

function quitarCuadro(nodo) {
  const run = nodo.parentNode;
  run.removeChild(nodo);
  // Si el run quedó sin contenido (solo con su formato), se quita también
  if (es(run, 'w', 'r') && Array.from(run.childNodes).every((h) => h.nodeType !== 1 || es(h, 'w', 'rPr'))) {
    run.parentNode.removeChild(run);
  }
}

// Reemplaza el párrafo por: sus partes (separadas en cada salto de página) y, alrededor de cada
// parte, el contenido de los cuadros que se ubicaban en ella, ordenados por posición.
function aplanarParrafo(parrafo, cuadros) {
  const doc = parrafo.ownerDocument;
  const propiedades = hijos(parrafo, 'w', 'pPr')[0] ?? null;
  const elementos = Array.from(parrafo.childNodes).filter((h) => h.nodeType === 1 && !es(h, 'w', 'pPr'));

  // Parte (página) de cada hijo directo: el hijo que trae el salto inicia la parte siguiente
  const parteDe = new Map();
  let parte = 0;
  for (const elemento of elementos) {
    if (tieneSaltoDePagina(elemento)) parte += 1;
    parteDe.set(elemento, parte);
  }
  const totalPartes = parte + 1;

  const porParte = Array.from({ length: totalPartes }, () => []);
  for (const cuadro of cuadros) {
    porParte[parteDe.get(hijoDirecto(parrafo, cuadro.nodo)) ?? 0].push(cuadro);
  }
  cuadros.forEach((cuadro) => quitarCuadro(cuadro.nodo));

  const resultado = [];
  for (let i = 0; i < totalPartes; i += 1) {
    let parrafoParte = parrafo;
    if (totalPartes > 1) {
      parrafoParte = doc.createElementNS(NS.w, 'w:p');
      if (propiedades) {
        const copia = propiedades.cloneNode(true);
        // Un cambio de sección solo puede quedar en la última parte
        if (i < totalPartes - 1) hijos(copia, 'w', 'sectPr').forEach((s) => copia.removeChild(s));
        parrafoParte.appendChild(copia);
      }
      elementos.filter((e) => parteDe.get(e) === i && e.parentNode === parrafo).forEach((e) => parrafoParte.appendChild(e));
    }
    const ordenados = porParte[i].sort((a, b) => a.y - b.y || a.x - b.x);
    const contenidoDe = (c) => Array.from(c.contenido.childNodes).filter((h) => h.nodeType === 1);
    // Los cuadros ubicados sobre el párrafo (distancia negativa) van antes que él, salvo en las
    // partes que empiezan con un salto de página: esos cuadros pertenecen a la página nueva
    const antes = i === 0 ? ordenados.filter((c) => c.y < 0) : [];
    antes.forEach((c) => resultado.push(...contenidoDe(c)));
    resultado.push(parrafoParte);
    ordenados.filter((c) => !antes.includes(c)).forEach((c) => resultado.push(...contenidoDe(c)));
  }

  // Se inserta todo antes de una marca temporal; así el propio párrafo también queda en su lugar del orden
  const padre = parrafo.parentNode;
  const marca = doc.createComment('cuadros');
  padre.insertBefore(marca, parrafo);
  if (!resultado.includes(parrafo)) padre.removeChild(parrafo);
  for (const nodo of resultado) padre.insertBefore(nodo, marca);
  padre.removeChild(marca);
}

// Recibe el XML de word/document.xml y devuelve el XML con los cuadros aplanados,
// o null si el documento no tiene cuadros de texto flotantes.
export function aplanarDocumentXml(xml) {
  if (!xml.includes('txbxContent')) return null;
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  const cuerpo = doc.getElementsByTagNameNS(NS.w, 'body')[0];
  if (!cuerpo) return null;

  let cambios = 0;
  for (const parrafo of hijos(cuerpo, 'w', 'p')) {
    const cuadros = cuadrosDelParrafo(parrafo);
    if (cuadros.length === 0) continue;
    aplanarParrafo(parrafo, cuadros);
    cambios += cuadros.length;
  }
  return cambios > 0 ? new XMLSerializer().serializeToString(doc) : null;
}

// Recibe el archivo .docx y devuelve { blob, adaptado }. Si el documento no tiene cuadros de
// texto flotantes (o algo falla al procesarlo), devuelve el archivo original sin cambios.
export async function adaptarCuadrosDeTexto(blob) {
  try {
    const zip = await JSZip.loadAsync(blob);
    const archivo = zip.file('word/document.xml');
    if (!archivo) return { blob, adaptado: false };
    const nuevo = aplanarDocumentXml(await archivo.async('string'));
    if (!nuevo) return { blob, adaptado: false };
    zip.file('word/document.xml', nuevo);
    return { blob: await zip.generateAsync({ type: 'blob' }), adaptado: true };
  } catch {
    return { blob, adaptado: false };
  }
}
