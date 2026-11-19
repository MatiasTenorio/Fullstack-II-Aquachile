// Lleva el navegador a una dirección fuera de la aplicación (por ejemplo, la página de autorización de Google).
// Está en su propio archivo para poder reemplazarlo en las pruebas.
export function redirigir(url) {
  window.location.assign(url);
}
