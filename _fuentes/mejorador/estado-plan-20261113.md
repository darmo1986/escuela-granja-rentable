# Continuación del plan de YouTube — 13 de noviembre de 2026

Base publicada: 483c83972285e3112179f3997ae5e961b99b8114. Se continúa en el PR #119, conservando sus cambios de curso y registro semanal. No se publica esta tanda.

## Plan recuperado y criterio

Se ha leído íntegramente `plan-granja-rentable.md` (12/11/2026), que sintetiza veinte vídeos de Romuald Fons y Sam Oh/Ahrefs, y `REVISION-DARMO.md`. El plan no equivale a veinte expertos ni a una revisión exhaustiva de todas sus afirmaciones. No se ha vuelto a visionar ni verificado íntegramente cada vídeo.

Se conserva la secuencia: inventario → piloto de agua/bebederos → comederos → medición disponible. El piloto de agua fue publicado mediante #87 y se conserva. Portada y navegación ya recibieron cambios posteriores; no se vuelven a crear. El curso y la hoja semanal de #119 siguen pendientes de revisión. No se tocan otras ramas abiertas.

Aplicación elegida: mejorar contenido existente y conectar problema → criterios de elección → comparación → ficha, sin crear URLs. La carencia observable es una guía de comederos que mostraba jerga interna («TSR», intención de compra) y absolutos de eficacia, y una comparación que asociaba capacidad con tamaños de lote sin justificarlo. No hay una fuente de volumen de búsquedas ni datos de Search Console recuperados: la prioridad se basa en esas carencias, no en una afirmación de alta demanda.

## Preparado en el mismo borrador

- Artículo fuente de desperdicio: enlaces contextuales a guía, comparativa y hoja gratuita. Actualizado a 13/11. El HTML del artículo lo genera el flujo existente.
- Guía de comederos: acceso, adaptación, instalación, limpieza y observación del problema antes de comprar. Se retiran «a prueba de ratas y sin desperdicio» y la jerga interna.
- Comparativa: conserva los tres ASIN, capacidades nominales y URLs; sustituye recomendaciones vagas por comprobaciones y límites. Tabla con desplazamiento propio, foco, título y cabeceras de fila. No se declara verificada visualmente en móvil.
- Fuentes del fabricante y alcance documental: sin ensayo físico, cifras de ahorro ni existencias inventadas. No se modifica catálogo, tag ni destino Amazon.com. Se mantienen enlaces internos a las tres fichas.

Estas dos páginas de equipo son HTML estático; no tienen un generador propio. Se ha ejecutado el generador del blog y comprobado que conserva su contenido y genera los enlaces nuevos del artículo. No se incluyen sus cambios incidentales en otras páginas.

## Fuentes consultadas

- https://grandpasfeeders.com/pages/faq — entrenamiento y precaución sobre aves pequeñas; son indicaciones del fabricante, no una prueba nuestra.
- https://rentacoop.com/blogs/instructions/25-lb-treadle-chicken-feeder-instructions — página de instrucciones para 25 lb; se verifica la existencia del recurso, no se afirma haber reproducido todo su vídeo.
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content — utilidad y valor propio.
- https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews — criterios de decisión, límites y recursos útiles. No avala estos productos ni garantiza posicionamiento.

## Comprobaciones y deuda anterior

52 pruebas Python aprobadas. Auditoría de 500 páginas generadas sin referencias internas inexistentes ni anclas rotas; los 86 avisos de descripción y dos de canónica corresponden a las mismas redirecciones/páginas noindex ya documentadas. La revisión visual de móvil e impresión continúa pendiente.

El verificador del piloto de agua NO aprueba: rechaza tres enlaces `product-reviews` de sus fichas. Se reproduce el mismo fallo sobre la copia de la versión publicada, sin estos cambios. No se presenta como un fallo nuevo ni como una comprobación aprobada. Inventario local de tienda: 507 referencias `product-reviews` en 203 archivos HTML, en la versión del código revisada. No es una comprobación HTTP de Amazon ni prueba que todos esos destinos devuelvan error. El generador de tienda sigue emitiendo ese patrón; debe corregirse como tarea separada y verificarse tras regenerar, conservando etiqueta comercial y un texto de enlace fiel al destino.

