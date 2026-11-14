# Continuación del plan: presupuesto y costes

Aplicación del plan de Romuald/Ahrefs: mejorar el contenido existente y conectar preguntas, registros y herramientas. Prioridad por una carencia observada, no por demanda medida: costo-granja-avicola incluía importes presentados como presupuesto real de 2026, beneficios mensuales, un plazo de recuperación de 12–18 meses y afirmaciones de duplicar precio o producir pollitos por tanda sin respaldo suficiente.

## Cambio editorial y navegación

Se conserva la URL e imagen de la guía. Se sustituyen esos importes por una lista de datos y cotizaciones del lector: actividad, periodo, inversión, suministros, trabajo y ventas. Se distingue desembolso inicial de coste asignado al periodo y producción de ventas cobradas. No se calcula ni promete una recuperación de la inversión. Se elimina su asociación heredada a una incubadora concreta para no presentarla como compra obligatoria.

La entrada de costes desde YouTube ofrece tres caminos: empezar, puesta y engorde. Presupuesto y coste completo por docena enlazan de vuelta a esa entrada y a la calculadora existente. La calculadora recibe enlaces de ayuda al presupuesto y a la guía de coste completo. No se crea otra calculadora ni se cambia JavaScript, fórmulas, supuestos predeterminados, pago, seguimiento o publicidad.

## Fuentes consultadas el 13 de noviembre

- University of Wisconsin Extension, Enterprise Budgeting: https://farms.extension.wisc.edu/articles/enterprise-budgeting/. Marco de ingresos, costes variables/fijos, asignación de uso y sensibilidad.
- University of Maryland Extension, Backyard Layer Flock Economics, actualización de agosto de 2026: https://extension.umd.edu/resource/backyard-layer-flock-economics-how-much-does-it-cost-you-produce-dozen-eggs-fs-2025-0783. Contexto de presupuestos de puesta y dependencia de los supuestos de cada sistema. No se importan sus precios, producción ni condiciones legales a España o Latinoamérica.

También se abrió una referencia de Maryland para engorde y se localizó una de Penn State; la primera no se utiliza como fuente específica del texto final y Penn State devolvió 403. No se atribuye una revisión íntegra a esta última. La tabla de preguntas es una síntesis editorial; no una cotización real ni un plan financiero personalizado.

## Validación y límites

- 59 pruebas Python aprobadas.
- python _fuentes/mejorador/comprobar_costes.py: cinco páginas, catorce conexiones, enlaces y anclas, un h1 por página, eliminación de promesas antiguas y código de cálculo intacto.
- Se repite el verificador del recorrido de alimentación; git diff --check correcto.
- El generador mantiene títulos y descripciones dentro de sus límites y produce el artículo desde Markdown. No se declaran nuevas páginas, precios verificados ni ventas atribuibles.
- Pendiente revisión visual móvil/escritorio. Estas comprobaciones no sustituyen la inspección renderizada ni verifican cada cálculo previo de las herramientas.

Tanda añadida al borrador #119 después de 32ca18d, sin publicación. Tras aprobación, revisar el recorrido real y comparar periodos equivalentes con los datos disponibles. Reversión: revertir el commit y reconstruir, comprobando cambios posteriores.
