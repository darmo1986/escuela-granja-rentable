# Cobro del pack y del kit por enlace: cómo instalarlo

Archivo: `Codigo-kit-pack.gs`. Va en el proyecto Apps Script **«Granja Rentable formularios»**, el mismo que ya cobra los ebooks y cuya URL `/exec` usa la web. **No está instalado.** Nadie ha tocado el Apps Script real.

## Qué hace

| Clave | Precio | Cómo se entrega |
|---|---|---|
| `pack-4-ebooks` | 6,00 USD | Correo con un enlace a los 4 PDF (o a un ZIP) |
| `kit-granja-en-orden` | 12,00 USD | Correo con un enlace a `Kit-Granja-en-Orden.zip` |
| `kit-tras-ebook` | 10,00 USD | Igual que el kit. Solo funciona con un token de oferta |

- **PayPal**: `tipo:"paypal-digital"` con `accion:"crear"` y luego `accion:"capturar"`. Antes de entregar comprueba que el estado es COMPLETED, que el importe es exacto y que la moneda es USD. La clave del producto se saca del pedido que creó el servidor, nunca del navegador.
- **Stripe**: `tipo:"stripe-digital"` con `accion:"crear"`, que abre Checkout en USD, y luego `accion:"confirmar"`. Comprueba que la sesión está `paid` y que el importe es exacto. La página de vuelta la fija el servidor:
  - el pack vuelve a `ebooks.html`;
  - el kit y la oferta vuelven a `kit.html`.
  En ambos casos con `?stripe_digital=` (o `?stripe_digital_cancelado=1`). No choca con el `?stripe_session=` de los ebooks.
- **Oferta de 10 $**: `tipo:"oferta-kit"` con `accion:"emitir"` recibe el `orderID` de PayPal o el `sessionId` de Stripe del ebook recién pagado. Si ese pago es de **2,00 USD**, está completado y no tiene más de **48 h**, devuelve un token de un solo uso. Solo se emite un token por cada pago de ebook. Los tokens se guardan en la hoja **«Ofertas kit»** y el token se gasta al cobrar el kit.
- **Registro sin duplicados**: cada venta va a la hoja **«Ventas digitales»**, con la referencia de pago, el email, el token de descarga, la caducidad y el número de descargas. Si llega dos veces la misma captura o confirmación, se responde `ya_enviado` y no se vuelve a enviar el correo.
- **Entrega**: el correo lleva el enlace `URL_EXEC?descarga=TOKEN`, que vale 30 días y como mucho 15 aperturas. Ese enlace abre una página con el botón de descarga del archivo de Drive.

## Pasos (los hace Pablo, con la cuenta dueña del proyecto)

1. **Sube los archivos a Drive** con la misma cuenta del script:
   - `Kit-Granja-en-Orden.zip` (está en `/workspace/plan-1000/kit/`).
   - Para el pack, los 4 PDF o un ZIP con los 4.

   Compártelos como «Cualquier persona con el enlace: lector». Apunta el ID de cada archivo: es lo que va entre `/d/` y `/view` en la URL de Drive.

2. **Añade las Propiedades del script** (Configuración del proyecto → Propiedades del script):
   - `DIGITAL_DRIVE_KIT`: el ID del ZIP del kit.
   - `DIGITAL_DRIVE_PACK_4_EBOOKS`: el ID del ZIP del pack, o los 4 IDs separados por comas (saldrá un botón por archivo).
   - **Las credenciales de PayPal y Stripe ya existen**, porque las usan los ebooks. Mira con qué nombre están guardadas y, si no coinciden con los de este archivo, cambia **solo** estas tres líneas del `.gs` (no copies las claves en el código):
     - `PROP_PAYPAL_ID`, `PROP_PAYPAL_SECRET` y `PROP_PAYPAL_ENTORNO`. Por defecto valen `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` y `PAYPAL_ENTORNO`; este último puede ser `live` o `sandbox`. Si el código de los ebooks decide el entorno de otra forma, copia esa lógica dentro de `paypalBase_()`.
     - `PROP_STRIPE_SECRET`. Por defecto vale `STRIPE_SECRET_KEY`.

3. **Pega el archivo**: Archivos → + → Script, con el nombre `Codigo-kit-pack`, y copia dentro el contenido de `Codigo-kit-pack.gs`.

4. **Engancha el archivo en `Codigo.gs`** (son dos cambios pequeños):
   - En `doPost`, justo después de `if (p._gotcha) return json_({ ok: true });`:
     ```js
     var dig = digital_router_(p);
     if (dig) return json_(dig);
     ```
   - Cambia `function doGet() {` por `function doGet(e) {` y pon esto como primera línea:
     ```js
     var des = digital_doGet_(e); if (des) return des;
     ```
     Si el código de los ebooks ya tiene su propio `doGet`, añade la línea en ese. Solo puede haber **un** `doGet` en todo el proyecto.

5. **Correo desde ventas@granjarentable.com**: el script solo puede enviar «como» `ventas@` si esa dirección es un alias de «Enviar como» en el Gmail de la cuenta dueña del script (Gmail → Configuración → Cuentas). Si no lo es, el correo sale de esa cuenta con el nombre «Pablo · Granja Rentable» y con «Responder a» `ventas@granjarentable.com`. Al usar `GmailApp`, Google pedirá un permiso nuevo sobre Gmail.

6. **Prueba en sandbox antes de publicar**:
   - Pon `PAYPAL_ENTORNO = sandbox` y usa la clave `sk_test_…` de Stripe en una copia del proyecto, o en un despliegue de prueba.
   - Ejecuta `probarCorreoEntregaDigital()` desde el editor. Te llegará el correo de entrega; el enlace de prueba dirá «Enlace no válido», y eso es lo esperado.
   - Compra el pack y el kit con PayPal sandbox y con la tarjeta de prueba `4242 4242 4242 4242`. Comprueba lo siguiente:
     - aparecen filas en «Ventas digitales»;
     - llega el correo y el enlace descarga el archivo;
     - si repites la confirmación, responde «ya estaba entregado».
   - Compra un ebook de 2 $ en sandbox. Comprueba que aparece la oferta, que el kit sale a 10 $, que la oferta no se puede repetir con el mismo token y que con un token falso responde «Esta oferta ya no es válida».

7. **Despliega**: Implementar → Gestionar implementaciones → editar la que ya existe → Nueva versión. **No crees una implementación nueva**, porque eso cambiaría la URL `/exec` que usa la web.

8. Solo después de todo lo anterior se fusiona la rama `feat/kit-pack`. Si la web se publica antes, los botones del pack y del kit darán error.

## Riesgos que conviene conocer

- **Los archivos de Drive se comparten por enlace.** Quien tenga el ID del archivo puede descargarlo, y el ID se ve en el botón. El token del correo cuenta las aperturas, pero no oculta el archivo. Para cerrarlo del todo habría que servir el archivo desde el script, algo que Apps Script no hace bien por encima de unos 10 MB. El ZIP del kit pesa unos 350 KB, así que en el kit sí sería posible si se quiere.
- **Si el comprador paga la oferta con un token ya usado** (por ejemplo, con dos pestañas a la vez), se le entrega igual y se anota un aviso en los registros. No se le cobra de más que el precio fijado.
- **IVA (OSS) de las ventas digitales en la UE**: está pendiente de la gestoría. Los precios se muestran tal cual, en USD.
