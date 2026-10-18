-- Concurso mensual. No se ha ejecutado. No incluye el banco de preguntas.
-- Pablo, en el editor SQL de Supabase y en este orden:
--   1) supabase/migrations/20261018120000_reto.sql
--   2) supabase/migrations/20261018120100_cuenta.sql
--   3) supabase/migrations/20261018130000_apodo.sql
--   4) supabase/migrations/20261018140000_apodo_reglas.sql
--   5) supabase/migrations/20261018140100_premio.sql
--   6) este archivo
--   7) el banco privado banco-concurso-v3.sql (no está en git;
--      ruta del agente: /cursor/stores/self/banco-concurso-v3.sql)
-- Después, en js/config.js, pasa comunidad.concursoPublicado a true.
--
-- La cifra del premio es public.premio_euros(). No se repite aquí.
-- Cada partida reparte la misma mezcla: 4 fáciles (1 punto), 3 medias (2) y
-- 3 difíciles (3). Gana quien más puntos suma. Si empatan en puntos, un
-- sorteo del servidor queda guardado en concurso_sorteos y no se vuelve a
-- tirar. Una cuenta no repite pregunta dentro del mes. El mes es Europe/Madrid.
-- El premio entra como pendiente_verificar. Cerrar el mes no lo concede.
-- El administrador lo aprueba a mano (estado pendiente) o lo anula.
-- Si lo anula, concurso_cerrar_meses pasa al siguiente, otra vez en
-- pendiente_verificar. El historial y el cobro esperan la aprobación.
-- Hay 14 días para reclamar desde que se aprueba.
-- anon y authenticated no pueden leer el banco ni las llaves del sorteo.

drop table if exists public.concurso_partidas cascade;
drop table if exists public.concurso_sesiones cascade;

drop function if exists public.concurso_empezar(text, text);
drop function if exists public.concurso_empezar(text);
drop function if exists public.concurso_empezar(text, boolean, text);
drop function if exists public.concurso_abrir(uuid);
drop function if exists public.concurso_responder(uuid, int);
drop function if exists public.concurso_revisar(text);
drop function if exists public.concurso_estado();
drop function if exists public.concurso_ganadores();
drop function if exists public.concurso_reclamar(text, text, text);
drop function if exists public.concurso_mantenimiento();
drop function if exists public.concurso_cerrar_meses();
drop function if exists public.concurso_texto(jsonb, int);
drop function if exists public.concurso_barajar();
drop function if exists public.concurso_norm(text);
drop function if exists public.concurso_apodo_ok(text);
drop function if exists public.concurso_turnstile_ok(text);

create or replace function public.concurso_barajar()
returns int[]
language plpgsql
volatile
as $$
declare
  a int[] := array[0, 1, 2, 3];
  i int;
  j int;
  tmp int;
begin
  for i in reverse 3..1 loop
    j := floor(random() * (i + 1))::int;
    tmp := a[i + 1];
    a[i + 1] := a[j + 1];
    a[j + 1] := tmp;
  end loop;
  return a;
end;
$$;

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
  'Banco del concurso. Sin lectura para el navegador: se carga aparte y no va en git.';

alter table public.concurso_preguntas
  add column if not exists dificultad text;

alter table public.concurso_preguntas
  drop constraint if exists concurso_preguntas_dificultad_check;

alter table public.concurso_preguntas
  add constraint concurso_preguntas_dificultad_check
  check (dificultad is null or dificultad in ('facil', 'media', 'dificil'));

comment on column public.concurso_preguntas.dificultad is
  'facil vale 1 punto, media vale 2 y dificil vale 3. Sin etiqueta no entra en una partida.';

create table public.concurso_sesiones (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  apodo text not null,
  pais text,
  mayor boolean not null default false,
  preguntas jsonb not null,
  indice int not null default 1 check (indice between 1 and 10),
  marca timestamptz,
  aciertos int not null default 0 check (aciertos between 0 and 10),
  puntos int not null default 0 check (puntos between 0 and 19),
  segundos numeric(8, 3) not null default 0 check (segundos >= 0 and segundos <= 400),
  cerrada boolean not null default false,
  ip text not null default '',
  creado timestamptz not null default clock_timestamp()
);

comment on table public.concurso_sesiones is
  'Partida en curso. La IP queda en la fila hasta que esa fila se borra, a los 7 días. Cada respuesta copia los milisegundos y la IP a concurso_respuestas, y eso dura hasta que el premio del mes está pagado.';

create table if not exists public.concurso_marcas (
  usuario uuid not null references public.perfiles (id) on delete cascade,
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  apodo text not null,
  pais text,
  aciertos int not null check (aciertos between 0 and 10),
  puntos int not null default 0 check (puntos between 0 and 19),
  segundos numeric(8, 3) not null check (segundos >= 0 and segundos <= 400),
  oculto boolean not null default false,
  partida uuid,
  creado timestamptz not null default clock_timestamp(),
  primary key (usuario, periodo)
);

