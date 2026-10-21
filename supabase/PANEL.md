# Panel de tráfico y avisos de compra

La página ya está en la web: **https://granjarentable.com/panel.html**
Es privada: sin entrar con la cuenta de administrador enseña un aviso y nada más.
No está enlazada en ningún menú ni en el sitemap, y lleva `noindex`.

## Qué enseña

- Visitas de la web: hoy, últimos 7 días y últimos 30 días.
- Las páginas más vistas de la semana.
- **Intenciones de compra**: cada clic en «Comprar» (tienda) o en un WhatsApp
  de producto, con el producto y la hora. Si hay alguna hoy, sale un aviso
  grande en rojo al abrir el panel.
- El estado de cada aviso (activo o pendiente y por qué).

Una intención **no es una venta**: es el clic justo antes de ir a la tienda
(Stripe, alojada en Netlify) o de abrir WhatsApp. La venta confirmada solo la
sabe Stripe.

## Qué registra la web (y qué no)

Desde que se encienda, `js/site.js` apunta una fila por página vista y una
por clic de compra. Sin cookies nuevas, sin IP, sin huella del aparato y sin
ningún dato personal: solo la ruta, el dominio de origen (si viene de Google,
etc.) y el país elegido en la web. Las filas van a Supabase
(`public.visitas` y `public.intenciones_compra`). Nadie puede leerlas desde
el navegador: solo salen por dos funciones con control de acceso.

## Encendido (una vez, unos 10 minutos)

1. **Base de datos.** En supabase.com → proyecto `granja-rentable-web` →
   SQL Editor, ejecuta en orden los archivos de `supabase/migrations/` que
   falten. El de este panel es `20261020193000_panel.sql` (va el último).
2. **Marcar al administrador.** Entra una vez en la web con tu cuenta
   (registro.html) para que exista tu fila, y después, en el mismo SQL Editor:
   `update public.perfiles set es_admin = true where id = (select id from auth.users where email = 'TU_CORREO');`
3. **Aviso por correo al pulsar Comprar** (opcional pero recomendado).
   En la hoja de Google de los formularios → Extensiones → Apps Script:
   sustituye el código por el `apps-script/Codigo.gs` de este repositorio y
   redespliega la aplicación web (Implementar → Nueva implementación, misma
   URL). Desde ese momento, cada intención manda un correo a
   `pablopersonal86@gmail.com` (se cambia en la constante `CORREO_AVISO`).
   La URL `/exec` no cambia si redespliegas sobre la misma aplicación.
4. **Cloudflare Web Analytics** (opcional). En dash.cloudflare.com →
   Analytics → Web Analytics → «Add a site» con granjarentable.com. Copia el
   token y pégalo en `js/config.js`, en `GR.analitica.cfToken`. La baliza se
   inyecta sola desde `js/site.js`. Es sin cookies y no molesta a AdSense.
   Sirve de contraste: el panel propio es la fuente principal.

## Aviso de venta confirmada (Stripe)

La tienda cobra en Stripe (fuera de esta web), así que el aviso de **pago**
solo puede salir de Stripe: en su panel → Settings → Emails, activar el
correo de pago correcto (y el de recibo al cliente). Hasta hacerlo, las
ventas se ven en el propio panel de Stripe; las intenciones, aquí.

## Revisión diaria automática

Hay una función pensada para consultarla cada día sin entrar en el panel:

```
POST https://apdcgizpgguhmbgzsymx.supabase.co/rest/v1/rpc/estadisticas_publicas
Cabeceras: apikey: <clave publicable de js/config.js> · Content-Type: application/json
Cuerpo: {}
```

Devuelve solo cifras: visitas de hoy y de 7 días, intenciones de hoy y de
7 días y los productos con intención hoy. Sin filas y sin datos personales.
Antes de encender la base de datos responde 404: ese es el «todavía no».
