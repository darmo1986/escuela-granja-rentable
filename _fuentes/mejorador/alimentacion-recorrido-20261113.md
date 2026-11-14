# Continuación: alimentación desde YouTube

Se aplica la secuencia del plan documentado de Romuald/Ahrefs: mejorar páginas existentes y hacer explícito el siguiente paso, sin abrir nuevas URLs ni atribuir demanda de búsqueda no medida. No se han vuelto a visionar vídeos ni gastado créditos.

## Implementación

- La entrada youtube/alimentacion.html muestra primero la hoja gratuita y la calculadora. Organiza el recorrido en etiqueta, registro/cuentas y equipo opcional, con saltos internos y enlaces a los recursos existentes. Distingue precio por kilo, coste de pienso por docena y rentabilidad completa; no calcula ahorros ni prescribe raciones.
- Los artículos de etiqueta y almacenamiento enlazan al recorrido de YouTube y a sus categorías correspondientes. Se conservan los textos técnicos, ejemplos, imágenes, créditos y fuentes anteriores; la ampliación es de navegación y contexto, sin nueva revisión nutricional de esos contenidos.
- La categoría Pienso incorpora orientación antes del catálogo: sus siete referencias incluyen etapas diferentes, no una lista de sustitutos equivalentes. Se mantienen los avisos de los productos etiquetados como medicados y el aviso general ya existente.
- La categoría de almacenaje añade el retorno a la guía de conservación y a la entrada desde YouTube, manteniendo el recorrido de seguridad anterior.
- Se conservan ASIN, destinos, tag, atributos y orden de los enlaces Amazon principales. No se modifican precios, catálogo, pagos, seguimiento ni anuncios.

Los enlaces a ebooks llevan a dos anclas existentes de su página. Los recursos gratuitos no requieren una compra y aparecen antes de los PDF comerciales. No se cambia el precio de ninguna guía ni se promete un resultado productivo.

## Verificación

- 59 pruebas Python del repositorio aprobadas.
- python _fuentes/mejorador/comprobar_alimentacion.py: cinco páginas, trece conexiones obligatorias, enlaces y anclas, persistencia al construir, avisos existentes y enlaces comerciales principales.
- Se vuelven a ejecutar los verificadores de seguridad, comederos y bebederos para detectar efectos compartidos del generador de categorías.
- git diff --check correcto. Revisión visual móvil pendiente: las comprobaciones de estructura y enlaces no equivalen a inspección renderizada.

Hipótesis: que quien llega del canal pueda completar una acción útil y decidir si necesita material. No hay medición atribuible de conversiones, ventas o incremento de tráfico. El contador existente sigue midiendo páginas vistas; no se introduce identificación de visitantes.

Se añade al borrador #119 después de aac90916. No se fusiona ni publica esta tanda. Tras aprobación, comprobar los cinco destinos reales y comparar periodos equivalentes con los datos disponibles. Puede revertirse este commit sin retirar los recorridos anteriores, comprobando modificaciones posteriores.