comment on column public.concurso_marcas.oculto is
  'El administrador lo pone en true para descalificar. El premio pasa a la siguiente marca válida.';

create table if not exists public.concurso_sorteos (
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  llave double precision not null,
  primary key (periodo, usuario)
);

comment on table public.concurso_sorteos is
  'Desempate guardado. Se escribe una vez por marca. No se lee desde el navegador ni se vuelve a sortear.';

create table if not exists public.concurso_exclusiones (
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  usuario uuid not null,
  primary key (periodo, usuario)
);

comment on table public.concurso_exclusiones is
  'Quien ya quedó anulado u oculto en ese mes no vuelve a salir en el sorteo.';

alter table public.concurso_marcas add column if not exists puntos int not null default 0;
alter table public.concurso_marcas drop constraint if exists concurso_marcas_puntos_check;
alter table public.concurso_marcas add constraint concurso_marcas_puntos_check check (puntos between 0 and 19);

create table if not exists public.concurso_servidas (
  usuario uuid not null references public.perfiles (id) on delete cascade,
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  pregunta text not null,
  creado timestamptz not null default clock_timestamp(),
  primary key (usuario, periodo, pregunta)
);

comment on table public.concurso_servidas is
  'Preguntas ya entregadas a esa cuenta en ese mes. No se repiten. Se borran cuando el premio de ese mes está pagado.';

create table if not exists public.concurso_respuestas (
  id bigint generated always as identity primary key,
  usuario uuid not null references public.perfiles (id) on delete cascade,
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  partida uuid not null,
  pregunta text not null,
  ms int not null check (ms >= 0),
  ip text not null default '',
  opcion int not null check (opcion between -1 and 3),
  orig int check (orig is null or orig between 0 and 3),
  contada boolean not null default false,
  creado timestamptz not null default clock_timestamp()
);

comment on table public.concurso_respuestas is
  'Milisegundos, opción e IP de cada intento. Sirve para revisar el cierre. Se borra cuando el premio de ese mes está pagado. Durante el mes el navegador no recibe la opción correcta.';

alter table public.concurso_respuestas add column if not exists contada boolean not null default false;
alter table public.concurso_respuestas add column if not exists orig int;

create index if not exists concurso_respuestas_usuario_periodo
  on public.concurso_respuestas (usuario, periodo);

create index if not exists concurso_sesiones_usuario_creado
  on public.concurso_sesiones (usuario, creado desc);
create index if not exists concurso_sesiones_ip_creado
  on public.concurso_sesiones (ip, creado desc);
drop index if exists concurso_marcas_mes;
create index concurso_marcas_mes
  on public.concurso_marcas (periodo, puntos desc);

create index if not exists concurso_servidas_usuario_periodo
  on public.concurso_servidas (usuario, periodo);

alter table public.concurso_preguntas enable row level security;
alter table public.concurso_sesiones enable row level security;
alter table public.concurso_marcas enable row level security;
alter table public.concurso_sorteos enable row level security;
alter table public.concurso_exclusiones enable row level security;
alter table public.concurso_servidas enable row level security;
alter table public.concurso_respuestas enable row level security;

revoke all on table public.concurso_preguntas from public, anon, authenticated;
revoke all on table public.concurso_sesiones from public, anon, authenticated;
revoke all on table public.concurso_marcas from public, anon, authenticated;
revoke all on table public.concurso_sorteos from public, anon, authenticated;
revoke all on table public.concurso_exclusiones from public, anon, authenticated;
revoke all on table public.concurso_servidas from public, anon, authenticated;
revoke all on table public.concurso_respuestas from public, anon, authenticated;

