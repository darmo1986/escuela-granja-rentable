-- Concurso mensual. No se ha ejecutado. No incluye el banco de preguntas.
-- Pablo, en el editor SQL de Supabase y en este orden:
--   1) supabase/migrations/20261018120000_reto.sql
--   2) supabase/migrations/20261018120100_cuenta.sql
--   3) este archivo
--   4) el banco privado (no está en git): banco-concurso.sql
-- Después, en js/config.js, pasa comunidad.concursoPublicado a true.
--
-- Si un borrador anterior creó concurso_partidas con permiso de insertar
-- el puntaje, este archivo la borra. El banco, si ya lo cargaste, se conserva.
--
-- Premio único: 20 € en quiz_premios. El ranking del mes se lee por aciertos
-- y, si empatan, por el tiempo que midió el servidor. Al cambiar el mes
-- (Europe/Madrid) la lista pública vuelve a cero; la marca vieja queda para el premio.
-- Para descalificar: oculto = true en concurso_marcas. El premio pasa a la
-- siguiente marca válida. Si el premio ya se pagó, no se mueve solo.
-- anon y authenticated no pueden leer el banco ni ejecutar las funciones internas.

drop table if exists public.concurso_partidas cascade;
drop table if exists public.concurso_sesiones cascade;

drop function if exists public.concurso_empezar(text, text);
drop function if exists public.concurso_empezar(text);
drop function if exists public.concurso_abrir(uuid);
drop function if exists public.concurso_responder(uuid, int);
drop function if exists public.concurso_estado();
drop function if exists public.concurso_ganadores();
drop function if exists public.concurso_reclamar(text, text, text);
drop function if exists public.concurso_mantenimiento();
drop function if exists public.concurso_cerrar_meses();
drop function if exists public.concurso_texto(jsonb, int);
drop function if exists public.concurso_barajar();
drop function if exists public.concurso_norm(text);
drop function if exists public.concurso_apodo_ok(text);

create or replace function public.concurso_apodo_ok(p text)
returns boolean
language plpgsql
immutable
as $$
declare
  t text;
  c text;
  w text;
  sq text;
  vuelta boolean;
  palabras text[];
  vetadas text[] := array[
    'puta', 'puto', 'mierda', 'pendejo', 'pendeja', 'cabron', 'cabrona',
    'maricon', 'marica', 'verga', 'culero', 'culera', 'culo', 'hdp',
    'hijueputa', 'malparido', 'malparida', 'gonorrea',
    'boludo', 'boluda', 'pelotudo', 'pelotuda', 'huevon', 'huevona',
    'cojudo', 'cojuda', 'cono', 'polla', 'zorra', 'pinche', 'idiota',
    'fuck', 'perra', 'joto', 'cerote', 'carajo', 'imbecil', 'subnormal',
    'mamaguevo', 'pija', 'follar', 'joder', 'shit', 'bitch',
    'nazi', 'nigger', 'nigga', 'hitler', 'faggot', 'asshole', 'gilipollas',
    'porno', 'viagra'
  ];
  compuestas text[] := array[
    'hijodeputa', 'hijaputa', 'putamadre', 'hijueputa'
  ];
begin
  if p is null then
    return false;
  end if;
  t := normalize(p, nfkc);
  t := translate(t, U&'\00AD\200B\200C\200D\200E\200F\202A\202B\202C\202D\202E\2060\2061\2062\2063\2064\2066\2067\2068\2069\FEFF', '');
  t := regexp_replace(t, '\s+', ' ', 'g');
  t := btrim(t);
  if char_length(t) < 2 or char_length(t) > 40 then
    return false;
  end if;
  if position('@' in t) > 0 or t ~ '[0-9]{8,}' then
    return false;
  end if;
  if t !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]+$' then
    return false;
  end if;
  foreach vuelta in array array[false, true] loop
    c := lower(translate(t,
      'áàäéèëíìïóòöúùüñÁÀÄÉÈËÍÌÏÓÒÖÚÙÜÑ',
      'aaaeeeiiiooouuunaaaeeeiiiooouuun'
    ));
    c := translate(c, '013457', 'oieast');
    if vuelta then
      c := translate(c, 'v', 'u');
    end if;
    palabras := regexp_split_to_array(c, '\s+');
    foreach w in array palabras loop
      w := regexp_replace(w, '[._-]', '', 'g');
      if w = any (vetadas) then
        return false;
      end if;
    end loop;
    sq := regexp_replace(c, '[^a-z0-9]', '', 'g');
    if sq = any (vetadas) or sq = any (compuestas) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

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

