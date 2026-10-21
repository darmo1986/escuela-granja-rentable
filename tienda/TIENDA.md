# Tienda nueva de Granja Rentable (`/tienda/`)

Tienda de dropshipping curado sobre AliExpress, dentro de la web
principal (GitHub Pages). Sustituye a futuro a la tienda vieja de
`tienda.html` (que hoy sigue enlazando a Netlify): **la navegación del
sitio sigue apuntando a `tienda.html` hasta que Pablo verifique la
nueva y dé la orden de cambiar**. Cambiar entonces será editar el
enlace «Tienda» de los bloques de menú (`menu:inicio/fin`) y del pie
(`pie-sitio`) de `tienda.html` → `tienda/`, y retirar la vieja.

## Cómo funciona

- `tienda/index.html` — portada: parrilla de productos por categoría.
- `tienda/producto.html?p=<slug>` — ficha del producto (JS).
- `tienda/catalogo.js` — los datos: `window.GR_TIENDA_CATALOGO`.
  **El catálogo es el único archivo que hay que tocar para vender.**
- `tienda/tienda.js` — la lógica del escaparate (no tocar sin necesidad).
- `tienda/tienda.css` — estilos propios sobre `css/estilo.css`.
- `tienda/check_stock.py` — vigilancia diaria de enlaces (ver abajo).

## Revelado SOLO por IP (sin selector)

Cada visitante ve **únicamente** el catálogo de su país, detectado por
IP (ipapi.co; respaldo: `/cdn-cgi/trace` de Cloudflare; caché de 7 días
en `localStorage`). **No hay selector de país en la interfaz**: nadie
puede curiosear el catálogo de otro país.

Despliegue por países, en este orden (decisión de Pablo, 20-oct-2026):

1. **MX — México** (primero: precios en MXN, plazos MX)
2. **ES — España** (EUR)
3. **US — Estados Unidos** (USD)
4. Después: CO, AR, PE, CL (en `orden_paises` del catálogo, inactivos)

Si el país detectado no está en `paises_activos`, la tienda muestra el
estado «Estamos llegando a tu país» con el botón de WhatsApp, sin
ningún producto. Sin señal de IP se asume MX (primer mercado).

**Vista previa del dueño** (no aparece en la interfaz): añadir
`?pais=XX` a la URL — `/tienda/?pais=CO` enseña el estado «llegando» de
Colombia; `/tienda/?pais=ES`, el catálogo de España. Se guarda en la
sesión para navegar a las fichas sin perderlo.

## Filtros de curaduría (obligatorios, sin excepciones)

Un producto entra SOLO si supera **todos**:

1. Nota media **≥ 4,5** estrellas en AliExpress.
2. **Volumen sólido** de pedidos (ideal 500+; el lote 1 va de 600+ a 2.269).
3. Vendedor con **≥ 95 % de valoraciones positivas**.
4. Vendedor con **años de historial**.
5. **Fotos reales de compradores** en el anuncio.
6. Preferencia **Choice** o almacén que sirva bien al país del cliente.

Accesorios de bajo riesgo primero. **Incubadoras solo si un anuncio es
excepcionalmente probado** (en el lote 1 ninguna lo fue: fuera).

> ⚠️ **Puerta previa a publicar (importante):** desde la web pública
> AliExpress solo deja ver la nota y los vendidos (las fichas completas
> son de la app y los rastreadores devuelven guías de compra). Los
> filtros 1 y 2 están verificados y escritos en el campo
> `verificacion` de cada producto. Los filtros 3, 4, 5 y 6 deben
> confirmarse **en la app de AliExpress** para los 12 productos de
> los lotes 1 y 2 antes de desplegar la tienda; los campos `vendedor`
> van a `null` hasta entonces, a propósito: la ficha pública no
> muestra datos de vendedor que no estén confirmados.

## Política de almacén local (decisión de Pablo, 21-oct-2026)

**Prioridad a los proveedores con stock en almacén local del país del
cliente** (AliExpress Choice / envío local), para recortar los plazos
de entrega. Refuerza el filtro 6 y se aplica así:

- En los lotes futuros, un anuncio con almacén local para el país
  pasa por delante de otro equivalente que solo envíe desde China.
- Los anuncios que **solo envían desde China quedan relegados**: solo
  entran si no existe alternativa con almacén local que supere todos
  los filtros.
- La ficha pública **nunca etiqueta un producto «desde China»**: el
  texto de envío es el verificado por producto (`origen_envio` y
  `dias_envio` del catálogo), sin cambiarlo por esta política.