## Hipótesis, recursos y siguiente prueba

Hipótesis: un recorrido más claro entre desperdicio, registro y elección de equipo puede ayudar a decidir y evitar compras inadecuadas. Sin tasa de conversión, ventas, comisiones ni beneficio atribuibles verificados. No se han añadido servicios, dependencias ni gastos de pago.

Tras aprobación y publicación, comprobar páginas y enlaces reales. Con conexiones autorizadas, registrar una referencia y comparar periodos equivalentes (por ejemplo, 28 días, ampliando si faltan datos): consultas y clics en Search Console; clics afiliados con denominador disponible; ventas e ingresos en Amazon. Un clic no es una venta. Calcular beneficio descontando costes reales, incluidas herramientas, producción y comisiones aplicables. Sin acceso a esos informes no se afirma una mejora de tráfico o ingresos.

La corrección de `product-reviews` se prepara en la ampliación descrita abajo. Tras publicarla con aprobación, la siguiente tarea será comprobar destinos reales y recuperar métricas autorizadas antes de ampliar más comparativas. No se fusiona ni publica #119 sin aprobación específica. Reversión: revertir los commits aprobados y regenerar el blog, comprobando solapamientos con cambios posteriores.


## Nueva corrección preparada: destinos Amazon en origen

Se elimina el segundo botón de reseñas del generador de tienda y se conserva «Ver precio en Amazon», dirigido al producto con el mismo ASIN y tag. No se promete abrir una pestaña de opiniones ni se convierte una URL de reseñas en otro botón duplicado.

El despliegue propuesto ejecuta `_fuentes/tienda/limpiar_destinos.py` antes de generar el blog. Es una migración acotada de los HTML heredados: solo retira el botón `t-resenas` cuando el mismo bloque conserva un `t-amazon` al mismo ASIN, ambos con el identificador aprobado y atributos esperados. Ante un patrón distinto, se detiene antes de escribir ningún archivo. Así conserva textos, imágenes y trabajo editorial que una regeneración indiscriminada de tienda podría sustituir. No consulta Amazon ni envía datos.

Validación local: 507 botones heredados retirados en 203 HTML; 507 botones principales conservados con los mismos atributos. Segunda ejecución: cero cambios. Después de la limpieza y generación del blog, el piloto de agua aprueba cinco páginas y 389 enlaces, sin errores. Se resuelve en esta salida local el fallo documentado en la sección anterior; la web publicada no cambia mientras el PR sea borrador.

58 pruebas Python aprobadas, incluidas discrepancia de ASIN, tag y host, atributos inesperados, contenido ajeno intacto, repetición sin cambios, validación completa antes de escribir y rechazo de enlaces heredados en la salida construida. El verificador de publicación ahora revisa todos los HTML de tienda para impedir que se publique el patrón `product-reviews`.

No se prueba con esto que Amazon entregue el producto, que los enlaces conviertan ni que haya comisiones: el objetivo es un destino coherente y verificable en el código. Los informes comerciales, el ensayo visual en móvil y la aprobación de publicación siguen pendientes.

Comprobación adicional del origen: tras generar primero el blog (para disponer de los artículos enlazados), el generador de tienda completa sus 169 productos y 33 categorías con comprobación interna de enlaces, tag y schema correcta. Sus 237 HTML no contienen botones heredados y la limpieza no los modifica. Esta regeneración completa se realiza solo en otra copia de comprobación: no se incluyen sus cambios editoriales incidentales en el PR.


## Fichas conectadas con el recorrido de comederos

Carencia verificada en la base e262dd7: las tres fichas de comederos no enlazaban a la guía, la comparación ni el registro del desperdicio. Sus textos conservaban absolutos de eficacia retirados de la guía. Se completa el mismo PR, sin abrir otro lote.

