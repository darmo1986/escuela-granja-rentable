# Reto del mes

Propuesta para `/preguntas`. Sigue en borrador: no está publicada ni conectada a un proyecto real. Sustituye el borrador de respuestas abiertas: las preguntas son de cuatro opciones.

`js/config.js` ya apunta al proyecto `https://apdcgizpgguhmbgzsymx.supabase.co` con la clave publicable. No hay clave secreta en el repositorio. El correo y la contraseña usan ese proyecto. Si Supabase no responde, la demo del navegador sigue valiendo (Ana Ruiz). Google todavía no está activado: el botón lo dice y no redirige. El reto se juega en demo hasta que se ejecuten las migraciones, porque `preguntas_publicas` aún no está en el proyecto. El HTML no marca cuál es la correcta ni enseña la explicación hasta después.

## Cuenta del sitio

La misma clave sirve para el curso, la calculadora, las fichas y el reto. El proyecto gratis ya está creado y la clave publicable está en `js/config.js`. No se ejecuta el SQL desde aquí. Ana Ruiz sigue como demo de reserva.

El curso de este sitio es gratis. No hay Stripe ni un precio de 2,99 €. Entrar no lo cierra: solo copia el avance a la cuenta.

### Proyecto de Supabase

1. El proyecto gratis ya existe: `https://apdcgizpgguhmbgzsymx.supabase.co`. La clave publicable ya está en `js/config.js`. No subas la `service_role`.
2. Authentication → URL configuration. Site URL: `https://granjarentable.com`. En Redirect URLs añade:
   - `https://granjarentable.com/cuenta.html`
   - `http://127.0.0.1:8765/cuenta.html` (para probar en el ordenador)
3. Authentication → Providers → Email: deja el correo activo, con «Confirm email» encendido. Así el alta pide verificación y existe «olvidé la contraseña». El enlace mágico usa el mismo correo.
4. Authentication → Emails. El correo incluido en el plan gratis es para probar y va muy limitado (unas pocas piezas por hora). Para el sitio de verdad, abre SMTP y pon un servidor propio (host, puerto, usuario, contraseña y el correo que verá la gente, por ejemplo `no-reply@granjarentable.com`). Revisa las plantillas de confirmar cuenta, enlace mágico y nueva contraseña, y que el enlace vuelva a `https://granjarentable.com/cuenta.html`.
5. En el editor SQL, ejecuta en orden `supabase/migrations/20261018120000_reto.sql` y `supabase/migrations/20261018120100_cuenta.sql`. Cada tabla queda con RLS. No se han ejecutado desde el repositorio.
6. La URL y la clave publicable ya están en `js/config.js`. No las sustituyas por un secreto.

### Google

1. En [Google Cloud Console](https://console.cloud.google.com) crea un proyecto (el plan de una pantalla de consentimiento de prueba no se cobra).
2. APIs y servicios → Pantalla de consentimiento de OAuth. Tipo externo. Nombre: Granja Rentable. Correo de asistencia: el tuyo. Dominio autorizado: `granjarentable.com`. Guarda los alcances por defecto (email, perfil, openid).
3. Credenciales → Crear credencial → ID de cliente de OAuth → Aplicación web.
   - Orígenes de JavaScript autorizados: `https://granjarentable.com`
   - URI de redirección autorizada: `https://apdcgizpgguhmbgzsymx.supabase.co/auth/v1/callback`
4. Copia el ID y el secreto a Supabase → Authentication → Providers → Google, y actívalo.
5. Cuando quieras que entre cualquiera, publica la pantalla de consentimiento. Hasta entonces solo entran las cuentas de prueba que añadas en Google Cloud.

## Qué hay que hacer para encenderlo

1. Crear un proyecto gratis en [supabase.com](https://supabase.com). No subas la clave al repositorio.
2. En Authentication → URL configuration, pon la dirección del sitio `https://granjarentable.com` y permite `https://granjarentable.com/preguntas.html`. Para probar en el ordenador, añade también `http://127.0.0.1:8765/preguntas.html`.
3. Activa el proveedor Google (hace falta un cliente OAuth de Google Cloud, con tu cuenta) y deja activo el enlace por correo. En el plan gratis el correo sale con la marca de Supabase. El SMTP propio está incluido si más adelante quieres quitarla; quitar la marca del sobre ya es de pago.
4. Abre el editor SQL y ejecuta, en orden, `supabase/migrations/20261018120000_reto.sql` y `supabase/migrations/20261018120100_cuenta.sql`. Si en ese proyecto ya estaba el SQL del foro abierto, no lo uses: estos archivos son los del reto y de la cuenta. `supabase/esquema.sql` es la misma copia junta.
5. Entra una vez en la página (enlace al correo o Google) para que se cree tu ficha. En Authentication → Users copia tu uuid y ejecuta:

   `update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';`

6. En `js/config.js`, sustituye la URL y la clave **anon public**. No uses la clave `service_role`. `premioEuros` es la cantidad del mes, entre 20 y 30. `diasReclamo` son los días para reclamar (15). `segundos` es el tiempo de cada pregunta: 30, fijo. El servidor guarda la hora al servirla y al recibir la respuesta, y admite 2 segundos de margen.
7. La página, cuando deje la demo, tiene que llamar a `preguntas_publicas`, `empezar_pregunta` y `responder`. No hagas un `select` de `quiz_preguntas`: esa tabla no está concedida al visitante precisamente para no llevarse la clave.

## Reglas

- `preguntas_publicas` devuelve el texto y las cuatro opciones. No devuelve `correcta` ni `explica`.
- `empezar_pregunta` anota `servida_en` con la hora del servidor. `responder` anota `recibida_en` y solo da puntos si llegaron dentro de 30 s más 2 s de margen. Pasado eso, o si al volver a entrar sigue abierta (`cerrar_abiertas`), cuenta como fallo, 0 puntos y el intento usado. El extra de rapidez se calcula sobre esos 30 s. Entonces sí devuelve la explicación.
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
