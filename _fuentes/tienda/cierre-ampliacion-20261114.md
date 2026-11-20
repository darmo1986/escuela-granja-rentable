# Ampliación Amazon: entrega de revisión, 14/11/2026

La tienda pública conserva sus 169 productos. Esta entrega no modifica el CSV ni las páginas públicas.

## Resultado

- 113 candidatos únicos respecto al catálogo de producción.
- Los 101 que estaban sin consultar tienen ahora contraste en una fuente secundaria.
- 47 quedan priorizados por indicio de valoración de al menos 4,3; 27 en reserva por 4,0–4,2; 17 excluidos por indicio inferior a 4; diez sin datos suficientes.
- Las siete preselecciones previas tienen ficha editorial completa, tres puntos destacados, comprobaciones, consejos e imagen propia generada con IA a partir de referencia comercial real.
- Se conservan los dos destinos pendientes, dos reservas y un producto sin stock de la consulta Canopy anterior.

## Archivos

- `ampliacion-20261114.json`: cola y estados; conserva el origen y sus límites.
- `contraste-secundario-20261114.json`: 107 referencias coincidentes con los candidatos, con valoración y reseñas cuando la fuente las muestra.
- `borradores-20261114/fichas.json`: siete fichas y referencias de producto e imagen.
- `borradores-20261114/imagenes/`: siete imágenes WebP, generadas individualmente y revisadas contra sus referencias.
- `borradores-20261114/index.html`: revisión adaptable a móvil, sin indexación, sin precios ni estrellas presentados como actuales.
- `renderizar_borradores.py`: reconstruye y valida únicamente esa revisión.

## Comprobaciones

113 ASIN únicos; los siete borradores no están en producción; destinos estructurales Amazon.com /dp/ASIN y tag granjarentabl-20 correctos; siete imágenes decodificables; reconstrucción repetible; construcción del blog seguida de la tienda correcta; pruebas del buscador y cinco pruebas de destinos correctas; git diff --check correcto. No se ha validado la revisión en un navegador real.

## Límite pendiente

No está completada la ampliación a aproximadamente 100 productos disponibles. Canopy agotó el cupo gratuito y sus consultas previas son instantáneas de actualización mensual. La nueva fuente secundaria declara catálogo de 24/07/2026: la fecha de consulta de hoy no convierte esos datos en actuales. Amazon directo respondió 503 desde el entorno y la búsqueda primaria informó bloqueo robots.txt. Las fichas de fabricantes y otros comercios permiten contrastar características y encontrar referencias visuales, pero su disponibilidad no demuestra stock en Amazon. Por ello los siete borradores mantienen `publicable: false` y todos los candidatos requieren comprobación comercial actual antes de promocionarlos. No se ha contratado ningún servicio.

## Imágenes

Generadas mediante la herramienta integrada, una llamada por producto. Prompts: conservar forma, colores, materiales, piezas, escala relativa y ángulo de la foto comercial; cambiar el fondo a un gallinero real con luz natural y suelo seco; no añadir piezas ni accesorios. El kit conserva cuatro bocas y una sierra sobre una mesa. Las imágenes se identifican como ilustraciones IA; no acreditan la variante ni accesorios vendidos. Las referencias y rutas finales están en fichas.json.
