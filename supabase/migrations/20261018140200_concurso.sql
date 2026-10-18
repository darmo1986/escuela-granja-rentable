-- Concurso de 10 preguntas, sin cuenta y sin premios.
-- Pegar en el editor SQL de Supabase y ejecutar. No se ha corrido desde el repositorio.
-- No depende de otras migraciones. No crea perfiles, preguntas de un reto mensual ni premios.
-- Solo apodo y país opcional. Sin correo.
--
-- Puntos que acepta la tabla:
--   10 por acierto + hasta 5 por rapidez. Diez preguntas: máximo 150.

create or replace function public.concurso_apodo_ok(p text)
returns boolean
language plpgsql
immutable
as $$
declare
  n text;
  w text;
  banned text[] := array[
    'viagra', 'casino', 'porno', 'criptomoneda',
    'puta', 'puto', 'mierda', 'cabron', 'maricon',
    'pendejo', 'pendeja', 'nigger', 'nigga', 'hitler',
    'gilipollas', 'faggot', 'asshole'
  ];
begin
  if p is null then
    return false;
  end if;
  if position('@' in p) > 0 then
    return false;
  end if;
  if p ~ '[0-9]{8,}' then
    return false;
  end if;
  n := lower(translate(
    p,
    'áàäéèëíìïóòöúùüñÁÀÄÉÈËÍÌÏÓÒÖÚÙÜÑ',
    'aaaeeeiiiooouuunAAAEEEIIIOOOUUUN'
  ));
  foreach w in array banned loop
    if n ~ ('(^|[^a-z0-9])' || w || '([^a-z0-9]|$)') then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.concurso_apodo_ok(text) from public;
grant execute on function public.concurso_apodo_ok(text) to anon, authenticated;

create table if not exists public.concurso_partidas (
  id uuid primary key default gen_random_uuid(),
  apodo text not null,
  pais text,
  puntaje int not null,
  aciertos int not null,
  segundos int not null,
  creado timestamptz not null default now(),
  constraint concurso_partidas_apodo_len check (char_length(btrim(apodo)) between 2 and 20),
  constraint concurso_partidas_apodo_forma check (
    apodo ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]{0,18}[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]$'
  ),
  constraint concurso_partidas_apodo_ok check (public.concurso_apodo_ok(apodo)),
  constraint concurso_partidas_pais check (pais is null or pais ~ '^[A-Z]{2}$'),
  constraint concurso_partidas_aciertos check (aciertos between 0 and 10),
  constraint concurso_partidas_puntaje check (
    puntaje between 0 and 150
    and puntaje >= aciertos * 10
    and puntaje <= aciertos * 15
  ),
  constraint concurso_partidas_segundos check (segundos between 0 and 300)
);

comment on table public.concurso_partidas is
  'Ranking del concurso de 10 preguntas. Solo apodo escrito por quien juega y país opcional.';

create index if not exists concurso_partidas_ranking
  on public.concurso_partidas (puntaje desc, segundos asc, creado asc);

alter table public.concurso_partidas enable row level security;

drop policy if exists concurso_partidas_leer on public.concurso_partidas;
create policy concurso_partidas_leer on public.concurso_partidas
  for select to anon, authenticated
  using (true);

drop policy if exists concurso_partidas_insertar on public.concurso_partidas;
create policy concurso_partidas_insertar on public.concurso_partidas
  for insert to anon, authenticated
  with check (
    char_length(btrim(apodo)) between 2 and 20
    and public.concurso_apodo_ok(apodo)
    and puntaje between 0 and 150
    and aciertos between 0 and 10
    and segundos between 0 and 300
    and puntaje >= aciertos * 10
    and puntaje <= aciertos * 15
    and (pais is null or pais ~ '^[A-Z]{2}$')
  );

revoke all on table public.concurso_partidas from public, anon, authenticated;
grant select, insert on table public.concurso_partidas to anon, authenticated;

create or replace function public.concurso_partidas_antes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  new.apodo := regexp_replace(btrim(new.apodo), '\s+', ' ', 'g');
  if new.pais is not null then
    new.pais := nullif(upper(btrim(new.pais)), '');
  end if;
  if not public.concurso_apodo_ok(new.apodo) then
    raise exception 'apodo no permitido' using errcode = '23514';
  end if;
  select count(*) into n
  from public.concurso_partidas
  where lower(apodo) = lower(new.apodo)
    and creado > now() - interval '1 day';
  if n >= 8 then
    raise exception 'limite de envios' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.concurso_partidas_antes() from public, anon, authenticated;

drop trigger if exists concurso_partidas_antes on public.concurso_partidas;
create trigger concurso_partidas_antes
  before insert on public.concurso_partidas
  for each row execute function public.concurso_partidas_antes();
