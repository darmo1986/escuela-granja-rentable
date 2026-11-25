# Recorrido de nidales — 23 de noviembre de 2026

El piloto de bebederos (#87) se fusionó y se publicó el 12 de noviembre de 2026. El 23 de noviembre devolvieron HTTP 200 sus cinco páginas públicas. El PR #119 se fusionó el 14 de noviembre. Los PR #182 y #186, del recorrido y el vídeo de puertas, ya están publicados. Se revisó main en `a32b3475bc88ed6ad94819bbac6c4c1fbe7a2090` y los PR abiertos. El 24 de noviembre se volvió a revisar el borrador sobre main `821bbadcf471e7c3c70e80f6f6470d9675904af5`. La combinación con los cambios posteriores del generador de tienda y sus pruebas no presenta conflictos.

## Cambio

La guía sobre huevos rotos no enlazaba la comparativa de nidales, y desde la ficha enlazada por la comparativa solo se volvía a la categoría de tienda. Se conectan esas tres páginas existentes. Los enlaces que vuelven a la guía saltan al apartado de huevos rotos. El bloque de la ficha se genera antes de la compra y se limita a la ficha ya enlazada en la comparativa.

La evidencia es la navegación de la [guía](https://granjarentable.com/blog/problemas-gallinero-picaje-huevos-rotos-humedad.html) y la [comparativa](https://granjarentable.com/comparativas/nidales.html) existentes. El texto añadido orienta sobre dónde leer y qué revisar. La variante comercial de la ficha sigue pendiente de confirmación en la revisión de catálogo. No se modifica su descripción comercial, enlace de Amazon, imagen, metadatos ni vídeo. No hay acceso a analítica de conversiones o informes de Amazon con los que atribuir clics a compras.

## Validación

La regeneración del blog y la tienda conserva los cinco enlaces, incluido el ancla de la guía. Se compararon las cabeceras HTML y los enlaces externos con main. La regeneración completa de la tienda también produce diferencias ajenas a este lote, entre ellas versiones de recursos y texto de catálogo. En esta entrega solo se incorpora el bloque generado de la ficha y se conserva el resto de su HTML publicado.

Se ajusta una expectativa de la prueba de portada para comprobar por separado las versiones CSS y JavaScript que ya distingue el PR #209. Pasan las 37 pruebas de blog y ebooks, los comprobadores de bebederos, puertas y nidales, y la prueba del escaparate. El comprobador de nidales revisa las tres páginas, los cinco enlaces del recorrido, el ancla, metadatos básicos, el bloque generado y los enlaces Amazon. Chromium no pudo iniciar por la restricción de sockets del entorno, por lo que queda pendiente la inspección visual en móvil y escritorio.

Borrador pendiente de aprobación. Para revertirlo tras una eventual fusión, revertir su commit.
