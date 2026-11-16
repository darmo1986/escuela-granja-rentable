# Atribución controlada — preparado, sin desplegar

Base actualizada el 16/11/2026: main 762ea40 (#142). La rama fix/blog-orientacion-20261112 (28f3a56) ya es antecesora de main; se ha revisado y no se duplican sus arreglos. La FAQ de conversión y el registro semanal ya están integrados en #134; no se repiten. La tienda #124 está fusionada.

El registro actual no conserva UTM. Se añaden valores cerrados y previamente enumerados de fuente, medio, campaña e identificador de vídeo a páginas vistas e intenciones. Rechaza texto libre y parámetros repetidos; no guarda URL completa, consultas, contactos ni identificadores de personas. No usa cookies ni almacenamiento del navegador. La lista cerrada se replica en las restricciones SQL.

Desactivado por defecto: solo funciona con `GR.analitica.atribucionUtm === true`. Orden de revisión: probar SQL en base aislada, desplegar migración con autorización específica, verificar esquema, aprobar activación y publicar configuración. No se ha ejecutado SQL ni cambiado la configuración real. La migración preserva RLS y permisos.

Límite: atribución únicamente en la página cuya URL incluye UTM. No conserva la campaña entre páginas; no presentarla como atribución completa de ventas. Los datos cliente son manipulables, igual que los contadores actuales.

El panel actual no presenta un desglose UTM. Este lote prepara la captura, no un informe de campañas: hasta aprobar una consulta o informe administrativo que lea estas columnas, la atribución solo podrá comprobarse en una base aislada o con acceso autorizado a Supabase.

Fases restantes del embudo: clic = intención; inicio de pago únicamente tras obtener una sesión real del servidor; venta únicamente por verificación Stripe del lado servidor y deduplicación por transacción. No existe aquí el servidor Stripe desplegado verificable: no se inventan esos eventos ni se registran ventas desde el navegador. Requiere recuperar y verificar ese código/cuenta antes de completarlo.

Prueba propuesta: enlace de engorde con `utm_source=youtube&utm_medium=organic_video&utm_campaign=engorde_registro&utm_content=w4c0OzCPWKI`. En entorno aislado, debe aparecer una página vista y el clic que se produzca, sin inicios ni ventas inventados. Comparar ventanas iguales de siete días tras una activación autorizada. Impacto esperado: mejor atribución, no incremento demostrado de visitas o ventas. Esfuerzo medio; sin gasto aprobado ni ejecutado. Riesgo: pérdida de eventos si se activa antes del esquema; mitigado con bandera apagada.

La prueba automatizada exige dos envíos distintos (visita e intención), los cuatro valores UTM permitidos, ausencia de URL completa, rechazo de texto libre y duplicados, configuración real no activada y correspondencia de los valores con la migración SQL.

Revisión del 16/11: la batería del generador detectó las versiones antiguas de activos en `premium.html`. Se normalizan mediante `poner_version`, la misma función que emplea el generador, conservando textos, precio, WhatsApp y condiciones existentes. La integración local con main no tuvo conflictos. No se cambia ni activa la oferta Premium existente ni la propuesta educativa de abajo. No se ejecutan migraciones, no se activa UTM, no se publica ni se modifican anuncios en producción.

Aviso nuevo de Search Console recibido el 16/11 a las 01:12:50 UTC: «No se ha encontrado (404)» en sitemap, sin URL afectadas en el mensaje. La auditoría local de las 341 URL del sitemap en main no encontró rutas sin archivo o índice; eso no prueba que producción esté libre de 404. El acceso HTTP de esta jornada devuelve 403 y no permite contrastar las URL reales. Recuperar el listado de Search Console antes de crear redirecciones o retirar URL.

## Oferta educativa, solo propuesta interna

Una revisión escrita de un lote y un periodo de hasta siete días de registros aportados, una hoja de seguimiento y una aclaración. Precio propuesto: 15 EUR por revisión, no público ni activo. Entrega propuesta: tres días laborables desde recibir datos completos, pendiente de capacidad real del dueño. Excluye diagnóstico/prescripción, atención urgente, certificaciones y garantía de resultados.

Hipótesis de trabajo: 30 minutos de revisión más soporte por medir. Coste = horas reales × coste horario acordado + comisiones reales de cobro + herramientas y demás costes aplicables. Beneficio = ingreso cobrado menos esos costes; 15 EUR no es beneficio. Validación: una revisión piloto de un registro anonimizado, sin venta ni cobro, anotando tiempo y si faltan datos. Aprobar alcance, precio y capacidad antes de ofrecerlo. No se proyecta la meta de 1.500 EUR; los 80 EUR siguen siendo el presupuesto aportado, no una cuota legal contrastada.