- **Plazo máximo aceptable (21-oct-2026): 30 días es demasiado.** Un
  producto cuyo plazo de entrega al cliente se acerque a 30 días no
  entra en el catálogo; el objetivo es el envío desde almacén local
  con plazos cortos (los declarados hoy: MX 10–15 d, ES 7–12 d,
  US 8–12 d).
- Esta política **no cambia ningún dato hoy**: los 12 productos
  actuales mantienen sus plazos y su `origen_envio` declarados
  (internacional con seguimiento) hasta confirmar su almacén en la
  app. Nada de «envío local» sin verificar.

### Pendiente de confirmar almacén local (en la app de AliExpress)

El estado de almacén de los 12 productos actuales **no es verificable
desde este entorno** (la web pública no lo muestra). Quedan todos
pendientes de confirmación por Pablo en la app:

| Producto | Almacén local MX/ES/US |
|---|---|
| Copas de bebedero automáticas (pack 6) | ⏳ Sin confirmar |
| Tetinas con copa colgante (pack 10) | ⏳ Sin confirmar |
| Kit de puertos para comedero de cubo | ⏳ Sin confirmar |
| Ovoscopio LED portátil | ⏳ Sin confirmar |
| Termostato STC-1000 para incubadora | ⏳ Sin confirmar |
| Termostato de enchufe con sonda y temporizador | ⏳ Sin confirmar |
| Módulo termostato W1209 12 V con caja y sonda | ⏳ Sin confirmar |
| Mini termohigrómetros para incubadora (pack 5) | ⏳ Sin confirmar |
| Puerta automática de gallinero solar | ⏳ Sin confirmar |
| Anillas de clip numeradas (pack 100) | ⏳ Sin confirmar |
| Huevos falsos de nido (pack 12) | ⏳ Sin confirmar |
| Báscula de precisión 0,01 g para huevos | ⏳ Sin confirmar |

**Regla al confirmar:** el producto que resulte enviar **solo desde
China** para un país (sin stock en almacén local) será **sustituido
por una alternativa con almacén local** que supere los filtros o, si
no la hay, **retirado del catálogo de ese país** (`disponible: false`)
o del catálogo entero. Al confirmar un almacén local real, se
actualiza ese país a `origen_envio: "local"` con sus días reales.

## Lote 1 — productos aceptados (verificados el 21-oct-2026)

| Producto | Nota | Vendidos | Base US$ | MX | ES | US | Estado |
|---|---|---|---|---|---|---|---|
| Copas de bebedero automáticas (pack 6) | 4,9 | 1,000+ | 6,54 | 349 MXN · 10–15 d | 15,99 € · 7–12 d | 17,99 $ · 8–12 d | ✅ nota+volumen |
| Tetinas con copa colgante (pack 10) | 4,5 | 1,000+ | ~5,50 | 299 MXN · 10–15 d | 12,99 € · 7–12 d | 15,49 $ · 8–12 d | ✅ nota+volumen |
| Kit de puertos para comedero de cubo | 4,6 | 2,269 | 17,57 | 699 MXN · 10–15 d | 33,99 € · 7–12 d | 37,99 $ · 8–12 d | ✅ nota+volumen |
| Ovoscopio LED portátil | 4,6 | 600+ | 27,81 | 999 MXN · 10–15 d | 47,99 € · 7–12 d | 54,49 $ · 8–12 d | ✅ nota+volumen |

Precios por país **derivados** (coste base + envío estimado al país,
con margen) y marcados `precio_confirmado: false`: Pablo los confirma
antes de publicar, como manda la convención del sitio. Todos los
envíos del lote 1 son **internacionales con seguimiento** (ningún
anuncio verificado garantizaba almacén local en MX/ES/US); la ficha lo
dice tal cual, sin disfrazarlo de envío local. Tipos usados:
1 USD = 18,36 MXN y 0,893 EUR (los de `js/config.js`, 14-oct-2026).

## Lote 2 — productos aceptados (verificados el 21-oct-2026)

Ampliación en categorías nuevas (repuestos de incubación, gallinero e
identificación). Mismas reglas que el lote 1: precios derivados con
`precio_confirmado: false`, envíos internacionales con seguimiento y
`vendedor` a `null` hasta confirmar los filtros 3–6 en la app.

