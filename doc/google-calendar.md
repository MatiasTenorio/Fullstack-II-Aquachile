# Conectar Google Calendar

Cada evaluador conecta **su propia cuenta de Google** desde la pantalla Calendario. Desde ese momento, las entrevistas que agenda en el sistema se copian a su Google Calendar: al agendar se crea el evento, al reprogramar se mueve y al pausar, cancelar o reasignar la solicitud se borra.

La base de datos del sistema siempre manda. Si Google falla o el evaluador no conectó su cuenta, la entrevista se guarda igual y solo no aparece en Google.

## Parte 1: Google Cloud (se hace una sola vez)

Usa el **mismo proyecto de Google Cloud** que ya tienen para Google Drive. Los nombres de los menús pueden variar un poco según el idioma de la consola.

1. Entra a <https://console.cloud.google.com> con la cuenta dueña del proyecto y selecciona el proyecto arriba a la izquierda.
2. **Activar la API.** Menú → *APIs y servicios* → *Biblioteca*. Busca **Google Calendar API**, ábrela y presiona **Habilitar**.
3. **Agregar el permiso.** Menú → *Google Auth Platform* → *Acceso a los datos* → **Agregar o quitar permisos**. Marca estos tres y guarda:
   - `.../auth/calendar.events` (ver y editar eventos de los calendarios)
   - `.../auth/userinfo.email`
   - `openid`
4. **Agregar a los evaluadores como usuarios de prueba.** *Google Auth Platform* → *Público* → sección *Usuarios de prueba* → **Agregar usuarios**. Escribe el correo de Google de cada persona que vaya a conectar su calendario. Quien no esté en esta lista recibe el error "acceso bloqueado" al intentar conectar.
5. **Registrar la dirección de regreso.** *Google Auth Platform* → *Clientes*. Abre el cliente OAuth que usan para Drive y revisa su tipo:
   - Si es de tipo **Aplicación web**: en *URIs de redireccionamiento autorizados* presiona **Agregar URI**, escribe la dirección de abajo y guarda. No borres las que ya están.
   - Si es de otro tipo (por ejemplo, *App de escritorio*): crea un cliente nuevo con **Crear cliente** → tipo *Aplicación web* → agrega la misma dirección en *URIs de redireccionamiento autorizados*. Copia el **ID de cliente** y el **secreto** que aparecen al crearlo.

   ```
   http://localhost:8080/google/calendar/callback
   ```

   La dirección debe quedar escrita exactamente así, sin barra al final.

## Parte 2: configuración del backend

En `aquachile-backend/src/main/resources/application-local.properties` (el archivo de las credenciales de Drive, que git ignora) agrega:

```
app.google.calendar.enabled=true
```

Con eso el sistema usa el mismo cliente OAuth de Drive. **Solo si creaste un cliente nuevo** en el paso 5, agrega también:

```
app.google.calendar.client-id=EL_ID_DE_CLIENTE_NUEVO
app.google.calendar.client-secret=EL_SECRETO_NUEVO
```

Reinicia el backend. Al iniciar se aplica sola la migración `V12`.

## Parte 3: conectar la cuenta (lo hace cada evaluador)

1. Inicia sesión como evaluador y entra a **Calendario**.
2. Presiona **Conectar Google Calendar**. El navegador va a Google.
3. Elige la cuenta de Google. Como la app está en modo de prueba, Google muestra "Google no verificó esta app": presiona **Continuar**.
4. Marca la casilla del permiso de calendario y presiona **Continuar**. Si la casilla queda sin marcar, la conexión no sirve.
5. El navegador vuelve al calendario del sistema con el mensaje "Tu cuenta de Google quedó conectada".

Para probar, agenda una entrevista y revisa que aparezca en Google Calendar con el título "Entrevista psicolaboral: (nombre del candidato)".

## Qué conviene saber

- **El permiso vence a los 7 días.** Mientras la app de Google Cloud esté en modo *Prueba*, Google caduca la conexión una semana después. Cuando pasa, el sistema lo detecta, quita la conexión y el evaluador vuelve a ver el botón "Conectar Google Calendar". Antes de una demostración conviene reconectar.
- **Entrevistas que no quedaron en Google.** Si una entrevista se agendó sin la cuenta conectada o Google falló, en el Calendario aparece el enlace "Enviar a Google Calendar" en el detalle del día.
- **Desconectar.** El botón "Desconectar" quita el permiso. Los eventos que ya estaban en Google Calendar no se borran.
- **No se invita al candidato.** El evento queda solo en el calendario del evaluador; los correos de los candidatos son ficticios.
- **El permiso se guarda cifrado** en la tabla `google_conexiones`. La clave de cifrado sale de `JWT_SECRET`: si ese secreto cambia, todos deben reconectar.

## Al desplegar (Hito 3)

Fuera de `localhost` hay que ajustar tres cosas, todas con la dirección real y con `https`:

1. En el cliente OAuth de Google Cloud, agregar la URI `https://DOMINIO_DEL_BACKEND/google/calendar/callback`.
2. Variable `GOOGLE_CALENDAR_REDIRECT_URI` del backend con esa misma dirección.
3. Variable `FRONTEND_URL` del backend con la dirección del frontend (a ella vuelve el navegador después de Google).

## Errores frecuentes

| Lo que se ve | Causa | Solución |
|---|---|---|
| Google muestra `redirect_uri_mismatch` | La dirección del paso 5 no está registrada o está escrita distinto | Revisar que sea idéntica, sin barra final, en el cliente que usa el backend |
| Google muestra "Acceso bloqueado" o `access_denied` | La cuenta no está en *Usuarios de prueba* | Agregarla en el paso 4 |
| No aparece el botón "Conectar Google Calendar" | `app.google.calendar.enabled` no está en `true`, o falta el ID o el secreto del cliente | Revisar `application-local.properties` y reiniciar |
| Vuelve con "No se pudo conectar la cuenta de Google" | El secreto del cliente es incorrecto, o no se marcó la casilla del permiso | Revisar el secreto; conectar de nuevo marcando la casilla. El detalle queda en la consola del backend |
| Las entrevistas dejaron de copiarse | Pasaron los 7 días del modo prueba | Conectar la cuenta otra vez |