Se añade un bloque antes del botón comercial en las tres fichas: guía de elección, comparación de los tres modelos, registro del desperdicio y hoja semanal gratuita. El generador de tienda conserva ese bloque y no lo añade a otros ASIN. Se mantienen los títulos, las URLs, el tag, las imágenes y todos los demás datos del catálogo.

Los textos de explicación y recomendación se corrigen en pulir.py y se reflejan en las fichas, las tarjetas de portada/categoría de tienda y el catálogo público. Solo cambian estos dos campos en tres de los 169 productos; no se copian al catálogo público los precios o valoraciones históricos del CSV. Se distingue capacidad nominal de autonomía, acceso y resultados no medidos. Las fuentes documentales de la tanda siguen siendo las indicaciones de los fabricantes citadas arriba; no se añade experiencia de uso propia ni una afirmación de ahorro.

Comprobación del recorrido: siete páginas, 469 enlaces y tres fichas, sin errores. Incluye enlaces de ida y vuelta, destinos y anclas locales, bloque único antes de la compra, coincidencia de textos con la fuente y el catálogo y ausencia del bloque en un ASIN ajeno. Tras regenerar la tienda completa en otra copia, el mismo verificador vuelve a aprobar. El generador conserva sus 169 productos y 33 categorías y pasa su comprobación interna de enlaces, tag y schema. Las 58 pruebas Python y el piloto de agua (cinco páginas y 389 enlaces) también aprueban. Auditoría de 500 páginas sin nuevos enlaces internos inexistentes.

Hipótesis: permitir que quien llegue a una ficha desde buscadores pueda volver a los criterios y al registro antes de comprar. No se conocen todavía sesiones, clics ni ventas atribuibles que permitan cuantificar el efecto. Riesgo: más enlaces en la ficha; revisar claridad y longitud en móvil antes de publicar. Sin servicios ni gastos de pago nuevos. Siguiente prueba, después de la aprobación: recorrer las tres fichas en móvil y comprobar que se puede comparar y volver al registro; medir el recorrido solo con acceso autorizado. Continúan pendientes la revisión visual y la aprobación de publicación.


## Orientación de la categoría de comederos

Se aplica el punto del plan sobre categorías que ayudan a decidir: la categoría existente mostraba su recuento y productos, sin conectar con las guías del recorrido. Se añade orientación antes de filtros y tarjetas con cuatro necesidades: criar pollitos, identificar pérdidas, valorar un pedal y registrar el manejo. Se enlazan las guías, comparación y hoja gratuitas ya existentes. No se crean páginas ni URLs nuevas.

El título y la descripción de esta categoría se hacen específicos de comederos para gallinas y de los recursos que contiene. El buscador se asocia mediante aria-describedby a una explicación de su comportamiento real: varias palabras se combinan como condición de coincidencia de todas ellas. No se cambia JavaScript ni se añaden herramientas de seguimiento. El generador limita la orientación y la mejora de metadatos a la categoría Comederos; las demás categorías conservan sus plantillas actuales.

Validación: 58 pruebas Python aprobadas. El recorrido ampliado aprueba ocho páginas y 562 enlaces. El verificador exige un único bloque idéntico al generador antes de los filtros, sus destinos y la explicación asociada al buscador, y comprueba que no aparece para una categoría ajena. La regeneración completa conserva las mejoras y completa 169 productos en 33 categorías con sus comprobaciones internas correctas; los verificadores de comederos y bebederos también aprueban después.

Hipótesis: orientar al visitante hacia el contenido que necesita antes de elegir equipo puede facilitar una visita cualificada. No se afirma volumen de búsquedas ni mejora de CTR, posición, ventas o beneficio. Esfuerzo acotado a categoría, generador, verificador y documentación; sin coste externo añadido. Riesgo: la introducción desplaza las tarjetas hacia abajo, por lo que sigue siendo necesaria la revisión visual en móvil. Tras la aprobación, comprobar ese recorrido en producción y medir solo con informes autorizados. No se publica esta ampliación.