| Producto | Nota | Vendidos | Base US$ | MX | ES | US | Estado |
|---|---|---|---|---|---|---|---|
| Termostato STC-1000 para incubadora | 4,8 | 5,000+ | 3,99 | 249 MXN · 10–15 d | 10,99 € · 7–12 d | 12,99 $ · 8–12 d | ✅ nota+volumen |
| Termostato de enchufe con sonda y temporizador | 4,9 | 2,000+ | 8,98 | 399 MXN · 10–15 d | 18,99 € · 7–12 d | 21,99 $ · 8–12 d | ✅ nota+volumen |
| Módulo termostato W1209 12 V con caja y sonda | 4,8 | 1,000+ | 2,99 | 199 MXN · 10–15 d | 8,99 € · 7–12 d | 10,99 $ · 8–12 d | ✅ nota+volumen |
| Mini termohigrómetros para incubadora (pack 5) | 4,8 | 10,000+ | 5,45 | 299 MXN · 10–15 d | 13,99 € · 7–12 d | 15,99 $ · 8–12 d | ✅ nota+volumen |
| Puerta automática de gallinero solar | 4,6 | 810/mes | 39,99 | 1.469 MXN · 10–15 d | 69,99 € · 7–12 d | 79,99 $ · 8–12 d | ⚠️ evidencia secundaria |
| Anillas de clip numeradas (pack 100) | 4,5 | 500+ | 2,99 | 199 MXN · 10–15 d | 8,99 € · 7–12 d | 10,99 $ · 8–12 d | ✅ nota+volumen |
| Huevos falsos de nido (pack 12) | 4,5 | 2,000+ | 3,96 | 249 MXN · 10–15 d | 10,99 € · 7–12 d | 12,99 $ · 8–12 d | ✅ nota+volumen |
| Báscula de precisión 0,01 g para huevos | 4,9 | 10,000+ | 2,33 | 189 MXN · 10–15 d | 7,99 € · 7–12 d | 9,99 $ · 8–12 d | ✅ nota+volumen |

> ⚠️ **La puerta automática entra con evidencia secundaria:** sus
> cifras (4,6 estrellas, 810 ventas en el último mes, 39,99 US$) no
> salen de la tarjeta del anuncio vista directamente, sino de los
> datos de ventas retail de AliExpress recopilados por accio. Queda
> marcado en su campo `verificacion` y es el primer producto a
> confirmar en la app: si allí no sostiene ≥4,5 y volumen, sale del
> catálogo.

## Productos RECHAZADOS (y por qué) — no bajar el listón

| Candidato | Motivo del rechazo |
|---|---|
| Set comedero 3 kg + bebedero 3 L («Pet Feeder and Drinker Set») | **4,4 estrellas**: bajo el mínimo de 4,5 |
| Incubadora de 56 huevos «Egg Incubator 4.3» | **4,3 estrellas** y política de la casa: incubadoras solo probadas |
| Placa calefactora de criadora 13 W (WONEGG/HHD) | Sin nota ni volumen del anuncio de AliExpress verificables (solo datos de proveedor B2B) |
| Termohigrómetro digital con sonda (tipo TPM-20) | Solo nota de proveedor en Alibaba (4,7; 12 años); sin nota/volumen del anuncio retail |
| Nido ponedero metálico roll-out | 5,0 estrellas pero **solo 23 vendidos**: volumen insuficiente |
| Humidificador ultrasónico para incubadora | Solo datos B2B de proveedor (12 años, 4,7); sin anuncio retail verificado |
| Red eléctrica avícola 0,9 × 50 m | Solo puntuación B2B (4,8); sin anuncio retail verificado |
| Motor de volteo 28 W / ventilador 220 V | Sin nota ni volumen del anuncio verificables |

Rechazados en la revisión del lote 2 (21-oct-2026, 25–30 candidatos):

