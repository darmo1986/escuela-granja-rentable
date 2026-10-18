-- Reto del mes de Granja Rentable.
-- Para ejecutarlo, usa en orden los archivos de supabase/migrations/.
-- Este archivo es la misma copia junta, por si se pega de una vez.
-- Sustituye el borrador de respuestas abiertas. En un proyecto nuevo, pégalo entero.
-- No crea usuarios ni pone claves. El admin se marca a mano, al final.
-- La demo del sitio no usa este archivo: vive en el navegador.
-- La opción correcta y la explicación no se pueden leer desde el navegador.
-- Las dice la función responder, y solo después del intento.

create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 40 and position('@' in nombre) = 0),
  es_admin boolean not null default false,
  dispositivo text not null default '',
  creado timestamptz not null default now()
);

alter table public.perfiles add column if not exists dispositivo text not null default '';

-- NOT VALID y solo si aún no existe: volver a pegar este archivo no debe fallar
-- cuando ya hay un nombre con @. El final del archivo lo sustituye por apodo_ok.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'perfiles_nombre_sin_arroba'
      and conrelid = 'public.perfiles'::regclass
  ) then
    alter table public.perfiles
      add constraint perfiles_nombre_sin_arroba
      check (position('@' in nombre) = 0) not valid;
  end if;
end $$;

create table if not exists public.quiz_preguntas (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.perfiles (id),
  origen uuid references public.perfiles (id),
  texto text not null check (char_length(texto) between 8 and 280),
  explica text not null check (char_length(explica) between 8 and 600),
  correcta uuid,
  segundos int not null default 30 check (segundos between 15 and 120),
  periodo text not null check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  creado timestamptz not null default now()
);

create table if not exists public.quiz_opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta uuid not null references public.quiz_preguntas (id) on delete cascade,
  texto text not null check (char_length(texto) between 2 and 140)
);

alter table public.quiz_preguntas
  drop constraint if exists quiz_preguntas_correcta_fkey;
alter table public.quiz_preguntas
  add constraint quiz_preguntas_correcta_fkey
  foreign key (correcta) references public.quiz_opciones (id);

create table if not exists public.quiz_abiertas (
  usuario uuid not null references public.perfiles (id) on delete cascade,
  pregunta uuid not null references public.quiz_preguntas (id) on delete cascade,
  servida_en timestamptz not null default now(),
  primary key (usuario, pregunta)
);

create table if not exists public.quiz_intentos (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  pregunta uuid not null references public.quiz_preguntas (id) on delete cascade,
  opcion uuid references public.quiz_opciones (id),
  acierto boolean not null,
  puntos int not null check (puntos between 0 and 20),
  ms int not null default 0,
  servida_en timestamptz,
  recibida_en timestamptz,
  anulado boolean not null default false,
  motivo text not null default '',
  dispositivo text not null default '',
  ip text not null default '',
  creado timestamptz not null default now(),
  unique (usuario, pregunta)
);

create table if not exists public.quiz_sugerencias (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.perfiles (id) on delete cascade,
  texto text not null check (char_length(texto) between 8 and 280),
  explica text not null check (char_length(explica) between 8 and 600),
  opciones jsonb not null,
  correcta int not null check (correcta between 0 and 3),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  creado timestamptz not null default now()
);

create table if not exists public.quiz_premios (
  periodo text primary key check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  ganador uuid not null references public.perfiles (id),
  euros int not null default 20 check (euros = 20),
  estado text not null check (estado in ('pendiente', 'reclamado', 'aprobado', 'pagado', 'anulado')),
  reclamo_nombre text,
  reclamo_pais text,
  metodo text,
  paypal text,
  dispositivo text not null default '',
  ip text not null default '',
  motivo text not null default '',
  creado timestamptz not null default now()
);

revoke all on public.perfiles from anon, authenticated;
grant select (id, nombre) on public.perfiles to anon, authenticated;
grant select (es_admin) on public.perfiles to authenticated;
grant update (nombre, dispositivo) on public.perfiles to authenticated;

revoke all on public.quiz_preguntas, public.quiz_opciones, public.quiz_abiertas, public.quiz_intentos from anon, authenticated;
grant select, insert on public.quiz_sugerencias to authenticated;
grant select on public.quiz_premios to authenticated;

