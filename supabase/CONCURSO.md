# Concurso

Esta migración no se ha ejecutado. Hay que pegar `supabase/migrations/20261018140200_concurso.sql` en el editor SQL de Supabase y correrla ahí.

Crea solo `public.concurso_partidas`. No abre cuentas, no guarda correos y no define premios. El nombre público es el apodo que escribe quien juega.

Hasta que esa tabla exista, `/concurso.html` guarda el ranking en el navegador y lo dice en la página. `js/config.js` deja `comunidad.concursoPublicado` en `false` para no llamar a una tabla que todavía no está. Después de ejecutar el SQL, pasa ese valor a `true`: entonces un visitante puede guardar una marca y cualquiera puede leer las mejores.

Cada acierto vale 10 puntos y hasta 5 más por responder pronto. Diez preguntas: máximo 150. El apodo tiene entre 2 y 20 caracteres. Hay un tope de 8 envíos por apodo en 24 horas.
