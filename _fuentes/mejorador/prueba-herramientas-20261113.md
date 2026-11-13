# Visibilidad y prueba independiente — 13/11/2026

Encargo de Pablo: destacar recursos existentes y pedir a un bot que los use. Se conserva PR #119 en borrador; sin desplegar.

Cambios: seis accesos rápidos tras el carrusel, con app y calculadora de rentabilidad primero; tres columnas en escritorio. App enlaza el tutorial real https://www.youtube.com/watch?v=6mNw32EoeZI y advierte que es beta frente a APK 1.0.10. La calculadora identifica su ejemplo como ficticio y pide sustituir los costes, incluida la valoración del tiempo. No se crean herramientas duplicadas.

Prueba independiente en producción: navegación desde portada a calculadora y app. Ejemplo 100 Isa Brown: ingresos 6483,75, costes 6114,40, resultado 369,35. Precio docena 3 a 4: ingresos 8645, resultado 2530,60. Ventas 0%: ingresos cero, resultado -6114,40 y margen no calculable. Son resultados de una prueba con supuestos ficticios, no rentabilidades observadas. Página app accesible; no instalado APK. Tutorial localizado en canal y URL abierta; reproductor no disponible, no visionado integral.

Verificación del código cambiado: 58 pruebas Python y prueba JS herramientas aprobadas; diff sin errores de espacios. Copia parcial completada con recursos necesarios antes de repetir las pruebas; los fallos iniciales eran archivos no descargados. Revisión estática independiente de enlaces y CSS correcta.

Límites: navegador cloud rechaza localhost; Playwright instalado sin ejecutable Chromium, por lo que no se declara QA visual responsive. No se instala otro navegador. Pendientes inspección móvil de esta tanda, prueba interna del APK, validación tras despliegue y autorización de publicación. No demuestra aprobación AdSense ni mejora comercial. Reversión: revertir esta tanda sin tocar los cambios anteriores del PR.
