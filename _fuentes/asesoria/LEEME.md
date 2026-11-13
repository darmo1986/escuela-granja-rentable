# Acompañamiento privado — 13 noviembre 2026

Implementación preparada en rama independiente desde main cd6a8b5b. No fusionada,
sin despliegue ni altas reales. `GR.asesoria.activa` permanece en false.

## Recorrido

- `premium.html`: presentación, precio total 29 €, 30 días, diez consultas,
  respuesta máxima de 24 horas y enlace al área privada. Distingue las diez
  preguntas iniciales de las diez consultas del mes.
- `asesoria.html`: misma cuenta Supabase del sitio, cuestionario de diez preguntas,
  plan publicado por el asesor, descarga PDF real en el navegador y conversaciones
  separadas por tema. Sin respuestas automáticas. Los clientes no editan el plan.
- El administrador se identifica por `perfiles.es_admin`, nunca por un correo
  escrito en JavaScript. Ve los clientes con nombre y correo, sus fichas y planes.
- Stripe verifica el precio y el pago en servidor. El webhook firmado activa
  una sola vez 30 días. Reembolsos completos y disputas revocan nuevas escrituras.
  El historial sigue legible al vencer o revocar; no hay renovación automática.
- Correo: aviso con enlace al panel, sin contenido de consulta. Se responde en
  el panel. No hay recepción ni sincronización de respuestas por email.
- Diez temas por mes; aclaraciones dentro del mismo tema no consumen otro.
  Sin archivos adjuntos en esta primera versión. Actualización mediante botón.
- La promoción gratuita anterior mantiene su formulario dentro de un desplegable;
  no activa Premium. El botón de pago antiguo está oculto y no es submit.

## Activación pendiente (no realizada)

1. Aplicar `supabase/migrations/20261113221000_asesoria.sql` sobre un proyecto
   con las migraciones de cuenta y panel existentes. Verificar administrador.
2. Despliegue pendiente de aprobación específica de configuración: la revisión
   automática bloqueó incluir `supabase/config.toml` con `verify_jwt=false`.
   Ese archivo NO forma parte del borrador remoto y no se ha desplegado.
   La función nueva verifica cada sesión con Auth y cada webhook con HMAC de
   Stripe; aun así, la plataforma requiere autorización expresa para desactivar
   su verificación JWT en este endpoint. Resolver esa aprobación antes de
   desplegar o activar cobros; no aplicar una vía alternativa para eludirla.
3. Configurar en el servidor, sin subir secretos a Git:
   - SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY (entorno Edge).
   - STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET.
   - RESEND_API_KEY y ASESORIA_MAIL_FROM (remitente con dominio verificado).
   - ASESORIA_ADMIN_EMAIL (correo del propietario autorizado).
   - ASESORIA_CHECKOUT_ENABLED=true solo tras los ensayos en modo prueba.
4. Crear webhook Stripe hacia
   `https://apdcgizpgguhmbgzsymx.supabase.co/functions/v1/asesoria?webhook=stripe`.
   Eventos: checkout.session.completed, checkout.session.async_payment_succeeded,
   charge.refunded y charge.dispute.created. El checkout solo acepta tarjeta.
5. En modo prueba: pagar, repetir webhook sin ampliar el acceso, entrar con dos
   cuentas, abrir diez consultas, responder, publicar y descargar PDF; probar
   devolución y avisos de ambos destinatarios. Verificar que no se generan
   duplicados al reintentar checkout con la misma cuenta durante el día UTC.
6. Revisar visualmente móvil y escritorio y concretar con el titular la operación
   de cancelaciones, retención/borrado y gestión de plazas antes de abrir cobros.
   La implementación no fuerza un cupo de diez clientes; conserva diez consultas
   por cliente. No se promete un cupo de plazas en la nueva página.
7. Tras autorización de publicación del propietario, habilitar el interruptor de
   cliente, publicar y verificar producción. No activar enlaces nuevos para cobrar
   antes de configurar y comprobar servidor y webhook.

Los avisos se reintentan al enviar/guardar, tras el pago o al pulsar Actualizar.
No se ha creado una tarea programada de correo. Un fallo de email no borra el
mensaje: el panel es la fuente principal y muestra que el aviso no está confirmado.
Una segunda compra pagada desde una sesión antigua mientras ya hay mes activo
requiere revisión manual; el webhook no amplía automáticamente el mes existente.
Las compras anteriores no se migran por el simple conocimiento de un código: el
titular debe verificar el pago y asociarlas con la cuenta correcta desde servidor.

## Validación realizada

- 53 pruebas Python existentes aprobadas y prueba Node del carrusel aprobada.
- `test_asesoria_db.cjs`: migración ejecutada en PostgreSQL WASM/PGlite; aislamiento
  real por roles y RLS, bloqueo de activación y edición por clientes, cuestionario,
  cupo de consultas, aclaraciones, vencimiento, revocación e idempotencia.
- `test_asesoria_edge.cjs`: firma HMAC, tolerancia temporal, autenticación (también tokens inválidos sin llamadas a la base de datos), precio
  fijo, parámetros estables de checkout, activación y revocación por devolución.
- `test_asesoria_ui.cjs`: DOM con cuentas ficticias, diez campos, panel de asesor,
  envío, renderizado de mensajes como texto, PDF de varias páginas y limpieza de
  contenido privado al salir y descarte de respuestas de autenticación tardías tras salir. No supone conexión real a Stripe/Supabase/Resend.
- IDs únicos y recursos locales correctos en portada, Premium y área privada.
- `git diff --check` y comprobación de sintaxis JavaScript.
- Pendiente revisión visual: Chromium local no pudo iniciarse por restricción de
  sockets del entorno. No se atribuyen capturas ni pruebas reales de móvil.

Repetir pruebas nuevas:

```sh
npm install --prefix /tmp/asesoria-qa @electric-sql/pglite jsdom
NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_asesoria_db.cjs
NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_asesoria_ui.cjs
node blog/pruebas/test_asesoria_edge.cjs
```

## Imagen de portada

Archivo: `img/premium/acompanamiento.webp` (1600 × 900). Imagen generada con la
herramienta disponible, sin control seleccionable de modelo «Imagines 2.5»; se
comunicó esa limitación. No es un retrato del propietario. Generación original
conservada fuera del repositorio; WebP optimizado dentro del sitio.

Prompt utilizado: premium photographic website hero for personalized poultry
advice; realistic healthy adult laying hens in a tidy small wooden coop; farmer
shown from torso down holding a plain clipboard, scoop of feed on a clean table;
natural golden light, deep forest green and cream, editorial agriculture photo,
wide 16:9, calm dark negative space at left; no text, logos, watermark or UI;
anatomically correct birds; illustrative scene, not a claimed owner portrait.

PDF-lib 1.17.1 se sirve localmente, con su licencia MIT incluida. El PDF descarga
texto con saltos de página y fecha de revisión. Caracteres fuera de la fuente
Helvetica WinAnsi se sustituyen por `?`; los acentos del español se conservan.
