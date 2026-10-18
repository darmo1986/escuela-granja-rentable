# Cuenta y reto

Sigue en borrador. No está publicado. No ejecutes este SQL desde el repositorio: lo corre quien administra el proyecto, en el editor SQL de Supabase, y solo cuando quiera encenderlo.

`js/config.js` ya apunta al proyecto `https://apdcgizpgguhmbgzsymx.supabase.co` con la clave publicable. No hay clave secreta en el repositorio. El correo y la contraseña usan ese proyecto. Si Supabase no responde, la página avisa y no guarda la contraseña. Google todavía no está activado: el botón lo dice y no redirige.

La biblioteca de acceso está en `js/vendor/supabase.js` (copia de `@supabase/supabase-js` 2.49.1, licencia MIT). Solo se descarga al abrir Entrar, en `/cuenta`, o si ya había una sesión `gr-auth`.

## Cuenta

El curso de este sitio es gratis. Entrar no lo cierra: copia el avance a la cuenta. El apodo público de la cuenta es `perfiles.nombre`. No sale del correo ni del nombre de Google (`full_name` o `name`). En Mi cuenta se puede cambiar. Si alguien entra sin apodo, la página se lo pide y, hasta entonces, el ranking enseña «Vecino» y cuatro caracteres. El concurso guarda su apodo en `concurso_partidas` y, si hay sesión, rellena el campo con `perfiles.nombre`. La cuenta ya aplica estas reglas, en el navegador y en `apodo_ok`: NFKC, lista blanca de letras latinas, números, espacio, apóstrofo y guion, sin caracteres invisibles ni cirílicos, y palabrota solo si es la palabra entera. Así pasan Putumayo, Maricarmen, Conchita, Cabrera y Diputado, y no pasan coño, polla, zorra, pinche, idiota, fuck ni pvta. El concurso de la otra rama tiene que usar `apodo_ok` (o `GRAuth.apodo`): hoy todavía recorta por raíces.

### Proyecto

1. El proyecto gratis ya existe. La clave publicable ya está en `js/config.js`. No subas la `service_role`.
2. Authentication → URL configuration. Site URL: `https://granjarentable.com`. En Redirect URLs añade `https://granjarentable.com/cuenta.html` y, para probar, `http://127.0.0.1:8765/cuenta.html`.
3. Authentication → Providers → Email: deja el correo activo, con «Confirm email» encendido.
4. El correo incluido en el plan gratis va muy limitado. Para el sitio de verdad, abre SMTP y pon un servidor propio.
5. En el editor SQL, ejecuta en orden `supabase/migrations/20261018120000_reto.sql`, `20261018120100_cuenta.sql`, `20261018130000_apodo.sql` y `20261018140000_apodo_reglas.sql`. Cada tabla queda con RLS. La segunda migración rellena `perfiles` para quien ya existiera en `auth.users`. La última fija las reglas del apodo y deja el premio del reto en 20 €. No se han ejecutado desde el repositorio.
6. Mientras las tablas no existan, guardar un cálculo muestra el error. No digas al visitante que faltan migraciones.

### Google

1. En Google Cloud Console crea un cliente OAuth de tipo aplicación web.
2. URI de redirección: `https://apdcgizpgguhmbgzsymx.supabase.co/auth/v1/callback`.
3. Copia el ID y el secreto a Supabase → Authentication → Providers → Google, y actívalo.

## Reto

`/preguntas` no está en el menú ni en el sitemap. La página pública solo dice que todavía no está abierto. No anuncia el premio ni muestra un ranking de ejemplo.

El esquema (preguntas de cuatro opciones, 30 segundos, ranking por `perfiles.nombre`) se deja limpio por si otra página lo reutiliza. No cambies los nombres de tablas ni de funciones sin avisar.

El ranking es de cada mes: `periodo` es `AAAA-MM` y `ranking_mes` solo lee ese mes. Al cambiar el mes, la tabla de puestos vuelve a empezar.

Pablo ha fijado el premio del reto: el primero de cada mes gana 20 €. Esa cifra está en `quiz_premios.euros` (solo 20). No es el premio del concurso de la otra rama: ese concurso, hoy, no tiene premio. La página pública sigue sin anunciarlo hasta que se cierren las bases (ámbito por país, menores, fiscalidad).

Cuando se encienda:

- `preguntas_publicas` no devuelve la opción correcta.
- `responder` y `cerrar_abiertas` guardan IP y aparato en cada intento.
- El admin se marca a mano: `update public.perfiles set es_admin = true where id = 'UUID';`
- El premio se anota en `quiz_premios` con 20 €. El pago sigue siendo manual.

Si se escribe una pregunta sobre el calcio de la puesta, la explicación tiene que ser esta, sin cifra que parezca una dosis: «El pienso de postura ya lleva calcio. Además, deja concha o grit a libre disposición: la gallina toma lo que le falta.»

## Plan gratis

Cifras públicas de supabase.com/pricing al armar esta nota. Conviene mirarlas otra vez antes de encender: 0 € al mes, 500 MB de base, 50.000 usuarios activos al mes, y el proyecto se puede pausar si pasa una semana casi sin consultas.
