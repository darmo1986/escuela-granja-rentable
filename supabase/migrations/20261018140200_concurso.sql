-- Concurso: el servidor califica. No se ha ejecutado.
-- Pablo: pega ESTE archivo en el editor SQL de Supabase y ejecútalo entero.
-- No uses un borrador anterior: aquel dejaba a anon insertar el puntaje.
-- Si ese borrador llegó a crearse (la tabla concurso_partidas ya existe),
-- bórralo antes con: drop table if exists public.concurso_partidas cascade;
--
-- Después, en js/config.js, pasa comunidad.concursoPublicado a true.
-- Para esconder una marca: en el editor de tablas, oculto = true en esa fila.
-- No hay premios. No se guarda correo ni IP.

create or replace function public.concurso_norm(p text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(
      lower(translate(
        coalesce(p, ''),
        'áàäéèëíìïóòöúùüñÁÀÄÉÈËÍÌÏÓÒÖÚÙÜÑ',
        'aaaeeeiiiooouuunAAAEEEIIIOOOUUUN'
      )),
      '013457@',
      'oieasta'
    ),
    '[._[:space:]-]+',
    '',
    'g'
  );
$$;

create or replace function public.concurso_apodo_ok(p text)
returns boolean
language plpgsql
immutable
as $$
declare
  n text;
  w text;
  roots text[] := array[
    'put', 'mierd', 'pend', 'cabr', 'maric', 'nazi', 'nigg', 'hitler',
    'faggot', 'asshole', 'gilipoll', 'verga', 'culer', 'ching', 'hdp',
    'malparid', 'gonorre', 'conch', 'bolud', 'pelotud', 'huevon', 'cojud',
    'viagra', 'casino', 'porno', 'cripto'
  ];
begin
  if p is null or position('@' in p) > 0 or p ~ '[0-9]{8,}' then
    return false;
  end if;
  n := public.concurso_norm(p);
  if n is null or char_length(n) < 2 then
    return false;
  end if;
  foreach w in array roots loop
    if strpos(n, w) > 0 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.concurso_norm(text) from public;
revoke all on function public.concurso_apodo_ok(text) from public;

create table if not exists public.concurso_preguntas (
  id text primary key,
  tema text not null,
  pregunta text not null,
  opciones jsonb not null,
  correcta int not null check (correcta between 0 and 3),
  explicacion text not null,
  fuente text not null,
  constraint concurso_preguntas_opciones check (
    jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) = 4
  )
);

comment on table public.concurso_preguntas is
  'Banco del concurso. Sin permiso de lectura para visitantes: la califica el servidor.';

create table if not exists public.concurso_sesiones (
  id uuid primary key default gen_random_uuid(),
  apodo text not null,
  pais text,
  preguntas jsonb not null,
  indice int not null default 0,
  marca timestamptz,
  aciertos int not null default 0,
  puntaje int not null default 0,
  segundos int not null default 0,
  cerrada boolean not null default false,
  creado timestamptz not null default clock_timestamp()
);

comment on table public.concurso_sesiones is
  'Partida en curso. El reloj es marca, en el servidor. No la lee el visitante.';

create table if not exists public.concurso_partidas (
  apodo_norm text primary key,
  apodo text not null,
  pais text,
  puntaje int not null,
  aciertos int not null,
  segundos int not null,
  oculto boolean not null default false,
  creado timestamptz not null default clock_timestamp(),
  constraint concurso_partidas_apodo_len check (char_length(btrim(apodo)) between 2 and 40),
  constraint concurso_partidas_apodo_forma check (position('@' in apodo) = 0),
  constraint concurso_partidas_apodo_ok check (public.concurso_apodo_ok(apodo)),
  constraint concurso_partidas_pais check (pais is null or pais ~ '^[A-Z]{2}$'),
  constraint concurso_partidas_aciertos check (aciertos between 0 and 10),
  constraint concurso_partidas_puntaje check (
    puntaje between 1 and 150
    and puntaje >= aciertos * 10
    and puntaje <= aciertos * 15
  ),
  constraint concurso_partidas_segundos check (
    segundos between 1 and 300
    and segundos >= aciertos
  )
);