alter table public.perfiles enable row level security;
alter table public.quiz_preguntas enable row level security;
alter table public.quiz_opciones enable row level security;
alter table public.quiz_abiertas enable row level security;
alter table public.quiz_intentos enable row level security;
alter table public.quiz_sugerencias enable row level security;
alter table public.quiz_premios enable row level security;

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles
  for select to anon, authenticated using (true);

drop policy if exists perfiles_nombre on public.perfiles;
create policy perfiles_nombre on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists quiz_sug_propia on public.quiz_sugerencias;
create policy quiz_sug_propia on public.quiz_sugerencias
  for insert to authenticated
  with check (autor = auth.uid());

drop policy if exists quiz_sug_leer on public.quiz_sugerencias;
create policy quiz_sug_leer on public.quiz_sugerencias
  for select to authenticated
  using (
    autor = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

drop policy if exists quiz_premio_leer on public.quiz_premios;
create policy quiz_premio_leer on public.quiz_premios
  for select to authenticated
  using (
    ganador = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

create or replace function public.alta_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidato text;
begin
  candidato := nullif(btrim(new.raw_user_meta_data->>'nombre'), '');
  if candidato is null or char_length(candidato) < 2 or position('@' in candidato) > 0 then
    candidato := 'Vecino ' || right(replace(new.id::text, '-', ''), 4);
  end if;
  insert into public.perfiles (id, nombre)
  values (new.id, left(candidato, 40))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists alta_perfil on auth.users;
create trigger alta_perfil
  after insert on auth.users
  for each row execute function public.alta_perfil();

create or replace function public.ip_peticion()
returns text
language plpgsql
stable
as $$
declare
  cabeceras json;
  ip text;
begin
  begin
    cabeceras := current_setting('request.headers', true)::json;
  exception when others then
    return '';
  end;
  if cabeceras is null then
    return '';
  end if;
  ip := coalesce(cabeceras->>'cf-connecting-ip', cabeceras->>'x-forwarded-for', '');
  ip := btrim(split_part(ip, ',', 1));
  return left(ip, 64);
end;
$$;

revoke all on function public.ip_peticion() from public;

create or replace function public.periodo_madrid(t timestamptz)
returns text
language sql
stable
as $$
  select to_char(t at time zone 'Europe/Madrid', 'YYYY-MM');
$$;

-- Preguntas del mes, sin la clave y sin la explicación.
create or replace function public.preguntas_publicas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mes text := public.periodo_madrid(now());
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'texto', p.texto,
      'segundos', p.segundos,
      'periodo', p.periodo,
      'origen', p.origen,
      'opciones', (
        select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'texto', o.texto)), '[]'::jsonb)
        from public.quiz_opciones o
        where o.pregunta = p.id
      )
    )), '[]'::jsonb)
    from public.quiz_preguntas p
    where p.periodo = mes and p.correcta is not null
  );
end;
$$;

revoke all on function public.preguntas_publicas() from public;
grant execute on function public.preguntas_publicas() to anon, authenticated;

