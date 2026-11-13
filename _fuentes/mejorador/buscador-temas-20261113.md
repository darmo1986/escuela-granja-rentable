# Buscar y recuperar la navegación — 13/11/2026

Tanda independiente desde main cd6a8b5b. No fusionada ni desplegada. Compatible
con el área privada del PR #122: no cambia cuenta, pagos, correos ni anuncios.

## Resultado

- El buscador conserva coincidencia de todas las palabras significativas, pero
  omite artículos, posesivos y conectores frecuentes del español. Conserva
  negaciones y cantidades; estas últimas coinciden como palabras completas.
- Grupos pequeños de vocabulario amplían alimentación, costes, gallinero/galpón
  y agua/bebederos. Son equivalencias para encontrar páginas, no equivalencias
  nutricionales ni nuevas recomendaciones de manejo.
- Filtro nativo por los temas realmente presentes en el índice público. Funciona
  con búsqueda y también sin texto. La URL conserva q, tema y otros parámetros;
  restaura estado al navegar con Atrás/Adelante.
- Ante cero resultados, propone hasta tres palabras de la búsqueda que sí tienen
  coincidencias en el tema elegido, permite quitar el filtro y enlaza a Guías.
  Las coincidencias parciales se ofrecen como una búsqueda nueva; no se presentan
  como resultados exactos de la consulta original.
- La página 404 permite enviar una búsqueda directamente al blog. Mantiene los
  enlaces de navegación y funciona tanto en el dominio como en la ruta de proyecto
  de GitHub Pages.
- El listado original sigue disponible sin JavaScript. No se añaden servicios,
  almacenamiento local, peticiones externas ni perfiles de búsqueda.
- Se renuevan las versiones de JS y CSS del buscador desde el generador para
  evitar que los visitantes reciban los archivos antiguos tras la publicación.

## Ejemplos comprobados

- «¿Cómo alimentar a mis gallinas?» encuentra alimentación en la prueba controlada.
- «precio 10 gallinas» excluye el caso de 100 gallinas en la prueba controlada.
- «gallinas no» conserva la negación sin confundirla con partes de otras palabras.
- «comida gallinas», «precio docena», «galpón», «codornices» y «gallos» encuentran
  artículos del índice real generado, con 95 artículos públicos y 8 categorías.

## Comprobaciones

- 53 pruebas Python existentes aprobadas, incluida renovación de activos.
- Node: pruebas existentes de clientes/lectura y del carrusel aprobadas.
- Nueva prueba DOM con jsdom: vocabulario, números, negación, categorías,
  restauración y limpieza, parámetros y anclas, búsquedas vacías, sugerencias,
  contenido como texto y búsqueda 404 en ambas rutas de alojamiento.
- Planificación completa del generador sin errores: 502 archivos de salida,
  activos versionados y destinos de los 95 resultados existentes o generables.
- Sintaxis JavaScript y git diff --check correctos.

Prueba nueva:

    NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_busqueda_temas.cjs

Dependencia de prueba: jsdom. El sitio no requiere esta dependencia. La prueba
puede contrastarse con el índice generado mediante /tmp/granja-buscador-indice.json;
ese archivo es intermedio y no se publica.

Límites: verificación DOM y de construcción, sin inspección visual en navegador
ni medición de búsquedas, visitas, conversiones o ingresos en producción. Las
búsquedas siguen limitadas a títulos, descripciones y categorías públicas;
no recorren el cuerpo completo de los artículos. La calidad de los filtros no
acredita mejoras SEO ni aprobación publicitaria.

## Recorridos por objetivo añadidos

La biblioteca ofrece ocho recorridos desplegables de tres pasos: primera granja,
pollitos, puesta, alimentación, gallinero, costes, codornices y pollos de engorde.
Conectan guías existentes con herramientas concretas (registro, lista y
calculadoras). Se conservan las 18 tarjetas y su buscador, colocados después de
los recorridos. Los enlaces y desplegables son HTML nativo y funcionan sin JS.
El diseño declara una columna en móvil y dos desde 760 px, con foco visible.
No se añaden afirmaciones técnicas, comerciales ni datos de producción.

Comprobación de esta ampliación: 48 pruebas Python (generador, ebooks, búsqueda
y lectura), pruebas Node de búsqueda temática con el índice real de 95 artículos
y biblioteca aprobadas. Plan completo de 502 salidas válido; comprobados los
24 destinos, incluidos los dos fragmentos de calculadoras, y conservación de
recorridos al regenerar. Revisión visual pendiente: Chromium del sistema no
arranca y falta el ejecutable de Playwright. No se afirma un aumento de tráfico
ni posicionamiento; la propuesta sigue sin fusionar ni publicar.