comment on column public.concurso_partidas.oculto is
  'El administrador lo pone en true desde el editor de Supabase para esconder la fila.';

create index if not exists concurso_partidas_ranking
  on public.concurso_partidas (puntaje desc, segundos asc, creado asc);

alter table public.concurso_preguntas enable row level security;
alter table public.concurso_sesiones enable row level security;
alter table public.concurso_partidas enable row level security;

drop policy if exists concurso_partidas_leer on public.concurso_partidas;
create policy concurso_partidas_leer on public.concurso_partidas
  for select to anon, authenticated
  using (not oculto);

drop policy if exists concurso_partidas_insertar on public.concurso_partidas;

revoke all on table public.concurso_preguntas from public, anon, authenticated;
revoke all on table public.concurso_sesiones from public, anon, authenticated;
revoke all on table public.concurso_partidas from public, anon, authenticated;
grant select on table public.concurso_partidas to anon, authenticated;

create or replace function public.concurso_empezar(p_apodo text, p_pais text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ap text;
  pa text;
  n int;
  rec record;
  orden int[];
  i int;
  j int;
  tmp int;
  shown jsonb;
  pack jsonb := '[]'::jsonb;
  salida jsonb := '[]'::jsonb;
  sid uuid;
  k int;
begin
  ap := regexp_replace(btrim(coalesce(p_apodo, '')), '\s+', ' ', 'g');
  if char_length(ap) < 2 or char_length(ap) > 40
     or not public.concurso_apodo_ok(ap) then
    raise exception 'apodo no permitido' using errcode = '23514';
  end if;
  pa := nullif(upper(btrim(coalesce(p_pais, ''))), '');
  if pa is not null and pa !~ '^[A-Z]{2}$' then
    raise exception 'pais no permitido' using errcode = '23514';
  end if;
  select count(*) into n from public.concurso_sesiones
    where creado > clock_timestamp() - interval '1 minute';
  if n >= 30 then
    raise exception 'limite de envios' using errcode = '23514';
  end if;
  select count(*) into n from public.concurso_sesiones
    where lower(apodo) = lower(ap)
      and creado > clock_timestamp() - interval '1 day';
  if n >= 8 then
    raise exception 'limite de envios' using errcode = '23514';
  end if;
  for rec in
    select id, tema, pregunta, opciones
    from public.concurso_preguntas
    order by random()
    limit 10
  loop
    orden := array[0, 1, 2, 3];
    for i in reverse 3..1 loop
      j := floor(random() * (i + 1))::int;
      tmp := orden[i + 1];
      orden[i + 1] := orden[j + 1];
      orden[j + 1] := tmp;
    end loop;
    shown := '[]'::jsonb;
    for k in 1..4 loop
      shown := shown || jsonb_build_array(rec.opciones -> orden[k]);
    end loop;
    pack := pack || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'orden', to_jsonb(orden)
    ));
    salida := salida || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'tema', rec.tema,
      'pregunta', rec.pregunta,
      'opciones', shown
    ));
  end loop;
  if jsonb_array_length(pack) < 10 then
    raise exception 'banco incompleto' using errcode = '23514';
  end if;
  insert into public.concurso_sesiones (apodo, pais, preguntas, indice, marca)
  values (ap, pa, pack, 0, clock_timestamp())
  returning id into sid;
  return jsonb_build_object('partida', sid, 'preguntas', salida);
end;
$$;

