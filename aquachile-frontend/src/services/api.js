// Capa de acceso al backend Spring Boot.
// La URL se puede cambiar con VITE_API_URL en aquachile-frontend/.env (por defecto, el backend local).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(status, mensaje, campos = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

function mensajePorEstado(status) {
  if (status === 401) return 'Tu sesión no es válida o expiró.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status === 413) return 'El archivo supera el tamaño máximo permitido (5 MB).';
  if (status >= 500) return 'Ocurrió un problema en el servidor. Intenta nuevamente más tarde.';
  return 'No se pudo completar la solicitud.';
}

// Convierte una respuesta con error del backend en ApiError.
async function crearError(respuesta) {
  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    // la respuesta no trae cuerpo JSON
  }
  return new ApiError(respuesta.status, cuerpo?.mensaje ?? mensajePorEstado(respuesta.status), cuerpo?.campos ?? {});
}

async function pedir(ruta, { token, headers, ...opciones } = {}) {
  try {
    return await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión.');
  }
}

// Hace la petición y convierte los errores del backend en ApiError.
export async function apiFetch(ruta, opciones = {}) {
  const respuesta = await pedir(ruta, opciones);
  if (respuesta.ok) {
    return respuesta.status === 204 ? null : respuesta.json();
  }
  throw await crearError(respuesta);
}

// Content-Disposition: attachment; filename="CV-solicitud-1.docx"  (o filename*=UTF-8''...)
function nombreDesdeDisposicion(valor) {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(valor);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      // se intenta con el formato simple
    }
  }
  const simple = /filename="?([^";]+)"?/i.exec(valor);
  return simple ? simple[1] : null;
}

// Descarga un archivo protegido con token. Devuelve { blob, nombre }.
export async function descargarArchivo(ruta, opciones = {}) {
  const respuesta = await pedir(ruta, opciones);
  if (!respuesta.ok) throw await crearError(respuesta);
  const blob = await respuesta.blob();
  const nombre = nombreDesdeDisposicion(respuesta.headers.get('Content-Disposition') ?? '') ?? 'cv';
  return { blob, nombre };
}

// Le pide al navegador que guarde un archivo que ya está en memoria.
export function guardarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

// Formulario psicolaboral: lo completa el candidato, no requiere sesión.
// No se define Content-Type: el navegador lo arma con el límite (boundary) del multipart.
export function enviarSolicitudPublica(formData) {
  return apiFetch('/public/solicitudes', { method: 'POST', body: formData });
}
