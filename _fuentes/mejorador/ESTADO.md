# Piloto de bebederos — 12 de noviembre de 2026

Base revisada: `f80097efc00aad18035b511ae5dd735f692415d4` de main.

La guía de agua ya existía, igual que la comparativa y las tres fichas. El piloto conserva las URLs y el catálogo. Añade enlaces de ida y vuelta, criterios de instalación, limpieza y autonomía, y una tabla desplazable mediante teclado en móvil. Las capacidades se identifican como datos del catálogo; no son una prueba física ni una verificación comercial actual.

Se recuperó el trabajo inicial preparado en la copia de prueba anterior y se aisló del resto de cambios de aquella copia. Las fichas se apoyan en el generador de tienda para conservar el nuevo bloque al regenerar. No se han cambiado las fotos ni sus créditos. El PR #81 de fotografías se revisó para detectar el solapamiento del artículo; no se modifica esa rama.

Las métricas comerciales siguen pendientes de acceso a informes. No se ha añadido seguimiento ni se han supuesto ventas o tráfico. El agente debe esperar la revisión de este lote antes de crear el siguiente.

Validación: 31 pruebas del blog y ebooks superadas; cinco páginas y 325 enlaces del piloto sin errores en `comprobar_piloto.py`; `git diff --check` correcto. Vista de escritorio inspeccionada y recorrido a una ficha comprobado. Vista móvil simulada en un iframe de 390 px: ancho útil 375 px por la barra de desplazamiento, sin desbordamiento horizontal de página; la tabla desplaza su propio contenido y admite foco por teclado. No equivale a una prueba en un teléfono físico.

Fuentes para las decisiones del piloto: Romuald Fons, [SEO para E-commerce](https://www.youtube.com/watch?v=LGXfJAlh8zU); Sam Oh/Ahrefs, [Homepage and Navigation](https://www.youtube.com/watch?v=ZkCuOP6-iJQ), [Content Strategy](https://www.youtube.com/watch?v=SLm9lJnBvyo) y [Blog Post Templates](https://www.youtube.com/watch?v=aH_msHLhwOc). Las aplicaciones a Granja Rentable son decisiones editoriales propias, no resultados garantizados por esos vídeos.

Reversión tras una eventual publicación: revertir el commit del piloto y regenerar con `python3 blog/generar.py`. La reversión debe revisarse si se fusionan cambios posteriores sobre los mismos archivos.

## Publicación y siguiente lote — 12 de noviembre de 2026

Pablo autorizó publicar #87. Fusionado como 3e628e7972a88f1f556a49dfa139b2f28a03b8f2; ambos flujos de Pages completados con éxito. La comprobación HTTP posterior desde el entorno local devolvió 403, por lo que no se declara una inspección visual de producción.

Pablo pidió después trasladar las promociones a la parte alta y alternar ebooks y productos de Amazon; el primer cuadrante debe alternar curso, tienda y ebooks cada cinco segundos. Autorizó preparar un borrador y enseñarlo antes de cambiar la web pública. Se actualiza el borrador #84 para no mantener dos carruseles rivales. No se publica este nuevo lote.

El generador coloca una sola franja de promociones al principio de main en portada y blog. JavaScript presenta las guías existentes y dos productos ya incluidos en el catálogo, con enlaces de afiliación y sin inventar rebajas ni precios Amazon. Incluye pausa, anterior/siguiente, detención durante interacción y movimiento reducido. Conserva el contenido inicial cuando JavaScript no está disponible. No se añaden servicios de seguimiento. El carrusel principal se reduce a curso, tienda y ebooks.

Validación: 32 pruebas del blog/ebooks, comprobación de cinco páginas y 325 enlaces del piloto, sintaxis JavaScript y git diff --check. La prueba nueva comprueba que regenerar no duplica la franja, que aparece arriba, y que sus enlaces e imágenes locales son válidos. La inspección visual y la ejecución en navegador no pudieron completarse: Chromium local no pudo iniciar y el navegador remoto no accede al servidor local. Se entrega una vista previa HTML autocontenida para revisión. No se afirma prueba de teléfono físico ni de rotación ejecutada en un navegador. Envato y nuevos artículos quedan pendientes.
