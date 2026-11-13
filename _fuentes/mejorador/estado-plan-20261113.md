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

Siguiente tarea propuesta: resolver `product-reviews` en origen y su comprobación antes de ampliar más comparativas. No se fusiona ni publica #119 sin aprobación específica. Reversión: revertir los commits aprobados y regenerar el blog, comprobando solapamientos con cambios posteriores.
