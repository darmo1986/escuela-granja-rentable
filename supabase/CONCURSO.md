# Concurso

Sigue en borrador. La página dice que no está abierto mientras `comunidad.concursoPublicado` sea `false`. Así no llama a Supabase.

El premio es uno solo y es del concurso. La cifra está solo en `public.premio_euros()`. El navegador la lee de esa función y no guarda otra copia. El reto de `/preguntas` no tiene premio.

Gana quien más acierta. Si empatan, el servidor sortea entre los empatados y guarda la llave en `concurso_sorteos`. No se usa el tiempo ni los milisegundos. Esa llave no se enseña.

Nota interna: revisar con el gestor.

## Orden del SQL

En el editor SQL de Supabase, y solo cuando se quiera encender:

1. `supabase/migrations/20261018120000_reto.sql` (si todavía no se corrió).
2. `supabase/migrations/20261018120100_cuenta.sql` (si todavía no se corrió).
3. `supabase/migrations/20261018130000_apodo.sql` (si todavía no se corrió).
4. `supabase/migrations/20261018140000_apodo_reglas.sql` (`apodo_ok`).
5. `supabase/migrations/20261018140100_premio.sql` (`premio_euros`).
6. `supabase/migrations/20261018140200_concurso.sql`. Crea las tablas y las funciones. No trae las preguntas.
7. El archivo privado `banco-concurso-v2.sql`, que no está en el repositorio. Se pega en el mismo editor después del paso 6. El banco viejo de 44 preguntas quedó publicado en commits anteriores y no se reutiliza.

Luego, en `js/config.js`, `comunidad.concursoPublicado` pasa a `true` y se publica el sitio.

## Qué ve el navegador

`concurso_empezar` exige la cuenta, 18 años o más y `perfiles.nombre`. El apodo se valida con `public.apodo_ok` (en el navegador, `GRAuth.apodo`), también cuando se cambia después de jugar. Hay un índice único sin distinguir mayúsculas ni acentos.

No acepta un apodo escrito en la página. Devuelve solo la primera pregunta, sin la correcta y sin la explicación. `concurso_abrir` entrega la siguiente y no reinicia el reloj. `concurso_responder` califica con el reloj del servidor. Si se acaba el tiempo, no manda la opción correcta ni la explicación.

El ranking del mes ordena por aciertos y no nombra un ganador. El día 1, con la hora de Madrid, la lista pública vuelve a cero. Cerrar el mes no concede el premio: `concurso_cerrar_meses` deja la marca elegida en `quiz_premios` con estado `pendiente_verificar`. No pasa sola a `pendiente`.

El administrador lo revisa en el editor SQL de Supabase, con un rol que pueda escribir (`postgres` o `service_role`). `authenticated` solo puede leer `quiz_premios`. Puede aprobar o anular.

Aprobar, después de revisar si hubo trampas. Eso publica el apodo en el historial y abre 14 días para reclamar:

```sql
update public.quiz_premios
set estado = 'pendiente',
    origen = 'concurso'
where periodo = 'AAAA-MM'
  and origen = 'concurso'
  and estado = 'pendiente_verificar';
```

Anular. El premio pasa a la siguiente marca válida y esa queda otra vez en `pendiente_verificar`, sin publicarse y sin cobro:

```sql
update public.quiz_premios
set estado = 'anulado',
    origen = 'concurso',
    motivo = 'revisión del administrador'
where periodo = 'AAAA-MM'
  and origen = 'concurso'
  and estado = 'pendiente_verificar';

select public.concurso_cerrar_meses();
```

Si nadie reclama en los 14 días, el mantenimiento anula el premio y pasa a la siguiente marca válida, también en revisión. Un premio ya pagado no se mueve.

El historial público se lee con `concurso_historial()`. El apodo sale de `perfiles.nombre`. No incluye un mes en `pendiente_verificar` ni anulado, así que no se anuncia un ganador antes de la aprobación. El formulario solo reclama si `concurso_premio_pendiente(periodo)` devuelve true, y eso solo ocurre con el estado `pendiente`. La función usa `auth.uid()` y no recibe el usuario como parámetro. Si se borra la cuenta, `ganador` queda vacío (`on delete set null`) y se conserva el apodo que ya estaba guardado.

Para descalificar una marca: `oculto = true` en `concurso_marcas`. Si el premio todavía no se pagó, pasa a la siguiente marca válida y esa persona no vuelve a salir en ese mes.

El ganador envía PayPal, o Bizum si el país de la marca es España. Eso se guarda en la fila del premio y no sale en el historial. La IP no se copia al premio.

## Turnstile

`turnstileSiteKey` en `js/config.js` es la clave pública. Vacía: el concurso no carga el script y el servidor no comprueba nada. Con valor, la página muestra la comprobación y `concurso_empezar` exige un token.

El secreto no va en git. Solo cuando la extensión `http` esté disponible:

```sql
alter database postgres set app.turnstile_secret = 'EL_SECRETO';
```

Si el secreto está puesto y la comprobación no puede hacerse, la partida no empieza.

## Plazos de borrado

La IP de la partida se borra a las 24 horas. La partida se borra a los 7 días. Las marcas, el sorteo y las exclusiones de un mes se borran cuando ese premio está pagado.

El límite es 30 partidas nuevas por minuto y por cuenta, y también por IP si la IP viene informada. Una IP vacía no se usa como cubo compartido. Además, 8 partidas empezadas por día y por cuenta, aunque no se hayan cerrado.

## Para pagar

El organizador paga la comisión. Los datos de pago se guardan para cumplir las bases y para la contabilidad. El apodo del ganador se publica.
