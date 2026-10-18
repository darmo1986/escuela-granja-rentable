-- Preguntas de la comunidad de Granja Rentable.
-- Ejecutar una vez en el editor SQL de Supabase (rol postgres).
-- No crea usuarios ni pone claves. El admin se marca a mano, al final.
-- La demo del sitio no usa este archivo: vive en el navegador.

create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 40),
  es_admin boolean not null default false,
  creado timestamptz not null default now()
);

create table if not exists public.preguntas (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references public.perfiles (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 8 and 140),
  cuerpo text not null check (char_length(cuerpo) between 8 and 4000),
  oculto boolean not null default false,
  creado timestamptz not null default now()
);

create table if not exists public.respuestas (
  id uuid primary key default gen_random_uuid(),
  pregunta uuid not null references public.preguntas (id) on delete cascade,
  autor uuid not null references public.perfiles (id) on delete cascade,
  cuerpo text not null check (char_length(cuerpo) between 8 and 4000),
  oculto boolean not null default false,
  creado timestamptz not null default now()
);

create table if not exists public.votos (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  tipo text not null check (tipo in ('pregunta', 'respuesta')),
  objetivo uuid not null,
  creado timestamptz not null default now(),
  unique (usuario, tipo, objetivo)
);

create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  tipo text not null check (tipo in ('pregunta', 'respuesta')),
  objetivo uuid not null,
  motivo text not null check (char_length(motivo) between 3 and 280),
  creado timestamptz not null default now()
);

create index if not exists preguntas_creado on public.preguntas (creado desc);
create index if not exists respuestas_pregunta on public.respuestas (pregunta, creado);
create index if not exists votos_objetivo on public.votos (tipo, objetivo);
create index if not exists reportes_objetivo on public.reportes (tipo, objetivo);

-- El correo vive en auth.users. Aquí solo está el nombre visible.
revoke all on public.perfiles from anon, authenticated;
grant select (id, nombre) on public.perfiles to anon, authenticated;
grant select (es_admin) on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;

grant select on public.preguntas, public.respuestas, public.votos to anon, authenticated;
grant insert on public.preguntas, public.respuestas, public.votos to authenticated;
grant update on public.preguntas, public.respuestas to authenticated;
grant delete on public.votos to authenticated;

grant select, insert on public.reportes to authenticated;

create or replace function public.normaliza(t text)
returns text
language sql
immutable
as $$
  select translate(lower(coalesce(t, '')), 'áéíóúüñàèìòùäëïö', 'aeiouunaeiouaeio');
$$;

-- Misma lista que FILTRO en js/preguntas.js. «puta» no casa dentro de «computadora».
create or replace function public.texto_prohibido(t text)
returns boolean
language plpgsql
stable
as $$
declare
  limpio text := public.normaliza(t);
  palabra text;
  lista text[] := array['viagra', 'casino', 'porno', 'criptomoneda', 'puta', 'mierda', 'cabron', 'maricon'];
begin
  foreach palabra in array lista loop
    if limpio ~ ('(^|[^a-z0-9])' || palabra || '([^a-z0-9]|$)') then
      return true;
    end if;
  end loop;
  if (select count(*) from regexp_matches(coalesce(t, ''), 'https?://', 'g')) > 2 then
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.revisar_texto()
returns trigger
language plpgsql
as $$
declare
  nuevo jsonb := to_jsonb(new);
  viejo jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  texto text;
begin
  if tg_op = 'UPDATE'
     and nuevo->>'titulo' is not distinct from viejo->>'titulo'
     and nuevo->>'cuerpo' is not distinct from viejo->>'cuerpo' then
    return new;
  end if;
  texto := coalesce(nuevo->>'titulo', '') || ' ' || coalesce(nuevo->>'cuerpo', '');
  if public.texto_prohibido(texto) then
    raise exception 'Ese texto no se puede publicar. Quita insultos, publicidad o los enlaces de más.';
  end if;
  return new;
end;
$$;

create or replace function public.frenar_ritmo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if tg_table_name = 'preguntas' then
    select count(*) into n from public.preguntas
      where autor = new.autor and creado > now() - interval '10 minutes';
    if n >= 3 then
      raise exception 'Demasiados envíos seguidos. Espera un poco.';
    end if;
  elsif tg_table_name = 'respuestas' then
    select count(*) into n from public.respuestas
      where autor = new.autor and creado > now() - interval '10 minutes';
    if n >= 8 then
      raise exception 'Demasiados envíos seguidos. Espera un poco.';
    end if;
  elsif tg_table_name = 'reportes' then
    select count(*) into n from public.reportes
      where usuario = new.usuario and creado > now() - interval '1 hour';
    if n >= 10 then
      raise exception 'Demasiados envíos seguidos. Espera un poco.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.voto_valido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'pregunta' and not exists (
    select 1 from public.preguntas where id = new.objetivo and oculto = false
  ) then
    raise exception 'No se puede votar esa pregunta.';
  end if;
  if new.tipo = 'respuesta' and not exists (
    select 1 from public.respuestas where id = new.objetivo and oculto = false
  ) then
    raise exception 'No se puede votar esa respuesta.';
  end if;
  if new.tipo = 'pregunta' and exists (
    select 1 from public.preguntas where id = new.objetivo and autor = new.usuario
  ) then
    raise exception 'No puedes votar lo que escribiste.';
  end if;
  if new.tipo = 'respuesta' and exists (
    select 1 from public.respuestas where id = new.objetivo and autor = new.usuario
  ) then
    raise exception 'No puedes votar lo que escribiste.';
  end if;
  return new;
