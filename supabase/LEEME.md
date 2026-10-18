# Preguntas de la comunidad

Propuesta para `/preguntas`. Sigue en borrador: no está publicada ni conectada a un proyecto real.

Mientras `comunidad.supabaseUrl` en `js/config.js` diga `https://TU-PROYECTO.supabase.co`, la página no llama a internet. Los ejemplos y lo que escribas se quedan en `localStorage` (`gr_preguntas_v1`).

Supabase encaja mejor que Firebase: son tablas (pregunta, respuesta, voto, reporte) y reglas por fila. En Firebase el ranking y esas reglas acaban en código de servidor. No hace falta.

## Qué hay que hacer para encenderlo

1. Crear un proyecto gratis en [supabase.com](https://supabase.com). No subas la clave al repositorio.
2. En Authentication → URL configuration, pon la dirección del sitio `https://granjarentable.com` y permite `https://granjarentable.com/preguntas.html`. Para probar en el ordenador, añade también `http://127.0.0.1:8765/preguntas.html`.
3. Activa el proveedor Google (hace falta un cliente OAuth de Google Cloud, con tu cuenta) y deja activo el enlace por correo. En el plan gratis el correo sale con la marca de Supabase. El SMTP propio está incluido si más adelante quieres quitarla; quitar la marca del sobre ya es de pago.
4. Abre el editor SQL y pega `supabase/esquema.sql`.
5. Entra una vez en la página (enlace al correo o Google) para que se cree tu ficha. En Authentication → Users copia tu uuid y ejecuta:

   `update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';`

6. En `js/config.js`, sustituye la URL `https://abcdefgh.supabase.co` y la clave **anon public** (Project Settings → API). No uses la clave `service_role`: esa salta las reglas.
7. La página habla con la API por `fetch`. No carga un script de Supabase.

## Reglas

- Cualquiera lee lo que no está oculto. El correo no está en `perfiles`; queda en el acceso de Supabase.
- Solo el autor inserta su pregunta, respuesta o voto, y no puede votarse a sí mismo.
- Reportar lo hace quien entró. Los reportes los lee esa persona y el admin.
- Ocultar o volver a mostrar lo hace quien tenga `es_admin`. Ese campo solo se cambia con el SQL de arriba.
- El filtro de palabras y el tope de envíos están en el SQL (3 preguntas / 10 min, 8 respuestas / 10 min, 10 reportes / hora). La demo aprieta un poco más en el navegador para que se note al probar.

## Plan gratis

Cifras públicas de [supabase.com/pricing](https://supabase.com/pricing) al armar esta propuesta. Conviene mirarlas otra vez antes de encender:

- 0 € al mes.
- 2 proyectos activos por organización.
- 500 MB de base de datos por proyecto.
- 50.000 usuarios activos al mes. El plan gratis no cobra el exceso: para pasar de ahí hace falta el plan Pro.
- 5 GB de salida y 5 GB de salida en caché. Peticiones de API sin tope publicado.
- 1 GB de archivos (aquí no se usan).
- Google y el enlace por correo van incluidos.
- Un proyecto gratis se pausa si en una semana casi no hay consultas. Avisan por correo. Se puede reactivar hasta un año después. Con unas pocas visitas al día no debería pausarse. El plan Pro, desde 25 USD al mes, no se pausa.

Para este foro, el plan gratis alcanza de sobra mientras el tráfico sea el del sitio.