-- Cierra las preguntas ya servidas. excepto = null las cierra todas.
-- Recargar o volver a entrar convierte la abierta en fallo (0 puntos).
create or replace function public.cerrar_abiertas(excepto uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
  a record;
begin
  if auth.uid() is null then
    return 0;
  end if;
  for a in
    select * from public.quiz_abiertas
    where usuario = auth.uid()
      and (excepto is null or pregunta is distinct from excepto)
  loop
    if not exists (
      select 1 from public.quiz_intentos i
      where i.usuario = a.usuario and i.pregunta = a.pregunta
    ) then
      insert into public.quiz_intentos (
        usuario, pregunta, opcion, acierto, puntos, ms, motivo, servida_en, recibida_en, dispositivo, ip
      ) values (
        a.usuario, a.pregunta, null, false, 0,
        greatest(0, floor(extract(epoch from (now() - a.servida_en)) * 1000))::int,
        'Recarga',
        a.servida_en, now(),
        coalesce((select dispositivo from public.perfiles where id = a.usuario), ''),
        public.ip_peticion()
      );
      n := n + 1;
    end if;
    delete from public.quiz_abiertas where usuario = a.usuario and pregunta = a.pregunta;
  end loop;
  return n;
end;
$$;

revoke all on function public.cerrar_abiertas(uuid) from public;
grant execute on function public.cerrar_abiertas(uuid) to authenticated;

create or replace function public.empezar_pregunta(pregunta_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.quiz_preguntas;
  servida timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Entra con el correo o con Google.';
  end if;
  if exists (select 1 from public.quiz_intentos where usuario = auth.uid() and pregunta = pregunta_id) then
    raise exception 'Ya respondiste esta. Un intento por cuenta.';
  end if;
  select * into p from public.quiz_preguntas where id = pregunta_id;
  if not found or p.periodo is distinct from public.periodo_madrid(now()) or p.correcta is null then
    raise exception 'Esa pregunta no está en el mes.';
  end if;
  if (select count(*) from public.quiz_intentos where usuario = auth.uid() and creado > now() - interval '1 hour') >= 40
     or exists (select 1 from public.quiz_intentos where usuario = auth.uid() and creado > now() - interval '3 seconds') then
    raise exception 'Espera un momento para volver a intentarlo.';
  end if;
  perform public.cerrar_abiertas(pregunta_id);
  select a.servida_en into servida from public.quiz_abiertas a
    where a.usuario = auth.uid() and a.pregunta = pregunta_id;
  if found then
    return servida;
  end if;
  servida := now();
  insert into public.quiz_abiertas (usuario, pregunta, servida_en) values (auth.uid(), pregunta_id, servida);
  return servida;
end;
$$;

revoke all on function public.empezar_pregunta(uuid) from public;
grant execute on function public.empezar_pregunta(uuid) to authenticated;

-- Devuelve acierto, puntos y explicación. Antes de llamar, el cliente no tiene la clave.
create or replace function public.responder(pregunta_id uuid, opcion_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.quiz_preguntas;
  abierta public.quiz_abiertas;
  acierto boolean := false;
  es_primero boolean := false;
  propia boolean := false;
  rapido int := 0;
  extra int := 0;
  total int := 0;
  ms int := 0;
  nuevo uuid;
  recibida timestamptz := now();
  limite_ms int := 30000;
  gracia_ms int := 2000;
begin
  if auth.uid() is null then
    raise exception 'Entra con el correo o con Google.';
  end if;
  if exists (select 1 from public.quiz_intentos where usuario = auth.uid() and pregunta = pregunta_id) then
    raise exception 'Ya respondiste esta. Un intento por cuenta.';
  end if;
  select * into p from public.quiz_preguntas where id = pregunta_id;
  if not found then
    raise exception 'Esa pregunta no está.';
  end if;
  select * into abierta from public.quiz_abiertas
    where usuario = auth.uid() and pregunta = pregunta_id;
  if not found then
    raise exception 'Pulsa Empezar. El tiempo corre desde ahí.';
  end if;
  ms := greatest(0, floor(extract(epoch from (recibida - abierta.servida_en)) * 1000))::int;
  propia := p.origen is not null and p.origen = auth.uid();
  if ms <= limite_ms + gracia_ms and opcion_id is not null and opcion_id = p.correcta then
    acierto := true;
  end if;
  if acierto and not propia and not exists (
    select 1 from public.quiz_intentos i
    where i.pregunta = pregunta_id and i.acierto and not i.anulado and i.puntos > 0
  ) then
    es_primero := true;
    extra := 5;
  end if;
  if acierto and not propia then
    rapido := round(5 * (1 - least(1, least(ms, limite_ms)::numeric / limite_ms)))::int;
    total := 10 + rapido + extra;
  end if;
  insert into public.quiz_intentos (usuario, pregunta, opcion, acierto, puntos, ms, motivo, servida_en, recibida_en, dispositivo, ip)
  values (
    auth.uid(), pregunta_id,
    case when ms <= limite_ms + gracia_ms then opcion_id else null end,
    acierto, total, ms,
    case when ms > limite_ms + gracia_ms or opcion_id is null then 'Tiempo' else '' end,
    abierta.servida_en, recibida,
    coalesce((select dispositivo from public.perfiles where id = auth.uid()), ''),
    public.ip_peticion()
  )
  returning id into nuevo;
  delete from public.quiz_abiertas where usuario = auth.uid() and pregunta = pregunta_id;
  return jsonb_build_object(
    'id', nuevo,
    'acierto', acierto,
    'puntos', total,
    'rapido', rapido,
    'primero', extra,
    'explica', p.explica,
    'correcta', p.correcta
  );
end;
$$;

revoke all on function public.responder(uuid, uuid) from public;
grant execute on function public.responder(uuid, uuid) to authenticated;

create or replace function public.ranking_mes(p_periodo text)
returns table (usuario uuid, nombre text, puntos int, aciertos int, llegado timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select i.usuario, pf.nombre,
    sum(i.puntos)::int as puntos,
    count(*) filter (where i.acierto and i.puntos > 0)::int as aciertos,
    max(i.creado) filter (where i.puntos > 0) as llegado
  from public.quiz_intentos i
  join public.quiz_preguntas q on q.id = i.pregunta
  join public.perfiles pf on pf.id = i.usuario
  where not i.anulado and q.periodo = p_periodo
  group by i.usuario, pf.nombre
  having sum(i.puntos) > 0
  order by sum(i.puntos) desc, max(i.creado) filter (where i.puntos > 0) asc, count(*) filter (where i.acierto and i.puntos > 0) desc, pf.nombre asc;
$$;

revoke all on function public.ranking_mes(text) from public;
grant execute on function public.ranking_mes(text) to anon, authenticated;

create or replace function public.anular_intento(intento_id uuid, motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin) then
    raise exception 'Solo un admin puede anular.';
  end if;
  update public.quiz_intentos
    set anulado = true, motivo = left(coalesce(motivo, 'Anulado por el admin'), 200)
    where id = intento_id;
end;
$$;

revoke all on function public.anular_intento(uuid, text) from public;
grant execute on function public.anular_intento(uuid, text) to authenticated;

create or replace function public.publicar_pregunta(
  p_texto text,
  p_explica text,
  p_opciones text[],
  p_correcta int,
  p_segundos int,
  p_origen uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  oid uuid;
  i int;
  ids uuid[] := array[]::uuid[];
begin
  if not exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin) then
    raise exception 'Solo un admin publica preguntas.';
  end if;
  if p_opciones is null or array_length(p_opciones, 1) <> 4 or p_correcta < 0 or p_correcta > 3 then
    raise exception 'Hacen falta cuatro opciones y una correcta.';
  end if;
  insert into public.quiz_preguntas (autor, origen, texto, explica, segundos, periodo)
  values (auth.uid(), p_origen, p_texto, p_explica, 30, public.periodo_madrid(now()))
  returning id into pid;
  for i in 1..4 loop
    insert into public.quiz_opciones (pregunta, texto) values (pid, p_opciones[i]) returning id into oid;
    ids := ids || oid;
  end loop;
  update public.quiz_preguntas set correcta = ids[p_correcta + 1] where id = pid;
  return pid;
end;
$$;

revoke all on function public.publicar_pregunta(text, text, text[], int, int, uuid) from public;
grant execute on function public.publicar_pregunta(text, text, text[], int, int, uuid) to authenticated;

create or replace function public.aprobar_sugerencia(sugerencia_id uuid, aceptar boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.quiz_sugerencias;
  textos text[];
  nuevo uuid;
begin
  if not exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin) then
    raise exception 'Solo un admin revisa propuestas.';
  end if;
  select * into s from public.quiz_sugerencias where id = sugerencia_id and estado = 'pendiente';
  if not found then
    raise exception 'Esa propuesta no está pendiente.';
  end if;
  if not aceptar then
    update public.quiz_sugerencias set estado = 'rechazada' where id = sugerencia_id;
    return null;
  end if;
  select array_agg(value order by ord) into textos
  from jsonb_array_elements_text(s.opciones) with ordinality as t(value, ord);
  nuevo := public.publicar_pregunta(s.texto, s.explica, textos, s.correcta, 30, s.autor);
  update public.quiz_sugerencias set estado = 'aprobada' where id = sugerencia_id;
  return nuevo;
end;
$$;

revoke all on function public.aprobar_sugerencia(uuid, boolean) from public;
grant execute on function public.aprobar_sugerencia(uuid, boolean) to authenticated;

-- Cuando entres la primera vez, copia tu uuid en Authentication → Users y ejecuta:
-- update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';
-- Un visitante no puede hacerse admin: no tiene permiso para cambiar es_admin.

-- Cuenta del sitio. El curso publicado es gratis: no hay cobro, ni Stripe, ni precio.
-- Cada persona solo lee y escribe sus filas. El navegador no puede leer las de otra.

create table if not exists public.curso_progreso (
  usuario uuid primary key references public.perfiles (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

create table if not exists public.calculos (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  datos jsonb not null,
  creado timestamptz not null default now()
);

create table if not exists public.favoritos (
  usuario uuid not null references public.perfiles (id) on delete cascade,
  ficha text not null check (ficha ~ '^[a-z0-9-]{2,40}$'),
  titulo text not null check (char_length(titulo) between 1 and 140),
  creado timestamptz not null default now(),
  primary key (usuario, ficha)
);

alter table public.curso_progreso enable row level security;
alter table public.calculos enable row level security;
alter table public.favoritos enable row level security;

revoke all on public.curso_progreso, public.calculos, public.favoritos from anon, authenticated;
grant select, insert, update, delete on public.curso_progreso to authenticated;
grant select, insert, update, delete on public.calculos to authenticated;
grant select, insert, update, delete on public.favoritos to authenticated;

drop policy if exists curso_propio on public.curso_progreso;
create policy curso_propio on public.curso_progreso
  for all to authenticated
  using (usuario = auth.uid())
  with check (usuario = auth.uid());

drop policy if exists calculos_propios on public.calculos;
create policy calculos_propios on public.calculos
  for all to authenticated
  using (usuario = auth.uid())
  with check (usuario = auth.uid());

drop policy if exists favoritos_propios on public.favoritos;
create policy favoritos_propios on public.favoritos
  for all to authenticated
  using (usuario = auth.uid())
  with check (usuario = auth.uid());

-- Solo faltantes. El CHECK corre antes del ON CONFLICT: al repetir el archivo
-- no se vuelve a proponer un apodo que la migración posterior ya corrigió.
do $$
declare
  r record;
  candidato text;
  vale boolean;
begin
  for r in
    select u.id, u.raw_user_meta_data
    from auth.users u
    where not exists (select 1 from public.perfiles p where p.id = u.id)
  loop
    candidato := nullif(btrim(coalesce(r.raw_user_meta_data->>'nombre', '')), '');
    if candidato is null or char_length(candidato) < 2 or position('@' in candidato) > 0 then
      candidato := 'Vecino ' || right(replace(r.id::text, '-', ''), 4);
    end if;
    if to_regprocedure('public.apodo_ok(text)') is not null then
      execute 'select public.apodo_ok($1)' into vale using left(candidato, 40);
      if not vale then
        candidato := 'Vecino ' || right(replace(r.id::text, '-', ''), 4);
      end if;
    end if;
    insert into public.perfiles (id, nombre)
    values (r.id, left(candidato, 40))
    on conflict (id) do nothing;
  end loop;
end $$;

-- Limpieza de la migración 20261018130000_apodo.sql, por si se pega este archivo de una vez.
update public.perfiles
set nombre = left('Vecino ' || right(replace(id::text, '-', ''), 4), 40)
where position('@' in nombre) > 0;

update public.perfiles p
set nombre = left('Vecino ' || right(replace(u.id::text, '-', ''), 4), 40)
from auth.users u
where p.id = u.id
  and coalesce(btrim(u.raw_user_meta_data->>'nombre'), '') = ''
  and p.nombre = btrim(coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    ''
  ));

-- Migración 20261018140000_apodo_reglas.sql
-- Reglas del apodo de la cuenta, y premio del reto fijado en 20 €.
-- Se ejecuta después de 20261018130000_apodo.sql.
-- No se ha corrido desde el repositorio: lo pega quien administra el proyecto.
-- El concurso debe usar public.apodo_ok. Su filtro por raíces rechaza nombres válidos.

create or replace function public.apodo_ok(raw text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  s text;
  letras text;
  junto text;
  malas text[] := array[
    'cono', 'conos', 'polla', 'pollas', 'zorra', 'zorras',
    'pinche', 'pinches', 'idiota', 'idiotas',
    'fuck', 'fucking', 'fucker', 'pvta',
    'puta', 'putas', 'puto', 'putos',
    'mierda', 'mierdas', 'pendejo', 'pendeja', 'pendejos', 'pendejas',
    'cabron', 'cabrones', 'cabrona', 'cabronas',
    'marica', 'maricas', 'maricon', 'maricones', 'maricona', 'mariconas',
    'nazi', 'nazis', 'nigger', 'niggers', 'nigga', 'niggas', 'hitler',
    'faggot', 'faggots', 'asshole', 'assholes', 'gilipollas',
    'verga', 'vergas', 'culero', 'culera', 'culeros', 'culeras',
    'chingar', 'chingada', 'chingado', 'chingados', 'chingadas',
    'hdp', 'malparido', 'malparida', 'malparidos', 'malparidas',
    'gonorrea', 'concha', 'conchas',
    'boludo', 'boluda', 'boludos', 'boludas',
    'pelotudo', 'pelotuda', 'pelotudos', 'pelotudas',
    'huevon', 'huevona', 'huevones', 'huevonas',
    'cojudo', 'cojuda', 'cojudos', 'cojudas',
    'viagra', 'casino', 'porno', 'cripto'
  ];
begin
  if raw is null then
    return false;
  end if;
  s := btrim(regexp_replace(normalize(raw, NFKC), '[[:space:]]+', ' ', 'g'));
  if raw is distinct from s then
    return false;
  end if;
  if char_length(s) < 2 or char_length(s) > 40 then
    return false;
  end if;
  if s ~ '[[:cntrl:]]' or s ~ U&'[\00AD\034F\061C\180E\200B-\200F\2028-\202E\2060-\2064\2066-\206F\FEFF\FFF9-\FFFB]' then
    return false;
  end if;
  if s ~ U&'[\0400-\04FF\0500-\052F\1C80-\1C8F\2DE0-\2DFF\A640-\A69F]' then
    return false;
  end if;
  if regexp_replace(
    s,
    U&'[A-Za-z0-9 ''\00C0-\00D6\00D8-\00F6\00F8-\024F\1E00-\1EFF\2C60-\2C7F\A720-\A7FF\AB30-\AB6F-]',
    '',
    'g'
  ) <> '' then
    return false;
  end if;
  if s ~ '[0-9]{8,}' then
    return false;
  end if;
  letras := translate(lower(s),
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc');
  letras := translate(letras, '013457', 'oieast');
  if exists (
    select 1
    from regexp_split_to_table(letras, '[^a-z]+') as w
    where w <> '' and w = any (malas)
  ) then
    return false;
  end if;
  junto := regexp_replace(letras, '[^a-z]+', '', 'g');
  if junto = any (malas) then
    return false;
  end if;
  return true;
end;
$$;

revoke all on function public.apodo_ok(text) from public;
grant execute on function public.apodo_ok(text) to anon, authenticated;

update public.perfiles
set nombre = left(btrim(regexp_replace(normalize(nombre, NFKC), '[[:space:]]+', ' ', 'g')), 40)
where nombre is distinct from left(btrim(regexp_replace(normalize(nombre, NFKC), '[[:space:]]+', ' ', 'g')), 40);

update public.perfiles
set nombre = left('Vecino ' || right(replace(id::text, '-', ''), 4), 40)
where not public.apodo_ok(nombre);

alter table public.perfiles drop constraint if exists perfiles_nombre_check;
alter table public.perfiles drop constraint if exists perfiles_nombre_sin_arroba;
alter table public.perfiles drop constraint if exists perfiles_nombre_ok;
alter table public.perfiles
  add constraint perfiles_nombre_ok
  check (public.apodo_ok(nombre));

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
  if candidato is null or not public.apodo_ok(candidato) then
    candidato := 'Vecino ' || right(replace(new.id::text, '-', ''), 4);
  end if;
  insert into public.perfiles (id, nombre)
  values (new.id, left(candidato, 40))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- El primero de cada mes gana 20 €. El ranking ya se reinicia: periodo es AAAA-MM.
update public.quiz_premios set euros = 20 where euros is distinct from 20;
alter table public.quiz_premios alter column euros set default 20;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.quiz_premios'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%euros%'
  loop
    execute format('alter table public.quiz_premios drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.quiz_premios
  add constraint quiz_premios_euros_check
  check (euros = 20);