create table public.concurso_sesiones (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  apodo text not null,
  pais text,
  preguntas jsonb not null,
  indice int not null default 1 check (indice between 1 and 10),
  marca timestamptz,
  aciertos int not null default 0 check (aciertos between 0 and 10),
  segundos numeric(8, 3) not null default 0 check (segundos >= 0 and segundos <= 400),
  cerrada boolean not null default false,
  ip text not null default '',
  creado timestamptz not null default clock_timestamp()
);

comment on table public.concurso_sesiones is
  'Partida en curso. Se borra a los 7 días. El reloj es marca, en el servidor.';

create table if not exists public.concurso_marcas (
  usuario uuid not null references public.perfiles (id) on delete cascade,
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  apodo text not null,
  pais text,
  aciertos int not null check (aciertos between 0 and 10),
  segundos numeric(8, 3) not null check (segundos >= 0 and segundos <= 400),
  oculto boolean not null default false,
  partida uuid,
  creado timestamptz not null default clock_timestamp(),
  primary key (usuario, periodo)
);

comment on column public.concurso_marcas.oculto is
  'El administrador lo pone en true para descalificar. El premio pasa a la siguiente marca.';

create index if not exists concurso_sesiones_usuario_creado
  on public.concurso_sesiones (usuario, creado desc);
create index if not exists concurso_sesiones_ip_creado
  on public.concurso_sesiones (ip, creado desc);
create index if not exists concurso_marcas_mes
  on public.concurso_marcas (periodo, aciertos desc, segundos asc);

alter table public.concurso_preguntas enable row level security;
alter table public.concurso_sesiones enable row level security;
alter table public.concurso_marcas enable row level security;

revoke all on table public.concurso_preguntas from public, anon, authenticated;
revoke all on table public.concurso_sesiones from public, anon, authenticated;
revoke all on table public.concurso_marcas from public, anon, authenticated;

update public.quiz_premios set euros = 20 where euros is distinct from 20;
alter table public.quiz_premios drop constraint if exists quiz_premios_euros_check;
alter table public.quiz_premios add constraint quiz_premios_euros_check check (euros = 20);

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
begin
  insert into public.quiz_premios (periodo, ganador, euros, estado)
  select g.periodo, g.usuario, 20, 'pendiente'
  from (
    select distinct on (m.periodo) m.periodo, m.usuario
    from public.concurso_marcas m
    where m.periodo < mes
      and not m.oculto
      and m.aciertos > 0
    order by m.periodo, m.aciertos desc, m.segundos asc, m.creado asc
  ) g
  on conflict (periodo) do nothing;

  update public.quiz_premios q
  set ganador = g.usuario,
      euros = 20,
      estado = 'pendiente',
      metodo = null,
      paypal = null,
      reclamo_nombre = null,
      reclamo_pais = null,
      motivo = ''
  from (
    select distinct on (m.periodo) m.periodo, m.usuario
    from public.concurso_marcas m
    where m.periodo < mes
      and not m.oculto
      and m.aciertos > 0
    order by m.periodo, m.aciertos desc, m.segundos asc, m.creado asc
  ) g
  where q.periodo = g.periodo
    and q.estado in ('pendiente', 'reclamado', 'anulado')
    and q.ganador is distinct from g.usuario
    and (
      q.estado = 'anulado'
      or exists (
        select 1
        from public.concurso_marcas m
        where m.usuario = q.ganador
          and m.periodo = q.periodo
          and m.oculto
      )
    );
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
  perform public.concurso_cerrar_meses();
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
  select count(*) >= 10 into abierto from public.concurso_preguntas;

  select coalesce(jsonb_agg(jsonb_build_object(
    'apodo', x.apodo,
    'pais', coalesce(x.pais, ''),
    'aciertos', x.aciertos,
    'segundos', x.segundos
  ) order by x.n), '[]'::jsonb)
  into ranking
  from (
    select p.nombre as apodo, m.pais, m.aciertos, m.segundos,
           row_number() over (order by m.aciertos desc, m.segundos asc, m.creado asc) as n
    from public.concurso_marcas m
    join public.perfiles p on p.id = m.usuario
    where m.periodo = mes and not m.oculto and m.aciertos > 0
  ) x
  where x.n <= 20;

  select coalesce(jsonb_agg(jsonb_build_object(
    'periodo', g.periodo,
    'apodo', g.apodo
  ) order by g.periodo desc), '[]'::jsonb)
  into ganadores
  from (
    select q.periodo, p.nombre as apodo
    from public.quiz_premios q
    join public.perfiles p on p.id = q.ganador
    where q.estado <> 'anulado'
      and q.periodo < mes
  ) g;

  mi := null;
  if auth.uid() is not null then
    select jsonb_build_object('periodo', q.periodo, 'estado', q.estado)
    into mi
    from public.quiz_premios q
    where q.ganador = auth.uid()
      and q.estado in ('pendiente', 'reclamado')
    order by q.periodo desc
    limit 1;
  end if;

  return jsonb_build_object(
    'abierto', abierto,
    'periodo', mes,
    'premio_euros', 20,
    'reinicio', reinicio,
    'ranking', ranking,
    'ganadores', ganadores,
    'mi_premio', mi
  );