end;
$$;

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

drop trigger if exists revisar_pregunta on public.preguntas;
create trigger revisar_pregunta
  before insert or update on public.preguntas
  for each row execute function public.revisar_texto();

drop trigger if exists revisar_respuesta on public.respuestas;
create trigger revisar_respuesta
  before insert or update on public.respuestas
  for each row execute function public.revisar_texto();

drop trigger if exists ritmo_pregunta on public.preguntas;
create trigger ritmo_pregunta
  before insert on public.preguntas
  for each row execute function public.frenar_ritmo();

drop trigger if exists ritmo_respuesta on public.respuestas;
create trigger ritmo_respuesta
  before insert on public.respuestas
  for each row execute function public.frenar_ritmo();

drop trigger if exists ritmo_reporte on public.reportes;
create trigger ritmo_reporte
  before insert on public.reportes
  for each row execute function public.frenar_ritmo();

drop trigger if exists validar_voto on public.votos;
create trigger validar_voto
  before insert on public.votos
  for each row execute function public.voto_valido();

drop trigger if exists alta_perfil on auth.users;
create trigger alta_perfil
  after insert on auth.users
  for each row execute function public.alta_perfil();

alter table public.perfiles enable row level security;
alter table public.preguntas enable row level security;
alter table public.respuestas enable row level security;
alter table public.votos enable row level security;
alter table public.reportes enable row level security;

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles
  for select to anon, authenticated
  using (true);

drop policy if exists perfiles_nombre on public.perfiles;
create policy perfiles_nombre on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists preguntas_leer on public.preguntas;
create policy preguntas_leer on public.preguntas
  for select to anon, authenticated
  using (
    oculto = false
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

drop policy if exists preguntas_crear on public.preguntas;
create policy preguntas_crear on public.preguntas
  for insert to authenticated
  with check (autor = auth.uid() and oculto = false);

drop policy if exists preguntas_moderar on public.preguntas;
create policy preguntas_moderar on public.preguntas
  for update to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin));

drop policy if exists respuestas_leer on public.respuestas;
create policy respuestas_leer on public.respuestas
  for select to anon, authenticated
  using (
    oculto = false
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

drop policy if exists respuestas_crear on public.respuestas;
create policy respuestas_crear on public.respuestas
  for insert to authenticated
  with check (autor = auth.uid() and oculto = false);

drop policy if exists respuestas_moderar on public.respuestas;
create policy respuestas_moderar on public.respuestas
  for update to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin));

drop policy if exists votos_leer on public.votos;
create policy votos_leer on public.votos
  for select to anon, authenticated
  using (true);

drop policy if exists votos_crear on public.votos;
create policy votos_crear on public.votos
  for insert to authenticated
  with check (usuario = auth.uid());

drop policy if exists votos_quitar on public.votos;
create policy votos_quitar on public.votos
  for delete to authenticated
  using (usuario = auth.uid());

drop policy if exists reportes_crear on public.reportes;
create policy reportes_crear on public.reportes
  for insert to authenticated
  with check (usuario = auth.uid());

drop policy if exists reportes_leer on public.reportes;
create policy reportes_leer on public.reportes
  for select to authenticated
  using (
    usuario = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

create or replace view public.ranking
with (security_invoker = true) as
select
  p.id,
  p.nombre,
  (select count(*) from public.respuestas r where r.autor = p.id and r.oculto = false) as respuestas,
  (select count(*) from public.votos v
     join public.respuestas r on r.id = v.objetivo and v.tipo = 'respuesta'
    where r.autor = p.id and r.oculto = false) as utiles
from public.perfiles p
where exists (
  select 1 from public.respuestas r where r.autor = p.id and r.oculto = false
);

grant select on public.ranking to anon, authenticated;

-- Cuando entres la primera vez, copia tu uuid en Authentication → Users y ejecuta:
-- update public.perfiles set es_admin = true where id = 'UUID-DE-PABLO';
-- Un visitante no puede hacerse admin: no tiene permiso para cambiar es_admin.
