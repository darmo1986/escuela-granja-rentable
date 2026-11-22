# Recorrido de puertas — 22 de noviembre de 2026

## Estado previo y publicación del piloto

El PR #87 fue fusionado en `main` el 12 de noviembre de 2026 a las 14:48, hora de Canarias (15:48 en el desplazamiento `+01:00` del commit), como `3e628e7972a88f1f556a49dfa139b2f28a03b8f2`. El 22 de noviembre se comprobaron por HTTP la guía, la comparativa y las tres fichas del piloto: las cinco URL devolvieron 200. El verificador local también mantiene el recorrido de cinco páginas sin errores. Esta comprobación confirma disponibilidad, no tráfico, conversiones ni ventas.

El PR #119 fue fusionado el 14 de noviembre y no queda ningún PR abierto al iniciar este lote. Se revisaron los cambios recientes de `main`, incluidas las cuatro comparativas publicadas el 21 de noviembre, para no repetir sus textos, vídeos ni fichas.

## Carencia verificable

La guía de protección del corral enlazaba la categoría de puertas, pero no la nueva comparativa de puerta manual y automática. La comparativa enlazaba dos fichas, pero no la guía; esas dos fichas solo volvían a la categoría. Por tanto, el recorrido guía → comparación → ficha no permitía volver a los criterios de cierre sin pasar por navegación general.

No se usaron datos de demanda ni de ventas para priorizar esta mejora. El repositorio no ofrece Search Console, analítica de conversiones ni informes de Amazon al agente. Tampoco se atribuyen clics a compras. La prioridad procede únicamente del enlace ausente y de completar páginas ya publicadas antes de ampliar el catálogo.

## Lote preparado

- Fuente de la guía: añade un enlace a la comparativa sin cambiar sus fuentes técnicas.
- Comparativa: añade la guía al bloque que ya reúne las dos fichas.
- Generador de tienda: añade antes de la compra un bloque limitado a los ASIN `B07G9MPCKT` y `B0CWXWX52L`; enlaza guía y comparativa y pide confirmar versión, medidas, fuente de energía e instrucciones.
- HTML generado: conserva el bloque en las dos fichas actuales.
- Verificador: exige los enlaces de ida y vuelta, destinos locales, Amazon.com con `granjarentabl-20`, posición anterior a la compra y coincidencia exacta con el generador.
- Prueba de configuración: alinea la expectativa heredada con la retirada de Adsterra ya presente en `main`; exige que `adsterraPilot` siga en `false`.

No se cambian catálogo, precios, disponibilidad, estrellas, imágenes, créditos, ebooks, URLs ni enlaces comerciales. No se añade seguimiento. Las frases nuevas organizan el recorrido y remiten a comprobaciones ya presentes; no afirman pruebas físicas del equipo.

## Criterio de finalización y límites

Resultado: 37 pruebas del blog y ebooks aprobadas; verificadores de bebederos (cinco páginas y 389 enlaces), comederos (ocho páginas y 579 enlaces) y puertas (cuatro páginas y 214 enlaces) sin errores. Una regeneración completa en una copia temporal conserva el recorrido de puertas y pasa la comprobación interna de la tienda; `git diff --check` no informa errores.

La inspección visual no pudo ejecutarse: Chromium local se cierra porque el entorno no permite crear su socket de proceso. Los enlaces y el orden de los bloques sí se comprobaron sobre la estructura HTML, pero no se afirma una captura de escritorio, de 390 px ni una prueba en teléfono físico.

La fusión y publicación quedan pendientes del OK de Pablo. No se ejecuta despliegue ni se modifica `main`.
