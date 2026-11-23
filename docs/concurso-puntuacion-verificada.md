# Puntuación verificada del concurso: revisión en pruebas
**Candidato desactivado. No fusionar ni aplicar en producción mientras falten las pruebas de integración, el banco privado y la aprobación del corte.**

La migración crea un circuito independiente. No toca el juego de práctica, el banco público, `ranking_mensual`, datos existentes, ni email/pagos. Instalar no habilita ningún periodo. No se puede contar ninguna puntuación antigua como verificada. El mes y los 30 segundos se evalúan con el reloj de PostgreSQL en la zona Europe/Madrid, no con valores del navegador. El ranking solo admite partidas completas y muestra la mejor puntuación por cuenta/mes; después ordena por el tiempo medio de las 100 preguntas (los tiempos vencidos computan 30 s). Un empate exacto comparte puesto para revisión humana, sin criterio adicional oculto.

## Datos privados y reglas antes de anunciar
- Mantener `concurso_verificado` fuera de los esquemas expuestos por la API, del repositorio y de GitHub Pages. Las únicas entradas públicas son las cuatro funciones del contrato. No cargar preguntas conocidas del banco de práctica en el circuito de premio.
- Revisar y cargar por canal privado un banco nuevo de al menos 100 preguntas aprobadas. Cada registro usa `period` (primer día del mes en Madrid), `category`, `prompt`, `choices` (array de cuatro opciones distintas), `correct_choice` (1–4) y `explanation` (texto plano). Es importante revisar duplicados semánticos al cargar. Las preguntas asignadas se congelan y una cuenta no las repite dentro del mes. Si solo se cargan 100, solo hay una partida verificada por cuenta; puede seguir jugando en el modo práctica. **No prometer repeticiones verificadas ilimitadas con un banco finito.**
- El circuito verificado no devuelve soluciones ni explicaciones durante el mes, ni lanza solicitudes de contacto. Mantener en práctica las explicaciones inmediatas; si se ofrece repaso tras cierre, diseñarlo y validarlo aparte. Clarificar esta diferencia en las bases antes del corte. El etiquetado de ambos rankings y el tratamiento de marcas anteriores no se resuelven con una migración.
- El alias público es pseudónimo generado por el servidor; no se envía ni guarda el correo en este nuevo circuito. Las cuentas de Supabase existentes permiten correlación en un procedimiento restringido del administrador, sin publicar sus datos.

## Contrato de las funciones
| Operación | Entrada | Salida |
|--|--|--|
| `concurso_verificado_empezar` | Ninguna, sesión obligatoria | `{attempt_id,status:"ready",answered,total:100}`. Retoma la partida abierta. Si ya acabó y no hay 100 preguntas nuevas, devuelve el último resultado propio; sin banco ni resultado, `contest_bank_unavailable`. |
| `concurso_verificado_pregunta` | `p_attempt` (UUID) | `{attempt_id,status:"question",position,total,category,prompt,choices,deadline,server_now}`. Recargar no reinicia el tiempo. Si la pregunta venció, el navegador manda `null`; si el mes cerró, devuelve `contest_closed`. Una partida completa devuelve el resultado final propio. |
| `concurso_verificado_responder` | `p_attempt` (UUID), `p_position` (1–100), `p_choice` (1–4, o `null` al vencer) | `{attempt_id,status,answered,total}`; `status:"finished"` también tiene `score` y `mean_ms`. Repetir una petición ya confirmada no vuelve a puntuar. No hay información de corrección individual. |
| `concurso_verificado_ranking` | Ninguna, lectura pública | `{status:"open"|"closed",period:"YYYY-MM-01"|null,rows:[{alias,score,mean_ms,rank}]}`; hasta diez resultados, los empates exactos comparten puesto. |

## Puertas de aceptación
1. En un **proyecto Supabase de pruebas**, copiar la migración y usar dos cuentas de QA que no existan en el entorno real. Cargar solo datos ficticios para el periodo de pruebas. Antes de activarlo allí, comprobar catálogo privado, roles API, login/sesión caducada y que la práctica siga disponible. Verificar que los recursos estáticos no incluyan banco competitivo.
2. Ejecutar la partida de 100, plazo real de 30 s, recarga/pérdida de red, envíos legítimos concurrentes desde dos pestañas de la misma cuenta y separación entre cuentas. Comprobar HTTP y CORS del ranking, estados cerrados y vacíos, resultados desempatados por tiempo, empate exacto y cambio de mes Madrid. No usar como prueba simplemente que la UI muestre un número.
3. Con datos ficticios, comparar el resultado y el ranking con el historial privado del intento. Cerrar el periodo, consultar los candidatos en sesión de administrador y verificar que el contacto a la cuenta correcta sigue siendo manual; no enviar ni cobrar nada en las pruebas. Confirmar revisión individual e incidencias de empates.
4. Mantener desactivado en producción hasta aprobar reglas y corte, comprobar todo lo anterior y resolver el plan para las marcas históricas. Si algo falla después del corte, el operador deshabilita el periodo; no se borran los intentos. El short y anuncios esperan a la verificación independiente del recorrido completo.

