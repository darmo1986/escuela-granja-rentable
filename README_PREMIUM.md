# Premium: lo que tienes que hacer tú, Pablo

La web ya tiene la página, el menú y el programa que escucha a Stripe. **Todavía no cobra.** El botón de `/premium` dice «Próximamente» y está apagado hasta que pegues los enlaces de prueba. No hace falta tocar código para eso: solo cuatro líneas de `js/config.js`, que son enlaces públicos, no claves.

No fusiones este cambio antes del PR #12 (cuentas). Premium se apoya en la tabla `perfiles`. El PR #15 (concurso) va después; al final de esta nota está cómo encajarlos sin romper el menú Herramientas.

Trabaja siempre con el interruptor de Stripe en **modo prueba** (Test mode). La tarjeta de prueba no cobra dinero de verdad.

## Qué no se sube a GitHub

Estas tres cosas se pegan solo en Supabase → Project Settings → Edge Functions → Secrets. Si aparecen en un archivo, en un mensaje o en una captura dentro del repositorio, hay que borrarlas y crearlas de nuevo en Stripe.

| Secreto | Dónde lo da Stripe | Nombre en Supabase |
|---|---|---|
| Firma del webhook | Empieza por `whsec_` | `STRIPE_WEBHOOK_SECRET` |
| Clave restringida de prueba | Empieza por `rk_test_` | `STRIPE_SECRET_KEY` |

`js/config.js` solo lleva enlaces que empiezan por `https://buy.stripe.com/`. Eso sí puede estar en el repositorio: no abre tu cuenta.

No pongas `STRIPE_PERMITIR_REAL` todavía. Mientras no exista, un aviso de modo real se ignora y nadie queda Premium por un cobro real accidental.

## 1. Producto y precios, en modo prueba