alter table public.quiz_premios add column if not exists apodo text;
alter table public.quiz_premios add column if not exists reclamable_hasta timestamptz;
alter table public.quiz_premios alter column ganador drop not null;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.quiz_premios'::regclass
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%ganador%'
  loop
    execute format('alter table public.quiz_premios drop constraint %I', r.conname);
  end loop;
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.quiz_premios'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%estado%'
      and pg_get_constraintdef(con.oid) not ilike '%euros%'
  loop
    execute format('alter table public.quiz_premios drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.quiz_premios
  add constraint quiz_premios_ganador_fkey
  foreign key (ganador) references public.perfiles (id) on delete set null;

alter table public.quiz_premios
  add constraint quiz_premios_estado_check
  check (estado in (
    'pendiente_verificar', 'pendiente', 'reclamado', 'aprobado', 'pagado', 'anulado'
  ));

comment on column public.quiz_premios.apodo is
  'Apodo publicado. Se queda si se borra la cuenta.';
comment on column public.quiz_premios.reclamable_hasta is
  'A los 14 días de pasar a pendiente, si nadie cobra, el premio se anula y pasa al siguiente.';

create or replace function public.apodo_clave(p text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select lower(
    regexp_replace(
      normalize(normalize(coalesce(p, ''), NFKC), NFD),
      U&'[\0300-\036F\1AB0-\1AFF\1DC0-\1DFF\20D0-\20FF\FE20-\FE2F]',
      '',
      'g'
    )
  );
$$;

revoke all on function public.apodo_clave(text) from public;
grant execute on function public.apodo_clave(text) to anon, authenticated;

with duplicados as (
  select id,
         row_number() over (
           partition by public.apodo_clave(nombre)
           order by creado, id
         ) as n
  from public.perfiles
)
update public.perfiles p
set nombre = left(left(p.nombre, 28) || ' ' || left(replace(p.id::text, '-', ''), 4), 40)
from duplicados d
where p.id = d.id
  and d.n > 1
  and public.apodo_ok(left(left(p.nombre, 28) || ' ' || left(replace(p.id::text, '-', ''), 4), 40));

create unique index if not exists perfiles_nombre_unico
  on public.perfiles (public.apodo_clave(nombre));

create or replace function public.perfiles_apodo_unico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.apodo_ok(new.nombre) then
    raise exception 'Ese apodo no se puede usar. Cámbialo, sin insultos.';
  end if;
  if exists (
    select 1
    from public.perfiles p
    where p.id is distinct from new.id
      and public.apodo_clave(p.nombre) = public.apodo_clave(new.nombre)
  ) then
    raise exception 'Ese apodo ya está en uso. Elige otro.';
  end if;
  if tg_op = 'UPDATE' and new.nombre is distinct from old.nombre then
    update public.concurso_marcas
    set apodo = new.nombre
    where usuario = new.id;
    update public.quiz_premios
    set apodo = new.nombre,
        origen = 'concurso'
    where ganador = new.id
      and origen = 'concurso'
      and estado is distinct from 'pagado';
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_apodo_unico on public.perfiles;
create trigger perfiles_apodo_unico
  before insert or update of nombre on public.perfiles
  for each row execute function public.perfiles_apodo_unico();

create or replace function public.alta_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidato text;
begin
  candidato := nullif(btrim(regexp_replace(normalize(coalesce(new.raw_user_meta_data->>'nombre', ''), NFKC), '[[:space:]]+', ' ', 'g')), '');
  if candidato is null
     or not public.apodo_ok(candidato)
     or exists (
       select 1 from public.perfiles p
       where public.apodo_clave(p.nombre) = public.apodo_clave(candidato)
     )
  then
    candidato := 'Vecino ' || right(replace(new.id::text, '-', ''), 4);
  end if;
  if exists (
    select 1 from public.perfiles p
    where public.apodo_clave(p.nombre) = public.apodo_clave(candidato)
  ) then
    candidato := 'Vecino ' || right(replace(new.id::text, '-', ''), 8);
  end if;
  insert into public.perfiles (id, nombre)
  values (new.id, left(candidato, 40))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.quiz_premios_plazo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.estado is distinct from 'pendiente'
     and new.estado = 'pendiente' then
    new.reclamable_hasta := clock_timestamp() + interval '14 days';
  end if;
  if new.estado = 'pendiente_verificar' then
    new.reclamable_hasta := null;
  end if;
  if new.ganador is not null and nullif(btrim(coalesce(new.apodo, '')), '') is null then
    select p.nombre into new.apodo
    from public.perfiles p
    where p.id = new.ganador;
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_premios_plazo on public.quiz_premios;
create trigger quiz_premios_plazo
  before insert or update on public.quiz_premios
  for each row execute function public.quiz_premios_plazo();

create or replace function public.concurso_turnstile_ok(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  secreto text := nullif(btrim(coalesce(current_setting('app.turnstile_secret', true), '')), '');
  cuerpo text;
  ok boolean;
  proc text;
begin
  if secreto is null then
    return true;
  end if;
  if nullif(btrim(coalesce(p_token, '')), '') is null then
    return false;
  end if;
  if to_regprocedure('public.http_post(text,text,text)') is not null
     or to_regprocedure('public.http_post(character varying,character varying,character varying)') is not null then
    proc := 'public.http_post';
  elsif to_regprocedure('extensions.http_post(text,text,text)') is not null
     or to_regprocedure('extensions.http_post(character varying,character varying,character varying)') is not null then
    proc := 'extensions.http_post';
  else
    return false;
  end if;
  cuerpo := json_build_object('secret', secreto, 'response', btrim(p_token))::text;
  begin
    execute
      'select (content::json->>''success'')::boolean from '
      || proc
      || '($1, $2, $3)'
      into ok
      using
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        cuerpo,
        'application/json';
  exception
    when others then
      return false;
  end;
  return coalesce(ok, false);
end;
$$;

comment on function public.concurso_turnstile_ok(text) is
  'Si app.turnstile_secret está vacío, no comprueba nada. Si tiene valor, exige un token válido de Cloudflare. El secreto no va en git.';

create or replace function public.concurso_texto(p_preguntas jsonb, p_indice int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  elem jsonb;
  fila public.concurso_preguntas%rowtype;
  k int;
  orig int;
  ops jsonb := '[]'::jsonb;
begin
  elem := p_preguntas -> (p_indice - 1);
  if elem is null then
    return null;
  end if;
  select * into fila from public.concurso_preguntas where id = elem->>'id';
  if not found then
    return null;
  end if;
  for k in 0..3 loop
    orig := (elem->'orden'->>k)::int;
    ops := ops || jsonb_build_array(fila.opciones -> orig);
  end loop;
  return jsonb_build_object(
    'tema', fila.tema,
    'pregunta', fila.pregunta,
    'opciones', ops
  );
end;
$$;

create or replace function public.concurso_cerrar_meses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mes text := public.periodo_madrid(now());
  r record;
  siguiente uuid;
  nom text;
begin
  insert into public.concurso_sorteos (periodo, usuario, llave)
  select m.periodo, m.usuario, random()
  from public.concurso_marcas m
  where m.periodo < mes
  on conflict (periodo, usuario) do nothing;

  insert into public.concurso_exclusiones (periodo, usuario)
  select q.periodo, q.ganador
  from public.quiz_premios q
  where q.periodo < mes
    and q.ganador is not null
    and q.origen = 'concurso'
    and (
      q.estado = 'anulado'
      or exists (
        select 1
        from public.concurso_marcas m
        where m.periodo = q.periodo
          and m.usuario = q.ganador
          and m.oculto
      )
    )
  on conflict (periodo, usuario) do nothing;

  for r in
    select distinct m.periodo
    from public.concurso_marcas m
    where m.periodo < mes
  loop
    siguiente := null;
    nom := null;
    select m.usuario, p.nombre
      into siguiente, nom
    from public.concurso_marcas m
    join public.perfiles p on p.id = m.usuario
    join public.concurso_sorteos s
      on s.periodo = m.periodo and s.usuario = m.usuario
    where m.periodo = r.periodo
      and not m.oculto
      and m.puntos > 0
      and public.apodo_ok(p.nombre)
      and not exists (
        select 1
        from public.concurso_exclusiones e
        where e.periodo = m.periodo and e.usuario = m.usuario
      )
    order by m.puntos desc, s.llave asc
    limit 1;

    if siguiente is not null then
      insert into public.quiz_premios (periodo, ganador, apodo, euros, estado, origen)
      values (r.periodo, siguiente, nom, public.premio_euros(), 'pendiente_verificar', 'concurso')
      on conflict (periodo) do nothing;
    end if;

    if siguiente is null then
      update public.quiz_premios q
      set estado = 'anulado',
          origen = 'concurso',
          ganador = null,
          metodo = null,
          paypal = null,
          reclamo_nombre = null,
          reclamo_pais = null,
          reclamable_hasta = null,
          motivo = 'sin marca válida'
      where q.periodo = r.periodo
        and q.origen = 'concurso'
        and q.estado in ('anulado', 'pendiente_verificar', 'pendiente')
        and (
          q.estado = 'anulado'
          or q.ganador is null
          or exists (
            select 1 from public.concurso_exclusiones e
            where e.periodo = q.periodo and e.usuario = q.ganador
          )
        );
    else
      update public.quiz_premios q
      set ganador = siguiente,
          apodo = nom,
          origen = 'concurso',
          estado = 'pendiente_verificar',
          metodo = null,
          paypal = null,
          reclamo_nombre = null,
          reclamo_pais = null,
          reclamable_hasta = null,
          motivo = ''
      where q.periodo = r.periodo
        and q.origen = 'concurso'
        and q.estado in ('anulado', 'pendiente_verificar', 'pendiente')
        and q.ganador is distinct from siguiente
        and (
          q.estado = 'anulado'
          or q.ganador is null
          or exists (
            select 1 from public.concurso_exclusiones e
            where e.periodo = q.periodo and e.usuario = q.ganador
          )
        );
    end if;
  end loop;
end;
$$;

create or replace function public.concurso_mantenimiento()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.concurso_sesiones
  where creado < clock_timestamp() - interval '7 days';

  update public.quiz_premios
  set estado = 'anulado',
      origen = 'concurso',
      motivo = 'plazo de 14 días'
  where origen = 'concurso'
    and estado = 'pendiente'
    and reclamable_hasta is not null
    and reclamable_hasta < clock_timestamp();

  perform public.concurso_cerrar_meses();

  delete from public.concurso_sorteos s
  using public.quiz_premios q
  where q.periodo = s.periodo
    and q.origen = 'concurso'
    and q.estado = 'pagado';

  delete from public.concurso_exclusiones e
  using public.quiz_premios q
  where q.periodo = e.periodo
    and q.origen = 'concurso'
    and q.estado = 'pagado';

  delete from public.concurso_marcas m
  using public.quiz_premios q
  where q.periodo = m.periodo
    and q.origen = 'concurso'
    and q.estado = 'pagado';

  delete from public.concurso_servidas sv
  using public.quiz_premios q
  where q.periodo = sv.periodo
    and q.origen = 'concurso'
    and q.estado = 'pagado';

  delete from public.concurso_respuestas r
  using public.quiz_premios q
  where q.periodo = r.periodo
    and q.origen = 'concurso'
    and q.estado = 'pagado';
end;
$$;

create or replace function public.concurso_estado()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mes text := public.periodo_madrid(now());
  reinicio timestamptz;
  abierto boolean;
  ranking jsonb;
  ganadores jsonb;
  mi jsonb;
begin
  perform public.concurso_mantenimiento();
  reinicio := (date_trunc('month', now() at time zone 'Europe/Madrid') + interval '1 month')
    at time zone 'Europe/Madrid';
  select count(*) >= 10 into abierto
  from public.concurso_preguntas
  where dificultad in ('facil', 'media', 'dificil');

  select coalesce(jsonb_agg(jsonb_build_object(
    'puesto', x.puesto,
    'apodo', x.apodo,
    'pais', coalesce(x.pais, ''),
    'aciertos', x.aciertos,
    'puntos', x.puntos
  ) order by x.puesto, x.apodo), '[]'::jsonb)
  into ranking
  from (
    select p.nombre as apodo,
           m.pais,
           m.aciertos,
           m.puntos,
           rank() over (order by m.puntos desc) as puesto
    from public.concurso_marcas m
    join public.perfiles p on p.id = m.usuario
    where m.periodo = mes
      and not m.oculto
      and m.puntos > 0
      and public.apodo_ok(p.nombre)
  ) x
  where x.puesto <= 20;

  select coalesce(jsonb_agg(jsonb_build_object(
    'periodo', h.periodo,
    'apodo', h.apodo
  ) order by h.periodo desc), '[]'::jsonb)
  into ganadores
  from public.concurso_historial() h;

  mi := null;
  if auth.uid() is not null then
    select jsonb_build_object(
      'periodo', q.periodo,
      'estado', q.estado,
      'pais', coalesce(m.pais, ''),
      'reclamable_hasta', q.reclamable_hasta
    )
    into mi
    from public.quiz_premios q
    left join public.concurso_marcas m
      on m.usuario = q.ganador and m.periodo = q.periodo
    where q.ganador = auth.uid()
      and q.origen = 'concurso'
      and q.estado in ('pendiente_verificar', 'pendiente', 'reclamado')
    order by q.periodo desc
    limit 1;
  end if;

  return jsonb_build_object(
    'abierto', abierto,
    'periodo', mes,
    'premio_euros', public.premio_euros(),
    'reinicio', reinicio,
    'ranking', ranking,
    'ganadores', ganadores,
    'mi_premio', mi
  );
end;
$$;

create or replace function public.concurso_ganadores()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'periodo', h.periodo,
    'apodo', h.apodo
  ) order by h.periodo desc), '[]'::jsonb)
  from public.concurso_historial() h;
$$;

drop function if exists public.concurso_premio_pendiente(text, uuid);

create or replace function public.concurso_historial()
returns table (periodo text, apodo text)
language sql
stable
security definer
set search_path = public
as $$
  select q.periodo, coalesce(p.nombre, q.apodo)
  from public.quiz_premios q
  left join public.perfiles p on p.id = q.ganador
  where q.origen = 'concurso'
    and q.estado in ('pendiente', 'reclamado', 'aprobado', 'pagado')
    and q.periodo < public.periodo_madrid(now())
    and nullif(btrim(coalesce(p.nombre, q.apodo, '')), '') is not null
  order by q.periodo desc;
$$;

create or replace function public.concurso_premio_pendiente(p_periodo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quiz_premios q
    where q.periodo = p_periodo
      and q.ganador = auth.uid()
      and q.origen = 'concurso'
      and q.estado = 'pendiente'
      and (q.reclamable_hasta is null or q.reclamable_hasta >= clock_timestamp())
  );
$$;

create or replace function public.concurso_empezar(p_pais text, p_mayor boolean, p_turno text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  nom text;
  pais text;
  dir text;
  pack jsonb;
  pid uuid;
  n int;
  n_facil int;
  n_media int;
  n_dificil int;
  t_facil int;
  t_media int;
  t_dificil int;
  mes_srv text;
  paises text[] := array[
    'MX', 'US', 'CO', 'PE', 'ES', 'AR', 'VE', 'EC', 'DO', 'CL',
    'PY', 'UY', 'BO', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA'
  ];
  dia timestamptz;
begin
  if uid is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if p_mayor is distinct from true then
    raise exception 'Para jugar hay que tener 18 años o más.';
  end if;
  if not public.concurso_turnstile_ok(p_turno) then
    raise exception 'Confirma que no eres un programa e inténtalo otra vez.';
  end if;
  perform public.concurso_mantenimiento();

  select nombre into nom from public.perfiles where id = uid;
  if nom is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if nom ~* '^Vecino [0-9a-f]{4}$' then
    raise exception 'Elige un apodo en Mi cuenta antes de jugar.';
  end if;
  if not public.apodo_ok(nom) then
    raise exception 'Ese apodo no se puede usar. Cámbialo en Mi cuenta, sin insultos.';
  end if;

  pais := nullif(upper(btrim(coalesce(p_pais, ''))), '');
  if pais is not null and not (pais = any (paises)) then
    raise exception 'Ese país no está en la lista.';
  end if;

  dir := coalesce(public.ip_peticion(), '');
  if (
    select count(*) from public.concurso_sesiones s
    where s.usuario = uid and s.creado > clock_timestamp() - interval '1 minute'
  ) >= 30
  or (
    dir <> '' and (
      select count(*) from public.concurso_sesiones s
      where s.ip = dir and s.creado > clock_timestamp() - interval '1 minute'
    ) >= 30
  ) then
    raise exception 'Has abierto demasiadas partidas en un minuto. Espera y vuelve a intentarlo.';
  end if;

  dia := (date_trunc('day', clock_timestamp() at time zone 'Europe/Madrid')) at time zone 'Europe/Madrid';
  if (
    select count(*) from public.concurso_sesiones
    where usuario = uid and creado >= dia
  ) >= 8 then
    raise exception 'Hoy ya empezaste 8 partidas. Mañana puedes volver a jugar.';
  end if;

  mes_srv := public.periodo_madrid(now());
  select
    count(*) filter (where dificultad = 'facil'),
    count(*) filter (where dificultad = 'media'),
    count(*) filter (where dificultad = 'dificil')
  into t_facil, t_media, t_dificil
  from public.concurso_preguntas
  where dificultad in ('facil', 'media', 'dificil');
  n := t_facil + t_media + t_dificil;
  if n < 10 or t_facil < 4 or t_media < 3 or t_dificil < 3 then
    raise exception 'El concurso no está disponible. Falta publicar el banco de preguntas.';
  end if;

  select
    count(*) filter (where p.dificultad = 'facil'),
    count(*) filter (where p.dificultad = 'media'),
    count(*) filter (where p.dificultad = 'dificil')
  into n_facil, n_media, n_dificil
  from public.concurso_preguntas p
  where p.dificultad in ('facil', 'media', 'dificil')
    and not exists (
      select 1
      from public.concurso_servidas sv
      where sv.usuario = uid
        and sv.periodo = mes_srv
        and sv.pregunta = p.id
    );
  if n_facil < 4 or n_media < 3 or n_dificil < 3 then
    raise exception 'Este mes ya no quedan preguntas nuevas para ti. No se repiten.';
  end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'orden', to_jsonb(public.concurso_barajar())) order by s.n)
  into pack
  from (
    select id, row_number() over (order by random()) as n
    from (
      (
        select p.id
        from public.concurso_preguntas p
        where p.dificultad = 'facil'
          and not exists (
            select 1 from public.concurso_servidas sv
            where sv.usuario = uid and sv.periodo = mes_srv and sv.pregunta = p.id
          )
        order by random()
        limit 4
      )
      union all
      (
        select p.id
        from public.concurso_preguntas p
        where p.dificultad = 'media'
          and not exists (
            select 1 from public.concurso_servidas sv
            where sv.usuario = uid and sv.periodo = mes_srv and sv.pregunta = p.id
          )
        order by random()
        limit 3
      )
      union all
      (
        select p.id
        from public.concurso_preguntas p
        where p.dificultad = 'dificil'
          and not exists (
            select 1 from public.concurso_servidas sv
            where sv.usuario = uid and sv.periodo = mes_srv and sv.pregunta = p.id
          )
        order by random()
        limit 3
      )
    ) z
  ) s;

  if pack is null or jsonb_array_length(pack) <> 10 then
    raise exception 'Este mes ya no quedan preguntas nuevas para ti. No se repiten.';
  end if;

  insert into public.concurso_sesiones (usuario, apodo, pais, mayor, preguntas, indice, marca, ip)
  values (uid, nom, pais, true, pack, 1, clock_timestamp(), dir)
  returning id into pid;

  insert into public.concurso_servidas (usuario, periodo, pregunta)
  select uid, mes_srv, elem->>'id'
  from jsonb_array_elements(pack) elem;

  return jsonb_build_object(
    'partida', pid,
    'indice', 1,
    'total', 10,
    'pregunta', public.concurso_texto(pack, 1),
    'aciertos', 0,
    'puntos', 0,
    'periodo', public.periodo_madrid(now()),
    'premio_euros', public.premio_euros(),
    'reinicio', (date_trunc('month', now() at time zone 'Europe/Madrid') + interval '1 month')
      at time zone 'Europe/Madrid'
  );
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
  if auth.uid() is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  select * into s
  from public.concurso_sesiones
  where id = p_partida and usuario = auth.uid()
  for update;
  if not found or s.cerrada then
    raise exception 'partida cerrada';
  end if;
  if s.marca is null then
    update public.concurso_sesiones
    set marca = clock_timestamp()
    where id = s.id
    returning * into s;
  end if;
  return jsonb_build_object(
    'partida', s.id,
    'indice', s.indice,
    'total', 10,
    'pregunta', public.concurso_texto(s.preguntas, s.indice),
    'aciertos', s.aciertos,
    'puntos', s.puntos
  );
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
  elem jsonb;
  fila public.concurso_preguntas%rowtype;
  ms int;
  orig int;
  timeout boolean;
  pronto boolean;
  es_correcta boolean;
  acierto boolean;
  sumar int;
  peso int;
  nuevo_aciertos int;
  nuevo_puntos int;
  nuevo_segundos numeric(8, 3);
  acabada boolean;
  mes text;
  nom text;
  resp jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if p_opcion is null or p_opcion < -1 or p_opcion > 3 then
    raise exception 'Esa opción no vale.';
  end if;

  select * into s
  from public.concurso_sesiones
  where id = p_partida and usuario = auth.uid()
  for update;
  if not found or s.cerrada or s.marca is null then
    raise exception 'partida cerrada';
  end if;

  elem := s.preguntas -> (s.indice - 1);
  select * into fila from public.concurso_preguntas where id = elem->>'id';
  if not found then
    raise exception 'partida cerrada';
  end if;

  ms := floor(extract(epoch from (clock_timestamp() - s.marca)) * 1000)::int;
  if ms < 0 then
    ms := 0;
  end if;
  -- El -1 solo es tiempo agotado si ya pasaron 28 s. Un -1 temprano no cierra la pregunta.
  timeout := ms > 32000 or (p_opcion = -1 and ms >= 28000);
  pronto := (not timeout) and (ms < 5000 or p_opcion = -1);
  orig := null;
  if p_opcion between 0 and 3 then
    orig := (elem->'orden'->>p_opcion)::int;
  end if;

  insert into public.concurso_respuestas (usuario, periodo, partida, pregunta, ms, ip, opcion, orig, contada)
  values (
    s.usuario,
    public.periodo_madrid(s.creado),
    s.id,
    fila.id,
    ms,
    coalesce(s.ip, ''),
    p_opcion,
    orig,
    not pronto
  );

  if pronto then
    return jsonb_build_object(
      'ok', false,
      'timeout', false,
      'demasiado_pronto', true,
      'aciertos', s.aciertos,
      'puntos', s.puntos,
      'acabada', false,
      'indice', s.indice
    );
  end if;

  es_correcta := false;
  if not timeout and orig is not null then
    es_correcta := orig = fila.correcta;
  end if;
  acierto := es_correcta;

  peso := case fila.dificultad
    when 'facil' then 1
    when 'media' then 2
    when 'dificil' then 3
    else 0
  end;
  sumar := least(ms, 30000);
  nuevo_aciertos := s.aciertos + (case when acierto then 1 else 0 end);
  nuevo_puntos := s.puntos + (case when acierto then peso else 0 end);
  nuevo_segundos := s.segundos + (sumar / 1000.0);
  acabada := s.indice >= 10;

  update public.concurso_sesiones
  set aciertos = nuevo_aciertos,
      puntos = nuevo_puntos,
      segundos = nuevo_segundos,
      marca = null,
      indice = case when acabada then s.indice else s.indice + 1 end,
      cerrada = acabada
  where id = s.id;

  if acabada and nuevo_puntos > 0 then
    mes := public.periodo_madrid(now());
    select nombre into nom from public.perfiles where id = s.usuario;
    if nom is null or not public.apodo_ok(nom) then
      raise exception 'Ese apodo no se puede usar. Cámbialo en Mi cuenta, sin insultos.';
    end if;
    insert into public.concurso_marcas (usuario, periodo, apodo, pais, aciertos, puntos, segundos, partida)
    values (s.usuario, mes, nom, s.pais, nuevo_aciertos, nuevo_puntos, nuevo_segundos, s.id)
    on conflict (usuario, periodo) do update
    set apodo = excluded.apodo,
        pais = excluded.pais,
        aciertos = excluded.aciertos,
        puntos = excluded.puntos,
        segundos = excluded.segundos,
        partida = excluded.partida,
        creado = clock_timestamp()
    where excluded.puntos > public.concurso_marcas.puntos;
  end if;

  resp := jsonb_build_object(
    'ok', acierto,
    'timeout', timeout,
    'demasiado_pronto', false,
    'aciertos', nuevo_aciertos,
    'puntos', nuevo_puntos,
    'acabada', acabada,
    'indice', s.indice,
    'puntos_ganados', case when acierto then peso else 0 end
  );
  return resp;
