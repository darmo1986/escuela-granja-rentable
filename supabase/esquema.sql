-- Reto del mes de Granja Rentable.
-- Sustituye el borrador de respuestas abiertas. En un proyecto nuevo, pégalo entero.
-- No crea usuarios ni pone claves. El admin se marca a mano, al final.
-- La demo del sitio no usa este archivo: vive en el navegador.
-- La opción correcta y la explicación no se pueden leer desde el navegador.
-- Las dice la función responder, y solo después del intento.

create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 40),
  es_admin boolean not null default false,
  dispositivo text not null default '',
  creado timestamptz not null default now()
);

alter table public.perfiles add column if not exists dispositivo text not null default '';

create table if not exists public.quiz_preguntas (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.perfiles (id),
  origen uuid references public.perfiles (id),
  texto text not null check (char_length(texto) between 8 and 280),
  explica text not null check (char_length(explica) between 8 and 600),
  correcta uuid,
  segundos int not null default 45 check (segundos between 15 and 120),
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
  expira timestamptz not null,
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
  euros int not null check (euros between 20 and 30),
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
  candidato := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );
  if candidato is null or char_length(candidato) < 2 then
    candidato := 'Vecino';
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

create or replace function public.empezar_pregunta(pregunta_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.quiz_preguntas;
  expira timestamptz;
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
  select a.expira into expira from public.quiz_abiertas a
    where a.usuario = auth.uid() and a.pregunta = pregunta_id;
  if found then
    return expira;
  end if;
  expira := now() + make_interval(secs => p.segundos);
  insert into public.quiz_abiertas (usuario, pregunta, expira) values (auth.uid(), pregunta_id, expira);
  return expira;
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
  ms := greatest(0, floor(extract(epoch from (now() - (abierta.expira - make_interval(secs => p.segundos)))) * 1000))::int;
  propia := p.origen is not null and p.origen = auth.uid();
  if now() <= abierta.expira and opcion_id = p.correcta then
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
    rapido := round(5 * (1 - least(1, ms::numeric / (p.segundos * 1000))))::int;
    total := 10 + rapido + extra;
  end if;
  insert into public.quiz_intentos (usuario, pregunta, opcion, acierto, puntos, ms, dispositivo, ip)
  values (auth.uid(), pregunta_id, opcion_id, acierto, total, ms, coalesce((select dispositivo from public.perfiles where id = auth.uid()), ''), public.ip_peticion())
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
  values (auth.uid(), p_origen, p_texto, p_explica, coalesce(p_segundos, 45), public.periodo_madrid(now()))
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
  nuevo := public.publicar_pregunta(s.texto, s.explica, textos, s.correcta, 45, s.autor);
  update public.quiz_sugerencias set estado = 'aprobada' where id = sugerencia_id;
  return nuevo;
end;
$$;

revoke all on function public.aprobar_sugerencia(uuid, boolean) from public;
grant execute on function public.aprobar_sugerencia(uuid, boolean) to authenticated;

-- Cuando entres la primera vez, copia tu uuid en Authentication → Users y ejecuta:
-- update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';
-- Un visitante no puede hacerse admin: no tiene permiso para cambiar es_admin.
