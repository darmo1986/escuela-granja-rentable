-- Apodo público: solo perfiles.nombre.
-- No usa el nombre de Google (full_name ni name). Si no hay apodo, o lleva @, queda «Vecino» y cuatro caracteres.
-- El concurso guarda el suyo en concurso_partidas y solo rellena el campo desde aquí.

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

alter table public.perfiles drop constraint if exists perfiles_nombre_sin_arroba;
alter table public.perfiles
  add constraint perfiles_nombre_sin_arroba
  check (position('@' in nombre) = 0);

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
