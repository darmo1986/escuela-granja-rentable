# Cuenta y reto

Sigue en borrador. No está publicado. No ejecutes este SQL desde el repositorio: lo corre quien administra el proyecto, en el editor SQL de Supabase, y solo cuando quiera encenderlo.

`js/config.js` ya apunta al proyecto `https://apdcgizpgguhmbgzsymx.supabase.co` con la clave publicable. No hay clave secreta en el repositorio. El correo y la contraseña usan ese proyecto. Si Supabase no responde, la página avisa y no guarda la contraseña. Google todavía no está activado: el botón lo dice y no redirige.

La biblioteca de acceso está en `js/vendor/supabase.js` (copia de `@supabase/supabase-js` 2.49.1, licencia MIT). Solo se descarga al abrir Entrar, en `/cuenta`, o si ya había una sesión `gr-auth`.

## Cuenta

El curso de este sitio es gratis. Entrar no lo cierra: copia el avance a la cuenta. El apodo público de la cuenta es `perfiles.nombre`. No sale del correo ni del nombre de Google (`full_name` o `name`). En Mi cuenta se puede cambiar. Si alguien entra sin apodo, la página se lo pide y, hasta entonces, el ranking enseña «Vecino» y cuatro caracteres. El concurso, si hay sesión, rellena su campo con `perfiles.nombre`. No guarda ahí su propio apodo. La regla compartida es `public.apodo_ok` (en el navegador, `GRAuth.apodo`): NFKC, lista blanca de letras latinas, números, espacio, apóstrofo y guion, sin caracteres invisibles ni cirílicos. Antes de comparar quita acentos y marcas, trata ı como i, ụ como u y v como u, y separa las letras modificadoras. La palabrota cuenta si es la palabra entera. La raíz `put` (también `pvt`, porque la v se lee como u) se rechaza al principio, al final o en medio si la rodean un prefijo y un sufijo de insulto, salvo nombres reales. Así pasan Putumayo, Maricarmen, Conchita, Cabrera, Diputado, Gonçalo, O'Brien, Łukasz, disputa, computadora, Disputo, Reputo, Imputo, Computa, Putri, Putra, Putnam y Puttanesca, y no pasan coño, polla, zorra, pinche, idiota, fuck, pvta, pụta, ıdiota, pvto, hijodeputa, putamadre, joder, culo, imbécil, bitch, putita, pvtita, granjaputa, Elputo, subnormal, perra, shit, carajo, Putin, laputaza, hijoeputaso, superputaso, ˍmierda ni ʍierda. Si el apodo no vale, la página dice la norma: no enseña el error de la base. El concurso tiene que llamar a `apodo_ok`, no a una lista de raíces propia.

### Proyecto

1. El proyecto gratis ya existe. La clave publicable ya está en `js/config.js`. No subas la `service_role`.
2. Authentication → URL configuration. Site URL: `https://granjarentable.com`. En Redirect URLs añade `https://granjarentable.com/cuenta.html` y, para probar, `http://127.0.0.1:8765/cuenta.html`.
3. Authentication → Providers → Email: deja el correo activo, con «Confirm email» encendido.
4. El correo incluido en el plan gratis va muy limitado. Para el sitio de verdad, abre SMTP y pon un servidor propio.
5. En el editor SQL, ejecuta en este orden. Cada tabla queda con RLS. No se han ejecutado desde el repositorio.
   1. `supabase/migrations/20261018120000_reto.sql`
   2. `supabase/migrations/20261018120100_cuenta.sql` (rellena `perfiles` si ya había usuarios)
   3. `supabase/migrations/20261018130000_apodo.sql`
   4. `supabase/migrations/20261018140000_apodo_reglas.sql` (`apodo_ok`)
   5. `supabase/migrations/20261018140100_premio.sql` (`premio_euros`)
   6. La del concurso, cuando se rebase: tiene que usar `apodo_ok` y `premio_euros()`.
6. Mientras las tablas no existan, guardar un cálculo muestra el error. No digas al visitante que faltan migraciones.

### Google

1. En Google Cloud Console crea un cliente OAuth de tipo aplicación web.
2. URI de redirección: `https://apdcgizpgguhmbgzsymx.supabase.co/auth/v1/callback`.
3. Copia el ID y el secreto a Supabase → Authentication → Providers → Google, y actívalo.

## Reto

`/preguntas` no está en el menú ni en el sitemap. La página pública solo dice que todavía no está abierto. No anuncia un premio ni muestra un ranking de ejemplo. El reto no tiene premio.

El concurso son 10 preguntas, 4 respuestas y 30 s. El esquema de preguntas queda por si otra página lo reutiliza. No cambies los nombres de tablas ni de funciones sin avisar.

El ranking del reto es de cada mes: `periodo` es `AAAA-MM` y `ranking_mes` solo lee ese mes. Al cambiar el mes, la tabla de puestos vuelve a empezar. Eso no reparte dinero.

## Premio del concurso

El premio es del concurso, no del reto. Son 10 preguntas, 4 respuestas y 30 s. Gana quien más acierta. Si empatan en aciertos, el desempate es un sorteo en el servidor entre los empatados, y queda guardado. El mes se cuenta en hora de Madrid (`Europe/Madrid`): al empezar el mes siguiente el ranking público vuelve a cero y la marca del mes cerrado queda para el premio.

La cifra está solo en `public.premio_euros()`. El navegador la lee de esa función. No hay una copia en `js/config.js`. El concurso tiene que llamarla y no repetir la cantidad. El pago sigue siendo manual. `/preguntas` no lo anuncia. Las bases están en la página del concurso.

`quiz_premios.origen` es obligatorio y no tiene valor por defecto. `anon` y `authenticated` no tienen ningún permiso de escritura sobre `quiz_premios` ni `reto_premios`: ni insertar, ni actualizar, ni borrar, ni `TRUNCATE`, ni `TRIGGER`. Solo `authenticated` puede leer. El trigger `quiz_premios_guardar` no es `security definer` y solo deja escribir a `postgres`, `service_role` o `supabase_admin`. El historial público es `concurso_historial()`. El formulario solo debe reclamar si `concurso_premio_pendiente(periodo)` devuelve true: usa `auth.uid()` y `anon` no puede ejecutarla. Una fila del reto no entra en `quiz_premios`: si el administrador la manda con `origen = 'reto'`, el trigger la guarda en `reto_premios`. Las filas que ya estuvieran, incluidas las pagadas, se copian a `reto_premios` sin cambiar el importe. `supabase/pruebas.sql` comprueba los permisos y los apodos en una base local.

Cuando se encienda el reto:

- `preguntas_publicas` no devuelve la opción correcta.
- `responder` y `cerrar_abiertas` guardan IP y aparato en cada intento.
- El admin se marca a mano: `update public.perfiles set es_admin = true where id = 'UUID';`

Si se escribe una pregunta sobre el calcio de la puesta, la explicación tiene que ser esta, sin cifra que parezca una dosis: «El pienso de postura ya lleva calcio. Además, deja concha o grit a libre disposición: la gallina toma lo que le falta.»

## Plan gratis

Cifras públicas de supabase.com/pricing al armar esta nota. Conviene mirarlas otra vez antes de encender: 0 € al mes, 500 MB de base, 50.000 usuarios activos al mes, y el proyecto se puede pausar si pasa una semana casi sin consultas.