end;
$$;

create or replace function public.concurso_revisar(p_periodo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mes text := public.periodo_madrid(now());
  filas jsonb;
begin
  if auth.uid() is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Ese mes no vale.';
  end if;
  if p_periodo >= mes then
    raise exception 'Las explicaciones se abren cuando el mes ya cerró.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'tema', p.tema,
    'pregunta', p.pregunta,
    'opciones', p.opciones,
    'elegida', r.orig,
    'elegida_texto', case when r.orig is null then '' else p.opciones ->> r.orig end,
    'correcta', p.correcta,
    'correcta_texto', p.opciones ->> p.correcta,
    'acertada', r.orig is not null and r.orig = p.correcta,
    'explicacion', p.explicacion,
    'fuente', p.fuente,
    'ms', r.ms
  ) order by r.creado), '[]'::jsonb)
  into filas
  from public.concurso_respuestas r
  join public.concurso_preguntas p on p.id = r.pregunta
  where r.usuario = auth.uid()
    and r.periodo = p_periodo
    and r.contada;
  return jsonb_build_object('periodo', p_periodo, 'respuestas', filas);
end;
$$;

comment on function public.concurso_revisar(text) is
  'Explicaciones de un mes ya cerrado, solo de la cuenta que pregunta. Durante el mes en curso no devuelve nada.';