1. Entra en [dashboard.stripe.com](https://dashboard.stripe.com). Arriba a la derecha, el interruptor tiene que decir que estás en **modo de prueba**. Si dice «real» o «live», cámbialo antes de seguir.
2. Catálogo de productos → Añadir producto. Nombre: **Granja Rentable Premium**.
3. Crea cuatro precios, los cuatro recurrentes, y en cada uno activa **7 días de prueba**:

| Precio | Cada | Moneda |
|---|---|---|
| 4,99 | mes | USD |
| 39 | año | USD |
| 4,99 | mes | EUR |
| 39 | año | EUR |

4. Ajustes → Portal de clientes (Customer portal). Actívalo. Permite cancelar. La cancelación tiene que ser **al final del periodo**, no en el acto: así quien cancela sigue hasta el día que ya pagó.
5. Ajustes → Correos de clientes. Activa el recibo y el aviso antes de que se renueve la suscripción. Ese correo es también la confirmación del desistimiento.
6. Enlaces de pago (Payment Links). Crea **cuatro**, uno por cada precio. En cada uno:
   - pide el correo;
   - activa la casilla de aceptar condiciones;
   - la dirección de las condiciones es `https://granjarentable.com/condiciones-premium.html`.
7. Copia cada enlace (empieza por `https://buy.stripe.com/`) y pégalo en `js/config.js`, dentro de `premium`:

```js
premium: {
  mensualUsd: "https://buy.stripe.com/...",
  anualUsd: "https://buy.stripe.com/...",
  mensualEur: "https://buy.stripe.com/...",
  anualEur: "https://buy.stripe.com/...",
  portal: ""
},
```

`portal` déjalo vacío. Cancelar se hace con el botón «Gestionar suscripción», que abre la página de Stripe para esa cuenta. No hace falta un enlace suelto.

No compartas el enlace de pago en Instagram ni en WhatsApp. La web le añade el número de la cuenta (`client_reference_id`). Sin ese número, Stripe cobra pero no sabemos a quién activar.

## 2. El webhook

1. En Stripe: Desarrolladores → Webhooks → Añadir destino.
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

## 3. La clave restringida

En Stripe: Desarrolladores → Claves de API → Crear clave restringida, en modo prueba.

Permisos, y solo estos:

- Customers: Read
- Subscriptions: Read
- Checkout Sessions: Read
- Billing portal sessions: Write

Esa clave empieza por `rk_test_`. Es la que va en Supabase como `STRIPE_SECRET_KEY`. No uses la clave secreta completa (`sk_test_` o `sk_live_`) si la restringida te deja guardar.

## 4. Secretos en Supabase

Proyecto `apdcgizpgguhmbgzsymx` → Project Settings → Edge Functions → Secrets (o Manage secrets):

- `STRIPE_WEBHOOK_SECRET` = el `whsec_…`
- `STRIPE_SECRET_KEY` = el `rk_test_…`

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya los pone Supabase dentro de la función. No los copies al repositorio. La `service_role` borra la protección de las tablas: solo vive ahí.

## 5. El SQL

1. Supabase → SQL Editor → New query.
2. Abre `supabase/migrations/20261018150000_premium.sql`, selecciona todo, pégalo y pulsa Run.
3. Tiene que decir que terminó sin error. Si el aviso habla del bucket `premium`, créalo a mano: Storage → New bucket → nombre `premium` → **Public desactivado**.
4. No lo vuelvas a ejecutar entero si ya funcionó. Las filas de ejemplo usan «si ya existe, no la toques», pero el resto es para una sola vez.
5. Este SQL no se ha ejecutado desde el repositorio. Quien lo corre eres tú, en el editor.

Orden si todavía no corriste las cuentas: primero `20261018120000_reto.sql`, luego `20261018120100_cuenta.sql`, luego `20261018130000_apodo.sql`, y al final este de Premium. El del concurso (`20261018140200_concurso.sql`) es otro PR: no lo mezcles aquí.

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

## 7. Desplegar las dos funciones

Hace falta el acceso al proyecto. En un ordenador con Node, dentro de la carpeta del repositorio:

```bash
npx supabase login
npx supabase link --project-ref apdcgizpgguhmbgzsymx
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy stripe-portal
```

Si el comando se queja de `supabase/config.toml`, bórralo y vuelve a lanzar los dos deploy. Lo que tiene que cumplirse es `--no-verify-jwt` en el webhook.

`--no-verify-jwt` es obligatorio en el webhook. Stripe no manda el pase de Supabase. La prueba de que el aviso es de Stripe es la firma. Si dejas esa verificación encendida, Stripe recibe un error y nadie se vuelve Premium.

El portal (`stripe-portal`) sí lleva verificación: solo entra quien ya inició sesión.

En el panel de Supabase, en la función `stripe-webhook`, «Enforce JWT» tiene que quedar **apagado**. En `stripe-portal`, encendido.

## 8. La prueba con la tarjeta 4242

1. Publica la web con los cuatro enlaces ya pegados (o ábrela en local).
2. Crea una cuenta en Granja Rentable y entra.
3. Abre Premium. Elige México: tiene que decir US$ 39 al año. Elige España: 39 €, IVA incluido. Prueba también el mensual (US$ 4,99 o 4,99 €).
4. Marca la casilla de condiciones y pulsa «Probar 7 días gratis». Te lleva a Stripe, no a una página nuestra.
5. Tarjeta: `4242 4242 4242 4242`. Fecha: cualquiera futura, por ejemplo `12/34`. CVC: `123`. Código postal: `38008`.
6. Vuelve a Mi cuenta. Tiene que decir que Premium está en vigor y, junto al apodo, la insignia. El apodo es el que escribiste al registrarte, no el correo.
7. En Premium, entra a la lección de ejemplo y pulsa la descarga. El enlace caduca a los dos minutos. Si cierras sesión, la lección desaparece: la base no la entrega.
8. Mi cuenta → Gestionar suscripción. Se abre Stripe. Cancela. Sigues Premium hasta el fin de la prueba o del periodo, y después se apaga cuando Stripe avisa (`customer.subscription.deleted`).
9. Para no esperar 7 días: en Stripe, abre esa suscripción de prueba y termina la prueba (End trial). Mira el webhook: tiene que aparecer en verde. Luego mira Mi cuenta.
10. Para un fallo de pago: otra suscripción de prueba con la tarjeta `4000 0000 0000 0341` (se acepta y falla al cobrar), o reenvía desde Stripe el evento `invoice.payment_failed`. La cuenta deja de ser Premium. Un fallo no alarga el periodo: cuando Stripe marca la suscripción como impagada, el acceso se corta.

Si pagas y no se activa: en Stripe → Webhooks mira el envío. Una respuesta `Firma` significa que el `whsec_` no es el de este destino. Una respuesta `sin usuario` significa que el enlace se abrió sin pasar por el botón de la web.

## 9. Antes de cobrar dinero de verdad

No quites el modo prueba hasta que el gestor confirme el IVA (en euros el precio de la página ya dice «IVA incluido», pero el tipo y la declaración no están cerrados), los impuestos de Latinoamérica si aplican, y cómo se hace la factura. Está marcado en amarillo en `condiciones-premium.html` y en la privacidad.

Cuando el gestor dé el visto bueno:

1. Repite los precios y los enlaces en modo **real**.
2. Nuevo webhook, en modo real, a la misma dirección. El `whsec_` de prueba no sirve para el real: actualiza el secreto.
3. Clave restringida de modo real, y sustitúyela en Supabase.
4. Añade el secreto `STRIPE_PERMITIR_REAL` con el valor `si`. Sin eso, la función ignora los cobros reales a propósito.
5. Cambia los cuatro enlaces de `js/config.js` por los de modo real y publica.

## Qué hace cada pieza

- `/premium.html` — la oferta. El país España ve euros con IVA; el resto, dólares. El botón solo se enciende si hay un enlace `https://buy.stripe.com/` o `https://checkout.stripe.com/` y la persona aceptó las condiciones.
- `js/premium.js` — arma el enlace con el id de la cuenta y el correo. No habla con la clave secreta.
- `supabase/functions/stripe-webhook` — comprueba la firma, y solo entonces escribe `perfiles.premium`, `premium_hasta` y la fila de `suscripciones`.
- `supabase/functions/stripe-portal` — abre la página de Stripe para cancelar o cambiar la tarjeta. Exige haber entrado.
- `supabase/migrations/20261018150000_premium.sql` — tablas, reglas y dos ejemplos.

Alta y renovación (`active` o `trialing`): Premium hasta el fin de ese periodo. Cancelar al final del periodo: sigue `active` hasta ese día y luego Stripe manda `deleted` y se apaga. Fallo de pago (`past_due`, `unpaid`, `canceled`): se apaga. Nadie puede ponerse Premium con una llamada desde el navegador.

## Comprobación de seguridad

Esto se puede mirar en Supabase → Authentication no, en el SQL Editor, con la cuenta de una persona de prueba (no con la `service_role`).

- [ ] `perfiles`: el navegador puede leer `premium` y puede cambiar `nombre` y `dispositivo`. No puede hacer `update perfiles set premium = true`. El trigger responde «premium solo lo cambia el servidor».
- [ ] `suscripciones`: cada persona solo lee su fila. No hay permiso de insertar ni de modificar.
- [ ] `contenido_premium`: sin ser Premium, un `select` devuelve cero filas. Con Premium, devuelve las de ejemplo. No hay permiso de escribir.
- [ ] `lotes`: solo los de esa cuenta, y solo si `es_premium()` es verdadero. Al vencer la fecha, dejan de verse.
- [ ] Storage → `premium` → Public está apagado. La URL pública del archivo no abre. El enlace firmado dura 120 segundos y solo se crea si la cuenta es Premium.
- [ ] Un POST al webhook sin cabecera `Stripe-Signature`, o con una firma inventada, responde 400 y no toca `perfiles`.
- [ ] En el repositorio no hay `sk_`, `rk_` ni `whsec_`. La clave publicable de Supabase que ya estaba en `config.js` sí puede estar: no administra la base.
- [ ] `ranking_mes` devuelve `nombre` (el apodo) y un sí/no de Premium. No devuelve el correo.
- [ ] Los anuncios se apagan en el navegador si la cuenta es Premium. Eso no protege un archivo: los archivos no están en GitHub.

## Cuando se fusione el concurso (PR #15)

Este cambio **no toca** `concurso.html`, `js/concurso.js`, `css/concurso.css`, `data/concurso.json`, `supabase/CONCURSO.md` ni `supabase/migrations/20261018140200_concurso.sql`.

Al juntar las dos ramas van a chocar estos archivos. Se queda así:

| Archivo | Qué conservar |
|---|---|
| `js/config.js` | Un solo objeto `comunidad` (el de las cuentas, con `concursoPublicado`). Y el objeto `premium` de esta rama. No crees un segundo `comunidad`: el de abajo pisa al de arriba. |
| `js/site.js` | El concurso se mete **dentro** de `#nav-herramientas`, después de Juegos. Premium se queda **fuera**, antes de Redes. En el pie, las dos líneas: Concurso y Premium. |
| `privacidad.html` y `cookies.html` | El párrafo del concurso y el de Premium. No borres uno para dejar el otro. |
| `sitemap.xml` | Las tres direcciones: concurso, premium y condiciones. |
| `juegos.html` | La versión del concurso. Esta rama no la cambia. |

La insignia del concurso, cuando toque pintarla: en `js/concurso.js`, función `pintarRanking`, el texto del nombre sigue siendo `f.apodo` y ese apodo tiene que ser `perfiles.nombre`. Al lado, si esa persona es Premium, un `<span class="insignia-premium">Premium</span>`. No inventes otro apodo.

El ranking del concurso guarda el apodo y no el id de la cuenta, así que no se puede marcar a todo el mundo con seguridad (dos personas podrían escribir el mismo apodo). El ranking del reto (`ranking_mes`) sí va por id y ya devuelve la columna `premium`. Para el concurso, después de fusionar las dos ramas, una migración nueva puede añadir `usuario uuid` a `concurso_partidas` cuando quien juega ha entrado. Hasta entonces, la vista `perfiles_insignia` deja leer id, apodo y el sí/no, sin el correo.
