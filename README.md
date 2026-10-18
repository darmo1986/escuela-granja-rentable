# Granja Rentable

El dominio público es [granjarentable.com](https://granjarentable.com). `granjarentable.net` ya no se usa. El PR #7 (CNAME de granjarentable.net) queda obsoleto: no fusionarlo. Este cambio sigue en borrador: el archivo `CNAME` no debe llegar a `main` hasta que Namecheap resuelva.

Sitio único para [granjarentable.com](https://granjarentable.com). Se publica desde `main` en GitHub Pages: [darmo1986.github.io/escuela-granja-rentable](https://darmo1986.github.io/escuela-granja-rentable/). Los enlaces son relativos, así que las mismas páginas sirven en `/escuela-granja-rentable/` y, cuando el dominio propio esté activo, en la raíz de granjarentable.com.

El archivo `CNAME` no está en `main`. El primer despliegue lo tenía y GitHub Pages redirigió `darmo1986.github.io/escuela-granja-rentable` a `http://granjarentable.com`, que todavía no resuelve. Con el curso en el aire, el dominio propio se activa después del DNS: en el repositorio, Settings → Pages → Custom domain, escribe `granjarentable.com` y guarda. Eso vuelve a crear el archivo `CNAME`. Hasta entonces no lo subas a mano.

La portada abre con el curso y la tienda. Si no hay un precio confirmado para el país, la ficha dice «Precio próximamente».

Premium está en `/premium` (enlace del menú, fuera del desplegable Herramientas) y en `README_PREMIUM.md`. Sin enlaces de Stripe el botón dice «Próximamente». El curso gratis no se cierra.

La calculadora de rentabilidad está en el menú Herramientas, en una tarjeta del inicio y en `/calculadora`. `/preguntas` dice «Próximamente», no está en el menú ni en el sitemap, y no llama a la base. La cuenta es una para todo el sitio: el botón Entrar está en la cabecera y la página es `/cuenta` (noindex). El apodo se escribe al registrarse, es `perfiles.nombre` y es el único nombre público del reto y del concurso. La regla está en `public.apodo_ok`. No se enseña el nombre de Google. El premio mensual es del concurso: la cifra está solo en `public.premio_euros()` y el navegador la lee de ahí. El reto de `/preguntas` no tiene premio. La guía de enfermedades está en el menú Herramientas y en `/enfermedades`: las fichas se escriben en `_fuentes/enfermedades/articulos.json` (esa carpeta no se publica) y solo se indexan las que están en estado completo. La FAQ fija sigue en `faq.html`. Espacio, alimento y fecha de nacimiento siguen en Calculadoras, en el pie y en «También en el sitio», junto con líneas de aves, lista y guías. Las cifras salen de las lecciones publicadas. El canal `@GranjaRentable` se carga al pulsar. `curso.html` lleva datos de Course, cada ficha de producto lleva Product con el precio del país elegido, y `faq.html` lleva FAQPage con el mismo texto que se ve.

## Qué convierte en este tipo de sitio

- Una promesa clara arriba, con el precio y un solo botón de compra al lado.
- Prueba real (el canal de YouTube, el titular y la dirección) en vez de reseñas inventadas. Los huecos de opiniones están vacíos a propósito.
- El botón dice qué pasa después: «Comprar la incubadora», no «saber más».
- La garantía, Stripe y el WhatsApp están junto al precio.
- En el celular el botón es grande, la página no carga fuentes externas y el nombre de la marca cabe junto a Menú. El botón flotante de WhatsApp (56 px) se ve en todas las pantallas; el pie deja espacio debajo para que no tape el texto.
- Se repite la compra después del precio y de la garantía.

## Audiencia

México 23,5 %, Estados Unidos 15,7 % (en español), Colombia 8,9 %, Perú 7,5 %, España 7,3 %, Argentina 5,5 %, y también Venezuela, Ecuador, República Dominicana y Chile. Si no hay señal, el sitio asume México, no Estados Unidos. El país sale del enlace `?pais=`, de una elección guardada, de la zona horaria y, si esa no dice nada, del idioma. El inglés `en-US` solo no cuenta como Estados Unidos: sin zona horaria de EE. UU. el sitio queda en México.

Precios de la incubadora copiados de la tienda el 14 de octubre de 2026, con el dólar de ese día solo como referencia. El cargo real es el de la página de pago.

## Catálogo (todos los productos que se pudieron leer)

La fuente de la tienda de incubación es `config` de https://granjarentable-incubadora.netlify.app/ (14 de octubre de 2026). Las fotos están en `img/productos/`. Cada ficha está en `producto/`. El menú Tienda abre Incubadoras y Complementos.

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

Argentina y Paraguay no tenían complementos en esa tienda: aquí se ven, con el aviso de que no entran en el pedido.

### Lo que no se pudo bajar de Shopify

El catálogo completo de granjarentable.com no se pudo listar:

- `www.granjarentable.com` no resuelve (no hay DNS).
- `https://granjarentable.com` llega a una IP de Shopify y corta el TLS (`sslv3 alert handshake failure` / `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`). `products.json`, el sitemap y las colecciones no abren.
- `granjarentable.myshopify.com` responde «Store unavailable» y `products.json` da 404.
- Internet Archive no tiene capturas de `/products/`.

Si el dueño pega el export de Shopify (`products.json` o la lista de fichas), se agregan aquí. No inventamos el resto.

## Antes de publicar

El dueño aprobó publicar en GitHub Pages. El DNS de Namecheap sigue pendiente. Las URLs canónicas son `https://granjarentable.com/...` y `og:locale` es `es_419`.

- [ ] **Dominio propio en Pages.** El archivo `CNAME` se quitó de `main` para que el curso siga en GitHub Pages. Cuando el DNS de abajo ya responda, en Settings → Pages → Custom domain guarda `granjarentable.com`. Eso crea el `CNAME`. Después, activa «Enforce HTTPS».
- [ ] **DNS en Namecheap.** Todavía no se aplica. Quitar el aparcamiento y cualquier redirección. No usar un comodín (`*`). Registros del dominio raíz (`@`): A `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. IPv6 opcional: AAAA `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. `www`: CNAME `darmo1986.github.io` (el usuario de GitHub, sin el nombre del repositorio). Cuando resuelva, en GitHub Pages activar «Enforce HTTPS».
- [x] **Apps Script.** `window.GR.formEndpoint` en `js/config.js` ya apunta a `https://script.google.com/macros/s/AKfycbzeq5Oi2e6quRnPmmoEdccLCxgAtZ59OoX3zvHMMIREWggrqMmQnZA6jHYw8p6tONcF/exec`. Si se vuelve a publicar el script y cambia la URL, hay que pegarla otra vez.
- [x] **URLs canónicas.** Cada página lleva `link rel=canonical` a `https://granjarentable.com/` (inicio) o `https://granjarentable.com/<ruta>`. Hasta que el dominio apunte a GitHub Pages, el sitio también puede servirse en `https://darmo1986.github.io/escuela-granja-rentable/`; las canónicas no cambian.
- [x] **Claves de Adsterra.** El sitio aprobado es `granjarentable.com` (sitio 6132524). Cada página lleva un banner de 320×50 en todos los anchos. El 300×250 solo va en el lateral de escritorio a partir de 1100 px, y solo se pide si ese lateral se ve. La clave de 728×90 queda guardada, pero no se usa. Sin tema ni palabras clave. En la UE, el EEE, Reino Unido, Suiza, Brasil o si la zona horaria no dice el país, solo si se aceptan las cookies. En el resto se cargan al entrar y se pueden rechazar. AdSense sigue vacío.
- [ ] **Fotos que faltan.** El suplemento y otras fichas sin precio no tienen foto. Esas fichas no muestran un recuadro de «sin foto» y no están en el sitemap.
- [ ] **Videos L05A–L06C.** El temario está; los mp4 no. Cómo publicarlos, abajo.

## Cómo publicar un video de L05A a L06C

La ficha ya está en `data/curso-web.json`, la fila ya está en `curso.html` y la página está en `lecciones/`. El vídeo sigue fuera hasta que exista el mp4.

1. Copia el mp4 a `videos/` con el nombre de la ficha, por ejemplo `videos/l05a.mp4`. Solo letras minúsculas, números, guion o guion bajo, y extensión `.mp4`.
2. En esa entrada de `data/curso-web.json` pon `"estado": "disponible"` y `"video": "l05a.mp4"`.
3. Opcional: `"minutos": 18` para la duración de la lista. Si no está, la lista dice «Video».
4. Opcional, para que cuente en el progreso y bloquee el examen final: crea `data/examenes/l05a.json` (el mismo formato que `l01.json`) y añade `"examen": "l05a.json"`. Sin ese archivo, el video se puede ver y no bloquea las lecciones anteriores.

`leccion.html?id=l05a` lee el JSON y reproduce `videos/` + el nombre del archivo. L01–L04B siguen en `lecciones/`, con su texto y su test.

## Hueco del video final de L01 a L04B

`videos-finales.html` se quitó del sitio publicado. Cada ficha L01–L04B de `data/curso-web.json` sigue con `"videoFinal": ""`. El curso publicado usa los mp4 actuales de `videos/`. No cambies el `src` de `lecciones/l01.html` (ni L02, L03, L04A, L04B) hasta que el corte final esté aprobado.

## Pendiente

- `window.GR.formEndpoint` en `js/config.js` apunta a la aplicación web de Apps Script. Regístrate, la prueba de la app y Afiliados envían ahí.
- Los videos de las lecciones siguen en `videos/` (unos 250 MB). No hay identificadores de YouTube en el repo ni en `data/curso-web.json`, así que no se cambiaron a un embed. Cuando existan, se pueden poner como `youtube` en cada lección y cargar el reproductor al hacer clic.
- `window.GR.appUrl` vacío: el botón de Android dice «próximamente».
- Facebook: confirma `window.GR.facebookUrl` (`https://www.facebook.com/GranjaRentable`).
- 14 testers con Gmail: el cupo se cuenta en la hoja, no hay un número en vivo.
- Opiniones reales, cuando haya permiso por escrito.
- El código `?ref=` ya se guarda 30 días y se añade al enlace de la tienda. La tienda todavía tiene que copiar ese `ref` al pedido. El pago del 10 % se hace a mano por PayPal desde la hoja (mínimo US$ 20, después de los 14 días). No hay n8n ni una herramienta de pago de afiliados.
- Fichas del curso: L01–L04B usan el texto de cada lección. Los minutos son la duración del video (13, 24, 18, 27 y 29). L05A–L06C se publican con una entrada en `data/curso-web.json` y el mp4 en `videos/` (ver arriba). El vocabulario del curso usa español neutro de Latinoamérica (alimento, costo) y `og:locale` es `es_419`.

## Formularios (gratis, Google Sheets)

Un solo endpoint para Regístrate, la prueba de la app, Afiliados y la lista (`lista.html`, `tipo=lead`). Al guardar la lista, el navegador arma un `.txt` y un `.ics`. No hace falta otra implementación ni volver a desplegar el script: la hoja ya acepta ese tipo.

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

`https://granjarentable.com/?ref=CODIGO`

Eso se guarda en la cookie `gr_ref` y en el navegador 30 días, y el botón de compra de la incubadora lleva `?ref=`. Para liquidar el 10 % sin pagar otra herramienta: cuando entre un pedido, anota el `ref` en la hoja y paga por PayPal al pasar US$ 20 y los 14 días de devolución. Hay una prueba sin comisión en `afiliados.html?ref=DEMO`.

## DNS en Namecheap

Estos registros se crean en Namecheap. No uses un comodín (`*`). Quita el aparcamiento y cualquier redirección. El CNAME de `www` apunta al usuario de GitHub, sin el nombre del repositorio.

Cuando `dig granjarentable.com` devuelva las cuatro direcciones A, en GitHub abre Settings → Pages → Custom domain, guarda `granjarentable.com` y, en cuanto el certificado exista, activa «Enforce HTTPS». Ese paso escribe el archivo `CNAME` en `main`. Hacerlo antes deja el sitio de `github.io` redirigiendo a un dominio que no abre.

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