create or replace function public.concurso_reclamar(p_periodo text, p_metodo text, p_dato text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m_pago text;
  d_pago text;
  n int;
  pais text;
begin
  if auth.uid() is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Ese mes no vale.';
  end if;
  if not public.concurso_premio_pendiente(p_periodo) then
    raise exception 'No hay un premio pendiente a tu nombre en ese mes.';
  end if;
  m_pago := lower(btrim(coalesce(p_metodo, '')));
  if m_pago not in ('paypal', 'bizum') then
    raise exception 'Elige PayPal o Bizum.';
  end if;
  select m.pais into pais
  from public.concurso_marcas m
  where m.usuario = auth.uid() and m.periodo = p_periodo;
  if m_pago = 'bizum' and coalesce(pais, '') <> 'ES' then
    raise exception 'Bizum solo está disponible si juegas desde España. Usa PayPal.';
  end if;
  d_pago := btrim(coalesce(p_dato, ''));
  if char_length(d_pago) < 4 or char_length(d_pago) > 80 then
    raise exception 'Revisa el dato de pago.';
  end if;
  if m_pago = 'paypal' and position('@' in d_pago) = 0 then
    raise exception 'El PayPal tiene que ser un correo.';
  end if;
  if m_pago = 'bizum' and d_pago !~ '^[0-9 +()-]{4,80}$' then
    raise exception 'El Bizum tiene que ser un teléfono.';
  end if;

  update public.quiz_premios q
  set estado = 'reclamado',
      origen = 'concurso',
      metodo = m_pago,
      paypal = d_pago
  where q.periodo = p_periodo
    and q.ganador = auth.uid()
    and q.origen = 'concurso'
    and q.estado = 'pendiente'
    and (q.reclamable_hasta is null or q.reclamable_hasta >= clock_timestamp());
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'No hay un premio pendiente a tu nombre en ese mes.';
  end if;
  return jsonb_build_object('ok', true, 'periodo', p_periodo, 'estado', 'reclamado');
end;
$$;

comment on function public.premio_euros() is
  'Única cifra del premio. Es del concurso: 10 preguntas, la misma mezcla de dificultades y más puntos (la difícil vale más). Si empatan en puntos, un sorteo en el servidor entre los empatados queda guardado. El mes es Europe/Madrid y el ranking vuelve a cero. El reto no tiene premio.';

revoke all on function public.concurso_barajar() from public, anon, authenticated;
revoke all on function public.concurso_texto(jsonb, int) from public, anon, authenticated;
revoke all on function public.concurso_cerrar_meses() from public, anon, authenticated;
revoke all on function public.concurso_mantenimiento() from public, anon, authenticated;
revoke all on function public.concurso_turnstile_ok(text) from public, anon, authenticated;
revoke all on function public.perfiles_apodo_unico() from public, anon, authenticated;
revoke all on function public.quiz_premios_plazo() from public, anon, authenticated;

revoke all on function public.concurso_estado() from public;
revoke all on function public.concurso_ganadores() from public;
revoke all on function public.concurso_historial() from public;
revoke all on function public.concurso_premio_pendiente(text) from public, anon;
revoke all on function public.concurso_empezar(text, boolean, text) from public;
revoke all on function public.concurso_abrir(uuid) from public;
revoke all on function public.concurso_responder(uuid, int) from public;
revoke all on function public.concurso_revisar(text) from public;
revoke all on function public.concurso_reclamar(text, text, text) from public;

grant execute on function public.concurso_estado() to anon, authenticated;
grant execute on function public.concurso_ganadores() to anon, authenticated;
grant execute on function public.concurso_historial() to anon, authenticated;
grant execute on function public.concurso_premio_pendiente(text) to authenticated;
grant execute on function public.concurso_empezar(text, boolean, text) to authenticated;
grant execute on function public.concurso_abrir(uuid) to authenticated;
grant execute on function public.concurso_responder(uuid, int) to authenticated;
grant execute on function public.concurso_revisar(text) to authenticated;
grant execute on function public.concurso_reclamar(text, text, text) to authenticated;
