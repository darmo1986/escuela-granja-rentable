# Concurso

Esta migración **no se ha ejecutado**. El visitante juega en el navegador y el ranking general sigue apagado (`comunidad.concursoPublicado` en `false` dentro de `js/config.js`).

## SQL que tiene que ejecutar Pablo

Pega y ejecuta **entero** este archivo en el editor SQL de Supabase:

`supabase/migrations/20261018140200_concurso.sql`

Ese archivo es el que vale. No uses un borrador anterior del concurso: aquel dejaba a `anon` insertar el puntaje a mano.

Si ese borrador llegó a crearse y la tabla `concurso_partidas` ya existe, bórrala **antes** y luego ejecuta el archivo nuevo:

```sql
drop table if exists public.concurso_partidas cascade;
```

Qué hace el SQL nuevo:

- `concurso_preguntas` guarda las respuestas correctas. El visitante no puede leerla.
- `concurso_sesiones` es la partida abierta. El reloj es el del servidor.
- `concurso_partidas` es el ranking: una fila por apodo, solo la mejor marca, y solo si sumó puntos.
- `anon` puede **leer** el ranking (filas con `oculto = false`) y puede **ejecutar** `concurso_empezar`, `concurso_abrir` y `concurso_responder`. No puede insertar ni actualizar el puntaje.
- Esas tres funciones son `SECURITY DEFINER`: reciben la opción elegida y el reloj del servidor, y calculan los puntos. Hace falta al menos 1 segundo por acierto. Hay un tope de 30 partidas nuevas por minuto y 8 por apodo en 24 horas.
- La columna `oculto` (por defecto `false`) no se muestra en la página. Para esconder una marca, en el editor de tablas de Supabase pon `oculto = true` en esa fila.

## Después de ejecutar el SQL

En `js/config.js`, pasa `comunidad.concursoPublicado` a `true` y publica el sitio. Hasta entonces la página no llama a Supabase.

No hay premios ni dinero. No se guarda correo ni IP. El nombre público es el apodo.

Ese apodo es el mismo que `perfiles.nombre` de la cuenta, cuando la persona ya entró: de 2 a 40 caracteres, escrito a mano, nunca sacado del correo. Si no hay sesión, lo escribe en el concurso. El filtro de insultos sigue valiendo en los dos casos.

## Cuando se fusione la cuenta (PR #12)

- En `js/config.js` hay un solo objeto `comunidad`. Ahí viven la URL, la clave publicable y `concursoPublicado`. No dupliques el bloque.
- El enlace Concurso entra en el menú Herramientas en cuanto ese menú existe. Hasta entonces queda junto a Juegos. No hace falta una entrada aparte.
