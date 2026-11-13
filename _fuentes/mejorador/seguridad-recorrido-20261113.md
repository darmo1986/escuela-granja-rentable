# Continuación del plan: seguridad del gallinero

Se aplica el criterio documentado en estado-plan-20261113.md: mejorar una página existente y enlazar problema → criterios → categoría → ficha, antes de crear nuevas URLs. Esta tanda no equivale a una nueva revisión de los veinte vídeos ni a una investigación de demanda de búsqueda.

Se actualiza el artículo de corral anti-depredadores, conservando URL e imágenes. Se retiran estadísticas sin fuente sobre la puerta como entrada principal y promesas de protección total. Se añaden una tabla de inspección, criterios para decidir entre reparación y compra, rutina de cierre y enlaces a tres categorías existentes y a la lista de tareas. Cada categoría devuelve al artículo y a la planificación del mantenimiento. No se cambian precios, ASINs ni enlaces Amazon principales.

## Fuentes abiertas el 13 de noviembre

- University of Maryland Extension, Housing Requirements: https://extension.umd.edu/resource/housing-requirements. Sustenta la referencia de media pulgada para ventanas y la necesidad de ventilación. No se generaliza a cualquier depredador o instalación.
- Meyer Hatchery, Predator Proofing Your Coop and Run: https://meyerhatchery.zendesk.com/hc/en-us/articles/29414283183885-Predator-Proofing-Your-Coop-and-Run. Orientación comercial de un criadero sobre fijación, cierre, mantenimiento de puertas y limpieza; no es un ensayo independiente de los productos de la tienda.

Las tablas de revisión y preguntas antes de comprar son una síntesis editorial. No hay pruebas físicas de equipos, garantía de eficacia ni cálculo de ataques evitados. No se han cambiado los textos particulares de las doce fichas de producto vinculadas a estas categorías: su revisión individual queda pendiente.

## Integración y comprobaciones

El borrador #119 se reconcilia con main tras #120 y #121. Se conservan el consentimiento e aislamiento del piloto, la portada aprobada y los cambios pendientes de #119; el conflicto de accesos de portada se resuelve a favor de los cuatro accesos ya aprobados. Las herramientas siguen accesibles en su sección y mediante los saltos de portada. No se publica esta ampliación.

- 59 pruebas Python, más pruebas Node del carrusel y piloto Adsterra.
- Verificador reproducible: python _fuentes/mejorador/comprobar_seguridad.py.
- Comprueba cuatro páginas, enlaces internos y anclas, permanencia tras construir y conservación de los enlaces comerciales principales.
- Revisión visual pendiente; no se presenta una validación HTTP de producción como si validara el borrador.

Hipótesis: una revisión antes de la compra y un retorno claro a las guías pueden mejorar las decisiones del visitante. No se atribuyen visitas, conversiones ni ventas. El contador existente mide páginas vistas, no visitantes únicos; no se modifica ni se introduce seguimiento adicional. Sin servicios ni créditos de pago.

Tras publicar con aprobación: verificar el recorrido real y comparar periodos equivalentes con métricas disponibles. Un clic de afiliado no es una venta. Revertir el commit de esta tanda permite retirar estos cambios, revisando primero cualquier modificación posterior.
