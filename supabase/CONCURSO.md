# Concurso

Sigue en borrador. La página dice que no está abierto mientras `comunidad.concursoPublicado` sea `false`. Así no llama a Supabase.

El premio es uno solo: **20 €** al primero del ranking de cada mes. Se guarda en `quiz_premios`, la misma tabla del reto. `euros` solo puede ser 20. No hay otro premio ni otra cantidad.

## Orden del SQL

En el editor SQL de Supabase, y solo cuando se quiera encender:

1. `supabase/migrations/20261018120000_reto.sql` (si todavía no se corrió).
2. `supabase/migrations/20261018120100_cuenta.sql` (si todavía no se corrió).
3. `supabase/migrations/20261018140200_concurso.sql`. Crea las tablas y las funciones. No trae las preguntas.
4. El archivo privado `banco-concurso.sql`, que no está en el repositorio. Se pega en el mismo editor después del paso 3. Si un borrador viejo creó `concurso_partidas`, el paso 3 ya la elimina.

Luego, en `js/config.js`, `comunidad.concursoPublicado` pasa a `true` y se publica el sitio.

## Qué ve el navegador

`concurso_empezar` exige la cuenta y lee `perfiles.nombre`. No acepta un apodo escrito en la página. Devuelve solo la primera pregunta, sin la correcta y sin la explicación. `concurso_abrir` entrega la siguiente y arranca el reloj de esa pregunta. `concurso_responder` califica con el reloj del servidor y, solo entonces, manda la explicación.

El ranking del mes ordena por aciertos y, si empatan, por el tiempo del servidor. El día 1, con la hora de Madrid, la lista pública vuelve a cero. El primero del mes cerrado queda en `quiz_premios` con 20 € y estado `pendiente`. El historial público muestra el periodo y el apodo.

Para descalificar una marca: `oculto = true` en `concurso_marcas`. Si el premio sigue pendiente, reclamado o anulado, pasa a la siguiente marca válida. Un premio ya pagado no se mueve solo.

El ganador envía PayPal o Bizum desde la página. Eso se guarda en la fila del premio y no sale en el historial.

Las partidas a medias se borran a los 7 días. El límite es 30 partidas nuevas por minuto y por cuenta, y también por IP, más 8 partidas cerradas por día y por cuenta.
