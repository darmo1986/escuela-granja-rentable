# Plan para refrescar estrellas y reseñas

Propuesta. No hay script conectado, no se llama a ninguna API y no hay clave en el repositorio.

## Qué hay que mantener al día

Cada producto de `tienda/catalogo.json` guarda:

- `estrellas`
- `resenas`
- `valoracion_fecha` (día en que se leyó el dato, `AAAA-MM-DD`)

La ficha enseña esa fecha en pequeño: «Valoración en Amazon a fecha de nov 2026». No se copia el texto de ninguna reseña. Solo el número de estrellas y el número de reseñas.

Hoy hay **169** productos. La fecha de partida es la de la verificación del catálogo (noviembre de 2026).

## Límite

Canopy API deja **100 consultas gratis al mes**. Una consulta es un ASIN. 169 no caben en un mes si además hay que repetir alguna llamada que falle.

Por eso el lote mensual es de **90 productos**, no de 100. Quedan unas 10 consultas de margen para un reintento. No se pasa de 100.

Con 90 al mes, el catálogo completo da una vuelta en dos meses: 90 el primer mes y los 79 restantes el segundo. Al tercero se empieza otra vez por los más antiguos.

## Cómo elegir el lote

1. Leer `tienda/catalogo.json`.
2. Ordenar por `valoracion_fecha` ascendente (lo más viejo primero). Si empatan, por ASIN.
3. Quedarse con los 90 primeros.
4. No volver a pedir en el mismo mes un ASIN que ya se actualizó ese mes.

## Qué haría el script (cuando se escriba)

Viviría en `_fuentes/tienda/`, que Jekyll no publica. No se crea todavía.

- La clave se leería de una variable de entorno, fuera del repo. No se escribe en el código ni en este archivo.
- Por cada ASIN del lote, una sola consulta a Canopy.
- De la respuesta solo se toman la valoración y el número de reseñas. Si la respuesta trae el texto de las reseñas, se tira.
- Si la consulta falla, se deja el dato anterior y se anota el ASIN para reintentar dentro del margen de 10.
- Si sale bien, se actualizan `estrellas`, `resenas` y `valoracion_fecha` (el día de la consulta) en `tienda/catalogo.json`.
- No se toca `descripcion_larga` ni el resto de campos.
- Después se vuelve a generar el HTML con `python3 _fuentes/tienda/construir.py`, para que las fichas y las tarjetas enseñen la cifra nueva y la fecha nueva.

## Qué no hacer

- No lanzar las 169 consultas el mismo mes.
- No guardar la clave en el repositorio, en el script ni en el catálogo.
- No publicar textos de reseñas de Amazon.
- No ejecutar este plan hasta que Pablo lo pida.
