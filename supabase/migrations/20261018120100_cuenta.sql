-- Granja Rentable. Ejecutar en el SQL Editor, en este orden. No lleva claves.
-- 1) 20261018120000_reto.sql
-- 2) 20261018120100_cuenta.sql
-- RLS queda activo en cada tabla. No se ha ejecutado desde el repositorio.

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

-- Quien se registró antes del trigger alta_perfil no tiene fila.
-- El apodo sale solo de metadata.nombre. Si no hay, o lleva @ o un correo, «Vecino» y cuatro caracteres del id.
-- No se usa full_name ni name: Google rellena esos campos con el nombre real.
-- Solo se inserta si falta la fila: un CHECK se evalúa antes del ON CONFLICT,
-- y al repetir este archivo un apodo ya corregido no debe volver a proponerse.
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