## Revisión manual: lectura restringida tras cierre
Ejecutar solo desde una sesión SQL de administración autorizada. Sustituir el periodo; en pruebas usar exclusivamente cuentas ficticias. No mostrar el UUID en la web. Contrastar también las incidencias de tiempo y los intentos individuales antes de confirmar una identidad; **no existe transferencia automática**.

```sql
with best as (
  select distinct on (a.user_id) a.id, a.user_id, a.alias, a.score, a.sum_ms, a.finished_at
  from concurso_verificado.attempts a
  where a.period = date '2026-11-01'
    and clock_timestamp() >= concurso_verificado.month_end(a.period)
    and a.finished_at < concurso_verificado.month_end(a.period)
  order by a.user_id, a.score desc, a.sum_ms, a.finished_at, a.id
), ranked as (
  select *, dense_rank() over(order by score desc, sum_ms) as rank from best
)
select r.id as attempt_id, r.user_id, r.alias, r.score,
       round(r.sum_ms/100.0)::int as mean_ms, r.rank,
       i.answered, i.score_check, i.time_check
from ranked r
cross join lateral (
  select count(*) filter(where answered_at is not null) as answered,
         count(*) filter(where is_correct) as score_check, sum(elapsed_ms) as time_check
  from concurso_verificado.items i where i.attempt_id = r.id
) i
where r.rank <= 3
order by r.rank, r.alias;
```

La prueba desechable `tests/contest-verified.test.mjs` utiliza un PostgreSQL real compilado a WASM (PGlite) en memoria. Instalar su dependencia temporalmente fuera del sitio publicado y pasar la ruta de la migración como argumento. No sustituye la prueba de roles JWT/PostgREST ni la de concurrencia real en Supabase.

Ejemplo local, en un directorio desechable con ambos archivos copiados del repositorio:

```sh
npm install --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.17
node contest-verified.test.mjs ./20261123091500_concurso_verificado.sql
```

## Integración de la página (apagada en este borrador)

`concurso.html` conserva `data-concurso-verificado="off"`: no importa el módulo verificado ni llama a sus RPC y la página publicada no cambia por este borrador. En una copia **de pruebas** cuya configuración apunte a la instancia local, poner `on` separa la partida para el premio del modo práctica, y suprime las lecturas y escrituras del ranking antiguo en esta página. Incluso si falla la carga del módulo, la práctica nunca envía la marca al ranking. Las marcas de clientes/HTML antiguos no se migran ni se leen desde el ranking verificado.

El modo verificado lee el estado oficial del mes, solicita sesión antes de abrir una partida, preserva el intento al recargar, muestra el alias anónimo y actualiza la tabla tras completar. Un error inicial no abre la competición. Dos estados se distinguen: mes cerrado y ranking no disponible. Las respuestas y la clasificación se renderizan como texto, no como HTML. El backend conserva la autoridad sobre plazo, grado y cuenta. Esto solo añade la UI que consume los RPC; no modifica el pago ni autoriza la apertura.

Antes de un corte, aprobar explícitamente estas tres condiciones en las bases visibles: **cuántas partidas verificadas** se permiten con el banco disponible (el enlace actual no ofrece un botón para repetir una partida verificada después de completarla); **cuándo se muestran las soluciones** (inmediatas en práctica y ocultas en el circuito verificado; no hay repaso posterior implementado); y **cómo se resuelve un empate exacto** de aciertos y tiempo (la clasificación muestra el mismo puesto y no adjudica automáticamente el premio). No convertir estos huecos en reglas implícitas. Mantener el banco real fuera del sitio y de GitHub, y revisar que banners/enlaces coincidan con el estado confirmado antes de atraer tráfico.

Pruebas focalizadas del navegador simulado (sin Supabase ni red): `node --test js/concurso-verificado/contest-entry.test.mjs`. Comprobar además en un navegador con la web de pruebas el foco, login, recuperación tras recarga/salida, tiempos, cierre y textos; la cobertura local del controlador y API no sustituye esa revisión.
