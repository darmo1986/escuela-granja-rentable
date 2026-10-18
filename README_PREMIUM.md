# Premium: lo que tienes que hacer tú, Pablo

La web ya tiene la página, el menú y el programa que escucha a Stripe. **Todavía no cobra.** El botón de `/premium` dice «Próximamente» hasta que los precios estén en Supabase. No hace falta pegar enlaces en `js/config.js`: el pago lo abre el servidor con la sesión de quien ha entrado.

No fusiones este cambio antes del PR #12 (cuentas). Premium se apoya en la tabla `perfiles`. El PR #15 (concurso) va después; al final de esta nota está cómo encajarlos sin romper el menú Herramientas.

Trabaja siempre con el interruptor de Stripe en **modo prueba** (Test mode). La tarjeta de prueba no cobra dinero de verdad.

## Qué no se sube a GitHub

Estas cosas se pegan solo en Supabase → Project Settings → Edge Functions → Secrets. Si aparecen en un archivo, en un mensaje o en una captura dentro del repositorio, hay que borrarlas y crearlas de nuevo en Stripe.

| Secreto | Dónde lo da Stripe | Nombre en Supabase |
|---|---|---|
| Firma del webhook | Empieza por `whsec_` | `STRIPE_WEBHOOK_SECRET` |
| Clave restringida de prueba | Empieza por `rk_test_` | `STRIPE_SECRET_KEY` |
| Precio mensual | Empieza por `price_` | `STRIPE_PRECIO_MENSUAL` |
| Precio anual | Empieza por `price_` | `STRIPE_PRECIO_ANUAL` |

La clave anon de Supabase (`SUPABASE_ANON_KEY`) la pone el propio Supabase en las funciones. Si faltara, pega la clave **publicable**, la misma de `js/config.js`. Nunca pongas la `service_role` en ese hueco.

No pongas `STRIPE_PERMITIR_REAL` todavía. Mientras no exista, un aviso de modo real se ignora y nadie queda Premium por un cobro real accidental.

## Impuesto: léelo antes de cobrar de verdad

Estás en Santa Cruz de Tenerife. En Canarias el impuesto indirecto es el **IGIC**, no el IVA. Una venta a la península tiene otro régimen. Stripe Tax calcula con la dirección de facturación del cliente. **El gestor tiene que confirmar** el tipo que te corresponde, y cómo se declara, antes de quitar el modo prueba. Elegir dólares en el menú de la web no quita el IVA de un cliente de la Unión Europea: el cobro no usa el país del menú.

## 1. Producto, dos precios y el impuesto, en modo prueba

