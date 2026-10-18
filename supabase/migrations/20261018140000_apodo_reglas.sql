-- Reglas del apodo de la cuenta. El premio del concurso va en la migración siguiente.
-- Se ejecuta después de 20261018130000_apodo.sql.
-- No se ha corrido desde el repositorio: lo pega quien administra el proyecto.
-- El concurso debe usar public.apodo_ok. La raíz put se rechaza al principio, al final
-- o en medio si la rodean prefijos o sufijos de insulto, salvo una lista de nombres reales.

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
    'viagra', 'casino', 'porno', 'cripto',
    'joder', 'culo', 'culos', 'imbecil', 'imbeciles',
    'bitch', 'bitches',
    'hijodeputa', 'hijaputa', 'putamadre', 'hijueputa',
    'subnormal', 'subnormales', 'perra', 'perras', 'shit', 'carajo', 'carajos'
  ];
  permitidos text[] := array[
    'putumayo',
    'diputado', 'diputada', 'diputados', 'diputadas',
    'disputa', 'disputas', 'disputar',
    'disputado', 'disputada', 'disputados', 'disputadas',
    'computadora', 'computadoras', 'computador', 'computadores',
    'computo', 'computos', 'computacion',
    'reputacion', 'reputado', 'reputada', 'reputados', 'reputadas',
    'amputar', 'amputado', 'amputada', 'amputados', 'amputadas', 'amputacion',
    'disputo', 'reputo', 'imputo', 'computa', 'putri', 'putra', 'putnam', 'puttanesca'
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
  letras := lower(s);
  letras := normalize(letras, NFD);
  letras := regexp_replace(letras, U&'[\0300-\036F\1AB0-\1AFF\1DC0-\1DFF\20D0-\20FF\FE20-\FE2F]', '', 'g');
  letras := replace(letras, U&'\0131', 'i');
  letras := replace(letras, U&'\0142', 'l');
  letras := replace(letras, U&'\00F8', 'o');
  letras := replace(letras, U&'\0111', 'd');
  letras := replace(letras, U&'\00E6', 'ae');
  letras := replace(letras, U&'\0153', 'oe');
  letras := replace(letras, U&'\00DF', 'ss');
  letras := translate(letras, '013457v', 'oieastu');
  letras := replace(letras, U&'\028D', 'm');
  letras := regexp_replace(letras, U&'[\02B0-\02FF]', ' ', 'g');
  if exists (
    select 1
    from regexp_split_to_table(letras, '[^a-z]+') as palabra(w)
    where palabra.w <> ''
      and (
        palabra.w = any (malas)
        or (
          palabra.w <> all (permitidos)
          and (
            palabra.w like 'put%'
            or palabra.w like '%putas'
            or palabra.w like '%putos'
            or palabra.w like '%puta'
            or palabra.w like '%puto'
            or palabra.w ~ '^(la|el|lo|super|mega|ultra|requete|hijoe|hija|hijo|hije|re)put[ao](aza|azo|asa|aso|ona|on|za|zo|sa|so)$'
          )
        )
      )
  ) then
    return false;
  end if;
  junto := regexp_replace(letras, '[^a-z]+', '', 'g');
  if junto = any (malas)
     or (
       junto <> all (permitidos)
       and (
         junto like 'put%'
         or junto like '%putas'
         or junto like '%putos'
         or junto like '%puta'
         or junto like '%puto'
         or junto ~ '^(la|el|lo|super|mega|ultra|requete|hijoe|hija|hijo|hije|re)put[ao](aza|azo|asa|aso|ona|on|za|zo|sa|so)$'
       )
     ) then
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
