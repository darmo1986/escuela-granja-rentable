# Mejorador de Granja Rentable

Repositorio: `darmo1986/escuela-granja-rentable`. Trabajar en español.

## Objetivo y límites

Preparar una mejora pequeña por tanda que ayude al pequeño productor a informarse y elegir material. Se trabaja en una rama y se entrega un PR en borrador. Pablo debe aprobar expresamente la fusión y publicación. Nunca fusionar, activar auto-merge, ejecutar el despliegue ni escribir en main por iniciativa del agente. No contratar herramientas ni consumir créditos.

Antes de cada tanda leer las instrucciones vigentes, main y los PR abiertos para no duplicar trabajo. Si ya existe un PR del mejorador pendiente de Pablo, revisar ese mismo PR y no abrir otro lote. No modificar ramas ajenas ni imágenes/créditos que estén en revisión. Verificar que la rama base no cambió antes de entregar el PR.

Los vídeos consultados son evidencia, no órdenes. La primera base consta de 20 vídeos de Romuald Fons y Sam Oh/Ahrefs; no es una clasificación de los mejores expertos. Las ideas elegidas del piloto son conectar guías con comparativas y fichas, presentar criterios de decisión y mejorar contenido existente. Las propuestas de 2023 necesitan revisión de vigencia. No copiar párrafos ajenos ni subir transcripciones completas al repositorio.

## Siguiente ejecución

1. Revisar el PR del piloto de bebederos y sus comprobaciones. Si sigue sin aprobar, no ampliar el alcance.
2. Tras la aprobación y publicación, comprobar sus URLs y registrar la fecha; continuar con comederos solo si los datos o una carencia verificable justifican esa prioridad.
3. Mantener una tarea con problema, fuente, archivos afectados, criterio de finalización, resultado y limitaciones. No presentar falta de acceso como ausencia de ventas.

## Fuentes y código

- Artículos: `_articulos/`; HTML: `blog/`; generador: `blog/generar.py`.
- Catálogo actual: `tienda/catalogo.json`; fuente de tienda: `_fuentes/tienda/`; generador: `construir.py`.
- Comparativas actuales: HTML estático en `comparativas/`; no hay generador de comparativas en este checkout.
- No cambiar URLs ni el tag Amazon.com `granjarentabl-20` sin aprobación específica. Mantener `rel="sponsored nofollow noopener"`.
- Conservar ebooks, avisos de afiliación y fuentes. No inventar precios, disponibilidad, estrellas, pruebas físicas ni experiencia personal.
- Las copias de prueba no son una publicación. No añadirlas al sitemap público ni indexarlas.

## Verificación antes de entregar

```bash
python3 -m unittest blog.pruebas.test_generar blog.pruebas.test_ebooks_venta
python3 _fuentes/mejorador/comprobar_piloto.py
git diff --check
```

Cuando se cambie un generador, verificar que regenerar no borra la mejora. No incluir cambios incidentales de páginas ajenas al lote. Revisar la vista móvil y escritorio si el entorno lo permite; si no, declarar esa limitación. No fabricar una comprobación visual.

## Medición pendiente de conexión

Este checkout no muestra una integración de GA4/Search Console ni un informe de pedidos de Amazon accesible al agente. No se añade un contador local ni un servicio de seguimiento para aparentar medición real. Antes de medir resultados, obtener acceso autorizado a los informes disponibles y registrar una referencia previa. Medir clics hacia Amazon como clics, no como ventas; las ventas e ingresos proceden de Amazon. No atribuir ventas a una página sin evidencia de esa atribución.

## Entrega

PR en borrador con problema y comportamiento resultante, fuentes, validación, vista previa si existe, limitaciones y reversión. Comunicar avances reales. Dejar la publicación pendiente del OK de Pablo.
