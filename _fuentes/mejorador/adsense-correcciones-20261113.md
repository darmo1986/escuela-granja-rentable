# Correcciones para preparar la revisión de AdSense

## Evidencia y alcance

Comprobación del 13/11/2026: portada HTTP 200 sin etiqueta google-adsense-account; /ads.txt HTTP 404. El sitemap público contiene 377 URLs. La copia generada tiene exactamente esas mismas URLs: 95 artículos, 169 fichas y 113 páginas de otros tipos. El script auditar_adsense.py comprueba los destinos y anclas de enlaces relativos y absolutos al mismo dominio: cero incidencias. Recuento de palabras y enlaces no es una puntuación de calidad. Solo se han comprobado por HTTP la portada, ads.txt y los cinco artículos reescritos; estos últimos responden 200 en su versión anterior.

El identificador pub-5311145772953700 se ha contrastado con la notificación de servicio de AdSense del 7/11/2026 correspondiente a granjarentable.com. La notificación confirma el rechazo y remite a Sitios para su detalle; el motivo de poco valor procede del estado comunicado anteriormente por el propietario. No se afirma que se haya leído el estado actual dentro de AdSense. La cuenta requiere iniciar sesión en el navegador disponible. No se incorporan al repositorio el correo, sus cabeceras ni enlaces privados.

## Cambios concretos

| Área | Problema del código revisado | Corrección preparada |
| --- | --- | --- |
| Verificación | Portada sin etiqueta y ads.txt ausente | Meta oficial en head de la portada y ads.txt para el editor contrastado. No se carga el script ni se activan anuncios. |
| Renovación de lotes | Edades, porcentaje de puesta, margen del 15 %, vacío de catorce días y productos químicos como reglas universales | Registro de decisiones y costes, ejemplo ficticio trazable, separación de ponedoras/engorde y limpieza respaldada por APHIS sin receta universal. |
| Pollitos | Cuota fija de agua y cambio de pienso o salida por cumplir días | Seguimiento de acceso, cama, ambiente y programa del lote; referencias térmicas con alcance; tabla de incidencias. |
| Gallinero | Promesa de plano completo sin plano, mínimos sin contexto y puerta automática como mejor inversión | Croquis y hoja de medidas/presupuesto, ejemplo geométrico identificado, criterios de protección y comprobación del montaje; sin promesa estructural o normativa. |
| Elección de incubadora | Volteo automático declarado obligatorio, capacidades recomendadas sin necesidades y absolutos sin respaldo | Tabla de preguntas al vendedor, comprobación previa, comparación de funciones, coste del conjunto y ejemplo energético de potencia constante. |
| Calendario de incubación | Confundir apariencia con fertilidad/pérdida exacta de peso, certeza de resultados y consejo de extracción | Calendario de tareas de gallina con fuentes; límites de ovoscopia; fórmula de pesaje y nacimientos con denominadores; sin técnica casera de extracción. |
| Información editorial | Cifras sociales no verificadas y afirmación incompatible con los enlaces comerciales | Se retiran los recuentos; se distinguen autoría, documentación, prueba física, ejemplos y afiliación. |

Se conservan las URLs, imágenes y créditos. Los cinco HTML se generan desde sus Markdown. No se retira ni desindexa la tienda ni se activa publicidad para aparentar una solución editorial. Se añade un inventario reproducible excluido de publicación por estar en _fuentes. No se publica información privada de las cuentas.

## Fuentes consultadas

- Google: https://support.google.com/adsense/answer/81904?hl=es — motivos de rechazo y calidad.
- Google: https://support.google.com/adsense/answer/7584263?hl=es — método de verificación por meta.
- Google: https://support.google.com/adsense/answer/12171612?hl=es — formato de ads.txt; recomendable, no obligatorio y no sustituye la calidad.
- Minnesota: https://extension.umn.edu/agriculture/animals-and-livestock/poultry/raising-layer-chicks-and-pullets
- Minnesota: https://extension.umn.edu/agriculture/animals-and-livestock/poultry/raising-chickens-for-meat
- Virginia Tech: https://www.pubs.ext.vt.edu/content/pubs_ext_vt_edu/en/2902/2902-1092/2902-1092.html
- Maryland: https://extension.umd.edu/resource/housing-requirements
- Mississippi State: https://extension.msstate.edu/publications/hatching-quality-chicks
- Mississippi State: https://cto.extension.msstate.edu/agriculture/livestock/poultry/important-incubation-factors
- Mississippi State: https://extension.msstate.edu/publications/the-avian-embryo
- APHIS: https://direct.aphis.usda.gov/livestock-poultry-disease/avian/defend-the-flock/biosecurity-basics/build-clean-routine
- APHIS: https://www.aphis.usda.gov/nvap/reference-guide/cleaning-disinfection

## Validación y siguientes condiciones

58 pruebas Python aprobadas. Comederos: ocho páginas, 569 enlaces. Bebederos: cinco páginas, 389 enlaces. El generador se ha ejecutado repetidamente en una copia: meta única dentro de head, ads.txt exacto y ausencia de adsbygoogle.js; los textos y sus metadatos persisten. El inventario incluye enlaces absolutos del mismo dominio y coincide con el sitemap público. No se ha completado una revisión visual móvil ni una evaluación editorial manual de las 377 páginas o las 169 fichas. No se atribuye a estos cambios aprobación, tráfico ni ingresos.

Para terminar: revisar visualmente, publicar la tanda con la autorización del propietario y comprobar producción; abrir la cuenta correcta de AdSense, confirmar el motivo vigente, seleccionar el método de verificación pertinente y solicitar revisión cuando estén resueltos los problemas del sitio. No reenviar una solicitud contra cambios que solo están en borrador. El consentimiento y la CMP aplicables deben comprobarse antes de servir anuncios personalizados. No se han modificado pagos ni configuraciones de la cuenta.

La tanda amplía el PR #119 existente, sin fusión ni despliegue automático. Reversión: revertir el commit de esta tanda; regenerar el blog y revisar el solapamiento con cambios posteriores.
