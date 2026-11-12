# Piloto de bebederos — 12 de noviembre de 2026

Base revisada: `f80097efc00aad18035b511ae5dd735f692415d4` de main.

La guía de agua ya existía, igual que la comparativa y las tres fichas. El piloto conserva las URLs y el catálogo. Añade enlaces de ida y vuelta, criterios de instalación, limpieza y autonomía, y una tabla desplazable mediante teclado en móvil. Las capacidades se identifican como datos del catálogo; no son una prueba física ni una verificación comercial actual.

Se recuperó el trabajo inicial preparado en la copia de prueba anterior y se aisló del resto de cambios de aquella copia. Las fichas se apoyan en el generador de tienda para conservar el nuevo bloque al regenerar. No se han cambiado las fotos ni sus créditos. El PR #81 de fotografías se revisó para detectar el solapamiento del artículo; no se modifica esa rama.

Las métricas comerciales siguen pendientes de acceso a informes. No se ha añadido seguimiento ni se han supuesto ventas o tráfico. El agente debe esperar la revisión de este lote antes de crear el siguiente.

Validación: 31 pruebas del blog y ebooks superadas; cinco páginas y 325 enlaces del piloto sin errores en `comprobar_piloto.py`; `git diff --check` correcto. Vista de escritorio inspeccionada y recorrido a una ficha comprobado. Vista móvil simulada en un iframe de 390 px: ancho útil 375 px por la barra de desplazamiento, sin desbordamiento horizontal de página; la tabla desplaza su propio contenido y admite foco por teclado. No equivale a una prueba en un teléfono físico.

Fuentes para las decisiones del piloto: Romuald Fons, [SEO para E-commerce](https://www.youtube.com/watch?v=LGXfJAlh8zU); Sam Oh/Ahrefs, [Homepage and Navigation](https://www.youtube.com/watch?v=ZkCuOP6-iJQ), [Content Strategy](https://www.youtube.com/watch?v=SLm9lJnBvyo) y [Blog Post Templates](https://www.youtube.com/watch?v=aH_msHLhwOc). Las aplicaciones a Granja Rentable son decisiones editoriales propias, no resultados garantizados por esos vídeos.

Reversión tras una eventual publicación: revertir el commit del piloto y regenerar con `python3 blog/generar.py`. La reversión debe revisarse si se fusionan cambios posteriores sobre los mismos archivos.
