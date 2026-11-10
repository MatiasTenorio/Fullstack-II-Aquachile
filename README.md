# AquaChile - Frontend

Aplicación web para gestionar solicitudes de evaluación psicolaboral. Tiene dos partes:

- Un **formulario público** que completa el candidato (sin iniciar sesión).
- Un **panel interno** donde el equipo de AquaChile revisa las solicitudes, cambia su estado y sube el informe.

El frontend se conecta al backend (Spring Boot) por HTTP. No guarda datos propios: todo se pide al backend.

## Tecnologías

- React 19 y Vite
- React Router (rutas)
- Bootstrap 5 (estilos)
- docx-preview (vista previa de CV en Word)
- Vitest y Testing Library (tests)

## Cómo ejecutarlo

Desde la carpeta `aquachile-frontend`:

```
npm install
npm run dev
```

La página queda en `http://localhost:5173`. El backend debe estar corriendo en `http://localhost:8080`. Si está en otra dirección, se crea un archivo `.env` con:

```
VITE_API_URL=http://direccion-del-backend
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run test` | Ejecuta los tests y queda esperando cambios |
| `npx vitest run` | Ejecuta los tests una sola vez |
| `npm run build` | Genera la versión final en `dist/` |
| `npm run lint` | Revisa el estilo del código |

## Organización de carpetas

```
src/
  main.jsx            Punto de entrada
  App.jsx             Lista de rutas de la aplicación
  index.css           Estilos generales
  setupTests.js       Configuración de los tests
  pages/              Una carpeta-archivo por pantalla
  components/         Piezas reutilizables
  layouts/            Estructura común de las pantallas internas
  context/            Estado compartido (sesión del usuario)
  services/           Comunicación con el backend
  data/               Textos y listas fijas
  assets/             Imágenes
```

### pages

Cada archivo es una pantalla completa. Los tests están al lado, con el nombre `Pantalla.test.jsx`.

| Archivo | Ruta | Quién la ve |
| --- | --- | --- |
| `FormularioSolicitud.jsx` | `/solicitudes/nueva` | Público |
| `Login.jsx` | `/login` | Público |
| `HistorialSolicitudes.jsx` | `/solicitudes` | Usuarios con sesión |
| `DetalleSolicitud.jsx` | `/solicitudes/:id` | Usuarios con sesión |

### components

- `ProtectedRoute.jsx`: si no hay sesión, redirige a `/login`.
- `CvPreview.jsx`: muestra el CV dentro de la caja. Los PDF se ven con el visor del navegador y los DOCX con docx-preview, reducidos para que quepan a lo ancho.

### layouts

- `MainLayout.jsx`: barra superior con el logo, el nombre y rol del usuario, y el botón "Cerrar sesión". Las pantallas internas se dibujan debajo.

### context

- `AuthContext.jsx`: guarda quién inició sesión y entrega a toda la aplicación:
  - `login` y `logout`
  - `usuarioActual` (nombre y rol)
  - `api` y `descargar`, que llaman al backend con el token ya puesto

### services

- `api.js`: único lugar que habla con el backend.
  - `apiFetch` hace la petición y convierte los errores en un `ApiError` con mensaje en español.
  - `descargarArchivo` y `guardarArchivo` sirven para bajar CV e informes.
  - `enviarSolicitudPublica` envía el formulario del candidato.

### data

- `catalogos.js`: listas que usan varias pantallas.
  - Familias de cargo y los cargos de cada una.
  - Estados de una solicitud, con su texto y color.
  - Etiquetas de los roles y qué roles pueden cambiar el estado.

Si se agrega un cargo o se cambia el texto de un estado, se edita solo este archivo (y el catálogo equivalente en el backend, `CatalogoCargos.java`).

## Cómo funciona

### Rutas

`App.jsx` define dos grupos de rutas:

- **Públicas**: el formulario y el login. Cualquier otra dirección vuelve al formulario.
- **Protegidas**: historial y detalle. Van envueltas en `ProtectedRoute` y `MainLayout`.

### Sesión

1. En `Login.jsx` la persona ingresa correo y contraseña. `AuthContext` los envía al backend.
2. El backend responde con un token. Se guarda en `sessionStorage`: la sesión sobrevive a recargar la página, pero se pierde al cerrar la pestaña.
3. Cada llamada posterior lleva el token. Si el backend responde 401 (token vencido), la sesión se cierra sola.

### Flujo de una solicitud

1. El candidato completa el formulario: nombre, correo, familia de cargo, cargo y CV (PDF, DOC o DOCX, máximo 5 MB). Los cargos disponibles dependen de la familia elegida.
2. El backend guarda la solicitud y el CV (en Google Drive, en una carpeta por candidato).
3. En el historial, el equipo busca y filtra solicitudes. Los filtros se aplican en el backend.
4. En el detalle se ve el CV y los datos. El estado solo avanza: Pendiente, En Proceso, Completo.
5. Para pasar a Completo hay que subir antes el informe del psicólogo (PDF, DOC o DOCX, máximo 5 MB).
6. Quien actualiza el estado queda como responsable de la solicitud.

### Roles

| Rol | Puede |
| --- | --- |
| Analista de Reclutamiento | Ver, cambiar estado y subir informe |
| Profesional Evaluador | Igual, pero solo ve las solicitudes asignadas a él o sin asignar |
| Administrador | Ver, cambiar estado y subir informe |
| Jefatura | Solo consultar |

El frontend oculta los botones según el rol, pero quien decide es el backend, que rechaza las acciones no permitidas.

## Tests

Los tests usan Vitest y Testing Library. No necesitan el backend: la sesión y las llamadas se simulan. Cubren las cuatro pantallas:

- Login: campos, datos faltantes e inicio de sesión.
- Formulario: errores, CV inválido, cargos según familia y envío correcto.
- Historial: listado, sin resultados, búsqueda y navegación al detalle.
- Detalle: datos, cambio de estado, bloqueo sin informe y permisos por rol.
