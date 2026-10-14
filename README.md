# Granja Rentable

Borrador del sitio único para [granjarentable.net](https://granjarentable.net). No está publicado: el DNS de Porkbun no se tocó.

La tienda propia es lo primero (botón del inicio y primer enlace del menú). El curso es gratis. Recomendados queda debajo: Mercado Libre en Latinoamérica y eBay en España y Estados Unidos. No hay Amazon.

## Qué convierte en este tipo de sitio

- Una promesa clara arriba, con el precio y un solo botón de compra al lado.
- Prueba real (el canal de YouTube, el titular y la dirección) en vez de reseñas inventadas. Los huecos de opiniones están vacíos a propósito.
- El botón dice qué pasa después: «Comprar la incubadora», no «saber más».
- La garantía, Stripe y el WhatsApp están junto al precio.
- En el celular el botón es grande, la página no carga fuentes externas y el nombre de la marca cabe junto a Menú. El botón flotante de WhatsApp (56 px) se ve en todas las pantallas; el pie deja espacio debajo para que no tape el texto.
- Se repite la compra después del precio y de la garantía. Recomendados no compite con la incubadora.

## Audiencia

México 23,5 %, Estados Unidos 15,7 % (en español), Colombia 8,9 %, Perú 7,5 %, España 7,3 %, Argentina 5,5 %, y también Venezuela, Ecuador, República Dominicana y Chile. Si no hay señal, el sitio asume México, no Estados Unidos. El país sale del enlace `?pais=`, de una elección guardada, de la zona horaria y, si esa no dice nada, del idioma. El inglés `en-US` solo no cuenta como Estados Unidos: sin zona horaria de EE. UU. el sitio queda en México.

Precios de la incubadora copiados de la tienda el 14 de octubre de 2026, con el dólar de ese día solo como referencia. El cargo real es el de la página de pago.

## Catálogo (todos los productos que se pudieron leer)

La fuente de la tienda de incubación es `config` de https://granjarentable-incubadora.netlify.app/ (14 de octubre de 2026). Las fotos están en `img/productos/`. Cada ficha está en `producto/`. El menú Tienda abre Incubadoras, Complementos y Salud avícola.

| Producto | En esta tienda | Origen |
| --- | --- | --- |
| Incubadora automática 24Egg Dual | Sí. México, Perú, España, Argentina y Paraguay. En Estados Unidos el botón lleva a la WONEGG. | `product.id` de la tienda de incubación |
| Incubadora automática WONEGG 48 huevos | Sí. Solo Estados Unidos, US$ 119. | Bloque de país US |
| Corralito plegable para pollitos | Sí. Solo Estados Unidos, US$ 77.99. | Complemento `corralito` |
| Bombilla infrarroja para criadora | Sí. Solo Estados Unidos, US$ 49.99. | Complemento `bombilla` |
| Termohigrómetro de aguja | Sí. Perú, México, España y Estados Unidos, cada uno con su precio. | Complemento `termohigrometro` |
| Báscula de precisión 0,01 g | Sí. Perú, México, España y Estados Unidos. | Complemento `bascula` |
| Medidor de pH del agua | Sí. En Perú, México y España se muestra como «Medidor digital de pH del agua». | Complemento `medidorph` |
| Alfombrilla antideslizante | Sí. En Perú, México y España se llama «Tapete antideslizante». | Complemento `alfombrilla` |
| Comedero 3 kg + bebedero 3 L | Sí. España (47,99 €) y Estados Unidos (US$ 34.99). | Complemento `comedero` |
| Anillas identificadoras (50 uds.) | Sí. Solo Estados Unidos, US$ 14.99. | Complemento `anillas` |
| Vitaminas y electrolitos en polvo para pollitos | Sí, como próximamente, sin precio ni foto. Así estaba en el origen. | Complemento `suplemento` (`soon`) |
| Tabletas 30 g para fiebre y resfriado en gallinas | Sí. Precio publicado 18,99 € (antes 24,99 €). Sin foto. El pedido va por WhatsApp. | Ficha pública de granjarentable.com |

Argentina y Paraguay no tenían complementos en esa tienda: aquí se ven, con el aviso de que no entran en el pedido.

### Lo que no se pudo bajar de Shopify

El catálogo completo de granjarentable.com no se pudo listar:

- `www.granjarentable.com` no resuelve (no hay DNS).
- `https://granjarentable.com` llega a una IP de Shopify y corta el TLS (`sslv3 alert handshake failure` / `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`). `products.json`, el sitemap y las colecciones no abren.
- `granjarentable.myshopify.com` responde «Store unavailable» y `products.json` da 404.
- Internet Archive no tiene capturas de `/products/`.
- El índice público solo devolvió una ficha: las tabletas de 30 g. No apareció otra URL de producto.

Si el dueño pega el export de Shopify (`products.json` o la lista de fichas), se agregan aquí. No inventamos el resto.

## Pendiente

- `window.GR.formEndpoint` en `js/config.js` apunta a la aplicación web de Apps Script. Regístrate, la prueba de la app y Afiliados envían ahí.
- Los videos de las lecciones siguen en `videos/` (unos 250 MB). No hay identificadores de YouTube en el repo ni en `data/curso-web.json`, así que no se cambiaron a un embed. Cuando existan, se pueden poner como `youtube` en cada lección y cargar el reproductor al hacer clic.
- Identificadores de Mercado Libre (`redes.mercadolibre.ids`) y de eBay (`redes.ebay.es` y `.com`: `campid` y `mkrid`) vacíos. El enlace abre la búsqueda igual.
- `window.GR.appUrl` vacío: el botón de Android dice «próximamente».
- Facebook: confirma `window.GR.facebookUrl` (`https://www.facebook.com/GranjaRentable`).
- 14 testers con Gmail: el cupo se cuenta en la hoja, no hay un número en vivo.
- Opiniones reales, cuando haya permiso por escrito.
- El código `?ref=` ya se guarda 30 días y se añade al enlace de la tienda. La tienda todavía tiene que copiar ese `ref` al pedido. El pago del 10 % se hace a mano por PayPal desde la hoja (mínimo US$ 20, después de los 14 días). No hay n8n ni una herramienta de pago de afiliados.
- Fichas del curso: L01–L04B usan el texto de cada lección. Los minutos son la duración del video (13, 24, 18, 27 y 29). L05A–L06C no tienen video: el temario sale del índice ya publicado y la duración dice «Por publicar».

## Formularios (gratis, Google Sheets)

Un solo endpoint para Regístrate, la prueba de la app y Afiliados.

1. Crea una hoja de Google en blanco. El nombre del archivo puede ser «Granja Rentable — formularios».
2. Extensiones → Apps Script. Borra el código de ejemplo y pega `apps-script/Codigo.gs`. Guarda.
3. Implementar → Nueva implementación → Tipo: Aplicación web.
4. Ejecutar como: Yo. Quién tiene acceso: Cualquier persona. Implementar y autorizar el permiso de la hoja.
5. Copia la URL que termina en `/exec`.
6. Pégala en `js/config.js`:

```js
formEndpoint: "https://script.google.com/macros/s/XXXX/exec",
```

7. Abre esa URL en el navegador: debe decir que el formulario está publicado. Si pide iniciar sesión, la implementación no quedó en «Cualquier persona».
8. En el sitio, envía un alta de prueba y mira la pestaña `Respuestas`.

Cada fila trae fecha, tipo (`registro`, `beta` o `afiliado`), nombre, correo, si quiere la app, PayPal, país, código `ref` y la página de origen. Para los 14 testers, filtra `tipo = beta` y correos `@gmail.com`.

Si vuelves a publicar el script, Apps Script puede cambiar la URL. Actualiza `formEndpoint`.

## Afiliados, sin servicio de pago

El alta cae en la misma hoja. Cuando apruebes a alguien, inventa un código corto (letras, números, guion) y pásale:

`https://granjarentable.net/?ref=CODIGO`

Eso se guarda en la cookie `gr_ref` y en el navegador 30 días, y el botón de compra de la incubadora lleva `?ref=`. Para liquidar el 10 % sin pagar otra herramienta: cuando entre un pedido, anota el `ref` en la hoja y paga por PayPal al pasar US$ 20 y los 14 días de devolución. Mercado Libre y eBay no entran en ese 10 %. Hay una prueba sin comisión en `afiliados.html?ref=DEMO`.

## DNS en Porkbun (no aplicar todavía)

El archivo `CNAME` ya dice `granjarentable.net`. No lo actives en GitHub Pages ni en Porkbun hasta que quieras publicar. Al fusionar esta rama, GitHub Pages puede esperar el dominio: hazlo solo cuando vayas a cambiar el DNS.

Quita el aparcamiento y cualquier redirección de Porkbun. No uses un comodín (`*`).

Registros A del dominio raíz (`@`):

| Tipo | Host | Valor |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

IPv6, opcional:

| Tipo | Host | Valor |
| --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

`www`:

| Tipo | Host | Valor |
| --- | --- | --- |
| CNAME | www | darmo1986.github.io |

El CNAME apunta al usuario de GitHub, sin el nombre del repositorio. Cuando resuelva, en GitHub Pages activa «Enforce HTTPS». Antes, en el repositorio, verifica el dominio para que nadie lo ocupe.

## Cómo se ve en local

```bash
python3 -m http.server 8765
```

Abre `http://127.0.0.1:8765/?pais=MX`.
