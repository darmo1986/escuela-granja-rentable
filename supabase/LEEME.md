# Reto del mes

Propuesta para `/preguntas`. Sigue en borrador: no está publicada ni conectada a un proyecto real. Sustituye el borrador de respuestas abiertas: las preguntas son de cuatro opciones.

Mientras `comunidad.supabaseUrl` en `js/config.js` diga `https://TU-PROYECTO.supabase.co`, la página no llama a internet. Los ejemplos y lo que contestes se quedan en `localStorage` (`gr_preguntas_v1`, versión 3). En esa demo la clave está en `js/preguntas.js` para poder jugar sin servidor. El HTML no marca cuál es la correcta ni enseña la explicación hasta después. Con Supabase, el navegador no puede leer esas columnas: las devuelve `responder` al guardar el intento.

## Qué hay que hacer para encenderlo

1. Crear un proyecto gratis en [supabase.com](https://supabase.com). No subas la clave al repositorio.
2. En Authentication → URL configuration, pon la dirección del sitio `https://granjarentable.com` y permite `https://granjarentable.com/preguntas.html`. Para probar en el ordenador, añade también `http://127.0.0.1:8765/preguntas.html`.
3. Activa el proveedor Google (hace falta un cliente OAuth de Google Cloud, con tu cuenta) y deja activo el enlace por correo. En el plan gratis el correo sale con la marca de Supabase. El SMTP propio está incluido si más adelante quieres quitarla; quitar la marca del sobre ya es de pago.
4. Abre el editor SQL y pega `supabase/esquema.sql`. Si en ese proyecto ya estaba el SQL del foro abierto, no lo uses: este archivo es el del reto.
5. Entra una vez en la página (enlace al correo o Google) para que se cree tu ficha. En Authentication → Users copia tu uuid y ejecuta:

   `update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';`

6. En `js/config.js`, sustituye la URL y la clave **anon public**. No uses la clave `service_role`. `premioEuros` es la cantidad del mes, entre 20 y 30. `diasReclamo` son los días para reclamar (15). `segundos` es el tiempo de cada pregunta (45).
7. La página, cuando deje la demo, tiene que llamar a `preguntas_publicas`, `empezar_pregunta` y `responder`. No hagas un `select` de `quiz_preguntas`: esa tabla no está concedida al visitante precisamente para no llevarse la clave.

## Reglas

- `preguntas_publicas` devuelve el texto y las cuatro opciones. No devuelve `correcta` ni `explica`.
- `empezar_pregunta` abre el reloj en el servidor. `responder` solo acepta una opción si el tiempo no se pasó, guarda un intento por cuenta y entonces sí devuelve la explicación.
- 10 puntos por acierto, hasta 5 por rapidez y 5 por ser el primero. Quien propuso la pregunta no suma en ella.
- Tope: 1 intento cada 3 segundos y 40 a la hora, además del único intento por pregunta.
- El ranking del mes sale de `ranking_mes`. Orden: más puntos, quien llegó antes a esa cifra, más aciertos, y el nombre.
- El admin anula un intento con `anular_intento`. El premio se anota a mano en `quiz_premios`. No hay pago automático.
- `responder` guarda el aparato del perfil y, si llega en la cabecera, la IP. Es un aviso, no una prueba.
- Las bases de la página son un borrador: hay que revisarlas antes de encender nada. El concurso es de conocimiento, no una lotería, y la edad mínima es 18.

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

Para este reto, el plan gratis alcanza de sobra mientras el tráfico sea el del sitio.