1. Entra en [dashboard.stripe.com](https://dashboard.stripe.com). Arriba a la derecha, el interruptor tiene que decir que estás en **modo de prueba**. Si dice «real» o «live», cámbialo antes de seguir.
2. Catálogo de productos → Añadir producto. Nombre: **Granja Rentable Premium**.
3. Crea **dos** precios, los dos recurrentes, en euros. En cada precio abre las opciones de moneda y añade dólares (USD) con el importe de la tabla. No actives la prueba en el precio: los 7 días los pone el servidor al abrir el pago.

| Precio | Cada | EUR | USD (opción de moneda) |
|---|---|---|---|
| Mensual | mes | 4,99 | 4,99 |
| Anual | año | 39 | 39 |

4. Copia el identificador de cada precio (empieza por `price_`). El mensual va al secreto `STRIPE_PRECIO_MENSUAL`. El anual, a `STRIPE_PRECIO_ANUAL`. No los pegues en `js/config.js`.
5. Ajustes → Tax (Stripe Tax). Actívalo y pon la dirección del negocio. Sin esto, el botón de pago responde que no pudo abrir Stripe.
6. Ajustes → Portal de clientes (Customer portal). Actívalo. Permite cancelar. La cancelación tiene que ser **al final del periodo**, no en el acto: así quien cancela sigue hasta el día que ya pagó.
7. Ajustes → Correos de clientes. Activa el recibo y el aviso antes de que se renueve la suscripción. Ese correo es también la confirmación del contrato.

No crees enlaces de pago (`buy.stripe.com`). Esos enlaces dejan que el navegador elija la cuenta, y con eso se podía quitar el Premium a otra persona. El botón de la web llama a la función `crear-checkout`.

No compartas un enlace de pago en redes ni por mensajes. Quien quiera suscribirse entra en la web, con su cuenta.

## 2. El webhook

1. En Stripe: Desarrolladores → Webhooks → Añadir destino. Elige la versión de API **2025-03-31.basil** (la misma que usa el programa). Si el destino queda en otra versión, la factura no trae la suscripción donde el programa la lee.
2. Dirección, tal cual:

`https://apdcgizpgguhmbgzsymx.supabase.co/functions/v1/stripe-webhook`

3. Eventos, estos seis y no hace falta más:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

4. Stripe enseña un secreto que empieza por `whsec_`. Cópialo para el paso 4. No lo pegues en `config.js`.

El programa vuelve a leer cada aviso en la API de Stripe y guarda su identificador. Un aviso repetido no se aplica dos veces. Si no puede leer la suscripción, o si no trae fecha de fin, no activa Premium y Stripe lo reintenta.

## 3. La clave restringida

En Stripe: Desarrolladores → Claves de API → Crear clave restringida, en modo prueba.

Permisos:

- Customers: Read y Write
- Subscriptions: Read y Write
- Checkout Sessions: Write
- Billing portal sessions: Write
- Invoices: Read
- Refunds: Write
- Events: Read

Esa clave empieza por `rk_test_`. Es la que va en Supabase como `STRIPE_SECRET_KEY`. No uses la clave secreta completa (`sk_test_` o `sk_live_`) si la restringida te deja guardar.

## 4. Secretos en Supabase

Proyecto `apdcgizpgguhmbgzsymx` → Project Settings → Edge Functions → Secrets (o Manage secrets):

- `STRIPE_WEBHOOK_SECRET` = el `whsec_…`
- `STRIPE_SECRET_KEY` = el `rk_test_…`
- `STRIPE_PRECIO_MENSUAL` = el `price_…` del mes
- `STRIPE_PRECIO_ANUAL` = el `price_…` del año

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya los pone Supabase dentro de la función. No los copies al repositorio. La `service_role` borra la protección de las tablas: solo vive ahí.

## 5. El SQL

1. Supabase → SQL Editor → New query.
2. Abre `supabase/migrations/20261018150000_premium.sql`, selecciona todo, pégalo y pulsa Run.
3. Tiene que decir que terminó sin error. Si el aviso habla del bucket `premium`, créalo a mano: Storage → New bucket → nombre `premium` → **Public desactivado**.
4. Si ya habías pegado una versión anterior de este mismo archivo, vuélvelo a pegar. La tabla de suscripciones de prueba se vuelve a crear: una fila por cada suscripción, no una por persona.
5. Este SQL no se ha ejecutado desde el repositorio. Quien lo corre eres tú, en el editor.

Orden si todavía no corriste las cuentas: primero `20261018120000_reto.sql`, luego `20261018120100_cuenta.sql`, luego `20261018130000_apodo.sql`, y al final este de Premium. El del concurso (`20261018140200_concurso.sql`) es otro PR: no lo mezcles aquí.

Si más adelante vuelves a pegar el SQL del reto, Postgres suelta el ranking y lo crea sin la insignia. Después pega otra vez este de Premium.

## 6. El archivo de ejemplo

Storage → bucket `premium` (privado) → Create folder `ejemplo` → sube un archivo de texto llamado `plantilla-costos.txt`. Copia esto dentro:

```text
EJEMPLO — no es una plantilla real
Costos del lote
Aves:
Precio del pollito:
Alimento:
Venta:
Sirve para probar el enlace que caduca. El equipo lo sustituirá.
```

No subas el curso de verdad a GitHub. Un PDF en el repositorio lo puede leer cualquiera, aunque la página lo oculte. El curso se inserta en la tabla `contenido_premium` (Supabase → Table editor) y las hojas van a este bucket. Las dos filas que ya trae el SQL están marcadas **EJEMPLO** a propósito, y el texto también está en el SQL porque es de prueba.

El enlace de descarga lo firma el servidor y caduca a los **120 segundos**. El navegador no puede pedir otro plazo.

## 7. Desplegar las funciones

Hace falta el acceso al proyecto. En un ordenador con Node, dentro de la carpeta del repositorio:

```bash
npx supabase login
npx supabase link --project-ref apdcgizpgguhmbgzsymx
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy stripe-portal
npx supabase functions deploy crear-checkout
npx supabase functions deploy premium-archivo
npx supabase functions deploy cerrar-cuenta
npx supabase functions deploy desistir
```

Si el comando se queja de `supabase/config.toml`, bórralo y vuelve a lanzar los deploy. Lo que tiene que cumplirse es `--no-verify-jwt` **solo** en el webhook. Las otras cinco exigen la sesión.

`--no-verify-jwt` es obligatorio en el webhook. Stripe no manda el pase de Supabase. La prueba de que el aviso es de Stripe es la firma. Si dejas esa verificación encendida, Stripe recibe un error y nadie se vuelve Premium.

En el panel de Supabase, «Enforce JWT» queda **apagado** solo en `stripe-webhook`. En las otras cinco, encendido.

## 8. La prueba con la tarjeta 4242

1. Publica la web (o ábrela en local) con los secretos ya puestos y las funciones desplegadas.
2. Crea una cuenta en Granja Rentable y entra.
3. Abre Premium. Si el país no se sabe, o falla la localización, el precio sale en **euros, con IVA**. Elige España u otro país de la Unión Europea: euros. Elige México a mano: dólares en el anuncio. El cobro, en Stripe, pide la dirección y el IVA de la Unión Europea no se quita por ese menú.
4. Marca la casilla de condiciones y pulsa «Probar 7 días gratis». Te lleva a Stripe, no a una página nuestra. La prueba de 7 días la pone el servidor.
5. Tarjeta: `4242 4242 4242 4242`. Fecha: cualquiera futura, por ejemplo `12/34`. CVC: `123`. Código postal: `38008`. Rellena la dirección: Stripe la usa para el impuesto.
6. Vuelves a Mi cuenta. Tiene que decir que Premium está en vigor y, junto al apodo, la insignia. En esa primera página no se piden anuncios. El apodo es el que escribiste al registrarte, no el correo.
7. En Premium, entra a la lección de ejemplo y pulsa la descarga. El enlace caduca a los dos minutos, también durante la prueba. Si cierras sesión, la lección desaparece: la base no la entrega.
8. Mi cuenta → Gestionar suscripción. Se abre Stripe. Cancela al final del periodo. Sigues Premium hasta ese día. Si tienes otra suscripción viva, cancelar una no apaga la otra.
9. Mi cuenta → Desistir del contrato. Dentro de los 14 días cancela en el acto y pide la devolución. Pasados los 14 días, el botón te manda al portal.
10. Mi cuenta → Cerrar cuenta. Primero cancela la suscripción en Stripe y después borra la cuenta. Stripe no sigue cobrando.
11. Para no esperar 7 días: en Stripe, abre esa suscripción de prueba y termina la prueba (End trial). Mira el webhook: tiene que aparecer en verde. Luego mira Mi cuenta. `premium_hasta` no puede quedar vacío si la cuenta es Premium.
12. Para un fallo de pago: otra suscripción de prueba con la tarjeta `4000 0000 0000 0341` (se acepta y falla al cobrar), o reenvía desde Stripe el evento `invoice.payment_failed`. Si no queda ninguna suscripción viva, la cuenta deja de ser Premium.

Si pagas y no se activa: en Stripe → Webhooks mira el envío. Una respuesta `Firma` significa que el `whsec_` no es el de este destino. Una respuesta `sin usuario` significa que el alta no pasó por el botón de la web.

El soporte de Premium es por Messenger de la Página o por el formulario de la web, en un máximo de 2 días hábiles. El usuario de la Página (m.me/…) está **PENDIENTE**: cuando lo tengas, se cambia el enlace `#PENDIENTE` de `premium.html` y de las condiciones. Información general: no sustituye al veterinario; ante urgencias, acude hoy a tu veterinario. No damos dosis de medicamentos.

## 9. Antes de cobrar dinero de verdad

No quites el modo prueba hasta que el gestor confirme el IGIC de Tenerife, el IVA de las ventas a la Unión Europea, los impuestos de Latinoamérica si aplican, y cómo se hace la factura. Está marcado en amarillo en `condiciones-premium.html` y en la privacidad.

Cuando el gestor dé el visto bueno:

1. Repite los dos precios en modo **real**, otra vez en euros con opción de dólares.
2. Nuevo webhook, en modo real, a la misma dirección y con la versión **2025-03-31.basil**. El `whsec_` de prueba no sirve para el real: actualiza el secreto.
3. Clave restringida de modo real, y sustitúyela en Supabase. Actualiza también los dos `price_`.
4. Añade el secreto `STRIPE_PERMITIR_REAL` con el valor `si`. Sin eso, la función ignora los cobros reales a propósito.

## Qué hace cada pieza

- `/premium.html` — la oferta. La Unión Europea, y quien no tiene país confirmado, ve euros con IVA. El botón llama al servidor.
- `js/premium.js` — elige el plan (mes o año) y nada más. No manda el id de la cuenta ni un enlace de pago.
- `supabase/functions/crear-checkout` — abre el pago con el id de la sesión. Pide la dirección y activa Stripe Tax. La prueba son 7 días.
- `supabase/functions/stripe-webhook` — comprueba la firma, relee el aviso en Stripe, guarda el id del aviso y escribe una fila por suscripción. Premium sale de todas las que sigan vivas, y siempre con fecha de fin.
- `supabase/functions/stripe-portal` — abre la página de Stripe para cancelar o cambiar la tarjeta. Exige haber entrado.
- `supabase/functions/premium-archivo` — firma la descarga a 120 segundos si la cuenta es Premium.
- `supabase/functions/desistir` — botón de desistimiento. Dentro de 14 días cancela y pide la devolución.
- `supabase/functions/cerrar-cuenta` — cancela en Stripe y después borra la cuenta.
- `supabase/migrations/20261018150000_premium.sql` — tablas, reglas y dos ejemplos.

Alta y renovación (`active` o `trialing`) con fecha de fin: Premium hasta la suscripción viva que acabe más tarde. Sin fecha, no se activa. Cancelar al final del periodo: sigue `active` hasta ese día y luego Stripe manda `deleted`. Si queda otra suscripción viva, el acceso sigue. Fallo de pago (`past_due`, `unpaid`, `canceled`): esa fila no da acceso. Nadie puede ponerse Premium con una llamada desde el navegador, ni leer la fecha de otro, ni quitarle el Premium a otra cuenta.

## Comprobación de seguridad

Esto se puede mirar en el SQL Editor, con la cuenta de una persona de prueba (no con la `service_role`).

- [ ] `perfiles`: el navegador puede leer `nombre` y cambiar `nombre` y `dispositivo`. No puede leer `premium` ni `premium_hasta`, ni hacer `update perfiles set premium = true`. El trigger responde «premium solo lo cambia el servidor». `premium = true` con `premium_hasta` vacío lo rechaza la tabla.
- [ ] `anon` no puede ejecutar `es_premium()` ni leer la vista `perfiles_insignia`. Los privilegios por defecto ya no conceden eso a `anon` en funciones o tablas nuevas.
- [ ] `suscripciones`: cada persona solo lee sus filas. Puede haber varias. No hay permiso de insertar ni de modificar.
- [ ] `stripe_eventos`: el navegador no la ve. Un aviso repetido no se aplica otra vez.
- [ ] `contenido_premium`: sin ser Premium, un `select` devuelve cero filas. Con Premium, devuelve las de ejemplo, también durante la prueba. No hay permiso de escribir.
- [ ] `lotes`: solo los de esa cuenta, y solo si `es_premium()` es verdadero. Al vencer la fecha, dejan de verse.
- [ ] Storage → `premium` → Public está apagado. La URL pública del archivo no abre. El navegador no puede firmar el enlace. La función `premium-archivo` lo firma 120 segundos y solo si la cuenta es Premium.
- [ ] Un POST al webhook sin cabecera `Stripe-Signature`, o con una firma inventada, responde 400 y no toca `perfiles`.
- [ ] En el repositorio no hay `sk_`, `rk_`, `whsec_` ni `price_`. La clave publicable de Supabase que ya estaba en `config.js` sí puede estar: no administra la base.
- [ ] `ranking_mes` devuelve `nombre` (el apodo) y un sí/no de Premium. No devuelve el correo ni la fecha.
- [ ] Quien acaba de pagar no ve anuncios en la primera página. Los anuncios esperan a saber si la sesión es Premium.
- [ ] Al cerrar la cuenta, Stripe recibe la cancelación antes del borrado.

## Cuando se fusione el concurso (PR #15)

Este cambio **no toca** `concurso.html`, `js/concurso.js`, `css/concurso.css`, `data/concurso.json`, `supabase/CONCURSO.md` ni `supabase/migrations/20261018140200_concurso.sql`.

Al juntar las dos ramas van a chocar estos archivos. Se queda así:

| Archivo | Qué conservar |
|---|---|
| `js/config.js` | Un solo objeto `comunidad` (el de las cuentas, con `concursoPublicado`). Y el objeto `premium` de esta rama (`messenger: "PENDIENTE"`). No crees un segundo `comunidad`: el de abajo pisa al de arriba. |
| `js/site.js` | El concurso se mete **dentro** de `#nav-herramientas`, después de Juegos. Premium se queda **fuera**, antes de Redes. En el pie, las dos líneas: Concurso y Premium. |
| `privacidad.html` y `cookies.html` | El párrafo del concurso y el de Premium. No borres uno para dejar el otro. |
| `sitemap.xml` | Las tres direcciones: concurso, premium y condiciones. |
| `juegos.html` | La versión del concurso. Esta rama no la cambia. |

La insignia del concurso, cuando toque pintarla: en `js/concurso.js`, función `pintarRanking`, el texto del nombre sigue siendo `f.apodo` y ese apodo tiene que ser `perfiles.nombre`. Al lado, si esa persona es Premium, un `<span class="insignia-premium">Premium</span>`. No inventes otro apodo.

El ranking del concurso guarda el apodo y no el id de la cuenta, así que no se puede marcar a todo el mundo con seguridad (dos personas podrían escribir el mismo apodo). El ranking del reto (`ranking_mes`) sí va por id y ya devuelve la columna `premium`. Para el concurso, después de fusionar las dos ramas, una migración nueva puede añadir `usuario uuid` a `concurso_partidas` cuando quien juega ha entrado. La vista `perfiles_insignia` la lee quien ha entrado: id, apodo y el sí/no, sin el correo y sin la fecha. `anon` no la abre.