| Candidato | Motivo del rechazo |
|---|---|
| Bandeja de volteo automática 56 huevos con motor | 4,9 estrellas pero **268 vendidos**: bajo el mínimo de ~300 |
| Bandeja de rodillos para volteo 220 V | 4,8 estrellas pero **70 vendidos** |
| Tolva / comedero colgante de plástico (3–15 kg) | Solo datos B2B (Alibaba/accio); sin nota/volumen retail de AliExpress |
| Comedero de pedal galvanizado (tipo VEVOR 20–40 lb) | Sin anuncio retail de AliExpress verificable (solo otros marketplaces; 4,2 en la web del fabricante) |
| Comedero de tubo / bandeja de pollitos | Anuncio retail 4,6 pero **178 vendidos**; el resto, B2B |
| Bebedero de campana / sifón 5 L | Recomendado en guías de AliExpress, pero sin nota/volumen retail verificables |
| Sistema completo de tetinas con depósito y tubo | Solo B2B; los kits retail quedan en 28 vendidos |
| Placa calefactora de criadora (HHD/WONEGG) | Solo datos del fabricante B2B (ya rechazada en el lote 1) |
| Emisor de calor cerámico E27 100 W | Solo B2B (725 vendidos de proveedor, nota de proveedor 4,8: no es nota del anuncio retail) |
| Base calefactada para bebedero / deshielador | Sin anuncio retail de AliExpress verificable (solo Amazon y otros; mayoría 110 V) |
| Termohigrómetro con sonda 1 m (pack 10) | 5,0 estrellas pero **13 vendidos**; la variante suelta, 148 |
| Cartones y bandejas de huevos de 30 (pulpa/plástico) | Solo B2B con pedidos mínimos de 500–100.000 uds |
| Jaulas y cajas de transporte de aves | Solo B2B (Alibaba/accio); sin retail verificable |
| Montura / delantal de gallina con alas | La mejor tarjeta retail: 4,6 estrellas pero **218 vendidos**; otra, 4,7 con 38 |
| Anillas ajustables numeradas (pack 25/50) | 4,5 estrellas pero **220 vendidos** (entran en su lugar las de clip x100 con 500+) |
| Malla gallinera / red de cercado | Solo B2B (proveedores de Hebei, MOQ por rollos) |
| Alfombrillas de nido (fibra de coco / césped artificial) | Sin nota/volumen retail verificables (solo guías y otros marketplaces) |
| Perchas y barras de descanso de madera | Solo B2B u otros marketplaces |
| Gafas anti-picaje sin pasador (peepers) | Sin datos retail de AliExpress (solo eBay/Amazon) |
| Cazo / pala de pienso | Solo notas de proveedor B2B |
| Ventilador solar para gallinero | Anuncio retail 4,8 pero **47 vendidos** |
| Calefactor-ventilador PTC de incubadora | Solo B2B (MOQ de 1.000 uds) |
| Válvula de flotador para bebedero | Solo B2B y guías; sin tarjeta retail con cifras |

Revisitar los «por ahora» cuando se pueda abrir su ficha completa en
la app de AliExpress y confirmar nota, vendidos, vendedor y fotos.

## Añadir un producto

1. Verificar el anuncio en AliExpress (los 6 filtros) y anotarlo todo.
2. Añadir la ficha a `productos` en `tienda/catalogo.js` copiando la
   estructura de una existente: `slug` único, textos en español,
   `rating`, `pedidos`, `vendedor`, `enlace_proveedor`, `activo: true`
   y bloque `paises` SOLO con los países activos donde de verdad
   envíe, cada uno con `precio`, `moneda`, `dias_envio`,
   `origen_envio` (`"local"` si sale de almacén en ese país;
   `"internacional"` si no) y `precio_confirmado`.
3. Fotos: pegar las URL de imagen del anuncio en `imagenes`. Sin URL
   del anuncio, usar `imagen_local` con una foto propia del repo y
   `imagen_local_nota` («Imagen orientativa…»). Sin foto alguna, la
   tarjeta muestra «Foto en preparación».
4. Commit y despliegue como el resto del sitio.

## Pago: `link_pago` (Stripe) y WhatsApp

Cada producto lleva `link_pago: ""`. Mientras esté vacío, la ficha
muestra el botón **«Pedir por WhatsApp»** (wa.me/34656267726 con el
mensaje «Me interesa: <producto> (<país>)», que además alimenta el
panel de avisos de compra). Cuando Pablo cree el enlace de pago en su
Stripe para ese producto, se pega la URL en `link_pago` y la ficha
muestra automáticamente el botón **«Comprar»** con ese enlace (el
panel lo registra como intención de compra de la tienda).

## Stock y desactivación automática

- La tienda pinta **solo** productos con `activo: true` y disponibles
  en el país del visitante. `activo: false` = desaparece al instante.
- `python3 tienda/check_stock.py` (a diario) comprueba que cada
  `enlace_proveedor` responde y deja el resultado en
  `tienda/stock-report.md`. **Nunca edita el catálogo**: avisa.
- Flujo: informe REVISAR dos días seguidos → comprobar en la app
  (¿anuncio muerto? ¿sin stock?) → `activo: false` + commit.
- El stock real de AliExpress cambia por variante (pack, enchufe…):
  la comprobación fina sigue siendo manual en la app al recibir un
  pedido por WhatsApp, hasta conectar la API de afiliados de
  AliExpress en una fase posterior.

## Pendiente (fuera de este commit)

- Confirmar en la app los filtros 3–6 de los 12 productos (la puerta
  automática del lote 2, la primera: su evidencia es secundaria) y
  rellenar `vendedor` + URLs de imagen del anuncio en `imagenes`.
- Confirmar los precios (`precio_confirmado: true`) país a país.
- Cambiar la navegación del sitio a `tienda/` y cerrar la tienda vieja
  de Netlify (decisión ya tomada; se ejecuta al verificar la nueva).
- Fase 2 de países: CO, AR, PE, CL cuando MX/ES/US vendan.
