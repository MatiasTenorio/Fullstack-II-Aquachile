// Funciones para mostrar fechas y horas. Todo se muestra en la hora local de quien mira la pantalla.

// "2026-11-09" (fecha sin hora, como la envía el backend) -> "09-11-2026"
export function formatearFecha(iso) {
  return iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL') : '';
}

// Instante ISO -> hora en formato 24 horas (ej: 03:20 o 15:45)
export function formatearHora(instante) {
  return instante
    ? new Date(instante).toLocaleTimeString('es-CL', { hour: 'numeric', minute: '2-digit', hour12: false })
    : '';
}

// Instante ISO -> "19-11-2026 15:00"
export function formatearFechaHora(instante) {
  if (!instante) return '';
  const fecha = new Date(instante);
  return `${fecha.toLocaleDateString('es-CL')} ${formatearHora(instante)}`;
}

// "noviembre de 2026" -> "Noviembre de 2026" (solo la primera letra, no cada palabra)
export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Instante (ISO o Date) -> "2026-11-19T15:00", el formato que usa <input type="datetime-local">
export function aValorInput(instante) {
  const fecha = new Date(instante);
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
