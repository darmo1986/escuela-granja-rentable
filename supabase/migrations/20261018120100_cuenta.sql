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
insert into public.perfiles (id, nombre)
select u.id,
  left(
    case
      when char_length(btrim(coalesce(u.raw_user_meta_data->>'nombre', ''))) >= 2
        and position('@' in coalesce(u.raw_user_meta_data->>'nombre', '')) = 0
        then btrim(u.raw_user_meta_data->>'nombre')
      else 'Vecino ' || right(replace(u.id::text, '-', ''), 4)
    end
  , 40)
from auth.users u
on conflict (id) do nothing;
