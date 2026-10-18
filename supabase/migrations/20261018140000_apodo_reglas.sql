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