create or replace function public.concurso_abrir(p_partida uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.concurso_sesiones%rowtype;
begin
  select * into s from public.concurso_sesiones where id = p_partida for update;
  if not found or s.cerrada then
    raise exception 'partida cerrada' using errcode = '23514';
  end if;
  if s.marca is null then
    update public.concurso_sesiones
      set marca = clock_timestamp()
      where id = s.id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.concurso_responder(p_partida uuid, p_opcion int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.concurso_sesiones%rowtype;
  item jsonb;
  qid text;
  orden jsonb;
  elapsed numeric;
  timeout boolean := false;
  muy_rapido boolean := false;
  canonical int := -1;
  correcta int;
  explicacion text;
  fuente text;
  boton int := -1;
  i int;
  puntos int := 0;
  base int := 0;
  extra int := 0;
  seg int;
  usado numeric;
  acertada boolean := false;
  suma boolean := false;
begin
  select * into s from public.concurso_sesiones where id = p_partida for update;
  if not found or s.cerrada or s.marca is null then
    raise exception 'partida cerrada' using errcode = '23514';
  end if;
  item := s.preguntas -> s.indice;
  if item is null then
    raise exception 'partida cerrada' using errcode = '23514';
  end if;
  qid := item->>'id';
  orden := item->'orden';
  elapsed := extract(epoch from (clock_timestamp() - s.marca)) * 1000;
  timeout := elapsed > 32000;
  select p.correcta, p.explicacion, p.fuente
    into correcta, explicacion, fuente
    from public.concurso_preguntas p
    where p.id = qid;
  if p_opcion is not null and p_opcion between 0 and 3 and not timeout then
    canonical := (orden->>p_opcion)::int;
  end if;
  muy_rapido := elapsed < 1000 and canonical >= 0 and not timeout;
  acertada := canonical = correcta and not timeout;
  suma := acertada and not muy_rapido;
  if suma then
    usado := least(30000, greatest(1000, elapsed));
    extra := round(5 * (1 - usado / 30000.0));
    base := 10;
    puntos := base + extra;
    seg := greatest(1, least(30, ceil(elapsed / 1000.0)::int));
    s.aciertos := s.aciertos + 1;
  else
    if timeout then
      seg := 30;
    else
      seg := greatest(1, least(30, ceil(greatest(elapsed, 1) / 1000.0)::int));
    end if;
  end if;
  s.puntaje := s.puntaje + puntos;
  s.segundos := s.segundos + seg;
  for i in 0..3 loop
    if (orden->>i)::int = correcta then
      boton := i;
    end if;
  end loop;
  s.indice := s.indice + 1;
  s.marca := null;
  if s.indice >= jsonb_array_length(s.preguntas) then
    s.cerrada := true;
    if s.puntaje > 0 and s.segundos >= s.aciertos then
      insert into public.concurso_partidas as c
        (apodo_norm, apodo, pais, puntaje, aciertos, segundos)
      values (lower(s.apodo), s.apodo, s.pais, s.puntaje, s.aciertos, s.segundos)
      on conflict (apodo_norm) do update set
        apodo = excluded.apodo,
        pais = coalesce(excluded.pais, c.pais),
        puntaje = excluded.puntaje,
        aciertos = excluded.aciertos,
        segundos = excluded.segundos,
        creado = clock_timestamp()
      where c.oculto = false
        and (
          excluded.puntaje > c.puntaje
          or (excluded.puntaje = c.puntaje and excluded.segundos < c.segundos)
        );
    end if;
  end if;
  update public.concurso_sesiones set
    indice = s.indice,
    marca = s.marca,
    aciertos = s.aciertos,
    puntaje = s.puntaje,
    segundos = s.segundos,
    cerrada = s.cerrada
  where id = s.id;
  return jsonb_build_object(
    'ok', suma,
    'acertada', acertada,
    'timeout', timeout,
    'muy_rapido', muy_rapido,
    'indice_correcto', boton,
    'explicacion', explicacion,
    'fuente', fuente,
    'puntos', puntos,
    'base', base,
    'rapido', extra,
    'acabada', s.cerrada,
    'puntaje', s.puntaje,
    'aciertos', s.aciertos,
    'segundos', s.segundos
  );
end;
$$;

revoke all on function public.concurso_empezar(text, text) from public;
revoke all on function public.concurso_abrir(uuid) from public;
revoke all on function public.concurso_responder(uuid, int) from public;
grant execute on function public.concurso_empezar(text, text) to anon, authenticated;
grant execute on function public.concurso_abrir(uuid) to anon, authenticated;
grant execute on function public.concurso_responder(uuid, int) to anon, authenticated;