end;
$$;

create or replace function public.concurso_ganadores()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mes text := public.periodo_madrid(now());
  ganadores jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'periodo', g.periodo,
    'apodo', g.apodo
  ) order by g.periodo desc), '[]'::jsonb)
  into ganadores
  from (
    select q.periodo, p.nombre as apodo
    from public.quiz_premios q
    join public.perfiles p on p.id = q.ganador
    where q.estado <> 'anulado'
      and q.periodo < mes
  ) g;
  return ganadores;
end;
$$;

create or replace function public.concurso_empezar(p_pais text)
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
  paises text[] := array[
    'MX', 'US', 'CO', 'PE', 'ES', 'AR', 'VE', 'EC', 'DO', 'CL',
    'PY', 'UY', 'BO', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA'
  ];
  dia timestamptz;
begin
  if uid is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  perform public.concurso_mantenimiento();

  select nombre into nom from public.perfiles where id = uid;
  if nom is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if nom ~* '^Vecino [0-9a-f]{4}$' then
    raise exception 'Elige un apodo en Mi cuenta antes de jugar.';
  end if;
  if not public.concurso_apodo_ok(nom) then
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
    where usuario = uid and cerrada and creado >= dia
  ) >= 8 then
    raise exception 'Hoy ya cerraste 8 partidas. Mañana puedes volver a jugar.';
  end if;

  select count(*) into n from public.concurso_preguntas;
  if n < 10 then
    raise exception 'El concurso no está disponible. Falta publicar el banco de preguntas.';
  end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'orden', to_jsonb(public.concurso_barajar())) order by s.n)
  into pack
  from (
    select id, row_number() over () as n
    from (
      select id from public.concurso_preguntas order by random() limit 10
    ) z
  ) s;

  insert into public.concurso_sesiones (usuario, apodo, pais, preguntas, indice, marca, ip)
  values (uid, nom, pais, pack, 1, clock_timestamp(), dir)
  returning id into pid;

  return jsonb_build_object(
    'partida', pid,
    'indice', 1,
    'total', 10,
    'pregunta', public.concurso_texto(pack, 1),
    'aciertos', 0,
    'segundos', 0,
    'periodo', public.periodo_madrid(now()),
    'premio_euros', 20,
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
    'segundos', s.segundos
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
  k int;
  orig int;
  bueno int;
  timeout boolean;
  muy_rapido boolean;
  es_correcta boolean;
  acierto boolean;
  sumar int;
  nuevo_aciertos int;
  nuevo_segundos numeric(8, 3);
  acabada boolean;
  mes text;
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
  timeout := p_opcion = -1 or ms > 32000;
  es_correcta := false;
  if not timeout and p_opcion between 0 and 3 then
    orig := (elem->'orden'->>p_opcion)::int;
    es_correcta := orig = fila.correcta;
  end if;
  muy_rapido := es_correcta and not timeout and ms < 1000;
  acierto := es_correcta and not muy_rapido;
  bueno := 0;
  for k in 0..3 loop
    if (elem->'orden'->>k)::int = fila.correcta then
      bueno := k;
    end if;
  end loop;

  sumar := least(ms, 30000);
  nuevo_aciertos := s.aciertos + (case when acierto then 1 else 0 end);
  nuevo_segundos := s.segundos + (sumar / 1000.0);
  acabada := s.indice >= 10;

  update public.concurso_sesiones
  set aciertos = nuevo_aciertos,
      segundos = nuevo_segundos,
      marca = null,
      indice = case when acabada then s.indice else s.indice + 1 end,
      cerrada = acabada
  where id = s.id;

  if acabada and nuevo_aciertos > 0 then
    mes := public.periodo_madrid(now());
    insert into public.concurso_marcas (usuario, periodo, apodo, pais, aciertos, segundos, partida)
    values (s.usuario, mes, s.apodo, s.pais, nuevo_aciertos, nuevo_segundos, s.id)
    on conflict (usuario, periodo) do update
    set apodo = excluded.apodo,
        pais = excluded.pais,
        aciertos = excluded.aciertos,
        segundos = excluded.segundos,
        partida = excluded.partida,
        creado = clock_timestamp()
    where excluded.aciertos > public.concurso_marcas.aciertos
      or (
        excluded.aciertos = public.concurso_marcas.aciertos
        and excluded.segundos < public.concurso_marcas.segundos
      );
  end if;

  return jsonb_build_object(
    'ok', acierto,
    'acertada', es_correcta,
    'timeout', timeout,
    'muy_rapido', muy_rapido,
    'indice_correcto', bueno,
    'explicacion', fila.explicacion,
    'fuente', fila.fuente,
    'aciertos', nuevo_aciertos,
    'segundos', nuevo_segundos,
    'acabada', acabada,
    'indice', s.indice
  );
end;
$$;

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
begin
  if auth.uid() is null then
    raise exception 'Entra con tu cuenta para jugar.';
  end if;
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Ese mes no vale.';
  end if;
  m_pago := lower(btrim(coalesce(p_metodo, '')));
  if m_pago not in ('paypal', 'bizum') then
    raise exception 'Elige PayPal o Bizum.';
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
      metodo = m_pago,
      paypal = d_pago,
      ip = coalesce(public.ip_peticion(), '')
  where q.periodo = p_periodo
    and q.ganador = auth.uid()
    and q.estado = 'pendiente';
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'No hay un premio pendiente a tu nombre en ese mes.';
  end if;
  return jsonb_build_object('ok', true, 'periodo', p_periodo, 'estado', 'reclamado');
end;
$$;

revoke all on function public.concurso_apodo_ok(text) from public, anon, authenticated;
revoke all on function public.concurso_barajar() from public, anon, authenticated;
revoke all on function public.concurso_texto(jsonb, int) from public, anon, authenticated;
revoke all on function public.concurso_cerrar_meses() from public, anon, authenticated;
revoke all on function public.concurso_mantenimiento() from public, anon, authenticated;

revoke all on function public.concurso_estado() from public;
revoke all on function public.concurso_ganadores() from public;
revoke all on function public.concurso_empezar(text) from public;
revoke all on function public.concurso_abrir(uuid) from public;
revoke all on function public.concurso_responder(uuid, int) from public;
revoke all on function public.concurso_reclamar(text, text, text) from public;

grant execute on function public.concurso_estado() to anon, authenticated;
grant execute on function public.concurso_ganadores() to anon, authenticated;
grant execute on function public.concurso_empezar(text) to authenticated;
grant execute on function public.concurso_abrir(uuid) to authenticated;
grant execute on function public.concurso_responder(uuid, int) to authenticated;
grant execute on function public.concurso_reclamar(text, text, text) to authenticated;
